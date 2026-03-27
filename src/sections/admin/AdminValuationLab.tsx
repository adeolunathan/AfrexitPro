import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2, LogOut, RefreshCcw, Save, WandSparkles } from 'lucide-react';
import {
  createAdminScenario,
  getAdminQuestionAuditDetail,
  getAdminQuestionAuditReport,
  listAdminScenarios,
  listAdminSubmissions,
  runAdminSensitivity,
  runAdminValuation,
  updateAdminScenario,
  type AdminScenarioRecord,
  type AdminSubmissionRecord,
  type QuestionAuditEntry,
  type QuestionAuditReport,
  type SensitivityRow,
} from '@/api/admin';
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
import { formatMillions as formatMillionInput } from '@/lib/million-currency';

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

const NON_IMPACT_FIELDS = new Set<OwnerFieldId>([
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
  { value: 'valueConclusion.reconciliation.qualitativeAdjustments.level1AdjustmentFactor', label: 'Level 1 factor' },
  { value: 'valueConclusion.reconciliation.qualitativeAdjustments.transactionContextFactor', label: 'Transaction-context factor' },
  { value: 'valueConclusion.reconciliation.qualitativeAdjustments.achievableUrgencyFactor', label: 'Urgency factor' },
  { value: 'valueConclusion.reconciliation.qualitativeAdjustments.marketPositionAdjustmentFactor', label: 'Market-position factor' },
  { value: 'valueConclusion.reconciliation.qualitativeAdjustments.fxExposureAdjustmentFactor', label: 'FX factor' },
] as const;

interface QuestionImpactRow {
  id: OwnerFieldId;
  prompt: string;
  changeSummary: string;
  adjustedValueDelta: number;
  readinessDelta: number;
  confidenceDelta: number;
  result: ResultData;
}

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

function formatMillionsPrecise(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
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

function formatFactor(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toFixed(3);
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'passing':
      return 'bg-emerald-50 text-emerald-700';
    case 'structural by design':
      return 'bg-sky-50 text-sky-700';
    case 'context-only by design':
      return 'bg-slate-100 text-slate-600';
    case 'wrong direction':
    case 'unexpected method switch':
    case 'no-effect':
      return 'bg-rose-50 text-rose-700';
    case 'too weak / tied':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatStatusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function truncateText(value: string, maxLength = 60) {
  const normalized = String(value || '').trim();
  if (!normalized) return 'Not set';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function normalizeAnswers(value: FormData | null | undefined): FormData {
  return {
    ...EMPTY_ANSWERS,
    ...(value || {}),
  };
}

function getQualitativeAdjustments(result: ResultData | null | undefined) {
  return result?.valueConclusion?.reconciliation?.qualitativeAdjustments || result?.audit?.qualitativeAdjustments || {};
}

function getNormalizationLedger(result: ResultData | null | undefined) {
  return result?.audit?.calculationLedger?.normalization;
}

function getAdjustedEbitNormalizationDelta(result: ResultData | null | undefined) {
  const ledger = getNormalizationLedger(result);
  if (!ledger) return undefined;
  return ledger.adjustedEbit - ledger.rawEbit;
}

function getSdeNormalizationDelta(result: ResultData | null | undefined) {
  const ledger = getNormalizationLedger(result);
  if (!ledger) return undefined;
  return (result?.normalizedMetrics.sde ?? ledger.sde) - ledger.rawSde;
}

function getPrimaryMethodNormalizationDelta(result: ResultData | null | undefined) {
  const primaryMethod = result?.selectedMethods.primaryMethod;
  if (!primaryMethod) return undefined;
  return result?.valueConclusion?.reconciliation?.methodNormalizationImpacts?.find(
    (impact) => impact.method === primaryMethod
  )?.deltaMid;
}

type SensitivityNormalizationMetric = {
  key: 'primaryMethod' | 'adjustedEbit' | 'sde';
  label: string;
  getValue: (result: ResultData | null | undefined) => number | undefined;
};

const SENSITIVITY_NORMALIZATION_METRICS: SensitivityNormalizationMetric[] = [
  {
    key: 'primaryMethod',
    label: 'Primary-method norm',
    getValue: getPrimaryMethodNormalizationDelta,
  },
  {
    key: 'adjustedEbit',
    label: 'Adjusted EBIT norm',
    getValue: getAdjustedEbitNormalizationDelta,
  },
  {
    key: 'sde',
    label: 'SDE norm',
    getValue: getSdeNormalizationDelta,
  },
];

function pickSensitivityNormalizationMetric(results: Array<ResultData | null | undefined>) {
  const metricWithMovement = SENSITIVITY_NORMALIZATION_METRICS.find((metric) =>
    results.some((result) => {
      const value = metric.getValue(result);
      return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) >= 0.005;
    })
  );

  return metricWithMovement || SENSITIVITY_NORMALIZATION_METRICS[0];
}

function getPreciseAdjustedValue(result: ResultData | null | undefined, fallback?: number) {
  return result?.audit?.calculationLedger?.bridge?.achievableEquityMid ?? fallback;
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

function getQuestionLibrary(...answerSets: FormData[]) {
  const byId = new Map<OwnerFieldId, QuestionLike>();

  answerSets.forEach((answers) => {
    buildQuestionSections(answers).forEach((section) => {
      section.questions.forEach((question) => {
        if (!byId.has(question.id)) {
          byId.set(question.id, question);
        }
      });
    });
  });

  return Array.from(byId.values());
}

function areComparableValuesEqual(left: unknown, right: unknown) {
  if (typeof left === 'boolean' || typeof right === 'boolean') {
    return Boolean(left) === Boolean(right);
  }

  return String(left ?? '').trim() === String(right ?? '').trim();
}

function isFinancialTableChanged(baselineAnswers: FormData, draftAnswers: FormData) {
  const baselinePeriods = buildFinancialPeriodsFromAnswers(baselineAnswers);
  const draftPeriods = buildFinancialPeriodsFromAnswers(draftAnswers);
  return JSON.stringify(baselinePeriods) !== JSON.stringify(draftPeriods);
}

function hasQuestionChanged(question: QuestionLike, baselineAnswers: FormData, draftAnswers: FormData) {
  if (question.type === 'financial_table') {
    return isFinancialTableChanged(baselineAnswers, draftAnswers);
  }

  return !areComparableValuesEqual(baselineAnswers[question.id], draftAnswers[question.id]);
}

function applyQuestionFromDraft(question: QuestionLike, baselineAnswers: FormData, draftAnswers: FormData): FormData {
  if (question.type === 'financial_table') {
    return applyFinancialPeriods({ ...baselineAnswers }, buildFinancialPeriodsFromAnswers(draftAnswers));
  }

  return {
    ...baselineAnswers,
    [question.id]: draftAnswers[question.id],
  };
}

function getQuestionValueLabel(question: QuestionLike, value: unknown, answers: FormData) {
  if (question.type === 'financial_table') {
    const periods = buildFinancialPeriodsFromAnswers(answers).filter((period) => period.enabled);
    const labels = periods.map((period) => period.label).join(', ');
    return labels ? `Years included: ${labels}` : 'No years enabled';
  }

  if (question.type === 'select') {
    const option = getQuestionOptions(question, answers).find((item) => item.value === String(value ?? ''));
    return option?.label || String(value || 'Not set');
  }

  if (question.type === 'currency' || question.type === 'number') {
    const numericValue = Number(String(value ?? '').trim());
    return Number.isFinite(numericValue) ? `₦${formatMillionInput(numericValue, true)}m` : '₦0m';
  }

  if (question.type === 'checkbox') {
    return value === true ? 'Yes' : 'No';
  }

  return truncateText(String(value ?? ''));
}

function describeQuestionChange(question: QuestionLike, baselineAnswers: FormData, draftAnswers: FormData) {
  if (question.type === 'financial_table') {
    return 'Updated financial history inputs';
  }

  return `${getQuestionValueLabel(question, baselineAnswers[question.id], baselineAnswers)} → ${getQuestionValueLabel(
    question,
    draftAnswers[question.id],
    draftAnswers
  )}`;
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

function formatSensitivityMetricValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }

  return String(value ?? '');
}

function formatSignedMillionsDelta(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (value === 0) return '₦0.00m';
  return `${value > 0 ? '+' : '-'}${formatMillionsPrecise(Math.abs(value))}`;
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

function hasNumericVariation(values: Array<number | null | undefined>, tolerance = 0.0005) {
  const numericValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (numericValues.length <= 1) return false;
  const [first, ...rest] = numericValues;
  return rest.some((value) => Math.abs(value - first) > tolerance);
}

function hasStringVariation(values: Array<string | null | undefined>) {
  const normalizedValues = values
    .map((value) => String(value ?? '').trim())
    .filter((value) => value.length > 0);
  return new Set(normalizedValues).size > 1;
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

function FactorDeltaCard({
  label,
  baseline,
  current,
  baselineDetail,
  currentDetail,
}: {
  label: string;
  baseline: number | undefined;
  current: number | undefined;
  baselineDetail?: string;
  currentDetail?: string;
}) {
  const baselineValue = baseline ?? 1;
  const currentValue = current ?? 1;
  const delta = currentValue - baselineValue;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-3 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Baseline</span>
          <span className="text-right font-semibold text-slate-800">{formatFactor(baseline)}</span>
        </div>
        {baselineDetail ? <div className="text-xs text-slate-500">{baselineDetail}</div> : null}
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Current</span>
          <span className="text-right font-semibold text-slate-900">{formatFactor(current)}</span>
        </div>
        {currentDetail ? <div className="text-xs text-slate-500">{currentDetail}</div> : null}
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Delta</span>
          <span className={`font-semibold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
            {delta === 0 ? '0.000' : `${delta > 0 ? '+' : ''}${delta.toFixed(3)}`}
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
  const [auditError, setAuditError] = useState('');
  const [activeTab, setActiveTab] = useState('scenario');
  const [selectedSensitivityQuestionId, setSelectedSensitivityQuestionId] = useState<OwnerFieldId | ''>('');
  const [selectedSensitivityValues, setSelectedSensitivityValues] = useState<string[]>([]);
  const [sensitivityMetricPath, setSensitivityMetricPath] = useState<string>('summary.adjustedValue');
  const [sensitivityDirection, setSensitivityDirection] = useState<'asc' | 'desc' | ''>('');
  const [sensitivityRows, setSensitivityRows] = useState<SensitivityRow[]>([]);
  const [sensitivityBaselineRow, setSensitivityBaselineRow] = useState<SensitivityRow | null>(null);
  const [sensitivityRunning, setSensitivityRunning] = useState(false);
  const [questionImpactRows, setQuestionImpactRows] = useState<QuestionImpactRow[]>([]);
  const [questionImpactRunning, setQuestionImpactRunning] = useState(false);
  const [questionAuditReport, setQuestionAuditReport] = useState<QuestionAuditReport | null>(null);
  const [questionAuditLoading, setQuestionAuditLoading] = useState(false);
  const [selectedAuditQuestionId, setSelectedAuditQuestionId] = useState('');
  const [selectedAuditBaselineId, setSelectedAuditBaselineId] = useState('');
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<QuestionAuditEntry | null>(null);
  const [selectedAuditRowLabel, setSelectedAuditRowLabel] = useState('');

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

  const selectedBaselineOption = useMemo(
    () => baselineOptions.find((option) => option.key === selectedBaselineKey) ?? baselineOptions[0] ?? { key: '', label: 'Blank admin scenario', kind: 'blank' as const },
    [baselineOptions, selectedBaselineKey]
  );
  const baselineAnswers = useMemo(() => {
    if (!selectedBaselineOption || selectedBaselineOption.kind === 'blank') {
      return deepClone(EMPTY_ANSWERS);
    }

    const record =
      selectedBaselineOption.kind === 'submission' ? selectedBaselineOption.submission : selectedBaselineOption.scenario;
    return extractBaselineAnswers(record);
  }, [selectedBaselineOption]);

  const currentSections = useMemo(() => buildQuestionSections(draftAnswers), [draftAnswers]);
  const sensitivityQuestions = useMemo(() => getSensitivityQuestions(draftAnswers), [draftAnswers]);
  const impactQuestions = useMemo(
    () =>
      getQuestionLibrary(baselineAnswers, draftAnswers)
        .filter((question) => !NON_IMPACT_FIELDS.has(question.id))
        .filter((question) => hasQuestionChanged(question, baselineAnswers, draftAnswers)),
    [baselineAnswers, draftAnswers]
  );
  const selectedSensitivityQuestion = sensitivityQuestions.find((question) => question.id === selectedSensitivityQuestionId) || null;
  const selectedSensitivityMetricOption = useMemo(
    () => SENSITIVITY_METRICS.find((metric) => metric.value === sensitivityMetricPath) || SENSITIVITY_METRICS[0],
    [sensitivityMetricPath]
  );
  const sensitivityMetricIsAdjustedValue = selectedSensitivityMetricOption.value === 'summary.adjustedValue';
  const sensitivityMetricColumnLabel = sensitivityMetricIsAdjustedValue
    ? 'Adjusted value'
    : selectedSensitivityMetricOption.label;
  const sensitivityMetricDeltaColumnLabel = sensitivityMetricIsAdjustedValue
    ? 'Adjusted value Δ'
    : `${selectedSensitivityMetricOption.label} Δ`;
  const selectedSensitivityOptions = useMemo(
    () => (selectedSensitivityQuestion ? getQuestionOptions(selectedSensitivityQuestion, draftAnswers) : []),
    [selectedSensitivityQuestion, draftAnswers]
  );
  const monotonicPassed =
    sensitivityDirection && sensitivityRows.length > 1 ? isMonotonic(sensitivityRows, sensitivityDirection) : null;
  const sensitivityNormalizationMetric = useMemo(
    () =>
      pickSensitivityNormalizationMetric([
        sensitivityBaselineRow?.result,
        ...sensitivityRows.map((row) => row.result),
      ]),
    [sensitivityBaselineRow, sensitivityRows]
  );
  const showSensitivityReadinessColumn = useMemo(
    () =>
      hasNumericVariation([
        sensitivityBaselineRow?.summary.readinessScore,
        ...sensitivityRows.map((row) => row.summary.readinessScore),
      ]),
    [sensitivityBaselineRow, sensitivityRows]
  );
  const showSensitivityConfidenceColumn = useMemo(
    () =>
      hasNumericVariation([
        sensitivityBaselineRow?.summary.confidenceScore,
        ...sensitivityRows.map((row) => row.summary.confidenceScore),
      ]),
    [sensitivityBaselineRow, sensitivityRows]
  );
  const showSensitivityRangeWidthColumn = useMemo(
    () =>
      hasNumericVariation([
        sensitivityBaselineRow?.result.confidenceAssessment.rangeWidthPct,
        ...sensitivityRows.map((row) => row.result.confidenceAssessment.rangeWidthPct),
      ]),
    [sensitivityBaselineRow, sensitivityRows]
  );
  const showSensitivityMethodColumn = useMemo(
    () =>
      hasStringVariation([
        sensitivityBaselineRow?.summary.primaryMethod,
        ...sensitivityRows.map((row) => row.summary.primaryMethod),
      ]),
    [sensitivityBaselineRow, sensitivityRows]
  );
  const showSensitivityBranchFactorColumn = useMemo(
    () =>
      hasNumericVariation([
        sensitivityBaselineRow?.summary.branchQualityFactor,
        ...sensitivityRows.map((row) => row.summary.branchQualityFactor),
      ]),
    [sensitivityBaselineRow, sensitivityRows]
  );
  const showSensitivityGeoFactorColumn = useMemo(
    () =>
      hasNumericVariation([
        sensitivityBaselineRow?.summary.geographyAdjustmentFactor,
        ...sensitivityRows.map((row) => row.summary.geographyAdjustmentFactor),
      ]),
    [sensitivityBaselineRow, sensitivityRows]
  );
  const baselineQualitativeAdjustments = useMemo(() => getQualitativeAdjustments(baselineResult), [baselineResult]);
  const currentQualitativeAdjustments = useMemo(() => getQualitativeAdjustments(currentResult), [currentResult]);
  const reportAuditEntry = useMemo(
    () => questionAuditReport?.results.find((entry) => entry.questionId === selectedAuditQuestionId) || null,
    [questionAuditReport, selectedAuditQuestionId]
  );
  const effectiveAuditEntry = selectedAuditEntry || reportAuditEntry;
  const effectiveAuditBaselineRow = effectiveAuditEntry?.baselineRow || null;
  const effectiveAuditRow = useMemo(() => {
    if (!effectiveAuditEntry?.rows?.length) return null;
    return effectiveAuditEntry.rows.find((row) => row.label === selectedAuditRowLabel) || effectiveAuditEntry.rows[0];
  }, [effectiveAuditEntry, selectedAuditRowLabel]);
  const effectiveAuditBaselineId =
    selectedAuditBaselineId || effectiveAuditEntry?.baseline?.id || reportAuditEntry?.baseline?.id || '';
  const auditBaselineOptions = useMemo(() => {
    const allowedIds = effectiveAuditEntry?.manifestEntry.baselineIds?.length
      ? effectiveAuditEntry.manifestEntry.baselineIds
      : questionAuditReport?.baselines.map((baseline) => baseline.id) || [];
    return (questionAuditReport?.baselines || []).filter((baseline) => allowedIds.includes(baseline.id));
  }, [effectiveAuditEntry, questionAuditReport]);
  const auditBaselineQualitativeAdjustments = useMemo(
    () => getQualitativeAdjustments(effectiveAuditBaselineRow?.result),
    [effectiveAuditBaselineRow]
  );
  const auditRowQualitativeAdjustments = useMemo(() => getQualitativeAdjustments(effectiveAuditRow?.result), [effectiveAuditRow]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setQuestionAuditLoading(true);
      setError('');
      setAuditError('');

      try {
        const [submissionsResult, scenariosResult, auditResult] = await Promise.allSettled([
          listAdminSubmissions(accessToken),
          listAdminScenarios(accessToken),
          getAdminQuestionAuditReport(accessToken),
        ]);

        if (cancelled) return;

        if (submissionsResult.status === 'fulfilled') {
          setSubmissions(submissionsResult.value);
        } else {
          setSubmissions([]);
        }

        if (scenariosResult.status === 'fulfilled') {
          setScenarios(scenariosResult.value);
        } else {
          setScenarios([]);
        }

        if (auditResult.status === 'fulfilled') {
          setQuestionAuditReport(auditResult.value);
        } else {
          setQuestionAuditReport(null);
        }

        const primaryErrors: string[] = [];
        if (submissionsResult.status === 'rejected') {
          primaryErrors.push(submissionsResult.reason instanceof Error ? submissionsResult.reason.message : 'Failed to load submissions.');
        }
        if (scenariosResult.status === 'rejected') {
          primaryErrors.push(scenariosResult.reason instanceof Error ? scenariosResult.reason.message : 'Failed to load scenarios.');
        }
        if (primaryErrors.length > 0) {
          setError(primaryErrors.join(' '));
        }

        if (auditResult.status === 'rejected') {
          setAuditError(auditResult.reason instanceof Error ? auditResult.reason.message : 'Failed to load question audit.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setQuestionAuditLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (selectedBaselineKey) {
      return;
    }

    const preferredScenario = baselineOptions.find((option) => option.kind === 'scenario');
    if (preferredScenario) {
      setSelectedBaselineKey(preferredScenario.key);
      return;
    }

    const preferredSubmission = baselineOptions.find((option) => option.kind === 'submission');
    if (preferredSubmission) {
      setSelectedBaselineKey(preferredSubmission.key);
    }
  }, [baselineOptions, selectedBaselineKey]);

  useEffect(() => {
    if (!selectedBaselineOption || selectedBaselineOption.kind === 'blank') {
      setDraftAnswers(deepClone(EMPTY_ANSWERS));
      setBaselineResult(null);
      setCurrentResult(null);
      setScenarioTitle('');
      setScenarioDescription('');
      setSensitivityRows([]);
      setQuestionImpactRows([]);
      return;
    }

    const record = selectedBaselineOption.kind === 'submission' ? selectedBaselineOption.submission : selectedBaselineOption.scenario;
    setDraftAnswers(extractBaselineAnswers(record));
    setBaselineResult(record.resultSnapshot || null);
    setCurrentResult(record.resultSnapshot || null);
    setScenarioTitle(
      selectedBaselineOption.kind === 'scenario'
        ? selectedBaselineOption.scenario.title
        : `${selectedBaselineOption.submission.businessName} working copy`
    );
    setScenarioDescription(
      selectedBaselineOption.kind === 'scenario'
        ? selectedBaselineOption.scenario.description
        : `Working copy created from submission ${selectedBaselineOption.submission.id}`
    );
    setSensitivityRows([]);
    setQuestionImpactRows([]);
  }, [selectedBaselineOption]);

  useEffect(() => {
    if (!selectedSensitivityQuestion) {
      setSelectedSensitivityValues([]);
      return;
    }

    setSelectedSensitivityValues(selectedSensitivityOptions.map((option) => option.value));
  }, [selectedSensitivityQuestionId, selectedSensitivityQuestion, selectedSensitivityOptions]);

  useEffect(() => {
    setQuestionImpactRows([]);
  }, [draftAnswers]);

  useEffect(() => {
    setSensitivityRows([]);
    setSensitivityBaselineRow(null);
  }, [selectedSensitivityQuestionId, selectedSensitivityValues, sensitivityMetricPath, draftAnswers]);

  useEffect(() => {
    if (!questionAuditReport || selectedAuditQuestionId) {
      return;
    }

    const preferred =
      questionAuditReport.results.find((entry) => entry.status.overallStatus !== 'passing') ||
      questionAuditReport.results.find((entry) => entry.status.overallStatus !== 'context-only by design') ||
      questionAuditReport.results[0];

    if (preferred) {
      setSelectedAuditQuestionId(preferred.questionId);
    }
  }, [questionAuditReport, selectedAuditQuestionId]);

  useEffect(() => {
    if (!reportAuditEntry) {
      setSelectedAuditBaselineId('');
      setSelectedAuditEntry(null);
      return;
    }

    const nextBaselineId = reportAuditEntry.baseline?.id || reportAuditEntry.manifestEntry.baselineIds?.[0] || '';
    setSelectedAuditBaselineId((current) => (current === nextBaselineId ? current : nextBaselineId));
  }, [reportAuditEntry]);

  useEffect(() => {
    let cancelled = false;

    async function loadAuditDetail() {
      if (!selectedAuditQuestionId) {
        setSelectedAuditEntry(null);
        return;
      }

      setQuestionAuditLoading(true);
      setAuditError('');
      try {
        const detail = await getAdminQuestionAuditDetail(accessToken, selectedAuditQuestionId, effectiveAuditBaselineId || undefined);
        if (cancelled) return;
        setSelectedAuditEntry(detail);
        setSelectedAuditRowLabel(detail.rows[0]?.label || '');
      } catch (detailError) {
        if (!cancelled) {
          setAuditError(detailError instanceof Error ? detailError.message : 'Failed to load question audit detail.');
        }
      } finally {
        if (!cancelled) {
          setQuestionAuditLoading(false);
        }
      }
    }

    void loadAuditDetail();

    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedAuditQuestionId, effectiveAuditBaselineId]);

  async function refreshAdminData() {
    setLoading(true);
    setQuestionAuditLoading(true);
    setError('');
    setAuditError('');

    try {
      const [submissionsResult, scenariosResult, auditResult] = await Promise.allSettled([
        listAdminSubmissions(accessToken),
        listAdminScenarios(accessToken),
        getAdminQuestionAuditReport(accessToken),
      ]);

      if (submissionsResult.status === 'fulfilled') {
        setSubmissions(submissionsResult.value);
      }
      if (scenariosResult.status === 'fulfilled') {
        setScenarios(scenariosResult.value);
      }
      if (auditResult.status === 'fulfilled') {
        setQuestionAuditReport(auditResult.value);
      }

      const primaryErrors: string[] = [];
      if (submissionsResult.status === 'rejected') {
        primaryErrors.push(submissionsResult.reason instanceof Error ? submissionsResult.reason.message : 'Failed to load submissions.');
      }
      if (scenariosResult.status === 'rejected') {
        primaryErrors.push(scenariosResult.reason instanceof Error ? scenariosResult.reason.message : 'Failed to load scenarios.');
      }
      if (primaryErrors.length > 0) {
        setError(primaryErrors.join(' '));
      }

      if (auditResult.status === 'rejected') {
        setAuditError(auditResult.reason instanceof Error ? auditResult.reason.message : 'Failed to load question audit.');
      }
    } finally {
      setLoading(false);
      setQuestionAuditLoading(false);
    }
  }

  async function handleRunQuestionImpact(referenceResult?: ResultData) {
    if (!baselineResult) {
      setQuestionImpactRows([]);
      return;
    }

    if (impactQuestions.length === 0) {
      setQuestionImpactRows([]);
      return;
    }

    setQuestionImpactRunning(true);
    setError('');

    try {
      const rows = await Promise.all(
        impactQuestions.map(async (question) => {
          const nextAnswers = applyQuestionFromDraft(question, baselineAnswers, draftAnswers);
          const response = await runAdminValuation(accessToken, buildOwnerValuationRequest(nextAnswers));

          return {
            id: question.id,
            prompt: resolveQuestionCopy(question, draftAnswers.respondentRole).prompt,
            changeSummary: describeQuestionChange(question, baselineAnswers, draftAnswers),
            adjustedValueDelta:
              (getPreciseAdjustedValue(response.result, response.summary.preciseAdjustedValue ?? response.result.summary.adjustedValue) ?? 0) -
              (getPreciseAdjustedValue(baselineResult, baselineResult.summary.adjustedValue) ?? 0),
            readinessDelta: response.result.summary.readinessScore - baselineResult.summary.readinessScore,
            confidenceDelta: response.result.summary.confidenceScore - baselineResult.summary.confidenceScore,
            result: response.result,
          } satisfies QuestionImpactRow;
        })
      );

      rows.sort((left, right) => {
        const leftMagnitude =
          Math.abs(left.adjustedValueDelta) * 100 +
          Math.abs(left.readinessDelta) * 10 +
          Math.abs(left.confidenceDelta);
        const rightMagnitude =
          Math.abs(right.adjustedValueDelta) * 100 +
          Math.abs(right.readinessDelta) * 10 +
          Math.abs(right.confidenceDelta);

        return rightMagnitude - leftMagnitude;
      });

      setQuestionImpactRows(rows);
      if (referenceResult) {
        setCurrentResult(referenceResult);
      }
    } catch (impactError) {
      setError(impactError instanceof Error ? impactError.message : 'Failed to isolate question impact.');
    } finally {
      setQuestionImpactRunning(false);
    }
  }

  async function handleRunCurrent() {
    setRunning(true);
    setError('');

    try {
      const requestSnapshot = buildOwnerValuationRequest(draftAnswers);
      const response = await runAdminValuation(accessToken, requestSnapshot);
      setCurrentResult(response.result);
      await handleRunQuestionImpact(response.result);
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
      const orderedSelectedOptions = selectedSensitivityOptions.filter((option) =>
        selectedSensitivityValues.includes(option.value)
      );
      const runs = [
        {
          label: '__baseline__',
          request: buildOwnerValuationRequest(draftAnswers),
        },
        ...orderedSelectedOptions.map((option) => {
          const nextAnswers = {
            ...draftAnswers,
            [selectedSensitivityQuestion.id]: option.value,
          };

          return {
            label: option.label,
            request: buildOwnerValuationRequest(nextAnswers),
          };
        }),
      ];

      const response = await runAdminSensitivity(accessToken, {
        metricPath: sensitivityMetricPath,
        runs,
      });

      setSensitivityBaselineRow(response.rows[0] || null);
      setSensitivityRows(response.rows.slice(1));
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
          <TabsList className="grid w-full max-w-3xl grid-cols-1 gap-2 rounded-2xl bg-transparent p-0 sm:grid-cols-3">
            <TabsTrigger
              value="scenario"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm transition data-[state=active]:border-purple-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Scenario Lab
            </TabsTrigger>
            <TabsTrigger
              value="sensitivity"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm transition data-[state=active]:border-purple-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Sensitivity Matrix
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm transition data-[state=active]:border-purple-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Question Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scenario" className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-5">
              <SummaryDeltaCard
                label="Adjusted value"
                baseline={getPreciseAdjustedValue(baselineResult, baselineResult?.summary.adjustedValue)}
                current={getPreciseAdjustedValue(currentResult, currentResult?.summary.adjustedValue)}
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
              <SummaryDeltaCard
                label="Range width"
                baseline={baselineResult?.confidenceAssessment.rangeWidthPct}
                current={currentResult?.confidenceAssessment.rangeWidthPct}
              />
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-medium text-slate-500">Method context</div>
                <div className="mt-3 grid gap-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Primary method</span>
                    <span className="font-semibold text-slate-900">{currentResult?.selectedMethods.primaryMethod || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Low estimate</span>
                    <span className="font-semibold text-slate-900">{formatMillions(currentResult?.summary.lowEstimate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">High estimate</span>
                    <span className="font-semibold text-slate-900">{formatMillions(currentResult?.summary.highEstimate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <SummaryDeltaCard
                label="Primary method norm Δ"
                baseline={getPrimaryMethodNormalizationDelta(baselineResult)}
                current={getPrimaryMethodNormalizationDelta(currentResult)}
                money
              />
              <SummaryDeltaCard
                label="EBIT norm Δ"
                baseline={getAdjustedEbitNormalizationDelta(baselineResult)}
                current={getAdjustedEbitNormalizationDelta(currentResult)}
                money
              />
              <SummaryDeltaCard
                label="SDE norm Δ"
                baseline={getSdeNormalizationDelta(baselineResult)}
                current={getSdeNormalizationDelta(currentResult)}
                money
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <FactorDeltaCard
                label="Geography factor"
                baseline={baselineQualitativeAdjustments.geographyAdjustmentFactor}
                current={currentQualitativeAdjustments.geographyAdjustmentFactor}
                baselineDetail={baselineQualitativeAdjustments.geographyBucket || 'No baseline geography bucket'}
                currentDetail={currentQualitativeAdjustments.geographyBucket || 'No current geography bucket'}
              />
              <FactorDeltaCard
                label="Level 1 family factor"
                baseline={baselineQualitativeAdjustments.level1AdjustmentFactor}
                current={currentQualitativeAdjustments.level1AdjustmentFactor}
                baselineDetail={baselineQualitativeAdjustments.level1Bucket || 'No baseline family bucket'}
                currentDetail={currentQualitativeAdjustments.level1Bucket || 'No current family bucket'}
              />
              <FactorDeltaCard
                label="Transaction-context factor"
                baseline={baselineQualitativeAdjustments.transactionContextFactor}
                current={currentQualitativeAdjustments.transactionContextFactor}
                baselineDetail={baselineQualitativeAdjustments.transactionContextLabel || 'No baseline transaction context'}
                currentDetail={currentQualitativeAdjustments.transactionContextLabel || 'No current transaction context'}
              />
              <FactorDeltaCard
                label="Urgency factor"
                baseline={baselineQualitativeAdjustments.achievableUrgencyFactor}
                current={currentQualitativeAdjustments.achievableUrgencyFactor}
                baselineDetail={baselineResult?.engagement.urgency || 'No baseline urgency'}
                currentDetail={currentResult?.engagement.urgency || 'No current urgency'}
              />
              <FactorDeltaCard
                label="Market-position factor"
                baseline={baselineQualitativeAdjustments.marketPositionAdjustmentFactor}
                current={currentQualitativeAdjustments.marketPositionAdjustmentFactor}
                baselineDetail={
                  typeof baselineQualitativeAdjustments.marketPositionSignalScore === 'number'
                    ? `Signal score ${baselineQualitativeAdjustments.marketPositionSignalScore}`
                    : 'No baseline market-position score'
                }
                currentDetail={
                  typeof currentQualitativeAdjustments.marketPositionSignalScore === 'number'
                    ? `Signal score ${currentQualitativeAdjustments.marketPositionSignalScore}`
                    : 'No current market-position score'
                }
              />
              <FactorDeltaCard
                label="FX sensitivity factor"
                baseline={baselineQualitativeAdjustments.fxExposureAdjustmentFactor}
                current={currentQualitativeAdjustments.fxExposureAdjustmentFactor}
                baselineDetail={baselineQualitativeAdjustments.fxExposure || 'No baseline FX exposure'}
                currentDetail={currentQualitativeAdjustments.fxExposure || 'No current FX exposure'}
              />
              <FactorDeltaCard
                label="Branch-quality factor"
                baseline={baselineQualitativeAdjustments.branchQualityFactor}
                current={currentQualitativeAdjustments.branchQualityFactor}
                baselineDetail={
                  baselineQualitativeAdjustments.branchFamily
                    ? `${baselineQualitativeAdjustments.branchFamily} · score ${baselineQualitativeAdjustments.branchSignalScore ?? '—'}`
                    : 'No baseline branch factor'
                }
                currentDetail={
                  currentQualitativeAdjustments.branchFamily
                    ? `${currentQualitativeAdjustments.branchFamily} · score ${currentQualitativeAdjustments.branchSignalScore ?? '—'}`
                    : 'No current branch factor'
                }
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => void handleRunCurrent()} disabled={running}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                Re-run valuation
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleRunQuestionImpact()}
                disabled={!baselineResult || impactQuestions.length === 0 || questionImpactRunning}
              >
                {questionImpactRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                Refresh question impact
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

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="gap-2 border-b border-slate-200">
                <CardTitle>Question impact from baseline</CardTitle>
                <CardDescription>
                  Each row isolates one changed question against the saved baseline so you can see how much it adds or removes from value, readiness, and confidence.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  These isolated deltas are run one question at a time from the selected baseline. They are meant for diagnosis, so they will not always sum exactly to the full scenario change when multiple questions interact.
                </div>
                {!baselineResult ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
                    Pick a saved baseline first. The impact board compares your edited scenario against that baseline.
                  </div>
                ) : impactQuestions.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
                    No changed scored questions yet. Edit something and re-run valuation to see isolated movement from the baseline.
                  </div>
                ) : questionImpactRows.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
                    Re-run valuation or refresh question impact to generate isolated deltas for the {impactQuestions.length} changed question{impactQuestions.length === 1 ? '' : 's'}.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {questionImpactRows.map((row) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-slate-950">{row.prompt}</div>
                            <div className="text-sm text-slate-500">{row.changeSummary}</div>
                          </div>
                          {row.adjustedValueDelta === 0 && row.readinessDelta === 0 && row.confidenceDelta === 0 ? (
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                              No measurable change
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Value delta</div>
                            <div className={`mt-1 text-sm font-semibold ${row.adjustedValueDelta > 0 ? 'text-emerald-600' : row.adjustedValueDelta < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                              {row.adjustedValueDelta === 0 ? '₦0.00m' : `${row.adjustedValueDelta > 0 ? '+' : '-'}${formatMillionsPrecise(Math.abs(row.adjustedValueDelta))}`}
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Readiness delta</div>
                            <div className={`mt-1 text-sm font-semibold ${row.readinessDelta > 0 ? 'text-emerald-600' : row.readinessDelta < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                              {row.readinessDelta === 0 ? '0' : `${row.readinessDelta > 0 ? '+' : ''}${row.readinessDelta.toFixed(1)}`}
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Confidence delta</div>
                            <div className={`mt-1 text-sm font-semibold ${row.confidenceDelta > 0 ? 'text-emerald-600' : row.confidenceDelta < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                              {row.confidenceDelta === 0 ? '0' : `${row.confidenceDelta > 0 ? '+' : ''}${row.confidenceDelta.toFixed(1)}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <p className="text-xs leading-5 text-slate-500">
                    Direction check tests whether the selected metric moves consistently in the intended direction across the question&apos;s built-in option order.
                  </p>
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
                  <CardDescription>
                    All runs below used the same draft baseline, with only the selected question changed. The default view keeps the math-focused columns and hides constant diagnostic columns unless they actually vary across the matrix. Each row reads baseline, then delta, then current value so the movement is explicit. Selected metric: {selectedSensitivityMetricOption.label}. Adjusted value is the actual valuation midpoint for each run.
                    {sensitivityMetricIsAdjustedValue
                      ? ' Selected-metric columns are hidden here because they would duplicate adjusted value exactly.'
                      : ' Selected-metric columns show the baseline metric, its delta versus baseline, and the current metric; they are not added to adjusted value.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 overflow-x-auto pt-6">
                  {sensitivityBaselineRow ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Baseline for this matrix: <span className="font-semibold text-slate-900">{formatMillionsPrecise(sensitivityBaselineRow.summary.preciseAdjustedValue ?? sensitivityBaselineRow.summary.adjustedValue)}</span> adjusted value,{' '}
                      <span className="font-semibold text-slate-900">{sensitivityBaselineRow.summary.readinessScore.toFixed(1)}</span> readiness,{' '}
                      <span className="font-semibold text-slate-900">{sensitivityBaselineRow.summary.confidenceScore.toFixed(1)}</span> confidence, and{' '}
                      <span className="font-semibold text-slate-900">
                        {formatFactor((sensitivityBaselineRow.result.valueConclusion?.reconciliation?.qualitativeAdjustments || sensitivityBaselineRow.result.audit?.qualitativeAdjustments || {}).marketPositionAdjustmentFactor)}
                      </span>{' '}
                      market-position factor, <span className="font-semibold text-slate-900">{sensitivityBaselineRow.result.confidenceAssessment.rangeWidthPct.toFixed(1)}%</span> range width, and{' '}
                      <span className="font-semibold text-slate-900">{formatMillionsPrecise(sensitivityNormalizationMetric.getValue(sensitivityBaselineRow.result))}</span> {sensitivityNormalizationMetric.label.toLowerCase()}.
                    </div>
                  ) : null}
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="px-3 py-2 font-medium">Option</th>
                        {!sensitivityMetricIsAdjustedValue ? (
                          <th className="px-3 py-2 font-medium">Baseline {sensitivityMetricColumnLabel}</th>
                        ) : null}
                        {!sensitivityMetricIsAdjustedValue ? (
                          <th className="px-3 py-2 font-medium">{sensitivityMetricDeltaColumnLabel}</th>
                        ) : null}
                        {!sensitivityMetricIsAdjustedValue ? (
                          <th className="px-3 py-2 font-medium">{sensitivityMetricColumnLabel}</th>
                        ) : null}
                        <th className="px-3 py-2 font-medium">Baseline adjusted value</th>
                        <th className="px-3 py-2 font-medium">Adjusted value Δ</th>
                        <th className="px-3 py-2 font-medium">Adjusted value</th>
                        {showSensitivityReadinessColumn ? <th className="px-3 py-2 font-medium">Readiness</th> : null}
                        {showSensitivityConfidenceColumn ? <th className="px-3 py-2 font-medium">Confidence</th> : null}
                        {showSensitivityRangeWidthColumn ? <th className="px-3 py-2 font-medium">Range width</th> : null}
                        <th className="px-3 py-2 font-medium">Market factor</th>
                        <th className="px-3 py-2 font-medium">Baseline {sensitivityNormalizationMetric.label}</th>
                        <th className="px-3 py-2 font-medium">{sensitivityNormalizationMetric.label} Δ</th>
                        <th className="px-3 py-2 font-medium">{sensitivityNormalizationMetric.label}</th>
                        {showSensitivityMethodColumn ? <th className="px-3 py-2 font-medium">Method</th> : null}
                        {showSensitivityBranchFactorColumn ? <th className="px-3 py-2 font-medium">Branch factor</th> : null}
                        {showSensitivityGeoFactorColumn ? <th className="px-3 py-2 font-medium">Geo factor</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivityRows.map((row) => (
                        <tr key={row.label} className="border-b border-slate-100 text-slate-800">
                          <td className="px-3 py-3 align-top font-medium">{row.label}</td>
                          {!sensitivityMetricIsAdjustedValue ? (
                            <td className="px-3 py-3 align-top">
                              {sensitivityBaselineRow
                                ? formatSensitivityMetricValue(sensitivityBaselineRow.metricValue)
                                : '—'}
                            </td>
                          ) : null}
                          {!sensitivityMetricIsAdjustedValue ? (
                            <td className="px-3 py-3 align-top">
                              {sensitivityBaselineRow
                                ? (() => {
                                    const baselineMetricValue = getMetricValue(sensitivityBaselineRow);
                                    const currentMetricValue = getMetricValue(row);
                                    const delta =
                                      Number.isFinite(baselineMetricValue) && Number.isFinite(currentMetricValue)
                                        ? currentMetricValue - baselineMetricValue
                                        : NaN;
                                    return (
                                      <span className={delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-600'}>
                                        {Number.isFinite(delta)
                                          ? `${delta > 0 ? '+' : ''}${delta.toLocaleString('en-NG', {
                                              minimumFractionDigits: 0,
                                              maximumFractionDigits: 3,
                                            })}`
                                          : '—'}
                                      </span>
                                    );
                                  })()
                                : '—'}
                            </td>
                          ) : null}
                          {!sensitivityMetricIsAdjustedValue ? (
                            <td className="px-3 py-3 align-top">
                              {formatSensitivityMetricValue(row.metricValue)}
                            </td>
                          ) : null}
                          <td className="px-3 py-3 align-top">
                            {sensitivityBaselineRow
                              ? formatMillionsPrecise(
                                  sensitivityBaselineRow.summary.preciseAdjustedValue ?? sensitivityBaselineRow.summary.adjustedValue
                                )
                              : '—'}
                          </td>
                          <td className="px-3 py-3 align-top">
                            {sensitivityBaselineRow ? (
                              (() => {
                                const baselineAdjustedValue =
                                  sensitivityBaselineRow.summary.preciseAdjustedValue ?? sensitivityBaselineRow.summary.adjustedValue;
                                const currentAdjustedValue = row.summary.preciseAdjustedValue ?? row.summary.adjustedValue;
                                const delta = currentAdjustedValue - baselineAdjustedValue;
                                return (
                                  <span
                                    className={
                                        delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-600'
                                    }
                                  >
                                    {formatSignedMillionsDelta(delta)}
                                  </span>
                                );
                              })()
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-3 align-top">{formatMillionsPrecise(row.summary.preciseAdjustedValue ?? row.summary.adjustedValue)}</td>
                          {showSensitivityReadinessColumn ? <td className="px-3 py-3 align-top">{row.summary.readinessScore.toFixed(1)}</td> : null}
                          {showSensitivityConfidenceColumn ? <td className="px-3 py-3 align-top">{row.summary.confidenceScore.toFixed(1)}</td> : null}
                          {showSensitivityRangeWidthColumn ? (
                            <td className="px-3 py-3 align-top">{row.result.confidenceAssessment.rangeWidthPct.toFixed(1)}%</td>
                          ) : null}
                          <td className="px-3 py-3 align-top">{row.summary.marketPositionAdjustmentFactor.toFixed(3)}</td>
                          <td className="px-3 py-3 align-top">
                            {sensitivityBaselineRow
                              ? formatMillionsPrecise(sensitivityNormalizationMetric.getValue(sensitivityBaselineRow.result))
                              : '—'}
                          </td>
                          <td className="px-3 py-3 align-top">
                            {sensitivityBaselineRow
                              ? (() => {
                                  const baselineNormalization = sensitivityNormalizationMetric.getValue(sensitivityBaselineRow.result);
                                  const currentNormalization = sensitivityNormalizationMetric.getValue(row.result);
                                  const delta =
                                    typeof baselineNormalization === 'number' &&
                                    Number.isFinite(baselineNormalization) &&
                                    typeof currentNormalization === 'number' &&
                                    Number.isFinite(currentNormalization)
                                      ? currentNormalization - baselineNormalization
                                      : NaN;
                                  return (
                                    <span
                                      className={
                                        delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-600'
                                      }
                                    >
                                      {formatSignedMillionsDelta(delta)}
                                    </span>
                                  );
                                })()
                              : '—'}
                          </td>
                          <td className="px-3 py-3 align-top">{formatMillionsPrecise(sensitivityNormalizationMetric.getValue(row.result))}</td>
                          {showSensitivityMethodColumn ? <td className="px-3 py-3 align-top">{row.summary.primaryMethod}</td> : null}
                          {showSensitivityBranchFactorColumn ? <td className="px-3 py-3 align-top">{row.summary.branchQualityFactor.toFixed(3)}</td> : null}
                          {showSensitivityGeoFactorColumn ? <td className="px-3 py-3 align-top">{row.summary.geographyAdjustmentFactor.toFixed(3)}</td> : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            {auditError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{auditError}</div>
            ) : null}
            <div className="grid gap-4 xl:grid-cols-5">
              <SummaryDeltaCard label="Passing" baseline={0} current={questionAuditReport?.summary.passing} />
              <SummaryDeltaCard label="Wrong direction" baseline={0} current={questionAuditReport?.summary.wrongDirection} />
              <SummaryDeltaCard label="No effect" baseline={0} current={questionAuditReport?.summary.noEffect} />
              <SummaryDeltaCard label="Method switch" baseline={0} current={questionAuditReport?.summary.methodSwitch} />
              <SummaryDeltaCard label="Structural" baseline={0} current={questionAuditReport?.summary.structural} />
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="gap-2 border-b border-slate-200">
                <CardTitle>Audit setup</CardTitle>
                <CardDescription>
                  This view runs against the live manifest and engine. Use it to inspect expected direction, per-question status, baseline fit, and the full formula ledger behind each row.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 pt-6 xl:grid-cols-[1.2fr_1fr]">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="auditQuestion">
                    Question
                  </label>
                  <select
                    id="auditQuestion"
                    value={selectedAuditQuestionId}
                    onChange={(event) => setSelectedAuditQuestionId(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
                  >
                    <option value="">Select a question</option>
                    {(questionAuditReport?.results || []).map((entry) => (
                      <option key={entry.questionId} value={entry.questionId}>
                        {entry.manifestEntry.prompt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="auditBaseline">
                    Baseline
                  </label>
                  <select
                    id="auditBaseline"
                    value={effectiveAuditBaselineId}
                    onChange={(event) => setSelectedAuditBaselineId(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
                  >
                    {auditBaselineOptions.map((baseline) => (
                      <option key={baseline.id} value={baseline.id}>
                        {baseline.label}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="gap-2 border-b border-slate-200">
                <CardTitle>Audit status table</CardTitle>
                <CardDescription>
                  Every live question is classified as passing, structural by design, or context-only by design. Select any row to inspect the option-by-option run and the formula ledger.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto pt-6">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-3 py-2 font-medium">Question</th>
                      <th className="px-3 py-2 font-medium">Class</th>
                      <th className="px-3 py-2 font-medium">Domains</th>
                      <th className="px-3 py-2 font-medium">Metric</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(questionAuditReport?.results || []).map((entry) => (
                      <tr
                        key={entry.questionId}
                        className={`cursor-pointer border-b border-slate-100 text-slate-800 ${
                          entry.questionId === selectedAuditQuestionId ? 'bg-purple-50/60' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedAuditQuestionId(entry.questionId)}
                      >
                        <td className="px-3 py-3 align-top">
                          <div className="font-medium">{entry.manifestEntry.prompt}</div>
                          <div className="text-xs text-slate-500">{entry.questionId}</div>
                        </td>
                        <td className="px-3 py-3 align-top">{entry.manifestEntry.auditClass}</td>
                        <td className="px-3 py-3 align-top">{entry.manifestEntry.allowedImpactDomains.join(', ')}</td>
                        <td className="px-3 py-3 align-top">{entry.manifestEntry.primaryMetricPath || '—'}</td>
                        <td className="px-3 py-3 align-top">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClasses(entry.status.overallStatus)}`}>
                            {formatStatusLabel(entry.status.overallStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {effectiveAuditEntry ? (
              <>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="gap-2 border-b border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-2">
                        <CardTitle>{effectiveAuditEntry.manifestEntry.prompt}</CardTitle>
                        <CardDescription>
                          Canonical path: <span className="font-medium text-slate-700">{effectiveAuditEntry.manifestEntry.canonicalPath || 'context-only'}</span>
                        </CardDescription>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClasses(effectiveAuditEntry.status.overallStatus)}`}>
                        {formatStatusLabel(effectiveAuditEntry.status.overallStatus)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid gap-4 xl:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Expected direction</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{effectiveAuditEntry.manifestEntry.expectedDirection || 'Non-monotonic by design'}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Monotonicity</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{formatStatusLabel(effectiveAuditEntry.manifestEntry.monotonicity)}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Affected outputs</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{effectiveAuditEntry.manifestEntry.expectedAffectedOutputs.join(', ')}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Failure reasons</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">
                          {effectiveAuditEntry.status.failureReasons.length ? effectiveAuditEntry.status.failureReasons.join(', ') : 'None'}
                        </div>
                      </div>
                    </div>

                    {effectiveAuditBaselineRow ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Assigned baseline: <span className="font-semibold text-slate-900">{effectiveAuditEntry.baseline?.label || 'Custom baseline'}</span>. Baseline outcome is{' '}
                        <span className="font-semibold text-slate-900">{formatMillionsPrecise(effectiveAuditBaselineRow.summary.preciseAdjustedValue ?? effectiveAuditBaselineRow.summary.adjustedValue)}</span> adjusted value,{' '}
                        <span className="font-semibold text-slate-900">{effectiveAuditBaselineRow.summary.readinessScore.toFixed(1)}</span> readiness, and{' '}
                        <span className="font-semibold text-slate-900">{effectiveAuditBaselineRow.summary.confidenceScore.toFixed(1)}</span> confidence.
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="gap-2 border-b border-slate-200">
                      <CardTitle>Option-by-option audit rows</CardTitle>
                      <CardDescription>
                        Each row holds the baseline constant and changes only this question. Select a row to inspect the factor stack and ledger.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 overflow-x-auto pt-6">
                      {questionAuditLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading audit detail…
                        </div>
                      ) : (
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500">
                              <th className="px-3 py-2 font-medium">Option</th>
                              <th className="px-3 py-2 font-medium">Metric</th>
                              <th className="px-3 py-2 font-medium">Metric Δ</th>
                              <th className="px-3 py-2 font-medium">Adjusted value</th>
                              <th className="px-3 py-2 font-medium">Readiness</th>
                              <th className="px-3 py-2 font-medium">Confidence</th>
                              <th className="px-3 py-2 font-medium">Method</th>
                            </tr>
                          </thead>
                          <tbody>
                            {effectiveAuditEntry.rows.map((row) => (
                              <tr
                                key={row.label}
                                className={`cursor-pointer border-b border-slate-100 text-slate-800 ${
                                  effectiveAuditRow?.label === row.label ? 'bg-purple-50/60' : 'hover:bg-slate-50'
                                }`}
                                onClick={() => setSelectedAuditRowLabel(row.label)}
                              >
                                <td className="px-3 py-3 align-top font-medium">{row.label}</td>
                                <td className="px-3 py-3 align-top">{formatSensitivityMetricValue(row.metricValue)}</td>
                                <td className="px-3 py-3 align-top">
                                  {typeof row.metricDelta === 'number'
                                    ? `${row.metricDelta > 0 ? '+' : ''}${row.metricDelta.toLocaleString('en-NG', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 3,
                                      })}`
                                    : '—'}
                                </td>
                                <td className="px-3 py-3 align-top">{formatMillionsPrecise(row.summary.preciseAdjustedValue ?? row.summary.adjustedValue)}</td>
                                <td className="px-3 py-3 align-top">{row.summary.readinessScore.toFixed(1)}</td>
                                <td className="px-3 py-3 align-top">{row.summary.confidenceScore.toFixed(1)}</td>
                                <td className="px-3 py-3 align-top">{row.summary.primaryMethod}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    {effectiveAuditRow ? (
                      <>
                        <div className="grid gap-4 xl:grid-cols-2">
                          <FactorDeltaCard
                            label="Geography factor"
                            baseline={auditBaselineQualitativeAdjustments.geographyAdjustmentFactor}
                            current={auditRowQualitativeAdjustments.geographyAdjustmentFactor}
                            baselineDetail={auditBaselineQualitativeAdjustments.geographyBucket || 'No baseline geography bucket'}
                            currentDetail={auditRowQualitativeAdjustments.geographyBucket || 'No current geography bucket'}
                          />
                          <FactorDeltaCard
                            label="Level 1 factor"
                            baseline={auditBaselineQualitativeAdjustments.level1AdjustmentFactor}
                            current={auditRowQualitativeAdjustments.level1AdjustmentFactor}
                            baselineDetail={auditBaselineQualitativeAdjustments.level1Bucket || 'No baseline family bucket'}
                            currentDetail={auditRowQualitativeAdjustments.level1Bucket || 'No current family bucket'}
                          />
                          <FactorDeltaCard
                            label="Transaction-context factor"
                            baseline={auditBaselineQualitativeAdjustments.transactionContextFactor}
                            current={auditRowQualitativeAdjustments.transactionContextFactor}
                            baselineDetail={auditBaselineQualitativeAdjustments.transactionContextLabel || 'No baseline context'}
                            currentDetail={auditRowQualitativeAdjustments.transactionContextLabel || 'No current context'}
                          />
                          <FactorDeltaCard
                            label="Urgency factor"
                            baseline={auditBaselineQualitativeAdjustments.achievableUrgencyFactor}
                            current={auditRowQualitativeAdjustments.achievableUrgencyFactor}
                            baselineDetail={effectiveAuditBaselineRow?.result.engagement.urgency || 'No baseline urgency'}
                            currentDetail={effectiveAuditRow.result.engagement.urgency || 'No current urgency'}
                          />
                          <FactorDeltaCard
                            label="Market-position factor"
                            baseline={auditBaselineQualitativeAdjustments.marketPositionAdjustmentFactor}
                            current={auditRowQualitativeAdjustments.marketPositionAdjustmentFactor}
                            baselineDetail={
                              typeof auditBaselineQualitativeAdjustments.marketPositionSignalScore === 'number'
                                ? `Signal score ${auditBaselineQualitativeAdjustments.marketPositionSignalScore}`
                                : 'No baseline market-position score'
                            }
                            currentDetail={
                              typeof auditRowQualitativeAdjustments.marketPositionSignalScore === 'number'
                                ? `Signal score ${auditRowQualitativeAdjustments.marketPositionSignalScore}`
                                : 'No current market-position score'
                            }
                          />
                          <FactorDeltaCard
                            label="Branch-quality factor"
                            baseline={auditBaselineQualitativeAdjustments.branchQualityFactor}
                            current={auditRowQualitativeAdjustments.branchQualityFactor}
                            baselineDetail={
                              auditBaselineQualitativeAdjustments.branchFamily
                                ? `${auditBaselineQualitativeAdjustments.branchFamily} · score ${auditBaselineQualitativeAdjustments.branchSignalScore ?? '—'}`
                                : 'No baseline branch factor'
                            }
                            currentDetail={
                              auditRowQualitativeAdjustments.branchFamily
                                ? `${auditRowQualitativeAdjustments.branchFamily} · score ${auditRowQualitativeAdjustments.branchSignalScore ?? '—'}`
                                : 'No current branch factor'
                            }
                          />
                        </div>

                        <Card className="border-slate-200 shadow-sm">
                          <CardHeader className="gap-2 border-b border-slate-200">
                            <CardTitle>Formula ledger</CardTitle>
                            <CardDescription>
                              This is the machine-readable calculation trace for the selected audit row.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <pre className="max-h-[36rem] overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                              {stringifyJson(effectiveAuditRow.result.audit?.calculationLedger || {})}
                            </pre>
                          </CardContent>
                        </Card>
                      </>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
