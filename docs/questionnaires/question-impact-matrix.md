# Adaptive Question Impact Matrix

Status: live audit reference for the current adaptive owner-mode questionnaire  
Applies to engine version: current local owner-mode engine  
Last updated: March 27, 2026

Related references:

- [Adaptive Questionnaire Audit And Target Matrix](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/questionnaires/adaptive-questionnaire-audit-and-target-matrix.md)
- [Owner-Phase Valuation Logic Traceability Spec](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/owner-phase-valuation-logic-traceability-spec.md)
- [Generated Question Audit Report](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/questionnaires/generated-question-audit-report.md)
- [Admin Lab Sensitivity and Audit Guide](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/admin-lab-sensitivity-and-audit-guide.md)

## 1. Purpose

This document answers four audit questions for every live question in the adaptive owner-mode flow:

1. Where does the question map in the canonical request?
2. What does it affect today?
3. Which engine modules consume it?
4. Is it carrying enough weight, or does it need redesign?

## 2. Tier Legend

- `Tier 1`: strongest direct valuation mechanics
- `Tier 2`: strong readiness / transferability / marketability levers
- `Tier 3`: strong branch-quality and capped qualitative valuation levers
- `Tier 4`: meaningful scorecard / confidence / market-position inputs
- `Tier 5`: thin but still justified
- `Tier 6`: operational / compliance only

## 3. Current Finding

There are no live questions that are completely unmapped or totally unused.

The important distinction is:

- some questions move the valuation midpoint or equity bridge directly
- some questions move achievable-today value indirectly through readiness / marketability
- some questions move scorecards and confidence only
- some questions exist for context, audit, contact, or compliance

## 4. Full Matrix

### 4.1 Tier 1: Direct Value Mechanics

| Question | Canonical mapping | Affects today | Main engine modules | Recommendation |
| --- | --- | --- | --- | --- |
| `level2` | `classification.level2` + derived `classification.policyGroupId` | policy group, method selection, multiples, floor logic | `owner-intake`, `policy-registry`, `method-selection`, `approaches`, `output` | Keep as-is |
| `revenueLatest` financial table | `financials.historicals[*]`, `financials.forecast` | representative revenue, representative operating profit, partial valuation, growth, trend stability | `owner-intake`, `history`, `normalization`, `approaches`, `partial-valuation`, `output` | Keep as-is |
| `receivablesLatest` | `financials.historicals[0].receivables` + derived `bridge.actualWorkingCapital` | working-capital bridge, operating-resilience signal | `owner-intake`, `normalization`, `bridge`, `scorecards`, `confidence` | Keep as-is |
| `inventoryValueLatest` | `financials.historicals[0].inventory` + derived `bridge.actualWorkingCapital` | working-capital bridge, inventory intensity, branch context | `owner-intake`, `normalization`, `bridge`, `scorecards`, `qualitative-adjustments` | Keep as-is |
| `payablesLatest` | `financials.historicals[0].payables` + derived `bridge.actualWorkingCapital` | working-capital bridge, operating-resilience signal | `owner-intake`, `normalization`, `bridge`, `scorecards`, `confidence` | Keep as-is |
| `cashBalance` | `bridge.cashAndEquivalents` | equity bridge directly | `owner-intake`, `bridge`, `output` | Keep as-is |
| `financialDebt` | `bridge.interestBearingDebt` | equity bridge directly | `owner-intake`, `bridge`, `output` | Keep as-is |
| `shareholderLoans` | `bridge.shareholderLoans` | equity bridge directly | `owner-intake`, `bridge`, `output` | Keep as-is |
| `ownerTotalCompensation` | normalization owner-comp schedule | adjusted earnings, SDE view | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `marketManagerCompensation` | normalization owner-comp market equivalent | adjusted EBIT / EBITDA | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `relatedPartyRentPaid` | normalization rent actual | adjusted EBITDA | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `marketRentEquivalent` | normalization rent market equivalent | adjusted EBITDA | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `relatedPartyCompPaid` | normalization related-party comp actual | adjusted EBITDA | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `marketRelatedPartyCompEquivalent` | normalization related-party comp market equivalent | adjusted EBITDA | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `privateExpensesAmount` | normalization personal-expense addback | adjusted EBITDA | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `oneOffExpenseAmount` | normalization one-off expense addback | adjusted EBITDA | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `oneOffIncomeAmount` | normalization one-off income removal | adjusted EBITDA | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `nonCoreIncomeAmount` | normalization non-core income removal | adjusted EBIT | `owner-intake`, `normalization`, `approaches`, `output` | Keep as-is |
| `annualDepreciation` | `financials.historicals[0].depreciationAmortization` | EBIT/EBITDA bridge, comparability across methods | `owner-intake`, `history`, `normalization`, `approaches` | Keep as-is |
| `maintenanceCapexLatest` | `financials.historicals[0].maintenanceCapex` | capitalized-earnings adjustment, manufacturing context | `owner-intake`, `history`, `normalization`, `approaches`, `qualitative-adjustments` | Keep as-is |
| `primaryState` | `company.primaryState` | geography factor on achievable-today value | `owner-intake`, `qualitative-adjustments`, `bridge`, `output`, `partial-valuation` | Keep as-is |

### 4.2 Tier 2: Strong Readiness / Transferability / Marketability Levers

| Question | Canonical mapping | Affects today | Main engine modules | Recommendation |
| --- | --- | --- | --- | --- |
| `proofReadiness` | `financials.sourceQuality.proofReadiness` and `readiness.recordsQuality` proxy | readiness, confidence, financial-quality score | `owner-intake`, `scorecards`, `confidence`, `output` | Keep as-is |
| `traceablePaymentsShare` | `financials.sourceQuality.traceablePaymentsShare` | readiness, confidence, financial-quality score | `owner-intake`, `scorecards`, `confidence` | Keep as-is |
| `bankingQuality` | `financials.sourceQuality.bankingQuality` | readiness, confidence, financial-quality score, compliance | `owner-intake`, `scorecards`, `confidence` | Keep as-is |
| `financeTracking` | `financials.sourceQuality.bookkeepingQuality` | readiness, confidence, financial-quality score | `owner-intake`, `scorecards`, `confidence` | Keep as-is |
| `ownerAbsence3Months` | `readiness.ownerAbsence3Months` | owner independence, transferability, readiness, achievable-today value indirectly | `owner-intake`, `scorecards`, `bridge`, `output` | Keep as-is |
| `managementDepth` | `readiness.managementDepth` | owner independence, readiness, achievable-today value indirectly | `owner-intake`, `scorecards`, `bridge`, `output` | Keep as-is |
| `processDocumentation` | `readiness.processDocumentation` | readiness, transferability, documentation/compliance | `owner-intake`, `scorecards`, `output` | Keep as-is |
| `replacementDifficulty` | `readiness.replacementDifficulty` | transferability, readiness, owner independence | `owner-intake`, `scorecards`, `output` | Keep as-is |
| `ownerCustomerRelationship` | `operatingProfile.founderRevenueDependence` fallback | customer transferability, revenue quality, readiness | `owner-intake`, `scorecards`, `confidence` | Keep as-is |
| `founderRevenueDependence` | `operatingProfile.founderRevenueDependence` | customer transferability, revenue quality, readiness | `owner-intake`, `scorecards`, `qualitative-adjustments`, `confidence` | Keep as-is |
| `customerConcentration` | `operatingProfile.customerConcentration` | revenue quality, customer transferability, readiness | `owner-intake`, `scorecards`, `confidence`, `output` | Keep as-is |
| `bestCustomerImpact` | `operatingProfile.bestCustomerRisk` | revenue quality, customer transferability, readiness | `owner-intake`, `scorecards`, `confidence`, `output` | Keep as-is |
| `recurringRevenueShare` | `operatingProfile.recurringRevenueShare` | revenue quality, customer transferability, readiness | `owner-intake`, `scorecards`, `qualitative-adjustments`, `confidence` | Keep as-is |
| `revenueVisibility` | `operatingProfile.revenueVisibility` | revenue quality, confidence, transferability | `owner-intake`, `scorecards`, `qualitative-adjustments`, `confidence` | Keep as-is |
| `legalStructure` | `company.legalStructure` | ownership clarity, transaction readiness, compliance | `owner-intake`, `scorecards`, `output` | Keep as-is |
| `ownerControl` | `company.ownerControlBand` | ownership clarity, transaction readiness | `owner-intake`, `scorecards`, `output` | Keep as-is |
| `operatingYears` | `company.operatingYearsBand` | readiness, confidence, operating-history caution | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence` | Keep as-is |
| `ownerAbsence2Weeks` | `readiness.ownerAbsence2Weeks` | owner independence, readiness | `owner-intake`, `scorecards`, `output` | Keep as-is |
| `assetSeparation` | `operatingProfile.assetSeparation` | readiness/compliance, operating resilience, achievable-today value indirectly | `owner-intake`, `scorecards`, `bridge`, `output` | Keep as-is |

### 4.3 Tier 3: Strong Branch-Quality / Scalability Levers

| Question | Canonical mapping | Affects today | Main engine modules | Recommendation |
| --- | --- | --- | --- | --- |
| `productRights` | `operatingProfile.productRights` | branch signal score, branch-quality factor, market-position support | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `quantities` | `operatingProfile.quantities` | repeatability/scalability score, branch-quality factor | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `productCustomisation` | `operatingProfile.productCustomisation` | repeatability/complexity score, branch-quality factor | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `grossMarginStability` | `operatingProfile.grossMarginStability` | branch-quality factor, product/retail confidence | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `supplierConcentration` | `operatingProfile.supplierConcentration` | branch-quality factor, product/retail resilience | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `shrinkageSpoilage` | `operatingProfile.shrinkageSpoilage` | branch-quality factor, product/retail resilience | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `peakSeasonDependency` | `operatingProfile.peakSeasonDependency` | branch-quality factor, product/retail confidence | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `staffUtilization` | `operatingProfile.staffUtilization` | branch-quality factor, services scalability | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `keyPersonDependencies` | `operatingProfile.keyPersonDependencies` | branch-quality factor, services transferability | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `pricingPowerVsMarket` | `operatingProfile.pricingPowerVsMarket` | branch-quality factor, services pricing signal | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `manufacturingValueCreation` | `operatingProfile.manufacturingValueCreation` | in-house value capture score, branch-quality factor | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `capacityUtilization` | `operatingProfile.capacityUtilization` | manufacturing branch-quality factor, growth-headroom signal | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `equipmentAgeCondition` | `operatingProfile.equipmentAgeCondition` | manufacturing branch-quality factor, reinvestment risk signal | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `rawMaterialPriceExposure` | `operatingProfile.rawMaterialPriceExposure` | manufacturing branch-quality factor, margin-risk signal | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `qualityCertifications` | `operatingProfile.qualityCertifications` | manufacturing branch-quality factor, confidence signal | `owner-intake`, `qualitative-adjustments`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |

### 4.4 Tier 4: Meaningful Scorecard / Confidence / Market-Position Inputs

| Question | Canonical mapping | Affects today | Main engine modules | Recommendation |
| --- | --- | --- | --- | --- |
| `industryFit` | `classification.industryFit` | market-position score, classification confidence | `owner-intake`, `scorecards`, `partial-valuation` | Keep, but could later influence benchmark confidence more explicitly |
| `catchmentArea` | `operatingProfile.catchmentArea` | market-position score plus capped qualitative valuation factor | `owner-intake`, `scorecards`, `qualitative-adjustments`, `approaches`, `partial-valuation` | Keep as live valuation lever |
| `pricingPower` | `operatingProfile.pricingPower` | market-position score plus capped qualitative valuation factor | `owner-intake`, `scorecards`, `qualitative-adjustments`, `approaches`, `partial-valuation` | Keep as live valuation lever |
| `marketDemand` | `operatingProfile.marketDemand` | market-position score, confidence earnings-stability input | `owner-intake`, `scorecards`, `confidence` | Keep as-is |
| `growthPotential` | `operatingProfile.growthOutlook` | market-position score, confidence earnings-stability input | `owner-intake`, `scorecards`, `confidence`, `partial-valuation` | Keep as-is |
| `differentiation` | `operatingProfile.differentiation` | market-position score plus capped qualitative valuation factor | `owner-intake`, `scorecards`, `qualitative-adjustments`, `approaches`, `partial-valuation` | Keep as live valuation lever |
| `largestSupplierShare` | `operatingProfile.largestSupplierShare` and derived `operatingProfile.supplierTransferability` | operating-resilience score and supplier-transferability derivation | `owner-intake`, `scorecards`, admin lab / sensitivity | Keep as quantitative supplier-risk input |
| `supplierReplacementTime` | `operatingProfile.supplierReplacementTime` and derived `operatingProfile.supplierTransferability` | operating-resilience score and supplier-transferability derivation | `owner-intake`, `scorecards`, admin lab / sensitivity | Keep as quantitative supplier-risk input |
| `criticalHireTime` | `operatingProfile.criticalHireTime` and derived `operatingProfile.hiringDifficulty` | operating-resilience score and hiring-difficulty derivation | `owner-intake`, `scorecards`, admin lab / sensitivity | Keep as quantitative hiring-risk input |
| `criticalHireSalaryPremium` | `operatingProfile.criticalHireSalaryPremium` and derived `operatingProfile.hiringDifficulty` | operating-resilience score and hiring-difficulty derivation | `owner-intake`, `scorecards`, admin lab / sensitivity | Keep as quantitative hiring-risk input |
| `inventoryProfile` | `operatingProfile.inventoryProfile` | operating-resilience score | `owner-intake`, `scorecards` | Keep as simple resilience signal for now |
| `fxExposure` | `operatingProfile.fxExposure` | operating-resilience score plus capped valuation sensitivity factor | `owner-intake`, `scorecards`, `qualitative-adjustments`, `approaches`, `confidence`, `partial-valuation` | Keep as live sensitivity lever |

### 4.5 Tier 5: Thin But Justified

| Question | Canonical mapping | Affects today | Main engine modules | Recommendation |
| --- | --- | --- | --- | --- |
| `level1` | `classification.level1` | top-level classification plus capped broad-family liquidity adjustment on achievable-today value | `owner-intake`, `qualitative-adjustments`, `bridge`, `output`, storage/admin | Keep as live structural input |
| `transactionGoal` | `engagement.purpose` and derived transaction target / standard of value | transaction-readiness score, valuation framing, capped transaction-context factor | `owner-intake`, `scorecards`, `bridge`, `output`, `partial-valuation` | Keep as live context/valuation input |
| `transactionTimeline` | `engagement.urgency` | transaction-readiness score, achievable-today urgency discount, forced-sale framing | `owner-intake`, `scorecards`, `bridge`, `output`, `partial-valuation` | Keep as live urgency input |
| `businessDescription` | `company.businessSummary` | audit context, classification QA, report narrative | `owner-intake`, storage/admin, `output` | Keep as context, not as valuation lever |
| `previousOffer` | `engagement.previousOfferStatus` | stored audit / market-context only | `owner-intake`, storage/admin | Keep as context only |
| `previousOfferAmount` | `engagement.previousOfferAmount` | stored audit / market-context only | `owner-intake`, storage/admin | Keep as context only |
| `respondentRole` | `meta.respondentRole` | phrasing / admin metadata only | `owner-intake`, storage/admin, UI copy resolver | Keep as UX/context only |

### 4.6 Tier 6: Operational / Compliance Only

| Question | Canonical mapping | Affects today | Main engine modules | Recommendation |
| --- | --- | --- | --- | --- |
| `businessName` | `company.businessName` | report identity, saved submission identity | `owner-intake`, storage/admin, `output` | Keep as operational |
| `firstName` | `company.firstName` | contact identity | `owner-intake`, storage/admin | Keep as operational |
| `lastName` | `company.lastName` | contact identity | `owner-intake`, storage/admin | Keep as operational |
| `email` | `company.email` | delivery / follow-up | `owner-intake`, storage/admin | Keep as operational |
| `whatsapp` | `company.whatsapp` | follow-up / delivery | `owner-intake`, storage/admin | Keep as operational |
| `termsAccepted` | `meta.acknowledged` | submission gate / compliance | `owner-intake`, request validation, storage/admin | Keep as compliance |

## 5. Practical Readout

The questions currently pulling the most weight are:

- `level2`
- financial history and forecast
- working-capital inputs
- normalization inputs
- net-debt / bridge inputs
- owner-independence and documentation inputs
- branch-quality questions

The thinnest but still justified questions are:

- `respondentRole`
- `businessDescription`
- `previousOffer`
- `previousOfferAmount`
- `inventoryProfile`

## 6. Next Design Candidates

If the next cleanup pass is to make the questionnaire even harder-hitting, the best redesign candidates are:

1. `inventoryProfile`: decide whether it should remain a resilience-only question or later feed a stronger working-capital adjustment.
2. `marketDemand` and `growthPotential`: decide whether they should stay scorecard/confidence inputs only or partially feed qualitative valuation adjustments.
3. `previousOffer*`: decide whether credible prior offers should remain context only or later anchor negotiation-range analytics.
