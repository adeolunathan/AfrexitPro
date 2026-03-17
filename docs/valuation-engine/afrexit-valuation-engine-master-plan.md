# Afrexit Valuation Engine Master Plan

Status: canonical internal planning document  
Last updated: March 7, 2026  
Scope: owner-first implementation with advisor and analyst architecture defined upfront

## Status Tracker

### Done

- legacy heuristic engine frozen and no longer treated as the target architecture
- canonical request and result contracts created
- shared `level2 -> policyGroupId` registry created and used on both frontend and backend
- V2 owner question bank wired to canonical schema paths
- owner-mode local backend rebuilt around policy selection, quantified normalization, EV-to-equity bridge, readiness, and confidence
- V2 result payload now exposes structured historical trend detail and calibration provenance for internal review
- calibration table and benchmark-data layers now cover all owner-phase policy groups
- weaker owner-phase policy groups have now been upgraded from public-comp-heavy proxy sets into sourceable small-business transaction proxy sets plus explicit owner-mode overlays where direct evidence is still thin
- local admin view now exists for benchmark sets, source notes, calibration notes, source-date aging, and stale-data warnings without opening JSON files
- method-level normalization impact is now exposed alongside the selected valuation approaches
- a local internal observation capture workflow now exists so Afrexit mandate/review cases can be recorded and later ingested into benchmark calibration
- local owner-mode regression fixtures now exist so the engine can be re-tested without filling the full questionnaire by hand
- regression coverage now spans multiple owner policy groups beyond the initial manufacturing, retail, and professional-service cases
- internal observations now support approval state, edit, delete, and ingest gating so only approved calibration-eligible records flow into benchmark maintenance
- owner-mode confidence now directly penalizes stale benchmark evidence and weak source quality instead of only showing that risk in admin review
- saved valuation submissions can now surface as draft internal-case candidates in admin, so real Afrexit cases can be promoted into observations without retyping everything from scratch
- owner-phase valuation logic traceability is now documented so each question, mapping, and engine effect can be audited explicitly

### In Progress

- owner-phase financial intake now supports `1-3` years, with one year accepted for launch and additional years improving confidence and defensibility
- normalization now carries quantified owner estimates, with deeper working-capital treatment being refined in the owner-phase engine
- engine logic is being split into dedicated modules so future advisor and analyst additions are additive rather than a rewrite
- the first Nigeria-native benchmark replacement cycle has started, but the weaker groups still need progressively richer internal Afrexit observations to displace foreign transaction proxies
- the internal observation workflow now exists, but it still needs real Afrexit mandate and review entries before calibration can meaningfully become Nigeria-native
- the new case-candidate path reduces manual re-entry, but the team still needs to verify metric, basis, and value before any candidate becomes an approved internal observation
- benchmark provenance still needs cleanup because some external reference URLs are stale and the current transaction-proxy refresh path is curated rather than live-extracted

### Next

- tighten owner-mode calibration around historical trend quality, working-capital intensity, and method dispersion
- grow the internal observation base so transaction-proxy sets can be overridden by Nigeria-private-market evidence wherever coverage becomes defensible
- decide the exact boundary between owner launch scope and the first advisor-extension milestone
- add a lightweight repeatable smoke-test flow to future engine changes so fixture coverage expands as the policy groups and normalization logic deepen
- promote genuine saved submissions and closed/reviewed cases into approved internal observations on a steady cadence
- replace stale external reference links with current or archived references, and store reproducible value snapshots alongside them

## Internal Case Capture Fields

The admin workflow for real Afrexit mandate/review observations should capture these exact fields before any record becomes calibration-eligible:

- `caseId`
- `companyAlias`
- `caseType`
- `caseStage`
- `transactionContext`
- `policyGroupId`
- `level1`
- `level2`
- `primaryState`
- `metric`
- `basis`
- `value`
- `sourceKind`
- `sizeBand`
- `quality`
- `observedAt`
- `sourceName`
- `sourceUrl`
- `sourceDate`
- `notes`
- `enteredBy`
- `sourceSubmissionId`
- `sourceSubmissionTimestamp`
- `calibrationEligible`
- `approvalStatus`
- `approvalNotes`
- `approvedBy`

Interpretation:

- `caseId` is the persistent Afrexit case reference
- `companyAlias` is the internal anonymized label we are comfortable surfacing in benchmark provenance
- `caseType`, `caseStage`, and `transactionContext` explain why the observation exists and how close it is to a real market outcome
- `policyGroupId`, `level1`, `level2`, and `primaryState` explain where the observation belongs
- `metric`, `basis`, and `value` are the actual benchmark payload
- `source*`, `enteredBy`, and approval fields are the governance layer
- `sourceSubmission*` links a captured observation back to an earlier saved submission when the admin flow starts from a case candidate rather than manual entry

## 1. Purpose

This document is the working source of truth for the Afrexit valuation-engine redesign.

It replaces ad hoc discussion and prevents the team from extending the wrong model. It is intentionally written as an implementation-facing plan, not a pitch deck.

The immediate goal is to ship a defensible owner-facing first-pass valuation product for Nigerian SMEs. The longer-term goal is to evolve the same engine into an advisor-grade and analyst-grade system without rewriting the foundations.

## 2. Core Product Decisions

### 2.1 Owner-first, not owner-only

The first product to ship is for business owners. That is the commercial priority.

But the architecture must be built so that:

- advisor mode can be added without reworking the core schema
- analyst mode can be added without reworking the method-selection system
- the question model can deepen without breaking the meaning of existing fields

### 2.2 Users do not choose valuation method

Users should not choose `DCF`, `multiples`, `capitalized earnings`, or `asset approach`.

The engine chooses methods based on:

- purpose
- urgency
- `level1`
- `level2`
- financial profile
- data quality
- profitability
- capital intensity

Only analyst mode may override method selection, and every override must log a rationale.

### 2.3 One canonical engine, three intake depths

We are not building three separate engines.

We are building:

- one canonical data model
- one canonical method-policy system
- one canonical output model
- three intake layers:
  - owner core
  - advisor extension
  - analyst controls

### 2.4 Build incrementally, but architect completely

Recommendation:

- do **not** code the full advisor and analyst valuation logic now
- **do** define their schema, controls, and extension points now
- implement owner-phase calculations first using the same canonical structures

This is the right tradeoff because it avoids overbuilding while still preventing future schema and engine overhauls.

## 3. Freeze Decision

The current `server/valuation-v2/engine.mjs` is now considered a legacy experimental heuristic.

It remains useful as:

- a local demo backend
- a UI wiring stub
- a reference for early UX testing

It must not be treated as the long-term model to extend.

What is frozen:

- broad `level1`-only multiples
- binary normalization penalties
- one-step readiness multiplier
- simple confidence heuristic
- single-pass output structure

What is not frozen:

- the V2 local-lab scaffolding
- the separation from production
- the local-only experimental workflow

## 4. Implementation Strategy

### 4.1 Phased engine build

#### Phase 0: Freeze and specification

- freeze current heuristic engine
- adopt this document as canonical plan
- define shared schema
- define method-policy matrix
- define output structure

#### Phase 1: Owner-grade first-pass engine

Build the production-worthy first-pass owner model around:

- market approach as primary default where appropriate
- capitalized earnings where appropriate
- asset floor where required
- simplified but quantified normalization
- EV-to-equity bridge
- separate readiness and confidence outputs

Do not expose advisor or analyst controls yet.

#### Phase 2: Advisor-grade extension

Add:

- deeper normalization schedule
- more years of data
- benchmark visibility
- method weights and reconciliation narrative
- overrides for selected assumptions

#### Phase 3: Analyst-grade workbench

Add:

- override controls with audit trail
- comp inclusion/exclusion controls
- scenario controls
- assumption versioning
- review flags
- exportable technical reports

### 4.2 Code architecture decision

The engine code should be modular from day one, even if some modules are simple at owner launch.

Recommended backend module boundary:

1. `classification/`
2. `schema/`
3. `normalization/`
4. `policy/`
5. `approaches/market/`
6. `approaches/income/`
7. `approaches/asset/`
8. `bridge/`
9. `readiness/`
10. `confidence/`
11. `reconciliation/`
12. `output/`
13. `audit/`

Owner phase should fully implement only the pieces needed for owner output, but the folders/contracts should reflect the long-term architecture.

## 5. Canonical Shared Data Schema

This is the canonical data model all modes must map into.

Mode-specific forms may ask different questions, but they must populate this same structure.

```ts
type UserMode = 'owner' | 'advisor' | 'analyst';

interface ValuationRequest {
  meta: RequestMeta;
  engagement: EngagementContext;
  company: CompanyProfile;
  classification: BusinessClassification;
  operatingProfile: OperatingProfile;
  financials: FinancialPackage;
  normalization: NormalizationPackage;
  bridge: EquityBridgeInputs;
  readiness: ReadinessPackage;
  evidence: EvidencePackage;
  controls: AnalystControls;
}
```

### 5.1 `meta`

```ts
interface RequestMeta {
  requestId: string;
  mode: UserMode;
  engineVersion: string;
  submittedAt: string;
  currency: 'NGN';
  locale: 'en-NG';
  source: 'web-owner' | 'web-advisor' | 'internal-analyst' | 'api';
}
```

### 5.2 `engagement`

```ts
interface EngagementContext {
  purpose: 'sale' | 'fundraise' | 'internal_planning' | 'succession' | 'lending' | 'other';
  urgency: 'orderly' | 'accelerated' | 'forced';
  targetTransaction: 'full_sale' | 'partial_sale' | 'minority_raise' | 'not_sure';
  standardOfValue: 'fair_market_value' | 'investment_value' | 'liquidation_value';
  premiseOfValue: 'going_concern' | 'orderly_liquidation' | 'forced_liquidation';
  valuationDate: string;
}
```

Owner mode should not ask for all of these directly. Some should be inferred by rules.

### 5.3 `company`

```ts
interface CompanyProfile {
  businessName: string;
  firstName: string;
  email: string;
  whatsapp: string;
  legalStructure: 'sole_prop' | 'partnership' | 'limited_company' | 'group_structure' | 'other';
  ownerControlBand: 'lt_25' | '25_50' | '51_75' | 'gt_75';
  operatingYearsBand: 'lt_1' | '1_3' | '3_5' | '5_10' | '10_20' | 'gt_20';
  primaryState: string;
  businessSummary: string;
}
```

### 5.4 `classification`

```ts
interface BusinessClassification {
  level1: string;
  level2: string;
  level3?: string;
  industryFit: 'perfect_fit' | 'mostly_fit' | 'partial_fit' | 'poor_fit' | 'not_sure';
  policyGroupId: string;
}
```

`policyGroupId` is assigned by the engine based on the Level 2 policy matrix in Section 7.

### 5.5 `operatingProfile`

```ts
interface OperatingProfile {
  catchmentArea: 'local_city' | 'single_state' | 'multi_state' | 'national_single_base' | 'national_multi_base' | 'international';
  marketDemand: 'declining' | 'flat' | 'steady_growth' | 'strong_growth' | 'not_sure';
  growthOutlook: 'decline' | 'stable' | 'moderate_growth' | 'strong_growth' | 'not_sure';
  differentiation: string;
  pricingPower: string;
  customerConcentration: string;
  bestCustomerRisk: string;
  founderRevenueDependence: string;
  recurringRevenueShare?: string;
  revenueVisibility?: string;
  supplierTransferability?: string;
  hiringDifficulty?: string;
  fxExposure?: string;
  assetSeparation?: string;
  inventoryProfile?: string;
  workingCapitalHealth?: string;
}
```

### 5.6 `financials`

```ts
interface FinancialPackage {
  historicals: HistoricalFinancialPeriod[];
  forecast?: ForecastPackage;
  selectedRepresentativePeriodId?: string;
  sourceQuality: DataSourceQuality;
}

interface HistoricalFinancialPeriod {
  periodId: string;
  label: string; // FY2023, FY2024, TTM, etc.
  months: number;
  revenue: number;
  grossProfit?: number;
  ebitda?: number;
  ebit?: number;
  operatingProfit?: number;
  netProfit?: number;
  depreciationAmortization?: number;
  interestExpense?: number;
  taxExpense?: number;
  capex?: number;
  maintenanceCapex?: number;
  growthCapex?: number;
  cashBalance?: number;
  financialDebt?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  inventory?: number;
  receivables?: number;
  payables?: number;
  sourceType: 'audited' | 'reviewed' | 'management_accounts' | 'owner_estimate';
  isRepresentative?: boolean;
}

interface ForecastPackage {
  forecastYears: ForecastPeriod[];
  forecastConfidence: 'low' | 'medium' | 'high';
}

interface ForecastPeriod {
  year: number;
  revenue: number;
  ebitda?: number;
  ebit?: number;
  capex?: number;
  workingCapitalChange?: number;
}

interface DataSourceQuality {
  yearsAvailable: number;
  bookkeepingQuality: 'software' | 'spreadsheet' | 'notes' | 'informal';
  bankingQuality: 'clean' | 'mostly_clean' | 'incomplete' | 'informal';
  traceablePaymentsShare: '80_100' | '50_79' | '20_49' | 'lt_20';
  proofReadiness: 'immediate' | 'organize_fast' | 'show_patterns' | 'difficult';
}
```

### 5.7 `normalization`

```ts
interface NormalizationPackage {
  earningsBaseType: 'sde' | 'ebitda' | 'ebit' | 'revenue';
  schedule: NormalizationLineItem[];
  selectedBasePeriodId: string;
}
```

The schedule shape is defined in Section 9.

### 5.8 `bridge`

```ts
interface EquityBridgeInputs {
  cashAndEquivalents?: number;
  interestBearingDebt?: number;
  shareholderLoans?: number;
  leaseLiabilities?: number;
  taxLiabilities?: number;
  contingentLiabilities?: number;
  nonOperatingAssets?: number;
  nonOperatingLiabilities?: number;
  normalizedWorkingCapital?: number;
  actualWorkingCapital?: number;
}
```

### 5.9 `readiness`

```ts
interface ReadinessPackage {
  recordsQuality?: string;
  ownershipClarity?: string;
  customerContracts?: string;
  managementDepth?: string;
  ownerAbsence2Weeks?: string;
  ownerAbsence3Months?: string;
  processDocumentation?: string;
  regulatoryCompliance?: string;
  ipProtection?: string;
  taxCompliance?: string;
}
```

### 5.10 `evidence`

```ts
interface EvidencePackage {
  documentChecklist?: EvidenceItem[];
  benchmarkCoverage?: BenchmarkCoverage;
}

interface EvidenceItem {
  id: string;
  label: string;
  status: 'provided' | 'missing' | 'not_applicable';
}

interface BenchmarkCoverage {
  publicCompsAvailable?: boolean;
  transactionCompsAvailable?: boolean;
  compensationBenchmarkAvailable?: boolean;
  rentBenchmarkAvailable?: boolean;
  workingCapitalBenchmarkAvailable?: boolean;
}
```

### 5.11 `controls`

```ts
interface AnalystControls {
  methodOverrides?: MethodOverride[];
  compOverrides?: CompOverride[];
  assumptionOverrides?: AssumptionOverride[];
}
```

Owner mode will not expose this block, but the schema must reserve it.

## 6. Shared Schema by Mode

The same schema is used across modes, but the required depth changes.

| Schema area | Owner | Advisor | Analyst |
| --- | --- | --- | --- |
| `meta` | required | required | required |
| `engagement` | inferred + minimal inputs | required | required |
| `company` | required | required | required |
| `classification.level1/level2` | required | required | required |
| `financials.historicals` | 1-3 years, simplified | 3-5 years, fuller lines | 3-5 years + verification |
| `forecast` | optional / limited | recommended | required when using DCF |
| `normalization.schedule` | simplified quantified items | full schedule | full schedule + support |
| `bridge` | simplified debt/cash/wc | fuller detail | full detail |
| `readiness` | required | required | required |
| `evidence` | light | moderate | deep |
| `controls` | hidden | light | full |

## 7. Level 2 Method Policy Matrix

The actual engine should not hardcode one policy per raw Level 2 row. That creates repetition and drift.

Instead:

1. map every `level2` value to a `policyGroupId`
2. define one method policy per policy group
3. let the engine choose methods from the policy group

### 7.1 Policy group definitions

| Policy group | Primary method | Secondary method | Floor / check | Primary benchmark needs | Risk model emphasis |
| --- | --- | --- | --- | --- | --- |
| `PG_AGRI_PRIMARY` | Capitalized earnings | Market multiples | Asset floor | private transaction comps, crop/livestock margin norms, working-capital norms | seasonality, commodity-price risk, weather exposure, informal records |
| `PG_AGRO_PROCESSING` | EBITDA multiples | Capitalized earnings | Asset floor | transaction comps, EBITDA margin comps, maintenance-capex norms | raw-material FX, power cost, throughput stability |
| `PG_ASSET_HEAVY_MANUFACTURING` | EBITDA multiples | Asset approach | Required | EBITDA comps, replacement-cost cues, working-capital norms | capex burden, equipment age, energy cost, FX inputs |
| `PG_CONTRACT_MANUFACTURING` | EBITDA multiples | Capitalized earnings | Asset floor | contract-manufacturing comps, customer concentration comps | customer concentration, margin pressure, contract durability |
| `PG_PROJECT_CONTRACTING` | Capitalized earnings | EBITDA multiples | Asset floor | project-services comps, backlog norms, margin volatility norms | project timing, working-capital swings, founder dependence |
| `PG_TRADING_DISTRIBUTION` | EBITDA or EBIT multiples | Capitalized earnings | Working-capital check required | distributor comps, gross margin comps, payable/inventory norms | working capital, FX, supplier dependence, margin compression |
| `PG_RETAIL_COMMERCE` | EBIT / EBITDA multiples | Revenue multiples | Asset floor | retail comps, same-store and margin comps | inventory risk, location risk, footfall volatility |
| `PG_RECURRING_SOFTWARE` | Revenue multiples | DCF | No asset floor | ARR / revenue comps, growth comps, churn / retention comps | churn, product stickiness, CAC efficiency |
| `PG_PROJECT_SOFTWARE_IT` | EBITDA multiples | Capitalized earnings | No asset floor | IT-services comps, utilization and margin comps | client concentration, key-person risk, recurring share |
| `PG_LOGISTICS_ASSET` | EBITDA multiples | Asset approach | Required | logistics comps, fleet-utilization norms, fuel-cost sensitivity | fleet age, fuel cost, driver retention, maintenance capex |
| `PG_HOSPITALITY_VENUE` | EBITDA multiples | DCF | Asset floor | venue comps, occupancy/turnover comps, rent norms | seasonality, location dependence, lease risk |
| `PG_HEALTHCARE_SERVICE` | EBITDA multiples | DCF | Asset floor | healthcare-service comps, utilization norms | regulatory risk, doctor/key-practitioner dependence, equipment life |
| `PG_HEALTHCARE_DISTRIBUTION` | EBITDA multiples | Asset approach | Required | distribution comps, inventory turns, FX exposure norms | inventory obsolescence, FX, compliance |
| `PG_EDUCATION_ENROLLMENT` | Capitalized earnings | EBITDA multiples | Asset floor | school/training comps, enrollment and retention norms | enrollment concentration, compliance, capacity utilization |
| `PG_PROFESSIONAL_OWNER_LED` | SDE / capitalized earnings | EBITDA multiples | No asset floor | small advisory/service comps, owner-replacement compensation data | founder dependence, non-recurring revenue, concentration |
| `PG_PROFESSIONAL_PLATFORM` | EBITDA multiples | Capitalized earnings | No asset floor | scaled service-firm comps, management depth benchmarks | talent retention, recurring clients, delivery scalability |
| `PG_REAL_ESTATE_SERVICE` | EBITDA multiples | Capitalized earnings | Asset floor | brokerage/facility-service comps, contract norms | contract retention, local market depth, staff dependence |
| `PG_PROPERTY_ASSET_NAV` | Asset approach | DCF | Required | NAV references, property yield/occupancy comps | permits, absorption, FX-linked construction cost |
| `PG_CREATIVE_AGENCY` | SDE / EBITDA multiples | Capitalized earnings | No asset floor | agency comps, utilization and client concentration norms | key-client risk, founder brand dependence, project volatility |
| `PG_LOCAL_SERVICE_OWNER_OP` | SDE / capitalized earnings | EBITDA multiples | Asset floor where equipment matters | small business transaction comps, owner-comp benchmarks | owner dependence, informality, local demand concentration |

### 7.2 Level 2 to policy-group mapping

This is the operative Level 2 matrix to use in code and documentation.

| Level 1 | Level 2 | Policy group |
| --- | --- | --- |
| agriculture | `farming_primary` | `PG_AGRI_PRIMARY` |
| agriculture | `livestock_aqua` | `PG_AGRI_PRIMARY` |
| agriculture | `agro_processing` | `PG_AGRO_PROCESSING` |
| agriculture | `farm_inputs` | `PG_TRADING_DISTRIBUTION` |
| agriculture | `raw_material_supply` | `PG_AGRI_PRIMARY` |
| manufacturing | `food_beverage_manufacturing` | `PG_ASSET_HEAVY_MANUFACTURING` |
| manufacturing | `consumer_goods_manufacturing` | `PG_ASSET_HEAVY_MANUFACTURING` |
| manufacturing | `wood_household_products` | `PG_ASSET_HEAVY_MANUFACTURING` |
| manufacturing | `building_fabricated_products` | `PG_ASSET_HEAVY_MANUFACTURING` |
| manufacturing | `chemicals_materials` | `PG_ASSET_HEAVY_MANUFACTURING` |
| manufacturing | `machinery_components` | `PG_ASSET_HEAVY_MANUFACTURING` |
| manufacturing | `contract_manufacturing` | `PG_CONTRACT_MANUFACTURING` |
| manufacturing | `packaging_printing_products` | `PG_ASSET_HEAVY_MANUFACTURING` |
| construction | `building_construction` | `PG_PROJECT_CONTRACTING` |
| construction | `civil_infrastructure` | `PG_PROJECT_CONTRACTING` |
| construction | `mep_installation` | `PG_PROJECT_CONTRACTING` |
| construction | `fitout_finishing` | `PG_PROJECT_CONTRACTING` |
| construction | `repair_technical_servicing` | `PG_PROJECT_CONTRACTING` |
| construction | `engineering_project_supervision` | `PG_PROJECT_CONTRACTING` |
| construction | `power_automation` | `PG_PROJECT_CONTRACTING` |
| trade | `retail_chain` | `PG_RETAIL_COMMERCE` |
| trade | `wholesale_distribution` | `PG_TRADING_DISTRIBUTION` |
| trade | `import_export_trade` | `PG_TRADING_DISTRIBUTION` |
| trade | `ecommerce_social_commerce` | `PG_RETAIL_COMMERCE` |
| trade | `agents_franchise_distribution` | `PG_TRADING_DISTRIBUTION` |
| trade | `auto_equipment_trade` | `PG_TRADING_DISTRIBUTION` |
| trade | `pharma_medical_trade` | `PG_HEALTHCARE_DISTRIBUTION` |
| software | `saas_owned_software` | `PG_RECURRING_SOFTWARE` |
| software | `custom_software` | `PG_PROJECT_SOFTWARE_IT` |
| software | `it_support_security` | `PG_PROJECT_SOFTWARE_IT` |
| software | `cloud_data_services` | `PG_RECURRING_SOFTWARE` |
| software | `digital_platforms` | `PG_RECURRING_SOFTWARE` |
| software | `digital_content_products` | `PG_RECURRING_SOFTWARE` |
| transport | `haulage_freight` | `PG_LOGISTICS_ASSET` |
| transport | `last_mile_delivery` | `PG_LOGISTICS_ASSET` |
| transport | `warehousing_fulfilment` | `PG_LOGISTICS_ASSET` |
| transport | `passenger_transport` | `PG_LOGISTICS_ASSET` |
| transport | `fleet_mobility` | `PG_LOGISTICS_ASSET` |
| transport | `clearing_forwarding` | `PG_LOGISTICS_ASSET` |
| hospitality | `restaurants_food_service` | `PG_HOSPITALITY_VENUE` |
| hospitality | `cafes_bars_bakeries` | `PG_HOSPITALITY_VENUE` |
| hospitality | `catering_event_feeding` | `PG_HOSPITALITY_VENUE` |
| hospitality | `hotels_short_stay` | `PG_HOSPITALITY_VENUE` |
| hospitality | `travel_tours` | `PG_HOSPITALITY_VENUE` |
| hospitality | `leisure_entertainment` | `PG_HOSPITALITY_VENUE` |
| health | `clinics_hospitals` | `PG_HEALTHCARE_SERVICE` |
| health | `diagnostics_labs` | `PG_HEALTHCARE_SERVICE` |
| health | `pharmacies_drug_retail` | `PG_HEALTHCARE_DISTRIBUTION` |
| health | `medical_products_devices` | `PG_HEALTHCARE_DISTRIBUTION` |
| health | `fitness_wellness` | `PG_LOCAL_SERVICE_OWNER_OP` |
| health | `beauty_personal_care` | `PG_LOCAL_SERVICE_OWNER_OP` |
| health | `veterinary_animal_health` | `PG_HEALTHCARE_SERVICE` |
| education | `schools_formal_education` | `PG_EDUCATION_ENROLLMENT` |
| education | `tutoring_learning_centres` | `PG_EDUCATION_ENROLLMENT` |
| education | `vocational_training` | `PG_EDUCATION_ENROLLMENT` |
| education | `corporate_training` | `PG_EDUCATION_ENROLLMENT` |
| education | `edtech_digital_learning` | `PG_RECURRING_SOFTWARE` |
| education | `research_assessment_services` | `PG_PROFESSIONAL_PLATFORM` |
| professional | `accounting_bookkeeping` | `PG_PROFESSIONAL_OWNER_LED` |
| professional | `legal_compliance` | `PG_PROFESSIONAL_OWNER_LED` |
| professional | `strategy_consulting` | `PG_PROFESSIONAL_OWNER_LED` |
| professional | `marketing_agencies` | `PG_CREATIVE_AGENCY` |
| professional | `hr_recruitment` | `PG_PROFESSIONAL_PLATFORM` |
| professional | `insurance_risk_advisory` | `PG_PROFESSIONAL_PLATFORM` |
| professional | `lending_asset_finance` | `PG_PROFESSIONAL_PLATFORM` |
| professional | `transaction_support` | `PG_PROFESSIONAL_OWNER_LED` |
| real_estate | `real_estate_brokerage` | `PG_REAL_ESTATE_SERVICE` |
| real_estate | `property_management` | `PG_REAL_ESTATE_SERVICE` |
| real_estate | `facility_management` | `PG_REAL_ESTATE_SERVICE` |
| real_estate | `cleaning_hygiene` | `PG_LOCAL_SERVICE_OWNER_OP` |
| real_estate | `security_safety` | `PG_REAL_ESTATE_SERVICE` |
| real_estate | `property_development_support` | `PG_PROPERTY_ASSET_NAV` |
| creative | `design_creative_agency` | `PG_CREATIVE_AGENCY` |
| creative | `media_production` | `PG_CREATIVE_AGENCY` |
| creative | `advertising_media_buying` | `PG_CREATIVE_AGENCY` |
| creative | `event_management` | `PG_CREATIVE_AGENCY` |
| creative | `event_tech_rentals` | `PG_CREATIVE_AGENCY` |
| creative | `publishing_information` | `PG_RECURRING_SOFTWARE` |
| local_services | `laundry_household_support` | `PG_LOCAL_SERVICE_OWNER_OP` |
| local_services | `childcare_social_support` | `PG_LOCAL_SERVICE_OWNER_OP` |
| local_services | `pet_animal_support` | `PG_LOCAL_SERVICE_OWNER_OP` |
| local_services | `pest_environmental_services` | `PG_LOCAL_SERVICE_OWNER_OP` |
| local_services | `repair_maintenance_consumer` | `PG_LOCAL_SERVICE_OWNER_OP` |
| local_services | `specialized_local_services` | `PG_LOCAL_SERVICE_OWNER_OP` |

### 7.3 Owner-phase method-selection rules

Owner launch should not implement the full institutional decision tree yet. It should implement a constrained version:

- `PG_RECURRING_SOFTWARE`
  - primary: revenue multiple
  - secondary: light DCF only if forecast exists and quality threshold passes
- `PG_ASSET_HEAVY_MANUFACTURING`, `PG_LOGISTICS_ASSET`, `PG_PROPERTY_ASSET_NAV`
  - primary: EBITDA multiple
  - secondary: asset floor
- `PG_PROFESSIONAL_OWNER_LED`, `PG_LOCAL_SERVICE_OWNER_OP`, `PG_CREATIVE_AGENCY`
  - primary: SDE / capitalized earnings
  - secondary: EBITDA multiple only if management depth supports it
- `PG_TRADING_DISTRIBUTION`, `PG_RETAIL_COMMERCE`, `PG_HOSPITALITY_VENUE`, `PG_HEALTHCARE_SERVICE`, `PG_EDUCATION_ENROLLMENT`
  - primary: EBITDA or EBIT multiple depending on data availability
  - secondary: capitalized earnings or asset floor as defined by policy group

## 8. Layered Intake Design

The intake should be layered, not duplicated.

### 8.1 Owner core

Purpose: complete in one sitting, understandable, low-friction, still analytically useful.

Sections:

1. Business identity and classification
2. Market reach and demand
3. Financial snapshot
4. Banking and record quality
5. Owner dependence and management depth
6. Customer quality and concentration
7. Operations and resilience
8. Debt, cash, and urgency
9. Contact and consent

Owner-mode design rules:

- ask only for fields owners can usually answer
- avoid method jargon
- use plain language labels while preserving exact backend meaning
- allow “I’m not sure” where necessary
- collect at least 2 years of finance, ideally 3
- collect simplified quantified normalization inputs, not just yes/no

### 8.2 Advisor extension

Adds:

- fuller financial history
- quantified adjustment lines
- debt-like items
- working-capital details
- maintenance vs growth capex
- forecast inputs
- document checklist
- preliminary benchmark visibility

### 8.3 Analyst controls

Adds:

- override controls
- comp selection controls
- benchmark-source controls
- scenario analysis
- exception flags
- formal assumption log

## 9. Normalization Schedule Structure

Normalization must be line-by-line and monetary.

### 9.1 Canonical line-item shape

```ts
type AdjustmentDirection = 'add_back' | 'remove' | 'bridge_only';

interface NormalizationLineItem {
  id: string;
  category:
    | 'owner_comp'
    | 'related_party_rent'
    | 'personal_expense'
    | 'family_payroll'
    | 'one_off_expense'
    | 'one_off_income'
    | 'non_operating_income'
    | 'non_operating_asset'
    | 'debt_like_item'
    | 'working_capital'
    | 'maintenance_capex'
    | 'tax_normalization'
    | 'fx_distortion'
    | 'other';
  label: string;
  periodId: string;
  reportedAmount?: number;
  normalizedAmount?: number;
  adjustmentAmount: number;
  direction: AdjustmentDirection;
  recurrence: 'non_recurring' | 'partly_recurring' | 'recurring';
  confidence: 'low' | 'medium' | 'high';
  evidenceLevel: 'owner_statement' | 'management_accounts' | 'third_party_document' | 'analyst_estimate';
  affects: 'sde' | 'ebitda' | 'ebit' | 'equity_bridge' | 'working_capital';
  notes?: string;
}
```

### 9.2 Required normalization categories

At minimum the engine must support these categories:

1. owner compensation adjustment
2. related-party rent adjustment
3. personal expenses through business
4. family or non-market payroll
5. one-off expenses
6. one-off income
7. non-operating income removal
8. non-operating assets
9. debt-like items
10. working-capital normalization
11. maintenance capex adjustment
12. tax normalization
13. FX distortion review

### 9.3 Owner-phase simplification

Owner mode should still use this schedule structure, but with fewer exposed inputs.

Owner mode can ask:

- owner annual take-home or owner pay band
- personal expenses through business band or approximate amount
- related-party rent yes/no + amount if yes
- one-off income/expense amount if any
- debt and shareholder loans
- cash balance

The backend should still convert those into formal `NormalizationLineItem[]`.

## 10. Output Object Structure

The engine output must be defined before formulas are finalized.

```ts
interface ValuationResult {
  meta: ResultMeta;
  engagement: ResultEngagement;
  classification: ResultClassification;
  selectedMethods: MethodSelectionResult;
  normalizedMetrics: NormalizedMetricSet;
  valueConclusion: ValueConclusion;
  readinessAssessment: ReadinessAssessment;
  confidenceAssessment: ConfidenceAssessment;
  redFlags: RedFlag[];
  assumptions: KeyAssumption[];
  audit: AuditSummary;
}
```

### 10.1 `selectedMethods`

```ts
interface MethodSelectionResult {
  policyGroupId: string;
  primaryMethod: 'market_multiple' | 'capitalized_earnings' | 'dcf' | 'asset_approach';
  secondaryMethods: Array<'market_multiple' | 'capitalized_earnings' | 'dcf' | 'asset_approach'>;
  floorMethod?: 'asset_approach';
  rationale: string[];
}
```

### 10.2 `normalizedMetrics`

```ts
interface NormalizedMetricSet {
  representativePeriodId: string;
  revenue: number;
  sde?: number;
  adjustedEbitda?: number;
  adjustedEbit?: number;
  normalizedWorkingCapital?: number;
  netDebt?: number;
}
```

### 10.3 `valueConclusion`

```ts
interface ValueConclusion {
  enterpriseValue: {
    fundamentalLow: number;
    fundamentalMid: number;
    fundamentalHigh: number;
    achievableTodayLow: number;
    achievableTodayMid: number;
    achievableTodayHigh: number;
    forcedSaleLow?: number;
    forcedSaleMid?: number;
    forcedSaleHigh?: number;
  };
  equityValue: {
    fundamentalLow: number;
    fundamentalMid: number;
    fundamentalHigh: number;
    achievableTodayLow: number;
    achievableTodayMid: number;
    achievableTodayHigh: number;
    forcedSaleLow?: number;
    forcedSaleMid?: number;
    forcedSaleHigh?: number;
  };
  reconciliation?: {
    marketApproach?: number;
    incomeApproach?: number;
    assetApproach?: number;
    appliedWeights?: Record<string, number>;
  };
}
```

### 10.4 `readinessAssessment`

```ts
interface ReadinessAssessment {
  overallScore: number;
  recordsQuality: number;
  ownershipClarity: number;
  customerTransferability: number;
  managementDepth: number;
  compliance: number;
  documentation: number;
  topGaps: string[];
}
```

### 10.5 `confidenceAssessment`

```ts
interface ConfidenceAssessment {
  overallScore: number;
  dataCompleteness: number;
  recordsQuality: number;
  benchmarkCoverage: number;
  earningsStability: number;
  rangeWidthPct: number;
  notes: string[];
}
```

### 10.6 Owner-phase output rule

Owner launch should show:

- `equityValue.achievableTodayLow/Mid/High`
- `equityValue.fundamentalLow/Mid/High`
- readiness score
- confidence score
- red flags
- key assumptions

It may keep method weights and reconciliation mostly internal at launch.

## 11. Recommended Owner-Phase Scope

The owner-phase engine should support these capabilities at launch:

- Level 2-driven policy selection
- 1-3 year finance intake
- simplified quantified normalization
- EV-to-equity bridge
- readiness score separate from value
- confidence score separate from readiness
- value range, not point estimate
- policy-group method selection

The owner-phase engine should not yet depend on:

- deep DCF forecasting for all businesses
- analyst-grade comp management
- document-room workflows
- formal override controls in the frontend

## 12. Recommended Owner-Phase Build Order

1. Create schema contracts from Section 5.
2. Create `level2 -> policyGroupId` registry from Section 7.
3. Create policy-group definitions from Section 7.1.
4. Create normalization schedule builder from Section 9.
5. Create output contracts from Section 10.
6. Implement owner-phase method-selector using policy groups.
7. Implement owner-phase valuation approaches:
   - market multiple
   - capitalized earnings
   - asset floor
   - selective light DCF only where justified
8. Implement EV-to-equity bridge.
9. Implement readiness and confidence modules.
10. Replace legacy heuristic engine with new orchestrator behind the local lab.

## 13. Near-Term Deliverables

The next coding phase should produce these artifacts:

1. `docs/valuation-engine/afrexit-valuation-engine-master-plan.md`
2. typed schema definitions for the canonical request/output objects
3. policy-group registry
4. method-selection module
5. normalization schedule types and builders
6. owner-mode orchestration pipeline

## 14. Open Questions To Resolve During Build

These do not block the architecture, but they do affect calibration:

1. Whether specific policy groups should eventually require 3 years in owner mode, even though the general owner-launch minimum is now 2.
2. How much DCF should owner mode use, if any?
3. Which sectors need special Nigeria-only benchmark overrides first?
4. What minimum debt-like items can owners reliably report without confusion?
5. Which readiness components should affect `achievable today` versus only the advisory recommendations?

## 15. Final Direction

The correct build path is:

- architect for owner, advisor, and analyst from day one
- implement owner mode first
- keep all data and engine contracts future-proof
- do not expose method choice to users
- do not continue extending the frozen heuristic engine

That gives Afrexit the best path to ship something useful quickly without painting the model into a corner.
