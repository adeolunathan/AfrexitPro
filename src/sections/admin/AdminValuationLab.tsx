import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2, LogOut, RefreshCcw, Save, WandSparkles } from 'lucide-react';
import { listAdminScenarios, listAdminSubmissions, createAdminScenario, runAdminSensitivity, runAdminValuation, updateAdminScenario, type AdminScenarioRecord, type AdminSubmissionRecord, type SensitivityRow } from '@/api/admin';
import { anchorQuestions, getVisibleClosingQuestions, level2ByLevel1, type Question } from '@/data/adaptive-question-bank';
import { detectBranches, getBranchQuestions, type BranchQuestion } from '@/data/branch-modules';
import { OptionListInput } from '@/components/OptionListInput';
import { QuestionHelpTooltip } from '@/components/QuestionHelpTooltip';
import { CurrencyInput } from '@/components/CurrencyInput';
import { FinancialSpreadsheet, buildFinancialPeriodsFromAnswers, getFinancialPeriodById, type FinancialPeriod } from '@/components/FinancialSpreadsheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { buildOwnerAnswersFromRequest, buildOwnerValuationRequest, type OwnerFieldId } from '@/valuation-engine/owner-intake';
import type { FormData } from '@/types/valuation';
import type { ResultData } from '@/types/valuation';
import { resolveQuestionCopy } from '@/lib/adaptive-question-copy';

type QuestionLike = Question | BranchQuestion;
type BaselineOption =
  | { key: ''; label: string; kind: 'blank'; submission?: undefined; scenario?: undefined }
  | { key: string; label: string; kind: 'submission'; submission: AdminSubmissionRecord; scenario?: undefined }
  | { key: string; label: string; kind: 'scenario'; scenario: AdminScenarioRecord; submission?: undefined };

const EMPTY_ANSWERS: FormData = {
  respondentRole: 'owner',
  termsAccepted: true,
  newsletterOptIn: false,
};

const NON_SENSITIVITY_FIELDS = new Set<OwnerFieldId>([
  'level1',
  'level2',
  'respondentRole',
  'businessDescription',
  'businessName',
  'firstName',
  'lastName',
  'email',
  'whatsapp',
  'termsAccepted',
  'newsletterOptIn',
]);

const SENSITIVITY_METRICS = [
  { value: 'summary.adjustedValue', label: 'Adjusted value' },
  { value: 'summary.lowEstimate', label: 'Low estimate' },
  { value: 'summary.highEstimate', label: 'High estimate' },
  { value: 'summary.readinessScore', label: 'Readiness score' },
  { value: 'summary.confidenceScore', label: 'Confidence score' },
  { value: 'summary.scorecard.marketPosition', label: 'Market-position score' },
  { value: 'summary.scorecard.financialQuality', label: 'Financial-quality score' },
  { value: 'summary.scorecard.ownerIndependence', label: 'Owner-independence score' },
  { value: 'summary.scorecard.revenueQuality', label: 'Revenue-quality score' },
  { value: 'summary.scorecard.operatingResilience', label: 'Operating-resilience score' },
  { value: 'audit.qualitativeAdjustments.geographyAdjustmentFactor', label: 'Geography factor' },
  { value: 'audit.qualitativeAdjustments.branchQualityFactor', label: 'Branch-quality factor' },
] as const;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function formatMillions(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}m`;
}

function formatDelta(value: number) {
  if (!Number.isFinite(value) || value === 0) return '0';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeAnswers(value: FormData | null | undefined): FormData {
  return {
    ...EMPTY_ANSWERS,
    ...(value || {}),
  };
}

function extractBaselineAnswers(entry: AdminSubmissionRecord | AdminScenarioRecord | null): FormData {
  if (!entry) {
    return deepClone(EMPTY_ANSWERS);
  }

  if (entry.answersSnapshot) {
    return normalizeAnswers(entry.answersSnapshot);
  }

  if (entry.requestSnapshot) {
    return normalizeAnswers(buildOwnerAnswersFromRequest(entry.requestSnapshot));
  }

  return deepClone(EMPTY_ANSWERS);
}

function buildQuestionSections(answers: FormData): Array<{ id: string; title: string; description?: string; questions: QuestionLike[] }> {
  const level2 = String(answers.level2 || '');
  const branches = detectBranches(level2, answers);

  return [
    {
      id: 'anchor',
      title: 'Anchor Questions',
      description: 'Classification, financial history, and market context.',
      questions: anchorQuestions,
    },
    ...branches.map((branch) => ({
      id: branch.id,
      title: branch.title,
      description: branch.description,
      questions: getBranchQuestions(branch, answers),
    })),
    {
      id: 'closing',
      title: 'Closing Questions',
      description: 'Records, readiness, working capital, normalization, and contact details.',
      questions: getVisibleClosingQuestions(answers),
    },
  ];
}

function getQuestionOptions(question: QuestionLike, answers: FormData) {
  if (question.id === 'level2') {
    return level2ByLevel1[String(answers.level1 || '')] || [];
  }

  return question.options || [];
}

function isMonetaryQuestion(question: QuestionLike) {
  return question.type === 'currency' || question.type === 'number';
}

function getSensitivityQuestions(answers: FormData) {
  const activeBranches = detectBranches(String(answers.level2 || ''), answers);
  const allQuestions = [
    ...anchorQuestions,
    ...getVisibleClosingQuestions(answers),
    ...activeBranches.flatMap((branch) => getBranchQuestions(branch, answers)),
  ];

  return allQuestions.filter((question) => {
    if (NON_SENSITIVITY_FIELDS.has(question.id)) return false;
    return getQuestionOptions(question, answers).length > 1;
  });
}

function applyFinancialPeriods(answers: FormData, periods: FinancialPeriod[]): FormData {
  const latest = getFinancialPeriodById(periods, 'latest');
  const prior1 = getFinancialPeriodById(periods, 'prior1');
  const prior2 = getFinancialPeriodById(periods, 'prior2');

  return {
    ...answers,
    _financialPeriods: periods,
    revenueLatest: latest.revenue,
    operatingProfitLatest: latest.operatingProfit,
    revenuePrevious1: prior1.enabled ? prior1.revenue : '',
    operatingProfitPrevious1: prior1.enabled ? prior1.operatingProfit : '',
    revenuePrevious2: prior2.enabled ? prior2.revenue : '',
    operatingProfitPrevious2: prior2.enabled ? prior2.operatingProfit : '',
  };
}

function getMetricValue(row: SensitivityRow) {
  if (typeof row.metricValue === 'number') {
    return row.metricValue;
  }

  const numeric = Number(row.metricValue);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function isMonotonic(rows: SensitivityRow[], direction: 'asc' | 'desc') {
  const values = rows.map(getMetricValue);
  if (values.some((value) => !Number.isFinite(value))) {
    return false;
  }

  for (let index = 1; index < values.length; index += 1) {
    if (direction === 'asc' && values[index] < values[index - 1]) return false;
    if (direction === 'desc' && values[index] > values[index - 1]) return false;
  }

  return true;
}

function SummaryDeltaCard({
  label,
  baseline,
  current,
  money = false,
}: {
  label: string;
  baseline: number | undefined;
  current: number | undefined;
  money?: boolean;
}) {
  const baselineValue = baseline ?? 0;
  const currentValue = current ?? 0;
  const delta = currentValue - baselineValue;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-3 grid gap-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Baseline</span>
          <span className="font-semibold text-slate-800">{money ? formatMillions(baseline) : baselineValue.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Current</span>
          <span className="font-semibold text-slate-900">{money ? formatMillions(current) : currentValue.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Delta</span>
          <span className={`font-semibold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
            {money ? (delta === 0 ? '₦0m' : `${delta > 0 ? '+' : '-'}${formatMillions(Math.abs(delta))}`) : formatDelta(delta)}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuestionEditor({
  question,
  answers,
  onChange,
}: {
  question: QuestionLike;
  answers: FormData;
  onChange: (next: FormData) => void;
}) {
  const respondentRole = answers.respondentRole;
  const resolvedCopy = resolveQuestionCopy(question, respondentRole);
  const options = getQuestionOptions({ ...question, options: resolvedCopy.options } as QuestionLike, answers);
  const currentValue = answers[question.id];

  const updateValue = (value: string | boolean) => {
    onChange({
      ...answers,
      [question.id]: value,
    });
  };

  if (question.type === 'financial_table') {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <h3 className="text-xl font-semibold text-slate-950">{resolvedCopy.prompt}</h3>
          </div>
          {resolvedCopy.helperText ? <p className="text-sm leading-6 text-slate-500">{resolvedCopy.helperText}</p> : null}
        </div>
        <FinancialSpreadsheet
          periods={buildFinancialPeriodsFromAnswers(answers)}
          onChange={(periods) => onChange(applyFinancialPeriods(answers, periods))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <h3 className="text-base font-semibold leading-7 text-slate-950">{resolvedCopy.prompt}</h3>
          {resolvedCopy.tooltipText ? <QuestionHelpTooltip content={resolvedCopy.tooltipText} /> : null}
        </div>
        {resolvedCopy.helperText ? <p className="text-sm leading-6 text-slate-500">{resolvedCopy.helperText}</p> : null}
      </div>

      {question.type === 'select' ? (
        <OptionListInput options={options} value={String(currentValue || '')} onChange={(value) => updateValue(value)} />
      ) : null}

      {question.type === 'textarea' ? (
        <Textarea
          value={String(currentValue || '')}
          onChange={(event) => updateValue(event.target.value)}
          placeholder={question.placeholder}
          className="min-h-28"
        />
      ) : null}

      {(question.type === 'text' || question.type === 'email' || question.type === 'tel') ? (
        <Input
          type={question.type === 'text' ? 'text' : question.type}
          value={String(currentValue || '')}
          onChange={(event) => updateValue(event.target.value)}
          placeholder={question.placeholder}
          className="h-11"
        />
      ) : null}

      {isMonetaryQuestion(question) ? (
        <CurrencyInput
          value={String(currentValue || '')}
          onChange={(value) => updateValue(value)}
          placeholder="0"
          min={0}
        />
      ) : null}

      {question.type === 'checkbox' ? (
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Checkbox
            checked={Boolean(currentValue)}
            onCheckedChange={(checked) => updateValue(checked === true)}
            className="mt-1"
          />
          <span className="text-sm leading-6 text-slate-700">{resolvedCopy.prompt}</span>
        </label>
      ) : null}
    </div>
  );
}

export function AdminValuationLab({
  session,
  onSignOut,
}: {
  session: Session;
  onSignOut: () => Promise<void>;
}) {
  const accessToken = session.access_token;
  const [submissions, setSubmissions] = useState<AdminSubmissionRecord[]>([]);
  const [scenarios, setScenarios] = useState<AdminScenarioRecord[]>([]);
  const [selectedBaselineKey, setSelectedBaselineKey] = useState('');
  const [draftAnswers, setDraftAnswers] = useState<FormData>(deepClone(EMPTY_ANSWERS));
  const [baselineResult, setBaselineResult] = useState<ResultData | null>(null);
  const [currentResult, setCurrentResult] = useState<ResultData | null>(null);
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('scenario');
  const [selectedSensitivityQuestionId, setSelectedSensitivityQuestionId] = useState<OwnerFieldId | ''>('');
  const [selectedSensitivityValues, setSelectedSensitivityValues] = useState<string[]>([]);
  const [sensitivityMetricPath, setSensitivityMetricPath] = useState<string>('summary.adjustedValue');
  const [sensitivityDirection, setSensitivityDirection] = useState<'asc' | 'desc' | ''>('');
  const [sensitivityRows, setSensitivityRows] = useState<SensitivityRow[]>([]);
  const [sensitivityRunning, setSensitivityRunning] = useState(false);

  const baselineOptions = useMemo<BaselineOption[]>(() => {
    return [
      { key: '', label: 'Blank admin scenario', kind: 'blank' },
      ...submissions.map((submission) => ({
        key: `submission:${submission.id}`,
        label: `${submission.businessName} · ${submission.createdAt.slice(0, 10)}`,
        kind: 'submission' as const,
        submission,
      })),
      ...scenarios.map((scenario) => ({
        key: `scenario:${scenario.id}`,
        label: `${scenario.title} · ${scenario.updatedAt.slice(0, 10)}`,
        kind: 'scenario' as const,
        scenario,
      })),
    ];
  }, [submissions, scenarios]);

  const currentSections = useMemo(() => buildQuestionSections(draftAnswers), [draftAnswers]);
  const sensitivityQuestions = useMemo(() => getSensitivityQuestions(draftAnswers), [draftAnswers]);
  const selectedSensitivityQuestion = sensitivityQuestions.find((question) => question.id === selectedSensitivityQuestionId) || null;
  const selectedSensitivityOptions = useMemo(
    () => (selectedSensitivityQuestion ? getQuestionOptions(selectedSensitivityQuestion, draftAnswers) : []),
    [selectedSensitivityQuestion, draftAnswers]
  );
  const monotonicPassed =
    sensitivityDirection && sensitivityRows.length > 1 ? isMonotonic(sensitivityRows, sensitivityDirection) : null;

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [nextSubmissions, nextScenarios] = await Promise.all([
          listAdminSubmissions(accessToken),
          listAdminScenarios(accessToken),
        ]);

        if (cancelled) return;
        setSubmissions(nextSubmissions);
        setScenarios(nextScenarios);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load admin data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    const matchingOption = baselineOptions.find((option) => option.key === selectedBaselineKey);
    if (!matchingOption || matchingOption.kind === 'blank') {
      setDraftAnswers(deepClone(EMPTY_ANSWERS));
      setBaselineResult(null);
      setCurrentResult(null);
      setScenarioTitle('');
      setScenarioDescription('');
      setSensitivityRows([]);
      return;
    }

    const record = matchingOption.kind === 'submission' ? matchingOption.submission : matchingOption.scenario;
    setDraftAnswers(extractBaselineAnswers(record));
    setBaselineResult(record.resultSnapshot || null);
    setCurrentResult(record.resultSnapshot || null);
    setScenarioTitle(
      matchingOption.kind === 'scenario'
        ? matchingOption.scenario.title
        : `${matchingOption.submission.businessName} working copy`
    );
    setScenarioDescription(
      matchingOption.kind === 'scenario'
        ? matchingOption.scenario.description
        : `Working copy created from submission ${matchingOption.submission.id}`
    );
    setSensitivityRows([]);
  }, [selectedBaselineKey, baselineOptions]);

  useEffect(() => {
    if (!selectedSensitivityQuestion) {
      setSelectedSensitivityValues([]);
      return;
    }

    setSelectedSensitivityValues(selectedSensitivityOptions.map((option) => option.value));
  }, [selectedSensitivityQuestionId, selectedSensitivityQuestion, selectedSensitivityOptions]);

  async function refreshAdminData() {
    setLoading(true);
    setError('');

    try {
      const [nextSubmissions, nextScenarios] = await Promise.all([
        listAdminSubmissions(accessToken),
        listAdminScenarios(accessToken),
      ]);
      setSubmissions(nextSubmissions);
      setScenarios(nextScenarios);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh admin data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRunCurrent() {
    setRunning(true);
    setError('');

    try {
      const requestSnapshot = buildOwnerValuationRequest(draftAnswers);
      const response = await runAdminValuation(accessToken, requestSnapshot);
      setCurrentResult(response.result);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Failed to run valuation.');
    } finally {
      setRunning(false);
    }
  }

  async function persistScenario(updateExisting: boolean) {
    setSaving(true);
    setError('');

    try {
      const requestSnapshot = buildOwnerValuationRequest(draftAnswers);
      const runResponse = await runAdminValuation(accessToken, requestSnapshot);

      const selectedScenario =
        selectedBaselineKey.startsWith('scenario:')
          ? scenarios.find((scenario) => scenario.id === selectedBaselineKey.replace('scenario:', ''))
          : null;

      const payload = {
        title: scenarioTitle || 'Untitled admin scenario',
        description: scenarioDescription,
        sourceType: selectedBaselineKey.startsWith('submission:') ? 'submission' : selectedScenario ? selectedScenario.sourceType : 'manual',
        sourceSubmissionId: selectedBaselineKey.startsWith('submission:') ? selectedBaselineKey.replace('submission:', '') : '',
        answersSnapshot: draftAnswers,
        requestSnapshot,
        resultSnapshot: runResponse.result,
      };

      if (updateExisting && selectedScenario) {
        await updateAdminScenario(accessToken, selectedScenario.id, payload);
      } else {
        await createAdminScenario(accessToken, payload);
      }

      setCurrentResult(runResponse.result);
      await refreshAdminData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save scenario.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRunSensitivity() {
    if (!selectedSensitivityQuestion) {
      return;
    }

    setSensitivityRunning(true);
    setError('');

    try {
      const runs = selectedSensitivityValues.map((value) => {
        const nextAnswers = {
          ...draftAnswers,
          [selectedSensitivityQuestion.id]: value,
        };

        return {
          label: selectedSensitivityOptions.find((option) => option.value === value)?.label || value,
          request: buildOwnerValuationRequest(nextAnswers),
        };
      });

      const response = await runAdminSensitivity(accessToken, {
        metricPath: sensitivityMetricPath,
        runs,
      });

      setSensitivityRows(response.rows);
    } catch (sensitivityError) {
      setError(sensitivityError instanceof Error ? sensitivityError.message : 'Failed to run sensitivity matrix.');
    } finally {
      setSensitivityRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading admin valuation lab…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="gap-4 border-b border-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-purple-700">
                  Internal Admin Lab
                </div>
                <CardTitle className="text-3xl">Scenario Lab and Sensitivity Matrix</CardTitle>
                <CardDescription className="max-w-4xl text-sm leading-6 text-slate-500">
                  Load a saved baseline or start blank, edit questions directly against the same canonical engine path, and
                  compare option-by-option movement without stepping through the public questionnaire.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                  Signed in as <span className="font-semibold text-slate-900">{session.user.email}</span>
                </div>
                <Button type="button" variant="outline" onClick={refreshAdminData}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button type="button" variant="outline" onClick={() => void onSignOut()}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="baselineSelect">
                Baseline
              </label>
              <select
                id="baselineSelect"
                value={selectedBaselineKey}
                onChange={(event) => setSelectedBaselineKey(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              >
                {baselineOptions.map((option) => (
                  <option key={option.key || 'blank'} value={option.key}>
                    {option.kind === 'blank'
                      ? option.label
                      : `${option.kind === 'submission' ? 'Submission' : 'Scenario'} · ${option.label}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="scenarioTitle">
                  Scenario title
                </label>
                <Input id="scenarioTitle" value={scenarioTitle} onChange={(event) => setScenarioTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="scenarioDescription">
                  Scenario notes
                </label>
                <Input
                  id="scenarioDescription"
                  value={scenarioDescription}
                  onChange={(event) => setScenarioDescription(event.target.value)}
                  placeholder="What this working copy is for"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <TabsList className="w-fit bg-white shadow-sm">
            <TabsTrigger value="scenario">Scenario Lab</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensitivity Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="scenario" className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-4">
              <SummaryDeltaCard
                label="Adjusted value"
                baseline={baselineResult?.summary.adjustedValue}
                current={currentResult?.summary.adjustedValue}
                money
              />
              <SummaryDeltaCard
                label="Readiness"
                baseline={baselineResult?.summary.readinessScore}
                current={currentResult?.summary.readinessScore}
              />
              <SummaryDeltaCard
                label="Confidence"
                baseline={baselineResult?.summary.confidenceScore}
                current={currentResult?.summary.confidenceScore}
              />
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-medium text-slate-500">Qualitative factors</div>
                <div className="mt-3 grid gap-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Geography</span>
                    <span className="font-semibold text-slate-900">
                      {currentResult?.audit?.qualitativeAdjustments?.geographyAdjustmentFactor?.toFixed(3) || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Branch</span>
                    <span className="font-semibold text-slate-900">
                      {currentResult?.audit?.qualitativeAdjustments?.branchQualityFactor?.toFixed(3) || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Primary method</span>
                    <span className="font-semibold text-slate-900">{currentResult?.selectedMethods.primaryMethod || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => void handleRunCurrent()} disabled={running}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                Re-run valuation
              </Button>
              <Button type="button" variant="outline" onClick={() => void persistScenario(false)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save as new scenario
              </Button>
              {selectedBaselineKey.startsWith('scenario:') ? (
                <Button type="button" variant="outline" onClick={() => void persistScenario(true)} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update current scenario
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={() => setSelectedBaselineKey('')}>
                Start blank scenario
              </Button>
            </div>

            <div className="space-y-6">
              {currentSections.map((section) => (
                <Card key={section.id} className="border-slate-200 shadow-sm">
                  <CardHeader className="gap-2 border-b border-slate-200">
                    <CardTitle>{section.title}</CardTitle>
                    {section.description ? <CardDescription>{section.description}</CardDescription> : null}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {section.questions.map((question) => (
                      <QuestionEditor key={question.id} question={question} answers={draftAnswers} onChange={setDraftAnswers} />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sensitivity" className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="gap-2 border-b border-slate-200">
                <CardTitle>Sensitivity setup</CardTitle>
                <CardDescription>
                  Choose one baseline question, run every option from the same draft state, and compare how the engine moves the selected metric.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 pt-6 xl:grid-cols-[1.2fr_1fr_1fr]">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="sensitivityQuestion">
                    Question
                  </label>
                  <select
                    id="sensitivityQuestion"
                    value={selectedSensitivityQuestionId}
                    onChange={(event) => setSelectedSensitivityQuestionId(event.target.value as OwnerFieldId | '')}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
                  >
                    <option value="">Select a question</option>
                    {sensitivityQuestions.map((question) => (
                      <option key={question.id} value={question.id}>
                        {resolveQuestionCopy(question, draftAnswers.respondentRole).prompt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="metricPath">
                    Metric
                  </label>
                  <select
                    id="metricPath"
                    value={sensitivityMetricPath}
                    onChange={(event) => setSensitivityMetricPath(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
                  >
                    {SENSITIVITY_METRICS.map((metric) => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="metricDirection">
                    Expected direction
                  </label>
                  <select
                    id="metricDirection"
                    value={sensitivityDirection}
                    onChange={(event) => setSensitivityDirection(event.target.value as 'asc' | 'desc' | '')}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
                  >
                    <option value="">No direction check</option>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {selectedSensitivityQuestion ? (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="gap-2 border-b border-slate-200">
                  <CardTitle>{resolveQuestionCopy(selectedSensitivityQuestion, draftAnswers.respondentRole).prompt}</CardTitle>
                  <CardDescription>Select the options to run from the current draft baseline.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pt-6 md:grid-cols-2">
                  {selectedSensitivityOptions.map((option) => (
                    <label key={option.value} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <Checkbox
                        checked={selectedSensitivityValues.includes(option.value)}
                        onCheckedChange={(checked) => {
                          setSelectedSensitivityValues((current) =>
                            checked === true
                              ? [...new Set([...current, option.value])]
                              : current.filter((value) => value !== option.value)
                          );
                        }}
                        className="mt-1"
                      />
                      <span className="text-sm leading-6 text-slate-700">{option.label}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void handleRunSensitivity()}
                disabled={!selectedSensitivityQuestion || selectedSensitivityValues.length === 0 || sensitivityRunning}
              >
                {sensitivityRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                Run sensitivity matrix
              </Button>
              {monotonicPassed !== null ? (
                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                    monotonicPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {monotonicPassed ? 'Direction check passed' : 'Direction check failed'}
                </div>
              ) : null}
            </div>

            {sensitivityRows.length > 0 ? (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="gap-2 border-b border-slate-200">
                  <CardTitle>Sensitivity results</CardTitle>
                  <CardDescription>All runs below used the same draft baseline, with only the selected question changed.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto pt-6">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="px-3 py-2 font-medium">Option</th>
                        <th className="px-3 py-2 font-medium">Metric</th>
                        <th className="px-3 py-2 font-medium">Adjusted value</th>
                        <th className="px-3 py-2 font-medium">Readiness</th>
                        <th className="px-3 py-2 font-medium">Confidence</th>
                        <th className="px-3 py-2 font-medium">Method</th>
                        <th className="px-3 py-2 font-medium">Branch factor</th>
                        <th className="px-3 py-2 font-medium">Geo factor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivityRows.map((row) => (
                        <tr key={row.label} className="border-b border-slate-100 text-slate-800">
                          <td className="px-3 py-3 align-top font-medium">{row.label}</td>
                          <td className="px-3 py-3 align-top">
                            {typeof row.metricValue === 'number' ? row.metricValue.toLocaleString('en-NG', { maximumFractionDigits: 3 }) : String(row.metricValue ?? '')}
                          </td>
                          <td className="px-3 py-3 align-top">{formatMillions(row.summary.adjustedValue)}</td>
                          <td className="px-3 py-3 align-top">{row.summary.readinessScore.toFixed(1)}</td>
                          <td className="px-3 py-3 align-top">{row.summary.confidenceScore.toFixed(1)}</td>
                          <td className="px-3 py-3 align-top">{row.summary.primaryMethod}</td>
                          <td className="px-3 py-3 align-top">{row.summary.branchQualityFactor.toFixed(3)}</td>
                          <td className="px-3 py-3 align-top">{row.summary.geographyAdjustmentFactor.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
