const ownerLedPolicyGroups = new Set(['PG_PROFESSIONAL_OWNER_LED', 'PG_LOCAL_SERVICE_OWNER_OP', 'PG_CREATIVE_AGENCY']);
const assetHeavyPolicyGroups = new Set([
  'PG_ASSET_HEAVY_MANUFACTURING',
  'PG_CONTRACT_MANUFACTURING',
  'PG_LOGISTICS_ASSET',
  'PG_PROPERTY_ASSET_NAV',
  'PG_AGRO_PROCESSING',
  'PG_HEALTHCARE_DISTRIBUTION',
]);

function pushMethod(methods, method) {
  if (method && !methods.includes(method)) {
    methods.push(method);
  }
}

export function selectOwnerMethods(request, policyGroup, normalizedMetrics, scorecard, historicalSummary) {
  const methods = [];
  const rationale = [`Level 2 policy group ${policyGroup.id} selected from business model classification.`];
  const yearsAvailable = historicalSummary.yearsAvailable;
  const financialQuality = scorecard.financialQuality;
  const ownerIndependence = scorecard.ownerIndependence;
  const hasPositiveMarketMetric =
    (policyGroup.ownerPhase.marketMetric === 'revenue' && normalizedMetrics.revenue > 0) ||
    (policyGroup.ownerPhase.marketMetric === 'adjustedEbitda' && normalizedMetrics.adjustedEbitda > 0) ||
    ((policyGroup.ownerPhase.marketMetric === 'adjustedEbit' || !policyGroup.ownerPhase.marketMetric) &&
      normalizedMetrics.adjustedEbit > 0) ||
    (policyGroup.ownerPhase.marketMetric === 'sde' && normalizedMetrics.sde > 0);

  if (policyGroup.id === 'PG_RECURRING_SOFTWARE') {
    if (normalizedMetrics.revenue > 0) {
      pushMethod(methods, 'market_multiple');
      rationale.push('Recurring-software owner mode leads with revenue multiples because revenue observability matters more than current EBITDA depth.');
    }

    if (policyGroup.floorMethod === 'asset_approach') {
      pushMethod(methods, 'asset_approach');
    }
  } else if (ownerLedPolicyGroups.has(policyGroup.id)) {
    if ((normalizedMetrics.sde || normalizedMetrics.adjustedEbit) > 0) {
      pushMethod(methods, 'capitalized_earnings');
      rationale.push('Owner-led service businesses anchor on maintainable owner earnings first.');
    }

    if (hasPositiveMarketMetric && ownerIndependence >= 65) {
      pushMethod(methods, 'market_multiple');
      rationale.push('A market multiple is included because management depth suggests the business is somewhat transferable beyond the founder.');
    }

    if (policyGroup.floorMethod === 'asset_approach' && (normalizedMetrics.actualWorkingCapital > 0 || normalizedMetrics.maintenanceCapex > 0)) {
      pushMethod(methods, 'asset_approach');
    }
  } else {
    if (hasPositiveMarketMetric) {
      pushMethod(methods, 'market_multiple');
      rationale.push('Comparable market-style multiples are usable with the current owner-mode inputs for this business model.');
    }

    if (normalizedMetrics.adjustedEbit > 0 && (yearsAvailable >= 2 || financialQuality >= 60)) {
      pushMethod(methods, 'capitalized_earnings');
      rationale.push('Capitalized earnings is included because there is enough earnings support or record quality to estimate maintainable profit.');
    }

    if (
      policyGroup.floorMethod === 'asset_approach' ||
      assetHeavyPolicyGroups.has(policyGroup.id) ||
      (normalizedMetrics.adjustedEbit <= 0 && normalizedMetrics.revenue > 0)
    ) {
      pushMethod(methods, 'asset_approach');
      rationale.push('An asset or floor method is included because this policy group is capital-intensive or earnings are not strong enough on their own.');
    }
  }

  if (!methods.length) {
    if (normalizedMetrics.revenue > 0) {
      pushMethod(methods, 'market_multiple');
      rationale.push('The owner-phase fallback is a simple market multiple because revenue is available.');
    } else {
      pushMethod(methods, 'asset_approach');
      rationale.push('The owner-phase fallback is an asset floor because earnings support is weak.');
    }
  }

  return {
    methodOrder: methods,
    selectedMethods: {
      policyGroupId: policyGroup.id,
      primaryMethod: methods[0] || policyGroup.primaryMethod,
      secondaryMethods: methods.slice(1),
      floorMethod: policyGroup.floorMethod,
      rationale,
    },
  };
}

export function reconcileApproaches(policyGroup, approaches) {
  if (!approaches.length) {
    return { low: 0, mid: 0, high: 0, appliedWeights: {} };
  }

  const configuredWeights = policyGroup.ownerPhase.reconciliationWeights || {};
  const weightTotal = approaches.reduce((sum, approach) => sum + (configuredWeights[approach.method] || 1), 0);

  const appliedWeights = {};
  let low = 0;
  let mid = 0;
  let high = 0;

  for (const approach of approaches) {
    const rawWeight = configuredWeights[approach.method] || 1;
    const weight = rawWeight / weightTotal;
    appliedWeights[approach.method] = Number(weight.toFixed(4));
    low += approach.low * weight;
    mid += approach.mid * weight;
    high += approach.high * weight;
  }

  return { low, mid, high, appliedWeights };
}
