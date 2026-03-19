# Adaptive Questionnaire Audit And Target Matrix

Status: approved reference for the adaptive owner-mode questionnaire  
Applies to engine version: `owner-phase-skeleton-v0.5`  
Last updated: March 19, 2026

Related references:

- [Adaptive Questionnaire PRD](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/ADAPTIVE_QUESTIONNAIRE_PRD.md)
- [Owner-Phase Valuation Logic Traceability Spec](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/owner-phase-valuation-logic-traceability-spec.md)
- [Afrexit Valuation Engine Master Plan](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/afrexit-valuation-engine-master-plan.md)

## 1. Purpose

This document is the audit reference for the adaptive owner-mode questionnaire.

It exists to answer four questions clearly:

1. Which questions stay, which get fixed, and which were removed.
2. Why each retained question earns its place.
3. Where each retained question maps in the canonical owner request.
4. How retained qualitative questions affect scorecards, readiness, confidence, and value.

## 2. Legend

Status:

- `Keep`: the question survives conceptually without structural redesign.
- `Fix`: the question survives, but required remapping, gating, canonicalization, or engine wiring.
- `Drop`: the question was removed from the adaptive owner flow.

Role:

- `V`: valuation-critical
- `R/T`: readiness / transferability-critical
- `O`: operational, audit, or data-critical

Decision rule:

- Every question that remains in the adaptive flow must be `V`, `R/T`, or `O`.
- Branch questions are allowed only when they materially improve industry interpretation, confidence, readiness, or a capped qualitative valuation adjustment.
- Resolver questions must be conditional. They do not earn a permanent always-on slot unless they carry broad scoring value on their own.

## 3. Current-State Audit Matrix

This table records the approved decision for every adaptive question that existed at audit time.

### 3.1 Anchor

| Question | Status | Role | Approved reasoning |
| --- | --- | --- | --- |
| `level1` | Keep | V | Required for top-level classification. |
| `level2` | Keep | V | Required for policy-group and method resolution. |
| `industryFit` | Fix | V/R/T | Kept, but UI values had to be canonicalized to the contract enum. |
| `businessDescription` | Keep | O | Kept for data, classification QA, and audit context; routed to `company.businessSummary`. |
| `revenueLatest` financial table | Keep | V | Core revenue and profit history intake. |
| `operatingYears` | Fix | R/T | Kept and now feeds final readiness/confidence modestly. |
| `primaryState` | Fix | V | Kept and now affects achievable-today value through a modest geography factor. |
| `catchmentArea` | Fix | V/R/T | Kept, but answer vocabulary had to be remapped to canonical values. |
| `pricingPower` | Fix | V | Kept, but answer vocabulary had to be remapped to canonical values. |
| `transactionGoal` | Keep | R/T | Keeps engagement purpose and deal context explicit. |
| `proofReadiness` | Keep | R/T | Strong records-quality and confidence driver. |
| `ownerControl` | Keep | R/T | Ownership clarity and readiness input. |
| `marketDemand` | Keep | V | Market-position and confidence input. |

### 3.2 Closing

| Question | Status | Role | Approved reasoning |
| --- | --- | --- | --- |
| `traceablePaymentsShare` | Keep | R/T | Direct records-quality input. |
| `bankingQuality` | Keep | R/T | Direct records and compliance input. |
| `financeTracking` | Keep | R/T | Direct bookkeeping-quality input. |
| `cashFlowPosition` | Drop | - | Redundant beside hard-number working-capital inputs. |
| `ownerAbsence2Weeks` | Keep | R/T | Direct owner-independence input. |
| `ownerAbsence3Months` | Keep | R/T | Stronger owner-independence and transferability input. |
| `ownerCustomerRelationship` | Fix | R/T | Kept as the universal founder-dependence resolver; now maps into `founderRevenueDependence`. |
| `managementIndependence` | Drop | - | Redundant beside `managementDepth`, `ownerAbsence3Months`, and `replacementDifficulty`. |
| `managementDepth` | Keep | R/T | Direct management-bench input. |
| `processDocumentation` | Keep | R/T | Direct documentation and transferability input. |
| `replacementDifficulty` | Keep | R/T | Direct transferability input. |
| `employeeTenure` | Drop | - | Useful in diligence, but not critical enough for adaptive owner intake. |
| `laborMarketDifficulty` | Fix | R/T | Kept and remapped to canonical `hiringDifficulty`. |
| `recruitmentForGrowth` | Drop | - | Redundant beside hiring-difficulty logic. |
| `growthPotential` | Fix | V/R/T | Kept and remapped to canonical `growthOutlook`. |
| `customerConcentration` | Fix | R/T | Kept once as the universal concentration question; value set canonicalized. |
| `bestCustomerImpact` | Fix | R/T | Kept and remapped to canonical `bestCustomerRisk`; now conditional. |
| `partnerDependency` | Fix | R/T | Kept and remapped to canonical `supplierTransferability`. |
| `legalStructure` | Keep | R/T | Added back because readiness and transferability already score it. |
| `transactionTimeline` | Keep | R/T | Added back because urgency matters for readiness and forced-sale framing. |
| `receivablesLatest` | Keep | V | Working-capital bridge input. |
| `payablesLatest` | Keep | V | Working-capital bridge input. |
| `cashBalance` | Keep | V | Equity bridge input. |
| `ownerTotalCompensation` | Keep | V | Owner-comp normalization input. |
| `marketManagerCompensation` | Keep | V | Replacement-cost normalization input. |
| `relatedPartyRentPaid` | Keep | V | Rent normalization input. |
| `marketRentEquivalent` | Keep | V | Rent normalization input. |
| `relatedPartyCompPaid` | Keep | V | Related-party payroll normalization input. |
| `marketRelatedPartyCompEquivalent` | Keep | V | Related-party payroll normalization input. |
| `privateExpensesAmount` | Keep | V | Profit normalization input. |
| `oneOffExpenseAmount` | Keep | V | Profit normalization input. |
| `oneOffIncomeAmount` | Keep | V | Profit normalization input. |
| `nonCoreIncomeAmount` | Keep | V | Profit normalization input. |
| `annualDepreciation` | Fix | V | Kept and remapped to `depreciationAmortization`. |
| `financialDebt` | Keep | V | Equity bridge input. |
| `shareholderLoans` | Keep | V | Equity bridge input. |
| `previousOffer` | Fix | O | Kept for market-context and audit use; now persisted canonically. |
| `previousOfferAmount` | Fix | O | Kept, but conditional on a real offer. |
| `businessName` | Keep | O | Required for result identity. |
| `firstName` | Keep | O | Required for result identity. |
| `email` | Keep | O | Required for delivery and follow-up. |
| `whatsapp` | Keep | O | Required for follow-up. |
| `termsAccepted` | Keep | O | Required submission gate. |

### 3.3 Branches

| Branch | Question | Status | Role | Approved reasoning |
| --- | --- | --- | --- | --- |
| Product / Retail | `inventoryValueLatest` | Keep | V | Inventory and working-capital input. |
| Product / Retail | `inventoryProfile` | Keep | R/T | Existing resilience signal. |
| Product / Retail | `grossMarginStability` | Fix | V | Kept and now drives branch quality and confidence. |
| Product / Retail | `supplierConcentration` | Fix | R/T | Kept and now drives branch quality and resilience. |
| Product / Retail | `shrinkageSpoilage` | Fix | V | Kept and now drives branch quality and resilience. |
| Product / Retail | `peakSeasonDependency` | Fix | V/R/T | Kept and now drives branch quality and confidence. |
| Professional Services | `founderRevenueDependence` | Fix | R/T | Kept as the branch-specific founder-dependence resolver. |
| Professional Services | `recurringRevenueShare` | Keep | R/T | Direct revenue-quality input. |
| Professional Services | `revenueVisibility` | Keep | R/T | Direct revenue-quality input. |
| Professional Services | `staffUtilization` | Fix | V | Kept and now drives branch quality. |
| Professional Services | `keyPersonDependencies` | Fix | R/T | Kept and now drives branch quality. |
| Professional Services | `pricingPowerVsMarket` | Fix | V | Kept and now drives branch quality. |
| Manufacturing | `capacityUtilization` | Fix | V | Kept and now drives branch quality. |
| Manufacturing | `equipmentAgeCondition` | Fix | V | Kept and now drives branch quality. |
| Manufacturing | `maintenanceCapexLatest` | Keep | V | Existing numeric input and branch-quality context. |
| Manufacturing | `customerConcentration` | Drop | - | Removed as a duplicate of the universal concentration question. |
| Manufacturing | `rawMaterialPriceExposure` | Fix | V | Kept and now drives branch quality. |
| Manufacturing | `qualityCertifications` | Fix | R/T | Kept and now drives branch quality and confidence. |

## 4. Approved Target Questionnaire

### 4.1 Anchor flow

- `level1`
- `level2`
- `industryFit`
- `businessDescription`
- `revenueLatest` financial table
- `operatingYears`
- `primaryState`
- `catchmentArea`
- `pricingPower`
- `transactionGoal`
- `proofReadiness`
- `ownerControl`
- `marketDemand`

### 4.2 Closing flow

- Records and proof: `traceablePaymentsShare`, `bankingQuality`, `financeTracking`
- Transferability and readiness: `ownerAbsence2Weeks`, `ownerAbsence3Months`, `ownerCustomerRelationship`, `managementDepth`, `processDocumentation`, `replacementDifficulty`, `laborMarketDifficulty`, `growthPotential`, `customerConcentration`, `bestCustomerImpact`, `partnerDependency`, `legalStructure`, `transactionTimeline`
- Working capital and bridge: `receivablesLatest`, `payablesLatest`, `cashBalance`, `financialDebt`, `shareholderLoans`
- Normalization: `ownerTotalCompensation`, `marketManagerCompensation`, `relatedPartyRentPaid`, `marketRentEquivalent`, `relatedPartyCompPaid`, `marketRelatedPartyCompEquivalent`, `privateExpensesAmount`, `oneOffExpenseAmount`, `oneOffIncomeAmount`, `nonCoreIncomeAmount`, `annualDepreciation`
- Market-context / audit: `previousOffer`, `previousOfferAmount`
- Contact and consent: `businessName`, `firstName`, `email`, `whatsapp`, `termsAccepted`

### 4.3 Branches

- Product / Retail: `inventoryValueLatest`, `inventoryProfile`, `grossMarginStability`, `supplierConcentration`, `shrinkageSpoilage`, `peakSeasonDependency`
- Professional Services: `founderRevenueDependence`, `recurringRevenueShare`, `revenueVisibility`, `staffUtilization`, `keyPersonDependencies`, `pricingPowerVsMarket`
- Manufacturing: `capacityUtilization`, `equipmentAgeCondition`, `maintenanceCapexLatest`, `rawMaterialPriceExposure`, `qualityCertifications`

## 5. Canonical Mapping Table

The following mappings are the ones most likely to be audited because they were previously wrong, missing, or ambiguous.

| UI question | Canonical field | Implementation rule | Engine usage |
| --- | --- | --- | --- |
| `businessDescription` | `company.businessSummary` | Route the adaptive free-text description into the canonical summary field. | Audit context, report context, classification QA. |
| `industryFit` | `classification.industryFit` | Canonicalize adaptive values to `perfect_fit / mostly_fit / partial_fit / poor_fit / not_sure`. | Market-position score. |
| `catchmentArea` | `operatingProfile.catchmentArea` | Canonicalize adaptive values to the original bank values. | Market-position score. |
| `pricingPower` | `operatingProfile.pricingPower` | Canonicalize adaptive values to the original bank values. | Market-position score. |
| `growthPotential` | `operatingProfile.growthOutlook` | Map directly into canonical growth outlook. | Market-position score and confidence earnings-stability input. |
| `laborMarketDifficulty` | `operatingProfile.hiringDifficulty` | Map directly into canonical hiring difficulty. | Operating-resilience score. |
| `ownerCustomerRelationship` | `operatingProfile.founderRevenueDependence` | Use as the universal founder-dependence resolver when no branch-specific answer exists. | Revenue quality, transferability, readiness. |
| `founderRevenueDependence` | `operatingProfile.founderRevenueDependence` | Branch-specific resolver takes precedence over the universal fallback. | Revenue quality, transferability, readiness. |
| `customerConcentration` | `operatingProfile.customerConcentration` | Canonicalize to `none_material / manageable / high / extreme / not_sure`. | Revenue quality and transferability. |
| `bestCustomerImpact` | `operatingProfile.bestCustomerRisk` | Canonicalize to `minor / noticeable / major / severe`. | Revenue quality and transferability. |
| `partnerDependency` | `operatingProfile.supplierTransferability` | Canonicalize to `very_easy / manageable / uncertain / very_difficult`. | Operating resilience. |
| `annualDepreciation` | `financials.historicals[*].depreciationAmortization` | Store on the latest historical period. | EBITDA normalization and capitalized-earnings logic. |
| `previousOffer` | `engagement.previousOfferStatus` | Persist for audit context only. | Stored in canonical payload and result trail, not scored. |
| `previousOfferAmount` | `engagement.previousOfferAmount` | Persist only when `previousOfferStatus === yes`. | Stored in canonical payload and result trail, not scored. |
| Product / Retail branch fields | `operatingProfile.*` branch fields | Carry through unchanged. | Branch score, confidence note, capped branch factor. |
| Professional Services branch fields | `operatingProfile.*` branch fields | Carry through unchanged. | Branch score, confidence note, capped branch factor. |
| Manufacturing branch fields | `operatingProfile.*` branch fields | Carry through unchanged. | Branch score, confidence note, capped branch factor. |

## 6. Resolver Rules

Only these adaptive resolver rules are approved in this pass:

- `previousOfferAmount` shows only when `previousOffer === yes`.
- `bestCustomerImpact` shows only when `customerConcentration` is not the lowest-risk answer.
- `ownerCustomerRelationship` is universal and always available.
- `founderRevenueDependence` stays as the professional-services branch resolver and overrides the universal founder-dependence fallback when present.

Explicit non-rule for this pass:

- no extra always-on ambiguity questions were added beyond the approved resolvers above

## 7. Balanced Scoring Policy

### 7.1 Geography

- `primaryState` affects owner-mode achievable-today value only.
- It does not change fundamental enterprise value.
- It does not change policy-group selection.
- It is intentionally modest and capped.

Buckets:

- premium hubs: `lagos_island`, `lagos_mainland`, `fct` => `1.025`
- established hubs: `rivers`, `ogun`, `oyo`, `kano`, `anambra`, `delta`, `edo`, `kaduna`, `akwa_ibom` => `1.000`
- all other states => `0.975`

### 7.2 Operating history

- `operatingYears` now affects readiness and confidence modestly.
- It does not directly change the multiple or capitalization rate in this pass.

### 7.3 Branch-only qualitative fields

- One branch-quality factor is computed per submission.
- It applies only to market and capitalized-earnings approaches.
- It does not apply to the asset floor.
- It is capped at `0.94` to `1.06`.
- A smaller version of the same effect is used in partial valuation so the live adaptive range does not drift from final valuation.

Branch family intent:

- Product / Retail: gross-margin stability, supplier concentration, shrinkage/spoilage, and peak-season dependence drive resilience, confidence, and the capped branch factor.
- Professional Services: founder dependence, recurring revenue, revenue visibility, staff utilization, key-person dependence, and pricing-power-vs-market drive revenue quality, transferability, confidence, and the capped branch factor.
- Manufacturing: capacity utilization, equipment condition, maintenance-capex context, raw-material exposure, and certifications drive resilience, confidence, and the capped branch factor.

## 8. Deferred Items And Non-Goals

Deferred from this pass:

- adding new always-on ambiguity questions beyond the approved resolvers
- reworking the PRD target count further below the current cleaned flow
- introducing `previousOffer` as a scored valuation signal
- changing policy-group benchmark selection from state or geography

Still intentionally defaulted in owner mode unless a future pass adds explicit questions:

- deeper differentiation detail
- working-capital-health subjective override
- asset-separation detail beyond current canonical fallback path
- FX-exposure detail beyond current canonical fallback path

## 9. Audit Notes

What this document should prevent:

- dead questions that collect data but never reach the canonical request
- UI-only enum values that fail schema validation later
- branch questions that are asked but do not change score, confidence, or value
- undocumented value adjustments that an auditor cannot trace back to source answers

This file should be updated whenever any of these change:

- adaptive question inventory
- conditional resolver rules
- canonical field mappings
- geography buckets
- branch-quality-factor policy
