import { policyRegistry } from './policy-registry.mjs';
import { buildBranchQualityAdjustment, buildGeographyAdjustment } from './modules/qualitative-adjustments.mjs';

function toNumber(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeIndustryFit(value) {
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

function normalizeGrowthOutlook(value) {
  switch (String(value ?? '').trim()) {
    case 'current_market':
    case 'new_markets':
      return 'strong_growth';
    case 'limited':
      return 'stable';
    case 'uncertain':
      return 'not_sure';
    case 'strong_growth':
    case 'moderate_growth':
    case 'stable':
    case 'decline':
    case 'not_sure':
      return String(value);
    default:
      return 'not_sure';
  }
}

function normalizeFounderDependence(value) {
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

function normalizeCustomerConcentration(value) {
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

function getForecastBlendWeight(answers) {
  const actualYears =
    1 +
    (answers.revenuePrevious1 || answers.revenuePrev1 ? 1 : 0) +
    (answers.revenuePrevious2 || answers.revenuePrev2 ? 1 : 0);
  const depthModifier = actualYears >= 3 ? 0.75 : actualYears === 2 ? 0.9 : 1;
  return Math.max(0.12, Math.min(0.18 * depthModifier, 0.22));
}

function getForecastSignal(answers) {
  const rawPeriods = Array.isArray(answers._financialPeriods) ? answers._financialPeriods : [];
  const forecastPeriod = rawPeriods.find(
    (period) => period && typeof period === 'object' && period.id === 'forecast' && period.enabled === true
  );

  if (!forecastPeriod) {
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

function blendTowardForecast(actualValue, forecastValue, weight) {
  if (forecastValue <= 0 && actualValue <= 0) return 0;
  if (actualValue <= 0) return forecastValue;
  if (forecastValue <= 0) return actualValue;
  return actualValue * (1 - weight) + forecastValue * weight;
}

function determinePhase(answers) {
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

function getPhaseAdjustment(phase) {
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

function getNextPhase(currentPhase) {
  const phases = ['initial', 'anchor', 'branch', 'closing'];
  const currentIndex = phases.indexOf(currentPhase);
  return phases[currentIndex + 1] || 'final';
}

function buildPseudoRequest(answers) {
  return {
    classification: {
      level2: answers.level2,
    },
    company: {
      primaryState: answers.primaryState,
      operatingYearsBand: answers.operatingYears,
    },
    operatingProfile: {
      growthOutlook: normalizeGrowthOutlook(answers.growthPotential || answers.growthOutlook),
      founderRevenueDependence: answers.founderRevenueDependence
        ? normalizeFounderDependence(answers.founderRevenueDependence)
        : normalizeFounderDependence(answers.ownerCustomerRelationship),
      recurringRevenueShare: answers.recurringRevenueShare,
      revenueVisibility: answers.revenueVisibility,
      customerConcentration: normalizeCustomerConcentration(answers.customerConcentration),
      productRights: answers.productRights,
      quantities: answers.quantities,
      productCustomisation: answers.productCustomisation,
      grossMarginStability: answers.grossMarginStability,
      supplierConcentration: answers.supplierConcentration,
      shrinkageSpoilage: answers.shrinkageSpoilage,
      peakSeasonDependency: answers.peakSeasonDependency,
      staffUtilization: answers.staffUtilization,
      keyPersonDependencies: answers.keyPersonDependencies,
      pricingPowerVsMarket: answers.pricingPowerVsMarket,
      capacityUtilization: answers.capacityUtilization,
      manufacturingValueCreation: answers.manufacturingValueCreation,
      equipmentAgeCondition: answers.equipmentAgeCondition,
      rawMaterialPriceExposure: answers.rawMaterialPriceExposure,
      qualityCertifications: answers.qualityCertifications,
    },
    financials: {
      historicals: [
        {
          revenue: Number(answers.revenueLatest) || 0,
          maintenanceCapex: Number(answers.maintenanceCapexLatest) || 0,
        },
      ],
    },
  };
}

function calculateConfidenceBreakdown(answers, policyGroup, phase, branchQuality) {
  let dataCompleteness = 40;
  if (phase === 'anchor') dataCompleteness = 50;
  if (phase === 'branch') dataCompleteness = 70;
  if (phase === 'closing') dataCompleteness = 90;

  if (answers.revenuePrevious1 || answers.revenuePrev1) dataCompleteness += 5;
  if (answers.revenuePrevious2 || answers.revenuePrev2) dataCompleteness += 3;
  if (branchQuality.branchSignals?.length) dataCompleteness += 4;

  let recordsQuality = 50;
  const proofReadiness = answers.proofReadiness;
  if (proofReadiness === 'immediate') recordsQuality = 85;
  else if (proofReadiness === 'organize_fast') recordsQuality = 70;
  else if (proofReadiness === 'show_patterns') recordsQuality = 50;
  else if (proofReadiness === 'difficult') recordsQuality = 30;

  let benchmarkCoverage = 50;
  const observationCount = policyGroup?.calibration?.observationCount || 0;
  if (observationCount > 100) benchmarkCoverage = 90;
  else if (observationCount > 50) benchmarkCoverage = 75;
  else if (observationCount > 20) benchmarkCoverage = 60;
  else if (observationCount === 0) benchmarkCoverage = 30;

  return {
    dataCompleteness: Math.min(100, dataCompleteness),
    recordsQuality: Math.min(100, recordsQuality),
    benchmarkCoverage: Math.min(100, benchmarkCoverage),
  };
}

function calculateConfidenceScore(answers, breakdown, fallback, branchQuality) {
  const score =
    breakdown.dataCompleteness * 0.4 +
    breakdown.recordsQuality * 0.35 +
    breakdown.benchmarkCoverage * 0.25;

  let adjustedScore = score;
  if (fallback) adjustedScore -= 15;

  const industryFit = normalizeIndustryFit(answers.industryFit);
  if (industryFit === 'poor_fit') adjustedScore -= 15;
  else if (industryFit === 'partial_fit') adjustedScore -= 8;
  else if (industryFit === 'not_sure') adjustedScore -= 10;

  const operatingYears = String(answers.operatingYears || '');
  if (['lt_1', '1_3'].includes(operatingYears)) adjustedScore -= 5;
  if (['10_20', 'gt_20'].includes(operatingYears)) adjustedScore += 5;

  const forecastSignal = getForecastSignal(answers);
  const revenue = forecastSignal ? blendTowardForecast(toNumber(answers.revenueLatest), forecastSignal.revenue, forecastSignal.weight) : toNumber(answers.revenueLatest) || 1;
  const profit =
    forecastSignal && forecastSignal.hasProfit
      ? blendTowardForecast(toNumber(answers.operatingProfitLatest), forecastSignal.profit, forecastSignal.weight)
      : toNumber(answers.operatingProfitLatest) || 0;
  const margin = profit / revenue;
  if (margin < 0.05) adjustedScore -= 10;
  if (margin < 0) adjustedScore -= 20;

  if (typeof branchQuality.branchSignalScore === 'number') {
    adjustedScore += (branchQuality.branchSignalScore - 60) * 0.08;
  }

  if (forecastSignal) {
    adjustedScore += 2;
  }

  return Math.max(10, Math.min(95, Math.round(adjustedScore)));
}

function generateDataFlags(answers, branchQuality, geographyAdjustment) {
  const flags = [];
  const forecastSignal = getForecastSignal(answers);

  if (normalizeIndustryFit(answers.industryFit) === 'poor_fit') {
    flags.push({
      type: 'warning',
      message: 'Industry classification uncertain — range widened',
      field: 'industryFit',
    });
  }

  if (answers.proofReadiness === 'difficult') {
    flags.push({
      type: 'warning',
      message: 'Difficulty proving financials may reduce buyer confidence',
      field: 'proofReadiness',
    });
  }

  if (['lt_1', '1_3'].includes(String(answers.operatingYears || ''))) {
    flags.push({
      type: 'info',
      message: 'Shorter operating history increases uncertainty',
    });
  }

  const revenue = forecastSignal ? blendTowardForecast(toNumber(answers.revenueLatest), forecastSignal.revenue, forecastSignal.weight) : toNumber(answers.revenueLatest) || 1;
  const profit =
    forecastSignal && forecastSignal.hasProfit
      ? blendTowardForecast(toNumber(answers.operatingProfitLatest), forecastSignal.profit, forecastSignal.weight)
      : toNumber(answers.operatingProfitLatest) || 0;
  if (profit / revenue < 0.05) {
    flags.push({
      type: 'warning',
      message: 'Low profit margin may limit valuation upside',
    });
  }

  if (geographyAdjustment.geographyBucket === 'other_state') {
    flags.push({
      type: 'info',
      message: 'Location is outside the strongest current buyer-liquidity hubs, so achievable-today value is discounted modestly.',
      field: 'primaryState',
    });
  }

  if (branchQuality.branchFamily && (branchQuality.branchSignalScore || 0) < 55) {
    flags.push({
      type: 'info',
      message: `Branch-specific operating signals for ${branchQuality.branchFamily.replaceAll('_', ' ')} are currently widening the estimate range slightly.`,
    });
  }

  if (forecastSignal) {
    flags.push({
      type: 'info',
      message: 'Current-year forecast is included with cautious weight in this preliminary range.',
      field: 'revenueLatest',
    });
  }

  return flags;
}

function mapConfidenceLevel(score) {
  if (score <= 25) return 'very_low';
  if (score <= 40) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'very_high';
}

export function calculatePartialValuation(answers) {
  const flags = [];
  const level2 = answers.level2 || '';
  const forecastSignal = getForecastSignal(answers);
  const revenue = forecastSignal ? blendTowardForecast(toNumber(answers.revenueLatest), forecastSignal.revenue, forecastSignal.weight) : toNumber(answers.revenueLatest);

  if (!level2 || !revenue) {
    return {
      range: { low: 0, high: 0, mid: 0 },
      confidence: 'very_low',
      confidenceScore: 0,
      confidenceBreakdown: {
        dataCompleteness: 0,
        recordsQuality: 0,
        benchmarkCoverage: 0,
      },
      flags: [{ type: 'warning', message: 'Insufficient data for estimate' }],
      phase: 'initial',
      nextPhase: 'anchor',
    };
  }

  const policyGroupId = policyRegistry.level2PolicyMap[level2] || 'PG_LOCAL_SERVICE_OWNER_OP';
  const policyGroup = policyRegistry.policyGroups[policyGroupId];
  const fallback = !policyRegistry.level2PolicyMap[level2];
  const phase = determinePhase(answers);
  const pseudoRequest = buildPseudoRequest(answers);
  const branchQuality = buildBranchQualityAdjustment(pseudoRequest);
  const geographyAdjustment = buildGeographyAdjustment(answers.primaryState);

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
  const partialGeographyFactor = 1 + ((geographyAdjustment.geographyAdjustmentFactor || 1) - 1) * 0.6;
  const partialBranchFactor = 1 + ((branchQuality.branchQualityFactor || 1) - 1) * 0.55;
  const qualitativeFactor = partialGeographyFactor * partialBranchFactor;

  const low = Math.round(baseValue * (multipleLow / marketMultiple) * 0.8 * phaseAdjustment.low * qualitativeFactor);
  const high = Math.round(baseValue * (multipleHigh / marketMultiple) * 1.2 * phaseAdjustment.high * qualitativeFactor);
  const mid = Math.round((low + high) / 2);

  const breakdown = calculateConfidenceBreakdown(answers, policyGroup, phase, branchQuality);
  if (forecastSignal) {
    breakdown.dataCompleteness = Math.min(100, breakdown.dataCompleteness + 2);
  }
  const confidenceScore = calculateConfidenceScore(answers, breakdown, fallback, branchQuality);
  flags.push(...generateDataFlags(answers, branchQuality, geographyAdjustment));

  return {
    range: { low, high, mid },
    confidence: mapConfidenceLevel(confidenceScore),
    confidenceScore,
    confidenceBreakdown: breakdown,
    flags,
    phase,
    nextPhase: getNextPhase(phase),
  };
}
