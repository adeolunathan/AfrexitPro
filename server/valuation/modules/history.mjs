import { average, clamp, safeDivide, standardDeviation } from './utils.mjs';

function weightedAverage(values) {
  if (!values.length) return 0;

  const weightTemplate = [0.5, 0.3, 0.2];
  const weights = values.map((_, index) => weightTemplate[index] || 0.1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;

  return values.reduce((sum, value, index) => sum + value * weights[index], 0) / totalWeight;
}

function getActualHistoryWeights(periodCount) {
  const weightTemplate = [0.5, 0.3, 0.2];
  const weights = Array.from({ length: periodCount }, (_, index) => weightTemplate[index] || 0.1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  return weights.map((weight) => weight / totalWeight);
}

function getForecastSnapshot(request) {
  const forecastPackage = request.financials?.forecast;
  const forecastYear = forecastPackage?.forecastYears?.[0];
  if (!forecastYear) {
    return null;
  }

  const revenue = forecastYear.revenue || 0;
  const operatingProfit =
    typeof forecastYear.ebit === 'number'
      ? forecastYear.ebit
      : typeof forecastYear.ebitda === 'number'
        ? forecastYear.ebitda
        : undefined;

  if (revenue <= 0 && typeof operatingProfit !== 'number') {
    return null;
  }

  return {
    periodId: `forecast_${forecastYear.year}`,
    label: `${forecastYear.year} Forecast`,
    revenue,
    operatingProfit,
    confidence: forecastPackage?.forecastConfidence || 'low',
  };
}

function getForecastBlendWeight(confidence, actualYears) {
  const baseWeight = confidence === 'high' ? 0.3 : confidence === 'medium' ? 0.22 : 0.16;
  const depthModifier = actualYears >= 3 ? 0.75 : actualYears === 2 ? 0.9 : 1;
  return clamp(baseWeight * depthModifier, 0.12, 0.3);
}

export function getUsableHistoricals(request) {
  return (request.financials?.historicals || []).filter(
    (period) => (period.revenue || 0) > 0 || (period.operatingProfit ?? period.ebit ?? 0) !== 0
  );
}

export function buildHistoricalSummary(request) {
  const periods = getUsableHistoricals(request);
  const latest = periods[0];
  const prior = periods[1];
  const forecastSnapshot = getForecastSnapshot(request);
  const revenueSeries = periods.map((period) => period.revenue || 0).filter((value) => value > 0);
  const profitSeries = periods.map((period) => period.operatingProfit ?? period.ebit ?? 0);
  const marginSeries = periods
    .map((period) => safeDivide(period.operatingProfit ?? period.ebit ?? 0, period.revenue || 0, null))
    .filter((value) => typeof value === 'number');

  const historicalRepresentativeRevenue = weightedAverage(revenueSeries);
  const historicalRepresentativeOperatingProfit = weightedAverage(profitSeries);
  const forecastBlendWeight = forecastSnapshot ? getForecastBlendWeight(forecastSnapshot.confidence, periods.length) : 0;
  const representativeRevenue =
    forecastSnapshot && forecastSnapshot.revenue > 0
      ? historicalRepresentativeRevenue > 0
        ? historicalRepresentativeRevenue * (1 - forecastBlendWeight) + forecastSnapshot.revenue * forecastBlendWeight
        : forecastSnapshot.revenue
      : historicalRepresentativeRevenue;
  const representativeOperatingProfit =
    forecastSnapshot && typeof forecastSnapshot.operatingProfit === 'number'
      ? historicalRepresentativeOperatingProfit * (1 - forecastBlendWeight) + forecastSnapshot.operatingProfit * forecastBlendWeight
      : historicalRepresentativeOperatingProfit;
  const representativeDepreciation = weightedAverage(periods.map((period) => period.depreciationAmortization || 0));
  const representativeInterest = weightedAverage(periods.map((period) => period.interestExpense || 0));
  const representativeTax = weightedAverage(periods.map((period) => period.taxExpense || 0));
  const representativeMaintenanceCapex = weightedAverage(periods.map((period) => period.maintenanceCapex || 0));
  const revenueGrowthPct = prior?.revenue
    ? safeDivide((latest?.revenue || 0) - prior.revenue, prior.revenue, 0)
    : forecastSnapshot?.revenue && latest?.revenue
      ? safeDivide(forecastSnapshot.revenue - latest.revenue, latest.revenue, 0)
      : null;
  const revenueStabilityScore = clamp(92 - standardDeviation(revenueSeries.map((value) => safeDivide(value, average(revenueSeries, 1), 0))) * 60, 35, 92);
  const marginStabilityScore = clamp(90 - standardDeviation(marginSeries) * 320, 35, 92);
  const periodSummaries = periods.map((period, index) => {
    const operatingProfit = period.operatingProfit ?? period.ebit ?? 0;
    const workingCapital =
      typeof period.receivables === 'number' || typeof period.inventory === 'number' || typeof period.payables === 'number'
        ? (period.receivables || 0) + (period.inventory || 0) - (period.payables || 0)
        : undefined;

    return {
      periodId: period.periodId,
      label: period.label,
      revenue: period.revenue || 0,
      operatingProfit,
      operatingMarginPct: safeDivide(operatingProfit, period.revenue || 0, null),
      workingCapital,
      maintenanceCapex: typeof period.maintenanceCapex === 'number' ? period.maintenanceCapex : undefined,
      isLatest: index === 0,
    };
  });

  if (forecastSnapshot) {
    periodSummaries.push({
      periodId: forecastSnapshot.periodId,
      label: forecastSnapshot.label,
      revenue: forecastSnapshot.revenue,
      operatingProfit: forecastSnapshot.operatingProfit ?? 0,
      operatingMarginPct:
        typeof forecastSnapshot.operatingProfit === 'number'
          ? safeDivide(forecastSnapshot.operatingProfit, forecastSnapshot.revenue || 0, null)
          : null,
      workingCapital: undefined,
      maintenanceCapex: undefined,
      isLatest: false,
    });
  }

  const actualWeights = getActualHistoryWeights(periods.length);
  const historyLedger = {
    actualPeriods: periods.map((period, index) => ({
      periodId: period.periodId,
      label: period.label,
      revenue: period.revenue || 0,
      operatingProfit: period.operatingProfit ?? period.ebit ?? 0,
      weight: Number((actualWeights[index] || 0).toFixed(4)),
    })),
    historicalRepresentativeRevenue,
    historicalRepresentativeOperatingProfit,
    forecastIncluded: Boolean(forecastSnapshot),
    forecastBlendWeight: Number(forecastBlendWeight.toFixed(4)),
    forecastPeriodId: forecastSnapshot?.periodId,
    forecastConfidence: forecastSnapshot?.confidence,
    forecastRevenue: forecastSnapshot?.revenue,
    forecastOperatingProfit: forecastSnapshot?.operatingProfit,
    representativeRevenue,
    representativeOperatingProfit,
    revenueGrowthReference: prior?.revenue
      ? 'latest_actual_vs_prior_actual'
      : forecastSnapshot?.revenue && latest?.revenue
        ? 'forecast_vs_latest_actual'
        : 'not_available',
  };

  return {
    yearsAvailable: periods.length,
    latestPeriod: latest,
    representativePeriodId: forecastSnapshot
      ? 'blended_owner_history_with_forecast'
      : periods.length > 1
        ? 'weighted_owner_history'
        : latest?.periodId || 'latest_owner_input',
    representativeRevenue,
    representativeOperatingProfit,
    representativeDepreciation,
    representativeInterest,
    representativeTax,
    representativeMaintenanceCapex,
    revenueGrowthPct,
    revenueStabilityScore,
    marginStabilityScore,
    blendedStabilityScore: Math.round(average([revenueStabilityScore, marginStabilityScore], 55)),
    periodSummaries,
    ledger: historyLedger,
  };
}
