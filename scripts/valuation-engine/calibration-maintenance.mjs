import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname, '..');
const POLICY_REGISTRY_PATH = path.join(ROOT, 'src/valuation-engine/policy-registry.json');
const BENCHMARK_DATA_PATH = path.join(ROOT, 'src/valuation-engine/benchmark-data.json');
const CALIBRATION_TABLE_PATH = path.join(ROOT, 'src/valuation-engine/calibration-table.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function percentile(values, percentileRank) {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentileRank;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function slugifyPolicyGroup(policyGroupId) {
  return policyGroupId.replace(/^PG_/, '').toLowerCase();
}

function buildSetId(policyGroupId, suffix = '2026Q1') {
  return `BMK_OWNER_NG_${policyGroupId.replace(/^PG_/, '')}_${suffix}`;
}

function inferSizeBand(policyGroupId) {
  if (policyGroupId.includes('SOFTWARE')) return 'sub_500m_revenue';
  if (policyGroupId.includes('PROFESSIONAL') || policyGroupId.includes('LOCAL_SERVICE') || policyGroupId.includes('CREATIVE')) {
    return 'sub_300m_revenue';
  }
  if (policyGroupId.includes('RETAIL') || policyGroupId.includes('HOSPITALITY')) return 'sub_400m_revenue';
  return 'sub_1bn_revenue';
}

function buildBootstrapObservationSet(policyGroupId, policyGroup, asOfDate) {
  const ownerPhase = policyGroup.ownerPhase || {};
  const observations = [];
  const sizeBand = inferSizeBand(policyGroupId);
  const prefix = slugifyPolicyGroup(policyGroupId);

  const marketRange = ownerPhase.marketMultipleRange;
  if (marketRange) {
    const values = [
      marketRange.low * 0.96,
      average([marketRange.low, marketRange.mid]),
      marketRange.mid,
      average([marketRange.mid, marketRange.high]),
      marketRange.high * 1.02,
    ].map((value) => round(value));

    values.forEach((value, index) => {
      observations.push({
        id: `${prefix}-mm-${index + 1}`,
        metric: 'market_multiple',
        basis: ownerPhase.marketMetric || 'revenue',
        value,
        sourceKind: index >= 3 ? 'public_comp' : 'curated_secondary',
        sizeBand,
        observedAt: asOfDate,
        quality: index === 2 ? 'medium' : 'low',
      });
    });
  }

  const capRange = ownerPhase.capitalizationRateRange;
  if (capRange) {
    const values = [
      capRange.low * 0.98,
      average([capRange.low, capRange.mid]),
      capRange.mid,
      average([capRange.mid, capRange.high]),
      capRange.high * 1.02,
    ].map((value) => round(value));

    values.forEach((value, index) => {
      observations.push({
        id: `${prefix}-cr-${index + 1}`,
        metric: 'capitalization_rate',
        basis: ownerPhase.capitalizedMetric || 'adjustedEbit',
        value,
        sourceKind: 'curated_secondary',
        sizeBand,
        observedAt: asOfDate,
        quality: index === 2 ? 'medium' : 'low',
      });
    });
  }

  if (typeof ownerPhase.workingCapitalTargetPct === 'number') {
    [0.88, 1, 1.12].forEach((multiplier, index) => {
      observations.push({
        id: `${prefix}-wc-${index + 1}`,
        metric: 'working_capital_pct',
        basis: 'revenue',
        value: round(ownerPhase.workingCapitalTargetPct * multiplier),
        sourceKind: 'curated_secondary',
        sizeBand,
        observedAt: asOfDate,
        quality: index === 1 ? 'medium' : 'low',
      });
    });
  }

  if (typeof ownerPhase.marketabilityFloor === 'number' || typeof ownerPhase.marketabilityCeiling === 'number') {
    const floor = ownerPhase.marketabilityFloor ?? 0.78;
    const ceiling = ownerPhase.marketabilityCeiling ?? 0.94;
    [floor, average([floor, ceiling]), ceiling].forEach((value, index) => {
      observations.push({
        id: `${prefix}-mf-${index + 1}`,
        metric: 'marketability_factor',
        basis: 'enterprise_value',
        value: round(value),
        sourceKind: 'private_observation',
        sizeBand,
        observedAt: asOfDate,
        quality: index === 1 ? 'medium' : 'low',
      });
    });
  }

  return {
    id: buildSetId(policyGroupId),
    policyGroupId,
    label: `${policyGroup.label} bootstrap owner-mode benchmark set`,
    mode: 'owner',
    geography: 'Nigeria',
    asOfDate,
    sourceMix: ['bootstrap_policy_seed'],
    observations,
  };
}

function inferMetricBasis(observations, fallbackMetric) {
  const supportedMetrics = new Set(['revenue', 'sde', 'adjustedEbitda', 'adjustedEbit']);
  const rankedBasis = observations
    .map((observation) => observation.basis)
    .filter((basis) => supportedMetrics.has(basis));

  return rankedBasis[0] || fallbackMetric;
}

function buildEvidenceScore(benchmarkSets, today) {
  const qualityWeight = { low: 0.55, medium: 0.75, high: 0.9 };
  const sourceKindWeight = { transaction: 1, private_observation: 0.9, public_comp: 0.68, curated_secondary: 0.5 };
  const observations = benchmarkSets.flatMap((set) => set.observations);
  if (!observations.length) return 35;

  const avgQuality = average(
    observations.map((observation) => {
      const quality = qualityWeight[observation.quality] || 0.55;
      const source = sourceKindWeight[observation.sourceKind] || 0.5;
      return quality * source;
    })
  );
  const countScore = clamp(observations.length * 2, 0, 24);
  const freshestAsOfDate = [...benchmarkSets.map((set) => set.asOfDate).filter(Boolean)].sort().at(-1) || today;
  const ageDays = Math.max(0, Math.round((Date.parse(today) - Date.parse(freshestAsOfDate)) / 86400000));
  const agePenalty = ageDays > 365 ? 12 : ageDays > 240 ? 7 : ageDays > 150 ? 3 : 0;

  return Math.round(clamp(avgQuality * 70 + countScore - agePenalty, 35, 90));
}

function deriveRanges(observations) {
  if (!observations.length) return undefined;
  const values = observations.map((observation) => observation.value);
  return {
    low: round(percentile(values, 0.15) ?? values[0]),
    mid: round(percentile(values, 0.5) ?? values[0]),
    high: round(percentile(values, 0.85) ?? values[values.length - 1]),
  };
}

function deriveCalibrationEntry(policyGroupId, policyGroup, benchmarkSets, existingEntry, today) {
  const allObservations = benchmarkSets.flatMap((set) => set.observations);
  const marketObservations = allObservations.filter((observation) => observation.metric === 'market_multiple');
  const capitalizationObservations = allObservations.filter((observation) => observation.metric === 'capitalization_rate');
  const workingCapitalObservations = allObservations.filter((observation) => observation.metric === 'working_capital_pct');
  const marketabilityObservations = allObservations.filter((observation) => observation.metric === 'marketability_factor');
  const ownerPhase = policyGroup.ownerPhase || {};

  const derivedMarketRange = deriveRanges(marketObservations);
  const derivedCapRange = deriveRanges(capitalizationObservations);
  const derivedWorkingCapitalTarget =
    workingCapitalObservations.length > 0
      ? round(percentile(workingCapitalObservations.map((observation) => observation.value), 0.5) ?? ownerPhase.workingCapitalTargetPct ?? 0, 4)
      : ownerPhase.workingCapitalTargetPct;
  const derivedMarketabilityFloor =
    marketabilityObservations.length > 0
      ? round(Math.min(...marketabilityObservations.map((observation) => observation.value)), 4)
      : ownerPhase.marketabilityFloor;
  const derivedMarketabilityCeiling =
    marketabilityObservations.length > 0
      ? round(Math.max(...marketabilityObservations.map((observation) => observation.value)), 4)
      : ownerPhase.marketabilityCeiling;

  const evidenceScore = buildEvidenceScore(benchmarkSets, today);
  const sourceMix = new Set(benchmarkSets.flatMap((set) => set.sourceMix));
  const bootstrapSeeded = sourceMix.has('bootstrap_policy_seed');
  const notePrefix = bootstrapSeeded
    ? 'Benchmark coverage is currently bootstrap-seeded from policy defaults and should be replaced with stronger market evidence over time.'
    : sourceMix.has('afrexit_internal_observations')
      ? 'Benchmark coverage includes Nigeria-native Afrexit internal observations alongside current external proxies.'
      : sourceMix.has('bizbuysell_transaction_proxy')
        ? 'Benchmark coverage is primarily anchored to sourceable small-business transaction proxy data plus curated owner-mode overlays.'
        : 'Benchmark coverage is derived from current recorded benchmark observations.';

  return {
    benchmarkSetIds: benchmarkSets.map((set) => set.id),
    evidenceScore,
    lastCalibrated: today,
    notes: [
      notePrefix,
      `Calibration rebuilt automatically for ${policyGroupId} from ${allObservations.length} observations.`,
    ],
    ownerPhase: {
      capitalizedMetric:
        inferMetricBasis(capitalizationObservations, existingEntry?.ownerPhase?.capitalizedMetric || ownerPhase.capitalizedMetric),
      capitalizationRateRange: derivedCapRange || existingEntry?.ownerPhase?.capitalizationRateRange || ownerPhase.capitalizationRateRange,
      marketMetric: inferMetricBasis(marketObservations, existingEntry?.ownerPhase?.marketMetric || ownerPhase.marketMetric),
      marketMultipleRange: derivedMarketRange || existingEntry?.ownerPhase?.marketMultipleRange || ownerPhase.marketMultipleRange,
      assetFloorRevenuePct: existingEntry?.ownerPhase?.assetFloorRevenuePct ?? ownerPhase.assetFloorRevenuePct,
      workingCapitalTargetPct: derivedWorkingCapitalTarget,
      marketabilityFloor: derivedMarketabilityFloor,
      marketabilityCeiling: derivedMarketabilityCeiling,
      dispersionPenaltyWeight: existingEntry?.ownerPhase?.dispersionPenaltyWeight ?? ownerPhase.dispersionPenaltyWeight,
      reconciliationWeights: existingEntry?.ownerPhase?.reconciliationWeights || ownerPhase.reconciliationWeights,
      dcfEnabled: existingEntry?.ownerPhase?.dcfEnabled ?? ownerPhase.dcfEnabled,
    },
  };
}

function parseArgs(argv) {
  const [command, ...rest] = argv.slice(2);
  const args = {};

  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (key?.startsWith('--')) {
      args[key.slice(2)] = value;
    }
  }

  return { command, args };
}

function ensureCoverage() {
  const policyRegistry = readJson(POLICY_REGISTRY_PATH);
  const benchmarkData = readJson(BENCHMARK_DATA_PATH);
  const calibrationTable = readJson(CALIBRATION_TABLE_PATH);
  const today = new Date().toISOString().slice(0, 10);
  const existingSetIds = new Set(benchmarkData.benchmarkSets.map((set) => set.id));

  for (const [policyGroupId, policyGroup] of Object.entries(policyRegistry.policyGroups)) {
    if (!calibrationTable.policyGroups[policyGroupId]) {
      const setId = buildSetId(policyGroupId);
      if (!existingSetIds.has(setId)) {
        benchmarkData.benchmarkSets.push(buildBootstrapObservationSet(policyGroupId, policyGroup, today));
        existingSetIds.add(setId);
      }
    }
  }

  writeJson(BENCHMARK_DATA_PATH, benchmarkData);
  rebuildCalibrationTables(policyRegistry, benchmarkData, calibrationTable, today);
}

function rebuildCalibrationTables(policyRegistry, benchmarkData, calibrationTable, today = new Date().toISOString().slice(0, 10)) {
  const nextCalibrationTable = { policyGroups: {} };

  for (const [policyGroupId, policyGroup] of Object.entries(policyRegistry.policyGroups)) {
    const benchmarkSets = benchmarkData.benchmarkSets.filter((set) => set.policyGroupId === policyGroupId);
    if (!benchmarkSets.length) {
      continue;
    }

    nextCalibrationTable.policyGroups[policyGroupId] = deriveCalibrationEntry(
      policyGroupId,
      policyGroup,
      benchmarkSets,
      calibrationTable.policyGroups[policyGroupId],
      today
    );
  }

  writeJson(CALIBRATION_TABLE_PATH, nextCalibrationTable);
}

function addObservation(args) {
  const requiredArgs = ['set', 'metric', 'basis', 'value', 'sourceKind', 'sizeBand', 'quality'];
  for (const requiredArg of requiredArgs) {
    if (!args[requiredArg]) {
      throw new Error(`Missing required argument --${requiredArg}`);
    }
  }

  const benchmarkData = readJson(BENCHMARK_DATA_PATH);
  const benchmarkSet = benchmarkData.benchmarkSets.find((set) => set.id === args.set);
  if (!benchmarkSet) {
    throw new Error(`Unknown benchmark set: ${args.set}`);
  }

  const nextIndex =
    benchmarkSet.observations.filter((observation) => observation.metric === args.metric).length + 1;
  benchmarkSet.observations.push({
    id: `${slugifyPolicyGroup(benchmarkSet.policyGroupId)}-${args.metric.slice(0, 2)}-${nextIndex}`,
    metric: args.metric,
    basis: args.basis,
    value: Number(args.value),
    sourceKind: args.sourceKind,
    sizeBand: args.sizeBand,
    observedAt: args.date || new Date().toISOString().slice(0, 10),
    quality: args.quality,
    sourceReferenceId: args.sourceReferenceId,
    notes: args.notes,
  });

  writeJson(BENCHMARK_DATA_PATH, benchmarkData);
  const policyRegistry = readJson(POLICY_REGISTRY_PATH);
  const calibrationTable = readJson(CALIBRATION_TABLE_PATH);
  rebuildCalibrationTables(policyRegistry, benchmarkData, calibrationTable);
}

function main() {
  const { command, args } = parseArgs(process.argv);
  const policyRegistry = readJson(POLICY_REGISTRY_PATH);
  const benchmarkData = readJson(BENCHMARK_DATA_PATH);
  const calibrationTable = readJson(CALIBRATION_TABLE_PATH);

  if (command === 'ensure-coverage') {
    ensureCoverage();
    console.log('Benchmark coverage ensured and calibration table rebuilt.');
    return;
  }

  if (command === 'rebuild') {
    rebuildCalibrationTables(policyRegistry, benchmarkData, calibrationTable);
    console.log('Calibration table rebuilt from current benchmark observations.');
    return;
  }

  if (command === 'add-observation') {
    addObservation(args);
    console.log(`Observation added to ${args.set} and calibration table rebuilt.`);
    return;
  }

  console.log(`Usage:
  node scripts/valuation-engine/calibration-maintenance.mjs ensure-coverage
  node scripts/valuation-engine/calibration-maintenance.mjs rebuild
  node scripts/valuation-engine/calibration-maintenance.mjs add-observation --set <setId> --metric <metric> --basis <basis> --value <number> --sourceKind <transaction|public_comp|private_observation|curated_secondary> --sizeBand <band> --quality <low|medium|high> [--date YYYY-MM-DD]`);
}

main();
