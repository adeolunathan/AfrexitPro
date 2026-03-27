import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { anchorQuestions, getVisibleClosingQuestions } from '@/data/adaptive-question-bank';
import { detectBranches, getBranchQuestions, type BranchModule, type BranchQuestion } from '@/data/branch-modules';
import { formatRange } from '@/api/valuation-partial';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { CurrencyInput } from '@/components/CurrencyInput';
import { LiveEstimateDebugPanel } from '@/components/LiveEstimateDebugPanel';
import {
  FinancialSpreadsheet,
  buildFinancialPeriodsFromAnswers,
  getDefaultFinancialPeriods,
  getFinancialPeriodById,
  normalizeFinancialPeriods,
  type FinancialPeriod,
} from '@/components/FinancialSpreadsheet';
import { OptionListInput } from '@/components/OptionListInput';
import { QuestionHelpTooltip } from '@/components/QuestionHelpTooltip';
import type { FormData } from '@/types/valuation';
import type { Question } from '@/data/adaptive-question-bank';
import { resolveQuestionCopy } from '@/lib/adaptive-question-copy';
import { parseMillionsNumber } from '@/lib/million-currency';
import { useLivePreviewDebugToggle, useOwnerLivePreview } from '@/hooks/use-owner-live-preview';
import { level2ByLevel1 } from '@/valuation-engine/policy-registry';

interface AdaptiveQuestionnaireProps {
  formData: FormData;
  onUpdate: (patch: FormData) => void;
  onSubmit: () => void;
  onBackToLanding: () => void;
  isSubmitting: boolean;
}

type Phase = 'anchor' | 'preliminary' | 'branch' | 'closing';

// Key for storing financial periods in formData
const FINANCIAL_PERIODS_KEY = '_financialPeriods';

export function AdaptiveQuestionnaire({
  formData,
  onUpdate,
  onSubmit,
  onBackToLanding,
  isSubmitting,
}: AdaptiveQuestionnaireProps) {
  const [phase, setPhase] = useState<Phase>('anchor');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [error, setError] = useState('');
  const [activeBranches, setActiveBranches] = useState<BranchModule[]>([]);
  const [currentBranchIndex, setCurrentBranchIndex] = useState(0);
  const hasSyncedFinancialPeriods = useRef(false);
  const { debugAvailable, debugEnabled, setDebugEnabled } = useLivePreviewDebugToggle();
  const {
    result: preliminaryResult,
    previousResult: previousPreviewResult,
    isCalculating,
    isResultCurrent,
  } = useOwnerLivePreview(formData, {
    debounceMs: phase === 'anchor' ? 260 : 450,
  });
  
  // Financial periods state for the spreadsheet
  const [financialPeriods, setFinancialPeriods] = useState<FinancialPeriod[]>(() => {
    const saved = formData[FINANCIAL_PERIODS_KEY];
    if (saved && Array.isArray(saved)) {
      return normalizeFinancialPeriods(saved);
    }
    return buildFinancialPeriodsFromAnswers(formData);
  });

  const visibleClosingQuestions = useMemo(() => getVisibleClosingQuestions(formData), [formData]);

  // Get current questions based on phase
  const currentQuestions = useMemo(() => {
    if (phase === 'anchor') return anchorQuestions;
    if (phase === 'branch' && activeBranches.length > 0) {
      const branch = activeBranches[currentBranchIndex];
      return getBranchQuestions(branch, formData);
    }
    if (phase === 'closing') return visibleClosingQuestions;
    return [];
  }, [phase, activeBranches, currentBranchIndex, formData, visibleClosingQuestions]);

  const currentQuestion = currentQuestions[questionIndex];
  const isLastQuestion = phase === 'closing' && questionIndex === currentQuestions.length - 1;
  const isFinancialTableQuestion = currentQuestion?.type === 'financial_table';

  // Detect branches as soon as classification and answers are available
  useEffect(() => {
    const level2 = String(formData.level2 || '');
    const branches = detectBranches(level2, formData);
    setActiveBranches(branches);
  }, [formData]);

  // Scroll to top on question change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [questionIndex, phase, currentBranchIndex]);

  // Get Level 2 options based on Level 1
  const level2Options = useMemo(() => {
    const level1 = String(formData.level1 || '');
    return level2ByLevel1[level1] || [];
  }, [formData.level1]);

  // Calculate total questions
  const totalQuestions = useMemo(() => {
    const anchorCount = anchorQuestions.length;
    const closingCount = visibleClosingQuestions.length;
    const branchCount = activeBranches.reduce(
      (total, branch) => total + getBranchQuestions(branch, formData).length,
      0
    );
    return anchorCount + branchCount + closingCount;
  }, [activeBranches, formData, visibleClosingQuestions.length]);

  // Calculate current question number
  const globalQuestionNumber = useMemo(() => {
    if (phase === 'anchor') return questionIndex + 1;
    if (phase === 'branch') {
      const previousBranches = activeBranches.slice(0, currentBranchIndex);
      const previousBranchQuestions = previousBranches.reduce(
        (total, branch) => total + getBranchQuestions(branch, formData).length,
        0
      );
      return anchorQuestions.length + previousBranchQuestions + questionIndex + 1;
    }
    // closing
    const allBranchQuestions = activeBranches.reduce(
      (total, branch) => total + getBranchQuestions(branch, formData).length,
      0
    );
    return anchorQuestions.length + allBranchQuestions + questionIndex + 1;
  }, [phase, questionIndex, currentBranchIndex, activeBranches, formData]);

  // Validate number input
  const validateNumberInput = (value: string): boolean => {
    if (!value) return true;
    return /^\d*\.?\d*$/.test(value);
  };

  const validateCurrentQuestion = useCallback(() => {
    if (!currentQuestion) return '';
    
    const question = currentQuestion as Question | BranchQuestion;
    
    // Special validation for financial table
    if (question.type === 'financial_table') {
      const latestPeriod = getFinancialPeriodById(financialPeriods, 'latest');
      if (!latestPeriod.revenue || !latestPeriod.operatingProfit) {
        return 'Please enter at least the revenue and profit for the latest year';
      }
      return '';
    }
    
    const value = formData[question.id];
    
    // Required check
    if (question.required) {
      if (question.type === 'checkbox') {
        if (value !== true) {
          return 'Please confirm to continue';
        }
      } else if (!value || String(value).trim() === '') {
        return 'This question is required';
      }
    }
    
    // Number/currency validation
    if ((question.type === 'number' || question.type === 'currency') && value) {
      const numValue = question.type === 'currency'
        ? parseMillionsNumber(value, { allowNegative: question.min !== undefined && question.min < 0 })
        : Number(String(value).trim());
      if (numValue === null || isNaN(numValue) || numValue < 0) {
        return 'Please enter a valid positive number';
      }
      if (question.min !== undefined && numValue < question.min) {
        return question.type === 'currency'
          ? `Value must be at least ₦${question.min.toLocaleString('en-NG', { maximumFractionDigits: 2 })}m`
          : `Value must be at least ${question.min.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
      }
      if (question.max !== undefined && numValue > question.max) {
        return question.type === 'currency'
          ? `Value must not exceed ₦${question.max.toLocaleString('en-NG', { maximumFractionDigits: 2 })}m`
          : `Value must not exceed ${question.max.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
      }
    }
    
    // Special validation for Level 2
    if (question.id === 'level2' && !formData.level2) {
      return 'Please select a business model';
    }
    
    return '';
  }, [currentQuestion, formData, financialPeriods]);

  const handleNext = useCallback(() => {
    const validationError = validateCurrentQuestion();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    
    // Check if we're at the end of anchor phase
    if (phase === 'anchor' && questionIndex === anchorQuestions.length - 1) {
      setPhase('preliminary');
      return;
    }
    
    // Check if we're at the end of current branch
    if (phase === 'branch') {
      const currentBranchQuestions = currentQuestions.length;
      if (questionIndex === currentBranchQuestions - 1) {
        // Move to next branch or closing
        if (currentBranchIndex < activeBranches.length - 1) {
          setCurrentBranchIndex(prev => prev + 1);
          setQuestionIndex(0);
        } else {
          setPhase('closing');
          setQuestionIndex(0);
        }
        return;
      }
    }
    
    // Check if we're at the end of closing phase
    if (phase === 'closing' && questionIndex === currentQuestions.length - 1) {
      onSubmit();
      return;
    }
    
    // Move to next question
    setQuestionIndex((prev) => prev + 1);
  }, [phase, questionIndex, currentQuestions.length, currentBranchIndex, activeBranches.length, validateCurrentQuestion, onSubmit]);

  const handleBack = useCallback(() => {
    setError('');
    
    if (phase === 'preliminary') {
      setPhase('anchor');
      setQuestionIndex(anchorQuestions.length - 1);
      return;
    }
    
    if (phase === 'branch') {
      if (questionIndex === 0) {
        // Go back to previous branch or preliminary
        if (currentBranchIndex > 0) {
          setCurrentBranchIndex(prev => prev - 1);
          const prevBranch = activeBranches[currentBranchIndex - 1];
          const prevBranchQuestions = getBranchQuestions(prevBranch, formData);
          setQuestionIndex(prevBranchQuestions.length - 1);
        } else {
          setPhase('preliminary');
        }
        return;
      }
    }
    
    if (phase === 'closing' && questionIndex === 0) {
      // Go back to last branch or preliminary
      if (activeBranches.length > 0) {
        setPhase('branch');
        setCurrentBranchIndex(activeBranches.length - 1);
        const lastBranch = activeBranches[activeBranches.length - 1];
        const lastBranchQuestions = getBranchQuestions(lastBranch, formData);
        setQuestionIndex(lastBranchQuestions.length - 1);
      } else {
        setPhase('preliminary');
      }
      return;
    }
    
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    } else {
      onBackToLanding();
    }
  }, [phase, questionIndex, currentBranchIndex, activeBranches, formData, onBackToLanding]);

  const handleStartBranches = useCallback(() => {
    if (activeBranches.length === 0) {
      // No branches, go straight to closing
      setPhase('closing');
    } else {
      setPhase('branch');
      setCurrentBranchIndex(0);
      setQuestionIndex(0);
    }
  }, [activeBranches.length]);

  const updateField = useCallback((question: Question | BranchQuestion, value: string | boolean) => {
    // Clear error when user starts typing
    setError('');
    
    // Validate number input in real-time
    if (question.type === 'number' && typeof value === 'string') {
      if (!validateNumberInput(value)) {
        setError('Please enter numbers only');
        return;
      }
    }
    
    // If changing level1, reset level2
    if (question.id === 'level1') {
      onUpdate({
        [question.id]: value,
        level2: '',
      });
      return;
    }
    onUpdate({ [question.id]: value });
  }, [onUpdate]);

  // Handle financial spreadsheet changes
  const handleFinancialPeriodsChange = useCallback((periods: FinancialPeriod[]) => {
    setFinancialPeriods(periods);
    setError('');
    
    const updates: Partial<FormData> = {
      [FINANCIAL_PERIODS_KEY]: periods,
    };

    const latestPeriod = getFinancialPeriodById(periods, 'latest');
    const prior1Period = getFinancialPeriodById(periods, 'prior1');
    const prior2Period = getFinancialPeriodById(periods, 'prior2');

    updates.revenueLatest = latestPeriod.revenue;
    updates.operatingProfitLatest = latestPeriod.operatingProfit;
    updates.revenuePrevious1 = prior1Period.enabled ? prior1Period.revenue : '';
    updates.operatingProfitPrevious1 = prior1Period.enabled ? prior1Period.operatingProfit : '';
    updates.revenuePrevious2 = prior2Period.enabled ? prior2Period.revenue : '';
    updates.operatingProfitPrevious2 = prior2Period.enabled ? prior2Period.operatingProfit : '';
    
    onUpdate(updates);
  }, [onUpdate]);

  const handleFinancialReset = useCallback(() => {
    handleFinancialPeriodsChange(getDefaultFinancialPeriods());
  }, [handleFinancialPeriodsChange]);

  useEffect(() => {
    if (hasSyncedFinancialPeriods.current) {
      return;
    }

    hasSyncedFinancialPeriods.current = true;
    handleFinancialPeriodsChange(financialPeriods);
  }, [financialPeriods, handleFinancialPeriodsChange]);

  const getInputType = (question: Question | BranchQuestion) => {
    if (question.type === 'number') return 'text';
    if (question.type === 'tel') return 'tel';
    if (question.type === 'email') return 'email';
    return 'text';
  };

  const getInputMode = (question: Question | BranchQuestion) => {
    if (question.type === 'number' || question.type === 'currency') return 'decimal';
    if (question.type === 'tel') return 'tel';
    return undefined;
  };

  const renderDebugToggle = () =>
    debugAvailable ? (
      <div className="mb-4 flex items-center justify-end gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Internal live debug</span>
        <Switch checked={debugEnabled} onCheckedChange={setDebugEnabled} />
      </div>
    ) : null;

  const renderDebugPanel = () =>
    debugEnabled && preliminaryResult ? (
      <LiveEstimateDebugPanel
        result={preliminaryResult}
        previousResult={previousPreviewResult}
      />
    ) : null;

  // Render preliminary range screen
  if (phase === 'preliminary') {
    const level2Label = level2Options.find(o => o.value === formData.level2)?.label || 'your business';
    const hasBranches = activeBranches.length > 0;
    const showPreliminaryLoading = isCalculating || !isResultCurrent;
    
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {renderDebugToggle()}
          <div className={debugEnabled && preliminaryResult ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start xl:gap-8' : ''}>
            <div>
              {/* Header */}
              <div className="mb-8 text-center">
                <p className="mb-2 text-sm font-medium uppercase tracking-wider text-purple-600">
                  Preliminary Assessment
                </p>
                <h1 className="text-3xl font-bold text-gray-900">
                  Based on {level2Label}
                </h1>
                <p className="mt-2 text-gray-600">
                  with ₦{Number(formData.revenueLatest || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}m revenue
                </p>
              </div>

              {showPreliminaryLoading ? (
                <div className="mb-8 rounded-2xl bg-white p-12 text-center shadow-lg">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
                  <p className="text-lg text-gray-600">Refreshing your preliminary valuation with the latest answers...</p>
                </div>
              ) : preliminaryResult ? (
                <>
                  {/* Range Card */}
                  <div className="mb-8 rounded-2xl bg-white p-8 shadow-lg">
                    <p className="mb-2 text-sm text-gray-500">Preliminary Valuation Range</p>
                    <p className="mb-4 text-4xl font-bold text-purple-600">
                      {formatRange(preliminaryResult.range.low, preliminaryResult.range.high)}
                    </p>
                    <p className="text-sm text-gray-600">
                      This range will tighten as we gather more details about your operations.
                    </p>
                  </div>

                  {/* Confidence Meter */}
                  <div className="mb-8">
                    <ConfidenceMeter
                      result={preliminaryResult}
                      questionsAnswered={anchorQuestions.length}
                      totalQuestions={totalQuestions}
                      phase="anchor"
                      previousRange={previousPreviewResult?.range}
                    />
                  </div>

                  {debugEnabled && preliminaryResult ? (
                    <div className="mb-8 xl:hidden">
                      {renderDebugPanel()}
                    </div>
                  ) : null}

                  {/* Branch Explanation */}
                  {hasBranches ? (
                    <div className="mb-8 rounded-xl border border-purple-100 bg-purple-50 p-6">
                      <p className="mb-3 text-sm font-medium text-purple-900">What's Next</p>
                      <p className="mb-3 text-purple-800">
                        Because you selected {level2Label}, we'll ask about:
                      </p>
                      <ul className="mb-3 space-y-1 text-sm text-purple-700">
                        {activeBranches.map(branch => (
                          <li key={branch.id} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500" />
                            {branch.shortDescription}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-purple-600">
                        ~{activeBranches.reduce((sum, b) => sum + b.estimatedMinutes, 0)} more minutes
                      </p>
                    </div>
                  ) : (
                    <div className="mb-8 rounded-xl border border-purple-100 bg-purple-50 p-6">
                      <p className="mb-3 text-sm font-medium text-purple-900">What's Next</p>
                      <p className="text-purple-800">
                        We'll now ask about your financial records, team, and working capital
                        to complete your valuation.
                      </p>
                      <p className="mt-2 text-sm text-purple-600">
                        ~6 more minutes
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 border-gray-300"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Review Answers
                    </Button>
                    <Button
                      onClick={handleStartBranches}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {hasBranches ? 'Continue Assessment' : 'Continue to Final Questions'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : null}
            </div>

            {debugEnabled && preliminaryResult ? (
              <aside className="hidden xl:block xl:sticky xl:top-24">
                {renderDebugPanel()}
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Get current phase title
  const getPhaseTitle = () => {
    if (phase === 'anchor') return 'Business Fundamentals';
    if (phase === 'branch' && activeBranches[currentBranchIndex]) {
      return activeBranches[currentBranchIndex].title;
    }
    return 'Final Assessment';
  };

  // Get phase description for branch
  const getPhaseDescription = () => {
    if (phase === 'branch' && activeBranches[currentBranchIndex]) {
      return activeBranches[currentBranchIndex].description;
    }
    return '';
  };

  // Render question screen
  const progress = totalQuestions > 0 ? Math.round((globalQuestionNumber / totalQuestions) * 100) : 0;
  const currentQuestionCopy = currentQuestion ? resolveQuestionCopy(currentQuestion, formData.respondentRole) : null;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
            >
              <img src="/logo-mark.png" alt="Afrexit" className="h-8 w-8" />
              <span className="font-semibold">Afrexit</span>
            </button>
            <span className="text-sm text-gray-500">
              Question {globalQuestionNumber} of ~{totalQuestions}
            </span>
          </div>
        </div>
        <div className="relative h-8 w-full overflow-hidden bg-slate-300">
          <div
            className="h-full bg-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
            {progress}% Complete
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {renderDebugToggle()}
        <div className={debugEnabled && preliminaryResult ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start xl:gap-8' : ''}>
          <div>
            {/* Phase Indicator */}
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-wider text-purple-600">
                {getPhaseTitle()}
              </p>
              {phase === 'branch' && (
                <p className="mt-1 text-sm text-gray-500">
                  Branch {currentBranchIndex + 1} of {activeBranches.length}
                </p>
              )}
            </div>

            {/* Branch Description */}
            {phase === 'branch' && getPhaseDescription() && (
              <div className="mb-6 rounded-lg border border-purple-100 bg-purple-50 p-4">
                <p className="text-sm text-purple-800">{getPhaseDescription()}</p>
              </div>
            )}

            {/* Real-time Confidence Meter (during branch/closing) */}
            {(phase === 'branch' || phase === 'closing') && preliminaryResult && (
              <div className="mb-6">
                <ConfidenceMeter
                  result={preliminaryResult}
                  questionsAnswered={globalQuestionNumber}
                  totalQuestions={totalQuestions}
                  phase={phase}
                  previousRange={previousPreviewResult?.range}
                />
              </div>
            )}

            {debugEnabled && preliminaryResult ? (
              <div className="mb-6 xl:hidden">
                {renderDebugPanel()}
              </div>
            ) : null}

            {/* Question Card */}
            <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-start gap-2">
                  <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                    {currentQuestionCopy?.prompt}
                  </h1>
                  {currentQuestionCopy?.tooltipText && <QuestionHelpTooltip content={currentQuestionCopy.tooltipText} />}
                </div>
                {currentQuestionCopy?.helperText && (
                  <p className="mt-2 text-sm text-gray-500">{currentQuestionCopy.helperText}</p>
                )}
              </div>

              {/* Input */}
              <div className="mb-6">
                {currentQuestion?.type === 'select' ? (
                  <OptionListInput
                    value={String(formData[currentQuestion.id] || '')}
                    onChange={(nextValue) => updateField(currentQuestion, nextValue)}
                    disabled={currentQuestion.id === 'level2' && level2Options.length === 0}
                    emptyLabel={currentQuestion.id === 'level2' && level2Options.length === 0 ? 'Select industry first' : 'No options available.'}
                    options={currentQuestion.id === 'level2' ? level2Options : currentQuestionCopy?.options || currentQuestion.options || []}
                  />
                ) : currentQuestion?.type === 'textarea' ? (
                  <textarea
                    value={String(formData[currentQuestion.id] || '')}
                    onChange={(e) => updateField(currentQuestion, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                ) : currentQuestion?.type === 'checkbox' ? (
                  <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={formData[currentQuestion.id] === true}
                      onChange={(e) => updateField(currentQuestion, e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-gray-300 accent-purple-600"
                    />
                    <span className="text-sm leading-6 text-gray-700">{currentQuestionCopy?.prompt}</span>
                  </label>
                ) : currentQuestion?.type === 'currency' ? (
                  <CurrencyInput
                    value={String(formData[currentQuestion.id] || '')}
                    onChange={(value) => updateField(currentQuestion, value)}
                    placeholder={currentQuestion.placeholder}
                    required={currentQuestion.required}
                    min={currentQuestion.min}
                    max={currentQuestion.max}
                  />
                ) : currentQuestion?.type === 'financial_table' ? (
                  <FinancialSpreadsheet
                    periods={financialPeriods}
                    onChange={handleFinancialPeriodsChange}
                  />
                ) : (
                  <Input
                    type={getInputType(currentQuestion)}
                    inputMode={getInputMode(currentQuestion)}
                    value={String(formData[currentQuestion.id] || '')}
                    onChange={(e) => updateField(currentQuestion, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="h-14 rounded-xl border-gray-200 px-4 text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-gray-300"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  {isFinancialTableQuestion ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFinancialReset}
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  ) : null}
                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isLastQuestion ? 'Get Valuation' : 'Continue'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Context Help */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Your answers are confidential and secure.</p>
            </div>
          </div>

          {debugEnabled && preliminaryResult ? (
            <aside className="hidden xl:block xl:sticky xl:top-24">
              {renderDebugPanel()}
            </aside>
          ) : null}
        </div>
      </main>
    </div>
  );
}
