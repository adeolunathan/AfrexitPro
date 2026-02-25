import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

interface ResultsPageProps {
  data: {
    lowEstimate: string;
    highEstimate: string;
    adjustedValue: string;
    sellabilityScore: number;
    rating: string;
    diagId: string;
    warnings?: string[];
  };
  onRestart: () => void;
}

export function ResultsPage({ data, onRestart }: ResultsPageProps) {
  const getRatingClass = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-600';
  };

  const getRatingBg = (score: number) => {
    if (score >= 70) return 'bg-green-50 border-green-200';
    if (score >= 40) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

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
        <div className="w-full max-w-2xl mx-auto">
          {/* Results Card */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            {/* Hero Section */}
            <div className="p-8 text-center border-b border-gray-200">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${getRatingBg(data.sellabilityScore)}`}>
                <span className={`font-bold text-sm ${getRatingClass(data.sellabilityScore)}`}>
                  {data.rating}
                </span>
              </div>
              
              <div className="text-4xl sm:text-5xl font-bold text-black mb-2">
                ₦{data.lowEstimate}M - ₦{data.highEstimate}M
              </div>
              <p className="text-gray-500">
                Most likely: ₦{data.adjustedValue}M
              </p>
            </div>

            {/* Details */}
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 mb-1 font-semibold">Sellability score</div>
                  <div className="text-lg text-black">{data.sellabilityScore}/100</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 mb-1 font-semibold">Status</div>
                  <div className="text-lg text-black">Your report has been sent to your email.</div>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-6">
                Diagnostics: {data.diagId}
                {data.warnings && data.warnings.length > 0 && ' • Warnings captured'}
              </div>

              <Button
                variant="outline"
                onClick={onRestart}
                className="border-gray-300 hover:bg-gray-100 text-black"
              >
                Run another valuation
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
