# Readiness, Confidence, Methods, and Multiples Reference

Status: live-engine reference  
Applies to engine version: current local owner-mode engine  
Last updated: March 27, 2026

This document explains four things from the current codebase:

1. what `readiness` measures
2. what `confidence` measures
3. how owner-mode method selection works today
4. what market-multiple and capitalization-rate ranges are currently used by policy group

This is a reference for the engine **as currently implemented**, not a future-state design note.

Related references:

- [Benchmark Provenance and Refresh Workflow](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/benchmark-provenance-and-refresh-workflow.md)
- [Admin Lab Sensitivity and Audit Guide](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/admin-lab-sensitivity-and-audit-guide.md)

## 0. Quick Reference: Which Questions Affect What?

For the full question-by-question inventory, see [Adaptive Question Impact Matrix](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/questionnaires/question-impact-matrix.md).

This section is the compact reference view.

| Output area | Main live questions | What they do today |
|---|---|---|
| Direct midpoint value | `level2`, financial history, forecast, normalization amounts, working-capital balances, `cashBalance`, `financialDebt`, `shareholderLoans`, `primaryState`, `catchmentArea`, `pricingPower`, `differentiation`, `fxExposure`, branch-quality questions | Change representative earnings/revenue, method inputs, equity bridge, capped qualitative factors, or geography/branch adjustments that move the final adjusted value |
| Achievable-today / marketability | `primaryState`, `level1`, `transactionGoal`, `transactionTimeline`, `ownerAbsence2Weeks`, `ownerAbsence3Months`, `managementDepth`, `processDocumentation`, `replacementDifficulty`, `assetSeparation` | Change sellability, urgency, transferability, and marketability factors that affect the achievable-today side of the result |
| Readiness | `proofReadiness`, `bankingQuality`, `traceablePaymentsShare`, `financeTracking`, `ownerAbsence2Weeks`, `ownerAbsence3Months`, `managementDepth`, `processDocumentation`, `replacementDifficulty`, `ownerCustomerRelationship`, `founderRevenueDependence`, `customerConcentration`, `bestCustomerImpact`, `recurringRevenueShare`, `revenueVisibility`, `legalStructure`, `ownerControl`, `operatingYears`, `assetSeparation` | Feed the readiness assessment directly or through transferability / ownership / documentation / compliance components |
| Confidence and range | historical depth, `industryFit`, `proofReadiness`, `traceablePaymentsShare`, `bankingQuality`, `financeTracking`, normalization quality, working-capital coverage, `marketDemand`, `growthPotential`, `largestSupplierShare`, `supplierReplacementTime`, `criticalHireTime`, `criticalHireSalaryPremium`, `inventoryProfile`, `fxExposure`, branch-quality questions | Affect estimate reliability, benchmark relevance, data completeness, or earnings stability, which then affect `confidenceScore` and range width |
| Market-position score only or mostly | `industryFit`, `catchmentArea`, `marketDemand`, `growthPotential`, `differentiation`, `pricingPower` | Feed the market-position scorecard; only some of them also feed the direct valuation factor |
| Revenue-quality / transferability score | `customerConcentration`, `bestCustomerImpact`, `founderRevenueDependence`, `recurringRevenueShare`, `revenueVisibility` | Feed revenue-quality and customer-transferability signals used in readiness and confidence |
| Operating-resilience score | `largestSupplierShare`, `supplierReplacementTime`, `criticalHireTime`, `criticalHireSalaryPremium`, `inventoryProfile`, `workingCapitalHealth`, `assetSeparation`, `fxExposure` | Feed operating-resilience, which currently influences readiness/confidence and some capped qualitative adjustments |
| Context only | `businessDescription`, `previousOffer`, `previousOfferAmount`, `respondentRole` | Stored for audit, context, or UX phrasing, not as active valuation levers |
| Operational / compliance only | `businessName`, `firstName`, `lastName`, `email`, `whatsapp`, `termsAccepted` | Contact, storage, reporting, and submission gating only |

## 1. Readiness vs Confidence

`Readiness` and `confidence` are different scores.

### 1.1 Readiness

Readiness answers:

> How sale-ready, transferable, and diligence-ready is this business today?

In the current engine, readiness is built from:

- records quality
- ownership clarity
- customer transferability
- management depth
- compliance
- documentation
- operating history

The implementation is in [scorecards.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation/modules/scorecards.mjs).

Current formula:

- `readinessAverage = average(recordsQuality, ownershipClarity, customerTransferability, managementDepth, compliance, documentation)`
- `operatingYearsScore = scoreOperatingYearsBand(...)`
- `overallReadiness = readinessAverage * 0.9 + operatingYearsScore * 0.1`

Why it matters:

- readiness affects the **achievable-today / marketability side** of the result
- it is used in the EV-to-equity bridge in [bridge.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation/modules/bridge.mjs)

In plain language:

- a business can be fundamentally valuable but not very ready to sell
- high readiness means the company is easier to prove, transfer, and transact

### 1.2 Confidence

Confidence answers:

> How reliable and well-supported is this valuation estimate?

It is **not** a probability that the valuation is “correct.” It is an estimate-quality score.

In the current engine, confidence is built from:

- historical depth: `20%`
- financial quality: `22%`
- normalization quality: `16%`
- working-capital coverage: `12%`
- benchmark coverage: `14%`
- earnings stability: `16%`

Then it is adjusted for:

- stale benchmark evidence
- weak source reliability
- internal evidence bonus
- method dispersion penalty

The implementation is in [confidence.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation/modules/confidence.mjs).

Current formula:

- `overallConfidence = clamp(weighted sum - penalties + bonuses, 38, 90)`

Range width is then derived from confidence:

- `rangeWidthPct = clamp(34 - overallConfidence * 0.17 + methodDispersionPct * 0.12, 12, 38)`

Why it matters:

- confidence affects **how tight or wide** the valuation range should be
- it affects the notes/warnings around estimate quality
- it does **not** mean the business is sale-ready

In plain language:

- a business may be highly ready to sell but still have low confidence because the data is weak
- a business may have decent estimate confidence but still be poorly prepared for an actual transaction

## 2. Can Confidence Reach 90?

Yes, in code, confidence can reach `90`.

That is the current hard ceiling in [confidence.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation/modules/confidence.mjs).

But in practice, the current live engine does **not** reach `90` easily.

To get close, a case needs:

- strong historical depth
- clean financial records
- traceable payments
- high proof readiness
- working-capital coverage present
- quantified normalization
- stable earnings
- strong policy-group benchmark coverage
- fresh and reliable benchmark evidence
- low method dispersion

### Practical note

As of March 27, 2026, the strongest “ceiling-seeking” sample tested during this pass reached:

- `confidence = 80`
- `readiness = 89`

So `90` is currently a **theoretical cap**, but the live benchmark/calibration environment is still making real-world results land lower.

## 3. Sample Scenario: High-Confidence Reference Case

This sample is designed to push toward the confidence ceiling under the **current** engine.

### Company profile

- Name: `AtlasFlow Cloud`
- Business type: recurring SaaS workflow software
- Policy group: `PG_RECURRING_SOFTWARE`
- State: Lagos Island
- Operating years: `10_20`
- Industry fit: `perfect_fit`

### Commercial profile

- Catchment area: `international`
- Market demand: `strong_growth`
- Growth outlook: `strong_growth`
- Differentiation: `hard_to_copy`
- Pricing power: `strong_premium`
- Customer concentration: `none_material`
- Best-customer risk: `minor`
- Founder revenue dependence: `very_little`
- Recurring revenue share: `large_share`
- Revenue visibility: `contract_backed`
- Supplier transferability: `very_easy`
- Hiring difficulty: `feasible`
- FX exposure: `moderate`
- Working-capital health: `healthy`
- Asset separation: `clear`

### Financial / evidence profile

- `3` completed annual periods
- `1` current-year forecast with `high` forecast confidence
- bookkeeping: `software`
- banking quality: `clean`
- traceable payments share: `80_100`
- proof readiness: `immediate`
- quantified normalization schedule present with `high` confidence line items

### Readiness profile

- management depth: `team_controls`
- owner absence 2 weeks: `smooth`
- owner absence 3 months: `no_disruption`
- process documentation: `documented_multi`
- replacement difficulty: `easy`

### Observed output on March 27, 2026

- `confidence = 80`
- `readiness = 89`
- `primary method = market_multiple`
- `rangeWidthPct = 20.3`

### Why it is not yet 90

Even with very strong answers, confidence still depends on:

- benchmark coverage by policy group
- evidence freshness
- source reliability
- current calibration richness

Those are not fully maxed in the live engine today.

## 4. Sample Scenario: Very High Readiness Reference Case

This sample is designed to show what a very strong transferability/readiness profile looks like in the current engine.

### Company profile

- Name: `PrimeCare Plus Diagnostics`
- Business type: healthcare diagnostics service
- Policy group: `PG_HEALTHCARE_SERVICE`
- Operating years: `10_20`
- Industry fit: `perfect_fit`

### Readiness-driving answers

- management depth: `team_controls`
- owner absence 2 weeks: `smooth`
- owner absence 3 months: `no_disruption`
- process documentation: `documented_multi`
- replacement difficulty: `easy`
- proof readiness: `immediate`
- banking quality: `clean`
- traceable payments share: `80_100`
- bookkeeping: `software`
- customer concentration: `none_material`
- best-customer risk: `minor`
- founder revenue dependence: `very_little`
- asset separation: `clear`

### Observed output on March 27, 2026

- `readiness = 88`
- `confidence = 54`
- `primary method = market_multiple`

### Why readiness is high but confidence is not equally high

This is the best illustration of the difference between the two scores:

- readiness is strong because the business looks transferable and diligence-ready
- confidence is still moderate because confidence also depends on benchmark coverage, earnings stability, method dispersion, and data-depth characteristics beyond transferability

## 5. How Methods Are Chosen Today

Method selection is implemented in [method-selection.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation/modules/method-selection.mjs).

The logic works in this order:

1. `level2` resolves to a `policyGroupId`
2. the policy group carries:
   - the preferred market metric
   - the market-multiple range
   - the capitalized metric
   - the capitalization-rate range
   - any floor method
   - reconciliation weights
3. the engine then chooses which methods are actually usable for this specific company

### 5.1 Current owner-mode methods

The live owner-mode path currently uses:

- `market_multiple`
- `capitalized_earnings`
- `asset_approach`

`DCF` exists in contracts, but it is **not** currently part of owner-mode method selection.

### 5.2 Recurring software

For `PG_RECURRING_SOFTWARE`:

- use `market_multiple` if revenue is positive
- include `asset_approach` only if the policy group explicitly has an asset floor

Why:

- recurring software is anchored on revenue observability more than current EBITDA depth

### 5.3 Owner-led service groups

For:

- `PG_PROFESSIONAL_OWNER_LED`
- `PG_LOCAL_SERVICE_OWNER_OP`
- `PG_CREATIVE_AGENCY`

the engine:

- uses `capitalized_earnings` first if `SDE` or adjusted EBIT is positive
- adds `market_multiple` only if:
  - the policy group has a positive usable market metric, and
  - `ownerIndependence >= 70`
- adds `asset_approach` only where the policy group has an asset floor and there is real working-capital / maintenance-capex support

Why:

- owner-led service businesses are not treated as broadly transferable by default
- transferability has to be earned

### 5.4 All other policy groups

For most non-owner-led groups:

- add `market_multiple` if the configured market metric is positive
- add `capitalized_earnings` if:
  - adjusted EBIT is positive, and
  - either at least `2` years are available or financial quality is already decent
- add `asset_approach` if:
  - the policy group has an asset floor, or
  - the group is structurally asset-heavy, or
  - earnings are weak but revenue is present

### 5.5 Fallback

If nothing qualifies:

- use `market_multiple` if revenue exists
- otherwise fall back to `asset_approach`

## 6. How the Final Result Uses Multiple Methods

Once methods are selected:

- each chosen method is run independently
- the policy group’s reconciliation weights are applied
- the weighted blend becomes the pre-bridge enterprise-value conclusion

So the engine does **not** simply pick one multiple and stop there.

It usually does:

- method-level calculation
- weighted reconciliation
- qualitative adjustments
- EV-to-equity bridge
- achievable-today adjustment

## 7. Current Policy-Group Multiples and Capitalization Rates

The table below reflects the current live policy registry.

Interpretation:

- market range = low / mid / high **multiple**
- cap-rate range = low / mid / high **capitalization rate**
- lower capitalization rates imply higher earnings values

| Policy group | Market metric | Market range | Capitalized metric | Cap-rate range | Primary | Floor |
|---|---|---:|---|---:|---|---|
| Primary Agriculture and Raw Supply (`PG_AGRI_PRIMARY`) | revenue | 0.528x / 0.76x / 1.0305x | sde | 27.4% / 33.7% / 44.9% | capitalized_earnings | asset_approach |
| Agro-processing (`PG_AGRO_PROCESSING`) | revenue | 0.6025x / 0.675x / 0.764x | sde | 30.8% / 33.8% / 36.0% | market_multiple | asset_approach |
| Asset-heavy Manufacturing (`PG_ASSET_HEAVY_MANUFACTURING`) | adjustedEbitda | 3.24x / 4x / 4.74x | adjustedEbit | 21.6% / 23.0% / 24.4% | market_multiple | asset_approach |
| Contract Manufacturing (`PG_CONTRACT_MANUFACTURING`) | revenue | 0.632x / 0.76x / 0.866x | sde | 26.3% / 31.0% / 34.3% | market_multiple | asset_approach |
| Project Contracting and Engineering (`PG_PROJECT_CONTRACTING`) | revenue | 0.5555x / 0.7x / 0.828x | sde | 34.8% / 39.5% / 48.2% | capitalized_earnings | asset_approach |
| Trading and Distribution (`PG_TRADING_DISTRIBUTION`) | adjustedEbit | 2.74x / 3.4x / 3.96x | adjustedEbit | 24.8% / 26.5% / 28.2% | market_multiple | asset_approach |
| Retail and Commerce (`PG_RETAIL_COMMERCE`) | revenue | 0.353x / 0.48x / 0.607x | sde | 35.0% / 41.2% / 53.9% | market_multiple | asset_approach |
| Recurring Software and Digital Products (`PG_RECURRING_SOFTWARE`) | revenue | 1.18x / 1.7x / 2.44x | - | - | market_multiple | - |
| Project Software, IT Services, and Support (`PG_PROJECT_SOFTWARE_IT`) | revenue | 1.0205x / 1.085x / 1.408x | sde | 30.8% / 32.4% / 35.7% | market_multiple | - |
| Logistics and Asset-backed Mobility (`PG_LOGISTICS_ASSET`) | revenue | 0.7505x / 0.85x / 0.944x | sde | 25.2% / 28.7% / 35.5% | market_multiple | asset_approach |
| Hospitality, Travel, and Leisure Venues (`PG_HOSPITALITY_VENUE`) | revenue | 0.275x / 0.385x / 0.5005x | sde | 44.2% / 52.0% / 65.4% | market_multiple | asset_approach |
| Healthcare Services (`PG_HEALTHCARE_SERVICE`) | revenue | 0.735x / 0.925x / 1.159x | sde | 23.8% / 32.2% / 37.2% | market_multiple | asset_approach |
| Healthcare Distribution and Retail (`PG_HEALTHCARE_DISTRIBUTION`) | revenue | 0.4695x / 0.61x / 0.745x | sde | 33.9% / 36.6% / 41.2% | market_multiple | asset_approach |
| Enrollment-based Education (`PG_EDUCATION_ENROLLMENT`) | revenue | 0.5835x / 0.765x / 0.941x | sde | 35.0% / 40.4% / 50.3% | capitalized_earnings | asset_approach |
| Owner-led Professional Services (`PG_PROFESSIONAL_OWNER_LED`) | sde | 2.88x / 3.3x / 3.775x | sde | 23.6% / 25.0% / 26.4% | capitalized_earnings | - |
| Platform-style Professional Services (`PG_PROFESSIONAL_PLATFORM`) | revenue | 1.1515x / 1.375x / 1.527x | sde | 27.2% / 28.2% / 33.5% | market_multiple | - |
| Real Estate and Facility Services (`PG_REAL_ESTATE_SERVICE`) | revenue | 0.8335x / 0.89x / 0.9795x | sde | 34.5% / 36.8% / 38.0% | market_multiple | asset_approach |
| Property Asset and Development Support (`PG_PROPERTY_ASSET_NAV`) | revenue | 0.8335x / 0.89x / 0.9795x | sde | 34.5% / 36.8% / 38.0% | asset_approach | asset_approach |
| Creative and Agency Services (`PG_CREATIVE_AGENCY`) | revenue | 0.633x / 0.91x / 1.022x | sde | 38.1% / 40.4% / 50.3% | capitalized_earnings | - |
| Local Owner-operated Services (`PG_LOCAL_SERVICE_OWNER_OP`) | sde | 2.18x / 2.6x / 3.02x | sde | 24.8% / 26.5% / 28.2% | capitalized_earnings | asset_approach |

## 8. Bottom Line

- `readiness` = how sellable / transferable / diligence-ready the business is
- `confidence` = how reliable the estimate is
- confidence is capped at `90`, but the strongest tested current sample in this pass reached `80`
- very high readiness is achievable in the current model and the tested sample reached `88`
- method selection is policy-group driven and then filtered by the current business profile
- multiple ranges and cap-rate ranges are already explicit per policy group in the live registry

## 9. Benchmark Basis

For the full end-to-end answer to:

> Where do the current live policy-registry numbers actually come from, and what are they based on?

see:

- [Benchmark Provenance and Refresh Workflow](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/benchmark-provenance-and-refresh-workflow.md)

Short version:

- the live numbers are not arbitrary
- they are built from policy defaults, benchmark observation sets, and a calibration layer
- some policy groups already include stronger internal observations
- other policy groups still rely partly on curated proxy and secondary evidence
