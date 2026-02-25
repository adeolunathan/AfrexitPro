import { useState, useEffect, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LandingPage } from './sections/LandingPage';
import { Questionnaire } from './sections/Questionnaire';
import { LoadingPage } from './sections/LoadingPage';
import { ResultsPage } from './sections/ResultsPage';
import { questions, API_URL } from './types/questionnaire';
import type { FormData, ValuationResult } from './types/questionnaire';

export type Page = 'landing' | 'questionnaire' | 'loading' | 'results';
type ResultData = NonNullable<ValuationResult['data']>;
type AppNotice = {
  title: string;
  message: string;
};

const previewResults: Record<string, ResultData> = {
  results: {
    lowEstimate: '32',
    highEstimate: '53',
    adjustedValue: '42',
    sellabilityScore: 71,
    rating: 'Very Sellable',
    diagId: 'preview-dc56e8d6',
    warnings: ['Some financial records may require stronger documentation'],
  },
  'results-risky': {
    lowEstimate: '9',
    highEstimate: '17',
    adjustedValue: '12',
    sellabilityScore: 34,
    rating: 'Needs Work',
    diagId: 'preview-risk-11c2',
    warnings: [
      'High owner dependency detected',
      'Limited proof of revenue quality',
      'Transferability risks may reduce buyer interest',
    ],
  },
};

const previewContacts: Record<string, FormData> = {
  results: {
    firstName: 'Bolu',
    businessName: 'PolarBear Foods',
    email: 'bolu@example.com',
  },
  'results-risky': {
    firstName: 'Amaka',
    businessName: 'Northline Logistics',
    email: 'amaka@example.com',
  },
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [formData, setFormData] = useState<FormData>({});
  const [resultData, setResultData] = useState<ValuationResult['data'] | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [notice, setNotice] = useState<AppNotice | null>(null);

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preview = params.get('preview');

    if (preview === 'loading') {
      setIsPreviewMode(true);
      setCurrentPage('loading');
      return;
    }

    if (preview && previewResults[preview]) {
      setIsPreviewMode(true);
      if (previewContacts[preview]) {
        setFormData(previewContacts[preview]);
      }
      setResultData(previewResults[preview]);
      setCurrentPage('results');
      return;
    }

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
    if (isPreviewMode) return;
    localStorage.setItem('afrexit_answers', JSON.stringify(formData));
    localStorage.setItem('afrexit_view', currentPage);
  }, [formData, currentPage, isPreviewMode]);

  const handleStartValuation = () => {
    setCurrentPage('questionnaire');
  };

  const handleFormUpdate = useCallback((data: FormData) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const showNotice = useCallback((message: string, title = 'Please check and try again') => {
    setNotice({ title, message });
  }, []);

  const handleSubmit = useCallback(async (finalData: FormData) => {
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
        setCurrentPage('questionnaire');
        showNotice(msg, 'Submission issue');
        return;
      }
      
      setResultData(json.data);
      setCurrentPage('results');
      
      // Clear saved data on success
      localStorage.removeItem('afrexit_answers');
      localStorage.removeItem('afrexit_view');
    } catch (err) {
      console.error(err);
      setCurrentPage('questionnaire');
      showNotice('Network or server error. Please try again.', 'Connection error');
    }
  }, [showNotice]);

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
          onNotice={showNotice}
          onBackToLanding={() => setCurrentPage('landing')}
        />
      )}
      
      {currentPage === 'loading' && (
        <LoadingPage />
      )}
      
      {currentPage === 'results' && resultData && (
        <ResultsPage
          data={resultData}
          contact={{
            firstName: formData.firstName,
            businessName: formData.businessName,
            email: formData.email,
          }}
          onRestart={handleRestart}
        />
      )}

      <AlertDialog open={Boolean(notice)} onOpenChange={(open) => !open && setNotice(null)}>
        <AlertDialogContent className="max-w-md border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">
              {notice?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 leading-6">
              {notice?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setNotice(null)}
              className="bg-purple hover:bg-purple/90 text-white"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
