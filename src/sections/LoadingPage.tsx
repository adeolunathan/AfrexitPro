import { useState, useEffect } from 'react';
import { CheckCircle2, BarChart3, Calculator, TrendingUp } from 'lucide-react';

const loadingChecks = [
  { text: 'Validating response completeness', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100' },
  { text: 'Scoring sellability across the 9-factor framework', icon: BarChart3, color: 'text-purple-600 bg-purple-100' },
  { text: 'Estimating valuation range and likely value', icon: Calculator, color: 'text-blue-600 bg-blue-100' },
];

type ProgressStep = {
  label: string;
  width: number;
};

const progressSteps: ProgressStep[] = [
  { label: 'Data quality scoring', width: 72 },
  { label: 'Transferability assessment', width: 84 },
  { label: 'Valuation range calibration', width: 66 },
];

interface LoadingPageProps {
  onBackToLanding: () => void;
}

export function LoadingPage({ onBackToLanding }: LoadingPageProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Step 1: Data quality scoring (0-3 seconds)
    const timer1 = setTimeout(() => {
      setActiveStep(1);
    }, 3000);

    // Step 2: Transferability assessment (3-6 seconds)
    const timer2 = setTimeout(() => {
      setActiveStep(2);
    }, 6000);

    // Step 3: Valuation range calibration stays active (6+ seconds)
    // It remains on step 2 until the component unmounts

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-purple/10 blur-3xl" />
        <div className="absolute top-40 right-6 h-56 w-56 rounded-full bg-blue/10 blur-3xl" />
        <div className="absolute bottom-12 left-4 h-56 w-56 rounded-full bg-purple/5 blur-3xl" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={onBackToLanding}
              aria-label="Go to homepage"
              className="flex items-center gap-2"
            >
              <img
                src="/logo-mark.png"
                alt="Afrexit logo"
                className="w-10 h-10 object-contain shrink-0"
              />
              <span className="text-xl font-bold">
                <span className="text-purple-600">Afr</span>
                <span className="text-blue-600">exit</span>
              </span>
            </button>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <span>Built for Nigerian SMEs</span>
              <span className="text-purple-600">•</span>
              <span>Free Valuation Tool</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative flex-1 pt-28 pb-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-gray-200 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-purple via-blue to-purple bg-[length:200%_100%] animate-[afrexit-shimmer_2.8s_linear_infinite]" />

            <div className="p-6 sm:p-8">
              <div className="grid gap-7 md:grid-cols-[auto_1fr] md:items-center">
                <div className="flex justify-center">
                  <div className="relative h-28 w-28">
                    <div className="absolute inset-0 rounded-full bg-purple/20 blur-xl animate-pulse" />
                    <div className="absolute inset-0 rounded-full border border-purple/20 bg-white" />
                    <div
                      className="absolute inset-0 rounded-full animate-spin"
                      style={{
                        background:
                          'conic-gradient(from 180deg, rgba(160,32,240,0.08) 0deg, #A020F0 110deg, #0070F3 230deg, rgba(0,112,243,0.08) 360deg)',
                        animationDuration: '3s',
                      }}
                    />
                    <div className="absolute inset-[7px] rounded-full bg-white border border-gray-100" />
                    <div className="absolute inset-0 grid place-items-center">
                      <img src="/logo-mark.png" alt="Afrexit" className="w-14 h-14" />
                    </div>
                  </div>
                </div>

                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-purple/20 bg-purple/5 px-4 py-1.5 text-2xl font-bold text-purple mb-3">
                    Valuation in progress
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-black leading-tight">
                    Calculating your business valuation
                  </h1>
                  <p className="text-gray-600 mt-3 max-w-2xl">
                    We are analyzing your responses across financial quality, transferability, and buyer readiness to produce your estimated valuation range.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This usually takes about 10–15 seconds.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-[1.25fr_1fr]">
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div className="text-base font-bold text-gray-900">What we are checking right now</div>
                  </div>
                  <div className="space-y-4">
                    {loadingChecks.map((item) => (
                      <div
                        key={item.text}
                        className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className="text-base font-medium text-gray-800">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                  <div className="text-base font-bold text-black mb-5">Progress indicator</div>
                  <div className="space-y-5">
                    {progressSteps.map((step, idx) => {
                      const isActive = activeStep === idx;
                      const isCompleted = activeStep > idx;
                      
                      return (
                        <div key={idx} className={`transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                          <div className="mb-2 text-sm font-medium flex items-center gap-2">
                            <span className={isActive ? 'text-purple' : isCompleted ? 'text-green-600' : 'text-gray-500'}>
                              {step.label}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center">
                                <span className="w-1.5 h-1.5 bg-purple rounded-full animate-pulse" />
                              </span>
                            )}
                            {isCompleted && (
                              <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isActive 
                                  ? 'bg-gradient-to-r from-purple to-blue animate-pulse' 
                                  : isCompleted 
                                    ? 'bg-green-500' 
                                    : 'bg-gray-300'
                              }`}
                              style={{
                                width: isCompleted ? '100%' : isActive ? `${step.width}%` : '0%',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    Do not close this tab while we generate your result.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes afrexit-shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}</style>
    </div>
  );
}
