import { resolvePolicyGroup } from './policy-registry.mjs';

function toNumber(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
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

function buildNormalizationSchedule(raw) {
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
      notes: 'Owner flagged this item, but owner-mode intake does not yet capture a quantified amount.',
    });
  }

  return schedule;
}

export function adaptOwnerRequest(raw) {
  const { policyGroupId } = resolvePolicyGroup(raw.level2);
  const now = new Date().toISOString();
  const purpose = mapPurpose(raw.transactionGoal);
  const urgency = mapUrgency(raw.transactionTimeline);
  const customerConcentration = normalizeCustomerConcentration(raw.customerConcentration);
  const previousOfferStatus = normalizePreviousOfferStatus(raw.previousOffer);
  const previousOfferAmount =
    previousOfferStatus === 'yes' && raw.previousOfferAmount !== undefined ? toNumber(raw.previousOfferAmount) : undefined;
  const founderRevenueDependence = raw.founderRevenueDependence
    ? normalizeFounderDependence(raw.founderRevenueDependence)
    : normalizeFounderDependence(raw.ownerCustomerRelationship);

  return {
    meta: {
      requestId: buildRequestId(),
      mode: 'owner',
      engineVersion: 'owner-phase-skeleton-v0.5',
      submittedAt: now,
      currency: 'NGN',
      locale: 'en-NG',
      source: 'web-owner',
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
      workingCapitalHealth: raw.workingCapitalHealth,
      grossMarginStability: raw.grossMarginStability,
      supplierConcentration: raw.supplierConcentration,
      shrinkageSpoilage: raw.shrinkageSpoilage,
      peakSeasonDependency: raw.peakSeasonDependency,
      staffUtilization: raw.staffUtilization,
      keyPersonDependencies: raw.keyPersonDependencies,
      pricingPowerVsMarket: raw.pricingPowerVsMarket,
      capacityUtilization: raw.capacityUtilization,
      equipmentAgeCondition: raw.equipmentAgeCondition,
      rawMaterialPriceExposure: raw.rawMaterialPriceExposure,
      qualityCertifications: raw.qualityCertifications,
    },
    financials: {
      historicals: [
        {
          periodId: 'latest_owner_input',
          label: 'Latest annual owner input',
          months: 12,
          revenue: toNumber(raw.revenueLatest),
          operatingProfit: toNumber(raw.operatingProfitLatest),
          depreciationAmortization: toNumber(raw.annualDepreciation),
          cashBalance: toNumber(raw.cashBalance),
          financialDebt: toNumber(raw.financialDebt),
          receivables: toNumber(raw.receivablesLatest),
          inventory: toNumber(raw.inventoryValueLatest),
          payables: toNumber(raw.payablesLatest),
          maintenanceCapex: toNumber(raw.maintenanceCapexLatest),
          sourceType: 'owner_estimate',
          isRepresentative: true,
        },
      ],
      selectedRepresentativePeriodId: 'latest_owner_input',
      sourceQuality: {
        yearsAvailable: 1,
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
