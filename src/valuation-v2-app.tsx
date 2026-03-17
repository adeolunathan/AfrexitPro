import { useState } from 'react';
import { submitValuationV2 } from './valuation-v2-api';
import { V2LandingPage } from './valuation-v2-landing-page';
import { V2LoadingPage } from './valuation-v2-loading-page';
import { V2Questionnaire } from './valuation-v2-questionnaire';
import { V2ResultsPage } from './valuation-v2-results-page';
import type { V2FormData, V2ResultData } from './valuation-v2-types';

type Screen = 'landing' | 'questionnaire' | 'loading' | 'results';

const defaultFormData: V2FormData = {
  newsletterOptIn: true,
  termsAccepted: false,
};

export function AppV2() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [formData, setFormData] = useState<V2FormData>(defaultFormData);
  const [result, setResult] = useState<V2ResultData | null>(null);
  const [error, setError] = useState('');

  const updateFormData = (patch: V2FormData) => {
    setFormData((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async () => {
    setError('');
    setScreen('loading');

    try {
      const nextResult = await submitValuationV2(formData);
      setResult(nextResult);
      setScreen('results');
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'The local V2 backend is not reachable yet. Start the local server and try again.'
      );
      setScreen('questionnaire');
    }
  };

  const resetLab = () => {
    setFormData(defaultFormData);
    setResult(null);
    setError('');
    setScreen('landing');
  };

  if (screen === 'landing') {
    return <V2LandingPage onStart={() => setScreen('questionnaire')} />;
  }

  if (screen === 'loading') {
    return <V2LoadingPage />;
  }

  if (screen === 'results' && result) {
    return <V2ResultsPage result={result} onRestart={resetLab} onEdit={() => setScreen('questionnaire')} />;
  }

  return (
    <>
      {error ? (
        <div className="fixed inset-x-0 top-0 z-50 bg-rose-600 px-4 py-3 text-center text-sm text-white shadow-lg">
          {error}
        </div>
      ) : null}
      <V2Questionnaire
        formData={formData}
        onUpdate={updateFormData}
        onSubmit={handleSubmit}
        onBackToLanding={() => setScreen('landing')}
        isSubmitting={false}
      />
    </>
  );
}
