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

  return {
    meta: {
      requestId: buildRequestId(),
      mode: 'owner',
      engineVersion: 'owner-phase-skeleton-v0.1',
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
    },
    company: {
      businessName: raw.businessName || 'Your Business',
      firstName: raw.firstName || 'Business Owner',
      email: raw.email || '',
      whatsapp: raw.whatsapp || '',
      legalStructure: raw.legalStructure || 'other',
      ownerControlBand: raw.ownerControl || 'gt_75',
      operatingYearsBand: raw.operatingYears || '1_3',
      primaryState: raw.primaryState || 'lagos_mainland',
      businessSummary: raw.businessSummary || 'Business summary not provided.',
    },
    classification: {
      level1: raw.level1 || '',
      level2: raw.level2 || '',
      industryFit: raw.industryFit || 'not_sure',
      policyGroupId,
    },
    operatingProfile: {
      catchmentArea: raw.catchmentArea || 'local_city',
      marketDemand: raw.marketDemand || 'not_sure',
      growthOutlook: raw.growthOutlook || 'not_sure',
      differentiation: raw.differentiation || 'not_sure',
      pricingPower: raw.pricingPower || 'not_sure',
      customerConcentration: raw.customerConcentration || 'not_sure',
      bestCustomerRisk: raw.bestCustomerRisk || 'severe',
      founderRevenueDependence: raw.founderRevenueDependence || 'most',
      recurringRevenueShare: raw.recurringRevenueShare,
      revenueVisibility: raw.revenueVisibility,
      supplierTransferability: raw.supplierTransferability,
      hiringDifficulty: raw.hiringDifficulty,
      fxExposure: raw.fxExposure,
      assetSeparation: raw.assetSeparation,
      inventoryProfile: raw.inventoryProfile,
      workingCapitalHealth: raw.workingCapitalHealth,
    },
    financials: {
      historicals: [
        {
          periodId: 'latest_owner_input',
          label: 'Latest annual owner input',
          months: 12,
          revenue: toNumber(raw.revenueLatest),
          operatingProfit: toNumber(raw.operatingProfitLatest),
          cashBalance: toNumber(raw.cashBalance),
          financialDebt: toNumber(raw.financialDebt),
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
