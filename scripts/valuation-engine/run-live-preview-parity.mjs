import { calculatePartialValuation, buildPreviewCanonicalRequest } from '../../server/valuation/partial-valuation.mjs';
import { evaluateSubmission } from '../../server/valuation/owner-engine.mjs';

const RAW_CASES = [
  {
    id: 'manufacturing',
    label: 'Manufacturing preview parity',
    answers: {
      level1: 'manufacturing',
      level2: 'food_beverage_manufacturing',
      respondentRole: 'owner',
      industryFit: 'mostly_fit',
      businessDescription: 'Packaged foods manufacturer',
      revenueLatest: '250',
      operatingProfitLatest: '35',
      revenuePrevious1: '214',
      operatingProfitPrevious1: '28',
      operatingYears: '5_10',
      primaryState: 'lagos_mainland',
      catchmentArea: 'multi_state',
      differentiation: 'reliability',
      pricingPower: 'some',
      transactionGoal: 'external_sale',
      transactionTimeline: '12_24m',
      proofReadiness: 'organize_fast',
      ownerControl: 'gt_75',
      marketDemand: 'steady_growth',
      capacityUtilization: '70_90',
      equipmentAgeCondition: 'good',
      rawMaterialPriceExposure: 'significant',
      qualityCertifications: 'local',
      inventoryProfile: '7_30',
      traceablePaymentsShare: '50_79',
      bankingQuality: 'mostly_clean',
      financeTracking: 'spreadsheet',
      ownerAbsence2Weeks: 'minor_issues',
      ownerAbsence3Months: 'risky_but_possible',
      managementDepth: 'trusted_manager',
      processDocumentation: 'partly_documented',
      replacementDifficulty: 'possible',
      receivablesLatest: '22',
      inventoryValueLatest: '31',
      payablesLatest: '18',
      maintenanceCapexLatest: '6',
      cashBalance: '15',
      financialDebt: '25',
      shareholderLoans: '5',
    },
  },
  {
    id: 'retail',
    label: 'Retail preview parity',
    answers: {
      level1: 'trade',
      level2: 'retail_chain',
      respondentRole: 'owner',
      industryFit: 'mostly_fit',
      businessDescription: 'Retail chain selling household and convenience goods.',
      revenueLatest: '178',
      operatingProfitLatest: '22',
      operatingYears: '3_5',
      primaryState: 'fct',
      catchmentArea: 'single_state',
      differentiation: 'reliability',
      pricingPower: 'none',
      transactionGoal: 'value_improvement',
      transactionTimeline: '12_24m',
      proofReadiness: 'show_patterns',
      ownerControl: 'gt_75',
      marketDemand: 'flat',
      grossMarginStability: 'stable',
      supplierConcentration: 'moderate',
      shrinkageSpoilage: 'moderate',
      peakSeasonDependency: 'slight',
      inventoryProfile: '30_90',
      traceablePaymentsShare: '80_100',
      bankingQuality: 'mostly_clean',
      financeTracking: 'spreadsheet',
      ownerAbsence2Weeks: 'minor_issues',
      ownerAbsence3Months: 'risky_but_possible',
      managementDepth: 'founder_plus_support',
      processDocumentation: 'partly_documented',
      replacementDifficulty: 'possible',
      receivablesLatest: '4',
      inventoryValueLatest: '26',
      payablesLatest: '13.5',
      maintenanceCapexLatest: '2.5',
      cashBalance: '9',
      financialDebt: '12',
    },
  },
  {
    id: 'recurring_software',
    label: 'Recurring software preview parity',
    answers: {
      level1: 'software',
      level2: 'saas_owned_software',
      respondentRole: 'owner',
      industryFit: 'perfect_fit',
      businessDescription: 'Subscription-based workflow software for growing Nigerian businesses.',
      revenueLatest: '132',
      operatingProfitLatest: '36',
      revenuePrevious1: '94',
      operatingProfitPrevious1: '22',
      operatingYears: '3_5',
      primaryState: 'lagos_island',
      catchmentArea: 'national_multi_base',
      differentiation: 'hard_to_copy',
      pricingPower: 'premium',
      transactionGoal: 'external_sale',
      transactionTimeline: '12_24m',
      proofReadiness: 'immediate',
      ownerControl: 'gt_75',
      marketDemand: 'strong_growth',
      recurringRevenueShare: 'large_share',
      revenueVisibility: 'contract_backed',
      largestSupplierShare: 'lt_20',
      supplierReplacementTime: 'lt_2w',
      criticalHireTime: '3_6m',
      criticalHireSalaryPremium: '10_25',
      traceablePaymentsShare: '80_100',
      bankingQuality: 'clean',
      financeTracking: 'software',
      ownerAbsence2Weeks: 'smooth',
      ownerAbsence3Months: 'limited_disruption',
      managementDepth: 'trusted_manager',
      processDocumentation: 'documented_multi',
      replacementDifficulty: 'possible',
      receivablesLatest: '9',
      payablesLatest: '7',
      maintenanceCapexLatest: '3.5',
      cashBalance: '28',
      financialDebt: '5',
      ownerTotalCompensation: '14',
      marketManagerCompensation: '9',
    },
  },
  {
    id: 'local_service',
    label: 'Local service preview parity',
    answers: {
      level1: 'local_services',
      level2: 'cleaning_hygiene',
      respondentRole: 'owner',
      industryFit: 'mostly_fit',
      businessDescription: 'Commercial cleaning and hygiene services for offices and residential estates.',
      revenueLatest: '92',
      operatingProfitLatest: '16.5',
      revenuePrevious1: '79',
      operatingProfitPrevious1: '13',
      operatingYears: '3_5',
      primaryState: 'lagos_mainland',
      catchmentArea: 'single_state',
      differentiation: 'reliability',
      pricingPower: 'some',
      transactionGoal: 'external_sale',
      transactionTimeline: '12_24m',
      proofReadiness: 'organize_fast',
      ownerControl: 'gt_75',
      marketDemand: 'steady_growth',
      recurringRevenueShare: 'meaningful',
      revenueVisibility: 'contract_backed',
      largestSupplierShare: 'lt_20',
      supplierReplacementTime: 'lt_2w',
      criticalHireTime: '1_3m',
      criticalHireSalaryPremium: 'up_to_10',
      traceablePaymentsShare: '80_100',
      bankingQuality: 'mostly_clean',
      financeTracking: 'spreadsheet',
      ownerAbsence2Weeks: 'minor_issues',
      ownerAbsence3Months: 'risky_but_possible',
      managementDepth: 'trusted_manager',
      processDocumentation: 'partly_documented',
      replacementDifficulty: 'possible',
      receivablesLatest: '11',
      payablesLatest: '5',
      maintenanceCapexLatest: '1',
      cashBalance: '7',
      financialDebt: '2',
      ownerTotalCompensation: '7',
      marketManagerCompensation: '4.2',
    },
  },
];

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function comparePreviewToFull(caseDef) {
  const preview = calculatePartialValuation(caseDef.answers);
  const request = buildPreviewCanonicalRequest(caseDef.answers);
  const full = evaluateSubmission(request);

  assertEqual(`${caseDef.id} adjustedValue`, preview.adjustedValue, full.summary.adjustedValue);
  assertEqual(
    `${caseDef.id} preciseAdjustedValue`,
    preview.preciseAdjustedValue,
    full.audit.calculationLedger.bridge.achievableEquityMid
  );
  assertEqual(`${caseDef.id} lowEstimate`, preview.preciseLowEstimate, full.audit.calculationLedger.bridge.achievableEquityLow);
  assertEqual(`${caseDef.id} highEstimate`, preview.preciseHighEstimate, full.audit.calculationLedger.bridge.achievableEquityHigh);
  assertEqual(`${caseDef.id} readinessScore`, preview.readinessScore, full.summary.readinessScore);
  assertEqual(`${caseDef.id} confidenceScore`, preview.confidenceScore, full.summary.confidenceScore);
  assertEqual(`${caseDef.id} rangeWidthPct`, preview.rangeWidthPct, full.confidenceAssessment.rangeWidthPct);
  assertEqual(`${caseDef.id} primaryMethod`, preview.primaryMethod, full.selectedMethods.primaryMethod);
  assertEqual(
    `${caseDef.id} marketPositionFactor`,
    preview.qualitativeAdjustments?.marketPositionAdjustmentFactor,
    full.valueConclusion.reconciliation?.qualitativeAdjustments?.marketPositionAdjustmentFactor
  );

  return {
    caseId: caseDef.id,
    adjustedValue: preview.adjustedValue,
    readinessScore: preview.readinessScore,
    confidenceScore: preview.confidenceScore,
    primaryMethod: preview.primaryMethod,
    rangeWidthPct: preview.rangeWidthPct,
  };
}

function assertMonotonic(label, rows, direction) {
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    if (direction === 'asc' && current.metric < previous.metric) {
      throw new Error(`${label}: expected ascending movement but ${current.label} (${current.metric}) is below ${previous.label} (${previous.metric}).`);
    }
    if (direction === 'desc' && current.metric > previous.metric) {
      throw new Error(`${label}: expected descending movement but ${current.label} (${current.metric}) is above ${previous.label} (${previous.metric}).`);
    }
  }
}

function assertDistinct(label, rows) {
  const uniqueMetricValues = new Set(rows.map((row) => row.metric));
  if (uniqueMetricValues.size !== rows.length) {
    throw new Error(`${label}: expected distinct movement across all options, but received repeated metric values.`);
  }
}

function runSensitivityCheck({ label, baseAnswers, field, values, metric, direction, requireDistinct = false }) {
  const rows = values.map(({ value, label: optionLabel }) => {
    const preview = calculatePartialValuation({ ...baseAnswers, [field]: value });
    return {
      label: optionLabel,
      metric: metric(preview),
      adjustedValue: preview.adjustedValue,
      confidenceScore: preview.confidenceScore,
      readinessScore: preview.readinessScore,
    };
  });

  assertMonotonic(label, rows, direction);
  if (requireDistinct) {
    assertDistinct(label, rows);
  }

  return rows;
}

function main() {
  const parityRows = RAW_CASES.map(comparePreviewToFull);
  console.log('Preview parity checks');
  console.table(parityRows);

  const retailBase = RAW_CASES.find((entry) => entry.id === 'retail').answers;
  const softwareBase = RAW_CASES.find((entry) => entry.id === 'recurring_software').answers;

  const movementChecks = [
    {
      label: 'catchmentArea adjusted value',
      rows: runSensitivityCheck({
        label: 'catchmentArea adjusted value',
        baseAnswers: retailBase,
        field: 'catchmentArea',
        values: [
          { value: 'local_city', label: 'Local city' },
          { value: 'single_state', label: 'Single state' },
          { value: 'multi_state', label: 'Multi-state' },
          { value: 'national_single_base', label: 'National single base' },
          { value: 'national_multi_base', label: 'National multi-base' },
          { value: 'international', label: 'International' },
        ],
        metric: (preview) => preview.preciseAdjustedValue ?? preview.adjustedValue,
        direction: 'asc',
        requireDistinct: true,
      }),
    },
    {
      label: 'pricingPower adjusted value',
      rows: runSensitivityCheck({
        label: 'pricingPower adjusted value',
        baseAnswers: softwareBase,
        field: 'pricingPower',
        values: [
          { value: 'none', label: 'None' },
          { value: 'some', label: 'Some' },
          { value: 'premium', label: 'Premium' },
          { value: 'strong_premium', label: 'Strong premium' },
        ],
        metric: (preview) => preview.preciseAdjustedValue ?? preview.adjustedValue,
        direction: 'asc',
        requireDistinct: true,
      }),
    },
    {
      label: 'transactionTimeline adjusted value',
      rows: runSensitivityCheck({
        label: 'transactionTimeline adjusted value',
        baseAnswers: softwareBase,
        field: 'transactionTimeline',
        values: [
          { value: 'gt_24m', label: 'More than 24 months' },
          { value: '12_24m', label: '12 to 24 months' },
          { value: '6_12m', label: '6 to 12 months' },
          { value: 'within_6m', label: 'Within 6 months' },
        ],
        metric: (preview) => preview.preciseAdjustedValue ?? preview.adjustedValue,
        direction: 'desc',
      }),
    },
    {
      label: 'bankingQuality confidence',
      rows: runSensitivityCheck({
        label: 'bankingQuality confidence',
        baseAnswers: retailBase,
        field: 'bankingQuality',
        values: [
          { value: 'clean', label: 'Clean' },
          { value: 'mostly_clean', label: 'Mostly clean' },
          { value: 'mixed', label: 'Mixed' },
          { value: 'informal', label: 'Informal' },
        ],
        metric: (preview) => preview.confidenceScore,
        direction: 'desc',
      }),
    },
    {
      label: 'traceablePaymentsShare adjusted value',
      rows: runSensitivityCheck({
        label: 'traceablePaymentsShare adjusted value',
        baseAnswers: retailBase,
        field: 'traceablePaymentsShare',
        values: [
          { value: '80_100', label: '80% to 100%' },
          { value: '50_79', label: '50% to 79%' },
          { value: '20_49', label: '20% to 49%' },
          { value: 'lt_20', label: 'Less than 20%' },
        ],
        metric: (preview) => preview.preciseAdjustedValue ?? preview.adjustedValue,
        direction: 'desc',
      }),
    },
  ];

  console.log('\nTargeted movement checks');
  for (const check of movementChecks) {
    console.log(`\n${check.label}`);
    console.table(check.rows);
  }
}

main();
