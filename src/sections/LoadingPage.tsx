import { TrendingUp } from 'lucide-react';

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-black">
                <span className="text-purple">Afr</span>
                <span className="text-blue">exit</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 sm:px-6">
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Spinner */}
          <div className="mb-8">
            <svg className="spinner mx-auto" viewBox="0 0 64 64" style={{ width: 64, height: 64 }}>
              <defs>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A020F0" />
                  <stop offset="100%" stopColor="#0070F3" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="28" stroke="rgba(160,32,240,0.15)" strokeWidth="6" fill="none"/>
              <circle 
                cx="32" 
                cy="32" 
                r="28" 
                stroke="url(#g1)" 
                strokeWidth="6" 
                fill="none" 
                strokeDasharray="120" 
                strokeDashoffset="60" 
                strokeLinecap="round" 
                transform="rotate(-90 32 32)"
                style={{ animation: 'spin 1.2s linear infinite' }}
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-3 text-black">
            Calculating your valuation…
          </h2>
          <p className="text-gray-500">
            Analyzing industry multiples, financial quality, and transferability factors.<br/>
            This takes about 10–15 seconds.
          </p>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
