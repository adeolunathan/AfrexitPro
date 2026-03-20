import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const dockerCommand = process.platform === 'win32' ? 'docker.exe' : 'docker';
const supabaseCliPackage = 'supabase@2.83.0';
const supabaseProjectDir = 'supabase';
const supabaseConfigPath = path.join(supabaseProjectDir, 'config.toml');
const supabaseCliProject = path.basename(supabaseProjectDir);
const startTimeoutMs = 10 * 60 * 1000;
const dockerOperationTimeoutMs = 15_000;
const dbContainerName = 'supabase_db_supabase';

function parseEnvLines(text) {
  const values = {};

  for (const rawLine of String(text || '').split(/\r?\n/)) {
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

function runSupabaseCli(args, timeout = 10_000) {
  return spawnSync(npxCommand, ['--yes', supabaseCliPackage, ...args, '--workdir', supabaseProjectDir], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout,
  });
}

function runDockerCli(args, timeout = dockerOperationTimeoutMs) {
  return spawnSync(dockerCommand, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout,
  });
}

function requireSupabaseProject() {
  if (!fs.existsSync(supabaseConfigPath)) {
    throw new Error('Local Supabase is not configured in this repo. Missing supabase/config.toml.');
  }
}

function readSupabaseProjectId() {
  if (!fs.existsSync(supabaseConfigPath)) {
    return '';
  }

  const text = fs.readFileSync(supabaseConfigPath, 'utf8');
  const match = text.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
  return match?.[1]?.trim() || '';
}

function listDockerObjectNames(args) {
  const result = runDockerCli(args);
  if (result.status !== 0) {
    return [];
  }

  return String(result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readDatabaseContainerState() {
  const result = runDockerCli(['inspect', dbContainerName, '--format', '{{json .State}}']);
  if (result.status !== 0) {
    return null;
  }

  try {
    return JSON.parse(result.stdout || 'null');
  } catch {
    return null;
  }
}

function readDatabaseContainerLogs() {
  const result = runDockerCli(['logs', '--tail', '80', dbContainerName]);
  if (result.status !== 0) {
    return '';
  }

  return String(result.stdout || result.stderr || '').trim();
}

function collectDockerDiagnostics() {
  const state = readDatabaseContainerState();
  const logs = readDatabaseContainerLogs();

  if (!state) {
    return '';
  }

  const stateSummary = [
    `Local DB container state: status=${state.Status || 'unknown'}`,
    `restarting=${Boolean(state.Restarting)}`,
    `exitCode=${state.ExitCode ?? 'unknown'}`,
    `health=${state.Health?.Status || 'unknown'}`,
    state.Error ? `error=${state.Error}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const logSummary = logs ? `Recent DB logs:\n${logs}` : 'Recent DB logs: empty';

  return `${stateSummary}\n${logSummary}`;
}

function hasBrokenDockerState(output = '') {
  const compact = String(output || '').trim();
  const state = readDatabaseContainerState();

  if (
    compact.includes('supabase start is already running.') ||
    compact.includes('container is not ready: unhealthy') ||
    compact.includes('container is not running: exited') ||
    compact.includes('failed to inspect container health') ||
    compact.includes('network not found')
  ) {
    return true;
  }

  if (!state) {
    return false;
  }

  return (
    state.Restarting === true ||
    state.Status === 'restarting' ||
    state.Status === 'exited' ||
    state.Error?.includes('network') ||
    state.Health?.Status === 'unhealthy'
  );
}

function removeDockerObject(kind, name) {
  if (!name) {
    return;
  }

  if (kind === 'container') {
    runDockerCli(['update', '--restart=no', name]);
    runDockerCli(['rm', '-f', name]);
    return;
  }

  if (kind === 'volume') {
    runDockerCli(['volume', 'rm', '-f', name]);
    return;
  }

  if (kind === 'network') {
    runDockerCli(['network', 'rm', name]);
  }
}

function cleanupLocalSupabaseDockerState({ includeData = true, stream = process.stdout } = {}) {
  const projectId = readSupabaseProjectId();
  const containers = new Set([
    ...listDockerObjectNames(['ps', '-a', '--filter', `label=com.supabase.cli.project=${supabaseCliProject}`, '--format', '{{.Names}}']),
    ...listDockerObjectNames(['ps', '-a', '--format', '{{.Names}}']).filter((name) => name.startsWith('supabase_')),
  ]);
  const volumes = includeData
    ? new Set([
        ...listDockerObjectNames(['volume', 'ls', '--filter', `label=com.supabase.cli.project=${supabaseCliProject}`, '--format', '{{.Name}}']),
        ...listDockerObjectNames(['volume', 'ls', '--format', '{{.Name}}']).filter((name) => name.startsWith('supabase_')),
      ])
    : new Set();
  const networks = new Set(
    listDockerObjectNames(['network', 'ls', '--format', '{{.Name}}']).filter((name) =>
      [supabaseCliProject, projectId].filter(Boolean).some((suffix) => name === `supabase_network_${suffix}`)
    )
  );

  for (const name of containers) {
    removeDockerObject('container', name);
  }

  for (const name of networks) {
    removeDockerObject('network', name);
  }

  for (const name of volumes) {
    removeDockerObject('volume', name);
  }

  if (containers.size || networks.size || volumes.size) {
    stream.write(
      [
        'Local Supabase recovery: removed stale Docker objects.',
        containers.size ? `  containers: ${[...containers].join(', ')}` : '',
        networks.size ? `  networks: ${[...networks].join(', ')}` : '',
        volumes.size ? `  volumes: ${[...volumes].join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n') + '\n'
    );
  }
}

function tryStartLocalSupabase() {
  return runSupabaseCli(['start', '-o', 'env'], startTimeoutMs);
}

function extractRuntimeEnvFromStartResult(result) {
  const values = parseEnvLines(result.stdout || '');
  if (!values.API_URL || !values.ANON_KEY || !values.SERVICE_ROLE_KEY) {
    throw new Error('Supabase started, but the CLI did not return API_URL / ANON_KEY / SERVICE_ROLE_KEY.');
  }

  return {
    values,
    runtimeEnv: buildSupabaseRuntimeEnv(values),
  };
}

function formatSupabaseStartError(output, diagnostics = '') {
  const compact = String(output || '').trim();
  const dockerCorruptionHint =
    compact.includes('metadata.db: input/output error') ||
    compact.includes('commit failed: write /var/lib/desktop-containerd');

  if (dockerCorruptionHint) {
    return [
      compact,
      'Docker Desktop has a local container storage error. Restart Docker Desktop first.',
      'If that does not clear it, use Docker Desktop > Troubleshoot > Clean / Purge data or Reset to factory defaults, then rerun `npm run supabase:start`.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const brokenStateHint =
    compact.includes('container is not ready: unhealthy') ||
    compact.includes('container is not running: exited') ||
    compact.includes('supabase start is already running.');

  if (brokenStateHint) {
    return [
      compact,
      diagnostics,
      'Local Supabase Docker state is broken. The repo now attempts one automatic reset, but Docker Desktop may still need a restart if the DB container keeps exiting immediately.',
      'If Docker is still wedged, restart Docker Desktop and rerun `npm run dev:with-supabase`.',
      'For a clean local reset of Supabase Docker objects, run `npm run supabase:reset`.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (compact.includes('Cannot connect to the Docker daemon')) {
    return `${compact}\nDocker Desktop is installed but the daemon is not running. Start Docker Desktop, wait for it to become healthy, then rerun \`npm run supabase:start\`.`;
  }

  if (compact.includes('timed out waiting for Docker')) {
    return `${compact}\nIf this is the first local Supabase run, Docker may still be downloading images. Otherwise, restart Docker Desktop and rerun \`npm run supabase:start\`.`;
  }

  return compact || 'Unknown Supabase startup error.';
}

function buildSupabaseRuntimeEnv(values) {
  return {
    VITE_SUPABASE_URL: values.API_URL,
    SUPABASE_URL: values.API_URL,
    VITE_SUPABASE_ANON_KEY: values.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
  };
}

function writeSupabaseSummary(values, { alreadyRunning = false, stream = process.stdout } = {}) {
  const suffix = alreadyRunning ? ' (already running)' : '';
  stream.write(`Local Supabase API:    ${values.API_URL}${suffix}\n`);
  if (values.STUDIO_URL) {
    stream.write(`Local Supabase Studio: ${values.STUDIO_URL}\n`);
  }
  if (values.INBUCKET_URL) {
    stream.write(`Local Inbucket:        ${values.INBUCKET_URL}\n`);
  }
}

export function readRunningLocalSupabaseEnv() {
  requireSupabaseProject();

  const result = runSupabaseCli(['status', '-o', 'env']);
  if (result.status !== 0) {
    return null;
  }

  const values = parseEnvLines(result.stdout || '');
  if (!values.API_URL || !values.ANON_KEY || !values.SERVICE_ROLE_KEY) {
    return null;
  }

  return values;
}

export function ensureLocalSupabaseRunning({ stream = process.stdout } = {}) {
  requireSupabaseProject();

  const runningEnv = readRunningLocalSupabaseEnv();
  if (runningEnv) {
    writeSupabaseSummary(runningEnv, { alreadyRunning: true, stream });
    return {
      started: false,
      values: runningEnv,
      runtimeEnv: buildSupabaseRuntimeEnv(runningEnv),
    };
  }

  stream.write('Local Supabase: starting via Docker...\n');
  stream.write('Local Supabase first run may take several minutes while Docker pulls images.\n');

  let result = tryStartLocalSupabase();

  if (result.error?.code === 'ETIMEDOUT') {
    throw new Error(formatSupabaseStartError('timed out waiting for Docker while running `supabase start`.'));
  }

  if (result.status !== 0 || hasBrokenDockerState(`${result.stdout || ''}\n${result.stderr || ''}`)) {
    const firstAttemptOutput = `${result.stdout || ''}\n${result.stderr || ''}`;

    if (hasBrokenDockerState(firstAttemptOutput)) {
      stream.write(
        'Local Supabase recovery: detected unhealthy Docker state. Resetting local Supabase containers, networks, and data volume once before retrying.\n'
      );
      resetLocalSupabase({ stream, quiet: true });
      result = tryStartLocalSupabase();
    } else if (result.status !== 0) {
      throw new Error(formatSupabaseStartError(firstAttemptOutput, collectDockerDiagnostics()));
    }
  }

  if (result.error?.code === 'ETIMEDOUT') {
    throw new Error(formatSupabaseStartError('timed out waiting for Docker while running `supabase start`.'));
  }

  if (result.status !== 0 || hasBrokenDockerState(`${result.stdout || ''}\n${result.stderr || ''}`)) {
    throw new Error(
      formatSupabaseStartError(`${result.stdout || ''}\n${result.stderr || ''}`, collectDockerDiagnostics())
    );
  }

  const { values, runtimeEnv } = extractRuntimeEnvFromStartResult(result);
  writeSupabaseSummary(values, { stream });

  return {
    started: true,
    values,
    runtimeEnv,
  };
}

export function stopLocalSupabase({ stream = process.stdout } = {}) {
  requireSupabaseProject();

  const runningEnv = readRunningLocalSupabaseEnv();
  if (!runningEnv) {
    stream.write('Local Supabase is not running.\n');
    return false;
  }

  const result = runSupabaseCli(['stop']);
  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(details || 'Failed to stop local Supabase.');
  }

  cleanupLocalSupabaseDockerState({ includeData: false, stream });
  stream.write('Local Supabase stopped.\n');
  return true;
}

export function resetLocalSupabase({ stream = process.stdout, quiet = false } = {}) {
  requireSupabaseProject();

  if (!quiet) {
    stream.write('Resetting local Supabase Docker state...\n');
  }

  runSupabaseCli(['stop', '--no-backup'], 20_000);
  cleanupLocalSupabaseDockerState({ includeData: true, stream });

  if (!quiet) {
    stream.write('Local Supabase reset complete.\n');
  }
}

function printUsage() {
  process.stdout.write(
    [
      'Usage:',
      '  npm run supabase:start',
      '  npm run supabase:status',
      '  npm run supabase:stop',
      '  npm run supabase:reset',
    ].join('\n') + '\n'
  );
}

function main() {
  const command = process.argv[2] || 'help';

  try {
    if (command === 'start') {
      ensureLocalSupabaseRunning();
      return;
    }

    if (command === 'status') {
      const values = readRunningLocalSupabaseEnv();
      if (!values) {
        process.stdout.write('Local Supabase is not running.\n');
        return;
      }

      writeSupabaseSummary(values, { alreadyRunning: true });
      return;
    }

    if (command === 'stop') {
      stopLocalSupabase();
      return;
    }

    if (command === 'reset') {
      resetLocalSupabase();
      return;
    }

    printUsage();
    process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Local Supabase command failed.';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main();
}
