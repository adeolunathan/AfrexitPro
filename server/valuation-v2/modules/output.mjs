import { roundIfNumber } from './utils.mjs';

export function ratingFromReadiness(score) {
  if (score >= 80) return 'Strong Exit Readiness';
  if (score >= 65) return 'Developing Sell-Side Readiness';
  if (score >= 50) return 'Early Readiness';
  return 'Needs Foundational Work';
}

export function buildRedFlags(request, readinessAssessment, confidenceAssessment, normalizedMetrics, historicalSummary, selectedMethods) {
  const flags = [];

  if (normalizedMetrics.revenue <= 0 && (normalizedMetrics.adjustedEbit || 0) <= 0) {
    flags.push('The business does not yet have enough positive operating data for a meaningful owner-phase estimate.');
  }
  if (historicalSummary.yearsAvailable < 2) {
    flags.push('Only one year of financial history is currently available, so trend confidence is still limited.');
  }
  if (readinessAssessment.recordsQuality < 50) {
    flags.push('Financial records are still too weak for a tight valuation range.');
  }
  if (readinessAssessment.managementDepth < 50) {
    flags.push('Founder dependence is still high and may reduce value achievable today.');
  }
  if (readinessAssessment.customerTransferability < 50) {
    flags.push('Revenue transferability is weak because of concentration or founder-linked sales.');
  }
  if (confidenceAssessment.overallScore < 55) {
    flags.push('Confidence is modest, so the current range should be treated as provisional.');
  }
  if (request.normalization.schedule.length > 0) {
    flags.push('Normalization adjustments rely on owner estimates and should be verified during advisor review or diligence.');
  }
  if (Math.abs(normalizedMetrics.workingCapitalDelta || 0) > normalizedMetrics.revenue * 0.08) {
    flags.push('Working-capital needs differ materially from the current balance sheet and may change equity value at deal time.');
  }
  if (selectedMethods.primaryMethod === 'asset_approach') {
    flags.push('The current result leans heavily on a floor or asset-style method because maintainable earnings support is limited.');
  }

  return flags.slice(0, 6);
}

export function buildAssumptions(request, selectedMethods, historicalSummary, normalizedMetrics, policyGroup) {
  const assumptions = [
    'Owner-mode output is a first-pass valuation estimate, not a full analyst-reviewed conclusion.',
    'Current financial inputs are treated as owner-provided and unverified unless advisor evidence is later added.',
    `Methods were selected automatically from Level 2 policy group ${selectedMethods.policyGroupId}.`,
  ];

  if (historicalSummary.yearsAvailable > 1) {
    assumptions.push('Representative earnings are blended across the available owner history rather than relying on only one year.');
  }
  if (historicalSummary.yearsAvailable < 3) {
    assumptions.push('Historical financial depth is still limited relative to an advisor-grade engagement.');
  }
  if (request.normalization.schedule.length > 0) {
    assumptions.push('Owner-mode normalization amounts have been captured explicitly, but they are still treated as owner estimates until verified.');
  }
  if (typeof normalizedMetrics.normalizedWorkingCapital === 'number') {
    assumptions.push('A normalized working-capital requirement is inferred from business-model policy and current owner inputs.');
  }
  if (policyGroup?.calibration?.source === 'benchmark_calibrated') {
    assumptions.push(
      `Owner-phase numeric assumptions were calibrated against ${policyGroup.calibration.observationCount} benchmark observations across ${policyGroup.calibration.benchmarkSetIds.length} benchmark set(s).`
    );
  }

  return assumptions;
}

export function buildOwnerResult({
  engineVersion,
  request,
  policyGroup,
  historicalSummary,
  scorecard,
  selectedMethods,
  normalizedMetrics,
  values,
  readinessAssessment,
  confidenceAssessment,
  redFlags,
  assumptions,
  approaches,
  methodNormalizationImpacts,
}) {
  const rating = ratingFromReadiness(readinessAssessment.overallScore);
  const warnings = [...redFlags];

  return {
    meta: {
      requestId: request.meta.requestId,
      engineVersion,
      mode: request.meta.mode,
      generatedAt: new Date().toISOString(),
      experimental: true,
    },
    engagement: {
      purpose: request.engagement.purpose,
      urgency: request.engagement.urgency,
      standardOfValue: request.engagement.standardOfValue,
      premiseOfValue: request.engagement.premiseOfValue,
    },
    classification: {
      level1: request.classification.level1,
      level2: request.classification.level2,
      policyGroupId: policyGroup.id,
    },
    summary: {
      businessName: request.company.businessName,
      lowEstimate: Math.round(values.equityValue.achievableTodayLow),
      adjustedValue: Math.round(values.equityValue.achievableTodayMid),
      highEstimate: Math.round(values.equityValue.achievableTodayHigh),
      readinessScore: readinessAssessment.overallScore,
      confidenceScore: confidenceAssessment.overallScore,
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
    },
    historyAnalysis: {
      yearsAvailable: historicalSummary.yearsAvailable,
      representativePeriodId: historicalSummary.representativePeriodId,
      representativeRevenue: Math.round(historicalSummary.representativeRevenue),
      representativeOperatingProfit: Math.round(historicalSummary.representativeOperatingProfit),
      revenueGrowthPct:
        typeof historicalSummary.revenueGrowthPct === 'number'
          ? Number(historicalSummary.revenueGrowthPct.toFixed(4))
          : null,
      revenueStabilityScore: Math.round(historicalSummary.revenueStabilityScore),
      marginStabilityScore: Math.round(historicalSummary.marginStabilityScore),
      periods: historicalSummary.periodSummaries.map((period) => ({
        periodId: period.periodId,
        label: period.label,
        revenue: Math.round(period.revenue),
        operatingProfit: Math.round(period.operatingProfit),
        operatingMarginPct:
          typeof period.operatingMarginPct === 'number' ? Number(period.operatingMarginPct.toFixed(4)) : null,
        workingCapital: roundIfNumber(period.workingCapital),
        maintenanceCapex: roundIfNumber(period.maintenanceCapex),
        isLatest: period.isLatest,
      })),
    },
    calibrationContext: {
      source: policyGroup.calibration?.source || 'registry_default',
      benchmarkSetIds: policyGroup.calibration?.benchmarkSetIds || [],
      observationCount: policyGroup.calibration?.observationCount || 0,
      evidenceScore: policyGroup.calibration?.evidenceScore || 0,
      lastCalibrated: policyGroup.calibration?.lastCalibrated,
      freshnessStatus: policyGroup.calibration?.freshnessStatus,
      freshestBenchmarkDate: policyGroup.calibration?.freshestBenchmarkDate,
      freshnessDays: policyGroup.calibration?.freshnessDays,
      sourceReliabilityScore: policyGroup.calibration?.sourceReliabilityScore,
      sourceMix: policyGroup.calibration?.sourceMix || [],
      internalObservationCount: policyGroup.calibration?.internalObservationCount || 0,
      transactionObservationShare: policyGroup.calibration?.transactionObservationShare,
      notes: policyGroup.calibration?.notes || [],
    },
    selectedMethods,
    normalizationSchedule: request.normalization.schedule.map((item) => ({
      ...item,
      reportedAmount: roundIfNumber(item.reportedAmount),
      normalizedAmount: roundIfNumber(item.normalizedAmount),
      adjustmentAmount: Math.round(item.adjustmentAmount),
    })),
    normalizedMetrics: {
      representativePeriodId: normalizedMetrics.representativePeriodId,
      revenue: Math.round(normalizedMetrics.revenue),
      sde: roundIfNumber(normalizedMetrics.sde),
      adjustedEbitda: roundIfNumber(normalizedMetrics.adjustedEbitda),
      adjustedEbit: roundIfNumber(normalizedMetrics.adjustedEbit),
      actualWorkingCapital: roundIfNumber(normalizedMetrics.actualWorkingCapital),
      normalizedWorkingCapital: roundIfNumber(normalizedMetrics.normalizedWorkingCapital),
      maintenanceCapex: roundIfNumber(normalizedMetrics.maintenanceCapex),
      netDebt: roundIfNumber(normalizedMetrics.netDebt),
    },
    valueConclusion: {
      enterpriseValue: {
        fundamentalLow: Math.round(values.enterpriseValue.fundamentalLow),
        fundamentalMid: Math.round(values.enterpriseValue.fundamentalMid),
        fundamentalHigh: Math.round(values.enterpriseValue.fundamentalHigh),
        achievableTodayLow: Math.round(values.enterpriseValue.achievableTodayLow),
        achievableTodayMid: Math.round(values.enterpriseValue.achievableTodayMid),
        achievableTodayHigh: Math.round(values.enterpriseValue.achievableTodayHigh),
        forcedSaleLow: roundIfNumber(values.enterpriseValue.forcedSaleLow),
        forcedSaleMid: roundIfNumber(values.enterpriseValue.forcedSaleMid),
        forcedSaleHigh: roundIfNumber(values.enterpriseValue.forcedSaleHigh),
      },
      equityValue: {
        fundamentalLow: Math.round(values.equityValue.fundamentalLow),
        fundamentalMid: Math.round(values.equityValue.fundamentalMid),
        fundamentalHigh: Math.round(values.equityValue.fundamentalHigh),
        achievableTodayLow: Math.round(values.equityValue.achievableTodayLow),
        achievableTodayMid: Math.round(values.equityValue.achievableTodayMid),
        achievableTodayHigh: Math.round(values.equityValue.achievableTodayHigh),
        forcedSaleLow: roundIfNumber(values.equityValue.forcedSaleLow),
        forcedSaleMid: roundIfNumber(values.equityValue.forcedSaleMid),
        forcedSaleHigh: roundIfNumber(values.equityValue.forcedSaleHigh),
      },
      reconciliation: {
        marketApproach: roundIfNumber(approaches.find((approach) => approach.method === 'market_multiple')?.mid),
        incomeApproach: roundIfNumber(approaches.find((approach) => approach.method === 'capitalized_earnings')?.mid),
        assetApproach: roundIfNumber(approaches.find((approach) => approach.method === 'asset_approach')?.mid),
        appliedWeights: values.appliedWeights,
        methodNormalizationImpacts: methodNormalizationImpacts.map((impact) => ({
          method: impact.method,
          driverMetric: impact.driverMetric,
          rawDriverMetricValue: roundIfNumber(impact.rawDriverMetricValue),
          normalizedDriverMetricValue: roundIfNumber(impact.normalizedDriverMetricValue),
          rawMid: roundIfNumber(impact.rawMid),
          normalizedMid: roundIfNumber(impact.normalizedMid),
          deltaMid: roundIfNumber(impact.deltaMid),
        })),
      },
    },
    readinessAssessment,
    confidenceAssessment,
    redFlags,
    assumptions,
    audit: {
      warnings,
      validationPassed: true,
    },
  };
}
