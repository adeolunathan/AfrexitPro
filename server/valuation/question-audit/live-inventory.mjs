import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(THIS_DIR, '../../..');

const INVENTORY_SOURCE_FILES = [
  path.join(REPO_ROOT, 'src/data/adaptive-question-bank.ts'),
  path.join(REPO_ROOT, 'src/data/branch-modules.ts'),
];

const OWNER_BINDINGS_SOURCE = path.join(REPO_ROOT, 'src/valuation-engine/owner-intake.ts');

const NON_QUESTION_IDS = new Set([
  'anchor',
  'branch',
  'closing',
  'product_retail',
  'professional_services',
  'manufacturing',
]);

function extractObjectBlock(source, startIndex) {
  let index = startIndex;
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (; index < source.length; index += 1) {
    const char = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (inSingleQuote || inDoubleQuote) {
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return '';
}

function parseQuestionBlocks(source) {
  const questions = [];

  for (const match of source.matchAll(/id:\s*'([^']+)'/g)) {
    const id = match[1];
    if (NON_QUESTION_IDS.has(id)) {
      continue;
    }

    const objectStart = source.lastIndexOf('{', match.index);
    if (objectStart === -1) {
      continue;
    }

    const block = extractObjectBlock(source, objectStart);
    const type = block.match(/type:\s*'([^']+)'/)?.[1] || 'unknown';
    const promptMatch = block.match(/prompt:\s*'((?:\\'|[^'])+)'/);
    const prompt = (promptMatch?.[1] || id).replaceAll("\\'", "'");
    const optionValues = [...block.matchAll(/value:\s*'([^']+)'/g)].map((entry) => entry[1]);

    questions.push({
      id,
      type,
      prompt,
      optionValues,
      hasOptions: optionValues.length > 0,
    });
  }

  return questions;
}

export function collectLiveQuestionIds() {
  const ids = new Set();

  for (const sourceFile of INVENTORY_SOURCE_FILES) {
    const source = fs.readFileSync(sourceFile, 'utf8');
    for (const match of source.matchAll(/id:\s*'([^']+)'/g)) {
      const id = match[1];
      if (!NON_QUESTION_IDS.has(id)) {
        ids.add(id);
      }
    }
  }

  return Array.from(ids).sort();
}

export function collectLiveQuestionDefinitions() {
  const byId = new Map();

  for (const sourceFile of INVENTORY_SOURCE_FILES) {
    const source = fs.readFileSync(sourceFile, 'utf8');
    for (const question of parseQuestionBlocks(source)) {
      if (!byId.has(question.id)) {
        byId.set(question.id, question);
      }
    }
  }

  return Array.from(byId.values()).sort((left, right) => left.id.localeCompare(right.id));
}

export function collectOwnerFieldBindings() {
  const source = fs.readFileSync(OWNER_BINDINGS_SOURCE, 'utf8');
  const bindings = {};

  for (const match of source.matchAll(
    /(\w+):\s*\{\s*canonicalPath:\s*'([^']+)',\s*valueType:\s*'(string|number|boolean)'\s*\}/g
  )) {
    bindings[match[1]] = {
      canonicalPath: match[2],
      valueType: match[3],
    };
  }

  return bindings;
}
