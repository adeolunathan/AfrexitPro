import { resolvePolicyGroup } from './policy-registry.mjs';

function toNumber(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasValue(value) {
  return String(value ?? '').trim() !== '';
}

function isTruthy(value) {
  if (value === true) return true;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'on';
}

function buildRequestId() {
  return `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePrimaryState(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return 'lagos_mainland';

  const aliases = {
    abuja_fct: 'fct',
    abuja: 'fct',
    port_harcourt: 'rivers',
  };

  return aliases[normalized] || normalized;
}

function normalizeRespondentRole(value) {
  return String(value ?? '').trim() === 'representative' ? 'representative' : 'owner';
}

function normalizeIndustryFit(value) {
  switch (String(value ?? '').trim()) {
    case 'perfect_fit':
      return 'perfect_fit';
    case 'good_fit':
    case 'mostly_fit':
    case 'hybrid':
      return 'mostly_fit';
    case 'partial_fit':
      return 'partial_fit';
    case 'poor_fit':
      return 'poor_fit';
    default:
      return 'not_sure';
  }
}

function normalizeCatchmentArea(value) {
  switch (String(value ?? '').trim()) {
    case 'local_single':
      return 'local_city';
    case 'regional_multi':
      return 'multi_state';
    case 'national_single':
      return 'national_single_base';
    case 'international_single':
    case 'international_multi':
      return 'international';
    case 'local_city':
    case 'single_state':
    case 'multi_state':
    case 'national_single_base':
    case 'national_multi_base':
    case 'international':
      return String(value);
    default:
      return 'local_city';
  }
}

function normalizePricingPower(value) {
  switch (String(value ?? '').trim()) {
    case 'market_price':
    case 'price_competition':
      return 'none';
    case 'slight_premium':
      return 'some';
    case 'significant_premium':
      return 'premium';
    case 'none':
    case 'some':
    case 'premium':
    case 'strong_premium':
    case 'not_sure':
      return String(value);
    default:
      return 'not_sure';
  }
}

function normalizeGrowthOutlook(value) {
  switch (String(value ?? '').trim()) {
    case 'current_market':
    case 'new_markets':
      return 'strong_growth';
    case 'limited':
      return 'stable';
    case 'uncertain':
      return 'not_sure';
    case 'strong_growth':
    case 'moderate_growth':
    case 'stable':
    case 'decline':
    case 'not_sure':
      return String(value);
    default:
      return 'not_sure';
  }
}

function normalizeHiringDifficulty(value) {
  switch (String(value ?? '').trim()) {
    case 'no_shortage':
      return 'easy';
    case 'competition':
      return 'feasible';
    case 'severe_shortage':
      return 'severe';
    case 'easy':
    case 'feasible':
    case 'difficult':
    case 'severe':
      return String(value);
    default:
      return 'feasible';
  }
}

function normalizeCustomerConcentration(value) {
  switch (String(value ?? '').trim()) {
    case 'no_material':
    case 'none_material':
      return 'none_material';
    case 'lt_20':
      return 'manageable';
    case '20_50':
    case 'high':
      return 'high';
    case '50_80':
    case 'gt_80':
    case 'extreme':
      return 'extreme';
    case 'manageable':
    case 'not_sure':
      return String(value);
    default:
      return 'not_sure';
  }
}

function deriveBestCustomerRisk(customerConcentration) {
  switch (customerConcentration) {
    case 'none_material':
      return 'minor';
    case 'manageable':
      return 'noticeable';
    case 'high':
      return 'major';
    case 'extreme':
      return 'severe';
    default:
      return 'noticeable';
  }
}

function normalizeBestCustomerRisk(value, customerConcentration) {
  switch (String(value ?? '').trim()) {
    case 'minor':
    case 'noticeable':
    case 'major':
    case 'severe':
      return String(value);
    default:
      return deriveBestCustomerRisk(customerConcentration);
  }
}

function normalizeSupplierTransferability(value) {
  switch (String(value ?? '').trim()) {
    case 'no_dependency':
    case 'replaceable_weeks':
      return 'very_easy';
    case 'replaceable_year':
      return 'uncertain';
    case 'difficult_replace':
      return 'very_difficult';
    case 'very_easy':
    case 'manageable':
    case 'uncertain':
    case 'very_difficult':
      return String(value);
    default:
      return 'manageable';
  }
}

function normalizeFounderDependence(value) {
  switch (String(value ?? '').trim()) {
    case 'brand_not_personal':
      return 'very_little';
    case 'knows_not_expected':
      return 'some';
    case 'expects_involvement':
      return 'large_share';
    case 'buying_owner':
      return 'most';
    case 'very_little':
    case 'some':
    case 'large_share':
    case 'most':
      return String(value);
    default:
      return 'some';
  }
}

function normalizePreviousOfferStatus(value) {
  const normalized = String(value ?? '').trim();
  if (normalized === 'yes' || normalized === 'expressions' || normalized === 'no') {
    return normalized;
  }

  return undefined;
}

function mapPurpose(transactionGoal) {
  switch (transactionGoal) {
    case 'external_sale':
    case 'partial_sale':
      return 'sale';
    case 'investor_entry':
      return 'fundraise';
    case 'internal_handover':
      return 'succession';
    case 'value_improvement':
    default:
      return 'internal_planning';
  }
}

function mapUrgency(transactionTimeline) {
  if (transactionTimeline === 'within_6m') return 'accelerated';
  return 'orderly';
}

function mapTargetTransaction(transactionGoal) {
  switch (transactionGoal) {
    case 'external_sale':
      return 'full_sale';
    case 'partial_sale':
      return 'partial_sale';
    case 'investor_entry':
      return 'minority_raise';
    default:
      return 'not_sure';
  }
}

function buildHistoricalPeriod(periodId, label, revenue, operatingProfit, options = {}) {
  return {
    periodId,
    label,
    months: 12,
    revenue,
    operatingProfit,
    receivables: options.receivables,
    inventory: options.inventory,
    payables: options.payables,
    maintenanceCapex: options.maintenanceCapex,
    depreciationAmortization: options.depreciationAmortization,
    cashBalance: options.cashBalance,
    financialDebt: options.financialDebt,
    sourceType: 'owner_estimate',
    isRepresentative: options.isRepresentative,
  };
}

function buildOwnerHistoricals(raw) {
  const revenuePrevious1 = hasValue(raw.revenuePrevious1) ? raw.revenuePrevious1 : raw.revenuePrev1;
  const operatingProfitPrevious1 = hasValue(raw.operatingProfitPrevious1)
    ? raw.operatingProfitPrevious1
    : raw.operatingProfitPrev1;
  const revenuePrevious2 = hasValue(raw.revenuePrevious2) ? raw.revenuePrevious2 : raw.revenuePrev2;
  const operatingProfitPrevious2 = hasValue(raw.operatingProfitPrevious2)
    ? raw.operatingProfitPrevious2
    : raw.operatingProfitPrev2;

  const historicals = [
    buildHistoricalPeriod('latest_owner_input', 'Latest annual owner input', toNumber(raw.revenueLatest), toNumber(raw.operatingProfitLatest), {
      isRepresentative: true,
      receivables: toNumber(raw.receivablesLatest),
      inventory: toNumber(raw.inventoryValueLatest),
      payables: toNumber(raw.payablesLatest),
      maintenanceCapex: toNumber(raw.maintenanceCapexLatest),
      depreciationAmortization: toNumber(raw.annualDepreciation),
      cashBalance: toNumber(raw.cashBalance),
      financialDebt: toNumber(raw.financialDebt),
    }),
  ];

  if (hasValue(revenuePrevious1) || hasValue(operatingProfitPrevious1)) {
    historicals.push(
      buildHistoricalPeriod(
        'prior_year_1',
        'Previous financial year',
        toNumber(revenuePrevious1),
        toNumber(operatingProfitPrevious1)
      )
    );
  }

  if (hasValue(revenuePrevious2) || hasValue(operatingProfitPrevious2)) {
    historicals.push(
      buildHistoricalPeriod(
        'prior_year_2',
        'Two financial years ago',
        toNumber(revenuePrevious2),
        toNumber(operatingProfitPrevious2)
      )
    );
  }

  return historicals;
}

function buildOwnerForecast(raw) {
  const rawPeriods = Array.isArray(raw?._financialPeriods) ? raw._financialPeriods : [];
  const forecastPeriod = rawPeriods.find(
    (period) => period && typeof period === 'object' && period.id === 'forecast'
  );

  if (!forecastPeriod || forecastPeriod.enabled !== true) {
    return undefined;
  }

  const revenue = toNumber(forecastPeriod.revenue);
  const operatingProfit = toNumber(forecastPeriod.operatingProfit);
  const hasOperatingProfit = hasValue(forecastPeriod.operatingProfit);

  if (revenue <= 0 && !hasOperatingProfit) {
    return undefined;
  }

  return {
    forecastYears: [
      {
        year: new Date().getFullYear(),
        revenue,
        ebit: hasOperatingProfit ? operatingProfit : undefined,
      },
    ],
    forecastConfidence: 'low',
  };
}

function createNormalizationLineItem(id, category, label, adjustmentAmount, direction, affects, notes, options = {}) {
  return {
    id,
    category,
    label,
    periodId: 'latest_owner_input',
    reportedAmount: options.reportedAmount,
    normalizedAmount: options.normalizedAmount,
    adjustmentAmount,
    direction,
    recurrence: options.recurrence || 'recurring',
    confidence: 'low',
    evidenceLevel: 'owner_statement',
    affects,
    notes,
  };
}

function buildLegacyNormalizationFallback(raw) {
  const periodId = 'latest_owner_input';
  const schedule = [];

  const adjustmentSignals = [
    ['premisesAdjustment', 'related_party_rent', 'Related-party or non-market premises cost', 'add_back'],
    ['relatedPartyPay', 'family_payroll', 'Related-party or non-market compensation', 'add_back'],
    ['privateExpenses', 'personal_expense', 'Personal expenses charged to the business', 'add_back'],
    ['oneOffItems', 'one_off_expense', 'One-off items flagged by owner', 'add_back'],
    ['coreBusinessAdjustments', 'non_operating_income', 'Core vs non-core earnings adjustments flagged', 'remove'],
  ];

  for (const [key, category, label, direction] of adjustmentSignals) {
    if (!isTruthy(raw[key])) {
      continue;
    }

    schedule.push({
      id: `${key}-${periodId}`,
      category,
      label,
      periodId,
      adjustmentAmount: 0,
      direction,
      recurrence: 'non_recurring',
      confidence: 'low',
      evidenceLevel: 'owner_statement',
      affects: category === 'non_operating_income' ? 'ebit' : 'ebitda',
      notes: 'Owner flagged this item, but owner-mode intake did not capture a quantified amount.',
    });
  }

  return schedule;
}

function buildNormalizationSchedule(raw) {
  const schedule = [];
  const ownerTotalComp = toNumber(raw.ownerTotalCompensation);
  const marketManagerComp = toNumber(raw.marketManagerCompensation);
  const rentActual = toNumber(raw.relatedPartyRentPaid);
  const rentMarket = toNumber(raw.marketRentEquivalent);
  const relatedPartyCompActual = toNumber(raw.relatedPartyCompPaid);
  const relatedPartyCompMarket = toNumber(raw.marketRelatedPartyCompEquivalent);
  const privateExpensesAmount = toNumber(raw.privateExpensesAmount);
  const oneOffExpenseAmount = toNumber(raw.oneOffExpenseAmount);
  const oneOffIncomeAmount = toNumber(raw.oneOffIncomeAmount);
  const nonCoreIncomeAmount = toNumber(raw.nonCoreIncomeAmount);

  if (ownerTotalComp > 0) {
    schedule.push(
      createNormalizationLineItem(
        'owner-comp-total',
        'owner_comp',
        'Owner total compensation added back for SDE view',
        ownerTotalComp,
        'add_back',
        'sde',
        'Owner-provided estimate of total annual compensation taken from the business.',
        {
          recurrence: 'recurring',
          reportedAmount: ownerTotalComp,
          normalizedAmount: 0,
        }
      )
    );
  }

  if (ownerTotalComp !== marketManagerComp) {
    const delta = Math.abs(ownerTotalComp - marketManagerComp);
    const direction = ownerTotalComp > marketManagerComp ? 'add_back' : 'remove';
    schedule.push(
      createNormalizationLineItem(
        'owner-comp-market-delta',
        'owner_comp',
        'Owner compensation normalized to market replacement cost',
        delta,
        direction,
        'ebitda',
        'Difference between owner take-home and estimated market replacement cost.',
        {
          recurrence: 'recurring',
          reportedAmount: ownerTotalComp,
          normalizedAmount: marketManagerComp,
        }
      )
    );
  }

  if (rentActual !== rentMarket) {
    const delta = Math.abs(rentActual - rentMarket);
    const direction = rentActual > rentMarket ? 'add_back' : 'remove';
    schedule.push(
      createNormalizationLineItem(
        'related-party-rent-delta',
        'related_party_rent',
        'Related-party or non-market rent normalization',
        delta,
        direction,
        'ebitda',
        'Difference between actual rent paid and estimated market-equivalent rent.',
        {
          recurrence: 'recurring',
          reportedAmount: rentActual,
          normalizedAmount: rentMarket,
        }
      )
    );
  }

  if (relatedPartyCompActual !== relatedPartyCompMarket) {
    const delta = Math.abs(relatedPartyCompActual - relatedPartyCompMarket);
    const direction = relatedPartyCompActual > relatedPartyCompMarket ? 'add_back' : 'remove';
    schedule.push(
      createNormalizationLineItem(
        'related-party-pay-delta',
        'family_payroll',
        'Related-party compensation normalization',
        delta,
        direction,
        'ebitda',
        'Difference between related-party pay and estimated market-equivalent cost.',
        {
          recurrence: 'recurring',
          reportedAmount: relatedPartyCompActual,
          normalizedAmount: relatedPartyCompMarket,
        }
      )
    );
  }

  if (privateExpensesAmount > 0) {
    schedule.push(
      createNormalizationLineItem(
        'private-expenses',
        'personal_expense',
        'Personal or private expenses through the business',
        privateExpensesAmount,
        'add_back',
        'ebitda',
        'Owner estimate of non-business expenses included in reported profit.',
        {
          recurrence: 'recurring',
          reportedAmount: privateExpensesAmount,
        }
      )
    );
  }

  if (oneOffExpenseAmount > 0) {
    schedule.push(
      createNormalizationLineItem(
        'one-off-expenses',
        'one_off_expense',
        'One-off expenses removed from maintainable earnings',
        oneOffExpenseAmount,
        'add_back',
        'ebitda',
        'Owner estimate of unusual or non-recurring expenses.',
        {
          recurrence: 'non_recurring',
          reportedAmount: oneOffExpenseAmount,
        }
      )
    );
  }

  if (oneOffIncomeAmount > 0) {
    schedule.push(
      createNormalizationLineItem(
        'one-off-income',
        'one_off_income',
        'One-off income removed from maintainable earnings',
        oneOffIncomeAmount,
        'remove',
        'ebitda',
        'Owner estimate of unusual or non-recurring income.',
        {
          recurrence: 'non_recurring',
          reportedAmount: oneOffIncomeAmount,
        }
      )
    );
  }

  if (nonCoreIncomeAmount > 0) {
    schedule.push(
      createNormalizationLineItem(
        'non-core-income',
        'non_operating_income',
        'Income not related to the core operating business',
        nonCoreIncomeAmount,
        'remove',
        'ebit',
        'Owner estimate of non-core or non-operating income embedded in profit.',
        {
          recurrence: 'partly_recurring',
          reportedAmount: nonCoreIncomeAmount,
        }
      )
    );
  }

  return schedule.length ? schedule : buildLegacyNormalizationFallback(raw);
}

function deriveWorkingCapitalHealth({ hasInputs, actualWorkingCapital, revenue, targetPct, inventoryProfile, level1, existingValue }) {
  if (hasValue(existingValue)) {
    return String(existingValue);
  }

  if (!hasInputs || revenue <= 0) {
    return 'not_sure';
  }

  const normalizedInventoryProfile = String(inventoryProfile || '');
  const normalizedLevel1 = String(level1 || '');

  if (actualWorkingCapital <= 0) {
    if (normalizedInventoryProfile === 'lt_7' || normalizedInventoryProfile === 'service_business' || normalizedLevel1 === 'trade') {
      return 'healthy';
    }
    return 'tight';
  }

  const normalizedWorkingCapital = revenue * (targetPct ?? 0.06);
  if (normalizedWorkingCapital <= 0) {
    const intensity = actualWorkingCapital / revenue;
    if (intensity <= 0.08) return 'healthy';
    if (intensity <= 0.18) return 'tight';
    return 'under_pressure';
  }

  const coverage = actualWorkingCapital / normalizedWorkingCapital;
  if (coverage >= 0.9) return 'healthy';
  if (coverage >= 0.5) return 'tight';
  return 'under_pressure';
}

export function adaptOwnerRequest(raw) {
  const { policyGroupId, policyGroup } = resolvePolicyGroup(raw.level2);
  const now = new Date().toISOString();
  const purpose = mapPurpose(raw.transactionGoal);
  const urgency = mapUrgency(raw.transactionTimeline);
  const historicals = buildOwnerHistoricals(raw);
  const forecast = buildOwnerForecast(raw);
  const latestReceivables = toNumber(raw.receivablesLatest);
  const latestInventory = toNumber(raw.inventoryValueLatest);
  const latestPayables = toNumber(raw.payablesLatest);
  const hasWorkingCapitalInputs =
    hasValue(raw.receivablesLatest) || hasValue(raw.inventoryValueLatest) || hasValue(raw.payablesLatest);
  const actualWorkingCapital = latestReceivables + latestInventory - latestPayables;
  const customerConcentration = normalizeCustomerConcentration(raw.customerConcentration);
  const previousOfferStatus = normalizePreviousOfferStatus(raw.previousOffer);
  const previousOfferAmount =
    previousOfferStatus === 'yes' && raw.previousOfferAmount !== undefined ? toNumber(raw.previousOfferAmount) : undefined;
  const lastName = String(raw.lastName || '').trim();
  const founderRevenueDependence = raw.founderRevenueDependence
    ? normalizeFounderDependence(raw.founderRevenueDependence)
    : normalizeFounderDependence(raw.ownerCustomerRelationship);
  const workingCapitalHealth = deriveWorkingCapitalHealth({
    hasInputs: hasWorkingCapitalInputs,
    actualWorkingCapital,
    revenue: toNumber(raw.revenueLatest),
    targetPct: policyGroup.ownerPhase.workingCapitalTargetPct,
    inventoryProfile: raw.inventoryProfile,
    level1: raw.level1,
    existingValue: raw.workingCapitalHealth,
  });

  return {
    meta: {
      requestId: buildRequestId(),
      mode: 'owner',
      engineVersion: 'owner-phase-skeleton-v0.5',
      submittedAt: now,
      currency: 'NGN',
      locale: 'en-NG',
      source: 'web-owner',
      respondentRole: normalizeRespondentRole(raw.respondentRole),
    },
    engagement: {
      purpose,
      urgency,
      targetTransaction: mapTargetTransaction(raw.transactionGoal),
      standardOfValue: purpose === 'fundraise' ? 'investment_value' : 'fair_market_value',
      premiseOfValue: urgency === 'forced' ? 'forced_liquidation' : 'going_concern',
      valuationDate: now.slice(0, 10),
      previousOfferStatus,
      previousOfferAmount,
    },
    company: {
      businessName: raw.businessName || 'Your Business',
      firstName: raw.firstName || 'Business Owner',
      ...(lastName ? { lastName } : {}),
      email: raw.email || '',
      whatsapp: raw.whatsapp || '',
      legalStructure: raw.legalStructure || 'other',
      ownerControlBand: raw.ownerControl || 'gt_75',
      operatingYearsBand: raw.operatingYears || '1_3',
      primaryState: normalizePrimaryState(raw.primaryState),
      businessSummary: raw.businessSummary || raw.businessDescription || 'Business summary not provided.',
    },
    classification: {
      level1: raw.level1 || '',
      level2: raw.level2 || '',
      industryFit: normalizeIndustryFit(raw.industryFit),
      policyGroupId,
    },
    operatingProfile: {
      catchmentArea: normalizeCatchmentArea(raw.catchmentArea),
      marketDemand: raw.marketDemand || 'not_sure',
      growthOutlook: normalizeGrowthOutlook(raw.growthPotential || raw.growthOutlook),
      differentiation: raw.differentiation || 'not_sure',
      pricingPower: normalizePricingPower(raw.pricingPower),
      customerConcentration,
      bestCustomerRisk: normalizeBestCustomerRisk(raw.bestCustomerImpact || raw.bestCustomerRisk, customerConcentration),
      founderRevenueDependence,
      recurringRevenueShare: raw.recurringRevenueShare,
      revenueVisibility: raw.revenueVisibility,
      supplierTransferability: normalizeSupplierTransferability(raw.partnerDependency || raw.supplierTransferability),
      hiringDifficulty: normalizeHiringDifficulty(raw.laborMarketDifficulty || raw.hiringDifficulty),
      fxExposure: raw.fxExposure,
      assetSeparation: raw.assetSeparation,
      inventoryProfile: raw.inventoryProfile,
      workingCapitalHealth,
      productRights: raw.productRights,
      quantities: raw.quantities,
      productCustomisation: raw.productCustomisation,
      grossMarginStability: raw.grossMarginStability,
      supplierConcentration: raw.supplierConcentration,
      shrinkageSpoilage: raw.shrinkageSpoilage,
      peakSeasonDependency: raw.peakSeasonDependency,
      staffUtilization: raw.staffUtilization,
      keyPersonDependencies: raw.keyPersonDependencies,
      pricingPowerVsMarket: raw.pricingPowerVsMarket,
      capacityUtilization: raw.capacityUtilization,
      manufacturingValueCreation: raw.manufacturingValueCreation,
      equipmentAgeCondition: raw.equipmentAgeCondition,
      rawMaterialPriceExposure: raw.rawMaterialPriceExposure,
      qualityCertifications: raw.qualityCertifications,
    },
    financials: {
      historicals,
      forecast,
      selectedRepresentativePeriodId: 'latest_owner_input',
      sourceQuality: {
        yearsAvailable: historicals.length,
        bookkeepingQuality: raw.financeTracking || 'informal',
        bankingQuality: raw.bankingQuality || 'informal',
        traceablePaymentsShare: raw.traceablePaymentsShare || 'lt_20',
        proofReadiness: raw.proofReadiness || 'difficult',
      },
    },
    normalization: {
      earningsBaseType: 'ebit',
      schedule: buildNormalizationSchedule(raw),
      selectedBasePeriodId: 'latest_owner_input',
    },
    bridge: {
      cashAndEquivalents: toNumber(raw.cashBalance),
      interestBearingDebt: toNumber(raw.financialDebt),
      shareholderLoans: toNumber(raw.shareholderLoans),
      actualWorkingCapital,
    },
    readiness: {
        recordsQuality: raw.proofReadiness,
        managementDepth: raw.managementDepth,
        ownerAbsence2Weeks: raw.ownerAbsence2Weeks,
        ownerAbsence3Months: raw.ownerAbsence3Months,
        processDocumentation: raw.processDocumentation,
        replacementDifficulty: raw.replacementDifficulty,
      },
    evidence: {
      benchmarkCoverage: {
        publicCompsAvailable: false,
        transactionCompsAvailable: true,
        compensationBenchmarkAvailable: false,
        rentBenchmarkAvailable: false,
        workingCapitalBenchmarkAvailable: false,
      },
    },
    controls: {},
  };
}
