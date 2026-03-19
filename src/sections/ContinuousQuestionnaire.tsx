import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Check, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { anchorQuestions, getVisibleClosingQuestions } from '@/data/adaptive-question-bank';
import { detectBranches, getBranchQuestions, type BranchModule, type BranchQuestion } from '@/data/branch-modules';
import { fetchPartialValuation, calculatePreliminaryRange, formatRange } from '@/api/valuation-partial';
import type { PartialValuationResult } from '@/api/valuation-partial';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import {
  FinancialSpreadsheet,
  buildFinancialPeriodsFromAnswers,
  getDefaultFinancialPeriods,
  getFinancialPeriodById,
  normalizeFinancialPeriods,
  type FinancialPeriod,
} from '@/components/FinancialSpreadsheet';
import { InlineCurrencyQuestionnaire } from '@/components/InlineCurrencyQuestionnaire';
import { OptionListInput } from '@/components/OptionListInput';
import { QuestionHelpTooltip } from '@/components/QuestionHelpTooltip';
import type { FormData } from '@/types/valuation';
import type { Question } from '@/data/adaptive-question-bank';
import { resolveQuestionCopy } from '@/lib/adaptive-question-copy';
import { level2ByLevel1 } from '@/valuation-engine/policy-registry';

// Currency questions that should be shown in inline spreadsheet format
const CURRENCY_QUESTION_IDS = [
  'receivablesLatest',
  'payablesLatest',
  'cashBalance',
  'ownerTotalCompensation',
  'marketManagerCompensation',
  'relatedPartyRentPaid',
  'marketRentEquivalent',
  'relatedPartyCompPaid',
  'marketRelatedPartyCompEquivalent',
  'privateExpensesAmount',
  'oneOffExpenseAmount',
  'oneOffIncomeAmount',
  'nonCoreIncomeAmount',
  'annualDepreciation',
  'financialDebt',
  'shareholderLoans',
];

interface ContinuousQuestionnaireProps {
  formData: FormData;
  onUpdate: (patch: FormData) => void;
  onSubmit: () => void;
  onBackToLanding: () => void;
  isSubmitting: boolean;
}

type Phase = 'anchor' | 'preliminary' | 'branch' | 'closing';

const FINANCIAL_PERIODS_KEY = '_financialPeriods';

// IDs of questions that should be grouped together (contact info)
const CONTACT_GROUP_IDS = ['businessName', 'firstName', 'email', 'whatsapp', 'termsAccepted'];

interface QuestionState {
  question: Question | BranchQuestion;
  phase: Phase;
  branchIndex?: number;
  answered: boolean;
}

export function ContinuousQuestionnaire({
  formData,
  onUpdate,
  onSubmit,
  onBackToLanding,
}: ContinuousQuestionnaireProps) {
  const [phase, setPhase] = useState<Phase>('anchor');
  const [visibleCount, setVisibleCount] = useState(1);
  const [preliminaryResult, setPreliminaryResult] = useState<PartialValuationResult | null>(null);
  const [activeBranches, setActiveBranches] = useState<BranchModule[]>([]);
  const [, setCurrentBranchIndex] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [, setPreviousRange] = useState<{ low: number; high: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement>>({});
  const hasSyncedFinancialPeriods = useRef(false);

  const [financialPeriods, setFinancialPeriods] = useState<FinancialPeriod[]>(() => {
    const saved = formData[FINANCIAL_PERIODS_KEY];
    if (saved && Array.isArray(saved)) {
      return normalizeFinancialPeriods(saved);
    }
    return buildFinancialPeriodsFromAnswers(formData);
  });

  // Check if a question should auto-advance on selection
  const shouldAutoAdvance = useCallback((question: Question | BranchQuestion): boolean => {
    // Dropdowns with single selection auto-advance
    if (question.type === 'select') return true;
    // Checkboxes auto-advance
    if (question.type === 'checkbox') return true;
    // Text inputs, textareas, currency, financial table do NOT auto-advance
    return false;
  }, []);

  // Check if question is part of contact group
  const isContactQuestion = useCallback((id: string): boolean => {
    return CONTACT_GROUP_IDS.includes(id);
  }, []);

  // Check if question is part of inline currency sequence
  const isCurrencyQuestion = useCallback((id: string): boolean => {
    return CURRENCY_QUESTION_IDS.includes(id);
  }, []);

  const visibleClosingQuestions = useMemo(() => getVisibleClosingQuestions(formData), [formData]);

  // Get all visible currency questions in order
  const currencyQuestions = useMemo(() => {
    return visibleClosingQuestions.filter(q => CURRENCY_QUESTION_IDS.includes(q.id));
  }, [visibleClosingQuestions]);
  const firstCurrencyQuestion = currencyQuestions[0];
  const allCurrencyAnswered = currencyQuestions.length > 0 && currencyQuestions.every(q => !!formData[q.id]);

  // Build flat list of all questions with their phases
  const allQuestions = useMemo<QuestionState[]>(() => {
    const questions: QuestionState[] = [];
    
    // Anchor questions
    anchorQuestions.forEach(q => {
      // Skip contact questions - they'll be grouped
      if (!isContactQuestion(q.id)) {
        questions.push({ question: q, phase: 'anchor', answered: !!formData[q.id] });
      }
    });
    
    // Add contact group as single item if we're in closing phase
    const contactQuestions = visibleClosingQuestions.filter(q => isContactQuestion(q.id));
    const allContactAnswered = contactQuestions.every(q => !!formData[q.id]);
    
    // Branch questions
    if (phase === 'branch' || phase === 'closing' || phase === 'preliminary') {
      activeBranches.forEach((branch, bIdx) => {
        getBranchQuestions(branch, formData).forEach(q => {
          questions.push({ 
            question: q, 
            phase: 'branch', 
            branchIndex: bIdx,
            answered: !!formData[q.id] 
          });
        });
      });
    }
    
    // Closing questions (excluding contact questions)
    if (phase === 'closing' || phase === 'preliminary') {
      let currencyGroupAdded = false;
      visibleClosingQuestions.forEach(q => {
        if (isContactQuestion(q.id)) {
          return;
        }
        if (isCurrencyQuestion(q.id)) {
          if (!currencyGroupAdded && firstCurrencyQuestion) {
            questions.push({ question: firstCurrencyQuestion, phase: 'closing', answered: allCurrencyAnswered });
            currencyGroupAdded = true;
          }
          return;
        }
        questions.push({ question: q, phase: 'closing', answered: !!formData[q.id] });
      });
      
      // Add contact group at the end
      if (contactQuestions.length > 0) {
        questions.push({
          question: contactQuestions[0],
          phase: 'closing',
          answered: allContactAnswered,
        } as QuestionState);
      }
    }
    
    return questions;
  }, [formData, activeBranches, phase, isContactQuestion, isCurrencyQuestion, visibleClosingQuestions, firstCurrencyQuestion, allCurrencyAnswered]);

  // Get currently visible questions
  const visibleQuestions = useMemo(() => {
    return allQuestions.slice(0, visibleCount);
  }, [allQuestions, visibleCount]);

  // Calculate preliminary result when anchor phase completes
  useEffect(() => {
    const anchorCompleted = allQuestions
      .filter(q => q.phase === 'anchor')
      .every(q => q.answered);
    
    if (anchorCompleted && phase === 'anchor' && !preliminaryResult && !isCalculating) {
      setIsCalculating(true);
      
      fetchPartialValuation(formData)
        .then(result => {
          setPreliminaryResult(result);
          setPreviousRange(result.range);
          setPhase('preliminary');
        })
        .catch(err => {
          console.log('Backend failed, using fallback:', err.message);
          const result = calculatePreliminaryRange(formData);
          setPreliminaryResult(result);
          setPreviousRange(result.range);
          setPhase('preliminary');
        })
        .finally(() => {
          setIsCalculating(false);
        });
      
      const level2 = String(formData.level2 || '');
      const branches = detectBranches(level2, formData);
      setActiveBranches(branches);
    }
  }, [allQuestions, formData, phase, preliminaryResult, isCalculating]);

  // Scroll to bottom when new question appears
  useEffect(() => {
    if (bottomRef.current && !editingQuestionId) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleCount, editingQuestionId]);

  const level2Options = useMemo(() => {
    const level1 = String(formData.level1 || '');
    return level2ByLevel1[level1] || [];
  }, [formData.level1]);

  const validateQuestion = useCallback((question: Question | BranchQuestion, value: unknown): string => {
    if (question.type === 'financial_table') {
      const latestPeriod = getFinancialPeriodById(financialPeriods, 'latest');
      if (!latestPeriod.revenue || !latestPeriod.operatingProfit) {
        return 'Please enter revenue and profit for the latest year';
      }
      return '';
    }
    
    if (question.required) {
      if (question.type === 'checkbox') {
        if (value !== true) return 'Please confirm to continue';
      } else if (!value || String(value).trim() === '') {
        return 'This question is required';
      }
    }
    
    if ((question.type === 'number' || question.type === 'currency') && value) {
      const numValue = Number(String(value).replace(/[^0-9]/g, ''));
      if (isNaN(numValue) || numValue < 0) return 'Please enter a valid positive number';
      if (question.min !== undefined && numValue < question.min) {
        return `Value must be at least ₦${question.min.toLocaleString()}`;
      }
    }
    
    return '';
  }, [financialPeriods]);

  const handleAnswer = useCallback((question: Question | BranchQuestion, value: string | boolean, autoAdvance = true) => {
    setErrors(prev => ({ ...prev, [question.id]: '' }));
    
    const error = validateQuestion(question, value);
    if (error) {
      setErrors(prev => ({ ...prev, [question.id]: error }));
      return;
    }
    
    if (question.id === 'level1') {
      onUpdate({ [question.id]: value, level2: '' });
    } else {
      onUpdate({ [question.id]: value });
    }
    
    // Only auto-advance if enabled for this question type
    if (autoAdvance && shouldAutoAdvance(question)) {
      const currentIdx = allQuestions.findIndex(q => q.question.id === question.id);
      if (currentIdx >= 0 && currentIdx === visibleCount - 1 && visibleCount < allQuestions.length) {
        setTimeout(() => {
          setVisibleCount(prev => prev + 1);
          setEditingQuestionId(null);
        }, 200);
      }
    }
  }, [allQuestions, visibleCount, onUpdate, validateQuestion, shouldAutoAdvance]);

  const handleNextClick = useCallback((question: Question | BranchQuestion) => {
    const value = formData[question.id];
    const error = validateQuestion(question, value);
    
    if (error) {
      setErrors(prev => ({ ...prev, [question.id]: error }));
      return;
    }
    
    const currentIdx = allQuestions.findIndex(q => q.question.id === question.id);
    if (currentIdx >= 0 && currentIdx === visibleCount - 1 && visibleCount < allQuestions.length) {
      setVisibleCount(prev => prev + 1);
      setEditingQuestionId(null);
    }
  }, [allQuestions, visibleCount, formData, validateQuestion]);

  const handleFinancialPeriodsChange = useCallback((periods: FinancialPeriod[]) => {
    setFinancialPeriods(periods);
    setErrors(prev => ({ ...prev, revenueLatest: '' }));
    
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

  useEffect(() => {
    if (hasSyncedFinancialPeriods.current) {
      return;
    }

    hasSyncedFinancialPeriods.current = true;
    handleFinancialPeriodsChange(financialPeriods);
  }, [financialPeriods, handleFinancialPeriodsChange]);

  const handleFinancialNext = useCallback(() => {
    const latestPeriod = getFinancialPeriodById(financialPeriods, 'latest');
    if (!latestPeriod.revenue || !latestPeriod.operatingProfit) {
      setErrors(prev => ({ ...prev, revenueLatest: 'Please enter revenue and profit for the latest year' }));
      return;
    }
    
    const currentIdx = allQuestions.findIndex(q => q.question.type === 'financial_table');
    if (currentIdx >= 0 && currentIdx === visibleCount - 1 && visibleCount < allQuestions.length) {
      setVisibleCount(prev => prev + 1);
    }
  }, [financialPeriods, allQuestions, visibleCount]);

  const handleFinancialReset = useCallback(() => {
    handleFinancialPeriodsChange(getDefaultFinancialPeriods());
  }, [handleFinancialPeriodsChange]);

  const handleContactGroupNext = useCallback(() => {
    const contactQs = visibleClosingQuestions.filter(q => isContactQuestion(q.id));
    const allFilled = contactQs.every(q => !!formData[q.id]);
    
    if (!allFilled) {
      const newErrors: Record<string, string> = {};
      contactQs.forEach(q => {
        if (!formData[q.id]) {
          newErrors[q.id] = 'This field is required';
        }
      });
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }
    
    onSubmit();
  }, [formData, onSubmit, isContactQuestion, visibleClosingQuestions]);

  const handleContinueFromPreliminary = useCallback(() => {
    if (activeBranches.length === 0) {
      setPhase('closing');
    } else {
      setPhase('branch');
      setCurrentBranchIndex(0);
    }
    setVisibleCount(prev => prev + 1);
  }, [activeBranches.length]);

  const toggleEdit = useCallback((questionId: string) => {
    setEditingQuestionId(prev => prev === questionId ? null : questionId);
  }, []);

  const renderContactGroup = (isActive: boolean) => {
    const contactQs = visibleClosingQuestions.filter(q => isContactQuestion(q.id));
    
    if (!isActive) {
      const allAnswered = contactQs.every(q => !!formData[q.id]);
      return (
        <div className="flex items-start gap-3 text-gray-600">
          <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Check className="h-3 w-3 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Contact Information</p>
            <p className="font-medium text-gray-900">
              {allAnswered ? `${formData.firstName} at ${formData.businessName}` : 'Incomplete'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          <p className="mt-1 text-sm text-gray-500">How should we reach you with your valuation?</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {contactQs.map(q => (
            <div key={q.id} className={q.id === 'businessName' || q.id === 'firstName' ? 'sm:col-span-1' : 'sm:col-span-2'}>
              {q.type === 'checkbox' ? (
                <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={formData[q.id] === true}
                    onChange={(e) => {
                      onUpdate({ [q.id]: e.target.checked });
                      setErrors(prev => ({ ...prev, [q.id]: '' }));
                    }}
                    className="mt-1 h-5 w-5 rounded border-gray-300 accent-purple-600"
                  />
                  <span className="text-sm leading-6 text-gray-700">{q.prompt}</span>
                </label>
              ) : (
                <>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{q.prompt}</label>
                  <Input
                    type={q.type === 'email' ? 'email' : q.type === 'tel' ? 'tel' : 'text'}
                    value={String(formData[q.id] || '')}
                    onChange={(e) => {
                      onUpdate({ [q.id]: e.target.value });
                      setErrors(prev => ({ ...prev, [q.id]: '' }));
                    }}
                    placeholder={q.placeholder}
                    className="h-12 rounded-lg border-gray-200"
                  />
                </>
              )}
              {errors[q.id] && <p className="mt-1 text-sm text-red-600">{errors[q.id]}</p>}
            </div>
          ))}
        </div>

        <Button 
          onClick={handleContactGroupNext}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Get My Valuation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderQuestionInput = (qState: QuestionState, isActive: boolean) => {
    const q = qState.question;
    const value = formData[q.id];
    const error = errors[q.id];
    const isEditing = editingQuestionId === q.id;
    const questionCopy = resolveQuestionCopy(q, formData.respondentRole);

    // Special handling for contact group
    if (isContactQuestion(q.id)) {
      return renderContactGroup(isActive);
    }

    // Special handling for inline currency group - only render for first currency question
    if (isCurrencyQuestion(q.id)) {
      // Only show the inline questionnaire for the first currency question
      const firstCurrencyId = currencyQuestions[0]?.id;
      if (q.id !== firstCurrencyId) {
        // This question is handled within the inline questionnaire
        return null;
      }

      if (!isActive && !isEditing) {
        return (
          <div 
            className="flex cursor-pointer items-start gap-3 text-gray-600 hover:bg-gray-50 -m-6 rounded-2xl p-6 transition-colors"
            onClick={() => toggleEdit(q.id)}
          >
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
              <Check className="h-3 w-3 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Working Capital & Normalization</p>
              <p className="font-medium text-gray-900">
                {currencyQuestions.filter(item => !!formData[item.id]).length} of {currencyQuestions.length} amounts entered
              </p>
            </div>
            <div className="text-xs text-purple-600 font-medium">Edit</div>
          </div>
        );
      }
      
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-start gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Working Capital & Normalization</h3>
              <QuestionHelpTooltip content="These inputs directly affect maintainable earnings, working-capital needs, and the final equity value a seller could achieve." />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Enter the amounts for each item below. Click Next after each entry.
            </p>
          </div>
          <InlineCurrencyQuestionnaire
            questions={currencyQuestions}
            formData={formData as Record<string, string | boolean>}
            onUpdate={(patch) => onUpdate(patch as FormData)}
            onComplete={() => {
              const currentIdx = allQuestions.findIndex(vq => vq.question.id === q.id);
              if (currentIdx >= 0 && currentIdx === visibleCount - 1 && visibleCount < allQuestions.length) {
                setVisibleCount(prev => prev + 1);
              }
              setEditingQuestionId(null);
            }}
          />
        </div>
      );
    }

    // Render answered question (compact view with edit option)
    if (!isActive && !isEditing) {
      let displayValue: string;
      if (q.type === 'select') {
        const optionList = q.id === 'level2' ? level2Options : questionCopy.options || q.options;
        const option = optionList?.find(o => o.value === value);
        displayValue = option?.label || String(value || '');
      } else if (q.type === 'checkbox') {
        displayValue = value === true ? 'Yes' : 'No';
      } else if (q.type === 'currency') {
        const num = parseFloat(String(value || '0').replace(/[^0-9]/g, ''));
        displayValue = num ? `₦${num.toLocaleString('en-NG')}` : '';
      } else if (q.type === 'financial_table') {
        const latest = getFinancialPeriodById(financialPeriods, 'latest');
        displayValue = latest.revenue ? `Latest: ₦${parseInt(latest.revenue).toLocaleString('en-NG')}` : '';
      } else {
        displayValue = String(value || '');
      }
      
      return (
        <div 
          className="flex items-start gap-3 text-gray-600 cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-2xl transition-colors"
          onClick={() => toggleEdit(q.id)}
        >
          <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Check className="h-3 w-3 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">{questionCopy.prompt}</p>
            <p className="font-medium text-gray-900">{displayValue || '—'}</p>
          </div>
          <div className="text-xs text-purple-600 font-medium">Edit</div>
        </div>
      );
    }

    // Render active or editing question (full input)
    const showNextButton = !shouldAutoAdvance(q) && q.type !== 'financial_table';

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-start gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{questionCopy.prompt}</h3>
            {questionCopy.tooltipText && <QuestionHelpTooltip content={questionCopy.tooltipText} />}
          </div>
          {questionCopy.helperText && <p className="mt-1 text-sm text-gray-500">{questionCopy.helperText}</p>}
        </div>

        <div className="w-full">
          {q.type === 'select' ? (
            <OptionListInput
              value={String(value || '')}
              onChange={(nextValue) => handleAnswer(q, nextValue, true)}
              disabled={q.id === 'level2' && level2Options.length === 0}
              emptyLabel={q.id === 'level2' && level2Options.length === 0 ? 'Select industry first' : 'No options available.'}
              options={q.id === 'level2' ? level2Options : questionCopy.options || q.options || []}
            />
          ) : q.type === 'textarea' ? (
            <>
              <textarea
                value={String(value || '')}
                onChange={(e) => {
                  onUpdate({ [q.id]: e.target.value });
                  setErrors(prev => ({ ...prev, [q.id]: '' }));
                }}
                placeholder={q.placeholder}
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
              {showNextButton && (
                <Button 
                  onClick={() => handleNextClick(q)}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </>
          ) : q.type === 'checkbox' ? (
            <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 hover:bg-gray-100">
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => handleAnswer(q, e.target.checked, true)}
                className="mt-1 h-5 w-5 rounded border-gray-300 accent-purple-600"
              />
              <span className="text-sm leading-6 text-gray-700">{questionCopy.prompt}</span>
            </label>
            ) : q.type === 'financial_table' ? (
              <div className="w-full">
                <FinancialSpreadsheet
                  periods={financialPeriods}
                  onChange={handleFinancialPeriodsChange}
                />
                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFinancialReset}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button 
                    onClick={handleFinancialNext}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
            <>
              <Input
                type={q.type === 'tel' ? 'tel' : q.type === 'email' ? 'email' : 'text'}
                inputMode={q.type === 'number' ? 'numeric' : undefined}
                value={String(value || '')}
                onChange={(e) => {
                  onUpdate({ [q.id]: e.target.value });
                  setErrors(prev => ({ ...prev, [q.id]: '' }));
                }}
                placeholder={q.placeholder}
                className="h-14 rounded-xl border-gray-200 px-4 text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
              {showNextButton && (
                <Button 
                  onClick={() => handleNextClick(q)}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </>
          )}
          
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  };

  // Preliminary results screen
  if (phase === 'preliminary' && preliminaryResult) {
    const level2Label = level2Options.find(o => o.value === formData.level2)?.label || 'your business';
    const hasBranches = activeBranches.length > 0;
    
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Previous questions summary */}
          <div className="mb-8 space-y-4">
            {visibleQuestions.slice(0, -1).map((qState) => (
              <div 
                key={qState.question.id} 
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                {renderQuestionInput(qState, false)}
              </div>
            ))}
          </div>

          {/* Preliminary Results */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-purple-600">
              Preliminary Assessment
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              Based on {level2Label}
            </h1>
            <p className="mt-1 text-gray-600">
              with ₦{Number(formData.revenueLatest || 0).toLocaleString()} revenue
            </p>

            <div className="mt-6 rounded-xl bg-purple-50 p-6 text-center">
              <p className="text-sm text-gray-600">Preliminary Valuation Range</p>
              <p className="mt-2 text-4xl font-bold text-purple-600">
                {formatRange(preliminaryResult.range.low, preliminaryResult.range.high)}
              </p>
            </div>

            <ConfidenceMeter
              result={preliminaryResult}
              questionsAnswered={anchorQuestions.length}
              totalQuestions={allQuestions.length}
              phase="anchor"
            />

            {hasBranches && (
              <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50 p-4">
                <p className="text-sm font-medium text-purple-900">What's Next</p>
                <p className="mt-1 text-sm text-purple-700">
                  We'll ask about {activeBranches.map(b => b.shortDescription).join(', ')}
                </p>
              </div>
            )}

            <Button 
              onClick={handleContinueFromPreliminary}
              className="mt-6 w-full bg-purple-600 hover:bg-purple-700"
            >
              Continue Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div ref={bottomRef} />
        </div>
      </div>
    );
  }

  const answeredCount = allQuestions.filter(q => q.answered).length;
  const progress = allQuestions.length > 0 ? Math.round((answeredCount / allQuestions.length) * 100) : 0;
  const isContactPhase = visibleQuestions.length > 0 && isContactQuestion(visibleQuestions[visibleQuestions.length - 1]?.question.id || '');

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
              {answeredCount} of {allQuestions.length} complete
            </span>
          </div>
        </div>
        <div className="relative h-8 w-full overflow-hidden bg-slate-300">
          <div
            className="h-full bg-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700">
            {progress}% Complete
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Questions List */}
        <div className="space-y-4">
          {visibleQuestions.map((qState, index) => {
            const isActive = index === visibleCount - 1;
            const isEditing = editingQuestionId === qState.question.id;
            const isAnswered = qState.answered && !isActive && !isEditing;
            
            return (
              <div
                key={`${qState.question.id}-${index}`}
                ref={el => { if (el) questionRefs.current[qState.question.id] = el; }}
                className={`rounded-2xl bg-white p-6 shadow-sm transition-all ${
                  isActive || isEditing ? 'shadow-lg ring-2 ring-purple-100' : ''
                } ${isAnswered ? 'opacity-80' : ''}`}
              >
                {isActive && qState.phase !== 'anchor' && (
                  <div className="mb-4">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                      {qState.phase === 'branch' && activeBranches[qState.branchIndex || 0]?.title}
                      {qState.phase === 'closing' && !isContactQuestion(qState.question.id) && 'Final Details'}
                      {isContactQuestion(qState.question.id) && 'Almost Done'}
                    </span>
                  </div>
                )}
                
                {renderQuestionInput(qState, isActive || isEditing)}
              </div>
            );
          })}
        </div>

        <div ref={bottomRef} />

        {/* Context Help */}
        {!isContactPhase && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Your answers are confidential and secure.</p>
            <p className="mt-1">Scroll up to review or click Edit on any answered question.</p>
          </div>
        )}
      </main>
    </div>
  );
}
