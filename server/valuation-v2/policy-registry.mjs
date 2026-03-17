import { z } from 'zod';
import rawRegistry from '../../src/valuation-engine/policy-registry.json' with { type: 'json' };
import rawCalibrationTable from '../../src/valuation-engine/calibration-table.json' with { type: 'json' };
import rawBenchmarkData from '../../src/valuation-engine/benchmark-data.json' with { type: 'json' };

const ownerPhasePolicySchema = z.object({
  capitalizedMetric: z.string().optional(),
  capitalizationRateRange: z
    .object({
      low: z.number(),
      mid: z.number(),
      high: z.number(),
    })
    .optional(),
  marketMetric: z.string().optional(),
  marketMultipleRange: z
    .object({
      low: z.number(),
      mid: z.number(),
      high: z.number(),
    })
    .optional(),
  assetFloorRevenuePct: z.number().optional(),
  workingCapitalTargetPct: z.number().optional(),
  marketabilityFloor: z.number().optional(),
  marketabilityCeiling: z.number().optional(),
  dispersionPenaltyWeight: z.number().optional(),
  reconciliationWeights: z.record(z.string(), z.number()),
  dcfEnabled: z.boolean().optional(),
});

const benchmarkObservationSchema = z.object({
  id: z.string().min(1),
  metric: z.enum(['market_multiple', 'capitalization_rate', 'working_capital_pct', 'marketability_factor']),
  basis: z.string().min(1),
  value: z.number(),
  sourceKind: z.enum(['transaction', 'public_comp', 'private_observation', 'curated_secondary']),
  sizeBand: z.string().min(1),
  observedAt: z.string().min(1),
  quality: z.enum(['low', 'medium', 'high']),
  sourceReferenceId: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});

const sourceReferenceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url().optional(),
  sourceType: z.enum(['transaction_report', 'benchmark_report', 'public_comp_dataset', 'internal_case', 'manual_entry', 'reference_link']),
  publishedAt: z.string().min(1).optional(),
  lastVerifiedAt: z.string().min(1).optional(),
});

const benchmarkSetSchema = z.object({
  id: z.string().min(1),
  policyGroupId: z.string().min(1),
  label: z.string().min(1),
  mode: z.enum(['owner', 'advisor', 'analyst']),
  geography: z.string().min(1),
  asOfDate: z.string().min(1),
  sourceMix: z.array(z.string().min(1)),
  sourceNotes: z.array(z.string()).optional(),
  sourceReferences: z.array(sourceReferenceSchema).optional(),
  observations: z.array(benchmarkObservationSchema).min(1),
});

const benchmarkDatasetSchema = z.object({
  benchmarkSets: z.array(benchmarkSetSchema),
});

const calibrationEntrySchema = z.object({
  benchmarkSetIds: z.array(z.string().min(1)),
  evidenceScore: z.number().min(0).max(100),
  lastCalibrated: z.string().min(1).optional(),
  notes: z.array(z.string()),
  ownerPhase: ownerPhasePolicySchema.partial(),
});

const calibrationTableSchema = z.object({
  policyGroups: z.record(z.string(), calibrationEntrySchema),
});

const rawPolicyRegistrySchema = z.object({
  level1Definitions: z.array(
    z.object({
      value: z.string().min(1),
      label: z.string().min(1),
    })
  ),
  level2Definitions: z.array(
    z.object({
      level1: z.string().min(1),
      value: z.string().min(1),
      label: z.string().min(1),
    })
  ),
  policyGroups: z.record(
    z.string(),
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      primaryMethod: z.string().min(1),
      secondaryMethods: z.array(z.string()),
      floorMethod: z.string().optional(),
      benchmarkNeeds: z.array(z.string()),
      riskModelFocus: z.array(z.string()),
      ownerPhase: ownerPhasePolicySchema,
      calibration: z
        .object({
          source: z.enum(['registry_default', 'benchmark_calibrated']),
          benchmarkSetIds: z.array(z.string()),
          observationCount: z.number().int().nonnegative(),
          evidenceScore: z.number().min(0).max(100),
          lastCalibrated: z.string().min(1).optional(),
          freshnessStatus: z.enum(['fresh', 'aging', 'stale']),
          freshestBenchmarkDate: z.string().min(1).optional(),
          freshnessDays: z.number().int().nonnegative(),
          sourceReliabilityScore: z.number().min(0).max(100),
          sourceMix: z.array(z.string()),
          internalObservationCount: z.number().int().nonnegative(),
          transactionObservationShare: z.number().min(0).max(1),
          notes: z.array(z.string()),
        })
        .optional(),
    })
  ),
  level2PolicyMap: z.record(z.string(), z.string().min(1)),
});

function mergeOwnerPhase(basePolicy, calibrationPolicy) {
  if (!calibrationPolicy) {
    return basePolicy;
  }

  return {
    ...basePolicy,
    ...calibrationPolicy,
    marketMultipleRange: calibrationPolicy.marketMultipleRange || basePolicy.marketMultipleRange,
    capitalizationRateRange: calibrationPolicy.capitalizationRateRange || basePolicy.capitalizationRateRange,
    reconciliationWeights: calibrationPolicy.reconciliationWeights || basePolicy.reconciliationWeights,
  };
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getLatestVerificationDate(benchmarkSets) {
  const dates = benchmarkSets
    .flatMap((benchmarkSet) => [benchmarkSet.asOfDate, ...(benchmarkSet.sourceReferences || []).map((reference) => reference.lastVerifiedAt)])
    .filter(Boolean)
    .sort();

  return dates.at(-1);
}

function getFreshnessStatus(freshnessDays) {
  if (freshnessDays <= 120) return 'fresh';
  if (freshnessDays <= 240) return 'aging';
  return 'stale';
}

function buildSourceReliabilityScore(benchmarkSets) {
  const qualityWeight = { low: 0.55, medium: 0.75, high: 0.9 };
  const sourceKindWeight = { transaction: 1, private_observation: 0.88, public_comp: 0.68, curated_secondary: 0.5 };
  const observations = benchmarkSets.flatMap((benchmarkSet) => benchmarkSet.observations);
  if (!observations.length) return 35;

  return Math.round(
    clamp(
      average(
        observations.map(
          (observation) =>
            (qualityWeight[observation.quality] || 0.55) * (sourceKindWeight[observation.sourceKind] || 0.5) * 100
        )
      ),
      25,
      95
    )
  );
}

const parsedRegistry = rawPolicyRegistrySchema.parse(rawRegistry);
const parsedCalibrationTable = calibrationTableSchema.parse(rawCalibrationTable);
const parsedBenchmarkData = benchmarkDatasetSchema.parse(rawBenchmarkData);
const benchmarkSetMap = Object.fromEntries(parsedBenchmarkData.benchmarkSets.map((set) => [set.id, set]));

const hydratedPolicyGroups = Object.fromEntries(
  Object.entries(parsedRegistry.policyGroups).map(([policyGroupId, policyGroup]) => {
    const calibrationEntry = parsedCalibrationTable.policyGroups[policyGroupId];
    if (!calibrationEntry) {
      return [
        policyGroupId,
        {
          ...policyGroup,
          calibration: {
            source: 'registry_default',
            benchmarkSetIds: [],
            observationCount: 0,
            evidenceScore: 35,
            freshnessStatus: 'stale',
            freshestBenchmarkDate: undefined,
            freshnessDays: 999,
            sourceReliabilityScore: 35,
            sourceMix: [],
            internalObservationCount: 0,
            transactionObservationShare: 0,
            notes: ['This policy group is still using inline default owner-phase assumptions.'],
          },
        },
      ];
    }

    const benchmarkSets = calibrationEntry.benchmarkSetIds.map((benchmarkSetId) => {
      const benchmarkSet = benchmarkSetMap[benchmarkSetId];
      if (!benchmarkSet) {
        throw new Error(`Calibration entry ${policyGroupId} references unknown benchmark set ${benchmarkSetId}.`);
      }

      return benchmarkSet;
    });
    const freshestBenchmarkDate = getLatestVerificationDate(benchmarkSets);
    const freshnessDays = freshestBenchmarkDate
      ? Math.max(0, Math.round((Date.now() - Date.parse(freshestBenchmarkDate)) / 86400000))
      : 999;
    const allObservations = benchmarkSets.flatMap((set) => set.observations);
    const sourceMix = [...new Set(benchmarkSets.flatMap((set) => set.sourceMix))];
    const internalObservationCount = allObservations.filter((observation) => observation.sourceReferenceId?.startsWith('internal-case-')).length;
    const transactionObservationCount = allObservations.filter((observation) => observation.sourceKind === 'transaction').length;

    return [
      policyGroupId,
      {
        ...policyGroup,
        ownerPhase: mergeOwnerPhase(policyGroup.ownerPhase, calibrationEntry.ownerPhase),
        calibration: {
          source: 'benchmark_calibrated',
          benchmarkSetIds: calibrationEntry.benchmarkSetIds,
          observationCount: benchmarkSets.reduce((sum, set) => sum + set.observations.length, 0),
          evidenceScore: calibrationEntry.evidenceScore,
          lastCalibrated: calibrationEntry.lastCalibrated,
          freshnessStatus: getFreshnessStatus(freshnessDays),
          freshestBenchmarkDate,
          freshnessDays,
          sourceReliabilityScore: buildSourceReliabilityScore(benchmarkSets),
          sourceMix,
          internalObservationCount,
          transactionObservationShare: allObservations.length ? transactionObservationCount / allObservations.length : 0,
          notes: calibrationEntry.notes,
        },
      },
    ];
  })
);

const policyRegistrySchema = rawPolicyRegistrySchema.extend({
  policyGroups: rawPolicyRegistrySchema.shape.policyGroups,
});

export const policyRegistry = policyRegistrySchema.parse({
  ...parsedRegistry,
  policyGroups: hydratedPolicyGroups,
});
export const policyGroups = policyRegistry.policyGroups;
export const level2PolicyMap = policyRegistry.level2PolicyMap;

export function resolvePolicyGroup(level2) {
  const policyGroupId = level2PolicyMap[level2];

  if (!policyGroupId) {
    return {
      policyGroupId: 'PG_LOCAL_SERVICE_OWNER_OP',
      policyGroup: policyGroups.PG_LOCAL_SERVICE_OWNER_OP,
      fallback: true,
    };
  }

  return {
    policyGroupId,
    policyGroup: policyGroups[policyGroupId],
    fallback: false,
  };
}
