import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, Database, FileBarChart2, Link2, RefreshCcw, Save, Search } from 'lucide-react';
import { Button } from './components/ui/button';
import rawBenchmarkData from './valuation-engine/benchmark-data.json';
import rawCalibrationTable from './valuation-engine/calibration-table.json';
import rawOwnerFixtures from './valuation-engine/owner-test-fixtures.json';
import rawOwnerFixturesExtended from './valuation-engine/owner-test-fixtures-extended.json';
import { policyRegistry } from './valuation-engine/policy-registry';

const LOCAL_VALUATION_API = 'http://localhost:8788/api/valuation';
const LOCAL_OBSERVATIONS_API = 'http://localhost:8788/api/admin/internal-observations';
const LOCAL_INGEST_API = 'http://localhost:8788/api/admin/internal-observations';
const LOCAL_CASE_CANDIDATES_API = 'http://localhost:8788/api/admin/submissions';
const TODAY = new Date().toISOString().slice(0, 10);
const ownerFixtures = [...rawOwnerFixtures.fixtures, ...rawOwnerFixturesExtended.fixtures];

type BenchmarkSet = (typeof rawBenchmarkData.benchmarkSets)[number];
type CalibrationEntry = (typeof rawCalibrationTable.policyGroups)[keyof typeof rawCalibrationTable.policyGroups];
type SourceReference = {
  id: string;
  label: string;
  url?: string;
  sourceType: string;
  publishedAt?: string;
  lastVerifiedAt?: string;
};
type PolicyGroupEntry = {
  id: string;
  label: string;
  calibration: CalibrationEntry | undefined;
  benchmarkSets: BenchmarkSet[];
  observationCount: number;
  freshnessStatus: FreshnessStatus;
};
type FixtureRunSummary = {
  fixtureId: string;
  businessName: string;
  policyGroupId: string;
  primaryMethod: string;
  adjustedValue: number;
  readinessScore: number;
  confidenceScore: number;
  warnings: string[];
  failures: string[];
};

type InternalCaseCandidate = {
  id: string;
  sourceSubmissionTimestamp: string;
  sourceSubmissionId: string;
  businessName: string;
  suggestedCompanyAlias: string;
  firstName: string;
  email: string;
  policyGroupId: string;
  level1?: string;
  level2?: string;
  primaryState?: string;
  suggestedCaseType: 'sell_side_mandate' | 'valuation_review' | 'buyer_screen' | 'diligence_support' | 'market_scan' | 'other';
  suggestedTransactionContext: 'full_sale' | 'partial_sale' | 'fundraise' | 'internal_planning' | 'succession' | 'other';
  suggestedCaseStage: 'intake' | 'analysis' | 'marketed' | 'indication_received' | 'closed' | 'lost' | 'on_hold';
  candidateNotes: string[];
};

type InternalObservationRecord = {
  id: string;
  caseId: string;
  companyAlias?: string;
  caseType: 'sell_side_mandate' | 'valuation_review' | 'buyer_screen' | 'diligence_support' | 'market_scan' | 'other';
  caseStage: 'intake' | 'analysis' | 'marketed' | 'indication_received' | 'closed' | 'lost' | 'on_hold';
  transactionContext: 'full_sale' | 'partial_sale' | 'fundraise' | 'internal_planning' | 'succession' | 'other';
  policyGroupId: string;
  level1?: string;
  level2?: string;
  primaryState?: string;
  metric: 'market_multiple' | 'capitalization_rate' | 'working_capital_pct' | 'marketability_factor';
  basis: string;
  value: number;
  sourceKind: 'transaction' | 'private_observation' | 'curated_secondary';
  sizeBand: string;
  quality: 'low' | 'medium' | 'high';
  observedAt: string;
  sourceName: string;
  sourceUrl?: string;
  sourceDate?: string;
  notes?: string;
  calibrationEligible: boolean;
  enteredBy?: string;
  sourceSubmissionId?: string;
  sourceSubmissionTimestamp?: string;
  approvalStatus: 'draft' | 'approved' | 'rejected';
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

type ObservationFormState = {
  caseId: string;
  companyAlias: string;
  caseType: InternalObservationRecord['caseType'];
  caseStage: InternalObservationRecord['caseStage'];
  transactionContext: InternalObservationRecord['transactionContext'];
  policyGroupId: string;
  level1: string;
  level2: string;
  primaryState: string;
  metric: InternalObservationRecord['metric'];
  basis: string;
  value: string;
  sourceKind: InternalObservationRecord['sourceKind'];
  sizeBand: string;
  quality: InternalObservationRecord['quality'];
  observedAt: string;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
  notes: string;
  calibrationEligible: boolean;
  enteredBy: string;
  sourceSubmissionId: string;
  sourceSubmissionTimestamp: string;
  approvalStatus: InternalObservationRecord['approvalStatus'];
  approvalNotes: string;
  approvedBy: string;
};

type FreshnessStatus = 'fresh' | 'aging' | 'stale';

const benchmarkSetsByPolicyGroup = rawBenchmarkData.benchmarkSets.reduce<Record<string, BenchmarkSet[]>>((acc, benchmarkSet) => {
  if (!acc[benchmarkSet.policyGroupId]) {
    acc[benchmarkSet.policyGroupId] = [];
  }

  acc[benchmarkSet.policyGroupId].push(benchmarkSet);
  return acc;
}, {});

function parseDate(dateValue?: string) {
  if (!dateValue) return null;
  const parsed = Date.parse(dateValue);
  return Number.isNaN(parsed) ? null : parsed;
}

function getAgeDays(dateValue?: string) {
  const parsed = parseDate(dateValue);
  if (!parsed) return null;

  return Math.max(0, Math.round((Date.now() - parsed) / 86400000));
}

function getFreshnessStatus(dateValue?: string): FreshnessStatus {
  const ageDays = getAgeDays(dateValue);
  if (ageDays === null) return 'stale';
  if (ageDays <= 120) return 'fresh';
  if (ageDays <= 240) return 'aging';
  return 'stale';
}

function getFreshnessMeta(status: FreshnessStatus) {
  if (status === 'fresh') {
    return {
      label: 'Fresh',
      chip: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
      tone: 'text-emerald-300',
    };
  }

  if (status === 'aging') {
    return {
      label: 'Aging',
      chip: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
      tone: 'text-amber-200',
    };
  }

  return {
    label: 'Stale',
    chip: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
    tone: 'text-rose-200',
  };
}

function getLatestVerificationDate(benchmarkSet: BenchmarkSet) {
  const dates = [benchmarkSet.asOfDate, ...(benchmarkSet.sourceReferences || []).map((reference) => reference.lastVerifiedAt)].filter(Boolean);
  return dates.sort().at(-1);
}

function getWorstFreshnessStatus(benchmarkSets: BenchmarkSet[]) {
  const statuses = benchmarkSets.map((benchmarkSet) => getFreshnessStatus(getLatestVerificationDate(benchmarkSet)));
  if (statuses.includes('stale')) return 'stale';
  if (statuses.includes('aging')) return 'aging';
  return 'fresh';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: 4,
  }).format(value);
}

function getObservationSourceReferenceId(observation: BenchmarkSet['observations'][number]) {
  return 'sourceReferenceId' in observation ? observation.sourceReferenceId : undefined;
}

function toSourceReference(reference: NonNullable<BenchmarkSet['sourceReferences']>[number]): SourceReference {
  const partialReference = reference as {
    url?: string;
    publishedAt?: string;
  };

  return {
    id: reference.id,
    label: reference.label,
    url: partialReference.url,
    sourceType: reference.sourceType,
    publishedAt: partialReference.publishedAt,
    lastVerifiedAt: reference.lastVerifiedAt,
  };
}

function createInitialFormState(defaultPolicyGroupId: string): ObservationFormState {
  return {
    caseId: '',
    companyAlias: '',
    caseType: 'valuation_review',
    caseStage: 'analysis',
    transactionContext: 'other',
    policyGroupId: defaultPolicyGroupId,
    level1: '',
    level2: '',
    primaryState: '',
    metric: 'market_multiple',
    basis: 'revenue',
    value: '',
    sourceKind: 'transaction',
    sizeBand: 'sub_1bn_revenue',
    quality: 'medium',
    observedAt: TODAY,
    sourceName: '',
    sourceUrl: '',
    sourceDate: '',
    notes: '',
    calibrationEligible: true,
    enteredBy: '',
    sourceSubmissionId: '',
    sourceSubmissionTimestamp: '',
    approvalStatus: 'draft',
    approvalNotes: '',
    approvedBy: '',
  };
}

const policyGroupEntries: PolicyGroupEntry[] = Object.values(policyRegistry.policyGroups)
  .map((policyGroup) => {
    const calibration = rawCalibrationTable.policyGroups[policyGroup.id as keyof typeof rawCalibrationTable.policyGroups] as
      | CalibrationEntry
      | undefined;
    const benchmarkSets = benchmarkSetsByPolicyGroup[policyGroup.id] || [];
    const freshnessStatus: FreshnessStatus = benchmarkSets.length ? getWorstFreshnessStatus(benchmarkSets) : 'stale';

    return {
      id: policyGroup.id,
      label: policyGroup.label,
      calibration,
      benchmarkSets,
      observationCount: benchmarkSets.reduce((sum, benchmarkSet) => sum + benchmarkSet.observations.length, 0),
      freshnessStatus,
    };
  })
  .sort((left, right) => left.label.localeCompare(right.label));

function evaluateFixtureExpectations(result: any, expectations: Record<string, unknown> = {}) {
  const failures: string[] = [];

  if (typeof expectations.policyGroupId === 'string' && result.classification.policyGroupId !== expectations.policyGroupId) {
    failures.push(`Expected policy group ${expectations.policyGroupId}, got ${result.classification.policyGroupId}`);
  }

  if (typeof expectations.primaryMethod === 'string' && result.selectedMethods.primaryMethod !== expectations.primaryMethod) {
    failures.push(`Expected primary method ${expectations.primaryMethod}, got ${result.selectedMethods.primaryMethod}`);
  }

  if (typeof expectations.minConfidenceScore === 'number' && result.summary.confidenceScore < expectations.minConfidenceScore) {
    failures.push(`Expected confidence >= ${expectations.minConfidenceScore}, got ${result.summary.confidenceScore}`);
  }

  if (typeof expectations.maxConfidenceScore === 'number' && result.summary.confidenceScore > expectations.maxConfidenceScore) {
    failures.push(`Expected confidence <= ${expectations.maxConfidenceScore}, got ${result.summary.confidenceScore}`);
  }

  if (typeof expectations.minReadinessScore === 'number' && result.summary.readinessScore < expectations.minReadinessScore) {
    failures.push(`Expected readiness >= ${expectations.minReadinessScore}, got ${result.summary.readinessScore}`);
  }

  if (typeof expectations.maxReadinessScore === 'number' && result.summary.readinessScore > expectations.maxReadinessScore) {
    failures.push(`Expected readiness <= ${expectations.maxReadinessScore}, got ${result.summary.readinessScore}`);
  }

  return failures;
}

export function V2AdminPage() {
  const [query, setQuery] = useState('');
  const [internalObservations, setInternalObservations] = useState<InternalObservationRecord[]>([]);
  const [caseCandidates, setCaseCandidates] = useState<InternalCaseCandidate[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(true);
  const [observationsError, setObservationsError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ingestRunning, setIngestRunning] = useState(false);
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const [fixtureId, setFixtureId] = useState(ownerFixtures[0]?.id || '');
  const [fixtureRunning, setFixtureRunning] = useState(false);
  const [fixtureError, setFixtureError] = useState('');
  const [fixtureResult, setFixtureResult] = useState<FixtureRunSummary | null>(null);

  const filteredPolicyGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return policyGroupEntries;
    }

    return policyGroupEntries.filter((policyGroup) => `${policyGroup.id} ${policyGroup.label}`.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const [selectedPolicyGroupId, setSelectedPolicyGroupId] = useState(filteredPolicyGroups[0]?.id ?? policyGroupEntries[0]?.id ?? '');

  const selectedPolicyGroup =
    filteredPolicyGroups.find((policyGroup) => policyGroup.id === selectedPolicyGroupId) ||
    policyGroupEntries.find((policyGroup) => policyGroup.id === selectedPolicyGroupId) ||
    filteredPolicyGroups[0];

  const [formState, setFormState] = useState<ObservationFormState>(() => createInitialFormState(selectedPolicyGroupId));

  useEffect(() => {
    if (!formState.policyGroupId && selectedPolicyGroup?.id) {
      setFormState((current) => ({ ...current, policyGroupId: selectedPolicyGroup.id }));
    }
  }, [formState.policyGroupId, selectedPolicyGroup?.id]);

  async function loadInternalObservations() {
    setObservationsLoading(true);
    setObservationsError('');

    try {
      const response = await fetch(LOCAL_OBSERVATIONS_API);
      const payload = (await response.json()) as { status: string; data?: InternalObservationRecord[]; message?: string };
      if (!response.ok || payload.status !== 'success' || !payload.data) {
        throw new Error(payload.message || 'Could not load internal observations.');
      }

      setInternalObservations(payload.data);
    } catch (error) {
      setObservationsError(error instanceof Error ? error.message : 'Could not load internal observations.');
    } finally {
      setObservationsLoading(false);
    }
  }

  async function loadInternalCaseCandidates() {
    try {
      const response = await fetch(LOCAL_CASE_CANDIDATES_API);
      const payload = (await response.json()) as { status: string; data?: InternalCaseCandidate[]; message?: string };
      if (!response.ok || payload.status !== 'success' || !payload.data) {
        throw new Error(payload.message || 'Could not load internal case candidates.');
      }

      setCaseCandidates(payload.data);
    } catch (error) {
      setObservationsError(error instanceof Error ? error.message : 'Could not load internal case candidates.');
    }
  }

  useEffect(() => {
    void loadInternalObservations();
    void loadInternalCaseCandidates();
  }, []);

  const selectedPolicyGroupInternalObservations = internalObservations.filter(
    (observation) => observation.policyGroupId === selectedPolicyGroup?.id
  );
  const selectedFixture = ownerFixtures.find((fixture) => fixture.id === fixtureId) || ownerFixtures[0];

  const eligibleObservationCount = internalObservations.filter(
    (observation) => observation.calibrationEligible && observation.approvalStatus === 'approved'
  ).length;
  const selectedGroupFreshness = selectedPolicyGroup
    ? getFreshnessMeta(selectedPolicyGroup.freshnessStatus as FreshnessStatus)
    : getFreshnessMeta('stale');

  function startEditingObservation(observation: InternalObservationRecord) {
    setEditingObservationId(observation.id);
    setFormState({
      caseId: observation.caseId,
      companyAlias: observation.companyAlias || '',
      caseType: observation.caseType,
      caseStage: observation.caseStage,
      transactionContext: observation.transactionContext,
      policyGroupId: observation.policyGroupId,
      level1: observation.level1 || '',
      level2: observation.level2 || '',
      primaryState: observation.primaryState || '',
      metric: observation.metric,
      basis: observation.basis,
      value: String(observation.value),
      sourceKind: observation.sourceKind,
      sizeBand: observation.sizeBand,
      quality: observation.quality,
      observedAt: observation.observedAt,
      sourceName: observation.sourceName,
      sourceUrl: observation.sourceUrl || '',
      sourceDate: observation.sourceDate || '',
      notes: observation.notes || '',
      calibrationEligible: observation.calibrationEligible,
      enteredBy: observation.enteredBy || '',
      sourceSubmissionId: observation.sourceSubmissionId || '',
      sourceSubmissionTimestamp: observation.sourceSubmissionTimestamp || '',
      approvalStatus: observation.approvalStatus,
      approvalNotes: observation.approvalNotes || '',
      approvedBy: observation.approvedBy || '',
    });
    setSubmitError('');
    setSubmitMessage('');
  }

  function resetObservationForm(nextPolicyGroupId?: string) {
    setEditingObservationId(null);
    setFormState(createInitialFormState(nextPolicyGroupId || selectedPolicyGroup?.id || formState.policyGroupId));
  }

  function loadCandidateIntoForm(candidate: InternalCaseCandidate) {
    setEditingObservationId(null);
    setSelectedPolicyGroupId(candidate.policyGroupId);
    setFormState({
      ...createInitialFormState(candidate.policyGroupId),
      caseId: candidate.sourceSubmissionId.replace(/^owner-/, 'AFR-'),
      companyAlias: candidate.suggestedCompanyAlias,
      caseType: candidate.suggestedCaseType,
      caseStage: candidate.suggestedCaseStage,
      transactionContext: candidate.suggestedTransactionContext,
      policyGroupId: candidate.policyGroupId,
      level1: candidate.level1 || '',
      level2: candidate.level2 || '',
      primaryState: candidate.primaryState || '',
      sourceName: `Saved Afrexit submission: ${candidate.businessName}`,
      notes: candidate.candidateNotes.join(' '),
      enteredBy: candidate.firstName,
      sourceSubmissionId: candidate.sourceSubmissionId,
      sourceSubmissionTimestamp: candidate.sourceSubmissionTimestamp,
      calibrationEligible: false,
      approvalStatus: 'draft',
    });
    setSubmitMessage(`Loaded ${candidate.businessName} into the draft observation form. Verify metric, basis, and value before saving.`);
    setSubmitError('');
  }

  async function handleSubmitObservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const response = await fetch(editingObservationId ? `${LOCAL_OBSERVATIONS_API}/${editingObservationId}` : LOCAL_OBSERVATIONS_API, {
        method: editingObservationId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formState,
          value: Number(formState.value),
        }),
      });

      const payload = (await response.json()) as { status: string; data?: InternalObservationRecord; message?: string };

      if (!response.ok || payload.status !== 'success' || !payload.data) {
        throw new Error(payload.message || 'Could not capture the internal observation.');
      }

      setSubmitMessage(
        editingObservationId ? `Observation ${payload.data.caseId} updated locally.` : `Observation ${payload.data.caseId} captured locally.`
      );
      resetObservationForm(selectedPolicyGroup?.id || formState.policyGroupId);
      await loadInternalObservations();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not capture the internal observation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleIngestInternalObservations() {
    setIngestRunning(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const response = await fetch(LOCAL_INGEST_API, {
        method: 'POST',
      });

      const payload = (await response.json()) as { status: string; data?: { message?: string }; message?: string };
      if (!response.ok || payload.status !== 'success') {
        throw new Error(payload.message || 'Could not ingest internal observations.');
      }

      setSubmitMessage(payload.data?.message || 'Internal observations ingested into the benchmark layer.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not ingest internal observations.');
    } finally {
      setIngestRunning(false);
    }
  }

  async function handleUpdateObservation(id: string, patch: Partial<InternalObservationRecord>) {
    setSubmitError('');
    setSubmitMessage('');

    try {
      const response = await fetch(`${LOCAL_OBSERVATIONS_API}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as { status: string; data?: InternalObservationRecord; message?: string };
      if (!response.ok || payload.status !== 'success' || !payload.data) {
        throw new Error(payload.message || 'Could not update the internal observation.');
      }

      setSubmitMessage(`Observation ${payload.data.caseId} updated locally.`);
      await loadInternalObservations();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not update the internal observation.');
    }
  }

  async function handleDeleteObservation(id: string) {
    if (!window.confirm('Delete this internal observation? This removes it from the local store.')) {
      return;
    }

    setSubmitError('');
    setSubmitMessage('');

    try {
      const response = await fetch(`${LOCAL_OBSERVATIONS_API}/${id}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { status: string; data?: InternalObservationRecord; message?: string };
      if (!response.ok || payload.status !== 'success' || !payload.data) {
        throw new Error(payload.message || 'Could not delete the internal observation.');
      }

      if (editingObservationId === id) {
        resetObservationForm(selectedPolicyGroup?.id || formState.policyGroupId);
      }
      setSubmitMessage(`Observation ${payload.data.caseId} deleted locally.`);
      await loadInternalObservations();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not delete the internal observation.');
    }
  }

  async function handleRunFixture() {
    if (!selectedFixture) {
      setFixtureError('No fixture selected.');
      return;
    }

    setFixtureRunning(true);
    setFixtureError('');
    setFixtureResult(null);

    try {
      const response = await fetch(LOCAL_VALUATION_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedFixture.request),
      });

      const payload = (await response.json()) as { status: string; data?: any; message?: string };
      if (!response.ok || payload.status !== 'success' || !payload.data) {
        throw new Error(payload.message || 'Fixture run failed.');
      }

      const failures = evaluateFixtureExpectations(payload.data, selectedFixture.expectations);
      setFixtureResult({
        fixtureId: selectedFixture.id,
        businessName: payload.data.summary.businessName,
        policyGroupId: payload.data.classification.policyGroupId,
        primaryMethod: payload.data.selectedMethods.primaryMethod,
        adjustedValue: payload.data.summary.adjustedValue,
        readinessScore: payload.data.summary.readinessScore,
        confidenceScore: payload.data.summary.confidenceScore,
        warnings: payload.data.summary.warnings,
        failures,
      });
    } catch (error) {
      setFixtureError(error instanceof Error ? error.message : 'Fixture run failed.');
    } finally {
      setFixtureRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">Valuation Admin</div>
            <h1 className="text-4xl font-semibold tracking-tight">Benchmark and Calibration Review</h1>
            <p className="max-w-3xl text-base leading-7 text-slate-300">
              Local-only internal view for benchmark provenance, stale-data warnings, and the Afrexit internal observation workflow.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <a href="/admin-lab.html">Open admin lab</a>
            </Button>
            <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
              <a href="/">Return to main app</a>
            </Button>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
            <RefreshCcw className="h-4 w-4" />
            Regression fixtures
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.48fr_0.52fr]">
            <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <label className="grid gap-2 text-sm text-slate-300">
                Fixture
                <select
                  value={fixtureId}
                  onChange={(event) => setFixtureId(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                >
                  {ownerFixtures.map((fixture) => (
                    <option key={fixture.id} value={fixture.id} className="bg-slate-950">
                      {fixture.label}
                    </option>
                  ))}
                </select>
              </label>
              {selectedFixture ? (
                <div className="rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Fixture description</div>
                  <div className="mt-3">{selectedFixture.description}</div>
                  <div className="mt-3 text-xs text-slate-500">Fixture ID: {selectedFixture.id}</div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void handleRunFixture()} disabled={fixtureRunning} className="bg-white text-slate-950 hover:bg-slate-100">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {fixtureRunning ? 'Running fixture…' : 'Run selected fixture'}
                </Button>
                <div className="rounded-xl bg-slate-950/30 px-3 py-2 text-sm text-slate-400">
                  <code>npm run valuation:v2:fixtures</code>
                </div>
              </div>
              {fixtureError ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{fixtureError}</div> : null}
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest fixture result</div>
              {fixtureResult ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Business</div>
                      <div className="mt-2 text-sm font-medium text-white">{fixtureResult.businessName}</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Policy group</div>
                      <div className="mt-2 text-sm font-medium text-white">{fixtureResult.policyGroupId}</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Method</div>
                      <div className="mt-2 text-sm font-medium text-white">{fixtureResult.primaryMethod}</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Status</div>
                      <div className={`mt-2 text-sm font-medium ${fixtureResult.failures.length ? 'text-rose-200' : 'text-emerald-300'}`}>
                        {fixtureResult.failures.length ? 'Failed' : 'Passed'}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Adjusted value</div>
                      <div className="mt-2 text-xl font-semibold">₦{formatNumber(fixtureResult.adjustedValue)}</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Readiness</div>
                      <div className="mt-2 text-xl font-semibold">{fixtureResult.readinessScore}</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Confidence</div>
                      <div className="mt-2 text-xl font-semibold">{fixtureResult.confidenceScore}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Expectation check</div>
                    {fixtureResult.failures.length ? (
                      <ul className="mt-3 space-y-2">
                        {fixtureResult.failures.map((failure) => (
                          <li key={failure} className="rounded-xl bg-rose-500/10 px-3 py-2 text-rose-200">
                            {failure}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-emerald-200">Fixture passed all configured expectations.</div>
                    )}
                    {fixtureResult.warnings.length ? (
                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Warnings</div>
                        <ul className="mt-2 space-y-2">
                          {fixtureResult.warnings.map((warning) => (
                            <li key={warning} className="rounded-xl bg-slate-900/40 px-3 py-2 text-slate-300">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-500">
                  Run a fixture to validate the engine without filling the questionnaire.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
            <Database className="h-4 w-4" />
            Internal observation workflow
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
            <form onSubmit={handleSubmitObservation} className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-300">
                  Case ID
                  <input
                    value={formState.caseId}
                    onChange={(event) => setFormState((current) => ({ ...current, caseId: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="AFR-CASE-001"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Company alias
                  <input
                    value={formState.companyAlias}
                    onChange={(event) => setFormState((current) => ({ ...current, companyAlias: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="Anonymized business label"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Case type
                  <select
                    value={formState.caseType}
                    onChange={(event) => setFormState((current) => ({ ...current, caseType: event.target.value as ObservationFormState['caseType'] }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  >
                    <option value="sell_side_mandate" className="bg-slate-950">Sell-side mandate</option>
                    <option value="valuation_review" className="bg-slate-950">Valuation review</option>
                    <option value="buyer_screen" className="bg-slate-950">Buyer screen</option>
                    <option value="diligence_support" className="bg-slate-950">Diligence support</option>
                    <option value="market_scan" className="bg-slate-950">Market scan</option>
                    <option value="other" className="bg-slate-950">Other</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Case stage
                  <select
                    value={formState.caseStage}
                    onChange={(event) => setFormState((current) => ({ ...current, caseStage: event.target.value as ObservationFormState['caseStage'] }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  >
                    <option value="intake" className="bg-slate-950">Intake</option>
                    <option value="analysis" className="bg-slate-950">Analysis</option>
                    <option value="marketed" className="bg-slate-950">Marketed</option>
                    <option value="indication_received" className="bg-slate-950">Indication received</option>
                    <option value="closed" className="bg-slate-950">Closed</option>
                    <option value="lost" className="bg-slate-950">Lost</option>
                    <option value="on_hold" className="bg-slate-950">On hold</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Transaction context
                  <select
                    value={formState.transactionContext}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, transactionContext: event.target.value as ObservationFormState['transactionContext'] }))
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  >
                    <option value="full_sale" className="bg-slate-950">Full sale</option>
                    <option value="partial_sale" className="bg-slate-950">Partial sale</option>
                    <option value="fundraise" className="bg-slate-950">Fundraise</option>
                    <option value="internal_planning" className="bg-slate-950">Internal planning</option>
                    <option value="succession" className="bg-slate-950">Succession</option>
                    <option value="other" className="bg-slate-950">Other</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Policy group
                  <select
                    value={formState.policyGroupId}
                    onChange={(event) => setFormState((current) => ({ ...current, policyGroupId: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    required
                  >
                    {policyGroupEntries.map((policyGroup) => (
                      <option key={policyGroup.id} value={policyGroup.id} className="bg-slate-950">
                        {policyGroup.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Level 1
                  <input
                    value={formState.level1}
                    onChange={(event) => setFormState((current) => ({ ...current, level1: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="manufacturing / trade / software"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Level 2
                  <input
                    value={formState.level2}
                    onChange={(event) => setFormState((current) => ({ ...current, level2: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="food_beverage_manufacturing"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Primary state
                  <input
                    value={formState.primaryState}
                    onChange={(event) => setFormState((current) => ({ ...current, primaryState: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="lagos_mainland"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Metric
                  <select
                    value={formState.metric}
                    onChange={(event) => setFormState((current) => ({ ...current, metric: event.target.value as ObservationFormState['metric'] }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  >
                    <option value="market_multiple" className="bg-slate-950">Market multiple</option>
                    <option value="capitalization_rate" className="bg-slate-950">Capitalization rate</option>
                    <option value="working_capital_pct" className="bg-slate-950">Working capital %</option>
                    <option value="marketability_factor" className="bg-slate-950">Marketability factor</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Basis
                  <input
                    value={formState.basis}
                    onChange={(event) => setFormState((current) => ({ ...current, basis: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="revenue / sde / adjustedEbit"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Value
                  <input
                    type="number"
                    step="0.0001"
                    value={formState.value}
                    onChange={(event) => setFormState((current) => ({ ...current, value: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="2.75"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Source kind
                  <select
                    value={formState.sourceKind}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, sourceKind: event.target.value as ObservationFormState['sourceKind'] }))
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  >
                    <option value="transaction" className="bg-slate-950">Transaction</option>
                    <option value="private_observation" className="bg-slate-950">Private observation</option>
                    <option value="curated_secondary" className="bg-slate-950">Curated secondary</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Size band
                  <input
                    value={formState.sizeBand}
                    onChange={(event) => setFormState((current) => ({ ...current, sizeBand: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="sub_1bn_revenue"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Quality
                  <select
                    value={formState.quality}
                    onChange={(event) => setFormState((current) => ({ ...current, quality: event.target.value as ObservationFormState['quality'] }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  >
                    <option value="low" className="bg-slate-950">Low</option>
                    <option value="medium" className="bg-slate-950">Medium</option>
                    <option value="high" className="bg-slate-950">High</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Observed date
                  <input
                    type="date"
                    value={formState.observedAt}
                    onChange={(event) => setFormState((current) => ({ ...current, observedAt: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Source date
                  <input
                    type="date"
                    value={formState.sourceDate}
                    onChange={(event) => setFormState((current) => ({ ...current, sourceDate: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                  Source name
                  <input
                    value={formState.sourceName}
                    onChange={(event) => setFormState((current) => ({ ...current, sourceName: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="Afrexit sell-side review / mandate note"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Source submission ID
                  <input
                    value={formState.sourceSubmissionId}
                    onChange={(event) => setFormState((current) => ({ ...current, sourceSubmissionId: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="Saved-submission reference"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Source submission timestamp
                  <input
                    value={formState.sourceSubmissionTimestamp}
                    onChange={(event) => setFormState((current) => ({ ...current, sourceSubmissionTimestamp: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="2026-03-07T23:59:22.736Z"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                  Source URL
                  <input
                    value={formState.sourceUrl}
                    onChange={(event) => setFormState((current) => ({ ...current, sourceUrl: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="Optional public or internal link"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                  Notes
                  <textarea
                    value={formState.notes}
                    onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
                    className="min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="What makes this observation credible or relevant?"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                  Entered by
                  <input
                    value={formState.enteredBy}
                    onChange={(event) => setFormState((current) => ({ ...current, enteredBy: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="Nathan / analyst initials"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Approval status
                  <select
                    value={formState.approvalStatus}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        approvalStatus: event.target.value as InternalObservationRecord['approvalStatus'],
                      }))
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  >
                    <option value="draft" className="bg-slate-950">Draft</option>
                    <option value="approved" className="bg-slate-950">Approved</option>
                    <option value="rejected" className="bg-slate-950">Rejected</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Approved by
                  <input
                    value={formState.approvedBy}
                    onChange={(event) => setFormState((current) => ({ ...current, approvedBy: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="Reviewer initials"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                  Approval notes
                  <textarea
                    value={formState.approvalNotes}
                    onChange={(event) => setFormState((current) => ({ ...current, approvalNotes: event.target.value }))}
                    className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="Why this should stay draft, be approved, or be rejected"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={formState.calibrationEligible}
                  onChange={(event) => setFormState((current) => ({ ...current, calibrationEligible: event.target.checked }))}
                  className="h-4 w-4 rounded border border-white/20 bg-transparent"
                />
                Mark this observation as calibration-eligible
              </label>

              {(submitError || submitMessage) && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    submitError ? 'border border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  }`}
                >
                  {submitError || submitMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={submitting} className="bg-white text-slate-950 hover:bg-slate-100">
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? 'Saving…' : editingObservationId ? 'Save observation changes' : 'Capture internal observation'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleIngestInternalObservations()}
                  disabled={ingestRunning}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {ingestRunning ? 'Rebuilding…' : 'Ingest ready observations into benchmarks'}
                </Button>
                {editingObservationId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetObservationForm(selectedPolicyGroup?.id || formState.policyGroupId)}
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>

            <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-400">Captured observations</div>
                  <div className="mt-2 text-2xl font-semibold">{internalObservations.length}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-400">Ready for calibration</div>
                  <div className="mt-2 text-2xl font-semibold">{eligibleObservationCount}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-400">Selected group records</div>
                  <div className="mt-2 text-2xl font-semibold">{selectedPolicyGroupInternalObservations.length}</div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Workflow</div>
                <ul className="mt-3 space-y-2">
                  <li className="rounded-xl bg-slate-950/30 px-3 py-2">Capture a case observation locally from a mandate, review, or diligence note.</li>
                  <li className="rounded-xl bg-slate-950/30 px-3 py-2">Mark it calibration-eligible only when you are comfortable defending the number.</li>
                  <li className="rounded-xl bg-slate-950/30 px-3 py-2">Approve the observation before ingest; only approved and eligible observations feed calibration.</li>
                  <li className="rounded-xl bg-slate-950/30 px-3 py-2">Use edit/delete controls to keep the local observation store clean before it grows.</li>
                  <li className="rounded-xl bg-slate-950/30 px-3 py-2">Use “Ingest ready observations” to rebuild benchmark sets and calibration with Nigeria-native evidence.</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <FileBarChart2 className="h-4 w-4" />
                  Seed candidates from saved submissions
                </div>
                {caseCandidates.length ? (
                  <div className="space-y-3">
                    {caseCandidates.slice(0, 5).map((candidate) => (
                      <div key={candidate.id} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="font-medium text-white">{candidate.businessName}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {candidate.policyGroupId} {candidate.level2 ? `• ${candidate.level2}` : ''} {candidate.primaryState ? `• ${candidate.primaryState}` : ''}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">{candidate.sourceSubmissionTimestamp.slice(0, 10)}</div>
                        </div>
                        <ul className="mt-3 space-y-2">
                          {candidate.candidateNotes.map((note) => (
                            <li key={note} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-400">
                              {note}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => loadCandidateIntoForm(candidate)}
                            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                          >
                            Load into draft form
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-500">
                    No real saved-submission candidates were found yet. Test fixtures and `@example.com` submissions are excluded on purpose.
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Fallback commands</div>
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl bg-slate-950/30 px-3 py-2">
                    <code>npm run valuation:v2:fixtures</code>
                  </div>
                  <div className="rounded-xl bg-slate-950/30 px-3 py-2">
                    <code>node scripts/valuation-engine/refresh-private-market-benchmarks.mjs</code>
                  </div>
                  <div className="rounded-xl bg-slate-950/30 px-3 py-2">
                    <code>node scripts/valuation-engine/ingest-internal-observations.mjs</code>
                  </div>
                  <div className="rounded-xl bg-slate-950/30 px-3 py-2">
                    <code>node scripts/valuation-engine/calibration-maintenance.mjs rebuild</code>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  Recent internal observations
                </div>
                {observationsLoading ? <div className="text-sm text-slate-400">Loading local observations…</div> : null}
                {observationsError ? <div className="text-sm text-rose-200">{observationsError}</div> : null}
                {!observationsLoading && !observationsError ? (
                  <div className="space-y-3">
                    {selectedPolicyGroupInternalObservations.slice(0, 6).map((observation) => (
                      <div key={observation.id} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="font-medium text-white">
                              {observation.caseId}
                              {observation.companyAlias ? <span className="ml-2 text-slate-400">• {observation.companyAlias}</span> : null}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {observation.calibrationEligible ? 'Calibration-eligible' : 'Captured only'} • {observation.sourceName}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${
                                observation.approvalStatus === 'approved'
                                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                  : observation.approvalStatus === 'rejected'
                                    ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                                    : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                              }`}
                            >
                              {observation.approvalStatus}
                            </div>
                            <div className="text-xs text-slate-400">{observation.observedAt}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-slate-300">
                          {observation.metric} • {observation.basis} • {formatNumber(observation.value)} • {observation.sourceKind}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {observation.caseType} • {observation.caseStage} • {observation.transactionContext}
                          {observation.level2 ? ` • ${observation.level2}` : observation.level1 ? ` • ${observation.level1}` : ''}
                          {observation.primaryState ? ` • ${observation.primaryState}` : ''}
                        </div>
                        {observation.sourceSubmissionId ? (
                          <div className="mt-1 text-xs text-slate-500">
                            Seeded from submission {observation.sourceSubmissionId}
                            {observation.sourceSubmissionTimestamp ? ` • ${observation.sourceSubmissionTimestamp.slice(0, 10)}` : ''}
                          </div>
                        ) : null}
                        {observation.approvedBy || observation.approvedAt ? (
                          <div className="mt-1 text-xs text-slate-500">
                            {observation.approvedBy ? `Approved by ${observation.approvedBy}` : 'Approved'}{observation.approvedAt ? ` • ${observation.approvedAt.slice(0, 10)}` : ''}
                          </div>
                        ) : null}
                        {observation.approvalNotes ? (
                          <div className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-400">{observation.approvalNotes}</div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => startEditingObservation(observation)}
                            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                          >
                            Edit
                          </Button>
                          {observation.approvalStatus !== 'approved' ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                void handleUpdateObservation(observation.id, {
                                  approvalStatus: 'approved',
                                  approvedBy: formState.enteredBy || observation.enteredBy,
                                })
                              }
                              className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                            >
                              Approve
                            </Button>
                          ) : null}
                          {observation.approvalStatus !== 'rejected' ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void handleUpdateObservation(observation.id, { approvalStatus: 'rejected' })}
                              className="border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                            >
                              Reject
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleDeleteObservation(observation.id)}
                            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!selectedPolicyGroupInternalObservations.length ? (
                      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-500">
                        No internal observations captured yet for this policy group.
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
              <Search className="h-4 w-4" />
              Policy groups
            </div>
            <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search policy groups"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-3">
              {filteredPolicyGroups.map((policyGroup) => {
                const isSelected = policyGroup.id === selectedPolicyGroup?.id;
                const freshness = getFreshnessMeta(policyGroup.freshnessStatus as FreshnessStatus);

                return (
                  <button
                    key={policyGroup.id}
                    type="button"
                    onClick={() => {
                      setSelectedPolicyGroupId(policyGroup.id);
                      setFormState((current) => ({ ...current, policyGroupId: policyGroup.id }));
                    }}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isSelected ? 'border-blue-400/40 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">{policyGroup.label}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{policyGroup.id}</div>
                      </div>
                      <div className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${freshness.chip}`}>
                        {freshness.label}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>Evidence: {policyGroup.calibration?.evidenceScore ?? 'N/A'}</div>
                      <div>Obs: {policyGroup.observationCount}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {selectedPolicyGroup ? (
            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="mb-5 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                  <Database className="h-4 w-4" />
                  Calibration summary
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-sm text-slate-400">Evidence score</div>
                    <div className="mt-2 text-xl font-semibold">{selectedPolicyGroup.calibration?.evidenceScore ?? 'N/A'}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-sm text-slate-400">Benchmark sets</div>
                    <div className="mt-2 text-xl font-semibold">{selectedPolicyGroup.benchmarkSets.length}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-sm text-slate-400">Observations</div>
                    <div className="mt-2 text-xl font-semibold">{selectedPolicyGroup.observationCount}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-sm text-slate-400">Last calibrated</div>
                    <div className="mt-2 text-xl font-semibold">{selectedPolicyGroup.calibration?.lastCalibrated ?? 'N/A'}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-sm text-slate-400">Freshness</div>
                    <div className={`mt-2 text-xl font-semibold ${selectedGroupFreshness.tone}`}>{selectedGroupFreshness.label}</div>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Calibration notes</div>
                    <ul className="mt-3 space-y-2">
                      {(selectedPolicyGroup.calibration?.notes || []).map((note: string) => (
                        <li key={note} className="rounded-xl bg-slate-950/30 px-3 py-2">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Aging warnings</div>
                    <div className="mt-3 space-y-3">
                      {selectedPolicyGroup.benchmarkSets.map((benchmarkSet) => {
                        const latestVerificationDate = getLatestVerificationDate(benchmarkSet);
                        const status = getFreshnessMeta(getFreshnessStatus(latestVerificationDate));
                        const ageDays = getAgeDays(latestVerificationDate);

                        return (
                          <div key={benchmarkSet.id} className="rounded-xl bg-slate-950/30 px-3 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-medium text-white">{benchmarkSet.label}</div>
                              <div className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${status.chip}`}>
                                {status.label}
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-400">
                              Latest verification: {latestVerificationDate || 'Unknown'}{typeof ageDays === 'number' ? ` • ${ageDays} days old` : ''}
                            </div>
                            {status.label !== 'Fresh' ? (
                              <div className="mt-2 flex items-center gap-2 text-xs text-amber-200">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Refresh this set before leaning heavily on it in owner mode.
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {selectedPolicyGroup.benchmarkSets.map((benchmarkSet: BenchmarkSet) => {
                const latestVerificationDate = getLatestVerificationDate(benchmarkSet);
                const freshness = getFreshnessMeta(getFreshnessStatus(latestVerificationDate));
                const ageDays = getAgeDays(latestVerificationDate);

                return (
                  <section key={benchmarkSet.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-5 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                      <FileBarChart2 className="h-4 w-4" />
                      {benchmarkSet.label}
                    </div>
                    <div className="grid gap-3 md:grid-cols-5">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-slate-400">Source mix</div>
                        <div className="mt-2 text-sm font-medium text-white">{benchmarkSet.sourceMix.join(', ')}</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-slate-400">As of date</div>
                        <div className="mt-2 text-sm font-medium text-white">{benchmarkSet.asOfDate}</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-slate-400">Freshness</div>
                        <div className={`mt-2 text-sm font-medium ${freshness.tone}`}>{freshness.label}</div>
                        <div className="mt-1 text-xs text-slate-500">{typeof ageDays === 'number' ? `${ageDays} days since verification` : 'Unknown age'}</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-slate-400">Geography</div>
                        <div className="mt-2 text-sm font-medium text-white">{benchmarkSet.geography}</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-slate-400">Observations</div>
                        <div className="mt-2 text-sm font-medium text-white">{benchmarkSet.observations.length}</div>
                      </div>
                    </div>
                    {benchmarkSet.sourceNotes?.length ? (
                      <div className="mt-5 rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Source notes</div>
                        <ul className="mt-3 space-y-2">
                          {benchmarkSet.sourceNotes.map((note) => (
                            <li key={note} className="rounded-xl bg-slate-950/30 px-3 py-2">
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {benchmarkSet.sourceReferences?.length ? (
                      <div className="mt-5 rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Source references</div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {benchmarkSet.sourceReferences.map((rawReference) => {
                            const reference = toSourceReference(rawReference);

                            return (
                            <div key={reference.id} className="rounded-xl bg-slate-950/30 px-3 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="font-medium text-white">{reference.label}</div>
                                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{reference.sourceType}</div>
                              </div>
                              {reference.url ? (
                                <div className="mt-2 flex items-center gap-2 text-xs text-blue-200">
                                  <Link2 className="h-3.5 w-3.5" />
                                  <a href={reference.url} target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-4">
                                    {reference.url}
                                  </a>
                                </div>
                              ) : null}
                              <div className="mt-2 text-xs text-slate-400">
                                {reference.publishedAt ? `Source date: ${reference.publishedAt}` : 'Source date not recorded'} •{' '}
                                {reference.lastVerifiedAt ? `Verified: ${reference.lastVerifiedAt}` : 'Verification date not recorded'}
                              </div>
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
                      <div className="grid min-w-[1080px] grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_1.2fr] gap-3 bg-white/5 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        <div>Metric</div>
                        <div>Basis</div>
                        <div>Value</div>
                        <div>Quality</div>
                        <div>Source kind</div>
                        <div>Date</div>
                        <div>Reference</div>
                      </div>
                      {benchmarkSet.observations.map((observation) => {
                        const sourceReferenceId = getObservationSourceReferenceId(observation);
                        const reference = benchmarkSet.sourceReferences?.find((item) => item.id === sourceReferenceId);

                        return (
                          <div
                            key={observation.id}
                            className="grid min-w-[1080px] grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_1.2fr] gap-3 border-t border-white/10 px-4 py-4 text-sm text-slate-200"
                          >
                            <div>{observation.metric}</div>
                            <div>{observation.basis}</div>
                            <div>{formatNumber(observation.value)}</div>
                            <div>{observation.quality}</div>
                            <div>{observation.sourceKind}</div>
                            <div>{observation.observedAt}</div>
                            <div className="text-slate-400">{reference?.label || sourceReferenceId || 'Direct set source'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
