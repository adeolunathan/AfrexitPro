import type { FormData } from '@/types/valuation';
import type { PartialValuationResult } from '@/api/valuation-partial';
import { resolveFrontendPolicyGroup } from './policy-registry';
import {
  buildFxExposureAdjustmentFromValue,
  buildGeographyAdjustmentFromPrimaryState,
  buildLevel1AdjustmentFromLevel1,
  buildMarketPositionAdjustmentFromValues,
  scoreOperatingYearsBand,
} from './shared/live-preview-factors';

function toNumber(value: unknown) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

function normalizeCustomerConcentration(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'no_material':
    case 'none_material':
      return 'none_material';
    case 'lt_20':
      return 'manageable';
    case '20_50':
    case 'high':
      return 'high';
    case '50_80':
    case 'gt_80':
    case 'extreme':
      return 'extreme';
    case 'manageable':
    case 'not_sure':
      return String(value);
    default:
      return 'not_sure';
  }
}

function getGeographyAdjustment(primaryState: unknown) {
  return buildGeographyAdjustmentFromPrimaryState(primaryState).geographyAdjustmentFactor;
}

function getLevel1Adjustment(level1: unknown) {
  return buildLevel1AdjustmentFromLevel1(level1).level1AdjustmentFactor;
}

function getMarketPositionAdjustment(answers: Partial<FormData>) {
  return buildMarketPositionAdjustmentFromValues({
    catchmentArea: answers.catchmentArea,
    differentiation: answers.differentiation,
    pricingPower: answers.pricingPower,
  }).marketPositionAdjustmentFactor;
}

function getFxExposureAdjustment(fxExposure: unknown) {
  return buildFxExposureAdjustmentFromValue(fxExposure).fxExposureAdjustmentFactor;
}

function getTransactionContextAdjustment(transactionGoal: unknown) {
  switch (String(transactionGoal ?? '').trim()) {
    case 'investor_entry':
      return 1.01;
    case 'partial_sale':
      return 0.995;
    case 'value_improvement':
      return 1.005;
    default:
      return 1;
  }
}

function getAchievableUrgencyAdjustment(transactionTimeline: unknown, transactionGoal: unknown) {
  const normalizedTimeline = String(transactionTimeline ?? '').trim();
  const normalizedGoal = String(transactionGoal ?? '').trim();
  if (normalizedTimeline === 'within_6m') {
    return normalizedGoal === 'external_sale' || normalizedGoal === 'partial_sale' ? 0.9 : 0.96;
  }
  if (normalizedTimeline === '6_12m') return 0.96;
  return 1;
}

function scoreLargestSupplierShare(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'lt_20':
      return 85;
    case '20_35':
      return 65;
    case '35_60':
      return 40;
    case 'gt_60':
      return 20;
    default:
      return undefined;
  }
}

function scoreSupplierReplacementTime(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'lt_2w':
      return 85;
    case '2_8w':
      return 65;
    case '2_6m':
      return 40;
    case 'gt_6m':
      return 20;
    default:
      return undefined;
  }
}

function scoreCriticalHireTime(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'lt_30d':
      return 82;
    case '1_3m':
      return 65;
    case '3_6m':
      return 40;
    case 'gt_6m':
      return 20;
    default:
      return undefined;
  }
}

function scoreCriticalHireSalaryPremium(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'none':
      return 82;
    case 'up_to_10':
      return 68;
    case '10_25':
      return 45;
    case 'gt_25':
      return 25;
    default:
      return undefined;
  }
}

function getSupplierRiskScore(answers: Partial<FormData>) {
  return average([
    scoreLargestSupplierShare(answers.largestSupplierShare || answers.partnerDependency),
    scoreSupplierReplacementTime(answers.supplierReplacementTime),
  ], 60);
}

function getHiringRiskScore(answers: Partial<FormData>) {
  return average([
    scoreCriticalHireTime(answers.criticalHireTime || answers.laborMarketDifficulty),
    scoreCriticalHireSalaryPremium(answers.criticalHireSalaryPremium),
  ], 60);
}

function average(values: Array<number | undefined>, fallback = 50) {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!valid.length) return fallback;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function buildBranchQualityScore(answers: Partial<FormData>) {
  const scoreMap = {
    productRights: { company_owned: 88, mixed_control: 65, customer_owned: 40, public_domain: 22, not_sure: 50 },
    quantities: { repeat_batches: 86, mixed_profile: 62, mostly_custom: 40, one_off_bespoke: 22, not_sure: 50 },
    productCustomisation: { standardized: 90, configured: 72, tailored: 46, fully_bespoke: 24, not_sure: 50 },
    grossMarginStability: { expanding: 88, stable: 75, volatile: 45, contracting: 25 },
    supplierConcentration: { diversified: 85, moderate: 65, concentrated: 40, single_source: 20 },
    shrinkageSpoilage: { minimal: 85, moderate: 65, significant: 40, major: 20 },
    peakSeasonDependency: { flat: 82, slight: 70, moderate: 50, extreme: 25 },
    staffUtilization: { gt_80: 85, '60_80': 72, '40_60': 50, lt_40: 30 },
    keyPersonDependencies: { none: 82, one: 65, few: 40, many: 20 },
    pricingPowerVsMarket: { premium: 85, market: 65, slight_discount: 45, significant_discount: 25 },
    capacityUtilization: { gt_90: 80, '70_90': 72, '50_70': 55, lt_50: 35 },
    manufacturingValueCreation: { in_house_majority: 86, balanced: 62, outsourced_majority: 40, assembly_only: 24, not_sure: 50 },
    equipmentAgeCondition: { modern: 85, good: 70, aging: 45, outdated: 20 },
    rawMaterialPriceExposure: { minimal: 82, moderate: 65, significant: 40, critical: 20 },
    qualityCertifications: { major: 85, local: 68, in_progress: 55, none: 35 },
  } as const;

  const lookup = (mapName: keyof typeof scoreMap, value: unknown) => scoreMap[mapName][String(value ?? '') as keyof (typeof scoreMap)[typeof mapName]];
  const scores = [
    lookup('productRights', answers.productRights),
    lookup('quantities', answers.quantities),
    lookup('productCustomisation', answers.productCustomisation),
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
    lookup('manufacturingValueCreation', answers.manufacturingValueCreation),
    lookup('equipmentAgeCondition', answers.equipmentAgeCondition),
    lookup('rawMaterialPriceExposure', answers.rawMaterialPriceExposure),
    lookup('qualityCertifications', answers.qualityCertifications),
  ];

  const hasExplicitBranchSignal = scores.some((value) => typeof value === 'number');
  if (!hasExplicitBranchSignal) return undefined;

  return Math.round(average(scores, 60));
}

function getForecastBlendWeight(answers: Partial<FormData>) {
  const actualYears =
    1 +
    (answers.revenuePrevious1 || answers.revenuePrev1 ? 1 : 0) +
    (answers.revenuePrevious2 || answers.revenuePrev2 ? 1 : 0);
  const depthModifier = actualYears >= 3 ? 0.75 : actualYears === 2 ? 0.9 : 1;
  return Math.max(0.12, Math.min(0.18 * depthModifier, 0.22));
}

function getForecastSignal(answers: Partial<FormData>) {
  const rawPeriods = Array.isArray(answers._financialPeriods) ? answers._financialPeriods : [];
  const forecastPeriod = rawPeriods.find(
    (period): period is { id?: unknown; enabled?: unknown; revenue?: unknown; operatingProfit?: unknown } =>
      Boolean(period && typeof period === 'object' && 'id' in period && (period as { id?: unknown }).id === 'forecast')
  );

  if (!forecastPeriod || forecastPeriod.enabled !== true) {
    return null;
  }

  const revenue = toNumber(forecastPeriod.revenue);
  const profit = toNumber(forecastPeriod.operatingProfit);
  const hasProfit = String(forecastPeriod.operatingProfit ?? '').trim() !== '';

  if (revenue <= 0 && !hasProfit) {
    return null;
  }

  return {
    revenue,
    profit,
    hasProfit,
    weight: getForecastBlendWeight(answers),
  };
}

function blendTowardForecast(actualValue: number, forecastValue: number, weight: number) {
  if (forecastValue <= 0 && actualValue <= 0) return 0;
  if (actualValue <= 0) return forecastValue;
  if (forecastValue <= 0) return actualValue;
  return actualValue * (1 - weight) + forecastValue * weight;
}

function determinePhase(answers: Partial<FormData>) {
  const hasBranchData =
    answers.productRights ||
    answers.quantities ||
    answers.productCustomisation ||
    answers.grossMarginStability ||
    answers.founderRevenueDependence ||
    answers.staffUtilization ||
    answers.capacityUtilization ||
    answers.manufacturingValueCreation;
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

function scoreProofReadiness(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'immediate':
      return 88;
    case 'organize_fast':
      return 72;
    case 'show_patterns':
      return 52;
    case 'difficult':
      return 28;
    default:
      return 52;
  }
}

function scoreOwnerAbsence2Weeks(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'smooth':
      return 84;
    case 'minor_issues':
      return 68;
    case 'struggle':
      return 42;
    case 'almost_stop':
      return 18;
    default:
      return 55;
  }
}

function scoreOwnerAbsence3Months(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'no_disruption':
      return 88;
    case 'limited_disruption':
      return 72;
    case 'risky_but_possible':
      return 48;
    case 'very_difficult':
      return 25;
    case 'not_realistic':
      return 12;
    default:
      return 52;
  }
}

function scoreManagementDepth(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'team_controls':
      return 84;
    case 'trusted_manager':
      return 70;
    case 'founder_plus_support':
      return 48;
    case 'founder_only':
      return 24;
    default:
      return 55;
  }
}

function scoreDocumentation(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'fully_documented':
      return 84;
    case 'partly_documented':
      return 66;
    case 'little_documented':
      return 44;
    case 'founder_head':
      return 22;
    default:
      return 52;
  }
}

function scoreReplacementDifficulty(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'easy':
      return 82;
    case 'possible':
      return 64;
    case 'hard':
      return 40;
    case 'founder_tied':
      return 20;
    default:
      return 52;
  }
}

function buildFallbackReadinessScore(answers: Partial<FormData>) {
  const readinessSignal = average([
    scoreProofReadiness(answers.proofReadiness),
    scoreOwnerAbsence2Weeks(answers.ownerAbsence2Weeks),
    scoreOwnerAbsence3Months(answers.ownerAbsence3Months),
    scoreManagementDepth(answers.managementDepth),
    scoreDocumentation(answers.processDocumentation),
    scoreReplacementDifficulty(answers.replacementDifficulty),
  ], 58);

  return Math.round(readinessSignal * 0.9 + scoreOperatingYearsBand(answers.operatingYears) * 0.1);
}

function buildFallbackFactorCards({
  partialGeographyFactor,
  partialBranchFactor,
  partialLevel1Factor,
  partialMarketPositionFactor,
  partialFxFactor,
  partialTransactionFactor,
  partialUrgencyFactor,
}: {
  partialGeographyFactor: number;
  partialBranchFactor: number;
  partialLevel1Factor: number;
  partialMarketPositionFactor: number;
  partialFxFactor: number;
  partialTransactionFactor: number;
  partialUrgencyFactor: number;
}) {
  return [
    {
      key: 'geography',
      label: 'Geography factor',
      factor: Number(partialGeographyFactor.toFixed(4)),
      note: 'Light preview weighting of buyer-liquidity geography.',
      appliesTo: ['achievable_value'],
    },
    {
      key: 'level1',
      label: 'Level 1 family factor',
      factor: Number(partialLevel1Factor.toFixed(4)),
      note: 'Broad family adjustment carried into the live preview.',
      appliesTo: ['achievable_value'],
    },
    {
      key: 'transaction_context',
      label: 'Transaction-context factor',
      factor: Number(partialTransactionFactor.toFixed(4)),
      note: 'Context weighting for sale, investment, or planning cases.',
      appliesTo: ['achievable_value'],
    },
    {
      key: 'urgency',
      label: 'Urgency factor',
      factor: Number(partialUrgencyFactor.toFixed(4)),
      note: 'Time pressure reduces achievable-today value.',
      appliesTo: ['achievable_value'],
    },
    {
      key: 'market_position',
      label: 'Market-position factor',
      factor: Number(partialMarketPositionFactor.toFixed(4)),
      note: 'Catchment, differentiation, and pricing power in the live preview.',
      appliesTo: ['value'],
    },
    {
      key: 'fx_exposure',
      label: 'FX sensitivity factor',
      factor: Number(partialFxFactor.toFixed(4)),
      note: 'FX-linked input sensitivity in the live preview.',
      appliesTo: ['value'],
    },
    {
      key: 'branch_quality',
      label: 'Branch-quality factor',
      factor: Number(partialBranchFactor.toFixed(4)),
      note: 'Branch-specific operating signals in the live preview.',
      appliesTo: ['value'],
    },
  ];
}

export function calculatePartialValuation(answers: Partial<FormData>): PartialValuationResult {
  const flags: PartialValuationResult['flags'] = [];
  const level2 = String(answers.level2 || '');
  const forecastSignal = getForecastSignal(answers);
  const revenue = forecastSignal ? blendTowardForecast(toNumber(answers.revenueLatest), forecastSignal.revenue, forecastSignal.weight) : toNumber(answers.revenueLatest);

  if (!level2 || revenue <= 0) {
    return {
      range: { low: 0, high: 0, mid: 0 },
      adjustedValue: 0,
      preciseAdjustedValue: 0,
      preciseLowEstimate: 0,
      preciseHighEstimate: 0,
      readinessScore: 0,
      confidence: 'very_low',
      confidenceScore: 0,
      rangeWidthPct: 0,
      confidenceBreakdown: { dataCompleteness: 0, recordsQuality: 0, benchmarkCoverage: 0 },
      flags: [{ type: 'warning', message: 'Insufficient data for preliminary estimate' }],
      phase: 'initial',
      nextPhase: 'anchor',
      primaryMethod: null,
      scorecard: null,
      qualitativeAdjustments: null,
      factorCards: [],
      sourceModel: 'fallback',
    };
  }

  const { policyGroup, fallback } = resolveFrontendPolicyGroup(level2);
  const phase = determinePhase(answers);
  const branchQualityScore = buildBranchQualityScore(answers);
  const geographyFactor = getGeographyAdjustment(answers.primaryState);
  const partialGeographyFactor = 1 + (geographyFactor - 1) * 0.6;
  const partialBranchFactor =
    typeof branchQualityScore === 'number' ? 1 + ((1 + (branchQualityScore - 60) / 500) - 1) * 0.55 : 1;
  const partialLevel1Factor = 1 + (getLevel1Adjustment(answers.level1) - 1) * 0.7;
  const partialMarketPositionFactor = 1 + (getMarketPositionAdjustment(answers) - 1) * 0.65;
  const partialFxFactor = 1 + (getFxExposureAdjustment(answers.fxExposure) - 1) * 0.65;
  const partialTransactionFactor = 1 + (getTransactionContextAdjustment(answers.transactionGoal) - 1) * 0.8;
  const partialUrgencyFactor = 1 + (getAchievableUrgencyAdjustment(answers.transactionTimeline, answers.transactionGoal) - 1) * 0.75;

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
  const qualitativeFactor =
    partialGeographyFactor
    * partialBranchFactor
    * partialLevel1Factor
    * partialMarketPositionFactor
    * partialFxFactor
    * partialTransactionFactor
    * partialUrgencyFactor;

  const low = Math.round(baseValue * (multipleLow / marketMultiple) * 0.8 * phaseAdjustment.low * qualitativeFactor);
  const high = Math.round(baseValue * (multipleHigh / marketMultiple) * 1.2 * phaseAdjustment.high * qualitativeFactor);
  const mid = Math.round((low + high) / 2);
  const rangeWidthPct = mid > 0 ? Number((((high - low) / 2 / mid) * 100).toFixed(1)) : 0;

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
  if (forecastSignal) confidenceBreakdown.dataCompleteness += 2;
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

  const profit =
    forecastSignal && forecastSignal.hasProfit
      ? blendTowardForecast(toNumber(answers.operatingProfitLatest), forecastSignal.profit, forecastSignal.weight)
      : toNumber(answers.operatingProfitLatest) || 0;
  const margin = profit / revenue;
  if (margin < 0.05) confidenceScore -= 10;
  if (margin < 0) confidenceScore -= 20;
  if (typeof branchQualityScore === 'number') confidenceScore += (branchQualityScore - 60) * 0.08;
  confidenceScore += (getSupplierRiskScore(answers) - 60) * 0.03;
  confidenceScore += (getHiringRiskScore(answers) - 60) * 0.03;
  if (forecastSignal) confidenceScore += 2;

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

  if (getFxExposureAdjustment(answers.fxExposure) < 0.98) {
    flags.push({
      type: 'info',
      message: 'Foreign-currency-linked input costs are reducing the preliminary valuation modestly.',
      field: 'fxExposure',
    });
  }

  if (getAchievableUrgencyAdjustment(answers.transactionTimeline, answers.transactionGoal) < 0.97) {
    flags.push({
      type: 'info',
      message: 'A shorter transaction timeline is reducing the preliminary value to reflect time pressure.',
      field: 'transactionTimeline',
    });
  }

  if (forecastSignal) {
    flags.push({
      type: 'info',
      message: 'Current-year forecast is included with cautious weight in this preliminary range.',
      field: 'revenueLatest',
    });
  }

  const readinessScore = buildFallbackReadinessScore(answers);

  return {
    range: { low, high, mid },
    adjustedValue: mid,
    preciseAdjustedValue: mid,
    preciseLowEstimate: low,
    preciseHighEstimate: high,
    readinessScore,
    confidence: mapConfidenceLevel(confidenceScore),
    confidenceScore,
    rangeWidthPct,
    confidenceBreakdown,
    flags,
    phase,
    nextPhase: getNextPhase(phase),
    primaryMethod: 'market_multiple',
    scorecard: {
      marketPosition: Math.round(
        buildMarketPositionAdjustmentFromValues({
          catchmentArea: answers.catchmentArea,
          differentiation: answers.differentiation,
          pricingPower: answers.pricingPower,
        }).marketPositionSignalScore
      ),
      financialQuality: Math.round(confidenceBreakdown.recordsQuality),
      ownerIndependence: Math.round(average([
        scoreOwnerAbsence2Weeks(answers.ownerAbsence2Weeks),
        scoreOwnerAbsence3Months(answers.ownerAbsence3Months),
        scoreManagementDepth(answers.managementDepth),
      ], 55)),
      revenueQuality: Math.round(average([
        normalizeFounderDependence(answers.founderRevenueDependence || answers.ownerCustomerRelationship) === 'very_little'
          ? 88
          : normalizeFounderDependence(answers.founderRevenueDependence || answers.ownerCustomerRelationship) === 'some'
            ? 66
            : normalizeFounderDependence(answers.founderRevenueDependence || answers.ownerCustomerRelationship) === 'large_share'
              ? 40
              : 18,
        normalizeCustomerConcentration(answers.customerConcentration) === 'none_material'
          ? 86
          : normalizeCustomerConcentration(answers.customerConcentration) === 'manageable'
            ? 70
            : normalizeCustomerConcentration(answers.customerConcentration) === 'high'
              ? 42
              : 22,
      ], 55)),
      operatingResilience: Math.round(average([
        getSupplierRiskScore(answers),
        getHiringRiskScore(answers),
      ], 60)),
      transactionReadiness: Math.round(average([
        scoreReplacementDifficulty(answers.replacementDifficulty),
        scoreDocumentation(answers.processDocumentation),
        scoreProofReadiness(answers.proofReadiness),
      ], 56)),
    },
    qualitativeAdjustments: {
      geographyAdjustmentFactor: Number(partialGeographyFactor.toFixed(4)),
      level1AdjustmentFactor: Number(partialLevel1Factor.toFixed(4)),
      transactionContextFactor: Number(partialTransactionFactor.toFixed(4)),
      achievableUrgencyFactor: Number(partialUrgencyFactor.toFixed(4)),
      marketPositionAdjustmentFactor: Number(partialMarketPositionFactor.toFixed(4)),
      fxExposureAdjustmentFactor: Number(partialFxFactor.toFixed(4)),
      branchQualityFactor: Number(partialBranchFactor.toFixed(4)),
      marketPositionSignalScore: buildMarketPositionAdjustmentFromValues({
        catchmentArea: answers.catchmentArea,
        differentiation: answers.differentiation,
        pricingPower: answers.pricingPower,
      }).marketPositionSignalScore,
    },
    factorCards: buildFallbackFactorCards({
      partialGeographyFactor,
      partialBranchFactor,
      partialLevel1Factor,
      partialMarketPositionFactor,
      partialFxFactor,
      partialTransactionFactor,
      partialUrgencyFactor,
    }),
    sourceModel: 'fallback',
  };
}

function mapConfidenceLevel(score: number): PartialValuationResult['confidence'] {
  if (score <= 25) return 'very_low';
  if (score <= 40) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'very_high';
}
