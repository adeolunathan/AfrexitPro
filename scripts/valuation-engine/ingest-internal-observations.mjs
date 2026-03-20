import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getSupabaseAdminClient } from '../../server/valuation/supabase.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname, '..');
const POLICY_REGISTRY_PATH = path.join(ROOT, 'src/valuation-engine/policy-registry.json');
const BENCHMARK_DATA_PATH = path.join(ROOT, 'src/valuation-engine/benchmark-data.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
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

async function main() {
  const policyRegistry = readJson(POLICY_REGISTRY_PATH);
  const benchmarkData = readJson(BENCHMARK_DATA_PATH);
  const supabase = getSupabaseAdminClient();
  const { data: internalEntries = [], error } = await supabase
    .from('internal_observations')
    .select('*')
    .eq('calibration_eligible', true)
    .eq('approval_status', 'approved');

  if (error) {
    throw new Error(error.message);
  }

  const groupedEntries = internalEntries.reduce((acc, entry) => {
    const policyGroupId = entry.policy_group_id;
    if (!acc[policyGroupId]) {
      acc[policyGroupId] = [];
    }

    acc[policyGroupId].push({
      id: entry.id,
      caseId: entry.case_id,
      companyAlias: entry.company_alias,
      caseType: entry.case_type,
      caseStage: entry.case_stage,
      transactionContext: entry.transaction_context,
      policyGroupId,
      level1: entry.level1,
      level2: entry.level2,
      primaryState: entry.primary_state,
      metric: entry.metric,
      basis: entry.basis,
      value: entry.value,
      sourceKind: entry.source_kind,
      sizeBand: entry.size_band,
      quality: entry.quality,
      observedAt: entry.observed_at,
      sourceName: entry.source_name,
      sourceUrl: entry.source_url,
      sourceDate: entry.source_date,
      notes: entry.notes,
      calibrationEligible: entry.calibration_eligible,
      enteredBy: entry.entered_by,
      sourceSubmissionId: entry.source_submission_id,
      sourceSubmissionTimestamp: entry.source_submission_timestamp,
      approvalStatus: entry.approval_status,
      approvalNotes: entry.approval_notes,
      approvedBy: entry.approved_by,
      approvedAt: entry.approved_at,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    });
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
