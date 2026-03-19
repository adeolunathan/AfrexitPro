import type { FormData } from '@/types/valuation';
import type { PartialValuationResult } from '@/api/valuation-partial';
import { resolveFrontendPolicyGroup } from './policy-registry';

function normalizeIndustryFit(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'perfect_fit':
      return 'perfect_fit';
    case 'good_fit':
    case 'mostly_fit':
    case 'hybrid':
      return 'mostly_fit';
    case 'partial_fit':
      return 'partial_fit';
    case 'poor_fit':
      return 'poor_fit';
    default:
      return 'not_sure';
  }
}

function normalizeFounderDependence(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'brand_not_personal':
      return 'very_little';
    case 'knows_not_expected':
      return 'some';
    case 'expects_involvement':
      return 'large_share';
    case 'buying_owner':
      return 'most';
    case 'very_little':
    case 'some':
    case 'large_share':
    case 'most':
      return String(value);
    default:
      return 'some';
  }
}

function normalizePrimaryState(value: unknown) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return 'lagos_mainland';

  const aliases: Record<string, string> = {
    abuja_fct: 'fct',
    abuja: 'fct',
    port_harcourt: 'rivers',
  };

  return aliases[normalized] || normalized;
}

function getGeographyAdjustment(primaryState: unknown) {
  const normalizedPrimaryState = normalizePrimaryState(primaryState);
  if (['lagos_island', 'lagos_mainland', 'fct'].includes(normalizedPrimaryState)) return 1.025;
  if (['rivers', 'ogun', 'oyo', 'kano', 'anambra', 'delta', 'edo', 'kaduna', 'akwa_ibom'].includes(normalizedPrimaryState)) {
    return 1;
  }

  return 0.975;
}

function average(values: Array<number | undefined>, fallback = 50) {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!valid.length) return fallback;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function buildBranchQualityScore(answers: Partial<FormData>) {
  const scoreMap = {
    grossMarginStability: { expanding: 88, stable: 75, volatile: 45, contracting: 25 },
    supplierConcentration: { diversified: 85, moderate: 65, concentrated: 40, single_source: 20 },
    shrinkageSpoilage: { minimal: 85, moderate: 65, significant: 40, major: 20 },
    peakSeasonDependency: { flat: 82, slight: 70, moderate: 50, extreme: 25 },
    staffUtilization: { gt_80: 85, '60_80': 72, '40_60': 50, lt_40: 30 },
    keyPersonDependencies: { none: 82, one: 65, few: 40, many: 20 },
    pricingPowerVsMarket: { premium: 85, market: 65, slight_discount: 45, significant_discount: 25 },
    capacityUtilization: { gt_90: 80, '70_90': 72, '50_70': 55, lt_50: 35 },
    equipmentAgeCondition: { modern: 85, good: 70, aging: 45, outdated: 20 },
    rawMaterialPriceExposure: { minimal: 82, moderate: 65, significant: 40, critical: 20 },
    qualityCertifications: { major: 85, local: 68, in_progress: 55, none: 35 },
  } as const;

  const lookup = (mapName: keyof typeof scoreMap, value: unknown) => scoreMap[mapName][String(value ?? '') as keyof (typeof scoreMap)[typeof mapName]];
  const scores = [
    lookup('grossMarginStability', answers.grossMarginStability),
    lookup('supplierConcentration', answers.supplierConcentration),
    lookup('shrinkageSpoilage', answers.shrinkageSpoilage),
    lookup('peakSeasonDependency', answers.peakSeasonDependency),
    normalizeFounderDependence(answers.founderRevenueDependence || answers.ownerCustomerRelationship) === 'very_little'
      ? 90
      : normalizeFounderDependence(answers.founderRevenueDependence || answers.ownerCustomerRelationship) === 'some'
        ? 65
        : normalizeFounderDependence(answers.founderRevenueDependence || answers.ownerCustomerRelationship) === 'large_share'
          ? 35
          : 15,
    lookup('staffUtilization', answers.staffUtilization),
    lookup('keyPersonDependencies', answers.keyPersonDependencies),
    lookup('pricingPowerVsMarket', answers.pricingPowerVsMarket),
    lookup('capacityUtilization', answers.capacityUtilization),
    lookup('equipmentAgeCondition', answers.equipmentAgeCondition),
    lookup('rawMaterialPriceExposure', answers.rawMaterialPriceExposure),
    lookup('qualityCertifications', answers.qualityCertifications),
  ];

  const hasExplicitBranchSignal = scores.some((value) => typeof value === 'number');
  if (!hasExplicitBranchSignal) return undefined;

  return Math.round(average(scores, 60));
}

function determinePhase(answers: Partial<FormData>) {
  const hasBranchData =
    answers.grossMarginStability ||
    answers.founderRevenueDependence ||
    answers.staffUtilization ||
    answers.capacityUtilization;
  const hasClosingData = answers.ownerAbsence2Weeks || answers.receivablesLatest !== undefined;

  if (hasClosingData) return 'closing';
  if (hasBranchData) return 'branch';
  if (answers.revenueLatest && answers.operatingProfitLatest) return 'anchor';
  return 'initial';
}

function getPhaseAdjustment(phase: string) {
  switch (phase) {
    case 'anchor':
      return { low: 0.72, high: 1.28 };
    case 'branch':
      return { low: 0.82, high: 1.18 };
    case 'closing':
      return { low: 0.9, high: 1.1 };
    default:
      return { low: 0.6, high: 1.4 };
  }
}

function getNextPhase(currentPhase: string) {
  const phases = ['initial', 'anchor', 'branch', 'closing'];
  const currentIndex = phases.indexOf(currentPhase);
  return phases[currentIndex + 1] || 'final';
}

export function calculatePartialValuation(answers: Partial<FormData>): PartialValuationResult {
  const flags: PartialValuationResult['flags'] = [];
  const level2 = String(answers.level2 || '');
  const revenue = Number(answers.revenueLatest) || 0;

  if (!level2 || revenue <= 0) {
    return {
      range: { low: 0, high: 0, mid: 0 },
      confidence: 'very_low',
      confidenceScore: 0,
      confidenceBreakdown: { dataCompleteness: 0, recordsQuality: 0, benchmarkCoverage: 0 },
      flags: [{ type: 'warning', message: 'Insufficient data for preliminary estimate' }],
      phase: 'initial',
      nextPhase: 'anchor',
    };
  }

  const { policyGroup, fallback } = resolveFrontendPolicyGroup(level2);
  const phase = determinePhase(answers);
  const branchQualityScore = buildBranchQualityScore(answers);
  const geographyFactor = getGeographyAdjustment(answers.primaryState);
  const partialGeographyFactor = 1 + (geographyFactor - 1) * 0.6;
  const partialBranchFactor =
    typeof branchQualityScore === 'number' ? 1 + ((1 + (branchQualityScore - 60) / 500) - 1) * 0.55 : 1;

  if (fallback) {
    flags.push({
      type: 'warning',
      message: 'Industry classification uncertain — using general assumptions',
      field: 'level2',
    });
  }

  const marketMultiple = policyGroup?.ownerPhase?.marketMultipleRange?.mid || 3.5;
  const multipleLow = policyGroup?.ownerPhase?.marketMultipleRange?.low || 2.5;
  const multipleHigh = policyGroup?.ownerPhase?.marketMultipleRange?.high || 4.5;
  const baseValue = revenue * (marketMultiple / 10);
  const phaseAdjustment = getPhaseAdjustment(phase);
  const qualitativeFactor = partialGeographyFactor * partialBranchFactor;

  const low = Math.round(baseValue * (multipleLow / marketMultiple) * 0.8 * phaseAdjustment.low * qualitativeFactor);
  const high = Math.round(baseValue * (multipleHigh / marketMultiple) * 1.2 * phaseAdjustment.high * qualitativeFactor);
  const mid = Math.round((low + high) / 2);

  const proofReadiness = String(answers.proofReadiness || '');
  const operatingYears = String(answers.operatingYears || '');
  const observationCount = policyGroup?.calibration?.observationCount || 0;

  const confidenceBreakdown: PartialValuationResult['confidenceBreakdown'] = {
    dataCompleteness:
      phase === 'closing'
        ? 90
        : phase === 'branch'
          ? 74
          : phase === 'anchor'
            ? 50
            : 0,
    recordsQuality:
      proofReadiness === 'immediate'
        ? 85
        : proofReadiness === 'organize_fast'
          ? 70
          : proofReadiness === 'show_patterns'
            ? 50
            : proofReadiness === 'difficult'
              ? 30
              : 50,
    benchmarkCoverage: observationCount > 50 ? 75 : observationCount > 20 ? 60 : observationCount === 0 ? 30 : 50,
  };

  if (answers.revenuePrevious1 || answers.revenuePrev1) confidenceBreakdown.dataCompleteness += 5;
  if (answers.revenuePrevious2 || answers.revenuePrev2) confidenceBreakdown.dataCompleteness += 3;
  if (typeof branchQualityScore === 'number') confidenceBreakdown.dataCompleteness += 4;

  let confidenceScore =
    confidenceBreakdown.dataCompleteness * 0.4 +
    confidenceBreakdown.recordsQuality * 0.35 +
    confidenceBreakdown.benchmarkCoverage * 0.25;

  const industryFit = normalizeIndustryFit(answers.industryFit);
  if (industryFit === 'poor_fit') confidenceScore -= 15;
  else if (industryFit === 'partial_fit') confidenceScore -= 8;
  else if (industryFit === 'not_sure') confidenceScore -= 10;

  if (fallback) confidenceScore -= 15;
  if (['lt_1', '1_3'].includes(operatingYears)) confidenceScore -= 5;
  if (['10_20', 'gt_20'].includes(operatingYears)) confidenceScore += 5;

  const profit = Number(answers.operatingProfitLatest) || 0;
  const margin = profit / revenue;
  if (margin < 0.05) confidenceScore -= 10;
  if (margin < 0) confidenceScore -= 20;
  if (typeof branchQualityScore === 'number') confidenceScore += (branchQualityScore - 60) * 0.08;

  confidenceScore = Math.max(10, Math.min(95, Math.round(confidenceScore)));

  if (industryFit === 'poor_fit') {
    flags.push({
      type: 'warning',
      message: 'Industry classification uncertain — range widened',
      field: 'industryFit',
    });
  }

  if (proofReadiness === 'difficult') {
    flags.push({
      type: 'warning',
      message: 'Difficulty proving financials may reduce buyer confidence',
      field: 'proofReadiness',
    });
  }

  if (['lt_1', '1_3'].includes(operatingYears)) {
    flags.push({
      type: 'info',
      message: 'Shorter operating history increases uncertainty',
    });
  }

  if (margin < 0.05) {
    flags.push({
      type: 'warning',
      message: 'Low profit margin may limit valuation upside',
    });
  }

  if (geographyFactor < 1) {
    flags.push({
      type: 'info',
      message: 'Location modestly reduces achievable-today value outside the strongest buyer-liquidity hubs.',
      field: 'primaryState',
    });
  }

  if (typeof branchQualityScore === 'number' && branchQualityScore < 55) {
    flags.push({
      type: 'info',
      message: 'Branch-specific operating signals are currently widening the estimate range slightly.',
    });
  }

  return {
    range: { low, high, mid },
    confidence: mapConfidenceLevel(confidenceScore),
    confidenceScore,
    confidenceBreakdown,
    flags,
    phase,
    nextPhase: getNextPhase(phase),
  };
}

function mapConfidenceLevel(score: number): PartialValuationResult['confidence'] {
  if (score <= 25) return 'very_low';
  if (score <= 40) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'very_high';
}
