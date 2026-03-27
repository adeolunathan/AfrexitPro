# Benchmark Provenance and Refresh Workflow

Status: canonical benchmark-governance reference  
Applies to engine version: current local owner-mode engine  
Last updated: March 27, 2026

This document answers two practical questions:

1. What are the current live policy-registry numbers actually based on?
2. How should benchmark and calibration data be refreshed end to end?

## 1. Direct Answer

The current live policy-registry numbers are **not arbitrary**, but they are also **not yet a fully Nigeria-native primary-market dataset**.

Today, the live registry is built from a layered benchmark stack:

- policy defaults that define the initial owner-mode ranges and method structure
- benchmark observation sets that mix transaction proxies, public-comp proxies, curated secondary inputs, and some private/internal observations
- a calibration pass that derives the live low/mid/high ranges and evidence scores from those observations
- runtime hydration that merges the calibrated result into the live policy registry used by the engine

So the honest answer is:

- the numbers were **not made up at random**
- they were **curated and calibrated intentionally**
- but some policy groups still rely on **proxy evidence and curated overlays**
- the long-term goal is to replace as much of that proxy layer as possible with **Nigeria-native Afrexit internal observations**

## 2. Source Stack

The live registry is assembled from four layers.

### 2.1 Policy Defaults

File:

- [policy-registry.json](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/policy-registry.json)

This file defines the structural policy shape for each policy group:

- primary and secondary methods
- benchmark needs
- market multiple ranges
- capitalization-rate ranges
- working-capital target %
- marketability floor/ceiling
- reconciliation weights

These are the engine's starting assumptions. They are the initial valuation-policy seeds, not the final evidence layer by themselves.

### 2.2 Benchmark Observation Sets

File:

- [benchmark-data.json](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/benchmark-data.json)

This file holds the observation sets that benchmark the live ranges.

Observation source kinds currently allowed:

- `transaction`
- `public_comp`
- `private_observation`
- `curated_secondary`

Source references currently allowed:

- `transaction_report`
- `benchmark_report`
- `public_comp_dataset`
- `internal_case`
- `manual_entry`
- `reference_link`

Important current-state reality:

- some benchmark sets explicitly describe themselves as **transaction proxy benchmark sets**
- several source notes explicitly say the data is rebuilt from **locally curated proxy values**
- some source-reference links point to external benchmark pages such as BizBuySell reference pages
- marketability factors are still described in notes as **curated owner-mode overlays until Afrexit has enough internal Nigeria transaction evidence**

So the live system is already evidence-backed, but it is still partly a **curated proxy benchmark system**, not a fully closed proprietary data loop yet.

### 2.3 Calibration Layer

File:

- [calibration-table.json](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/calibration-table.json)

Script:

- [calibration-maintenance.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/scripts/valuation-engine/calibration-maintenance.mjs)

This layer converts raw observation sets into calibrated owner-mode policy values.

Key current behaviors:

- derived low/mid/high ranges use percentiles from the benchmark observations
- evidence score is computed from:
  - observation quality
  - source kind weighting
  - count depth
  - freshness
- working-capital target and marketability bounds can also be recalculated from observation data

Current evidence weighting in calibration:

- `transaction`: strongest weight
- `private_observation`: strong but slightly below direct transaction evidence
- `public_comp`: moderate proxy weight
- `curated_secondary`: weakest source weight

This means the calibration system already distinguishes stronger evidence from weaker evidence rather than treating every source equally.

### 2.4 Runtime Hydration

File:

- [policy-registry.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation/policy-registry.mjs)

At runtime, the engine loads:

- the raw policy registry
- the calibration table
- the benchmark dataset

It then hydrates each policy group with:

- calibrated owner-phase values
- evidence score
- freshness status
- source reliability score
- source mix
- transaction observation share
- internal observation count

This is the live registry that the owner-mode engine actually uses.

## 3. What the Current Numbers Are Based On

The present live ranges and caps are based on a mixture of:

- curated owner-mode policy assumptions
- sourceable small-business transaction proxies
- public-comp comparables where direct private-market evidence is sparse
- curated secondary benchmark inputs
- private/internal observations
- approved Afrexit internal observations where those already exist

That means the current numbers are best described as:

> calibrated working assumptions built from mixed evidence quality, with some policy groups already improved by internal observations and others still relying on external proxy sets.

They are therefore:

- more defensible than arbitrary manual numbers
- less strong than a mature proprietary Nigeria-native transaction database

## 4. Bootstrap vs Stronger Evidence

There are three practical evidence states in the system today.

### 4.1 Bootstrap-seeded

Some policy groups still depend mostly on bootstrap owner-phase defaults that were turned into synthetic benchmark observations during calibration maintenance.

Those are useful to keep the engine operational, but they are the weakest benchmark state.

### 4.2 Proxy-calibrated

Some policy groups use curated transaction proxies, public-comp support, and curated secondary owner-mode overlays.

This is stronger than pure bootstrap, but it still depends partly on external comparability judgment.

### 4.3 Internal-observation strengthened

The strongest current state is when a policy group includes approved Afrexit internal observations, because those are:

- Nigeria-native
- mandate/review linked
- reviewable
- increasingly specific to our owner-mode use case

That is the intended direction of travel for the whole benchmark layer.

## 5. Refresh Workflow End to End

This is the intended refresh flow for benchmark data and the live policy registry.

### 5.1 Capture new evidence

New evidence can come from:

- approved internal observations
- reviewed transaction evidence
- reviewed benchmark references
- explicitly curated manual entries when stronger evidence does not yet exist

For internal cases, the source of truth is the `internal_observations` table once an entry is:

- calibration-eligible
- approved

### 5.2 Ingest approved internal observations

Script:

- [ingest-internal-observations.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/scripts/valuation-engine/ingest-internal-observations.mjs)

What it does:

- reads approved calibration-eligible internal observations from Supabase
- groups them by policy group
- builds or updates `*_AFREXIT_INTERNAL` benchmark sets
- writes them into [benchmark-data.json](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/benchmark-data.json)
- triggers a calibration rebuild automatically

### 5.3 Rebuild calibration

Script:

- [calibration-maintenance.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/scripts/valuation-engine/calibration-maintenance.mjs)

Typical rebuild command:

```bash
node scripts/valuation-engine/calibration-maintenance.mjs rebuild
```

What it does:

- ensures each policy group has benchmark coverage
- derives calibrated ranges and targets from available observations
- updates [calibration-table.json](/Users/deolunathan/Downloads/BB/AfrexitPro/src/valuation-engine/calibration-table.json)

### 5.4 Validate the result

Before treating a refresh as trustworthy:

1. inspect the updated benchmark set notes and source mix
2. inspect calibration evidence score and freshness
3. run fixture regression
4. run the question audit

Useful checks:

```bash
npm run valuation:fixtures
node scripts/valuation-engine/run-question-audit.mjs
```

### 5.5 Ship the hydrated registry

No separate publish step exists in the local runtime. Once the JSON files are updated and committed, the live local registry is hydrated from them automatically by [policy-registry.mjs](/Users/deolunathan/Downloads/BB/AfrexitPro/server/valuation/policy-registry.mjs).

## 6. What Good Benchmark Governance Looks Like Here

For this project, good benchmark governance means:

- every policy group has an identifiable evidence stack
- source mix is visible
- evidence strength is scored, not implied
- stale data is penalized
- internal observations gradually displace foreign proxy assumptions
- calibration changes are traceable and regression-tested

This is also why the engine exposes:

- evidence score
- freshness status
- source reliability score
- source mix
- internal observation count

Those are there so benchmark quality can be audited, not hidden.

## 7. Current Limitations

These are still true today:

- some policy groups still depend materially on curated proxy transaction data
- some benchmark references are external benchmark pages plus manual-entry overlays
- marketability-factor evidence is still weaker than the core multiple/cap-rate evidence
- Nigeria-native internal coverage is still uneven across policy groups

So when someone asks, "How do we know to use these numbers?", the correct answer is:

> We use the current numbers because they are the best calibrated values available from our present benchmark stack, not because they are arbitrary. But some of those calibrated values are still proxy-based and should be replaced over time with stronger Afrexit internal evidence.

## 8. Related References

- [Readiness, Confidence, Methods, and Multiples Reference](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/readiness-confidence-methods-reference.md)
- [Owner-Phase Valuation Logic Traceability Specification](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/owner-phase-valuation-logic-traceability-spec.md)
- [Admin Lab Sensitivity and Audit Guide](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/admin-lab-sensitivity-and-audit-guide.md)
