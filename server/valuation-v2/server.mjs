import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { evaluateSubmission } from './owner-engine.mjs';
import { buildInternalCaseCandidates } from './internal-case-candidates.mjs';
import { parseInternalObservationPayload, sortInternalObservations, updateInternalObservationPayload } from './internal-observations.mjs';
import {
  appendInternalObservation,
  appendSubmission,
  deleteInternalObservation,
  readInternalObservations,
  readSubmissions,
  updateInternalObservation,
} from './storage.mjs';

const PORT = Number(process.env.VALUATION_V2_PORT || 8788);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = '';

    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large.'));
      }
    });

    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error('Invalid JSON payload.'));
      }
    });

    request.on('error', reject);
  });
}

function runInternalObservationIngest() {
  const result = spawnSync('node', ['scripts/valuation-engine/ingest-internal-observations.mjs'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || 'Internal observation ingest failed.');
  }

  return {
    message: result.stdout.trim() || 'Internal observations ingested successfully.',
  };
}

const server = http.createServer(async (request, response) => {
  const parsedUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const internalObservationMatch = pathname.match(/^\/api\/valuation-v2\/internal-observations\/([^/]+)$/);

  if (request.method === 'OPTIONS') {
    writeJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && pathname === '/health') {
    writeJson(response, 200, {
      status: 'ok',
      service: 'valuation-v2-local-backend',
      port: PORT,
    });
    return;
  }

  if (request.method === 'GET' && pathname === '/') {
    writeJson(response, 200, {
      status: 'ok',
      service: 'valuation-v2-local-backend',
      message: 'Backend is running. Open http://localhost:5173/valuation-v2.html in the frontend dev server.',
      endpoints: {
        health: 'GET /health',
        valuation: 'POST /api/valuation-v2',
        internalObservations: 'GET|POST /api/valuation-v2/internal-observations',
        ingestInternalObservations: 'POST /api/valuation-v2/internal-observations/ingest',
        internalCaseCandidates: 'GET /api/valuation-v2/internal-case-candidates',
      },
    });
    return;
  }

  if (request.method === 'GET' && pathname === '/api/valuation-v2') {
    writeJson(response, 405, {
      status: 'error',
      message: 'Use POST /api/valuation-v2 with a JSON body.',
    });
    return;
  }

  if (request.method === 'POST' && pathname === '/api/valuation-v2') {
    try {
      const payload = await readJson(request);
      const result = evaluateSubmission(payload);

      await appendSubmission({
        timestamp: new Date().toISOString(),
        payload,
        result,
      });

      writeJson(response, 200, {
        status: 'success',
        data: result,
      });
    } catch (error) {
      writeJson(response, 400, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unexpected valuation-v2 backend error.',
      });
    }
    return;
  }

  if (request.method === 'GET' && pathname === '/api/valuation-v2/internal-observations') {
    try {
      const observations = sortInternalObservations(await readInternalObservations());
      writeJson(response, 200, {
        status: 'success',
        data: observations,
      });
    } catch (error) {
      writeJson(response, 500, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to load internal observations.',
      });
    }
    return;
  }

  if (request.method === 'GET' && pathname === '/api/valuation-v2/internal-case-candidates') {
    try {
      const submissions = await readSubmissions();
      const candidates = buildInternalCaseCandidates(submissions);
      writeJson(response, 200, {
        status: 'success',
        data: candidates,
      });
    } catch (error) {
      writeJson(response, 500, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to build internal case candidates.',
      });
    }
    return;
  }

  if (request.method === 'POST' && pathname === '/api/valuation-v2/internal-observations') {
    try {
      const payload = await readJson(request);
      const entry = parseInternalObservationPayload(payload);

      await appendInternalObservation(entry);

      writeJson(response, 201, {
        status: 'success',
        data: entry,
      });
    } catch (error) {
      writeJson(response, 400, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to capture internal observation.',
      });
    }
    return;
  }

  if (request.method === 'PATCH' && internalObservationMatch) {
    try {
      const payload = await readJson(request);
      const entry = await updateInternalObservation(internalObservationMatch[1], (existingEntry) =>
        updateInternalObservationPayload(existingEntry, payload)
      );

      writeJson(response, 200, {
        status: 'success',
        data: entry,
      });
    } catch (error) {
      writeJson(response, 400, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update internal observation.',
      });
    }
    return;
  }

  if (request.method === 'DELETE' && internalObservationMatch) {
    try {
      const removed = await deleteInternalObservation(internalObservationMatch[1]);
      writeJson(response, 200, {
        status: 'success',
        data: removed,
      });
    } catch (error) {
      writeJson(response, 400, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete internal observation.',
      });
    }
    return;
  }

  if (request.method === 'POST' && pathname === '/api/valuation-v2/internal-observations/ingest') {
    try {
      const result = runInternalObservationIngest();
      writeJson(response, 200, {
        status: 'success',
        data: result,
      });
    } catch (error) {
      writeJson(response, 500, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to ingest internal observations.',
      });
    }
    return;
  }

  writeJson(response, 404, {
    status: 'error',
    message: 'Not found.',
  });
});

server.listen(PORT, () => {
  console.log(`valuation-v2 local backend listening on http://localhost:${PORT}`);
});
