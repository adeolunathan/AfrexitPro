import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import process from 'node:process';
import { ensureLocalSupabaseRunning } from './local-supabase.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const envFile = '.env.local';
const cliArgs = new Set(process.argv.slice(2));
const withLocalSupabase = cliArgs.has('--with-supabase');
const services = [
  {
    name: 'backend',
    command: 'node',
    args: [`--env-file=${envFile}`, 'server/valuation/server.mjs'],
  },
  {
    name: 'frontend',
    command: npmCommand,
    args: ['run', 'dev:frontend'],
  },
];

const children = new Map();
const envContents = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
const envConfig = parseEnvLines(envContents);
const runtimeEnv = {
  ...process.env,
};

let shuttingDown = false;
let exitCode = 0;

function parseEnvLines(text) {
  const values = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function normalizeEnvValue(value) {
  return String(value || '').trim();
}

function isPlaceholderSupabaseValue(value) {
  const normalized = normalizeEnvValue(value).toLowerCase();
  return (
    !normalized ||
    normalized === 'your-anon-key' ||
    normalized === 'your-service-role-key' ||
    normalized.includes('your-project.supabase.co')
  );
}

function hasUsableSupabaseValue(value) {
  return Boolean(normalizeEnvValue(value)) && !isPlaceholderSupabaseValue(value);
}

function isLocalSupabaseUrl(value) {
  return /^https?:\/\/(?:127\.0\.0\.1|localhost):54321\/?$/i.test(normalizeEnvValue(value));
}

function hasHostedSupabaseEnv() {
  return [envConfig.SUPABASE_URL, envConfig.VITE_SUPABASE_URL].some(
    (value) => hasUsableSupabaseValue(value) && !isLocalSupabaseUrl(value)
  );
}

function isAdminDevBypassEnabled() {
  return /^true$/i.test(String(envConfig.ADMIN_DEV_BYPASS || '')) || /^true$/i.test(String(envConfig.VITE_ADMIN_DEV_BYPASS || ''));
}

function isFrontendAdminDevBypassEnabled() {
  return /^true$/i.test(String(envConfig.VITE_ADMIN_DEV_BYPASS || ''));
}

function hasSupabaseFrontendEnv() {
  return hasUsableSupabaseValue(envConfig.VITE_SUPABASE_URL) && hasUsableSupabaseValue(envConfig.VITE_SUPABASE_ANON_KEY);
}

function hasSupabaseBackendEnv() {
  return hasUsableSupabaseValue(envConfig.SUPABASE_SERVICE_ROLE_KEY) &&
    hasUsableSupabaseValue(envConfig.SUPABASE_URL || envConfig.VITE_SUPABASE_URL);
}

function writeLine(stream, serviceName, line) {
  stream.write(`[${serviceName}] ${line}\n`);
}

function pipeOutput(serviceName, readable, stream) {
  let buffer = '';
  readable.setEncoding('utf8');

  readable.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      writeLine(stream, serviceName, line);
    }
  });

  readable.on('end', () => {
    if (buffer) {
      writeLine(stream, serviceName, buffer);
    }
  });
}

function stopChildren() {
  for (const child of children.values()) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => {
    for (const child of children.values()) {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
    }
  }, 3000).unref();
}

function shutdown(message, nextExitCode = exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  exitCode = nextExitCode;

  if (message) {
    process.stdout.write(`${message}\n`);
  }

  stopChildren();

  if (children.size === 0) {
    process.exit(exitCode);
  }
}

function handleServiceFailure(serviceName, detail, nextExitCode = 1) {
  shutdown(`[${serviceName}] ${detail}. Stopping dev stack.`, nextExitCode);
}

function fetchWithTimeout(url, timeoutMs = 1500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal })
    .finally(() => {
      clearTimeout(timeout);
    });
}

function tryPortHost(port, host, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function isPortOpen(port, timeoutMs = 1000) {
  for (const host of ['127.0.0.1', '::1', 'localhost']) {
    if (await tryPortHost(port, host, timeoutMs)) {
      return true;
    }
  }
  return false;
}

async function shouldReuseBackend() {
  if (!(await isPortOpen(8788))) {
    return false;
  }

  let response;
  let payload;

  try {
    response = await fetchWithTimeout('http://localhost:8788/health');
    payload = await response.json();
  } catch {
    // fall through
  }

  if (response?.ok && payload?.service === 'valuation-backend') {
    if (withLocalSupabase && payload?.supabaseMode !== 'local') {
      throw new Error(
        'Backend is already running without local Supabase env. Stop the current backend and rerun `npm run dev:with-supabase`.'
      );
    }

    process.stdout.write('[backend] Reusing existing backend on http://localhost:8788\n');
    return true;
  }

  throw new Error('Port 8788 is already in use by another process. Stop it or change VALUATION_PORT before running `npm run dev`.');
}

async function shouldReuseFrontend() {
  if (withLocalSupabase && !isFrontendAdminDevBypassEnabled()) {
    if (!(await isPortOpen(5173))) {
      return false;
    }

    throw new Error(
      'Frontend is already running. Stop the current frontend and rerun `npm run dev:with-supabase` so local Supabase env can be injected.'
    );
  }

  if (!(await isPortOpen(5173))) {
    return false;
  }

  try {
    const [rootResponse, adminResponse] = await Promise.all([
      fetchWithTimeout('http://localhost:5173/'),
      fetchWithTimeout('http://localhost:5173/admin-lab.html'),
    ]);
    const rootType = rootResponse.headers.get('content-type') || '';
    const adminType = adminResponse.headers.get('content-type') || '';

    if (rootResponse.ok && adminResponse.ok && rootType.includes('text/html') && adminType.includes('text/html')) {
      process.stdout.write('[frontend] Reusing existing frontend on http://localhost:5173\n');
      return true;
    }
  } catch {
    // fall through
  }

  throw new Error('Port 5173 is already in use by another process. Stop it or free the port before running `npm run dev`.');
}

async function resolveServicesToStart() {
  const nextServices = [];

  for (const service of services) {
    if (service.name === 'backend') {
      if (await shouldReuseBackend()) {
        continue;
      }
    }

    if (service.name === 'frontend') {
      if (await shouldReuseFrontend()) {
        continue;
      }
    }

    nextServices.push(service);
  }

  return nextServices;
}

process.once('SIGINT', () => {
  shutdown('Stopping dev stack...', 0);
});

process.once('SIGTERM', () => {
  shutdown('Stopping dev stack...', 0);
});

if (!runtimeEnv.VITE_VALUATION_API_URL) {
  runtimeEnv.VITE_VALUATION_API_URL = 'http://localhost:8788/api/valuation';
}

process.stdout.write('Starting AfrexitPro dev stack...\n');
process.stdout.write('Public App: http://localhost:5173\n');
process.stdout.write('Admin Lab:  http://localhost:5173/admin-lab.html\n');
process.stdout.write('Backend:    http://localhost:8788\n');

try {
  if (withLocalSupabase) {
    if (hasHostedSupabaseEnv()) {
      process.stdout.write('Supabase Mode: overriding hosted Supabase env for this dev session with local Docker Supabase.\n');
    }

    const localSupabase = ensureLocalSupabaseRunning();
    Object.assign(runtimeEnv, localSupabase.runtimeEnv);
  } else if (isAdminDevBypassEnabled()) {
    process.stdout.write(
      'Admin Dev Bypass: enabled for localhost testing. Default dev mode does not start Supabase.\n'
    );
  } else {
    if (!hasSupabaseFrontendEnv() || !hasSupabaseBackendEnv()) {
      process.stdout.write(
        'Warning: Supabase env vars are missing or placeholders in .env.local. Public submission persistence and admin auth will not work until you add hosted credentials or run `npm run dev:with-supabase`.\n'
      );
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : 'Supabase failed to start.';
  process.stdout.write(`[supabase] ${message}\n`);
  process.exit(1);
}

const servicesToStart = await resolveServicesToStart();

if (servicesToStart.length === 0) {
  process.stdout.write('Dev stack is already running. Nothing new to start.\n');
  process.exit(0);
}

for (const service of servicesToStart) {
  const child = spawn(service.command, service.args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: runtimeEnv,
  });

  children.set(service.name, child);

  pipeOutput(service.name, child.stdout, process.stdout);
  pipeOutput(service.name, child.stderr, process.stderr);

  child.on('error', (error) => {
    handleServiceFailure(service.name, error.message, 1);
  });

  child.on('exit', (code, signal) => {
    children.delete(service.name);

    if (shuttingDown) {
      if (children.size === 0) {
        process.exit(exitCode);
      }
      return;
    }

    if (signal) {
      if (signal === 'SIGINT' || signal === 'SIGTERM') {
        shutdown('', 0);
        return;
      }

      handleServiceFailure(service.name, `exited with signal ${signal}`, 1);
      return;
    }

    if (code !== 0) {
      handleServiceFailure(service.name, `exited with code ${code}`, code ?? 1);
      return;
    }

    handleServiceFailure(service.name, 'exited unexpectedly', 1);
  });
}
