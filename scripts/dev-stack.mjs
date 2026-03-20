import { spawn } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const envFile = '.env.local';
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
let shuttingDown = false;
let exitCode = 0;

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

process.once('SIGINT', () => {
  shutdown('Stopping dev stack...', 0);
});

process.once('SIGTERM', () => {
  shutdown('Stopping dev stack...', 0);
});

const envContents = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
const hasSupabaseFrontendEnv = /VITE_SUPABASE_URL=/.test(envContents) && /VITE_SUPABASE_ANON_KEY=/.test(envContents);
const hasSupabaseBackendEnv = /SUPABASE_SERVICE_ROLE_KEY=/.test(envContents) && (/SUPABASE_URL=/.test(envContents) || /VITE_SUPABASE_URL=/.test(envContents));

process.stdout.write('Starting AfrexitPro dev stack...\n');
process.stdout.write('Public App: http://localhost:5173\n');
process.stdout.write('Admin Lab:  http://localhost:5173/admin-lab.html\n');
process.stdout.write('Backend:    http://localhost:8788\n');
if (!hasSupabaseFrontendEnv || !hasSupabaseBackendEnv) {
  process.stdout.write('Warning: Supabase env vars are missing in .env.local. Public submission persistence and admin auth will not work until they are added.\n');
}

for (const service of services) {
  const child = spawn(service.command, service.args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
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
