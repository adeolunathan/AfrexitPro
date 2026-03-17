import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname, '..');
const POLICY_REGISTRY_PATH = path.join(ROOT, 'src/valuation-engine/policy-registry.json');
const BENCHMARK_DATA_PATH = path.join(ROOT, 'src/valuation-engine/benchmark-data.json');
const INTERNAL_OBSERVATIONS_PATH = path.join(ROOT, 'server/valuation-v2/data/internal-observations.ndjson');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function buildInternalSetId(policyGroupId) {
  return `BMK_OWNER_NG_${policyGroupId.replace(/^PG_/, '')}_AFREXIT_INTERNAL`;
}

function unique(values) {
  return [...new Set(values)];
}

function maxDate(values) {
  return [...values].sort().at(-1);
}

function buildSourceMix(entries) {
  return unique(['afrexit_internal_observations', ...entries.map((entry) => entry.sourceKind)]);
}

function buildSourceReferences(entries) {
  return unique(entries.map((entry) => entry.caseId)).map((caseId) => {
    const matching = entries.find((entry) => entry.caseId === caseId);
    const aliasSuffix = matching.companyAlias ? ` • ${matching.companyAlias}` : '';
    return {
      id: `internal-case-${caseId}`,
      label: `${matching.sourceName} (${caseId})${aliasSuffix}`,
      sourceType: 'internal_case',
      lastVerifiedAt: matching.createdAt?.slice(0, 10) || matching.observedAt,
      publishedAt: matching.sourceDate,
      url: matching.sourceUrl,
    };
  });
}

function buildObservations(entries) {
  return entries.map((entry, index) => ({
    id: entry.id || `internal-${index + 1}`,
    metric: entry.metric,
    basis: entry.basis,
    value: Number(entry.value),
    sourceKind: entry.sourceKind,
    sizeBand: entry.sizeBand,
    observedAt: entry.observedAt,
    quality: entry.quality,
    sourceReferenceId: `internal-case-${entry.caseId}`,
    notes: [entry.notes, entry.caseType, entry.caseStage, entry.transactionContext].filter(Boolean).join(' • '),
  }));
}

function main() {
  const policyRegistry = readJson(POLICY_REGISTRY_PATH);
  const benchmarkData = readJson(BENCHMARK_DATA_PATH);
  const internalEntries = readNdjson(INTERNAL_OBSERVATIONS_PATH).filter(
    (entry) => entry.calibrationEligible && entry.approvalStatus === 'approved'
  );

  const groupedEntries = internalEntries.reduce((acc, entry) => {
    if (!acc[entry.policyGroupId]) {
      acc[entry.policyGroupId] = [];
    }

    acc[entry.policyGroupId].push(entry);
    return acc;
  }, {});
  const internalSetIds = new Set();

  for (const [policyGroupId, entries] of Object.entries(groupedEntries)) {
    if (!entries?.length) continue;

    const policyGroup = policyRegistry.policyGroups[policyGroupId];
    if (!policyGroup) {
      throw new Error(`Unknown policy group in internal observations: ${policyGroupId}`);
    }

    const setId = buildInternalSetId(policyGroupId);
    internalSetIds.add(setId);

    const nextSet = {
      id: setId,
      policyGroupId,
      label: `${policyGroup.label} Afrexit internal observation set`,
      mode: 'owner',
      geography: 'Nigeria',
      asOfDate: maxDate(entries.map((entry) => entry.observedAt)) || new Date().toISOString().slice(0, 10),
      sourceMix: buildSourceMix(entries),
      sourceNotes: [
        `Derived from ${entries.length} Afrexit mandate/review observations marked calibration-eligible and approved.`,
        'Internal observations are Nigeria-native and should gradually displace foreign proxy assumptions as coverage improves.',
      ],
      sourceReferences: buildSourceReferences(entries),
      observations: buildObservations(entries),
    };

    const existingIndex = benchmarkData.benchmarkSets.findIndex((set) => set.id === setId);
    if (existingIndex >= 0) {
      benchmarkData.benchmarkSets[existingIndex] = nextSet;
    } else {
      benchmarkData.benchmarkSets.push(nextSet);
    }
  }

  if (internalEntries.length === 0) {
    benchmarkData.benchmarkSets = benchmarkData.benchmarkSets.filter((set) => !set.id.endsWith('_AFREXIT_INTERNAL'));
  } else {
    benchmarkData.benchmarkSets = benchmarkData.benchmarkSets.filter(
      (set) => !set.id.endsWith('_AFREXIT_INTERNAL') || internalSetIds.has(set.id)
    );
  }

  writeJson(BENCHMARK_DATA_PATH, benchmarkData);

  const rebuildResult = spawnSync('node', ['scripts/valuation-engine/calibration-maintenance.mjs', 'rebuild'], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (rebuildResult.status !== 0) {
    throw new Error(rebuildResult.stderr?.trim() || rebuildResult.stdout?.trim() || 'Calibration rebuild failed after ingest.');
  }

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        ingestedObservationCount: internalEntries.length,
        updatedBenchmarkSets: [...internalSetIds],
        rebuild: rebuildResult.stdout.trim(),
      },
      null,
      2
    )
  );
}

main();
