# Owner-Phase Valuation Logic Traceability Specification

Status: auditability and explainability document for Phase 1 owner mode  
Applies to engine version: `owner-phase-skeleton-v0.5`  
Last updated: March 19, 2026

## 1. Phase Status

Phase 1 is not fully complete yet.

What is true now:

- the owner-mode engine is functional end to end
- the request schema, question bindings, policy registry, normalization schedule, methods, bridge, and confidence logic are all explicit in code
- the result payload is inspectable in the V2 UI and local admin tools

What still prevents Phase 1 from being called complete:

- benchmark provenance is not yet clean enough
- some questions are currently informative or governance-only rather than price-driving
- the benchmark layer still relies partly on external proxy evidence rather than Nigeria-native Afrexit observations

This document exists so the engine is not a black box. It makes the current mechanics auditable, including the questions that do not yet move value directly.

For the adaptive questionnaire keep/fix/drop decisions, conditional resolver rules, and question-to-canonical mapping inventory, see [Adaptive Questionnaire Audit And Target Matrix](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/questionnaires/adaptive-questionnaire-audit-and-target-matrix.md).

## 2. Engine Flow

The owner-phase engine runs in this order:

1. Intake binding: [owner-intake.ts](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/owner-intake.ts)
   Converts V2 form fields into the canonical request schema.
2. Validation: [request-validation.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/request-validation.mjs)
   Checks required owner, company, classification, and minimum financial fields.
3. Policy resolution: [policy-registry.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/policy-registry.mjs)
   Resolves `level2` into a `policyGroupId` and hydrates calibration data.
4. Historical analysis: [history.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/history.mjs)
   Builds the representative revenue and operating-profit view from `1-3` years of owner history.
5. Normalization: [normalization.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/normalization.mjs)
   Converts owner-entered adjustments into normalized earnings and working-capital metrics.
6. Scorecards and readiness: [scorecards.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/scorecards.mjs)
   Computes qualitative scores for market position, records quality, transferability, and readiness.
7. Method selection and reconciliation: [method-selection.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/method-selection.mjs)
   Chooses market, capitalized earnings, and/or asset floor methods from the policy group and current business profile.
8. Valuation approaches: [approaches.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/approaches.mjs)
   Runs the chosen approach formulas and also calculates normalization impact by method.
9. Confidence: [confidence.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/confidence.mjs)
   Builds the confidence score and range width from data quality, benchmark quality, historical depth, and method dispersion.
10. EV to equity bridge: [bridge.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/bridge.mjs)
    Converts reconciled enterprise value into equity value and achievable-today value.
11. Output assembly: [output.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/output.mjs)
    Builds the final inspectable result, including history, normalization line items, methods, readiness, confidence, and red flags.

## 3. Core Formulas

### 3.1 Representative historical period

The current owner-phase engine blends up to `3` periods using a weighted average:

- latest year: `50%`
- previous year: `30%`
- two years ago: `20%`

This is implemented in [history.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/history.mjs).

Representative metrics:

- `representativeRevenue = weightedAverage(revenueSeries)`
- `representativeOperatingProfit = weightedAverage(profitSeries)`
- `representativeMaintenanceCapex = weightedAverage(maintenanceCapexSeries)`

### 3.2 Stability scores

The engine computes:

- `revenueStabilityScore`
- `marginStabilityScore`
- `blendedStabilityScore`

These are based on variation in revenue and operating margin across the available history. Higher volatility lowers confidence.

### 3.3 Normalized earnings

Normalization begins with owner-entered line items and aggregates them by earnings layer in [normalization.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/normalization.mjs):

- `adjustedEbit = operatingProfit + ebitAdjustments`
- `adjustedEbitda = adjustedEbit + depreciationAmortization`
- `sde = adjustedEbitda + sdeAdjustments + interestExpense + taxExpense`

Working-capital terms:

- `actualWorkingCapital = receivables + inventory - payables`
- `normalizedWorkingCapital = representativeRevenue * workingCapitalTargetPct`, unless explicitly provided
- `workingCapitalDelta = actualWorkingCapital - normalizedWorkingCapital`

### 3.4 Method formulas

Market approach in [approaches.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/approaches.mjs):

- `value = chosenMetric * marketMultipleRange`

Capitalized earnings approach:

- if the capitalized metric is `adjustedEbitda`, maintenance capex is deducted first
- `value = chosenMetric / capitalizationRate`

Asset floor approach:

- `revenueFloor = revenue * assetFloorRevenuePct`
- `tangibleWorkingCapital = max(actualWorkingCapital, 0) * 0.35`
- `base = revenueFloor + tangibleWorkingCapital + cash + nonOperatingAssets - debtBurden`

### 3.5 Reconciliation

Approach values are reconciled using policy-group owner-phase weights from the registry:

- `reconciledValue = sum(approachValue * normalizedMethodWeight)`

This is not a simple average. It is policy-driven and method-specific.

### 3.6 Readiness to achievable-today conversion

The engine separates fundamental value from achievable-today value.

In [bridge.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/bridge.mjs):

- `marketabilityFactor = clamp(floor + readinessOverallScore / 520, floor, ceiling)`
- `achievableTodayEnterpriseValue = fundamentalEnterpriseValue * marketabilityFactor`

This means readiness does not change the underlying method outputs directly. It changes what may be achievable today in an owner-mode scenario.

### 3.7 EV to equity bridge

The bridge delta is:

- `cashAndEquivalents`
- `+ nonOperatingAssets`
- `+ workingCapitalBridge`
- `- interestBearingDebt`
- `- shareholderLoans`
- `- leaseLiabilities`
- `- taxLiabilities`
- `- contingentLiabilities`
- `- nonOperatingLiabilities`

Equity value is enterprise value plus that bridge delta.

### 3.8 Confidence and range width

Confidence is built from:

- years of history
- records quality
- normalization quality
- working-capital coverage
- benchmark evidence quality
- historical stability
- method dispersion
- benchmark freshness
- internal Afrexit observation count

Range width then widens or tightens from confidence.

The exact weighting lives in [confidence.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/confidence.mjs).

## 4. Traceability Legend

Short names used below:

- `Bind`: intake binding in [owner-intake.ts](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/owner-intake.ts)
- `Hist`: historical summary in [history.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/history.mjs)
- `Norm`: normalization schedule or normalized metrics in [owner-intake.ts](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/owner-intake.ts) and [normalization.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/normalization.mjs)
- `Score`: scorecard in [scorecards.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/scorecards.mjs)
- `Ready`: readiness assessment in [scorecards.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/scorecards.mjs)
- `Methods`: method selection in [method-selection.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/method-selection.mjs)
- `Appr`: valuation approaches in [approaches.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/approaches.mjs)
- `Conf`: confidence in [confidence.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/confidence.mjs)
- `Bridge`: EV to equity bridge in [bridge.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/bridge.mjs)
- `Result`: output surface in [output.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation-v2/modules/output.mjs)

## 5. Question Traceability Matrix

### 5.1 Business Profile

| Question | Canonical path | Used by | Current owner-phase impact |
| --- | --- | --- | --- |
| `level1` - broad sector | `classification.level1` | `Bind`, validation, `Result` | Classification context only in `v0.4`. It does not currently change method selection or value math directly. |
| `level2` - main revenue model | `classification.level2` | `Bind`, policy resolution, `Methods`, `Norm`, `Bridge`, `Conf`, `Result` | Strongest structural driver. Resolves the policy group and therefore controls method set, multiples, cap rates, working-capital target, marketability bounds, reconciliation weights, and dispersion penalty weight. |
| `industryFit` - fit of classification | `classification.industryFit` | `Score`, `Result` | Feeds `marketPosition` score only. Summary signal today, not direct value or confidence math. |
| `businessSummary` - what the business does | `company.businessSummary` | `Bind`, `Result` | Metadata and audit context only. In the adaptive flow this may be populated from the `businessDescription` question. |
| `primaryState` - main location | `company.primaryState` | `Bind`, `Bridge`, `Result` | In `v0.5`, location now affects achievable-today value through a modest geography factor. It still does not change fundamental enterprise value or policy-group selection. |
| `operatingYears` - years in operation | `company.operatingYearsBand` | `Bind`, `Ready`, `Conf`, `Result` | In `v0.5`, operating history now affects readiness and confidence modestly. It still does not directly change method multiples or cap rates. |
| `legalStructure` - legal form | `company.legalStructure` | `Score`, `Ready`, `Bridge`, `Result` | Feeds `transactionReadiness` and `ownershipClarity`. Through readiness overall it indirectly changes achievable-today value via the marketability factor. |
| `ownerControl` - ownership/control band | `company.ownerControlBand` | `Score`, `Ready`, `Bridge`, `Result` | Same pattern as `legalStructure`: indirect effect on achievable-today value through readiness and ownership clarity. |

### 5.2 Market Position and Growth

| Question | Canonical path | Used by | Current owner-phase impact |
| --- | --- | --- | --- |
| `catchmentArea` - customer geography | `operatingProfile.catchmentArea` | `Score`, `Result` | Feeds `marketPosition` summary only in `v0.4`. |
| `marketDemand` - demand direction | `operatingProfile.marketDemand` | `Score`, `Conf`, `Result` | Feeds `marketPosition`, and also enters `earningsStability` in confidence. Better demand lifts confidence modestly. |
| `growthOutlook` - next 3 years | `operatingProfile.growthOutlook` | `Score`, `Conf`, `Result` | Feeds `marketPosition` and confidence `earningsStability`. Better outlook lifts confidence modestly. |
| `differentiation` - why customers choose you | `operatingProfile.differentiation` | `Score`, `Result` | Feeds `marketPosition` summary only today. |
| `pricingPower` - ability to charge above market | `operatingProfile.pricingPower` | `Score`, `Result` | Feeds `marketPosition` summary only today. |
| `transactionGoal` - sale, partial sale, planning | `engagement.purpose` | `Bind`, `Score`, `Result` | Sets engagement purpose and standard of value, and feeds `transactionReadiness`. It does not currently change headline valuation math directly. |
| `transactionTimeline` - expected timing | `engagement.urgency` | `Bind`, `Score`, `Bridge`, `Result` | Sets urgency. In current UI, `within_6m` becomes `accelerated`; other answers are `orderly`. This affects the forced-sale scenario outputs, not the headline achievable-today range. |

### 5.3 Financial Snapshot and Records

| Question | Canonical path | Used by | Current owner-phase impact |
| --- | --- | --- | --- |
| `revenueLatest` - latest full-year revenue | `financials.historicals[0].revenue` | `Bind`, `Hist`, `Norm`, `Appr`, `Bridge`, `Conf`, `Result` | Core numeric driver. Can drive market multiple value, working-capital target, asset floor, red flags, and bridge sensitivity checks. |
| `operatingProfitLatest` - latest full-year operating profit | `financials.historicals[0].operatingProfit` | `Bind`, `Hist`, `Norm`, `Appr`, `Result` | Core earnings driver for adjusted EBIT, adjusted EBITDA, and SDE-based methods. |
| `proofReadiness` - ability to prove numbers | `financials.sourceQuality.proofReadiness` | `Score`, `Ready`, `Conf`, `Result` | Strong driver of `financialQuality`, readiness documentation/compliance, and overall confidence. |
| `traceablePaymentsShare` - traceable payment ratio | `financials.sourceQuality.traceablePaymentsShare` | `Score`, `Conf`, `Result` | Feeds `financialQuality` and therefore confidence. |
| `bankingQuality` - banking cleanliness | `financials.sourceQuality.bankingQuality` | `Score`, `Ready`, `Conf`, `Result` | Feeds `financialQuality`, readiness compliance, and confidence. |
| `financeTracking` - bookkeeping quality | `financials.sourceQuality.bookkeepingQuality` | `Score`, `Conf`, `Result` | Feeds `financialQuality` and therefore confidence. |

### 5.4 Financial History and Working Capital

| Question | Canonical path | Used by | Current owner-phase impact |
| --- | --- | --- | --- |
| `revenuePrev1` - previous year revenue | `financials.historicals[1].revenue` | `Bind`, `Hist`, `Norm`, `Appr`, `Conf`, `Result` | Improves representative revenue, trend visibility, stability scoring, and therefore both value defensibility and confidence. |
| `operatingProfitPrev1` - previous year operating profit | `financials.historicals[1].operatingProfit` | `Bind`, `Hist`, `Norm`, `Appr`, `Conf`, `Result` | Improves representative profit and margin stability. |
| `revenuePrev2` - two years ago revenue | `financials.historicals[2].revenue` | `Bind`, `Hist`, `Norm`, `Appr`, `Conf`, `Result` | Same role as `revenuePrev1`, with smaller weight. |
| `operatingProfitPrev2` - two years ago operating profit | `financials.historicals[2].operatingProfit` | `Bind`, `Hist`, `Norm`, `Appr`, `Conf`, `Result` | Same role as `operatingProfitPrev1`, with smaller weight. |
| `receivablesLatest` - customers owing the business | `financials.historicals[0].receivables` | `Bind`, `Norm`, `Appr`, `Bridge`, `Conf`, `Result` | Drives actual working capital, asset-floor tangible working-capital value, working-capital bridge, and related confidence/red flags. |
| `inventoryValueLatest` - stock/raw-material value | `financials.historicals[0].inventory` | `Bind`, `Norm`, `Appr`, `Bridge`, `Conf`, `Result` | Same role as `receivablesLatest` for working capital and asset-floor support. |
| `payablesLatest` - trade payables | `financials.historicals[0].payables` | `Bind`, `Norm`, `Appr`, `Bridge`, `Conf`, `Result` | Offsets working capital. Changes bridge value and can trigger working-capital red flags. |
| `maintenanceCapexLatest` - annual keep-the-lights-on capex | `financials.historicals[0].maintenanceCapex` | `Bind`, `Hist`, `Norm`, `Appr`, `Result` | Used when a capitalized-earnings method is based on EBITDA. Maintenance capex is deducted before capitalization. |

### 5.5 Owner Dependence and Team

| Question | Canonical path | Used by | Current owner-phase impact |
| --- | --- | --- | --- |
| `ownerAbsence2Weeks` - short founder absence | `readiness.ownerAbsence2Weeks` | `Score`, `Ready`, `Result` | Feeds `ownerIndependence` and readiness management depth. Indirectly affects achievable-today value through marketability. |
| `ownerAbsence3Months` - longer founder absence | `readiness.ownerAbsence3Months` | `Score`, `Ready`, `Result` | Same pattern as `ownerAbsence2Weeks`, with stronger signal about transferability. `v0.5` now recognizes a top-end `no_disruption` outcome instead of assuming every SME must degrade without the founder. |
| `managementDepth` - who runs day to day | `readiness.managementDepth` | `Score`, `Ready`, `Methods`, `Bridge`, `Result` | Feeds `ownerIndependence` and readiness. Also affects whether owner-led businesses are allowed to include a market multiple when transferability is stronger. |
| `processDocumentation` - how documented operations are | `readiness.processDocumentation` | `Score`, `Ready`, `Bridge`, `Result` | Feeds `ownerIndependence`, ownership clarity, documentation, and overall readiness. |
| `replacementDifficulty` - replacing founder with a manager | `readiness.replacementDifficulty` | `Score`, `Ready`, `Bridge`, `Result` | Feeds `ownerIndependence` and readiness overall. |
| `hiringDifficulty` - ability to recruit and train | `operatingProfile.hiringDifficulty` | `Score`, `Result` | Feeds `operatingResilience` summary only in `v0.4`. It does not currently change value math directly. |

### 5.6 Customers and Operating Resilience

| Question | Canonical path | Used by | Current owner-phase impact |
| --- | --- | --- | --- |
| `customerConcentration` - how concentrated revenue is | `operatingProfile.customerConcentration` | `Score`, `Ready`, `Bridge`, `Result` | Feeds `revenueQuality`, customer transferability, and therefore achievable-today marketability. |
| `bestCustomerRisk` - impact of losing the top customer | `operatingProfile.bestCustomerRisk` | `Score`, `Ready`, `Bridge`, `Result` | Same pattern as `customerConcentration`. |
| `founderRevenueDependence` - sales tied to founder personally | `operatingProfile.founderRevenueDependence` | `Score`, `Ready`, `Bridge`, `Result` | Same pattern as `customerConcentration`, with strong transferability significance. |
| `recurringRevenueShare` - recurring revenue mix | `operatingProfile.recurringRevenueShare` | `Score`, `Ready`, `Bridge`, `Result` | Feeds `revenueQuality` and therefore customer transferability and achievable-today value. |
| `revenueVisibility` - visibility of future revenue | `operatingProfile.revenueVisibility` | `Score`, `Ready`, `Bridge`, `Result` | Same pattern as `recurringRevenueShare`. |
| `supplierTransferability` - ability to keep suppliers | `operatingProfile.supplierTransferability` | `Score`, `Result` | Feeds `operatingResilience` summary only today. |
| `inventoryProfile` - stock duration | `operatingProfile.inventoryProfile` | `Score`, `Result` | Feeds `operatingResilience` summary only today. |
| `workingCapitalHealth` - working-capital pressure | `operatingProfile.workingCapitalHealth` | `Score`, `Conf`, `Result` | Feeds `operatingResilience` summary and also confidence `earningsStability`. In the adaptive flow, `v0.5` now derives this from numeric working-capital inputs when no separate subjective override is asked. |
| `assetSeparation` - business vs personal asset clarity | `operatingProfile.assetSeparation` | `Score`, `Ready`, `Bridge`, `Result` | Feeds `operatingResilience`, readiness compliance, and achievable-today marketability. In the adaptive flow, `v0.5` now asks this directly again. |
| `fxExposure` - import/FX/customs exposure | `operatingProfile.fxExposure` | `Score`, `Result` | Feeds `operatingResilience` summary in `v0.5`. In the adaptive flow, `v0.5` now asks this directly again. |

### 5.7 Adjustments and Capital Structure

| Question | Canonical path | Used by | Current owner-phase impact |
| --- | --- | --- | --- |
| `ownerTotalCompensation` - total owner take-out | `normalization.schedule.owner_comp_total` | `Bind`, `Norm`, `Appr`, `Result` | Creates an SDE add-back and forms one side of the owner-replacement compensation delta. Direct method driver for SDE and owner-led earnings views. |
| `marketManagerCompensation` - replacement manager cost | `normalization.schedule.owner_comp_market_equivalent` | `Bind`, `Norm`, `Appr`, `Result` | Creates the compensation delta that normalizes owner pay to a market replacement cost, affecting EBITDA-based earnings value. |
| `relatedPartyRentPaid` - actual related-party rent | `normalization.schedule.related_party_rent_actual` | `Bind`, `Norm`, `Appr`, `Result` | Combined with market rent to create a recurring EBITDA rent normalization. |
| `marketRentEquivalent` - fair market rent | `normalization.schedule.related_party_rent_market` | `Bind`, `Norm`, `Appr`, `Result` | The other side of the rent normalization delta. |
| `relatedPartyCompPaid` - actual related-party compensation | `normalization.schedule.related_party_comp_actual` | `Bind`, `Norm`, `Appr`, `Result` | Combined with the market equivalent to normalize family or related-party payroll. |
| `marketRelatedPartyCompEquivalent` - fair market related-party pay | `normalization.schedule.related_party_comp_market` | `Bind`, `Norm`, `Appr`, `Result` | The other side of the family-payroll normalization delta. |
| `privateExpensesAmount` - personal spend through the company | `normalization.schedule.private_expense_addbacks` | `Bind`, `Norm`, `Appr`, `Conf`, `Result` | Adds back recurring non-business expense to EBITDA and lowers confidence because it is owner-estimated. |
| `oneOffExpenseAmount` - unusual expense to remove | `normalization.schedule.one_off_expenses` | `Bind`, `Norm`, `Appr`, `Conf`, `Result` | Adds back non-recurring EBITDA expense and lowers confidence because it is owner-estimated. |
| `oneOffIncomeAmount` - unusual income to remove | `normalization.schedule.one_off_income` | `Bind`, `Norm`, `Appr`, `Conf`, `Result` | Removes non-recurring income from EBITDA and lowers confidence because it is owner-estimated. |
| `nonCoreIncomeAmount` - non-core income | `normalization.schedule.non_core_income` | `Bind`, `Norm`, `Appr`, `Conf`, `Result` | Removes non-operating income from EBIT and lowers confidence because it is owner-estimated. |
| `cashBalance` - cash available in the business | `bridge.cashAndEquivalents` | `Bind`, `Bridge`, `Result` | Added in the EV-to-equity bridge. Direct equity-value driver. |
| `financialDebt` - interest-bearing debt | `bridge.interestBearingDebt` | `Bind`, `Bridge`, `Result` | Subtracted in the EV-to-equity bridge. Direct equity-value driver. |
| `shareholderLoans` - owner/director loans owed by the business | `bridge.shareholderLoans` | `Bind`, `Bridge`, `Result` | Subtracted in the EV-to-equity bridge. Direct equity-value driver. |

### 5.8 Contact and Meta

| Question | Canonical path | Used by | Current owner-phase impact |
| --- | --- | --- | --- |
| `firstName` | `company.firstName` | validation, `Result` | Governance and output identity only. |
| `businessName` | `company.businessName` | validation, `Result` | Governance and output identity only. |
| `email` | `company.email` | validation | Governance only. |
| `whatsapp` | `company.whatsapp` | validation | Governance only. |
| `termsAccepted` | `meta.acknowledged` | local-lab submission validation, `Result` | Submission gate only. No valuation effect. |
| `newsletterOptIn` | `meta.newsletterOptIn` | `Bind` | Metadata only. No valuation effect. |

## 6. Questions That Do Not Currently Move Headline Value Math

These questions are still worth collecting, but in `v0.5` they do not directly change the final headline achievable-today range:

- `level1`
- `industryFit`
- `businessSummary`
- `catchmentArea`
- `differentiation`
- `pricingPower`
- `transactionGoal`
- `hiringDifficulty`
- `supplierTransferability`
- `inventoryProfile`
- `fxExposure`
- all contact and opt-in fields

Some of these affect summary scorecards or audit context. They are not useless. But they are not yet direct price drivers. That distinction must stay explicit until the engine evolves further.

## 7. Benchmark Provenance and Source Integrity Note

This section is intentionally blunt.

### 7.1 What is true

- the current owner-phase engine does use explicit benchmark and calibration files:
  - [benchmark-data.json](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/benchmark-data.json)
  - [calibration-table.json](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/calibration-table.json)
- the benchmark loader does compute evidence score, freshness, source mix, and source reliability from those files
- internal Afrexit observations can now be captured and ingested into calibration

### 7.2 What is not true

- the private-market benchmark refresh script does not live-scrape BizBuySell or any other external site
- it does not parse current pages on each run
- the quartile and proxy values in the private-market refresh path are currently hardcoded in local `PACKS`

That logic lives in [refresh-private-market-benchmarks.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/scripts/valuation-engine/refresh-private-market-benchmarks.mjs).

### 7.3 Why the broken links matter

Some of the historical BizBuySell URLs used as reference links are stale and now return `404`. That means:

- they should not be treated as a reproducible live source
- they should not be presented as if the engine is fetching them directly
- they are, at best, manual curation references from an earlier sourcing pass

### 7.4 Current audit conclusion on provenance

The benchmark layer is auditable as a local calibration dataset.

It is not yet fully auditable as a reproducible external-data ingestion pipeline.

That is a real limitation, and it is one reason Phase 1 should still be treated as in progress rather than complete.

### 7.5 Required remediation

Before Phase 1 sign-off, the benchmark layer should meet this standard:

1. every external reference is either current, archived, or clearly marked as stale legacy reference
2. manually curated proxy values are labeled as curated, not implied to be live-extracted
3. benchmark snapshots retain the actual values used, not only a page link
4. the admin surface shows provenance class clearly:
   - internal case
   - curated proxy
   - public comp dataset
   - direct external report reference

## 8. Current Audit Verdict

The owner-phase engine is no longer a black box.

Its mechanics are now explainable and traceable, but it is not yet final. The main remaining audit gap is benchmark provenance integrity, not the internal flow of the engine itself.
