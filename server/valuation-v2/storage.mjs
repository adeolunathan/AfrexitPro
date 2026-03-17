import { mkdir, appendFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const submissionsPath = path.join(dataDir, 'submissions.ndjson');
const internalObservationsPath = path.join(dataDir, 'internal-observations.ndjson');

export async function appendSubmission(entry) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(submissionsPath, `${JSON.stringify(entry)}\n`, 'utf8');
}

async function readNdjson(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeNdjson(filePath, entries) {
  await mkdir(dataDir, { recursive: true });
  const body = entries.map((entry) => JSON.stringify(entry)).join('\n');
  await writeFile(filePath, body ? `${body}\n` : '', 'utf8');
}

export async function appendInternalObservation(entry) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(internalObservationsPath, `${JSON.stringify(entry)}\n`, 'utf8');
}

export async function readSubmissions() {
  return readNdjson(submissionsPath);
}

export async function readInternalObservations() {
  return readNdjson(internalObservationsPath);
}

export async function replaceInternalObservations(entries) {
  await writeNdjson(internalObservationsPath, entries);
}

export async function updateInternalObservation(id, updater) {
  const entries = await readInternalObservations();
  const index = entries.findIndex((entry) => entry.id === id);

  if (index < 0) {
    throw new Error(`Unknown internal observation: ${id}`);
  }

  const nextEntry = updater(entries[index]);
  entries[index] = nextEntry;
  await replaceInternalObservations(entries);
  return nextEntry;
}

export async function deleteInternalObservation(id) {
  const entries = await readInternalObservations();
  const index = entries.findIndex((entry) => entry.id === id);

  if (index < 0) {
    throw new Error(`Unknown internal observation: ${id}`);
  }

  const [removed] = entries.splice(index, 1);
  await replaceInternalObservations(entries);
  return removed;
}
