import { buildBranchQualityAdjustment, buildFxExposureAdjustment, buildMarketPositionAdjustment } from './qualitative-adjustments.mjs';

function getMetricValue(normalizedMetrics, metricName) {
  switch (metricName) {
    case 'sde':
      return normalizedMetrics.sde || 0;
    case 'adjustedEbitda':
      return normalizedMetrics.adjustedEbitda || 0;
    case 'adjustedEbit':
      return normalizedMetrics.adjustedEbit || 0;
    case 'revenue':
    default:
      return normalizedMetrics.revenue || 0;
  }
}

export function runMarketApproach(normalizedMetrics, policyGroup, branchQualityFactor = 1) {
  const ownerPhase = policyGroup.ownerPhase;
  if (!ownerPhase.marketMultipleRange) return null;

  const metricValue = getMetricValue(normalizedMetrics, ownerPhase.marketMetric || 'revenue');
  if (metricValue <= 0) return null;

  return {
    method: 'market_multiple',
    low: metricValue * ownerPhase.marketMultipleRange.low * branchQualityFactor,
    mid: metricValue * ownerPhase.marketMultipleRange.mid * branchQualityFactor,
    high: metricValue * ownerPhase.marketMultipleRange.high * branchQualityFactor,
    metric: ownerPhase.marketMetric || 'revenue',
  };
}

export function runCapitalizedEarningsApproach(normalizedMetrics, policyGroup, branchQualityFactor = 1) {
  const ownerPhase = policyGroup.ownerPhase;
  if (!ownerPhase.capitalizationRateRange) return null;

  let metricValue = getMetricValue(normalizedMetrics, ownerPhase.capitalizedMetric || 'adjustedEbit');
  if ((ownerPhase.capitalizedMetric || 'adjustedEbit') === 'adjustedEbitda' && normalizedMetrics.maintenanceCapex > 0) {
    metricValue -= normalizedMetrics.maintenanceCapex;
  }

  if (metricValue <= 0) return null;

  return {
    method: 'capitalized_earnings',
    low: (metricValue / ownerPhase.capitalizationRateRange.high) * branchQualityFactor,
    mid: (metricValue / ownerPhase.capitalizationRateRange.mid) * branchQualityFactor,
    high: (metricValue / ownerPhase.capitalizationRateRange.low) * branchQualityFactor,
    metric: ownerPhase.capitalizedMetric || 'adjustedEbit',
  };
}

export function runAssetApproach(normalizedMetrics, request, policyGroup) {
  const ownerPhase = policyGroup.ownerPhase;
  const revenueFloor = normalizedMetrics.revenue * (ownerPhase.assetFloorRevenuePct || 0);
  const tangibleWorkingCapital = Math.max(normalizedMetrics.actualWorkingCapital || 0, 0) * 0.35;
  const cashAndEquivalents = request.bridge.cashAndEquivalents || 0;
  const nonOperatingAssets = request.bridge.nonOperatingAssets || 0;
  const debtBurden = (request.bridge.interestBearingDebt || 0) * 0.15;
  const base = Math.max(revenueFloor + tangibleWorkingCapital + cashAndEquivalents + nonOperatingAssets - debtBurden, 0);

  if (base <= 0) return null;

  return {
    method: 'asset_approach',
    low: base * 0.9,
    mid: base,
    high: base * 1.1,
    metric: 'asset_floor',
    ledger: {
      method: 'asset_approach',
      metric: 'asset_floor',
      driverValue: base,
      postAdjustment: {
        low: base * 0.9,
        mid: base,
        high: base * 1.1,
      },
      qualitativeFactor: 1,
      qualitativeFactors: [],
      formula: 'asset floor = revenue floor + tangible working capital support + cash + non-operating assets - debt burden',
    },
  };
}

export function runSelectedApproaches(methodOrder, normalizedMetrics, request, policyGroup, branchQuality = buildBranchQualityAdjustment(request)) {
  const branchQualityFactor = branchQuality.branchQualityFactor || 1;
  const marketPositionFactor = buildMarketPositionAdjustment(request).marketPositionAdjustmentFactor || 1;
  const fxExposureFactor = buildFxExposureAdjustment(request).fxExposureAdjustmentFactor || 1;
  const qualitativeMethodFactor = branchQualityFactor * marketPositionFactor * fxExposureFactor;
  const qualitativeFactors = [
    {
      key: 'branch_quality',
      label: 'Branch-quality factor',
      factor: branchQualityFactor,
      note: 'Applies to market and capitalized-earnings methods only.',
      appliesTo: ['market_multiple', 'capitalized_earnings'],
    },
    {
      key: 'market_position',
      label: 'Market-position factor',
      factor: marketPositionFactor,
      note: 'Derived from catchment breadth, differentiation, and pricing power.',
      appliesTo: ['market_multiple', 'capitalized_earnings'],
    },
    {
      key: 'fx_exposure',
      label: 'FX sensitivity factor',
      factor: fxExposureFactor,
      note: 'Capped sensitivity discount for foreign-currency-linked exposure.',
      appliesTo: ['market_multiple', 'capitalized_earnings'],
    },
  ];

  return methodOrder
    .map((method) => {
      if (method === 'market_multiple') {
        const raw = runMarketApproach(normalizedMetrics, policyGroup, 1);
        if (!raw) return null;
        const adjusted = runMarketApproach(normalizedMetrics, policyGroup, qualitativeMethodFactor);
        return {
          ...adjusted,
          ledger: {
            method: 'market_multiple',
            metric: adjusted.metric,
            driverValue: getMetricValue(normalizedMetrics, policyGroup.ownerPhase.marketMetric || 'revenue'),
            preAdjustment: {
              low: raw.low,
              mid: raw.mid,
              high: raw.high,
            },
            postAdjustment: {
              low: adjusted.low,
              mid: adjusted.mid,
              high: adjusted.high,
            },
            qualitativeFactor: Number(qualitativeMethodFactor.toFixed(4)),
            qualitativeFactors,
            formula: `market multiple = ${adjusted.metric} × selected low/mid/high multiple × combined qualitative factor`,
          },
        };
      }

      if (method === 'capitalized_earnings') {
        const raw = runCapitalizedEarningsApproach(normalizedMetrics, policyGroup, 1);
        if (!raw) return null;
        const adjusted = runCapitalizedEarningsApproach(normalizedMetrics, policyGroup, qualitativeMethodFactor);
        return {
          ...adjusted,
          ledger: {
            method: 'capitalized_earnings',
            metric: adjusted.metric,
            driverValue: getMetricValue(normalizedMetrics, policyGroup.ownerPhase.capitalizedMetric || 'adjustedEbit'),
            preAdjustment: {
              low: raw.low,
              mid: raw.mid,
              high: raw.high,
            },
            postAdjustment: {
              low: adjusted.low,
              mid: adjusted.mid,
              high: adjusted.high,
            },
            qualitativeFactor: Number(qualitativeMethodFactor.toFixed(4)),
            qualitativeFactors,
            formula: `capitalized earnings = maintainable metric ÷ capitalization rate × combined qualitative factor`,
          },
        };
      }

      if (method === 'asset_approach') return runAssetApproach(normalizedMetrics, request, policyGroup);
      return null;
    })
    .filter(Boolean);
}

function buildRawComparableMetrics(normalizedMetrics) {
  return {
    ...normalizedMetrics,
    adjustedEbit: normalizedMetrics.rawEbit ?? normalizedMetrics.adjustedEbit ?? 0,
    adjustedEbitda: normalizedMetrics.rawEbitda ?? normalizedMetrics.adjustedEbitda ?? 0,
    sde: normalizedMetrics.rawSde ?? normalizedMetrics.sde ?? 0,
  };
}

export function buildMethodNormalizationImpacts(methodOrder, normalizedMetrics, request, policyGroup, branchQuality = buildBranchQualityAdjustment(request)) {
  const rawMetrics = buildRawComparableMetrics(normalizedMetrics);
  const rawApproaches = runSelectedApproaches(methodOrder, rawMetrics, request, policyGroup, branchQuality);
  const normalizedApproaches = runSelectedApproaches(methodOrder, normalizedMetrics, request, policyGroup, branchQuality);

  return methodOrder.map((method) => {
    const rawApproach = rawApproaches.find((approach) => approach.method === method);
    const normalizedApproach = normalizedApproaches.find((approach) => approach.method === method);
    const driverMetric = normalizedApproach?.metric || rawApproach?.metric || 'not_available';

    return {
      method,
      driverMetric,
      rawDriverMetricValue:
        method === 'market_multiple'
          ? getMetricValue(rawMetrics, policyGroup.ownerPhase.marketMetric || 'revenue')
          : method === 'capitalized_earnings'
            ? getMetricValue(rawMetrics, policyGroup.ownerPhase.capitalizedMetric || 'adjustedEbit')
            : undefined,
      normalizedDriverMetricValue:
        method === 'market_multiple'
          ? getMetricValue(normalizedMetrics, policyGroup.ownerPhase.marketMetric || 'revenue')
          : method === 'capitalized_earnings'
            ? getMetricValue(normalizedMetrics, policyGroup.ownerPhase.capitalizedMetric || 'adjustedEbit')
            : undefined,
      rawMid: rawApproach?.mid,
      normalizedMid: normalizedApproach?.mid,
      deltaMid:
        typeof rawApproach?.mid === 'number' && typeof normalizedApproach?.mid === 'number'
          ? normalizedApproach.mid - rawApproach.mid
          : undefined,
    };
  });
}
