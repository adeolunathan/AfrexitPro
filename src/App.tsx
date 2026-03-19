import { useState, useCallback } from 'react';
import { submitValuation } from './api/valuation';
import { LandingPage } from './sections/LandingPage';
import { LoadingPage } from './sections/LoadingPage';
import { ContinuousQuestionnaire } from './sections/ContinuousQuestionnaire';
import { ResultsPage } from './sections/ResultsPage';
import { DisclaimerPage } from './sections/DisclaimerPage';
import { TermsPage } from './sections/TermsPage';
import { PrivacyPage } from './sections/PrivacyPage';
import type { FormData, ResultData } from './types/valuation';
import type { LegalPage } from './types/legal';

type AppScreen = 'landing' | 'questionnaire' | 'loading' | 'results';
type Screen = AppScreen | LegalPage;

const defaultFormData: FormData = {
  newsletterOptIn: true,
  termsAccepted: false,
};

export function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('landing');

  const updateFormData = (patch: FormData) => {
    setFormData((current) => ({ ...current, ...patch }));
  };

  const openLegalPage = useCallback((page: LegalPage) => {
    if (screen === 'landing' || screen === 'questionnaire' || screen === 'loading' || screen === 'results') {
      setPreviousScreen(screen);
    }
    setScreen(page);
  }, [screen]);

  const closeLegalPage = useCallback(() => {
    setScreen(previousScreen);
  }, [previousScreen]);

  const handleSubmit = async () => {
    setError('');
    setScreen('loading');

    try {
      const nextResult = await submitValuation(formData);
      setResult(nextResult);
      setScreen('results');
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to connect to the valuation service. Please try again later.'
      );
      setScreen('questionnaire');
    }
  };

  const resetApp = () => {
    setFormData(defaultFormData);
    setResult(null);
    setError('');
    setScreen('landing');
  };

  if (screen === 'landing') {
    return (
      <LandingPage 
        onStart={() => setScreen('questionnaire')} 
        onOpenDisclaimer={() => openLegalPage('disclaimer')}
        onOpenTerms={() => openLegalPage('terms')}
        onOpenPrivacy={() => openLegalPage('privacy')}
      />
    );
  }

  if (screen === 'loading') {
    return <LoadingPage />;
  }

  if (screen === 'results' && result) {
    return <ResultsPage result={result} onRestart={resetApp} onEdit={() => setScreen('questionnaire')} />;
  }

  if (screen === 'disclaimer') {
    return <DisclaimerPage onBack={closeLegalPage} onNavigate={openLegalPage} />;
  }

  if (screen === 'terms') {
    return <TermsPage onBack={closeLegalPage} onNavigate={openLegalPage} />;
  }

  if (screen === 'privacy') {
    return <PrivacyPage onBack={closeLegalPage} onNavigate={openLegalPage} />;
  }

  return (
    <>
      {error ? (
        <div className="fixed inset-x-0 top-0 z-50 bg-rose-600 px-4 py-3 text-center text-sm text-white shadow-lg">
          {error}
        </div>
      ) : null}
      <ContinuousQuestionnaire
        formData={formData}
        onUpdate={updateFormData}
        onSubmit={handleSubmit}
        onBackToLanding={() => setScreen('landing')}
        isSubmitting={false}
      />
    </>
  );
}
