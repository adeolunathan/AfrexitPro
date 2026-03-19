import { z } from 'zod';

export const userModeValues = ['owner', 'advisor', 'analyst'] as const;
export const respondentRoleValues = ['owner', 'representative'] as const;
export const valuationPurposeValues = ['sale', 'fundraise', 'internal_planning', 'succession', 'lending', 'other'] as const;
export const urgencyValues = ['orderly', 'accelerated', 'forced'] as const;
export const targetTransactionValues = ['full_sale', 'partial_sale', 'minority_raise', 'not_sure'] as const;
export const standardOfValueValues = ['fair_market_value', 'investment_value', 'liquidation_value'] as const;
export const premiseOfValueValues = ['going_concern', 'orderly_liquidation', 'forced_liquidation'] as const;
export const legalStructureValues = ['sole_prop', 'partnership', 'limited_company', 'group_structure', 'other'] as const;
export const ownerControlBandValues = ['lt_25', '25_50', '51_75', 'gt_75'] as const;
export const operatingYearsBandValues = ['lt_1', '1_3', '3_5', '5_10', '10_20', 'gt_20'] as const;
export const sourceTypeValues = ['audited', 'reviewed', 'management_accounts', 'owner_estimate'] as const;
export const sourceQualityValues = ['software', 'spreadsheet', 'notes', 'informal'] as const;
export const bankingQualityValues = ['clean', 'mostly_clean', 'incomplete', 'informal'] as const;
export const proofReadinessValues = ['immediate', 'organize_fast', 'show_patterns', 'difficult'] as const;
export const traceablePaymentsShareValues = ['80_100', '50_79', '20_49', 'lt_20'] as const;
export const adjustmentDirectionValues = ['add_back', 'remove', 'bridge_only'] as const;
export const adjustmentRecurrenceValues = ['non_recurring', 'partly_recurring', 'recurring'] as const;
export const confidenceValues = ['low', 'medium', 'high'] as const;
export const evidenceLevelValues = ['owner_statement', 'management_accounts', 'third_party_document', 'analyst_estimate'] as const;
export const affectsValues = ['sde', 'ebitda', 'ebit', 'equity_bridge', 'working_capital'] as const;
export const adjustmentCategoryValues = [
  'owner_comp',
  'related_party_rent',
  'personal_expense',
  'family_payroll',
  'one_off_expense',
  'one_off_income',
  'non_operating_income',
  'non_operating_asset',
  'debt_like_item',
  'working_capital',
  'maintenance_capex',
  'tax_normalization',
  'fx_distortion',
  'other',
] as const;
export const earningsBaseTypeValues = ['sde', 'ebitda', 'ebit', 'revenue'] as const;
export const methodValues = ['market_multiple', 'capitalized_earnings', 'dcf', 'asset_approach'] as const;

export const requestMetaSchema = z.object({
  requestId: z.string().min(1),
  mode: z.enum(userModeValues),
  engineVersion: z.string().min(1),
  submittedAt: z.string().min(1),
  currency: z.literal('NGN'),
  locale: z.literal('en-NG'),
  source: z.enum(['web-owner', 'web-advisor', 'internal-analyst', 'api']),
  acknowledged: z.boolean().optional(),
  newsletterOptIn: z.boolean().optional(),
  respondentRole: z.enum(respondentRoleValues).optional(),
});

export const engagementContextSchema = z.object({
  purpose: z.enum(valuationPurposeValues),
  urgency: z.enum(urgencyValues),
  targetTransaction: z.enum(targetTransactionValues),
  standardOfValue: z.enum(standardOfValueValues),
  premiseOfValue: z.enum(premiseOfValueValues),
  valuationDate: z.string().min(1),
  previousOfferStatus: z.enum(['yes', 'expressions', 'no']).optional(),
  previousOfferAmount: z.number().nonnegative().optional(),
});

export const companyProfileSchema = z.object({
  businessName: z.string().min(1),
  firstName: z.string().min(1),
  email: z.email(),
  whatsapp: z.string().min(1),
  legalStructure: z.enum(legalStructureValues),
  ownerControlBand: z.enum(ownerControlBandValues),
  operatingYearsBand: z.enum(operatingYearsBandValues),
  primaryState: z.string().min(1),
  businessSummary: z.string().min(1),
});

export const businessClassificationSchema = z.object({
  level1: z.string().min(1),
  level2: z.string().min(1),
  level3: z.string().min(1).optional(),
  industryFit: z.enum(['perfect_fit', 'mostly_fit', 'partial_fit', 'poor_fit', 'not_sure']),
  policyGroupId: z.string().min(1),
});

export const operatingProfileSchema = z.object({
  catchmentArea: z.string().min(1),
  marketDemand: z.string().min(1),
  growthOutlook: z.string().min(1),
  differentiation: z.string().min(1),
  pricingPower: z.string().min(1),
  customerConcentration: z.string().min(1),
  bestCustomerRisk: z.string().min(1),
  founderRevenueDependence: z.string().min(1),
  recurringRevenueShare: z.string().optional(),
  revenueVisibility: z.string().optional(),
  supplierTransferability: z.string().optional(),
  hiringDifficulty: z.string().optional(),
  fxExposure: z.string().optional(),
  assetSeparation: z.string().optional(),
  inventoryProfile: z.string().optional(),
  workingCapitalHealth: z.string().optional(),
  productRights: z.string().optional(),
  quantities: z.string().optional(),
  productCustomisation: z.string().optional(),
  grossMarginStability: z.string().optional(),
  supplierConcentration: z.string().optional(),
  shrinkageSpoilage: z.string().optional(),
  peakSeasonDependency: z.string().optional(),
  staffUtilization: z.string().optional(),
  keyPersonDependencies: z.string().optional(),
  pricingPowerVsMarket: z.string().optional(),
  capacityUtilization: z.string().optional(),
  manufacturingValueCreation: z.string().optional(),
  equipmentAgeCondition: z.string().optional(),
  rawMaterialPriceExposure: z.string().optional(),
  qualityCertifications: z.string().optional(),
});

export const historicalFinancialPeriodSchema = z.object({
  periodId: z.string().min(1),
  label: z.string().min(1),
  months: z.number().positive(),
  revenue: z.number().nonnegative(),
  grossProfit: z.number().optional(),
  ebitda: z.number().optional(),
  ebit: z.number().optional(),
  operatingProfit: z.number().optional(),
  netProfit: z.number().optional(),
  depreciationAmortization: z.number().optional(),
  interestExpense: z.number().optional(),
  taxExpense: z.number().optional(),
  capex: z.number().optional(),
  maintenanceCapex: z.number().optional(),
  growthCapex: z.number().optional(),
  cashBalance: z.number().optional(),
  financialDebt: z.number().optional(),
  currentAssets: z.number().optional(),
  currentLiabilities: z.number().optional(),
  inventory: z.number().optional(),
  receivables: z.number().optional(),
  payables: z.number().optional(),
  sourceType: z.enum(sourceTypeValues),
  isRepresentative: z.boolean().optional(),
});

export const forecastPeriodSchema = z.object({
  year: z.number().int(),
  revenue: z.number(),
  ebitda: z.number().optional(),
  ebit: z.number().optional(),
  capex: z.number().optional(),
  workingCapitalChange: z.number().optional(),
});

export const forecastPackageSchema = z.object({
  forecastYears: z.array(forecastPeriodSchema).min(1),
  forecastConfidence: z.enum(confidenceValues),
});

export const dataSourceQualitySchema = z.object({
  yearsAvailable: z.number().int().min(1),
  bookkeepingQuality: z.enum(sourceQualityValues),
  bankingQuality: z.enum(bankingQualityValues),
  traceablePaymentsShare: z.enum(traceablePaymentsShareValues),
  proofReadiness: z.enum(proofReadinessValues),
});

export const financialPackageSchema = z.object({
  historicals: z.array(historicalFinancialPeriodSchema).min(1),
  forecast: forecastPackageSchema.optional(),
  selectedRepresentativePeriodId: z.string().optional(),
  sourceQuality: dataSourceQualitySchema,
});

export const normalizationLineItemSchema = z.object({
  id: z.string().min(1),
  category: z.enum(adjustmentCategoryValues),
  label: z.string().min(1),
  periodId: z.string().min(1),
  reportedAmount: z.number().optional(),
  normalizedAmount: z.number().optional(),
  adjustmentAmount: z.number(),
  direction: z.enum(adjustmentDirectionValues),
  recurrence: z.enum(adjustmentRecurrenceValues),
  confidence: z.enum(confidenceValues),
  evidenceLevel: z.enum(evidenceLevelValues),
  affects: z.enum(affectsValues),
  notes: z.string().optional(),
});

export const normalizationPackageSchema = z.object({
  earningsBaseType: z.enum(earningsBaseTypeValues),
  schedule: z.array(normalizationLineItemSchema),
  selectedBasePeriodId: z.string().min(1),
});

export const equityBridgeInputsSchema = z.object({
  cashAndEquivalents: z.number().optional(),
  interestBearingDebt: z.number().optional(),
  shareholderLoans: z.number().optional(),
  leaseLiabilities: z.number().optional(),
  taxLiabilities: z.number().optional(),
  contingentLiabilities: z.number().optional(),
  nonOperatingAssets: z.number().optional(),
  nonOperatingLiabilities: z.number().optional(),
  normalizedWorkingCapital: z.number().optional(),
  actualWorkingCapital: z.number().optional(),
});

export const readinessPackageSchema = z.object({
  recordsQuality: z.string().optional(),
  ownershipClarity: z.string().optional(),
  customerContracts: z.string().optional(),
  managementDepth: z.string().optional(),
  ownerAbsence2Weeks: z.string().optional(),
  ownerAbsence3Months: z.string().optional(),
  processDocumentation: z.string().optional(),
  replacementDifficulty: z.string().optional(),
  regulatoryCompliance: z.string().optional(),
  ipProtection: z.string().optional(),
  taxCompliance: z.string().optional(),
});

export const evidenceItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(['provided', 'missing', 'not_applicable']),
});

export const benchmarkCoverageSchema = z.object({
  publicCompsAvailable: z.boolean().optional(),
  transactionCompsAvailable: z.boolean().optional(),
  compensationBenchmarkAvailable: z.boolean().optional(),
  rentBenchmarkAvailable: z.boolean().optional(),
  workingCapitalBenchmarkAvailable: z.boolean().optional(),
});

export const evidencePackageSchema = z.object({
  documentChecklist: z.array(evidenceItemSchema).optional(),
  benchmarkCoverage: benchmarkCoverageSchema.optional(),
});

export const methodOverrideSchema = z.object({
  method: z.enum(methodValues),
  enabled: z.boolean(),
  rationale: z.string().min(1),
});

export const compOverrideSchema = z.object({
  compId: z.string().min(1),
  action: z.enum(['include', 'exclude']),
  rationale: z.string().min(1),
});

export const assumptionOverrideSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  rationale: z.string().min(1),
});

export const analystControlsSchema = z.object({
  methodOverrides: z.array(methodOverrideSchema).optional(),
  compOverrides: z.array(compOverrideSchema).optional(),
  assumptionOverrides: z.array(assumptionOverrideSchema).optional(),
});

export const valuationRequestSchema = z.object({
  meta: requestMetaSchema,
  engagement: engagementContextSchema,
  company: companyProfileSchema,
  classification: businessClassificationSchema,
  operatingProfile: operatingProfileSchema,
  financials: financialPackageSchema,
  normalization: normalizationPackageSchema,
  bridge: equityBridgeInputsSchema,
  readiness: readinessPackageSchema,
  evidence: evidencePackageSchema,
  controls: analystControlsSchema.optional().default({}),
});

export const methodSelectionResultSchema = z.object({
  policyGroupId: z.string().min(1),
  primaryMethod: z.enum(methodValues),
  secondaryMethods: z.array(z.enum(methodValues)),
  floorMethod: z.enum(methodValues).optional(),
  rationale: z.array(z.string()),
});

export const normalizedMetricSetSchema = z.object({
  representativePeriodId: z.string().min(1),
  revenue: z.number(),
  sde: z.number().optional(),
  adjustedEbitda: z.number().optional(),
  adjustedEbit: z.number().optional(),
  actualWorkingCapital: z.number().optional(),
  normalizedWorkingCapital: z.number().optional(),
  maintenanceCapex: z.number().optional(),
  netDebt: z.number().optional(),
});

export const historicalTrendPeriodSchema = z.object({
  periodId: z.string().min(1),
  label: z.string().min(1),
  revenue: z.number(),
  operatingProfit: z.number(),
  operatingMarginPct: z.number().nullable(),
  workingCapital: z.number().optional(),
  maintenanceCapex: z.number().optional(),
  isLatest: z.boolean(),
});

export const historyAnalysisSchema = z.object({
  yearsAvailable: z.number().int().min(1),
  representativePeriodId: z.string().min(1),
  representativeRevenue: z.number(),
  representativeOperatingProfit: z.number(),
  revenueGrowthPct: z.number().nullable(),
  revenueStabilityScore: z.number().min(0).max(100),
  marginStabilityScore: z.number().min(0).max(100),
  periods: z.array(historicalTrendPeriodSchema),
});

const rangedValueSchema = z.object({
  fundamentalLow: z.number(),
  fundamentalMid: z.number(),
  fundamentalHigh: z.number(),
  achievableTodayLow: z.number(),
  achievableTodayMid: z.number(),
  achievableTodayHigh: z.number(),
  forcedSaleLow: z.number().optional(),
  forcedSaleMid: z.number().optional(),
  forcedSaleHigh: z.number().optional(),
});

const qualitativeAdjustmentSchema = z.object({
  geographyBucket: z.string().optional(),
  normalizedPrimaryState: z.string().optional(),
  geographyAdjustmentFactor: z.number().optional(),
  branchFamily: z.string().optional(),
  branchQualityFactor: z.number().optional(),
  branchSignalScore: z.number().optional(),
  branchSignals: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string().min(1),
        score: z.number().min(0).max(100),
      })
    )
    .optional(),
});

export const valueConclusionSchema = z.object({
  enterpriseValue: rangedValueSchema,
  equityValue: rangedValueSchema,
  reconciliation: z
    .object({
      marketApproach: z.number().optional(),
      incomeApproach: z.number().optional(),
      assetApproach: z.number().optional(),
      appliedWeights: z.record(z.string(), z.number()).optional(),
      methodNormalizationImpacts: z
        .array(
          z.object({
            method: z.enum(methodValues),
            driverMetric: z.string().min(1),
            rawDriverMetricValue: z.number().optional(),
            normalizedDriverMetricValue: z.number().optional(),
            rawMid: z.number().optional(),
            normalizedMid: z.number().optional(),
            deltaMid: z.number().optional(),
          })
        )
        .optional(),
      qualitativeAdjustments: qualitativeAdjustmentSchema.optional(),
    })
    .optional(),
});

export const readinessAssessmentSchema = z.object({
  overallScore: z.number().min(0).max(100),
  recordsQuality: z.number().min(0).max(100),
  ownershipClarity: z.number().min(0).max(100),
  customerTransferability: z.number().min(0).max(100),
  managementDepth: z.number().min(0).max(100),
  compliance: z.number().min(0).max(100),
  documentation: z.number().min(0).max(100),
  topGaps: z.array(z.string()),
});

export const confidenceAssessmentSchema = z.object({
  overallScore: z.number().min(0).max(100),
  dataCompleteness: z.number().min(0).max(100),
  recordsQuality: z.number().min(0).max(100),
  benchmarkCoverage: z.number().min(0).max(100),
  earningsStability: z.number().min(0).max(100),
  rangeWidthPct: z.number().nonnegative(),
  notes: z.array(z.string()),
});

export const scorecardSchema = z.object({
  marketPosition: z.number().min(0).max(100),
  financialQuality: z.number().min(0).max(100),
  ownerIndependence: z.number().min(0).max(100),
  revenueQuality: z.number().min(0).max(100),
  operatingResilience: z.number().min(0).max(100),
  transactionReadiness: z.number().min(0).max(100),
});

export const valuationSummarySchema = z.object({
  businessName: z.string().min(1),
  lowEstimate: z.number(),
  adjustedValue: z.number(),
  highEstimate: z.number(),
  readinessScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  rating: z.string().min(1),
  warnings: z.array(z.string()),
  scorecard: scorecardSchema,
  experimental: z.boolean(),
});

export const calibrationContextSchema = z.object({
  source: z.enum(['registry_default', 'benchmark_calibrated']),
  benchmarkSetIds: z.array(z.string()),
  observationCount: z.number().int().nonnegative(),
  evidenceScore: z.number().min(0).max(100),
  lastCalibrated: z.string().min(1).optional(),
  freshnessStatus: z.enum(['fresh', 'aging', 'stale']).optional(),
  freshestBenchmarkDate: z.string().min(1).optional(),
  freshnessDays: z.number().int().nonnegative().optional(),
  sourceReliabilityScore: z.number().min(0).max(100).optional(),
  sourceMix: z.array(z.string()).optional(),
  internalObservationCount: z.number().int().nonnegative().optional(),
  transactionObservationShare: z.number().min(0).max(1).optional(),
  notes: z.array(z.string()),
});

export const valuationResultSchema = z.object({
  meta: z.object({
    requestId: z.string().min(1),
    engineVersion: z.string().min(1),
    mode: z.enum(userModeValues),
    generatedAt: z.string().min(1),
    experimental: z.boolean(),
  }),
  engagement: z.object({
    purpose: z.enum(valuationPurposeValues),
    urgency: z.enum(urgencyValues),
    standardOfValue: z.enum(standardOfValueValues),
    premiseOfValue: z.enum(premiseOfValueValues),
  }),
  classification: z.object({
    level1: z.string().min(1),
    level2: z.string().min(1),
    policyGroupId: z.string().min(1),
  }),
  summary: valuationSummarySchema,
  historyAnalysis: historyAnalysisSchema,
  calibrationContext: calibrationContextSchema,
  selectedMethods: methodSelectionResultSchema,
  normalizationSchedule: z.array(normalizationLineItemSchema),
  normalizedMetrics: normalizedMetricSetSchema,
  valueConclusion: valueConclusionSchema,
  readinessAssessment: readinessAssessmentSchema,
  confidenceAssessment: confidenceAssessmentSchema,
  redFlags: z.array(z.string()),
  assumptions: z.array(z.string()),
  audit: z.object({
    warnings: z.array(z.string()),
    validationPassed: z.boolean(),
    qualitativeAdjustments: qualitativeAdjustmentSchema.optional(),
  }),
});

export type RequestMeta = z.infer<typeof requestMetaSchema>;
export type EngagementContext = z.infer<typeof engagementContextSchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type BusinessClassification = z.infer<typeof businessClassificationSchema>;
export type OperatingProfile = z.infer<typeof operatingProfileSchema>;
export type HistoricalFinancialPeriod = z.infer<typeof historicalFinancialPeriodSchema>;
export type FinancialPackage = z.infer<typeof financialPackageSchema>;
export type NormalizationLineItem = z.infer<typeof normalizationLineItemSchema>;
export type NormalizationPackage = z.infer<typeof normalizationPackageSchema>;
export type EquityBridgeInputs = z.infer<typeof equityBridgeInputsSchema>;
export type ReadinessPackage = z.infer<typeof readinessPackageSchema>;
export type EvidencePackage = z.infer<typeof evidencePackageSchema>;
export type AnalystControls = z.infer<typeof analystControlsSchema>;
export type ValuationRequest = z.infer<typeof valuationRequestSchema>;
export type MethodSelectionResult = z.infer<typeof methodSelectionResultSchema>;
export type NormalizedMetricSet = z.infer<typeof normalizedMetricSetSchema>;
export type HistoricalTrendPeriod = z.infer<typeof historicalTrendPeriodSchema>;
export type HistoryAnalysis = z.infer<typeof historyAnalysisSchema>;
export type ValueConclusion = z.infer<typeof valueConclusionSchema>;
export type ReadinessAssessment = z.infer<typeof readinessAssessmentSchema>;
export type ConfidenceAssessment = z.infer<typeof confidenceAssessmentSchema>;
export type ValuationSummary = z.infer<typeof valuationSummarySchema>;
export type CalibrationContext = z.infer<typeof calibrationContextSchema>;
export type ValuationResult = z.infer<typeof valuationResultSchema>;
