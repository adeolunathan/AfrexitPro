import type { V2FormData } from '../valuation-v2-types';
import { valuationRequestSchema, type NormalizationLineItem, type ValuationRequest } from './contracts';
import { resolveFrontendPolicyGroup } from './policy-registry';

type OwnerFieldValueType = 'string' | 'number' | 'boolean';

export type OwnerFieldId =
  | 'level1'
  | 'level2'
  | 'industryFit'
  | 'businessSummary'
  | 'primaryState'
  | 'operatingYears'
  | 'legalStructure'
  | 'ownerControl'
  | 'catchmentArea'
  | 'marketDemand'
  | 'growthOutlook'
  | 'differentiation'
  | 'pricingPower'
  | 'transactionGoal'
  | 'transactionTimeline'
  | 'revenueLatest'
  | 'operatingProfitLatest'
  | 'revenuePrev1'
  | 'operatingProfitPrev1'
  | 'revenuePrev2'
  | 'operatingProfitPrev2'
  | 'proofReadiness'
  | 'traceablePaymentsShare'
  | 'bankingQuality'
  | 'financeTracking'
  | 'ownerAbsence2Weeks'
  | 'ownerAbsence3Months'
  | 'managementDepth'
  | 'processDocumentation'
  | 'replacementDifficulty'
  | 'hiringDifficulty'
  | 'customerConcentration'
  | 'bestCustomerRisk'
  | 'founderRevenueDependence'
  | 'recurringRevenueShare'
  | 'revenueVisibility'
  | 'supplierTransferability'
  | 'inventoryProfile'
  | 'workingCapitalHealth'
  | 'assetSeparation'
  | 'fxExposure'
  | 'ownerTotalCompensation'
  | 'marketManagerCompensation'
  | 'relatedPartyRentPaid'
  | 'marketRentEquivalent'
  | 'relatedPartyCompPaid'
  | 'marketRelatedPartyCompEquivalent'
  | 'privateExpensesAmount'
  | 'oneOffExpenseAmount'
  | 'oneOffIncomeAmount'
  | 'nonCoreIncomeAmount'
  | 'receivablesLatest'
  | 'inventoryValueLatest'
  | 'payablesLatest'
  | 'maintenanceCapexLatest'
  | 'cashBalance'
  | 'financialDebt'
  | 'shareholderLoans'
  | 'firstName'
  | 'businessName'
  | 'email'
  | 'whatsapp'
  | 'termsAccepted'
  | 'newsletterOptIn';

interface OwnerFieldBinding {
  canonicalPath: string;
  valueType: OwnerFieldValueType;
}

export const ownerFieldBindings: Record<OwnerFieldId, OwnerFieldBinding> = {
  level1: { canonicalPath: 'classification.level1', valueType: 'string' },
  level2: { canonicalPath: 'classification.level2', valueType: 'string' },
  industryFit: { canonicalPath: 'classification.industryFit', valueType: 'string' },
  businessSummary: { canonicalPath: 'company.businessSummary', valueType: 'string' },
  primaryState: { canonicalPath: 'company.primaryState', valueType: 'string' },
  operatingYears: { canonicalPath: 'company.operatingYearsBand', valueType: 'string' },
  legalStructure: { canonicalPath: 'company.legalStructure', valueType: 'string' },
  ownerControl: { canonicalPath: 'company.ownerControlBand', valueType: 'string' },
  catchmentArea: { canonicalPath: 'operatingProfile.catchmentArea', valueType: 'string' },
  marketDemand: { canonicalPath: 'operatingProfile.marketDemand', valueType: 'string' },
  growthOutlook: { canonicalPath: 'operatingProfile.growthOutlook', valueType: 'string' },
  differentiation: { canonicalPath: 'operatingProfile.differentiation', valueType: 'string' },
  pricingPower: { canonicalPath: 'operatingProfile.pricingPower', valueType: 'string' },
  transactionGoal: { canonicalPath: 'engagement.purpose', valueType: 'string' },
  transactionTimeline: { canonicalPath: 'engagement.urgency', valueType: 'string' },
  revenueLatest: { canonicalPath: 'financials.historicals[0].revenue', valueType: 'number' },
  operatingProfitLatest: { canonicalPath: 'financials.historicals[0].operatingProfit', valueType: 'number' },
  revenuePrev1: { canonicalPath: 'financials.historicals[1].revenue', valueType: 'number' },
  operatingProfitPrev1: { canonicalPath: 'financials.historicals[1].operatingProfit', valueType: 'number' },
  revenuePrev2: { canonicalPath: 'financials.historicals[2].revenue', valueType: 'number' },
  operatingProfitPrev2: { canonicalPath: 'financials.historicals[2].operatingProfit', valueType: 'number' },
  proofReadiness: { canonicalPath: 'financials.sourceQuality.proofReadiness', valueType: 'string' },
  traceablePaymentsShare: { canonicalPath: 'financials.sourceQuality.traceablePaymentsShare', valueType: 'string' },
  bankingQuality: { canonicalPath: 'financials.sourceQuality.bankingQuality', valueType: 'string' },
  financeTracking: { canonicalPath: 'financials.sourceQuality.bookkeepingQuality', valueType: 'string' },
  ownerAbsence2Weeks: { canonicalPath: 'readiness.ownerAbsence2Weeks', valueType: 'string' },
  ownerAbsence3Months: { canonicalPath: 'readiness.ownerAbsence3Months', valueType: 'string' },
  managementDepth: { canonicalPath: 'readiness.managementDepth', valueType: 'string' },
  processDocumentation: { canonicalPath: 'readiness.processDocumentation', valueType: 'string' },
  replacementDifficulty: { canonicalPath: 'readiness.replacementDifficulty', valueType: 'string' },
  hiringDifficulty: { canonicalPath: 'operatingProfile.hiringDifficulty', valueType: 'string' },
  customerConcentration: { canonicalPath: 'operatingProfile.customerConcentration', valueType: 'string' },
  bestCustomerRisk: { canonicalPath: 'operatingProfile.bestCustomerRisk', valueType: 'string' },
  founderRevenueDependence: { canonicalPath: 'operatingProfile.founderRevenueDependence', valueType: 'string' },
  recurringRevenueShare: { canonicalPath: 'operatingProfile.recurringRevenueShare', valueType: 'string' },
  revenueVisibility: { canonicalPath: 'operatingProfile.revenueVisibility', valueType: 'string' },
  supplierTransferability: { canonicalPath: 'operatingProfile.supplierTransferability', valueType: 'string' },
  inventoryProfile: { canonicalPath: 'operatingProfile.inventoryProfile', valueType: 'string' },
  workingCapitalHealth: { canonicalPath: 'operatingProfile.workingCapitalHealth', valueType: 'string' },
  assetSeparation: { canonicalPath: 'operatingProfile.assetSeparation', valueType: 'string' },
  fxExposure: { canonicalPath: 'operatingProfile.fxExposure', valueType: 'string' },
  ownerTotalCompensation: { canonicalPath: 'normalization.schedule.owner_comp_total', valueType: 'number' },
  marketManagerCompensation: { canonicalPath: 'normalization.schedule.owner_comp_market_equivalent', valueType: 'number' },
  relatedPartyRentPaid: { canonicalPath: 'normalization.schedule.related_party_rent_actual', valueType: 'number' },
  marketRentEquivalent: { canonicalPath: 'normalization.schedule.related_party_rent_market', valueType: 'number' },
  relatedPartyCompPaid: { canonicalPath: 'normalization.schedule.related_party_comp_actual', valueType: 'number' },
  marketRelatedPartyCompEquivalent: { canonicalPath: 'normalization.schedule.related_party_comp_market', valueType: 'number' },
  privateExpensesAmount: { canonicalPath: 'normalization.schedule.private_expense_addbacks', valueType: 'number' },
  oneOffExpenseAmount: { canonicalPath: 'normalization.schedule.one_off_expenses', valueType: 'number' },
  oneOffIncomeAmount: { canonicalPath: 'normalization.schedule.one_off_income', valueType: 'number' },
  nonCoreIncomeAmount: { canonicalPath: 'normalization.schedule.non_core_income', valueType: 'number' },
  receivablesLatest: { canonicalPath: 'financials.historicals[0].receivables', valueType: 'number' },
  inventoryValueLatest: { canonicalPath: 'financials.historicals[0].inventory', valueType: 'number' },
  payablesLatest: { canonicalPath: 'financials.historicals[0].payables', valueType: 'number' },
  maintenanceCapexLatest: { canonicalPath: 'financials.historicals[0].maintenanceCapex', valueType: 'number' },
  cashBalance: { canonicalPath: 'bridge.cashAndEquivalents', valueType: 'number' },
  financialDebt: { canonicalPath: 'bridge.interestBearingDebt', valueType: 'number' },
  shareholderLoans: { canonicalPath: 'bridge.shareholderLoans', valueType: 'number' },
  firstName: { canonicalPath: 'company.firstName', valueType: 'string' },
  businessName: { canonicalPath: 'company.businessName', valueType: 'string' },
  email: { canonicalPath: 'company.email', valueType: 'string' },
  whatsapp: { canonicalPath: 'company.whatsapp', valueType: 'string' },
  termsAccepted: { canonicalPath: 'meta.acknowledged', valueType: 'boolean' },
  newsletterOptIn: { canonicalPath: 'meta.newsletterOptIn', valueType: 'boolean' },
};

function toNumber(value: string | boolean | undefined) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasValue(value: string | boolean | undefined) {
  return String(value ?? '').trim() !== '';
}

function isTruthy(value: string | boolean | undefined) {
  if (value === true) return true;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'on';
}

function buildRequestId() {
  return `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildHistoricalPeriod(
  periodId: string,
  label: string,
  revenue: number,
  operatingProfit: number,
  options?: {
    isRepresentative?: boolean;
    receivables?: number;
    inventory?: number;
    payables?: number;
    maintenanceCapex?: number;
    cashBalance?: number;
    financialDebt?: number;
  }
) {
  return {
    periodId,
    label,
    months: 12,
    revenue,
    operatingProfit,
    receivables: options?.receivables,
    inventory: options?.inventory,
    payables: options?.payables,
    maintenanceCapex: options?.maintenanceCapex,
    cashBalance: options?.cashBalance,
    financialDebt: options?.financialDebt,
    sourceType: 'owner_estimate' as const,
    isRepresentative: options?.isRepresentative,
  };
}

function buildOwnerHistoricals(formData: V2FormData) {
  const historicals = [
    buildHistoricalPeriod('latest_owner_input', 'Latest annual owner input', toNumber(formData.revenueLatest), toNumber(formData.operatingProfitLatest), {
      isRepresentative: true,
      receivables: toNumber(formData.receivablesLatest),
      inventory: toNumber(formData.inventoryValueLatest),
      payables: toNumber(formData.payablesLatest),
      maintenanceCapex: toNumber(formData.maintenanceCapexLatest),
      cashBalance: toNumber(formData.cashBalance),
      financialDebt: toNumber(formData.financialDebt),
    }),
  ];

  if (hasValue(formData.revenuePrev1) || hasValue(formData.operatingProfitPrev1)) {
    historicals.push(
      buildHistoricalPeriod(
        'prior_year_1',
        'Previous financial year',
        toNumber(formData.revenuePrev1),
        toNumber(formData.operatingProfitPrev1)
      )
    );
  }

  if (hasValue(formData.revenuePrev2) || hasValue(formData.operatingProfitPrev2)) {
    historicals.push(
      buildHistoricalPeriod(
        'prior_year_2',
        'Two financial years ago',
        toNumber(formData.revenuePrev2),
        toNumber(formData.operatingProfitPrev2)
      )
    );
  }

  return historicals;
}

function mapPurpose(transactionGoal: string | boolean | undefined): ValuationRequest['engagement']['purpose'] {
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

function mapUrgency(transactionTimeline: string | boolean | undefined): ValuationRequest['engagement']['urgency'] {
  if (transactionTimeline === 'within_6m') return 'accelerated';
  return 'orderly';
}

function mapTargetTransaction(transactionGoal: string | boolean | undefined): ValuationRequest['engagement']['targetTransaction'] {
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

function createNormalizationLineItem(
  id: string,
  category: NormalizationLineItem['category'],
  label: string,
  adjustmentAmount: number,
  direction: NormalizationLineItem['direction'],
  affects: NormalizationLineItem['affects'],
  notes: string,
  options?: {
    recurrence?: NormalizationLineItem['recurrence'];
    reportedAmount?: number;
    normalizedAmount?: number;
  }
): NormalizationLineItem {
  return {
    id,
    category,
    label,
    periodId: 'latest_owner_input',
    reportedAmount: options?.reportedAmount,
    normalizedAmount: options?.normalizedAmount,
    adjustmentAmount,
    direction,
    recurrence: options?.recurrence || 'recurring',
    confidence: 'low',
    evidenceLevel: 'owner_statement',
    affects,
    notes,
  };
}

function buildNormalizationSchedule(formData: V2FormData) {
  const schedule: NormalizationLineItem[] = [];
  const ownerTotalComp = toNumber(formData.ownerTotalCompensation);
  const marketManagerComp = toNumber(formData.marketManagerCompensation);
  const rentActual = toNumber(formData.relatedPartyRentPaid);
  const rentMarket = toNumber(formData.marketRentEquivalent);
  const relatedPartyCompActual = toNumber(formData.relatedPartyCompPaid);
  const relatedPartyCompMarket = toNumber(formData.marketRelatedPartyCompEquivalent);
  const privateExpensesAmount = toNumber(formData.privateExpensesAmount);
  const oneOffExpenseAmount = toNumber(formData.oneOffExpenseAmount);
  const oneOffIncomeAmount = toNumber(formData.oneOffIncomeAmount);
  const nonCoreIncomeAmount = toNumber(formData.nonCoreIncomeAmount);

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

  return schedule;
}

export function buildOwnerValuationRequest(formData: V2FormData): ValuationRequest {
  const { policyGroupId } = resolveFrontendPolicyGroup(String(formData.level2 || ''));
  const submittedAt = new Date().toISOString();
  const purpose = mapPurpose(formData.transactionGoal);
  const urgency = mapUrgency(formData.transactionTimeline);
  const historicals = buildOwnerHistoricals(formData);

  const normalizationSchedule = buildNormalizationSchedule(formData);
  const policy = resolveFrontendPolicyGroup(String(formData.level2 || '')).policyGroup;
  const latestReceivables = toNumber(formData.receivablesLatest);
  const latestInventory = toNumber(formData.inventoryValueLatest);
  const latestPayables = toNumber(formData.payablesLatest);
  const actualWorkingCapital = latestReceivables + latestInventory - latestPayables;
  const earningsBaseType =
    policy.ownerPhase.capitalizedMetric === 'sde'
      ? 'sde'
      : policy.ownerPhase.marketMetric === 'adjustedEbitda'
        ? 'ebitda'
        : policy.ownerPhase.marketMetric === 'revenue'
          ? 'revenue'
          : 'ebit';

  const request: ValuationRequest = {
    meta: {
      requestId: buildRequestId(),
      mode: 'owner',
      engineVersion: 'owner-phase-skeleton-v0.4',
      submittedAt,
      currency: 'NGN',
      locale: 'en-NG',
      source: 'web-owner',
      acknowledged: isTruthy(formData.termsAccepted),
      newsletterOptIn: isTruthy(formData.newsletterOptIn),
    },
    engagement: {
      purpose,
      urgency,
      targetTransaction: mapTargetTransaction(formData.transactionGoal),
      standardOfValue: purpose === 'fundraise' ? 'investment_value' : 'fair_market_value',
      premiseOfValue: urgency === 'forced' ? 'forced_liquidation' : 'going_concern',
      valuationDate: submittedAt.slice(0, 10),
    },
    company: {
      businessName: String(formData.businessName || 'Your Business'),
      firstName: String(formData.firstName || 'Business Owner'),
      email: String(formData.email || ''),
      whatsapp: String(formData.whatsapp || ''),
      legalStructure: (String(formData.legalStructure || 'other') as ValuationRequest['company']['legalStructure']),
      ownerControlBand: (String(formData.ownerControl || 'gt_75') as ValuationRequest['company']['ownerControlBand']),
      operatingYearsBand: (String(formData.operatingYears || '1_3') as ValuationRequest['company']['operatingYearsBand']),
      primaryState: String(formData.primaryState || 'lagos_mainland'),
      businessSummary: String(formData.businessSummary || 'Business summary not provided.'),
    },
    classification: {
      level1: String(formData.level1 || ''),
      level2: String(formData.level2 || ''),
      industryFit: (String(formData.industryFit || 'not_sure') as ValuationRequest['classification']['industryFit']),
      policyGroupId,
    },
    operatingProfile: {
      catchmentArea: String(formData.catchmentArea || 'local_city'),
      marketDemand: String(formData.marketDemand || 'not_sure'),
      growthOutlook: String(formData.growthOutlook || 'not_sure'),
      differentiation: String(formData.differentiation || 'not_sure'),
      pricingPower: String(formData.pricingPower || 'not_sure'),
      customerConcentration: String(formData.customerConcentration || 'not_sure'),
      bestCustomerRisk: String(formData.bestCustomerRisk || 'severe'),
      founderRevenueDependence: String(formData.founderRevenueDependence || 'most'),
      recurringRevenueShare: String(formData.recurringRevenueShare || ''),
      revenueVisibility: String(formData.revenueVisibility || ''),
      supplierTransferability: String(formData.supplierTransferability || ''),
      hiringDifficulty: String(formData.hiringDifficulty || ''),
      fxExposure: String(formData.fxExposure || ''),
      assetSeparation: String(formData.assetSeparation || ''),
      inventoryProfile: String(formData.inventoryProfile || ''),
      workingCapitalHealth: String(formData.workingCapitalHealth || ''),
    },
    financials: {
      historicals,
      selectedRepresentativePeriodId: 'latest_owner_input',
      sourceQuality: {
        yearsAvailable: historicals.length,
        bookkeepingQuality: (String(formData.financeTracking || 'informal') as ValuationRequest['financials']['sourceQuality']['bookkeepingQuality']),
        bankingQuality: (String(formData.bankingQuality || 'informal') as ValuationRequest['financials']['sourceQuality']['bankingQuality']),
        traceablePaymentsShare: (String(formData.traceablePaymentsShare || 'lt_20') as ValuationRequest['financials']['sourceQuality']['traceablePaymentsShare']),
        proofReadiness: (String(formData.proofReadiness || 'difficult') as ValuationRequest['financials']['sourceQuality']['proofReadiness']),
      },
    },
    normalization: {
      earningsBaseType,
      schedule: normalizationSchedule,
      selectedBasePeriodId: 'latest_owner_input',
    },
    bridge: {
      cashAndEquivalents: toNumber(formData.cashBalance),
      interestBearingDebt: toNumber(formData.financialDebt),
      shareholderLoans: toNumber(formData.shareholderLoans),
      actualWorkingCapital,
    },
    readiness: {
      recordsQuality: String(formData.proofReadiness || ''),
      managementDepth: String(formData.managementDepth || ''),
      ownerAbsence2Weeks: String(formData.ownerAbsence2Weeks || ''),
      ownerAbsence3Months: String(formData.ownerAbsence3Months || ''),
      processDocumentation: String(formData.processDocumentation || ''),
      replacementDifficulty: String(formData.replacementDifficulty || ''),
    },
    evidence: {
      benchmarkCoverage: {
        publicCompsAvailable: false,
        transactionCompsAvailable: true,
        compensationBenchmarkAvailable: false,
        rentBenchmarkAvailable: false,
        workingCapitalBenchmarkAvailable: true,
      },
    },
    controls: {},
  };

  return valuationRequestSchema.parse(request);
}

export function isOwnerAcknowledged(formData: V2FormData) {
  return isTruthy(formData.termsAccepted);
}
