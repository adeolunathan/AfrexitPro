# Afrexit Adaptive Questionnaire PRD

**Status:** Draft  
**Last Updated:** March 17, 2026  
**Owner:** Product/Engineering  

---

## 1. EXECUTIVE SUMMARY

This document defines the architecture and implementation plan for Afrexit's adaptive questionnaire system — the "Valuation Ladder." The system replaces the current static 62-question form with a dynamic, branch-based experience that:

- Shows **~32 questions** per user (down from 62)
- Tightens the valuation range as users progress
- Uses business model branches to ask only relevant questions
- Replaces progress bars with a **confidence meter**
- Surfaces a preliminary range after 10 anchor questions

---

## 2. CORE PRINCIPLES

### Principle 1: Visible Branching
When the path changes, tell the user why.

> *"Because you selected Manufacturing, we'll ask about equipment, production capacity, and working capital."*

### Principle 2: Branch by Business Model
Use a small number of top-level logic trees:
- Product/Retail/Distribution
- Service/Professional
- Manufacturing/Production
- (Future: Tech/Subscription, Project/Contract, Asset-Heavy, Multi-location)

Each tree pulls in relevant question modules.

### Principle 3: Invisible Skips, Explainable Categories
- Do NOT show grayed-out questions (clutter)
- DO show section summaries explaining what was skipped and why

### Principle 4: Confidence Indicators
Users should understand the effect of missing/estimated data.

> *"Valuation confidence: Medium. Why: We used revenue and profit history, but not customer concentration or owner salary normalization."*

### Principle 5: No Skipping
Users cannot skip questions. However:
- Uncertainty in answers widens the range
- Low-confidence answers are flagged in the report

### Principle 6: Business Health Framing
Discuss "business health" before "sale readiness." Output includes:
- Valuation range
- Attractiveness score
- 3 biggest factors affecting value

---

## 3. USER FLOW

### Phase 1: Anchor Questions (Universal)
**Questions 1-10 — All Users**

| # | Question ID | Question | Input Type | Purpose |
|---|-------------|----------|------------|---------|
| 1 | level1 | What industry is your business in? | Select | Policy group selection |
| 2 | level2 | Which best describes how you make money? | Select | Branch trigger |
| 3 | revenueLatest | What was your latest full-year revenue? | Number (₦) | Core valuation input |
| 4 | operatingProfitLatest | What was your operating profit? | Number (₦) | Core valuation input |
| 5 | operatingYears | How long has the business been operating? | Select | Stability factor |
| 6 | primaryState | Where is the business mainly based? | Select | Geographic adjustment |
| 7 | transactionGoal | What outcome are you preparing for? | Select | Valuation premise |
| 8 | proofReadiness | How quickly could you prove revenue/profit? | Select | Records quality |
| 9 | ownerControl | What percentage do you own? | Select | Control premium |
| 10 | marketDemand | How is demand in your market moving? | Select | Growth outlook |

**After Q10:** Show preliminary range + branch explanation

```
Preliminary Range: ₦300M – ₦600M
Confidence: Low (wide spread)

Because you selected Manufacturing, we'll ask about equipment, 
production capacity, and working capital next.

[Continue to Production Questions]
```

### Phase 2: Branch Module
**Questions 11-16 — Branch-Specific**

| Branch | Trigger | Module | Questions |
|--------|---------|--------|-----------|
| **Product/Retail** | retail*, wholesale, distribution, ecommerce | Inventory & Operations | 6 |
| **Services** | consulting, legal, accounting, agency | Client Base & Team | 6 |
| **Manufacturing** | manufacturing*, production, assembly | Production Capacity | 6 |
| **(Future)** | saas, software | Tech/Subscription | 6-7 |
| **(Future)** | construction, contracting | Project/Contract | 5-6 |
| **(Future)** | multi_location flag | Multi-location | 3-4 |

**Stackable:** A "SaaS with hardware" gets both Tech AND Asset-Heavy modules.

### Phase 3: Universal Closing
**Questions 17-32 — All Users**

| Section | Questions | Tier | Est. Count |
|---------|-----------|------|------------|
| Financial Quality | Proof readiness, banking quality, traceable payments | Required | 3 |
| Owner/Team | Absence tests, management depth, documentation | Required | 5 |
| Working Capital | Receivables, payables, cash | Helpful | 3-4 |
| Normalization | Owner comp, related party transactions | Helpful | 4-6 |
| Capital Structure | Debt, shareholder loans | Optional | 2-3 |
| Contact | Name, email, WhatsApp, terms | Required | 5 |

**Total: ~28-32 questions** depending on conditional logic in Closing.

---

## 4. BRANCH DETAILS

### Branch 1: Product/Retail/Distribution
**Triggered by:** `level2` in `[retail_physical, retail_ecommerce, wholesale, distribution]`

**Section Title:** Inventory & Operations Deep-Dive

**Questions:**
1. Stock turnover (days inventory outstanding)
2. Gross margin stability (volatile/stable/expanding)
3. Supplier concentration (single vs diversified)
4. Shrinkage/spoilage experience
5. Peak season dependency
6. SKU complexity (simple/few vs complex/many)

**Skip Logic:**
- If `inventoryProfile = 'service_business'` (selected in Anchor), skip all inventory questions
- Show explanation: *"We skipped inventory questions because service businesses don't hold stock."*

### Branch 2: Professional Services
**Triggered by:** `level2` in `[consulting, legal, accounting, agency, advisory]`

**Section Title:** Client Base & Team Capability

**Questions:**
1. Founder/client relationship depth
2. Recurring/retainer revenue percentage
3. Staff utilization rate
4. Key person dependencies (besides founder)
5. Contract visibility (pipeline)
6. Pricing power vs market rates

### Branch 3: Manufacturing/Production
**Triggered by:** `level2` in `[manufacturing, assembly, production]`

**Section Title:** Production Capacity & Equipment

**Questions:**
1. Capacity utilization (current %)
2. Equipment age/condition
3. Maintenance capex (actual spend)
4. Customer concentration (top 3 %)
5. Raw material price exposure
6. Quality certifications/standards

### Future Branches (Architecture Support)
Define interfaces now, implement later:

```typescript
interface BranchModule {
  id: string;
  trigger: (level2: string, answers: Record<string, any>) => boolean;
  title: string;
  description: string;
  questions: Question[];
  skipLogic?: (answers: Record<string, any>) => string[]; // question IDs to skip
}
```

---

## 5. CONFIDENCE METER

Replace progress bar with confidence indicator.

### Visual Design
```
Valuation Confidence: ████████░░ Medium

What's included so far:
✓ Revenue and profit foundation
✓ Manufacturing operations
○ Customer concentration (next)
○ Working capital position
○ Owner transferability

Current range: ₦450M – ₦900M (±50%)
With full data: Typically tightens to ±15-20%
```

### Confidence Levels
| Level | Score | Range Width | Description |
|-------|-------|-------------|-------------|
| Very Low | 0-25 | ±70%+ | Anchor only |
| Low | 26-40 | ±50% | Anchor + partial branch |
| Medium | 41-60 | ±30% | Core data complete |
| High | 61-80 | ±20% | Most data complete |
| Very High | 81-100 | ±15% | Full assessment |

### Confidence Penalties
Certain answers reduce confidence and widen range:

| Answer | Confidence Impact | Range Impact |
|--------|-------------------|--------------|
| `industryFit = 'poor_fit'` | -15 | +15% width |
| `industryFit = 'not_sure'` | -10 | +10% width |
| `proofReadiness = 'difficult'` | -10 | +10% width |
| Historical data missing | -5 per year | +5% width |

---

## 6. PARTIAL SCORING API

### Endpoint
```
POST /api/valuation-partial
```

### Request
```json
{
  "answers": {
    "level1": "manufacturing",
    "level2": "production",
    "revenueLatest": 150000000,
    "operatingProfitLatest": 25000000,
    // ... all answers so far
  },
  "checkpoint": "anchor_complete" | "branch_complete" | "final"
}
```

### Response
```json
{
  "range": {
    "low": 300000000,
    "high": 600000000,
    "mid": 450000000
  },
  "confidence": "low",
  "confidenceScore": 35,
  "confidenceBreakdown": {
    "dataCompleteness": 40,
    "recordsQuality": 30,
    "benchmarkCoverage": 35
  },
  "nextSection": {
    "id": "manufacturing",
    "title": "Production Capacity & Equipment",
    "questionCount": 6,
    "description": "Equipment utilization, maintenance, and capacity constraints"
  },
  "flags": [
    {
      "type": "warning",
      "message": "Industry classification uncertain — range widened",
      "field": "industryFit"
    }
  ],
  "estimatedCompletion": {
    "questionsRemaining": 18,
    "timeRemaining": "8-10 minutes"
  }
}
```

---

## 7. CONDITIONAL LOGIC

### Within-Branch Skips
Example: Manufacturing branch
```
IF maintenanceCapexLatest = 0:
  → Skip "Equipment condition follow-up"
  → Show: "No maintenance capex reported — assuming minimal equipment needs"
```

### Closing Phase Skips
```
IF relatedPartyRentPaid = 0:
  → marketRentEquivalent = 0 (auto-fill)
  → Don't ask
  
IF level2 is service-type:
  → inventoryValueLatest = 0 (auto-fill)
  → Don't ask
```

### Visual Explanation
When questions are skipped, show a dismissible banner:
```
ℹ️ We skipped inventory and equipment questions because they 
   don't usually affect valuations for advisory firms.
```

---

## 8. SECTION RENAMING

| Old Name | New Name | Rationale |
|----------|----------|-----------|
| Business Profile | Market Position Assessment | Value-first framing |
| Financial Snapshot | Profitability Foundation | What it unlocks |
| Financial History | Growth Trajectory | Future-looking |
| [Branch Module] | [Branch-Specific Driver] | Contextual value |
| Owner/Team | Transferability Score | Buyer-readiness |
| Customers/Operations | Revenue Quality Rating | Metric framing |
| Adjustments/Capital | True Earnings Calculation | Precision appeal |
| Working Capital | Cash Flow Assessment | Operational health |
| Contact | Your Valuation Report | Output promise |

---

## 9. UI/UX SPECIFICATIONS

### Question Display
- One question per screen (like NIMBO)
- Large, legible typography
- Number indicator: "Question 12 of ~32"
- No progress percentage

### Preliminary Range Card
Appears after Q10:
```
┌─────────────────────────────────────┐
│  Preliminary Valuation              │
│                                     │
│  ₦300,000,000 – ₦600,000,000        │
│                                     │
│  Confidence: Low (expected)         │
│  This will tighten as we continue   │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

### Branch Transition
```
┌─────────────────────────────────────┐
│  Next: Production Capacity          │
│                                     │
│  Because you selected Manufacturing,│
│  we'll ask about:                   │
│  • Equipment utilization            │
│  • Maintenance requirements         │
│  • Production constraints           │
│                                     │
│  (6 questions, ~3 minutes)          │
│                                     │
│  [Start Section]                    │
└─────────────────────────────────────┘
```

### Mobile Considerations
- Bottom sheet for question navigation
- Large tap targets (min 48px)
- Number pad for financial inputs
- WhatsApp-style question flow optional for later

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1) ✅ COMPLETE
- [x] Build 10 anchor questions
- [x] Build closing phase (16 questions)  
- [x] Simple linear flow (no branching)
- [x] Preliminary range after Q10 using lightweight engine
- [x] Basic confidence meter UI

**Deliverable:** Working questionnaire, ~26 questions, static flow
**Status:** Implemented and building successfully
**Date:** March 17, 2026
**Files Created:**
- `src/data/adaptive-question-bank.ts` — Question definitions
- `src/sections/AdaptiveQuestionnaire.tsx` — Main questionnaire component
- `src/api/valuation-partial.ts` — Lightweight preliminary valuation engine
- `src/components/ConfidenceMeter.tsx` — Confidence meter UI component

### Phase 2: Branch System (Week 2) ✅ COMPLETE
- [x] Create branch module architecture
- [x] Implement 3 branches (Product, Services, Manufacturing)
- [x] Branch detection logic
- [x] Visible branching explanations
- [x] Stacked branch support (multiple modules)

**Deliverable:** Adaptive questionnaire, ~32 questions, branched flow
**Status:** Implemented and building successfully
**Date:** March 17, 2026
**Files Created/Modified:**
- `src/data/branch-modules.ts` — Branch registry and 3 branch modules
- `src/sections/AdaptiveQuestionnaire.tsx` — Updated with branch logic
- `src/valuation-engine/owner-intake.ts` — Added new field bindings

**Branch Modules:**
1. **product_retail** — Inventory, suppliers, shrinkage, seasonality (6 questions)
2. **professional_services** — Client relationships, recurring revenue, utilization (6 questions)
3. **manufacturing** — Capacity, equipment, raw materials, certifications (6 questions)

### Phase 3: Intelligence (Week 3)
- [ ] Build `/api/valuation-partial` endpoint
- [ ] Confidence scoring algorithm
- [ ] Range tightening visualization
- [ ] Uncertainty flag system
- [ ] Conditional skip logic

**Deliverable:** Live confidence meter, partial scoring, smart skips

### Phase 4: Polish (Week 4)
- [ ] Section renaming
- [ ] Mobile optimization
- [ ] A/B test framework
- [ ] Analytics instrumentation
- [ ] Future branch scaffolding

**Deliverable:** Production-ready adaptive questionnaire

---

## 11. TECHNICAL ARCHITECTURE

### Data Structure
```typescript
interface QuestionnaireState {
  phase: 'anchor' | 'branch' | 'closing';
  currentQuestionIndex: number;
  answers: Record<string, FormValue>;
  branchModules: string[]; // IDs of active branches
  confidence: {
    score: number;
    level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    breakdown: Record<string, number>;
  };
  preliminaryRange?: {
    low: number;
    high: number;
    mid: number;
  };
  flags: Flag[];
}
```

### Branch Registry
```typescript
const branchRegistry: BranchModule[] = [
  {
    id: 'product_retail',
    trigger: (level2, answers) => ['retail', 'wholesale', 'distribution'].includes(level2),
    title: 'Inventory & Operations Deep-Dive',
    questions: [...],
    skipLogic: (answers) => answers.inventoryProfile === 'service_business' 
      ? ['inventory_turnover', 'shrinkage'] 
      : []
  },
  // ... more branches
];
```

### API Endpoints
- `POST /api/valuation-partial` — Partial scoring
- `POST /api/valuation-final` — Final submission
- `GET /api/branches/:id/questions` — Get branch questions

---

## 12. DECISIONS LOG

| Question | Decision | Date |
|----------|----------|------|
| Preliminary Range Calculation | **Lightweight engine** with conservative assumptions | Mar 17 |
| Branch Trigger | **Auto-detect** from Level 2 answer | Mar 17 |
| Results Timing | **5 minutes** (compromise between immediate and 30-60 min) | Mar 17 |
| Question Count Display | **~32** approximate format | Mar 17 |

### Lightweight Engine Specification
The preliminary range calculator uses:
- Industry multiple range from policy registry (low/mid/high)
- Revenue input only (no profit normalization yet)
- Conservative discount: apply 20% discount to low end, 20% premium to high end
- No qualitative adjustments (those come later)
- Simple formula: `range = revenue × industry_multiple × [0.8, 1.2]`

### Auto-Detect Logic
```typescript
const branchDetector = (answers: AnchorAnswers): BranchId[] => {
  const branchMap: Record<string, BranchId[]> = {
    'retail_physical': ['product_retail'],
    'retail_ecommerce': ['product_retail'],
    'manufacturing': ['manufacturing'],
    'consulting': ['professional_services'],
    // ... etc
  };
  return branchMap[answers.level2] || ['generic'];
};
```

### Results Timing
- Preliminary range: Immediate (after anchor)
- Final report: 5 minutes after completion
- Email sent with PDF report
- On-screen: "Your detailed report is being prepared. Check your email in ~5 minutes."

---

## 13. SUCCESS METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Completion Rate | TBD | +30% |
| Time to Complete | TBD | < 15 min |
| Abandonment @ Q10 | TBD | < 20% |
| User Confidence Score | N/A | > 4.0/5 |
| Range Tightening | N/A | 50%+ reduction |

---

## 14. APPENDIX

### A. Nimbo.net Reference
- ~30 questions average
- 20 minutes completion time
- One question per screen
- No registration required (email at end)
- Results in 30-60 minutes
- Industry-specific paths
- Free basic / paid detailed report

### B. Glossary
- **Anchor Questions:** Universal first 10 questions
- **Branch Module:** Business model-specific question set
- **Confidence Score:** 0-100 measure of estimate reliability
- **Valuation Ladder:** The tightening range as users progress
- **Stacked Branches:** Multiple branch modules for hybrid businesses

---

**Document Owner:** @adeolunathan  
**Reviewers:** Engineering, Design, Product  
**Next Review:** Post-Phase 1
