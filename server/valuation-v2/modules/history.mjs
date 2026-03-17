import { average, clamp, safeDivide, standardDeviation } from './utils.mjs';

function weightedAverage(values) {
  if (!values.length) return 0;

  const weightTemplate = [0.5, 0.3, 0.2];
  const weights = values.map((_, index) => weightTemplate[index] || 0.1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;

  return values.reduce((sum, value, index) => sum + value * weights[index], 0) / totalWeight;
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
  const revenueSeries = periods.map((period) => period.revenue || 0).filter((value) => value > 0);
  const profitSeries = periods.map((period) => period.operatingProfit ?? period.ebit ?? 0);
  const marginSeries = periods
    .map((period) => safeDivide(period.operatingProfit ?? period.ebit ?? 0, period.revenue || 0, null))
    .filter((value) => typeof value === 'number');

  const representativeRevenue = weightedAverage(revenueSeries);
  const representativeOperatingProfit = weightedAverage(profitSeries);
  const representativeDepreciation = weightedAverage(periods.map((period) => period.depreciationAmortization || 0));
  const representativeInterest = weightedAverage(periods.map((period) => period.interestExpense || 0));
  const representativeTax = weightedAverage(periods.map((period) => period.taxExpense || 0));
  const representativeMaintenanceCapex = weightedAverage(periods.map((period) => period.maintenanceCapex || 0));
  const revenueGrowthPct = prior?.revenue ? safeDivide((latest?.revenue || 0) - prior.revenue, prior.revenue, 0) : null;
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

  return {
    yearsAvailable: periods.length,
    latestPeriod: latest,
    representativePeriodId: periods.length > 1 ? 'weighted_owner_history' : latest?.periodId || 'latest_owner_input',
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
  };
}
