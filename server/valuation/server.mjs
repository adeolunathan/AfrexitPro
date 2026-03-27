import http from 'node:http';
import { evaluateSubmission } from './owner-engine.mjs';
import { isCanonicalRequest } from './modules/request-validation.mjs';
import { parseInternalObservationPayload, updateInternalObservationPayload } from './internal-observations.mjs';
import { calculatePartialValuation } from './partial-valuation.mjs';
import { listAuditBaselines } from './question-audit/fixtures.mjs';
import { runFullQuestionAudit, runQuestionAudit } from './question-audit/runner.mjs';
import { getSupabaseMode, isAdminDevBypassEnabled, isSupabaseConfigured, requireAdminSession } from './supabase.mjs';
import {
  createInternalObservation,
  createScenario,
  createSubmission,
  deleteInternalObservation,
  getSubmissionById,
  listInternalObservations,
  listScenarios,
  listSubmissions,
  updateInternalObservation,
  updateScenario,
} from './storage.mjs';

const PORT = Number(process.env.VALUATION_PORT || 8788);

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      } catch (_error) {
        reject(new Error('Invalid JSON payload.'));
      }
    });

    request.on('error', reject);
  });
}

function getByPath(target, path) {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce((current, segment) => current?.[segment], target);
}

function resolveAdminMetricPath(metricPath) {
  if (metricPath === 'summary.adjustedValue') return 'audit.calculationLedger.bridge.achievableEquityMid';
  if (metricPath === 'summary.lowEstimate') return 'audit.calculationLedger.bridge.achievableEquityLow';
  if (metricPath === 'summary.highEstimate') return 'audit.calculationLedger.bridge.achievableEquityHigh';
  if (metricPath === 'summary.readinessScore') return 'audit.calculationLedger.readiness.overallScore';
  if (metricPath === 'summary.confidenceScore') return 'audit.calculationLedger.confidence.overallAfterClamp';
  return metricPath;
}

function formatAdminRunSummary(result) {
  const qualitativeAdjustments =
    result.valueConclusion?.reconciliation?.qualitativeAdjustments || result.audit?.qualitativeAdjustments || {};
  const preciseAdjustedValue = result.audit?.calculationLedger?.bridge?.achievableEquityMid ?? result.summary.adjustedValue;
  const preciseLowEstimate = result.audit?.calculationLedger?.bridge?.achievableEquityLow ?? result.summary.lowEstimate;
  const preciseHighEstimate = result.audit?.calculationLedger?.bridge?.achievableEquityHigh ?? result.summary.highEstimate;

  return {
    adjustedValue: result.summary.adjustedValue,
    lowEstimate: result.summary.lowEstimate,
    highEstimate: result.summary.highEstimate,
    preciseAdjustedValue,
    preciseLowEstimate,
    preciseHighEstimate,
    readinessScore: result.summary.readinessScore,
    confidenceScore: result.summary.confidenceScore,
    primaryMethod: result.selectedMethods.primaryMethod,
    secondaryMethods: result.selectedMethods.secondaryMethods || [],
    scorecard: result.summary.scorecard,
    branchQualityFactor: qualitativeAdjustments.branchQualityFactor ?? 1,
    geographyAdjustmentFactor: qualitativeAdjustments.geographyAdjustmentFactor ?? 1,
    level1AdjustmentFactor: qualitativeAdjustments.level1AdjustmentFactor ?? 1,
    transactionContextFactor: qualitativeAdjustments.transactionContextFactor ?? 1,
    achievableUrgencyFactor: qualitativeAdjustments.achievableUrgencyFactor ?? 1,
    marketPositionAdjustmentFactor: qualitativeAdjustments.marketPositionAdjustmentFactor ?? 1,
    fxExposureAdjustmentFactor: qualitativeAdjustments.fxExposureAdjustmentFactor ?? 1,
    traceabilityAdjustmentFactor: qualitativeAdjustments.traceabilityAdjustmentFactor ?? 1,
  };
}

function buildSensitivityRow(label, result, metricPath) {
  const resolvedMetricPath = metricPath ? resolveAdminMetricPath(metricPath) : null;
  return {
    label,
    metricValue: resolvedMetricPath ? getByPath(result, resolvedMetricPath) : result.audit?.calculationLedger?.bridge?.achievableEquityMid ?? result.summary.adjustedValue,
    summary: formatAdminRunSummary(result),
    result,
  };
}

function unwrapPublicSubmissionPayload(payload) {
  if (isCanonicalRequest(payload)) {
    return {
      source: 'public_questionnaire',
      answersSnapshot: null,
      requestSnapshot: payload,
    };
  }

  if (payload && typeof payload === 'object' && isCanonicalRequest(payload.request)) {
    return {
      source: String(payload.source || 'public_questionnaire'),
      answersSnapshot: payload.answers || payload.answersSnapshot || null,
      requestSnapshot: payload.request,
    };
  }

  throw new Error('Expected a canonical valuation request or an object with { request, answers? }.');
}

async function requireAdmin(request, response) {
  try {
    return await requireAdminSession(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin authentication failed.';
    const statusCode = message.includes('allowlisted') ? 403 : 401;
    writeJson(response, statusCode, {
      status: 'error',
      message,
    });
    return null;
  }
}

const server = http.createServer(async (request, response) => {
  const parsedUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const adminSubmissionMatch = pathname.match(/^\/api\/admin\/submissions\/([^/]+)$/);
  const adminScenarioMatch = pathname.match(/^\/api\/admin\/scenarios\/([^/]+)$/);
  const adminScenarioRunMatch = pathname.match(/^\/api\/admin\/scenarios\/([^/]+)\/run$/);
  const adminQuestionAuditMatch = pathname.match(/^\/api\/admin\/question-audit\/([^/]+)$/);
  const adminObservationMatch = pathname.match(/^\/api\/admin\/internal-observations\/([^/]+)$/);

  if (request.method === 'OPTIONS') {
    writeJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && pathname === '/health') {
    writeJson(response, 200, {
      status: 'ok',
      service: 'valuation-backend',
      port: PORT,
      supabaseConfigured: isSupabaseConfigured(),
      supabaseMode: getSupabaseMode(),
      adminDevBypassEnabled: isAdminDevBypassEnabled(),
    });
    return;
  }

  if (request.method === 'GET' && pathname === '/') {
    writeJson(response, 200, {
      status: 'ok',
      service: 'valuation-backend',
      message: 'Backend is running.',
      supabaseConfigured: isSupabaseConfigured(),
      supabaseMode: getSupabaseMode(),
      adminDevBypassEnabled: isAdminDevBypassEnabled(),
      endpoints: {
        health: 'GET /health',
        valuation: 'POST /api/valuation',
        partialValuation: 'POST /api/valuation/partial',
        adminRun: 'POST /api/admin/run',
        adminSubmissions: 'GET /api/admin/submissions',
        adminScenarios: 'GET|POST|PATCH /api/admin/scenarios',
        adminSensitivity: 'POST /api/admin/sensitivity',
        adminQuestionAudit: 'GET /api/admin/question-audit',
        adminInternalObservations: 'GET|POST|PATCH|DELETE /api/admin/internal-observations',
      },
    });
    return;
  }

  if (request.method === 'POST' && pathname === '/api/valuation/partial') {
    try {
      const payload = await readJson(request);
      const result = calculatePartialValuation(payload);
      writeJson(response, 200, {
        status: 'success',
        data: result,
      });
    } catch (error) {
      writeJson(response, 400, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unexpected partial valuation error.',
      });
    }
    return;
  }

  if (request.method === 'POST' && pathname === '/api/valuation') {
    try {
      const payload = await readJson(request);
      const { source, answersSnapshot, requestSnapshot } = unwrapPublicSubmissionPayload(payload);
      const result = evaluateSubmission(requestSnapshot);

      const submission = await createSubmission({
        source,
        answersSnapshot,
        requestSnapshot,
        resultSnapshot: result,
      });

      writeJson(response, 200, {
        status: 'success',
        data: result,
        meta: {
          submissionId: submission.id,
        },
      });
    } catch (error) {
      writeJson(response, 400, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unexpected valuation backend error.',
      });
    }
    return;
  }

  if (pathname.startsWith('/api/admin/')) {
    const session = await requireAdmin(request, response);
    if (!session) {
      return;
    }

    if (request.method === 'GET' && pathname === '/api/admin/submissions') {
      try {
        const submissions = await listSubmissions();
        writeJson(response, 200, {
          status: 'success',
          data: submissions,
        });
      } catch (error) {
        writeJson(response, 500, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load submissions.',
        });
      }
      return;
    }

    if (request.method === 'GET' && adminSubmissionMatch) {
      try {
        const submission = await getSubmissionById(adminSubmissionMatch[1]);
        writeJson(response, 200, {
          status: 'success',
          data: submission,
        });
      } catch (error) {
        writeJson(response, 404, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Submission not found.',
        });
      }
      return;
    }

    if (request.method === 'GET' && pathname === '/api/admin/scenarios') {
      try {
        const scenarios = await listScenarios();
        writeJson(response, 200, {
          status: 'success',
          data: scenarios,
        });
      } catch (error) {
        writeJson(response, 500, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load scenarios.',
        });
      }
      return;
    }

    if (request.method === 'POST' && pathname === '/api/admin/scenarios') {
      try {
        const payload = await readJson(request);
        const requestSnapshot = payload.requestSnapshot;
        if (requestSnapshot && !isCanonicalRequest(requestSnapshot)) {
          throw new Error('Scenario requestSnapshot must be a canonical valuation request.');
        }

        const resultSnapshot = payload.resultSnapshot || (requestSnapshot ? evaluateSubmission(requestSnapshot) : null);
        const scenario = await createScenario({
          title: payload.title,
          description: payload.description,
          sourceType: payload.sourceType || 'manual',
          sourceSubmissionId: payload.sourceSubmissionId,
          tags: payload.tags,
          notes: payload.notes,
          answersSnapshot: payload.answersSnapshot || null,
          requestSnapshot: requestSnapshot || null,
          resultSnapshot,
        });

        writeJson(response, 201, {
          status: 'success',
          data: scenario,
        });
      } catch (error) {
        writeJson(response, 400, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to create scenario.',
        });
      }
      return;
    }

    if (request.method === 'PATCH' && adminScenarioMatch) {
      try {
        const payload = await readJson(request);
        const requestSnapshot = payload.requestSnapshot;
        if (requestSnapshot && !isCanonicalRequest(requestSnapshot)) {
          throw new Error('Scenario requestSnapshot must be a canonical valuation request.');
        }

        const resultSnapshot = payload.resultSnapshot || (requestSnapshot ? evaluateSubmission(requestSnapshot) : undefined);
        const scenario = await updateScenario(adminScenarioMatch[1], {
          ...payload,
          resultSnapshot,
        });

        writeJson(response, 200, {
          status: 'success',
          data: scenario,
        });
      } catch (error) {
        writeJson(response, 400, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to update scenario.',
        });
      }
      return;
    }

    if (request.method === 'POST' && adminScenarioRunMatch) {
      try {
        const payload = await readJson(request);
        const scenarios = await listScenarios();
        const scenario = scenarios.find((entry) => entry.id === adminScenarioRunMatch[1]);
        if (!scenario) {
          throw new Error('Scenario not found.');
        }

        const requestSnapshot = payload.requestSnapshot || scenario.requestSnapshot;
        if (!isCanonicalRequest(requestSnapshot)) {
          throw new Error('Scenario does not contain a runnable canonical request.');
        }

        const result = evaluateSubmission(requestSnapshot);
        writeJson(response, 200, {
          status: 'success',
          data: {
            result,
            summary: formatAdminRunSummary(result),
          },
        });
      } catch (error) {
        writeJson(response, 400, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to run scenario.',
        });
      }
      return;
    }

    if (request.method === 'POST' && pathname === '/api/admin/run') {
      try {
        const payload = await readJson(request);
        if (!isCanonicalRequest(payload.requestSnapshot)) {
          throw new Error('Admin run requires a canonical requestSnapshot.');
        }

        const result = evaluateSubmission(payload.requestSnapshot);
        writeJson(response, 200, {
          status: 'success',
          data: {
            result,
            summary: formatAdminRunSummary(result),
          },
        });
      } catch (error) {
        writeJson(response, 400, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to run valuation.',
        });
      }
      return;
    }

    if (request.method === 'POST' && pathname === '/api/admin/sensitivity') {
      try {
        const payload = await readJson(request);
        const runs = Array.isArray(payload.runs) ? payload.runs : [];
        if (!runs.length) {
          throw new Error('Sensitivity analysis requires at least one run.');
        }

        const metricPath = String(payload.metricPath || 'summary.adjustedValue');
        const rows = runs.map((run, index) => {
          if (!isCanonicalRequest(run.request)) {
            throw new Error(`Run ${index + 1} does not include a canonical request.`);
          }

          const result = evaluateSubmission(run.request);
          return buildSensitivityRow(run.label || `Run ${index + 1}`, result, metricPath);
        });

        writeJson(response, 200, {
          status: 'success',
          data: {
            metricPath,
            rows,
          },
        });
      } catch (error) {
        writeJson(response, 400, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to run sensitivity analysis.',
        });
      }
      return;
    }

    if (request.method === 'GET' && pathname === '/api/admin/question-audit') {
      try {
        const report = runFullQuestionAudit();
        const baselines = listAuditBaselines().map((baseline) => ({
          id: baseline.id,
          label: baseline.label,
          fixtureId: baseline.fixtureId,
        }));
        writeJson(response, 200, {
          status: 'success',
          data: {
            ...report,
            baselines,
          },
        });
      } catch (error) {
        writeJson(response, 500, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to generate question audit report.',
        });
      }
      return;
    }

    if (request.method === 'GET' && adminQuestionAuditMatch) {
      try {
        const baselineId = parsedUrl.searchParams.get('baselineId') || undefined;
        const result = runQuestionAudit(adminQuestionAuditMatch[1], baselineId);
        writeJson(response, 200, {
          status: 'success',
          data: result,
        });
      } catch (error) {
        writeJson(response, 400, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to run question audit.',
        });
      }
      return;
    }

    if (request.method === 'GET' && pathname === '/api/admin/internal-observations') {
      try {
        const observations = await listInternalObservations();
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

    if (request.method === 'POST' && pathname === '/api/admin/internal-observations') {
      try {
        const payload = await readJson(request);
        const entry = parseInternalObservationPayload(payload);
        const created = await createInternalObservation(entry);
        writeJson(response, 201, {
          status: 'success',
          data: created,
        });
      } catch (error) {
        writeJson(response, 400, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to create internal observation.',
        });
      }
      return;
    }

    if (request.method === 'PATCH' && adminObservationMatch) {
      try {
        const payload = await readJson(request);
        const observations = await listInternalObservations();
        const existing = observations.find((entry) => entry.id === adminObservationMatch[1]);
        if (!existing) {
          throw new Error('Observation not found.');
        }

        const nextEntry = updateInternalObservationPayload(existing, payload);
        const updated = await updateInternalObservation(adminObservationMatch[1], nextEntry);
        writeJson(response, 200, {
          status: 'success',
          data: updated,
        });
      } catch (error) {
        writeJson(response, 400, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to update internal observation.',
        });
      }
      return;
    }

    if (request.method === 'DELETE' && adminObservationMatch) {
      try {
        const removed = await deleteInternalObservation(adminObservationMatch[1]);
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
  }

  writeJson(response, 404, {
    status: 'error',
    message: 'Not found.',
  });
});

server.listen(PORT, () => {
  console.log(`valuation backend listening on http://localhost:${PORT}`);
});
