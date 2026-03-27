import { evaluateSubmission } from './owner-engine.mjs';
import { adaptOwnerRequest } from './owner-request-adapter.mjs';

function toNumber(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLatestFinancialSignal(answers) {
  const periods = Array.isArray(answers?._financialPeriods) ? answers._financialPeriods : [];
  const latestPeriod = periods.find(
    (period) => period && typeof period === 'object' && String(period.id || '') === 'latest'
  );

  if (latestPeriod) {
    return {
      revenue: toNumber(latestPeriod.revenue),
      operatingProfit: toNumber(latestPeriod.operatingProfit),
    };
  }

  return {
    revenue: toNumber(answers?.revenueLatest),
    operatingProfit: toNumber(answers?.operatingProfitLatest),
  };
}

function getFinancialPeriodSignals(answers) {
  const periods = Array.isArray(answers?._financialPeriods) ? answers._financialPeriods : [];
  const getSignal = (id, revenueFallback, profitFallback) => {
    const period = periods.find(
      (item) => item && typeof item === 'object' && String(item.id || '') === id
    );
    if (period) {
      return {
        revenue: toNumber(period.revenue),
        operatingProfit: toNumber(period.operatingProfit),
      };
    }

    return {
      revenue: toNumber(revenueFallback),
      operatingProfit: toNumber(profitFallback),
    };
  };

  return {
    latest: getSignal('latest', answers?.revenueLatest, answers?.operatingProfitLatest),
    prior1: getSignal('prior1', answers?.revenuePrevious1 ?? answers?.revenuePrev1, answers?.operatingProfitPrevious1 ?? answers?.operatingProfitPrev1),
    prior2: getSignal('prior2', answers?.revenuePrevious2 ?? answers?.revenuePrev2, answers?.operatingProfitPrevious2 ?? answers?.operatingProfitPrev2),
  };
}

function hasMinimumPreviewInputs(answers) {
  const level1 = String(answers?.level1 ?? '').trim();
  const level2 = String(answers?.level2 ?? '').trim();
  const latestFinancialSignal = getLatestFinancialSignal(answers);

  return Boolean(level1 && level2 && (latestFinancialSignal.revenue > 0 || latestFinancialSignal.operatingProfit > 0));
}

function determinePhase(answers) {
  const hasBranchData =
    answers?.productRights ||
    answers?.quantities ||
    answers?.productCustomisation ||
    answers?.grossMarginStability ||
    answers?.founderRevenueDependence ||
    answers?.staffUtilization ||
    answers?.capacityUtilization ||
    answers?.manufacturingValueCreation;
  const hasClosingData = answers?.ownerAbsence2Weeks || answers?.receivablesLatest !== undefined;

  if (hasClosingData) return 'closing';
  if (hasBranchData) return 'branch';
  if (hasMinimumPreviewInputs(answers)) return 'anchor';
  return 'initial';
}

function getNextPhase(currentPhase) {
  const phases = ['initial', 'anchor', 'branch', 'closing'];
  const currentIndex = phases.indexOf(currentPhase);
  return phases[currentIndex + 1] || 'final';
}

function mapConfidenceLevel(score) {
  if (score <= 25) return 'very_low';
  if (score <= 40) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'very_high';
}

function buildPreviewCanonicalRequest(answers) {
  const safeAnswers = answers || {};
  const periodSignals = getFinancialPeriodSignals(safeAnswers);
  const previewAnswers = {
    ...safeAnswers,
    revenueLatest:
      String(safeAnswers.revenueLatest ?? '').trim() !== ''
        ? safeAnswers.revenueLatest
        : periodSignals.latest.revenue > 0
          ? String(periodSignals.latest.revenue)
          : safeAnswers.revenueLatest,
    operatingProfitLatest:
      String(safeAnswers.operatingProfitLatest ?? '').trim() !== ''
        ? safeAnswers.operatingProfitLatest
        : periodSignals.latest.operatingProfit !== 0
          ? String(periodSignals.latest.operatingProfit)
          : safeAnswers.operatingProfitLatest,
    revenuePrevious1:
      String(safeAnswers.revenuePrevious1 ?? safeAnswers.revenuePrev1 ?? '').trim() !== ''
        ? (safeAnswers.revenuePrevious1 ?? safeAnswers.revenuePrev1)
        : periodSignals.prior1.revenue > 0
          ? String(periodSignals.prior1.revenue)
          : safeAnswers.revenuePrevious1,
    operatingProfitPrevious1:
      String(safeAnswers.operatingProfitPrevious1 ?? safeAnswers.operatingProfitPrev1 ?? '').trim() !== ''
        ? (safeAnswers.operatingProfitPrevious1 ?? safeAnswers.operatingProfitPrev1)
        : periodSignals.prior1.operatingProfit !== 0
          ? String(periodSignals.prior1.operatingProfit)
          : safeAnswers.operatingProfitPrevious1,
    revenuePrevious2:
      String(safeAnswers.revenuePrevious2 ?? safeAnswers.revenuePrev2 ?? '').trim() !== ''
        ? (safeAnswers.revenuePrevious2 ?? safeAnswers.revenuePrev2)
        : periodSignals.prior2.revenue > 0
          ? String(periodSignals.prior2.revenue)
          : safeAnswers.revenuePrevious2,
    operatingProfitPrevious2:
      String(safeAnswers.operatingProfitPrevious2 ?? safeAnswers.operatingProfitPrev2 ?? '').trim() !== ''
        ? (safeAnswers.operatingProfitPrevious2 ?? safeAnswers.operatingProfitPrev2)
        : periodSignals.prior2.operatingProfit !== 0
          ? String(periodSignals.prior2.operatingProfit)
          : safeAnswers.operatingProfitPrevious2,
  };
  const request = adaptOwnerRequest(previewAnswers);
  request.company.businessName = request.company.businessName || 'Your Business';
  request.company.firstName = request.company.firstName || 'Business Owner';
  request.company.email = request.company.email || 'preview@afrexit.local';
  request.company.whatsapp = request.company.whatsapp || '00000000000';
  return request;
}

function buildPreviewFlags(result) {
  const warningFlags = (result.redFlags || result.summary?.warnings || []).slice(0, 4).map((message) => ({
    type: 'warning',
    message,
  }));

  const infoFlags = [];
  const assumptions = result.assumptions || [];

  if (assumptions.some((assumption) => assumption.includes('Current-year forecast inputs'))) {
    infoFlags.push({
      type: 'info',
      message: 'Current-year forecast inputs are included with cautious weight in this live estimate.',
      field: 'revenueLatest',
    });
  }

  if (assumptions.some((assumption) => assumption.includes('Shorter transaction timing'))) {
    infoFlags.push({
      type: 'info',
      message: 'A shorter transaction timeline is reducing achievable-today value in the live estimate.',
      field: 'transactionTimeline',
    });
  }

  return [...warningFlags, ...infoFlags].slice(0, 6);
}

function buildFactorCards(result) {
  const qualitativeAdjustments =
    result.valueConclusion?.reconciliation?.qualitativeAdjustments || result.audit?.qualitativeAdjustments || {};
  const factors = result.audit?.calculationLedger?.qualitativeFactors || [];

  return factors.map((factor) => ({
    key: factor.key,
    label: factor.label,
    factor: factor.factor,
    note: factor.note,
    appliesTo: factor.appliesTo || [],
    signalScore:
      factor.key === 'market_position'
        ? qualitativeAdjustments.marketPositionSignalScore
        : factor.key === 'branch_quality'
          ? qualitativeAdjustments.branchSignalScore
          : undefined,
  }));
}

function formatDriverMetricLabel(value) {
  switch (value) {
    case 'adjustedEbit':
      return 'adjusted EBIT';
    case 'adjustedEbitda':
      return 'adjusted EBITDA';
    case 'sde':
      return 'SDE';
    case 'revenue':
      return 'revenue';
    default:
      return String(value || '').replaceAll('_', ' ');
  }
}

function buildPrimaryMethodDetail(result) {
  const primaryMethod = result?.selectedMethods?.primaryMethod;
  if (!primaryMethod) return null;

  const ledgerEntry = result?.audit?.calculationLedger?.approaches?.find((approach) => approach.method === primaryMethod);
  if (!ledgerEntry || typeof ledgerEntry.driverValue !== 'number' || !Number.isFinite(ledgerEntry.driverValue)) {
    return primaryMethod.replaceAll('_', ' ');
  }

  const preAdjustmentMid = ledgerEntry.preAdjustment?.mid;
  if (typeof preAdjustmentMid !== 'number' || !Number.isFinite(preAdjustmentMid) || preAdjustmentMid === 0) {
    return primaryMethod.replaceAll('_', ' ');
  }

  if (primaryMethod === 'market_multiple' && ledgerEntry.driverValue !== 0) {
    const multiple = preAdjustmentMid / ledgerEntry.driverValue;
    return `market multiple (${multiple.toFixed(2)}x ${formatDriverMetricLabel(ledgerEntry.metric)})`;
  }

  if (primaryMethod === 'capitalized_earnings') {
    const capRate = ledgerEntry.driverValue / preAdjustmentMid;
    return `capitalized earnings (${(capRate * 100).toFixed(1)}% cap rate on ${formatDriverMetricLabel(ledgerEntry.metric)})`;
  }

  return primaryMethod.replaceAll('_', ' ');
}

export function calculatePartialValuation(answers) {
  const phase = determinePhase(answers);
  const nextPhase = getNextPhase(phase);

  if (!hasMinimumPreviewInputs(answers)) {
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
      flags: [{ type: 'warning', message: 'Insufficient data for a live estimate.' }],
      phase: 'initial',
      nextPhase: 'anchor',
      primaryMethod: null,
      primaryMethodDetail: null,
      scorecard: null,
      qualitativeAdjustments: null,
      factorCards: [],
      fundamentalEnterpriseMid: null,
      achievableEnterpriseMid: null,
      bridgeDelta: null,
      sourceModel: 'owner_engine',
    };
  }

  const request = buildPreviewCanonicalRequest(answers);
  const result = evaluateSubmission(request);
  const qualitativeAdjustments =
    result.valueConclusion?.reconciliation?.qualitativeAdjustments || result.audit?.qualitativeAdjustments || {};
  const preciseLowEstimate = result.audit?.calculationLedger?.bridge?.achievableEquityLow ?? result.summary.lowEstimate;
  const preciseAdjustedValue = result.audit?.calculationLedger?.bridge?.achievableEquityMid ?? result.summary.adjustedValue;
  const preciseHighEstimate = result.audit?.calculationLedger?.bridge?.achievableEquityHigh ?? result.summary.highEstimate;

  return {
    range: {
      low: preciseLowEstimate,
      high: preciseHighEstimate,
      mid: preciseAdjustedValue,
    },
    adjustedValue: result.summary.adjustedValue,
    preciseAdjustedValue,
    preciseLowEstimate,
    preciseHighEstimate,
    readinessScore: result.summary.readinessScore,
    confidence: mapConfidenceLevel(result.summary.confidenceScore),
    confidenceScore: result.summary.confidenceScore,
    rangeWidthPct: result.confidenceAssessment.rangeWidthPct,
    confidenceBreakdown: {
      dataCompleteness: result.confidenceAssessment.dataCompleteness,
      recordsQuality: result.confidenceAssessment.recordsQuality,
      benchmarkCoverage: result.confidenceAssessment.benchmarkCoverage,
    },
    flags: buildPreviewFlags(result),
    phase,
    nextPhase,
    primaryMethod: result.selectedMethods.primaryMethod,
    primaryMethodDetail: buildPrimaryMethodDetail(result),
    scorecard: result.summary.scorecard,
    qualitativeAdjustments,
    factorCards: buildFactorCards(result),
    fundamentalEnterpriseMid: result.audit?.calculationLedger?.bridge?.fundamentalEnterpriseMid ?? null,
    achievableEnterpriseMid: result.audit?.calculationLedger?.bridge?.achievableEnterpriseMid ?? null,
    bridgeDelta: result.audit?.calculationLedger?.bridge?.bridgeDelta ?? null,
    sourceModel: 'owner_engine',
  };
}

export { buildPreviewCanonicalRequest };
