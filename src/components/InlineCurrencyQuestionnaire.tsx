import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Question } from '@/data/adaptive-question-bank';
import { QuestionHelpTooltip } from '@/components/QuestionHelpTooltip';
import { resolveQuestionCopy } from '@/lib/adaptive-question-copy';
import { formatMillions, formatMillionsDisplay, sanitizeMillionInput, serializeMillions } from '@/lib/million-currency';

interface InlineCurrencyQuestionnaireProps {
  questions: Question[];
  formData: Record<string, string | boolean>;
  onUpdate: (patch: Record<string, string | boolean>) => void;
  onComplete: () => void;
}

export function InlineCurrencyQuestionnaire({ 
  questions, 
  formData, 
  onUpdate, 
  onComplete 
}: InlineCurrencyQuestionnaireProps) {
  const [activeIndex, setActiveIndex] = useState(() => {
    // Find first unanswered question
    for (let i = 0; i < questions.length; i++) {
      if (!formData[questions[i].id]) {
        return i;
      }
    }
    return questions.length - 1;
  });
  const [revealedCount, setRevealedCount] = useState(() => Math.min(questions.length, Math.max(1, activeIndex + 1)));

  const [editValue, setEditValue] = useState(() => {
    const q = questions[activeIndex];
    return q ? formatMillions(String(formData[q.id] || '')) : '';
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when active question changes
  useEffect(() => {
    const q = questions[activeIndex];
    if (q) {
      setEditValue(formatMillions(String(formData[q.id] || '')));
    }
  }, [activeIndex, formData, questions]);

  // Focus input when active question changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeIndex]);

  useEffect(() => {
    setRevealedCount((prev) => Math.max(prev, activeIndex + 1));
  }, [activeIndex]);

  const handleNext = useCallback(() => {
    const currentQ = questions[activeIndex];
    if (!currentQ) return;

    // Save current value
    onUpdate({ [currentQ.id]: serializeMillions(editValue) });

    // Move to next question
    if (activeIndex < questions.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [activeIndex, questions, editValue, onUpdate, onComplete]);

  const handlePrevious = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  }, [handleNext]);

  const currentQ = questions[activeIndex];

  if (!currentQ) return null;

  return (
    <div className="w-full">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Enter all amounts in <span className="font-medium text-slate-700">₦ millions</span>. Example: <span className="font-medium text-slate-700">12.5</span> means <span className="font-medium text-slate-700">₦12.5m</span>.
        </div>
        {/* Header */}
        <div className="grid grid-cols-[1fr_200px] border-b border-slate-200 bg-slate-50">
          <div className="h-9 flex items-center px-4 text-xs font-medium text-slate-500">
            Question
          </div>
          <div className="h-9 flex items-center justify-end px-4 text-xs font-medium text-slate-500 border-l border-slate-200">
            Amount (₦m)
          </div>
        </div>

        {/* Question Rows */}
        {questions.slice(0, revealedCount).map((q, idx) => {
          const copy = resolveQuestionCopy(q, formData.respondentRole);
          const isActive = idx === activeIndex;
          const value = String(formData[q.id] || '');
          const isAnswered = !!value && !isActive;

          return (
            <div 
              key={q.id}
              className={`grid grid-cols-[1fr_200px] border-b border-slate-200 last:border-b-0 ${
                isActive ? 'bg-purple-50' : isAnswered ? 'bg-white' : 'bg-white'
              }`}
              onClick={() => setActiveIndex(idx)}
            >
              {/* Question Column */}
              <div className={`px-4 py-3 flex flex-col justify-center ${
                isActive ? '' : ''
              }`}>
                <div className="flex items-start gap-2">
                  <span className={`text-sm ${isActive ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                    {copy.prompt}
                  </span>
                  {copy.tooltipText && <QuestionHelpTooltip content={copy.tooltipText} />}
                </div>
                {copy.helperText && (
                  <span className="mt-1 text-xs text-slate-500">{copy.helperText}</span>
                )}
              </div>

              {/* Answer Column */}
              <div className={`relative flex items-center justify-end px-4 border-l border-slate-200 ${
                isActive ? 'bg-white' : ''
              }`}>
                {isActive ? (
                  <div className="absolute inset-0 flex items-center bg-white">
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="decimal"
                      value={editValue}
                      onChange={(e) => setEditValue(sanitizeMillionInput(e.target.value))}
                      onKeyDown={handleKeyDown}
                      placeholder={q.placeholder || '0'}
                      className="h-full w-full bg-transparent px-4 text-right text-sm font-medium text-slate-900 outline-none"
                    />
                  </div>
                ) : isAnswered ? (
                  <span className="text-sm font-medium text-slate-700">
                    {formatMillionsDisplay(value, { emptyDisplay: '0' })}
                  </span>
                ) : (
                  <span className="text-sm text-slate-300">0</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={activeIndex === 0}
          className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          {activeIndex < questions.length - 1 ? 'Next' : 'Continue'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="mt-3 text-xs text-slate-400 text-right">
        {activeIndex + 1} of {questions.length}
      </div>
    </div>
  );
}
