# Admin Lab Sensitivity and Audit Guide

Status: canonical admin-lab interpretation guide  
Applies to engine version: current local owner-mode engine  
Last updated: March 27, 2026

This document explains how to read the internal admin lab so the output is interpreted correctly during testing.

It covers:

- Scenario Lab
- Sensitivity Matrix
- Direction check
- Question Audit
- audit statuses
- common reading mistakes

## 1. The Three Admin Views

### 1.1 Scenario Lab

Scenario Lab is for editing a full draft baseline and seeing how the total valuation package moves.

It shows:

- baseline vs current adjusted value
- baseline vs current readiness
- baseline vs current confidence
- current method context
- explicit factor cards such as:
  - geography factor
  - level 1 family factor
  - transaction-context factor
  - urgency factor
  - market-position factor
  - FX sensitivity factor
  - branch-quality factor

Use Scenario Lab when the question is:

- "What happens if I change several answers together?"
- "How much does this edited draft differ from the saved baseline?"

### 1.2 Sensitivity Matrix

Sensitivity Matrix is for changing **one question at a time** from the same baseline and comparing all of its options side by side.

It shows:

- one baseline row
- one row per option
- metric value
- metric delta vs baseline
- adjusted value and value delta
- readiness
- confidence
- method
- major factors such as market factor, branch factor, and geo factor

Use Sensitivity Matrix when the question is:

- "Does this question move the engine in the right direction?"
- "How much does this one answer actually matter?"
- "Do two options tie when they should separate?"

### 1.3 Question Audit

Question Audit is the formal engine-audit view.

It is driven by the machine-readable audit manifest and the audit runner, not by ad hoc manual clicks.

Use Question Audit when the question is:

- "Is this question passing the engine audit?"
- "Is it a true valuation/readiness/confidence lever?"
- "Is it context-only or structural by design?"

## 2. How to Read Sensitivity Matrix

### 2.1 Baseline

The baseline strip tells you the current draft state that every row is being compared against.

That matters because:

- the same question can have different magnitude in different business baselines
- some questions only matter in certain policy families

### 2.2 Metric and Metric Delta

The `Metric` column shows the selected metric value for that row.

The `Metric Δ` column shows how far that row moved from the baseline for the selected metric only.

If the selected metric is `Adjusted value`, then:

- `Metric` is the adjusted value
- `Metric Δ` is the adjusted-value change vs baseline

### 2.3 Value Delta

`Value Δ` always shows the adjusted-value change vs baseline in money terms, even if the selected metric is not adjusted value.

This is useful when:

- the selected metric is `Readiness` or `Confidence`
- but you still want to know whether midpoint value moved at all

### 2.4 Why Some Rows Can Look Similar

Two rows can legitimately look similar for several reasons:

- the question affects confidence or readiness more than midpoint value
- the selected baseline is not very sensitive to that question
- the effect exists, but the movement is small and rounded
- the question moves one factor, but not the currently displayed metric

That is why the matrix should be read together with:

- factor columns
- value delta
- readiness
- confidence

not just the rounded headline number.

## 3. Direction Check

### 3.1 What it means

`Direction check` tests whether the selected metric moves consistently in the intended direction across the question's built-in option order.

Available settings:

- `Ascending`
- `Descending`
- `No direction check`

### 3.2 What it does

It answers:

> If we walk through the options in the question's intended order, does the selected metric move consistently in the chosen direction?

### 3.3 What it does not do

It does **not** prove that the economic logic is correct by itself.

A direction check can pass even if:

- the wrong metric was selected
- the chosen direction was economically wrong
- the movement is monotonic but too small to be useful

So direction check is a sanity test, not the whole audit.

### 3.4 When to use `No direction check`

Use `No direction check` when:

- the question is not naturally ordered
- the question is structural rather than monotonic
- you only want to inspect the raw result rows without applying pass/fail logic

## 4. Audit Status Meanings

### 4.1 `passing`

The question is behaving as intended for its assigned audit role.

That means:

- it affects its allowed output domain
- it moves in the correct direction
- it is not unexpectedly inert
- it is not creating an unjustified method cliff

### 4.2 `wrong direction`

A weaker answer improved the wrong output, or a stronger answer worsened it when it should not have.

This is a real engine problem and must be fixed.

### 4.3 `too weak / tied`

The question is supposed to separate options, but the options are effectively tied or too weak to matter.

This is not as severe as wrong direction, but it means the question is not pulling enough weight.

### 4.4 `unexpected method switch`

The question changed value mainly by forcing a different method set in a way that is not intentionally designed.

This usually signals brittle threshold behavior.

### 4.5 `no-effect`

The question did not intentionally affect any of the outputs it is supposed to affect.

For a non-exception question, this is a failure.

### 4.6 `context-only by design`

The question is intentionally not a value/readiness/confidence lever.

Examples:

- contact fields
- respondent-role UX fields
- pure metadata or narrative context

This is not a failure.

### 4.7 `structural by design`

The question is intentionally a structural classifier rather than a normal monotonic lever.

Current example:

- `level2`

That question is allowed to change:

- policy group
- method family
- multiples
- capitalization rates

So it is audited differently from normal monotonic questions.

## 5. How to Interpret Factor Cards

Factor cards show the explicit applied valuation factors and their baseline/current deltas.

These are the clearest way to see why value moved.

Examples:

- `Geography factor`: location-based achievable-value effect
- `Level 1 family factor`: broad sector-family effect
- `Transaction-context factor`: goal/framing effect
- `Urgency factor`: transaction-timeline effect
- `Market-position factor`: market reach / pricing / defensibility effect
- `FX sensitivity factor`: capped exposure effect
- `Branch-quality factor`: industry-module qualitative effect

If midpoint value changed but a factor card did not, the movement likely came from:

- normalized earnings
- bridge items
- method inputs

rather than from a qualitative factor.

## 6. What to Investigate

Investigate further when you see:

- a weaker answer increasing value
- two clearly different options producing the same result where separation is expected
- a question only changing value because one method disappeared
- a question changing scorecards but not the output it is supposed to influence
- a row that looks flat even though business logic says it should matter

## 7. Suggested Testing Workflow

For one question:

1. pick a realistic baseline
2. run the question in Sensitivity Matrix
3. choose the most relevant metric
4. use Direction check only if the question is naturally ordered
5. inspect value delta, readiness, confidence, and factor columns together
6. if it still looks suspicious, inspect the Question Audit row and ledger

For a broader QA pass:

1. use Question Audit to find failures
2. use Sensitivity Matrix to inspect the suspicious question more closely
3. use Scenario Lab to understand how the change behaves inside a fuller draft

## 8. Related References

- [Generated Question Audit Report](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/questionnaires/generated-question-audit-report.md)
- [Adaptive Question Impact Matrix](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/questionnaires/question-impact-matrix.md)
- [Benchmark Provenance and Refresh Workflow](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/benchmark-provenance-and-refresh-workflow.md)
