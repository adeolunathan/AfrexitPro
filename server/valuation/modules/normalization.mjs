function sumAdjustments(schedule, affects) {
  const allowedAffects = Array.isArray(affects) ? affects : [affects];

  return schedule
    .filter((item) => allowedAffects.includes(item.affects))
    .reduce((sum, item) => {
      if (item.direction === 'add_back') return sum + item.adjustmentAmount;
      if (item.direction === 'remove') return sum - item.adjustmentAmount;
      return sum;
    }, 0);
}

function inferActualWorkingCapital(request, latestPeriod) {
  if (typeof request.bridge.actualWorkingCapital === 'number') {
    return request.bridge.actualWorkingCapital;
  }

  const receivables = latestPeriod?.receivables || 0;
  const inventory = latestPeriod?.inventory || 0;
  const payables = latestPeriod?.payables || 0;
  return receivables + inventory - payables;
}

function inferNormalizedWorkingCapital(request, policyGroup, representativeRevenue) {
  if (typeof request.bridge.normalizedWorkingCapital === 'number') {
    return request.bridge.normalizedWorkingCapital;
  }

  const targetPct = policyGroup.ownerPhase.workingCapitalTargetPct ?? 0.06;
  return representativeRevenue * targetPct;
}

export function buildNormalizedMetrics(request, policyGroup, historicalSummary) {
  const latestPeriod = historicalSummary.latestPeriod;
  const revenue = historicalSummary.representativeRevenue || latestPeriod?.revenue || 0;
  const operatingProfit = historicalSummary.representativeOperatingProfit || latestPeriod?.operatingProfit || latestPeriod?.ebit || 0;
  const normalization = request.normalization.schedule;
  const ebitAdjustment = sumAdjustments(normalization, ['ebit', 'ebitda']);
  const sdeAdjustment = sumAdjustments(normalization, 'sde');
  const depreciationAmortization = historicalSummary.representativeDepreciation || 0;
  const interestExpense = historicalSummary.representativeInterest || 0;
  const taxExpense = historicalSummary.representativeTax || 0;
  const maintenanceCapex = historicalSummary.representativeMaintenanceCapex || latestPeriod?.maintenanceCapex || 0;
  const actualWorkingCapital = inferActualWorkingCapital(request, latestPeriod);
  const normalizedWorkingCapital = inferNormalizedWorkingCapital(request, policyGroup, revenue);
  const workingCapitalDelta = actualWorkingCapital - normalizedWorkingCapital;
  const workingCapitalTargetPct = policyGroup.ownerPhase.workingCapitalTargetPct ?? 0.06;

  const rawEbit = operatingProfit;
  const rawEbitda = rawEbit + depreciationAmortization;
  const rawSde = rawEbitda + interestExpense + taxExpense;
  const adjustedEbit = operatingProfit + ebitAdjustment;
  const adjustedEbitda = adjustedEbit + depreciationAmortization;
  const sde = adjustedEbitda + sdeAdjustment + interestExpense + taxExpense;
  const netDebt =
    (request.bridge.interestBearingDebt || 0) +
    (request.bridge.shareholderLoans || 0) +
    (request.bridge.leaseLiabilities || 0) -
    (request.bridge.cashAndEquivalents || 0);

  return {
    representativePeriodId: historicalSummary.representativePeriodId,
    revenue,
    rawEbit,
    rawEbitda,
    rawSde,
    adjustedEbit,
    adjustedEbitda,
    sde,
    normalizedWorkingCapital,
    actualWorkingCapital,
    workingCapitalDelta,
    maintenanceCapex,
    netDebt,
    ledger: {
      rawEbit,
      rawEbitda,
      rawSde,
      ebitAdjustment,
      sdeAdjustment,
      depreciationAmortization,
      interestExpense,
      taxExpense,
      adjustedEbit,
      adjustedEbitda,
      sde,
      actualWorkingCapital,
      normalizedWorkingCapital,
      workingCapitalDelta,
      workingCapitalTargetPct,
      maintenanceCapex,
      netDebt,
    },
  };
}
