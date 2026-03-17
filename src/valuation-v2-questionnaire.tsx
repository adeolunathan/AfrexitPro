import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Progress } from './components/ui/progress';
import { level2ByLevel1, valuationV2Sections } from './valuation-v2-question-bank';
import type { V2FormData, V2Question, V2Section } from './valuation-v2-types';

interface V2QuestionnaireProps {
  formData: V2FormData;
  onUpdate: (patch: V2FormData) => void;
  onSubmit: () => void;
  onBackToLanding: () => void;
  isSubmitting: boolean;
}

function valueAsString(value: string | boolean | undefined) {
  return typeof value === 'string' ? value : '';
}

export function V2Questionnaire({
  formData,
  onUpdate,
  onSubmit,
  onBackToLanding,
  isSubmitting,
}: V2QuestionnaireProps) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [notice, setNotice] = useState('');

  const currentSection = valuationV2Sections[sectionIndex];
  const progress = ((sectionIndex + 1) / valuationV2Sections.length) * 100;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [sectionIndex]);

  const resolvedLevel2Options = useMemo(() => {
    const level1 = valueAsString(formData.level1);
    return level2ByLevel1[level1] || [];
  }, [formData.level1]);

  const validateSection = (section: V2Section) => {
    for (const question of section.questions) {
      if (!question.required) {
        continue;
      }

      const currentValue = formData[question.id];

      if (question.type === 'checkbox') {
        if (currentValue !== true) {
          return `Please confirm: ${question.prompt}`;
        }
        continue;
      }

      if (!String(currentValue ?? '').trim()) {
        return `Please answer: ${question.prompt}`;
      }
    }

    if (section.id === 'business-profile' && valueAsString(formData.level1) && !valueAsString(formData.level2)) {
      return 'Please choose a Level 2 business model group.';
    }

    return '';
  };

  const handleNext = () => {
    const validationError = validateSection(currentSection);
    if (validationError) {
      setNotice(validationError);
      return;
    }

    setNotice('');

    if (sectionIndex === valuationV2Sections.length - 1) {
      onSubmit();
      return;
    }

    setSectionIndex((current) => current + 1);
  };

  const handleBack = () => {
    setNotice('');

    if (sectionIndex === 0) {
      onBackToLanding();
      return;
    }

    setSectionIndex((current) => current - 1);
  };

  const updateField = (question: V2Question, nextValue: string | boolean) => {
    if (question.id === 'level1') {
      onUpdate({
        level1: nextValue,
        level2: '',
      });
      return;
    }

    onUpdate({ [question.id]: nextValue });
  };

  const renderQuestion = (question: V2Question) => {
    const currentValue = formData[question.id];
    const selectOptions = question.id === 'level2' ? resolvedLevel2Options : question.options || [];

    if (question.type === 'textarea') {
      return (
        <textarea
          value={valueAsString(currentValue)}
          onChange={(event) => updateField(question, event.target.value)}
          placeholder={question.placeholder}
          rows={5}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      );
    }

    if (question.type === 'select') {
      return (
        <select
          value={valueAsString(currentValue)}
          onChange={(event) => updateField(question, event.target.value)}
          disabled={question.id === 'level2' && resolvedLevel2Options.length === 0}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="" disabled>
            {question.id === 'level2' && resolvedLevel2Options.length === 0 ? 'Select Level 1 first' : 'Select an option'}
          </option>
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (question.type === 'checkbox') {
      return (
        <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <input
            type="checkbox"
            checked={currentValue === true}
            onChange={(event) => updateField(question, event.target.checked)}
            className="mt-1 h-5 w-5 rounded border-slate-300 accent-blue-600"
          />
          <span className="text-sm leading-7 text-slate-700">{question.prompt}</span>
        </label>
      );
    }

    return (
      <Input
        type={question.type === 'number' ? 'text' : question.type}
        inputMode={question.type === 'number' ? 'numeric' : undefined}
        value={valueAsString(currentValue)}
        onChange={(event) => updateField(question, event.target.value)}
        placeholder={question.placeholder}
        className="h-14 rounded-2xl border-slate-200 bg-white px-4 text-base text-slate-950 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    );
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_45%,_#ffffff_100%)] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <a href="/valuation-v2.html" className="flex items-center gap-3">
              <img src="/logo-mark.png" alt="Afrexit logo" className="h-11 w-11 object-contain" />
              <div>
                <div className="font-semibold tracking-tight">
                  <span className="text-purple">Afr</span>
                  <span className="text-blue">exit</span>
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Valuation V2 Lab</div>
              </div>
            </a>
            <div className="text-right text-sm text-slate-500">
              Section {sectionIndex + 1} of {valuationV2Sections.length}
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-slate-200" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
          <div className="text-sm leading-7 text-amber-900">
            This is a local-only experimental questionnaire for the deeper Afrexit estimator. It posts to the separate
            backend on <code>localhost:8788</code>, does not affect the live estimator flow, and accepts one full year
            of owner financial history. Two or more years will usually produce a tighter and more defensible result.
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.32fr_0.68fr]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              <FlaskConical className="h-4 w-4" />
              Sections
            </div>
            <div className="space-y-3">
              {valuationV2Sections.map((section, index) => {
                const isActive = index === sectionIndex;
                const isComplete = index < sectionIndex;

                return (
                  <div
                    key={section.id}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      isActive
                        ? 'border-blue-500 bg-blue-50'
                        : isComplete
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Section {index + 1}</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{section.title}</div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <div className="mb-8 space-y-3">
              <div className="text-sm font-medium uppercase tracking-[0.18em] text-blue-700">Section {sectionIndex + 1}</div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{currentSection.title}</h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600">{currentSection.description}</p>
            </div>

            {notice ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
                {notice}
              </div>
            ) : null}

            <div className="space-y-8">
              {currentSection.questions.map((question) => (
                <div key={question.id} className="space-y-3" data-canonical-path={question.canonicalPath}>
                  {question.type === 'checkbox' ? null : (
                    <label className="block text-base font-medium leading-7 text-slate-900">
                      {question.prompt}
                      {question.required ? <span className="ml-1 text-rose-500">*</span> : null}
                    </label>
                  )}
                  {question.helperText ? <div className="text-sm leading-7 text-slate-500">{question.helperText}</div> : null}
                  {renderQuestion(question)}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-slate-300 bg-white text-slate-950 hover:bg-slate-50"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {sectionIndex === 0 ? 'Back to lab home' : 'Previous section'}
              </Button>
              <Button onClick={handleNext} disabled={isSubmitting} className="bg-slate-950 px-6 text-white hover:bg-slate-800">
                {sectionIndex === valuationV2Sections.length - 1 ? 'Run local valuation' : 'Continue'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
