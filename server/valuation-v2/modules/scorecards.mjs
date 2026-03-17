import { average } from './utils.mjs';

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
  ownerAbsence3Months: { limited_disruption: 85, risky_but_possible: 60, very_difficult: 35, not_realistic: 15 },
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
  transactionGoal: { sale: 80, fundraise: 70, succession: 65, internal_planning: 60, lending: 65, other: 55 },
  urgency: { orderly: 80, accelerated: 65, forced: 35 },
  legalStructure: { sole_prop: 50, partnership: 55, limited_company: 80, group_structure: 75, other: 50 },
  ownerControlBand: { lt_25: 45, '25_50': 55, '51_75': 70, gt_75: 80 },
};

export function scoreFromMap(mapName, key, fallback = 50) {
  const map = scoreMaps[mapName] || {};
  return map[key] ?? fallback;
}

export function buildScorecard(request) {
  return {
    marketPosition: average([
      scoreFromMap('industryFit', request.classification.industryFit),
      scoreFromMap('catchmentArea', request.operatingProfile.catchmentArea),
      scoreFromMap('marketDemand', request.operatingProfile.marketDemand),
      scoreFromMap('growthOutlook', request.operatingProfile.growthOutlook),
      scoreFromMap('differentiation', request.operatingProfile.differentiation),
      scoreFromMap('pricingPower', request.operatingProfile.pricingPower),
    ]),
    financialQuality: average([
      scoreFromMap('proofReadiness', request.financials.sourceQuality.proofReadiness),
      scoreFromMap('traceablePaymentsShare', request.financials.sourceQuality.traceablePaymentsShare),
      scoreFromMap('bankingQuality', request.financials.sourceQuality.bankingQuality),
      scoreFromMap('financeTracking', request.financials.sourceQuality.bookkeepingQuality),
    ]),
    ownerIndependence: average([
      scoreFromMap('ownerAbsence2Weeks', request.readiness.ownerAbsence2Weeks),
      scoreFromMap('ownerAbsence3Months', request.readiness.ownerAbsence3Months),
      scoreFromMap('managementDepth', request.readiness.managementDepth),
      scoreFromMap('processDocumentation', request.readiness.processDocumentation),
      scoreFromMap('replacementDifficulty', request.readiness.replacementDifficulty),
    ]),
    revenueQuality: average([
      scoreFromMap('customerConcentration', request.operatingProfile.customerConcentration),
      scoreFromMap('bestCustomerRisk', request.operatingProfile.bestCustomerRisk),
      scoreFromMap('founderRevenueDependence', request.operatingProfile.founderRevenueDependence),
      scoreFromMap('recurringRevenueShare', request.operatingProfile.recurringRevenueShare),
      scoreFromMap('revenueVisibility', request.operatingProfile.revenueVisibility),
    ]),
    operatingResilience: average([
      scoreFromMap('supplierTransferability', request.operatingProfile.supplierTransferability),
      scoreFromMap('hiringDifficulty', request.operatingProfile.hiringDifficulty),
      scoreFromMap('inventoryProfile', request.operatingProfile.inventoryProfile),
      scoreFromMap('workingCapitalHealth', request.operatingProfile.workingCapitalHealth),
      scoreFromMap('assetSeparation', request.operatingProfile.assetSeparation),
      scoreFromMap('fxExposure', request.operatingProfile.fxExposure),
    ]),
    transactionReadiness: average([
      scoreFromMap('transactionGoal', request.engagement.purpose),
      scoreFromMap('urgency', request.engagement.urgency),
      scoreFromMap('legalStructure', request.company.legalStructure),
      scoreFromMap('ownerControlBand', request.company.ownerControlBand),
    ]),
  };
}

export function buildReadinessAssessment(request, scorecard) {
  const readiness = {
    recordsQuality: scorecard.financialQuality,
    ownershipClarity: average([
      scoreFromMap('legalStructure', request.company.legalStructure),
      scoreFromMap('ownerControlBand', request.company.ownerControlBand),
      scoreFromMap('processDocumentation', request.readiness.processDocumentation),
    ]),
    customerTransferability: scorecard.revenueQuality,
    managementDepth: scorecard.ownerIndependence,
    compliance: average([
      scoreFromMap('bankingQuality', request.financials.sourceQuality.bankingQuality),
      scoreFromMap('assetSeparation', request.operatingProfile.assetSeparation),
      scoreFromMap('proofReadiness', request.financials.sourceQuality.proofReadiness),
    ]),
    documentation: average([
      scoreFromMap('proofReadiness', request.financials.sourceQuality.proofReadiness),
      scoreFromMap('processDocumentation', request.readiness.processDocumentation),
    ]),
  };

  const overallScore = average(Object.values(readiness));
  const topGaps = [];

  if (readiness.recordsQuality < 55) topGaps.push('Records and proof quality need to be improved before relying on a tight valuation range.');
  if (readiness.managementDepth < 55) topGaps.push('The business still depends too heavily on the founder or a thin management bench.');
  if (readiness.customerTransferability < 55) topGaps.push('Customer concentration or founder-linked revenue weakens transferability.');
  if (readiness.compliance < 55) topGaps.push('Compliance, documentation, or asset separation needs work.');

  return {
    overallScore: Math.round(overallScore),
    recordsQuality: Math.round(readiness.recordsQuality),
    ownershipClarity: Math.round(readiness.ownershipClarity),
    customerTransferability: Math.round(readiness.customerTransferability),
    managementDepth: Math.round(readiness.managementDepth),
    compliance: Math.round(readiness.compliance),
    documentation: Math.round(readiness.documentation),
    topGaps: topGaps.slice(0, 4),
  };
}
