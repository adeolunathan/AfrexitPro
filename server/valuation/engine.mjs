// LEGACY EXPERIMENTAL ENGINE
// Frozen on 2026-03-07 as an early heuristic model for local lab testing only.
// Do not extend this file as the long-term valuation model.
// The canonical redesign plan now lives in:
// docs/valuation-engine/afrexit-valuation-engine-master-plan.md

const industryMultiples = {
  agriculture: { revenue: 0.45, profit: 2.8 },
  manufacturing: { revenue: 0.65, profit: 3.6 },
  construction: { revenue: 0.55, profit: 3.2 },
  trade: { revenue: 0.4, profit: 3.0 },
  software: { revenue: 1.2, profit: 5.0 },
  transport: { revenue: 0.5, profit: 3.1 },
  hospitality: { revenue: 0.45, profit: 3.0 },
  health: { revenue: 0.75, profit: 4.2 },
  education: { revenue: 0.6, profit: 3.8 },
  professional: { revenue: 0.9, profit: 4.5 },
  real_estate: { revenue: 0.6, profit: 3.5 },
  creative: { revenue: 0.7, profit: 3.8 },
  local_services: { revenue: 0.45, profit: 3.0 },
};

const scoreMaps = {
  industryFit: { perfect_fit: 100, mostly_fit: 85, partial_fit: 60, poor_fit: 35, not_sure: 50 },
  catchmentArea: {
    local_city: 55,
    single_state: 60,
    multi_state: 70,
    national_single_base: 75,
    national_multi_base: 82,
    international: 88,
  },
  marketDemand: { declining: 35, flat: 55, steady_growth: 75, strong_growth: 90, not_sure: 50 },
  growthOutlook: { decline: 35, stable: 55, moderate_growth: 72, strong_growth: 90, not_sure: 50 },
  differentiation: { price: 45, reliability: 65, hard_to_copy: 85, founder_trust: 40, not_sure: 50 },
  pricingPower: { none: 40, some: 60, premium: 80, strong_premium: 92, not_sure: 50 },
  proofReadiness: { immediate: 95, organize_fast: 75, show_patterns: 50, difficult: 25 },
  traceablePaymentsShare: { '80_100': 90, '50_79': 70, '20_49': 45, lt_20: 20 },
  bankingQuality: { clean: 90, mostly_clean: 65, incomplete: 40, informal: 20 },
  financeTracking: { software: 90, spreadsheet: 70, notes: 45, informal: 20 },
  ownerAbsence2Weeks: { smooth: 90, minor_issues: 70, struggle: 40, almost_stop: 15 },
  ownerAbsence3Months: { no_disruption: 96, limited_disruption: 85, risky_but_possible: 60, very_difficult: 35, not_realistic: 15 },
  managementDepth: { team_controls: 90, trusted_manager: 75, founder_plus_support: 45, founder_only: 15 },
  processDocumentation: { documented_multi: 90, partly_documented: 65, little_documented: 40, founder_head: 15 },
  replacementDifficulty: { easy: 85, possible: 65, difficult: 35, founder_tied: 15 },
  hiringDifficulty: { easy: 80, feasible: 60, difficult: 40, severe: 20 },
  customerConcentration: { none_material: 90, manageable: 70, high: 40, extreme: 20, not_sure: 50 },
  bestCustomerRisk: { minor: 90, noticeable: 65, major: 35, severe: 20 },
  founderRevenueDependence: { very_little: 90, some: 65, large_share: 35, most: 15 },
  recurringRevenueShare: { very_little: 35, some: 55, meaningful: 75, large_share: 90 },
  revenueVisibility: { unpredictable: 30, some_repeat: 55, good_repeat: 75, contract_backed: 90 },
  supplierTransferability: { very_easy: 85, manageable: 65, uncertain: 45, very_difficult: 25 },
  inventoryProfile: { lt_7: 78, '7_30': 70, '30_90': 45, gt_90: 25, service_business: 80 },
  workingCapitalHealth: { healthy: 85, tight: 60, under_pressure: 35, not_sure: 50 },
  assetSeparation: { clear: 85, mostly: 65, partial: 40, no: 20 },
  fxExposure: { low: 80, moderate: 60, high: 40, very_high: 25 },
  transactionGoal: { external_sale: 80, partial_sale: 70, internal_handover: 65, investor_entry: 70, value_improvement: 60 },
  transactionTimeline: { within_6m: 60, '6_12m': 70, '12_24m': 80, gt_24m: 65, not_sure: 55 },
  legalStructure: { sole_prop: 50, partnership: 55, limited_company: 80, group_structure: 75, other: 50 },
  ownerControl: { lt_25: 45, '25_50': 55, '51_75': 70, gt_75: 80 },
};

const adjustmentPenaltyKeys = [
  'premisesAdjustment',
  'relatedPartyPay',
  'privateExpenses',
  'oneOffItems',
  'coreBusinessAdjustments',
];

function toNumber(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  if (!values.length) {
    return 50;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function scoreFromMap(mapName, key, fallback = 50) {
  const map = scoreMaps[mapName] || {};
  return map[key] ?? fallback;
}

function buildWarnings(data, scorecard, adjustmentFlags, confidenceScore) {
  const warnings = [];

  if (scorecard.financialQuality < 45) {
    warnings.push('Financial records are still too weak for a tight valuation range.');
  }
  if (scorecard.ownerIndependence < 45) {
    warnings.push('The business is still highly tied to founder presence and decision-making.');
  }
  if (scorecard.revenueQuality < 45) {
    warnings.push('Revenue concentration or customer dependence is still a material risk.');
  }
  if (data.recurringRevenueShare === 'very_little' && data.revenueVisibility === 'unpredictable') {
    warnings.push('Revenue visibility is weak because the business has little recurring or contract-backed income.');
  }
  if (data.transactionTimeline === 'within_6m' && scorecard.transactionReadiness < 60) {
    warnings.push('The expected transaction timeline is aggressive relative to current readiness.');
  }
  if (adjustmentFlags.length > 0) {
    warnings.push(`Normalization review is still needed for ${adjustmentFlags.length} profit-quality adjustment areas.`);
  }
  if (confidenceScore < 50) {
    warnings.push('Confidence is still modest, so the current range should be treated as wide and provisional.');
  }

  return warnings.slice(0, 5);
}

export function evaluateSubmission(data) {
  const requiredFields = ['firstName', 'businessName', 'email', 'whatsapp', 'level1', 'level2', 'revenueLatest', 'operatingProfitLatest'];

  for (const field of requiredFields) {
    if (!String(data[field] ?? '').trim()) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (data.termsAccepted !== true) {
    throw new Error('The local lab acknowledgement must be accepted before submission.');
  }

  const revenue = toNumber(data.revenueLatest);
  const operatingProfit = toNumber(data.operatingProfitLatest);
  const cashBalance = toNumber(data.cashBalance);
  const financialDebt = toNumber(data.financialDebt);

  if (revenue <= 0 && operatingProfit <= 0) {
    throw new Error('Revenue or operating profit must be greater than zero.');
  }

  const multiples = industryMultiples[data.level1] || { revenue: 0.5, profit: 3.2 };
  const baseRevenueValue = revenue * multiples.revenue;
  const baseProfitValue = operatingProfit > 0 ? operatingProfit * multiples.profit : 0;
  const baseValue = operatingProfit > 0 ? (baseRevenueValue + baseProfitValue) / 2 : baseRevenueValue * 0.9;

  const scorecard = {
    marketPosition: average([
      scoreFromMap('industryFit', data.industryFit),
      scoreFromMap('catchmentArea', data.catchmentArea),
      scoreFromMap('marketDemand', data.marketDemand),
      scoreFromMap('growthOutlook', data.growthOutlook),
      scoreFromMap('differentiation', data.differentiation),
      scoreFromMap('pricingPower', data.pricingPower),
    ]),
    financialQuality: average([
      scoreFromMap('proofReadiness', data.proofReadiness),
      scoreFromMap('traceablePaymentsShare', data.traceablePaymentsShare),
      scoreFromMap('bankingQuality', data.bankingQuality),
      scoreFromMap('financeTracking', data.financeTracking),
    ]),
    ownerIndependence: average([
      scoreFromMap('ownerAbsence2Weeks', data.ownerAbsence2Weeks),
      scoreFromMap('ownerAbsence3Months', data.ownerAbsence3Months),
      scoreFromMap('managementDepth', data.managementDepth),
      scoreFromMap('processDocumentation', data.processDocumentation),
      scoreFromMap('replacementDifficulty', data.replacementDifficulty),
    ]),
    revenueQuality: average([
      scoreFromMap('customerConcentration', data.customerConcentration),
      scoreFromMap('bestCustomerRisk', data.bestCustomerRisk),
      scoreFromMap('founderRevenueDependence', data.founderRevenueDependence),
      scoreFromMap('recurringRevenueShare', data.recurringRevenueShare),
      scoreFromMap('revenueVisibility', data.revenueVisibility),
    ]),
    operatingResilience: average([
      scoreFromMap('supplierTransferability', data.supplierTransferability),
      scoreFromMap('hiringDifficulty', data.hiringDifficulty),
      scoreFromMap('inventoryProfile', data.inventoryProfile),
      scoreFromMap('workingCapitalHealth', data.workingCapitalHealth),
      scoreFromMap('assetSeparation', data.assetSeparation),
      scoreFromMap('fxExposure', data.fxExposure),
    ]),
    transactionReadiness: average([
      scoreFromMap('transactionGoal', data.transactionGoal),
      scoreFromMap('transactionTimeline', data.transactionTimeline),
      scoreFromMap('legalStructure', data.legalStructure),
      scoreFromMap('ownerControl', data.ownerControl),
    ]),
  };

  const readinessScore = average(Object.values(scorecard));
  const adjustmentFlags = adjustmentPenaltyKeys.filter((key) => data[key] === 'yes');
  const adjustmentPenalty = adjustmentFlags.length * 0.025;
  const qualityMultiplier = clamp(0.72 + readinessScore / 180, 0.68, 1.25);
  const netFundsAdjustment = cashBalance * 0.45 - financialDebt * 0.65;
  const adjustedValue = Math.max(baseValue * (qualityMultiplier - adjustmentPenalty) + netFundsAdjustment, revenue * 0.18);

  const confidenceScore = clamp(
    20 + 30 + scorecard.financialQuality * 0.35 + scorecard.ownerIndependence * 0.1 - adjustmentFlags.length * 3,
    35,
    90
  );

  const spread = clamp(0.34 - confidenceScore / 250, 0.12, 0.26);
  const lowEstimate = adjustedValue * (1 - spread);
  const highEstimate = adjustedValue * (1 + spread);

  let rating = 'Needs Foundational Work';
  if (readinessScore >= 80) {
    rating = 'Strong Exit Readiness';
  } else if (readinessScore >= 65) {
    rating = 'Developing Sell-Side Readiness';
  } else if (readinessScore >= 50) {
    rating = 'Early Readiness';
  }

  const warnings = buildWarnings(data, scorecard, adjustmentFlags, confidenceScore);

  return {
    businessName: data.businessName,
    level1: data.level1,
    level2: data.level2,
    lowEstimate: Math.round(lowEstimate),
    adjustedValue: Math.round(adjustedValue),
    highEstimate: Math.round(highEstimate),
    readinessScore: Math.round(readinessScore),
    confidenceScore: Math.round(confidenceScore),
    rating,
    warnings,
    scorecard: {
      marketPosition: Math.round(scorecard.marketPosition),
      financialQuality: Math.round(scorecard.financialQuality),
      ownerIndependence: Math.round(scorecard.ownerIndependence),
      revenueQuality: Math.round(scorecard.revenueQuality),
      operatingResilience: Math.round(scorecard.operatingResilience),
      transactionReadiness: Math.round(scorecard.transactionReadiness),
    },
    experimental: true,
  };
}
