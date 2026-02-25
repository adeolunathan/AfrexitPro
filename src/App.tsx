import { useState, useEffect, useCallback } from 'react';
import { LandingPage } from './sections/LandingPage';
import { Questionnaire } from './sections/Questionnaire';
import { LoadingPage } from './sections/LoadingPage';
import { ResultsPage } from './sections/ResultsPage';
import { questions, API_URL } from './types/questionnaire';
import type { FormData, ValuationResult } from './types/questionnaire';

export type Page = 'landing' | 'questionnaire' | 'loading' | 'results';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [formData, setFormData] = useState<FormData>({});
  const [resultData, setResultData] = useState<ValuationResult['data'] | null>(null);

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('afrexit_answers');
    const savedPage = localStorage.getItem('afrexit_view') as Page;
    
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }
    
    if (savedPage && ['landing', 'questionnaire', 'results'].includes(savedPage)) {
      setCurrentPage(savedPage);
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('afrexit_answers', JSON.stringify(formData));
    localStorage.setItem('afrexit_view', currentPage);
  }, [formData, currentPage]);

  const handleStartValuation = () => {
    setCurrentPage('questionnaire');
  };

  const handleFormUpdate = useCallback((data: FormData) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const handleSubmit = async (finalData: FormData) => {
    // Show loading screen
    setCurrentPage('loading');
    
    try {
      // Use FormData exactly like the working HTML
      const fd = new FormData();
      Object.entries(finalData).forEach(([k, v]) => fd.append(k, v));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      const res = await fetch(API_URL, { 
        method: 'POST', 
        body: fd, 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      const json = await res.json();
      
      if (!json || json.status !== 'success') {
        const msg = (json && json.message) ? json.message : 'Submission failed.';
        alert(msg);
        setCurrentPage('questionnaire');
        return;
      }
      
      setResultData(json.data);
      setCurrentPage('results');
      
      // Clear saved data on success
      localStorage.removeItem('afrexit_answers');
      localStorage.removeItem('afrexit_view');
    } catch (err) {
      alert('Network or server error. Please try again.');
      console.error(err);
      setCurrentPage('questionnaire');
    }
  };

  const handleRestart = () => {
    setFormData({});
    setResultData(null);
    setCurrentPage('landing');
    localStorage.removeItem('afrexit_answers');
    localStorage.removeItem('afrexit_view');
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {currentPage === 'landing' && (
        <LandingPage onStart={handleStartValuation} />
      )}
      
      {currentPage === 'questionnaire' && (
        <Questionnaire
          questions={questions}
          formData={formData}
          onUpdate={handleFormUpdate}
          onSubmit={handleSubmit}
          onBackToLanding={() => setCurrentPage('landing')}
        />
      )}
      
      {currentPage === 'loading' && (
        <LoadingPage />
      )}
      
      {currentPage === 'results' && resultData && (
        <ResultsPage data={resultData} onRestart={handleRestart} />
      )}
    </div>
  );
}

export default App;
