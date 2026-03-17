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

export function runMarketApproach(normalizedMetrics, policyGroup) {
  const ownerPhase = policyGroup.ownerPhase;
  if (!ownerPhase.marketMultipleRange) return null;

  const metricValue = getMetricValue(normalizedMetrics, ownerPhase.marketMetric || 'revenue');
  if (metricValue <= 0) return null;

  return {
    method: 'market_multiple',
    low: metricValue * ownerPhase.marketMultipleRange.low,
    mid: metricValue * ownerPhase.marketMultipleRange.mid,
    high: metricValue * ownerPhase.marketMultipleRange.high,
    metric: ownerPhase.marketMetric || 'revenue',
  };
}

export function runCapitalizedEarningsApproach(normalizedMetrics, policyGroup) {
  const ownerPhase = policyGroup.ownerPhase;
  if (!ownerPhase.capitalizationRateRange) return null;

  let metricValue = getMetricValue(normalizedMetrics, ownerPhase.capitalizedMetric || 'adjustedEbit');
  if ((ownerPhase.capitalizedMetric || 'adjustedEbit') === 'adjustedEbitda' && normalizedMetrics.maintenanceCapex > 0) {
    metricValue -= normalizedMetrics.maintenanceCapex;
  }

  if (metricValue <= 0) return null;

  return {
    method: 'capitalized_earnings',
    low: metricValue / ownerPhase.capitalizationRateRange.high,
    mid: metricValue / ownerPhase.capitalizationRateRange.mid,
    high: metricValue / ownerPhase.capitalizationRateRange.low,
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
  };
}

export function runSelectedApproaches(methodOrder, normalizedMetrics, request, policyGroup) {
  return methodOrder
    .map((method) => {
      if (method === 'market_multiple') return runMarketApproach(normalizedMetrics, policyGroup);
      if (method === 'capitalized_earnings') return runCapitalizedEarningsApproach(normalizedMetrics, policyGroup);
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

export function buildMethodNormalizationImpacts(methodOrder, normalizedMetrics, request, policyGroup) {
  const rawMetrics = buildRawComparableMetrics(normalizedMetrics);
  const rawApproaches = runSelectedApproaches(methodOrder, rawMetrics, request, policyGroup);
  const normalizedApproaches = runSelectedApproaches(methodOrder, normalizedMetrics, request, policyGroup);

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
