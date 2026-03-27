import { AUDIT_BASELINES } from './fixtures.mjs';
import { collectLiveQuestionDefinitions, collectOwnerFieldBindings } from './live-inventory.mjs';

function indexById(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function contextOnly(reason) {
  return {
    auditClass: 'operational_exception',
    allowedImpactDomains: ['context-only'],
    expectedAffectedOutputs: ['context_only'],
    monotonicity: 'non_monotonic_by_design',
    primaryMetricPath: null,
    expectedDirection: null,
    reason,
    auditStrategy: 'context_only',
    baselineIds: [],
  };
}

function selectAudit({
  baselineIds,
  primaryMetricPath,
  expectedDirection,
  expectedAffectedOutputs,
  auditClass = 'indirect_readiness_confidence_lever',
  monotonicity = 'strictly_monotonic',
  orderOverride,
  allowMethodSwitch = false,
  allowedImpactDomains,
}) {
  return {
    auditClass,
    allowedImpactDomains:
      allowedImpactDomains ||
      (primaryMetricPath?.includes('adjustedValue')
        ? ['value']
        : primaryMetricPath?.includes('readiness')
          ? ['readiness']
          : ['confidence']),
    expectedAffectedOutputs,
    monotonicity,
    primaryMetricPath,
    expectedDirection,
    orderOverride,
    allowMethodSwitch,
    auditStrategy: 'select_options',
    baselineIds,
  };
}

function numericAudit({
  baselineIds,
  primaryMetricPath,
  expectedDirection,
  expectedAffectedOutputs,
  testValues,
  auditClass = 'direct_value_lever',
  monotonicity = 'strictly_monotonic',
  allowedImpactDomains,
}) {
  return {
    auditClass,
    allowedImpactDomains:
      allowedImpactDomains ||
      (primaryMetricPath?.includes('adjustedValue')
        ? ['value']
        : primaryMetricPath?.includes('readiness')
          ? ['readiness']
          : ['confidence']),
    expectedAffectedOutputs,
    monotonicity,
    primaryMetricPath,
    expectedDirection,
    testValues,
    auditStrategy: 'numeric_values',
    baselineIds,
  };
}

function customAudit({
  baselineIds = [],
  primaryMetricPath,
  expectedDirection = null,
  expectedAffectedOutputs,
  allowedImpactDomains,
  auditClass = 'direct_value_lever',
  monotonicity = 'non_monotonic_by_design',
  customRuns,
  reason,
}) {
  return {
    auditClass,
    allowedImpactDomains: allowedImpactDomains || ['value'],
    expectedAffectedOutputs,
    monotonicity,
    primaryMetricPath,
    expectedDirection,
    auditStrategy: 'custom_runs',
    baselineIds,
    customRuns,
    reason,
  };
}

const contextOnlyQuestionIds = {
  respondentRole: contextOnly('Copy and respondent-awareness only.'),
  businessDescription: contextOnly('Stored for classification QA, audit context, and future analytics.'),
  previousOffer: contextOnly('Stored for market context and admin review only in the current engine pass.'),
  previousOfferAmount: contextOnly('Stored for market context and admin review only in the current engine pass.'),
  businessName: contextOnly('Report identity and storage metadata only.'),
  firstName: contextOnly('Contact field only.'),
  lastName: contextOnly('Contact field only.'),
  email: contextOnly('Contact field only.'),
  whatsapp: contextOnly('Contact field only.'),
  termsAccepted: contextOnly('Compliance / submission gating only.'),
};

const selectAudits = {
  industryFit: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    orderOverride: ['perfect_fit', 'mostly_fit', 'partial_fit', 'not_sure', 'poor_fit'],
    expectedAffectedOutputs: ['confidence', 'range', 'scorecard.marketPosition'],
  }),
  operatingYears: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'asc',
    orderOverride: ['lt_1', '1_3', '3_5', '5_10', '10_20', 'gt_20'],
    expectedAffectedOutputs: ['readiness', 'confidence'],
  }),
  catchmentArea: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'market_position_factor', 'scorecard.marketPosition'],
    auditClass: 'direct_value_lever',
  }),
  pricingPower: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    orderOverride: ['none', 'not_sure', 'some', 'premium', 'strong_premium'],
    expectedAffectedOutputs: ['value', 'market_position_factor', 'scorecard.marketPosition'],
    auditClass: 'direct_value_lever',
  }),
  transactionGoal: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: null,
    monotonicity: 'non_monotonic_by_design',
    expectedAffectedOutputs: ['value', 'scorecard.transactionReadiness', 'qualitative_factors'],
    auditClass: 'direct_value_lever',
  }),
  proofReadiness: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['confidence', 'readiness', 'scorecard.financialQuality'],
  }),
  ownerControl: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'scorecard.transactionReadiness'],
  }),
  marketDemand: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    orderOverride: ['strong_growth', 'steady_growth', 'flat', 'not_sure', 'declining'],
    expectedAffectedOutputs: ['confidence', 'scorecard.marketPosition'],
  }),
  traceablePaymentsShare: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'readiness', 'qualitative_factors'],
    auditClass: 'direct_value_lever',
  }),
  bankingQuality: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['confidence', 'readiness', 'scorecard.financialQuality'],
  }),
  financeTracking: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['confidence', 'readiness', 'scorecard.financialQuality'],
  }),
  ownerAbsence2Weeks: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'scorecard.ownerIndependence'],
  }),
  ownerAbsence3Months: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'scorecard.ownerIndependence'],
  }),
  ownerCustomerRelationship: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'scorecard.revenueQuality'],
  }),
  managementDepth: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'scorecard.ownerIndependence'],
  }),
  processDocumentation: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'confidence'],
  }),
  replacementDifficulty: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'scorecard.ownerIndependence'],
  }),
  criticalHireTime: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['confidence', 'scorecard.operatingResilience'],
  }),
  criticalHireSalaryPremium: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['confidence', 'scorecard.operatingResilience'],
  }),
  growthPotential: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'asc',
    orderOverride: ['decline', 'not_sure', 'stable', 'moderate_growth', 'strong_growth'],
    expectedAffectedOutputs: ['confidence', 'scorecard.marketPosition'],
  }),
  differentiation: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    orderOverride: ['founder_trust', 'price', 'not_sure', 'reliability', 'hard_to_copy'],
    expectedAffectedOutputs: ['value', 'market_position_factor', 'scorecard.marketPosition'],
    auditClass: 'direct_value_lever',
  }),
  customerConcentration: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    orderOverride: ['none_material', 'manageable', 'not_sure', 'high', 'extreme'],
    expectedAffectedOutputs: ['readiness', 'scorecard.revenueQuality'],
  }),
  bestCustomerImpact: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'scorecard.revenueQuality'],
  }),
  largestSupplierShare: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['confidence', 'scorecard.operatingResilience'],
  }),
  supplierReplacementTime: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['confidence', 'scorecard.operatingResilience'],
  }),
  assetSeparation: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'confidence', 'scorecard.operatingResilience'],
  }),
  fxExposure: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'qualitative_factors'],
    auditClass: 'direct_value_lever',
  }),
  legalStructure: selectAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'asc',
    orderOverride: ['other', 'sole_prop', 'partnership', 'group_structure', 'limited_company'],
    expectedAffectedOutputs: ['readiness', 'scorecard.transactionReadiness'],
  }),
  transactionTimeline: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    orderOverride: ['within_6m', '6_12m', 'not_sure', '12_24m', 'gt_24m'],
    expectedAffectedOutputs: ['value', 'scorecard.transactionReadiness', 'qualitative_factors'],
    auditClass: 'direct_value_lever',
    monotonicity: 'weak_monotonic_allowed_ties',
  }),

  productRights: selectAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    orderOverride: ['public_domain', 'customer_owned', 'not_sure', 'mixed_control', 'company_owned'],
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  quantities: selectAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    orderOverride: ['one_off_bespoke', 'mostly_custom', 'not_sure', 'mixed_profile', 'repeat_batches'],
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  productCustomisation: selectAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    orderOverride: ['fully_bespoke', 'tailored', 'not_sure', 'configured', 'standardized'],
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  inventoryProfile: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.confidenceScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['confidence', 'scorecard.operatingResilience'],
  }),
  grossMarginStability: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  supplierConcentration: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  shrinkageSpoilage: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  peakSeasonDependency: selectAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  founderRevenueDependence: selectAudit({
    baselineIds: ['project_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'confidence', 'branch_factor'],
  }),
  recurringRevenueShare: selectAudit({
    baselineIds: ['project_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['readiness', 'confidence', 'branch_factor'],
  }),
  revenueVisibility: selectAudit({
    baselineIds: ['project_service'],
    primaryMetricPath: 'summary.readinessScore',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['readiness', 'confidence', 'branch_factor'],
  }),
  staffUtilization: selectAudit({
    baselineIds: ['project_service'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  keyPersonDependencies: selectAudit({
    baselineIds: ['project_service'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  pricingPowerVsMarket: selectAudit({
    baselineIds: ['project_service'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  manufacturingValueCreation: selectAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    orderOverride: ['assembly_only', 'outsourced_majority', 'not_sure', 'balanced', 'in_house_majority'],
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  capacityUtilization: selectAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  equipmentAgeCondition: selectAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  rawMaterialPriceExposure: selectAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
  qualityCertifications: selectAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'confidence', 'branch_factor'],
    auditClass: 'direct_value_lever',
  }),
};

const numericAudits = {
  inventoryValueLatest: numericAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'equity_bridge'],
    testValues: [0, 15, 35],
  }),
  maintenanceCapexLatest: numericAudit({
    baselineIds: ['manufacturing'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: null,
    expectedAffectedOutputs: ['value', 'normalized_metrics', 'branch_factor'],
    testValues: [0, 4, 10],
    monotonicity: 'non_monotonic_by_design',
  }),
  receivablesLatest: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'equity_bridge'],
    testValues: [0, 10, 25],
  }),
  payablesLatest: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'equity_bridge'],
    testValues: [0, 10, 25],
  }),
  cashBalance: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'equity_bridge'],
    testValues: [0, 10, 25],
  }),
  ownerTotalCompensation: numericAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 8, 18],
  }),
  marketManagerCompensation: numericAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 8, 18],
  }),
  relatedPartyRentPaid: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 3, 9],
  }),
  marketRentEquivalent: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 3, 9],
  }),
  relatedPartyCompPaid: numericAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 2, 8],
  }),
  marketRelatedPartyCompEquivalent: numericAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 2, 8],
  }),
  privateExpensesAmount: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 1, 4],
  }),
  oneOffExpenseAmount: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 1, 4],
  }),
  oneOffIncomeAmount: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 1, 4],
  }),
  nonCoreIncomeAmount: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 1, 4],
  }),
  annualDepreciation: numericAudit({
    baselineIds: ['local_owner_led_service'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'asc',
    expectedAffectedOutputs: ['value', 'normalized_metrics'],
    testValues: [0, 2, 8],
    monotonicity: 'weak_monotonic_allowed_ties',
  }),
  financialDebt: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'equity_bridge'],
    testValues: [0, 10, 30],
  }),
  shareholderLoans: numericAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedDirection: 'desc',
    expectedAffectedOutputs: ['value', 'equity_bridge'],
    testValues: [0, 5, 20],
  }),
};

const customAudits = {
  level1: customAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedAffectedOutputs: ['value', 'qualitative_factors'],
    customRuns: [
      { label: 'Asset-heavy family', mutationPath: 'classification.level1', value: 'manufacturing' },
      { label: 'Balanced mainstream family', mutationPath: 'classification.level1', value: 'trade' },
      { label: 'Scalable lighter family', mutationPath: 'classification.level1', value: 'software' },
    ],
    expectedDirection: 'asc',
    monotonicity: 'strictly_monotonic',
  }),
  level2: customAudit({
    auditClass: 'structural_classifier',
    primaryMetricPath: 'summary.adjustedValue',
    expectedAffectedOutputs: ['value', 'method_set', 'policy_group'],
    allowedImpactDomains: ['value', 'confidence'],
    customRuns: [
      { label: 'Recurring software policy', sourceBaselineId: 'recurring_software' },
      { label: 'Project service policy', sourceBaselineId: 'project_service' },
      { label: 'Retail commerce policy', sourceBaselineId: 'retail_commerce' },
      { label: 'Manufacturing policy', sourceBaselineId: 'manufacturing' },
      { label: 'Logistics asset-heavy policy', sourceBaselineId: 'logistics_asset_heavy' },
      { label: 'Local owner-led service policy', sourceBaselineId: 'local_owner_led_service' },
    ],
    reason: 'Structural classification question audited through fixture-based policy-group comparisons rather than a single fixed baseline.',
  }),
  primaryState: customAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedAffectedOutputs: ['value', 'qualitative_factors'],
    customRuns: [
      { label: 'Other-state geography', mutationPath: 'company.primaryState', value: 'abia' },
      { label: 'Established hub geography', mutationPath: 'company.primaryState', value: 'rivers' },
      { label: 'Premium hub geography', mutationPath: 'company.primaryState', value: 'lagos_island' },
    ],
    expectedDirection: 'asc',
    monotonicity: 'strictly_monotonic',
  }),
  revenueLatest: customAudit({
    baselineIds: ['retail_commerce'],
    primaryMetricPath: 'summary.adjustedValue',
    expectedAffectedOutputs: ['value', 'confidence', 'history'],
    expectedDirection: 'asc',
    monotonicity: 'strictly_monotonic',
    customRuns: [
      {
        label: 'Weaker latest trading',
        transform: {
          kind: 'financial_history_shift',
          latestRevenueFactor: 0.85,
          latestOperatingProfitFactor: 0.8,
        },
      },
      {
        label: 'Baseline latest trading',
        transform: {
          kind: 'financial_history_shift',
          latestRevenueFactor: 1,
          latestOperatingProfitFactor: 1,
        },
      },
      {
        label: 'Stronger latest trading',
        transform: {
          kind: 'financial_history_shift',
          latestRevenueFactor: 1.15,
          latestOperatingProfitFactor: 1.2,
        },
      },
    ],
    reason: 'Financial history is collected as one spreadsheet question, so audit scenarios move the latest trading block together.',
  }),
};

export function buildQuestionEffectManifest() {
  const liveDefinitions = collectLiveQuestionDefinitions();
  const liveById = indexById(liveDefinitions);
  const ownerBindings = collectOwnerFieldBindings();
  const manifest = {};

  for (const liveQuestion of liveDefinitions) {
    const binding = ownerBindings[liveQuestion.id];
    const spec = contextOnlyQuestionIds[liveQuestion.id] || customAudits[liveQuestion.id] || selectAudits[liveQuestion.id] || numericAudits[liveQuestion.id];

    if (!spec) {
      throw new Error(`Question audit manifest is missing configuration for live question ${liveQuestion.id}.`);
    }

    manifest[liveQuestion.id] = {
      questionId: liveQuestion.id,
      prompt: liveQuestion.prompt,
      questionType: liveQuestion.type,
      canonicalPath: binding?.canonicalPath || null,
      valueType: binding?.valueType || null,
      optionOrder: spec.auditStrategy === 'select_options' ? spec.orderOverride || liveQuestion.optionValues : undefined,
      availableOptionValues: liveQuestion.optionValues,
      ...spec,
    };
  }

  return manifest;
}

export function getQuestionEffectManifest() {
  return buildQuestionEffectManifest();
}

export function listQuestionEffectManifest() {
  return Object.values(buildQuestionEffectManifest());
}

export function getQuestionManifestEntry(questionId) {
  return buildQuestionEffectManifest()[questionId] || null;
}

export function validateQuestionAuditManifest() {
  const manifest = buildQuestionEffectManifest();
  const liveIds = collectLiveQuestionDefinitions().map((question) => question.id).sort();
  const manifestIds = Object.keys(manifest).sort();

  const missing = liveIds.filter((id) => !manifestIds.includes(id));
  const extra = manifestIds.filter((id) => !liveIds.includes(id));

  return {
    valid: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    liveIds,
    manifestIds,
    baselineIds: Object.keys(AUDIT_BASELINES),
  };
}
