import type { FormData } from '@/types/valuation';
import { valuationRequestSchema, type NormalizationLineItem, type ValuationRequest } from './contracts';
import { resolveFrontendPolicyGroup } from './policy-registry';

type OwnerFieldValueType = 'string' | 'number' | 'boolean';

export type OwnerFieldId =
  // Anchor phase
  | 'level1'
  | 'level2'
  | 'respondentRole'
  | 'industryFit'
  | 'businessDescription'
  | 'businessSummary'
  | 'primaryState'
  | 'operatingYears'
  | 'legalStructure'
  | 'ownerControl'
  | 'transactionGoal'
  | 'transactionTimeline'
  | 'revenueLatest'
  | 'revenuePrevious1'
  | 'revenuePrevious2'
  | 'operatingProfitLatest'
  | 'operatingProfitPrevious1'
  | 'operatingProfitPrevious2'
  | 'catchmentArea'
  | 'pricingPower'
  | 'proofReadiness'
  | 'marketDemand'
  // Branch: Product/Retail
  | 'inventoryValueLatest'
  | 'inventoryProfile'
  | 'productRights'
  | 'quantities'
  | 'productCustomisation'
  | 'grossMarginStability'
  | 'supplierConcentration'
  | 'shrinkageSpoilage'
  | 'peakSeasonDependency'
  // Branch: Professional Services
  | 'founderRevenueDependence'
  | 'recurringRevenueShare'
  | 'revenueVisibility'
  | 'staffUtilization'
  | 'keyPersonDependencies'
  | 'pricingPowerVsMarket'
  // Branch: Manufacturing
  | 'capacityUtilization'
  | 'manufacturingValueCreation'
  | 'equipmentAgeCondition'
  | 'maintenanceCapexLatest'
  | 'customerConcentration'
  | 'rawMaterialPriceExposure'
  | 'qualityCertifications'
  // Closing phase
  | 'traceablePaymentsShare'
  | 'bankingQuality'
  | 'financeTracking'
  | 'cashFlowPosition'
  | 'ownerAbsence2Weeks'
  | 'ownerAbsence3Months'
  | 'ownerCustomerRelationship'
  | 'managementIndependence'
  | 'managementDepth'
  | 'processDocumentation'
  | 'replacementDifficulty'
  | 'employeeTenure'
  | 'laborMarketDifficulty'
  | 'recruitmentForGrowth'
  | 'growthPotential'
  | 'hiringDifficulty'
  | 'customerConcentration'
  | 'bestCustomerImpact'
  | 'bestCustomerRisk'
  | 'partnerDependency'
  | 'largestSupplierShare'
  | 'supplierReplacementTime'
  | 'supplierTransferability'
  | 'criticalHireTime'
  | 'criticalHireSalaryPremium'
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
  | 'annualDepreciation'
  | 'receivablesLatest'
  | 'payablesLatest'
  | 'cashBalance'
  | 'financialDebt'
  | 'shareholderLoans'
  | 'previousOffer'
  | 'previousOfferAmount'
  | 'firstName'
  | 'lastName'
  | 'businessName'
  | 'email'
  | 'whatsapp'
  | 'termsAccepted'
  | 'newsletterOptIn'
  // Legacy fields (kept for compatibility)
  | 'growthOutlook'
  | 'differentiation'
  | 'revenuePrev1'
  | 'operatingProfitPrev1'
  | 'revenuePrev2'
  | 'operatingProfitPrev2';

interface OwnerFieldBinding {
  canonicalPath: string;
  valueType: OwnerFieldValueType;
}

export const ownerFieldBindings: Record<OwnerFieldId, OwnerFieldBinding> = {
  level1: { canonicalPath: 'classification.level1', valueType: 'string' },
  level2: { canonicalPath: 'classification.level2', valueType: 'string' },
  respondentRole: { canonicalPath: 'meta.respondentRole', valueType: 'string' },
  industryFit: { canonicalPath: 'classification.industryFit', valueType: 'string' },
  businessDescription: { canonicalPath: 'company.businessSummary', valueType: 'string' },
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
  revenuePrevious1: { canonicalPath: 'financials.historicals[1].revenue', valueType: 'number' },
  revenuePrevious2: { canonicalPath: 'financials.historicals[2].revenue', valueType: 'number' },
  operatingProfitLatest: { canonicalPath: 'financials.historicals[0].operatingProfit', valueType: 'number' },
  operatingProfitPrevious1: { canonicalPath: 'financials.historicals[1].operatingProfit', valueType: 'number' },
  operatingProfitPrevious2: { canonicalPath: 'financials.historicals[2].operatingProfit', valueType: 'number' },
  revenuePrev1: { canonicalPath: 'financials.historicals[1].revenue', valueType: 'number' },
  operatingProfitPrev1: { canonicalPath: 'financials.historicals[1].operatingProfit', valueType: 'number' },
  revenuePrev2: { canonicalPath: 'financials.historicals[2].revenue', valueType: 'number' },
  operatingProfitPrev2: { canonicalPath: 'financials.historicals[2].operatingProfit', valueType: 'number' },
  proofReadiness: { canonicalPath: 'financials.sourceQuality.proofReadiness', valueType: 'string' },
  traceablePaymentsShare: { canonicalPath: 'financials.sourceQuality.traceablePaymentsShare', valueType: 'string' },
  bankingQuality: { canonicalPath: 'financials.sourceQuality.bankingQuality', valueType: 'string' },
  financeTracking: { canonicalPath: 'financials.sourceQuality.bookkeepingQuality', valueType: 'string' },
  cashFlowPosition: { canonicalPath: 'financials.cashFlowPosition', valueType: 'string' },
  ownerAbsence2Weeks: { canonicalPath: 'readiness.ownerAbsence2Weeks', valueType: 'string' },
  ownerAbsence3Months: { canonicalPath: 'readiness.ownerAbsence3Months', valueType: 'string' },
  ownerCustomerRelationship: { canonicalPath: 'operatingProfile.founderRevenueDependence', valueType: 'string' },
  managementIndependence: { canonicalPath: 'readiness.managementIndependence', valueType: 'string' },
  managementDepth: { canonicalPath: 'readiness.managementDepth', valueType: 'string' },
  processDocumentation: { canonicalPath: 'readiness.processDocumentation', valueType: 'string' },
  replacementDifficulty: { canonicalPath: 'readiness.replacementDifficulty', valueType: 'string' },
  employeeTenure: { canonicalPath: 'operatingProfile.employeeTenure', valueType: 'string' },
  laborMarketDifficulty: { canonicalPath: 'operatingProfile.hiringDifficulty', valueType: 'string' },
  recruitmentForGrowth: { canonicalPath: 'operatingProfile.recruitmentForGrowth', valueType: 'string' },
  growthPotential: { canonicalPath: 'operatingProfile.growthOutlook', valueType: 'string' },
  hiringDifficulty: { canonicalPath: 'operatingProfile.hiringDifficulty', valueType: 'string' },
  customerConcentration: { canonicalPath: 'operatingProfile.customerConcentration', valueType: 'string' },
  bestCustomerImpact: { canonicalPath: 'operatingProfile.bestCustomerRisk', valueType: 'string' },
  bestCustomerRisk: { canonicalPath: 'operatingProfile.bestCustomerRisk', valueType: 'string' },
  partnerDependency: { canonicalPath: 'operatingProfile.supplierTransferability', valueType: 'string' },
  largestSupplierShare: { canonicalPath: 'operatingProfile.largestSupplierShare', valueType: 'string' },
  supplierReplacementTime: { canonicalPath: 'operatingProfile.supplierReplacementTime', valueType: 'string' },
  founderRevenueDependence: { canonicalPath: 'operatingProfile.founderRevenueDependence', valueType: 'string' },
  recurringRevenueShare: { canonicalPath: 'operatingProfile.recurringRevenueShare', valueType: 'string' },
  revenueVisibility: { canonicalPath: 'operatingProfile.revenueVisibility', valueType: 'string' },
  supplierTransferability: { canonicalPath: 'operatingProfile.supplierTransferability', valueType: 'string' },
  criticalHireTime: { canonicalPath: 'operatingProfile.criticalHireTime', valueType: 'string' },
  criticalHireSalaryPremium: { canonicalPath: 'operatingProfile.criticalHireSalaryPremium', valueType: 'string' },
  inventoryProfile: { canonicalPath: 'operatingProfile.inventoryProfile', valueType: 'string' },
  productRights: { canonicalPath: 'operatingProfile.productRights', valueType: 'string' },
  quantities: { canonicalPath: 'operatingProfile.quantities', valueType: 'string' },
  productCustomisation: { canonicalPath: 'operatingProfile.productCustomisation', valueType: 'string' },
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
  annualDepreciation: { canonicalPath: 'financials.historicals[0].depreciationAmortization', valueType: 'number' },
  receivablesLatest: { canonicalPath: 'financials.historicals[0].receivables', valueType: 'number' },
  inventoryValueLatest: { canonicalPath: 'financials.historicals[0].inventory', valueType: 'number' },
  payablesLatest: { canonicalPath: 'financials.historicals[0].payables', valueType: 'number' },
  maintenanceCapexLatest: { canonicalPath: 'financials.historicals[0].maintenanceCapex', valueType: 'number' },
  cashBalance: { canonicalPath: 'bridge.cashAndEquivalents', valueType: 'number' },
  financialDebt: { canonicalPath: 'bridge.interestBearingDebt', valueType: 'number' },
  shareholderLoans: { canonicalPath: 'bridge.shareholderLoans', valueType: 'number' },
  previousOffer: { canonicalPath: 'engagement.previousOfferStatus', valueType: 'string' },
  previousOfferAmount: { canonicalPath: 'engagement.previousOfferAmount', valueType: 'number' },
  firstName: { canonicalPath: 'company.firstName', valueType: 'string' },
  lastName: { canonicalPath: 'company.lastName', valueType: 'string' },
  businessName: { canonicalPath: 'company.businessName', valueType: 'string' },
  email: { canonicalPath: 'company.email', valueType: 'string' },
  whatsapp: { canonicalPath: 'company.whatsapp', valueType: 'string' },
  termsAccepted: { canonicalPath: 'meta.acknowledged', valueType: 'boolean' },
  newsletterOptIn: { canonicalPath: 'meta.newsletterOptIn', valueType: 'boolean' },
  // Branch: Product/Retail
  grossMarginStability: { canonicalPath: 'operatingProfile.grossMarginStability', valueType: 'string' },
  supplierConcentration: { canonicalPath: 'operatingProfile.supplierConcentration', valueType: 'string' },
  shrinkageSpoilage: { canonicalPath: 'operatingProfile.shrinkageSpoilage', valueType: 'string' },
  peakSeasonDependency: { canonicalPath: 'operatingProfile.peakSeasonDependency', valueType: 'string' },
  // Branch: Professional Services
  staffUtilization: { canonicalPath: 'operatingProfile.staffUtilization', valueType: 'string' },
  keyPersonDependencies: { canonicalPath: 'operatingProfile.keyPersonDependencies', valueType: 'string' },
  pricingPowerVsMarket: { canonicalPath: 'operatingProfile.pricingPowerVsMarket', valueType: 'string' },
  // Branch: Manufacturing
  capacityUtilization: { canonicalPath: 'operatingProfile.capacityUtilization', valueType: 'string' },
  manufacturingValueCreation: { canonicalPath: 'operatingProfile.manufacturingValueCreation', valueType: 'string' },
  equipmentAgeCondition: { canonicalPath: 'operatingProfile.equipmentAgeCondition', valueType: 'string' },
  rawMaterialPriceExposure: { canonicalPath: 'operatingProfile.rawMaterialPriceExposure', valueType: 'string' },
  qualityCertifications: { canonicalPath: 'operatingProfile.qualityCertifications', valueType: 'string' },
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

function normalizePrimaryState(value: string | boolean | undefined) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return 'lagos_mainland';

  const aliases: Record<string, string> = {
    abuja_fct: 'fct',
    abuja: 'fct',
    port_harcourt: 'rivers',
  };

  return aliases[normalized] || normalized;
}

function normalizeRespondentRole(value: string | boolean | undefined) {
  return String(value ?? '').trim() === 'representative' ? 'representative' : 'owner';
}

function normalizeIndustryFit(value: string | boolean | undefined): ValuationRequest['classification']['industryFit'] {
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

function normalizeCatchmentArea(value: string | boolean | undefined) {
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

function normalizePricingPower(value: string | boolean | undefined) {
  switch (String(value ?? '').trim()) {
    case 'market_price':
    case 'price_competition':
      return 'none';
    case 'slight_premium':
      return 'some';
    case 'significant_premium':
      return 'premium';
    case 'strong_premium':
    case 'premium':
    case 'some':
    case 'none':
    case 'not_sure':
      return String(value);
    default:
      return 'not_sure';
  }
}

function normalizeGrowthOutlook(value: string | boolean | undefined) {
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

function scoreLargestSupplierShare(value: string | boolean | undefined) {
  switch (String(value ?? '').trim()) {
    case 'lt_20':
      return 85;
    case '20_35':
      return 65;
    case '35_60':
      return 40;
    case 'gt_60':
      return 20;
    default:
      return undefined;
  }
}

function scoreSupplierReplacementTime(value: string | boolean | undefined) {
  switch (String(value ?? '').trim()) {
    case 'lt_2w':
      return 85;
    case '2_8w':
      return 65;
    case '2_6m':
      return 40;
    case 'gt_6m':
      return 20;
    default:
      return undefined;
  }
}

function normalizeSupplierTransferability(value: string | boolean | undefined) {
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

function deriveSupplierTransferability(
  largestSupplierShare: string | boolean | undefined,
  supplierReplacementTime: string | boolean | undefined,
  fallbackValue: string | boolean | undefined
) {
  const shareScore = scoreLargestSupplierShare(largestSupplierShare);
  const replacementScore = scoreSupplierReplacementTime(supplierReplacementTime);
  if (typeof shareScore !== 'number' && typeof replacementScore !== 'number') {
    return normalizeSupplierTransferability(fallbackValue);
  }

  const compositeScore = typeof shareScore === 'number' && typeof replacementScore === 'number'
    ? (shareScore + replacementScore) / 2
    : shareScore ?? replacementScore ?? 50;

  if (compositeScore >= 76) return 'very_easy';
  if (compositeScore >= 56) return 'manageable';
  if (compositeScore >= 36) return 'uncertain';
  return 'very_difficult';
}

function scoreCriticalHireTime(value: string | boolean | undefined) {
  switch (String(value ?? '').trim()) {
    case 'lt_30d':
      return 82;
    case '1_3m':
      return 65;
    case '3_6m':
      return 40;
    case 'gt_6m':
      return 20;
    default:
      return undefined;
  }
}

function scoreCriticalHireSalaryPremium(value: string | boolean | undefined) {
  switch (String(value ?? '').trim()) {
    case 'none':
      return 82;
    case 'up_to_10':
      return 68;
    case '10_25':
      return 45;
    case 'gt_25':
      return 25;
    default:
      return undefined;
  }
}

function normalizeHiringDifficulty(value: string | boolean | undefined) {
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

function deriveHiringDifficulty(
  criticalHireTime: string | boolean | undefined,
  criticalHireSalaryPremium: string | boolean | undefined,
  fallbackValue: string | boolean | undefined
) {
  const hireTimeScore = scoreCriticalHireTime(criticalHireTime);
  const salaryPremiumScore = scoreCriticalHireSalaryPremium(criticalHireSalaryPremium);
  if (typeof hireTimeScore !== 'number' && typeof salaryPremiumScore !== 'number') {
    return normalizeHiringDifficulty(fallbackValue);
  }

  const compositeScore = typeof hireTimeScore === 'number' && typeof salaryPremiumScore === 'number'
    ? (hireTimeScore + salaryPremiumScore) / 2
    : hireTimeScore ?? salaryPremiumScore ?? 50;

  if (compositeScore >= 74) return 'easy';
  if (compositeScore >= 56) return 'feasible';
  if (compositeScore >= 36) return 'difficult';
  return 'severe';
}

function normalizeCustomerConcentration(value: string | boolean | undefined) {
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

function deriveBestCustomerRisk(customerConcentration: string) {
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

function normalizeBestCustomerRisk(
  value: string | boolean | undefined,
  customerConcentration: string
): 'minor' | 'noticeable' | 'major' | 'severe' {
  switch (String(value ?? '').trim()) {
    case 'minor':
    case 'noticeable':
    case 'major':
    case 'severe':
      return String(value) as 'minor' | 'noticeable' | 'major' | 'severe';
    default:
      return deriveBestCustomerRisk(customerConcentration) as 'minor' | 'noticeable' | 'major' | 'severe';
  }
}

function normalizeFounderDependence(value: string | boolean | undefined) {
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

function normalizePreviousOfferStatus(value: string | boolean | undefined) {
  const normalized = String(value ?? '').trim();
  if (normalized === 'yes' || normalized === 'expressions' || normalized === 'no') {
    return normalized as 'yes' | 'expressions' | 'no';
  }

  return undefined;
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
    depreciationAmortization?: number;
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
    depreciationAmortization: options?.depreciationAmortization,
    cashBalance: options?.cashBalance,
    financialDebt: options?.financialDebt,
    sourceType: 'owner_estimate' as const,
    isRepresentative: options?.isRepresentative,
  };
}

function buildOwnerHistoricals(formData: FormData) {
  const revenuePrevious1 = hasValue(formData.revenuePrevious1) ? formData.revenuePrevious1 : formData.revenuePrev1;
  const operatingProfitPrevious1 = hasValue(formData.operatingProfitPrevious1)
    ? formData.operatingProfitPrevious1
    : formData.operatingProfitPrev1;
  const revenuePrevious2 = hasValue(formData.revenuePrevious2) ? formData.revenuePrevious2 : formData.revenuePrev2;
  const operatingProfitPrevious2 = hasValue(formData.operatingProfitPrevious2)
    ? formData.operatingProfitPrevious2
    : formData.operatingProfitPrev2;

  const historicals = [
    buildHistoricalPeriod('latest_owner_input', 'Latest annual owner input', toNumber(formData.revenueLatest), toNumber(formData.operatingProfitLatest), {
      isRepresentative: true,
      receivables: toNumber(formData.receivablesLatest),
      inventory: toNumber(formData.inventoryValueLatest),
      payables: toNumber(formData.payablesLatest),
      maintenanceCapex: toNumber(formData.maintenanceCapexLatest),
      depreciationAmortization: toNumber(formData.annualDepreciation),
      cashBalance: toNumber(formData.cashBalance),
      financialDebt: toNumber(formData.financialDebt),
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

function buildOwnerForecast(formData: FormData): ValuationRequest['financials']['forecast'] | undefined {
  const rawPeriods = formData._financialPeriods;
  if (!Array.isArray(rawPeriods)) {
    return undefined;
  }

  const forecastPeriod = rawPeriods.find(
    (period): period is { id?: unknown; enabled?: unknown; revenue?: unknown; operatingProfit?: unknown } =>
      Boolean(period && typeof period === 'object' && 'id' in period && (period as { id?: unknown }).id === 'forecast')
  );

  if (!forecastPeriod || forecastPeriod.enabled !== true) {
    return undefined;
  }

  const revenue = toNumber(forecastPeriod.revenue as string | boolean | undefined);
  const operatingProfitRaw = forecastPeriod.operatingProfit as string | boolean | undefined;
  const hasOperatingProfit = hasValue(operatingProfitRaw);

  if (revenue <= 0 && !hasOperatingProfit) {
    return undefined;
  }

  return {
    forecastYears: [
      {
        year: new Date().getFullYear(),
        revenue,
        ebit: hasOperatingProfit ? toNumber(operatingProfitRaw) : undefined,
      },
    ],
    forecastConfidence: 'low',
  };
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

function mapUrgency(
  transactionTimeline: string | boolean | undefined,
  transactionGoal: string | boolean | undefined
): ValuationRequest['engagement']['urgency'] {
  if (transactionTimeline === 'within_6m') {
    return transactionGoal === 'external_sale' || transactionGoal === 'partial_sale' ? 'forced' : 'accelerated';
  }

  if (transactionTimeline === '6_12m') {
    return 'accelerated';
  }

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

function mapStandardOfValue(
  purpose: ValuationRequest['engagement']['purpose'],
  transactionGoal: string | boolean | undefined
): ValuationRequest['engagement']['standardOfValue'] {
  if (purpose === 'fundraise') return 'investment_value';
  if (transactionGoal === 'partial_sale') return 'investment_value';
  return 'fair_market_value';
}

function mapPremiseOfValue(
  urgency: ValuationRequest['engagement']['urgency']
): ValuationRequest['engagement']['premiseOfValue'] {
  if (urgency === 'forced') return 'forced_liquidation';
  if (urgency === 'accelerated') return 'orderly_liquidation';
  return 'going_concern';
}

function deriveWorkingCapitalHealth(
  options: {
    hasInputs: boolean;
    actualWorkingCapital: number;
    revenue: number;
    targetPct?: number;
    inventoryProfile?: string | boolean | undefined;
    level1?: string | boolean | undefined;
    existingValue?: string | boolean | undefined;
  }
) {
  if (hasValue(options.existingValue)) {
    return String(options.existingValue);
  }

  if (!options.hasInputs || options.revenue <= 0) {
    return 'not_sure';
  }

  const inventoryProfile = String(options.inventoryProfile || '');
  const level1 = String(options.level1 || '');

  if (options.actualWorkingCapital <= 0) {
    if (inventoryProfile === 'lt_7' || inventoryProfile === 'service_business' || level1 === 'trade') {
      return 'healthy';
    }
    return 'tight';
  }

  const normalizedWorkingCapital = options.revenue * (options.targetPct ?? 0.06);
  if (normalizedWorkingCapital <= 0) {
    const intensity = options.actualWorkingCapital / options.revenue;
    if (intensity <= 0.08) return 'healthy';
    if (intensity <= 0.18) return 'tight';
    return 'under_pressure';
  }

  const coverage = options.actualWorkingCapital / normalizedWorkingCapital;
  if (coverage >= 0.9) return 'healthy';
  if (coverage >= 0.5) return 'tight';
  return 'under_pressure';
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

function buildNormalizationSchedule(formData: FormData) {
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

function toAnswerString(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}`;
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
}

function mapPurposeToTransactionGoal(
  engagement: Pick<ValuationRequest['engagement'], 'purpose' | 'targetTransaction'>
): FormData['transactionGoal'] {
  if (engagement.targetTransaction === 'partial_sale') return 'partial_sale';
  if (engagement.targetTransaction === 'minority_raise') return 'investor_entry';
  if (engagement.purpose === 'succession') return 'internal_handover';
  if (engagement.purpose === 'internal_planning') return 'value_improvement';
  return 'external_sale';
}

function mapUrgencyToTransactionTimeline(urgency: ValuationRequest['engagement']['urgency']): FormData['transactionTimeline'] {
  if (urgency === 'forced') return 'within_6m';
  if (urgency === 'accelerated') return '6_12m';
  return '12_24m';
}

function mapFounderDependenceToOwnerRelationship(value: unknown): FormData['ownerCustomerRelationship'] {
  switch (String(value ?? '').trim()) {
    case 'very_little':
      return 'brand_not_personal';
    case 'some':
      return 'knows_not_expected';
    case 'large_share':
      return 'expects_involvement';
    case 'most':
      return 'buying_owner';
    default:
      return 'knows_not_expected';
  }
}

function mapOwnerAbsence3Months(value: unknown) {
  const normalized = String(value ?? '').trim();
  if (normalized === 'smooth') return 'no_disruption';
  return normalized;
}

function mapSupplierTransferabilityToLargestSupplierShare(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'very_easy':
      return 'lt_20';
    case 'manageable':
      return '20_35';
    case 'uncertain':
      return '35_60';
    case 'very_difficult':
      return 'gt_60';
    default:
      return '';
  }
}

function mapSupplierTransferabilityToReplacementTime(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'very_easy':
      return 'lt_2w';
    case 'manageable':
      return '2_8w';
    case 'uncertain':
      return '2_6m';
    case 'very_difficult':
      return 'gt_6m';
    default:
      return '';
  }
}

function mapHiringDifficultyToHireTime(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'easy':
      return 'lt_30d';
    case 'feasible':
      return '1_3m';
    case 'difficult':
      return '3_6m';
    case 'severe':
      return 'gt_6m';
    default:
      return '';
  }
}

function mapHiringDifficultyToSalaryPremium(value: unknown) {
  switch (String(value ?? '').trim()) {
    case 'easy':
      return 'none';
    case 'feasible':
      return 'up_to_10';
    case 'difficult':
      return '10_25';
    case 'severe':
      return 'gt_25';
    default:
      return '';
  }
}

function findHistoricalPeriod(request: ValuationRequest, periodId: string, fallbackIndex?: number) {
  const byId = request.financials.historicals.find((period) => period.periodId === periodId);
  if (byId) return byId;
  if (typeof fallbackIndex === 'number') {
    return request.financials.historicals[fallbackIndex];
  }
  return undefined;
}

function getNormalizationItem(
  schedule: NormalizationLineItem[],
  predicate: (item: NormalizationLineItem) => boolean
) {
  return schedule.find(predicate);
}

function getNormalizationAmount(item: NormalizationLineItem | undefined, key: 'reportedAmount' | 'normalizedAmount') {
  const value = item?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof item?.adjustmentAmount === 'number' && Number.isFinite(item.adjustmentAmount) && key === 'reportedAmount') {
    return item.adjustmentAmount;
  }

  return 0;
}

function sumNormalizationAmounts(
  schedule: NormalizationLineItem[],
  predicate: (item: NormalizationLineItem) => boolean
) {
  return schedule.reduce((total, item) => {
    if (!predicate(item)) return total;
    const value =
      typeof item.reportedAmount === 'number' && Number.isFinite(item.reportedAmount)
        ? item.reportedAmount
        : typeof item.adjustmentAmount === 'number' && Number.isFinite(item.adjustmentAmount)
          ? item.adjustmentAmount
          : 0;
    return total + value;
  }, 0);
}

export function buildOwnerValuationRequest(formData: FormData): ValuationRequest {
  const { policyGroupId, policyGroup } = resolveFrontendPolicyGroup(String(formData.level2 || ''));
  const submittedAt = new Date().toISOString();
  const purpose = mapPurpose(formData.transactionGoal);
  const urgency = mapUrgency(formData.transactionTimeline, formData.transactionGoal);
  const historicals = buildOwnerHistoricals(formData);
  const forecast = buildOwnerForecast(formData);
  const normalizationSchedule = buildNormalizationSchedule(formData);
  const latestReceivables = toNumber(formData.receivablesLatest);
  const latestInventory = toNumber(formData.inventoryValueLatest);
  const latestPayables = toNumber(formData.payablesLatest);
  const hasWorkingCapitalInputs =
    hasValue(formData.receivablesLatest) || hasValue(formData.inventoryValueLatest) || hasValue(formData.payablesLatest);
  const actualWorkingCapital = latestReceivables + latestInventory - latestPayables;
  const customerConcentration = normalizeCustomerConcentration(formData.customerConcentration);
  const previousOfferStatus = normalizePreviousOfferStatus(formData.previousOffer);
  const previousOfferAmount =
    previousOfferStatus === 'yes' && hasValue(formData.previousOfferAmount) ? toNumber(formData.previousOfferAmount) : undefined;
  const lastName = String(formData.lastName || '').trim();
  const founderRevenueDependence = hasValue(formData.founderRevenueDependence)
    ? normalizeFounderDependence(formData.founderRevenueDependence)
    : normalizeFounderDependence(formData.ownerCustomerRelationship);
  const supplierTransferability = deriveSupplierTransferability(
    formData.largestSupplierShare,
    formData.supplierReplacementTime,
    formData.partnerDependency || formData.supplierTransferability
  );
  const hiringDifficulty = deriveHiringDifficulty(
    formData.criticalHireTime,
    formData.criticalHireSalaryPremium,
    formData.laborMarketDifficulty || formData.hiringDifficulty
  );
  const earningsBaseType =
    policyGroup.ownerPhase.capitalizedMetric === 'sde'
      ? 'sde'
      : policyGroup.ownerPhase.marketMetric === 'adjustedEbitda'
        ? 'ebitda'
        : policyGroup.ownerPhase.marketMetric === 'revenue'
          ? 'revenue'
          : 'ebit';
  const workingCapitalHealth = deriveWorkingCapitalHealth({
    hasInputs: hasWorkingCapitalInputs,
    actualWorkingCapital,
    revenue: toNumber(formData.revenueLatest),
    targetPct: policyGroup.ownerPhase.workingCapitalTargetPct,
    inventoryProfile: formData.inventoryProfile,
    level1: formData.level1,
    existingValue: formData.workingCapitalHealth,
  });

  const request: ValuationRequest = {
    meta: {
      requestId: buildRequestId(),
      mode: 'owner',
      engineVersion: 'owner-phase-skeleton-v0.5',
      submittedAt,
      currency: 'NGN',
      locale: 'en-NG',
      source: 'web-owner',
      acknowledged: isTruthy(formData.termsAccepted),
      newsletterOptIn: isTruthy(formData.newsletterOptIn),
      respondentRole: normalizeRespondentRole(formData.respondentRole),
    },
    engagement: {
      purpose,
      urgency,
      targetTransaction: mapTargetTransaction(formData.transactionGoal),
      standardOfValue: mapStandardOfValue(purpose, formData.transactionGoal),
      premiseOfValue: mapPremiseOfValue(urgency),
      valuationDate: submittedAt.slice(0, 10),
      previousOfferStatus,
      previousOfferAmount,
    },
    company: {
      businessName: String(formData.businessName || 'Your Business'),
      firstName: String(formData.firstName || 'Business Owner'),
      ...(lastName ? { lastName } : {}),
      email: String(formData.email || ''),
      whatsapp: String(formData.whatsapp || ''),
      legalStructure: (String(formData.legalStructure || 'other') as ValuationRequest['company']['legalStructure']),
      ownerControlBand: (String(formData.ownerControl || 'gt_75') as ValuationRequest['company']['ownerControlBand']),
      operatingYearsBand: (String(formData.operatingYears || '1_3') as ValuationRequest['company']['operatingYearsBand']),
      primaryState: normalizePrimaryState(formData.primaryState),
      businessSummary: String(formData.businessSummary || formData.businessDescription || 'Business summary not provided.'),
    },
    classification: {
      level1: String(formData.level1 || ''),
      level2: String(formData.level2 || ''),
      industryFit: normalizeIndustryFit(formData.industryFit),
      policyGroupId,
    },
    operatingProfile: {
      catchmentArea: normalizeCatchmentArea(formData.catchmentArea),
      marketDemand: String(formData.marketDemand || 'not_sure'),
      growthOutlook: normalizeGrowthOutlook(formData.growthPotential || formData.growthOutlook),
      differentiation: String(formData.differentiation || 'not_sure'),
      pricingPower: normalizePricingPower(formData.pricingPower),
      customerConcentration,
      bestCustomerRisk: normalizeBestCustomerRisk(formData.bestCustomerImpact || formData.bestCustomerRisk, customerConcentration),
      founderRevenueDependence,
      recurringRevenueShare: String(formData.recurringRevenueShare || ''),
      revenueVisibility: String(formData.revenueVisibility || ''),
      supplierTransferability,
      largestSupplierShare: String(formData.largestSupplierShare || ''),
      supplierReplacementTime: String(formData.supplierReplacementTime || ''),
      hiringDifficulty,
      criticalHireTime: String(formData.criticalHireTime || ''),
      criticalHireSalaryPremium: String(formData.criticalHireSalaryPremium || ''),
      fxExposure: String(formData.fxExposure || ''),
      assetSeparation: String(formData.assetSeparation || ''),
      inventoryProfile: String(formData.inventoryProfile || ''),
      workingCapitalHealth,
      productRights: String(formData.productRights || ''),
      quantities: String(formData.quantities || ''),
      productCustomisation: String(formData.productCustomisation || ''),
      grossMarginStability: String(formData.grossMarginStability || ''),
      supplierConcentration: String(formData.supplierConcentration || ''),
      shrinkageSpoilage: String(formData.shrinkageSpoilage || ''),
      peakSeasonDependency: String(formData.peakSeasonDependency || ''),
      staffUtilization: String(formData.staffUtilization || ''),
      keyPersonDependencies: String(formData.keyPersonDependencies || ''),
      pricingPowerVsMarket: String(formData.pricingPowerVsMarket || ''),
      capacityUtilization: String(formData.capacityUtilization || ''),
      manufacturingValueCreation: String(formData.manufacturingValueCreation || ''),
      equipmentAgeCondition: String(formData.equipmentAgeCondition || ''),
      rawMaterialPriceExposure: String(formData.rawMaterialPriceExposure || ''),
      qualityCertifications: String(formData.qualityCertifications || ''),
    },
    financials: {
      historicals,
      forecast,
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

export function buildOwnerAnswersFromRequest(request: ValuationRequest): FormData {
  const latestPeriod =
    request.financials.historicals.find((period) => period.isRepresentative) ||
    findHistoricalPeriod(request, 'latest_owner_input', 0) ||
    request.financials.historicals[0];
  const prior1 = findHistoricalPeriod(request, 'prior_year_1', 1);
  const prior2 = findHistoricalPeriod(request, 'prior_year_2', 2);
  const forecastYear = request.financials.forecast?.forecastYears?.[0];
  const schedule = request.normalization?.schedule || [];

  const ownerCompTotal = getNormalizationItem(schedule, (item) => item.id === 'owner-comp-total')
    || getNormalizationItem(schedule, (item) => item.id === 'owner-comp-market-delta');
  const ownerCompMarket = getNormalizationItem(schedule, (item) => item.id === 'owner-comp-market-delta');
  const relatedPartyRent = getNormalizationItem(schedule, (item) => item.id === 'related-party-rent-delta');
  const relatedPartyComp = getNormalizationItem(schedule, (item) => item.id === 'related-party-pay-delta');

  const currentYear = new Date().getFullYear();

  return {
    respondentRole: request.meta.respondentRole || 'owner',
    termsAccepted: Boolean(request.meta.acknowledged),
    newsletterOptIn: Boolean(request.meta.newsletterOptIn),
    level1: request.classification.level1,
    level2: request.classification.level2,
    industryFit: request.classification.industryFit,
    businessDescription: request.company.businessSummary || '',
    businessSummary: request.company.businessSummary || '',
    businessName: request.company.businessName || '',
    firstName: request.company.firstName || '',
    lastName: request.company.lastName || '',
    email: request.company.email || '',
    whatsapp: request.company.whatsapp || '',
    legalStructure: request.company.legalStructure,
    ownerControl: request.company.ownerControlBand,
    operatingYears: request.company.operatingYearsBand,
    primaryState: request.company.primaryState,
    transactionGoal: mapPurposeToTransactionGoal(request.engagement),
    transactionTimeline: mapUrgencyToTransactionTimeline(request.engagement.urgency),
    revenueLatest: toAnswerString(latestPeriod?.revenue),
    operatingProfitLatest: toAnswerString(latestPeriod?.operatingProfit),
    revenuePrevious1: toAnswerString(prior1?.revenue),
    operatingProfitPrevious1: toAnswerString(prior1?.operatingProfit),
    revenuePrevious2: toAnswerString(prior2?.revenue),
    operatingProfitPrevious2: toAnswerString(prior2?.operatingProfit),
    _financialPeriods: [
      {
        id: 'prior2',
        label: `${currentYear - 3}`,
        enabled: Boolean(prior2),
        revenue: toAnswerString(prior2?.revenue),
        operatingProfit: toAnswerString(prior2?.operatingProfit),
      },
      {
        id: 'prior1',
        label: `${currentYear - 2}`,
        enabled: Boolean(prior1),
        revenue: toAnswerString(prior1?.revenue),
        operatingProfit: toAnswerString(prior1?.operatingProfit),
      },
      {
        id: 'latest',
        label: `${currentYear - 1} Actual`,
        enabled: true,
        revenue: toAnswerString(latestPeriod?.revenue),
        operatingProfit: toAnswerString(latestPeriod?.operatingProfit),
      },
      {
        id: 'forecast',
        label: `${currentYear} Forecast`,
        enabled: Boolean(forecastYear),
        revenue: toAnswerString(forecastYear?.revenue),
        operatingProfit: toAnswerString(forecastYear?.ebit),
      },
    ],
    catchmentArea: request.operatingProfile.catchmentArea || '',
    pricingPower: request.operatingProfile.pricingPower || '',
    proofReadiness: request.financials.sourceQuality.proofReadiness || '',
    marketDemand: request.operatingProfile.marketDemand || '',
    traceablePaymentsShare: request.financials.sourceQuality.traceablePaymentsShare || '',
    bankingQuality: request.financials.sourceQuality.bankingQuality || '',
    financeTracking: request.financials.sourceQuality.bookkeepingQuality || '',
    ownerAbsence2Weeks: request.readiness.ownerAbsence2Weeks || '',
    ownerAbsence3Months: mapOwnerAbsence3Months(request.readiness.ownerAbsence3Months || ''),
    ownerCustomerRelationship: mapFounderDependenceToOwnerRelationship(request.operatingProfile.founderRevenueDependence),
    managementDepth: request.readiness.managementDepth || '',
    processDocumentation: request.readiness.processDocumentation || '',
    replacementDifficulty: request.readiness.replacementDifficulty || '',
    laborMarketDifficulty: request.operatingProfile.hiringDifficulty || '',
    criticalHireTime:
      request.operatingProfile.criticalHireTime || mapHiringDifficultyToHireTime(request.operatingProfile.hiringDifficulty),
    criticalHireSalaryPremium:
      request.operatingProfile.criticalHireSalaryPremium
      || mapHiringDifficultyToSalaryPremium(request.operatingProfile.hiringDifficulty),
    growthPotential: request.operatingProfile.growthOutlook || '',
    differentiation: request.operatingProfile.differentiation || '',
    customerConcentration: request.operatingProfile.customerConcentration || '',
    bestCustomerImpact: request.operatingProfile.bestCustomerRisk || '',
    partnerDependency: request.operatingProfile.supplierTransferability || '',
    largestSupplierShare:
      request.operatingProfile.largestSupplierShare
      || mapSupplierTransferabilityToLargestSupplierShare(request.operatingProfile.supplierTransferability),
    supplierReplacementTime:
      request.operatingProfile.supplierReplacementTime
      || mapSupplierTransferabilityToReplacementTime(request.operatingProfile.supplierTransferability),
    assetSeparation: request.operatingProfile.assetSeparation || '',
    fxExposure: request.operatingProfile.fxExposure || '',
    founderRevenueDependence: request.operatingProfile.founderRevenueDependence || '',
    recurringRevenueShare: request.operatingProfile.recurringRevenueShare || '',
    revenueVisibility: request.operatingProfile.revenueVisibility || '',
    inventoryProfile: request.operatingProfile.inventoryProfile || '',
    workingCapitalHealth: request.operatingProfile.workingCapitalHealth || '',
    productRights: request.operatingProfile.productRights || '',
    quantities: request.operatingProfile.quantities || '',
    productCustomisation: request.operatingProfile.productCustomisation || '',
    grossMarginStability: request.operatingProfile.grossMarginStability || '',
    supplierConcentration: request.operatingProfile.supplierConcentration || '',
    shrinkageSpoilage: request.operatingProfile.shrinkageSpoilage || '',
    peakSeasonDependency: request.operatingProfile.peakSeasonDependency || '',
    staffUtilization: request.operatingProfile.staffUtilization || '',
    keyPersonDependencies: request.operatingProfile.keyPersonDependencies || '',
    pricingPowerVsMarket: request.operatingProfile.pricingPowerVsMarket || '',
    capacityUtilization: request.operatingProfile.capacityUtilization || '',
    manufacturingValueCreation: request.operatingProfile.manufacturingValueCreation || '',
    equipmentAgeCondition: request.operatingProfile.equipmentAgeCondition || '',
    rawMaterialPriceExposure: request.operatingProfile.rawMaterialPriceExposure || '',
    qualityCertifications: request.operatingProfile.qualityCertifications || '',
    receivablesLatest: toAnswerString(latestPeriod?.receivables),
    inventoryValueLatest: toAnswerString(latestPeriod?.inventory),
    payablesLatest: toAnswerString(latestPeriod?.payables),
    maintenanceCapexLatest: toAnswerString(latestPeriod?.maintenanceCapex),
    annualDepreciation: toAnswerString(latestPeriod?.depreciationAmortization),
    cashBalance: toAnswerString(request.bridge.cashAndEquivalents),
    financialDebt: toAnswerString(request.bridge.interestBearingDebt),
    shareholderLoans: toAnswerString(request.bridge.shareholderLoans),
    ownerTotalCompensation: toAnswerString(getNormalizationAmount(ownerCompTotal, 'reportedAmount')),
    marketManagerCompensation: toAnswerString(getNormalizationAmount(ownerCompMarket, 'normalizedAmount')),
    relatedPartyRentPaid: toAnswerString(getNormalizationAmount(relatedPartyRent, 'reportedAmount')),
    marketRentEquivalent: toAnswerString(getNormalizationAmount(relatedPartyRent, 'normalizedAmount')),
    relatedPartyCompPaid: toAnswerString(getNormalizationAmount(relatedPartyComp, 'reportedAmount')),
    marketRelatedPartyCompEquivalent: toAnswerString(getNormalizationAmount(relatedPartyComp, 'normalizedAmount')),
    privateExpensesAmount: toAnswerString(sumNormalizationAmounts(schedule, (item) => item.category === 'personal_expense')),
    oneOffExpenseAmount: toAnswerString(sumNormalizationAmounts(schedule, (item) => item.category === 'one_off_expense')),
    oneOffIncomeAmount: toAnswerString(sumNormalizationAmounts(schedule, (item) => item.category === 'one_off_income')),
    nonCoreIncomeAmount: toAnswerString(sumNormalizationAmounts(schedule, (item) => item.category === 'non_operating_income')),
    previousOffer: request.engagement.previousOfferStatus || '',
    previousOfferAmount: toAnswerString(request.engagement.previousOfferAmount),
  };
}

export function isOwnerAcknowledged(formData: FormData) {
  return isTruthy(formData.termsAccepted);
}
