import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  CheckCircle2, 
  TriangleAlert, 
  FileText, 
  Mail, 
  RefreshCw,
  Award,
  Lightbulb,
  Target,
  BarChart3
} from 'lucide-react';

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
  contact?: {
    firstName?: string;
    businessName?: string;
    email?: string;
  };
  onRestart: () => void;
}

function getScoreTheme(score: number) {
  if (score >= 70) {
    return {
      badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
      gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
      accent: 'text-emerald-700',
      accentLight: 'text-emerald-600',
      ring: 'ring-emerald-500/30',
      valueCircle: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-700',
      icon: 'text-emerald-600',
      note: 'Strong transferability signal for buyers. Your business is well-positioned for sale.',
    };
  }

  if (score >= 40) {
    return {
      badge: 'bg-amber-50 border-amber-200 text-amber-700',
      bar: 'bg-gradient-to-r from-amber-400 to-amber-600',
      gradient: 'from-amber-500/20 via-amber-400/10 to-transparent',
      accent: 'text-amber-700',
      accentLight: 'text-amber-600',
      ring: 'ring-amber-500/30',
      valueCircle: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-700',
      icon: 'text-amber-600',
      note: 'Good value potential, but buyers will ask hard questions. Some improvements recommended.',
    };
  }

  return {
    badge: 'bg-rose-50 border-rose-200 text-rose-700',
    bar: 'bg-gradient-to-r from-rose-400 to-rose-600',
    gradient: 'from-rose-500/20 via-rose-400/10 to-transparent',
    accent: 'text-rose-700',
    accentLight: 'text-rose-600',
    ring: 'ring-rose-500/30',
    valueCircle: 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50 text-rose-700',
    icon: 'text-rose-600',
    note: 'Value is present, but sellability risks are dragging price. Significant improvements needed.',
  };
}

function formatNairaMillions(value: string) {
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return `₦${value}M`;

  if (Number.isInteger(asNumber)) {
    return `₦${asNumber.toLocaleString('en-NG')}M`;
  }

  return `₦${asNumber.toLocaleString('en-NG', { maximumFractionDigits: 1 })}M`;
}

// Circular progress component for sellability score
function ScoreGauge({ score, theme }: { score: number; theme: ReturnType<typeof getScoreTheme> }) {
  const radius = 50;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="relative w-36 h-36 sm:w-44 sm:h-44">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={theme.icon}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl sm:text-5xl font-bold text-gray-900">{score}</span>
        <span className="text-sm text-gray-400 font-medium">/100</span>
      </div>
    </div>
  );
}

export function ResultsPage({ data, contact, onRestart }: ResultsPageProps) {
  const theme = getScoreTheme(data.sellabilityScore);
  const hasWarnings = Boolean(data.warnings && data.warnings.length > 0);
  const firstName = contact?.firstName?.trim() || 'there';
  const businessName = contact?.businessName?.trim();
  const email = contact?.email?.trim();

  const nextSteps = [
    {
      icon: FileText,
      color: 'text-purple-600 bg-purple-100',
      title: 'Review Your Report',
      description: 'Check your email for a detailed breakdown and identify your weakest factors.',
    },
    {
      icon: Target,
      color: 'text-blue-600 bg-blue-100',
      title: 'Focus on Improvements',
      description: 'Improve documentation and owner independence before entering sale conversations.',
    },
    {
      icon: RefreshCw,
      color: 'text-emerald-600 bg-emerald-100',
      title: 'Track Your Progress',
      description: 'Re-run the valuation after improvements to see how your score changes.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img
                src="/logo-mark.png"
                alt="Afrexit logo"
                className="w-10 h-10 object-contain shrink-0"
              />
              <span className="text-xl font-bold">
                <span className="text-purple-600">Afr</span>
                <span className="text-blue-600">exit</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <span>Built for Nigerian SMEs</span>
              <span className="text-purple-600">•</span>
              <span>Free Valuation Tool</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Gradient */}
      <section className={`pt-24 pb-4 px-4 sm:px-6 lg:px-8 bg-gradient-to-b ${theme.gradient}`}>
        <div className="max-w-4xl mx-auto">
          {/* Success Badge */}
          <div className="flex justify-center mb-6">
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${theme.badge}`}>
              <CheckCircle2 className="w-4 h-4" />
              {data.rating}
            </div>
          </div>

          {/* Personal Greeting */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Hi {firstName}! Your valuation is ready
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              {businessName ? (
                <>Based on your responses, <span className="font-semibold text-gray-900">{businessName}</span> is valued. {theme.note}</>
              ) : (
                <>Based on your responses, {theme.note}</>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 pb-12 -mt-2">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Valuation Range Card */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Valuation Range</h2>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-6 items-center">
                {/* Low Estimate */}
                <div className="text-center p-4 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Conservative</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-700">
                    {formatNairaMillions(data.lowEstimate)}
                  </p>
                </div>

                {/* Most Likely - Highlighted */}
                <div className={`text-center p-6 rounded-xl border-2 ${theme.valueCircle} shadow-lg`}>
                  <p className="text-sm font-medium mb-1 opacity-80">Most Likely</p>
                  <p className="text-3xl sm:text-4xl font-bold">
                    {formatNairaMillions(data.adjustedValue)}
                  </p>
                  <p className="text-xs mt-2 opacity-70">Based on your responses</p>
                </div>

                {/* High Estimate */}
                <div className="text-center p-4 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Optimistic</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-700">
                    {formatNairaMillions(data.highEstimate)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sellability Score & What to Do Next */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Sellability Score</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">What to Do Next</h2>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Left Side - Score Gauge */}
                <div className="flex flex-col items-center">
                  <ScoreGauge score={data.sellabilityScore} theme={theme} />
                  
                  {/* Score Details - Under the circle */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      This score reflects how documented, transferable, and buyer-ready your business appears. 
                      Higher scores attract more buyers and better offers.
                    </p>
                  </div>
                </div>

                {/* Right Side - What to Do Next */}
                <div>
                  <div className="space-y-2">
                    {nextSteps.map((step, index) => (
                      <div 
                        key={index}
                        className="flex gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg ${step.color} flex items-center justify-center shrink-0`}>
                          <step.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{step.title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Report Delivered Card */}
          <section className="bg-purple-50 rounded-xl border border-purple-100 overflow-hidden">
            <div className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Full Report Sent</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    A comprehensive valuation report has been sent to{' '}
                    <span className="font-semibold text-gray-900">{email || 'your email'}</span>. 
                    It includes detailed analysis and recommendations to increase your business value.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Warnings Section */}
          {hasWarnings && (
            <section className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TriangleAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Areas to Review</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.warnings!.map((warning, index) => (
                  <span
                    key={`${warning}-${index}`}
                    className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-sm text-amber-800"
                  >
                    {warning}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              onClick={onRestart}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-5 text-base font-semibold rounded-xl shadow-lg shadow-purple-200 w-full sm:w-auto"
            >
              Start Another Valuation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-400">
            © 2025 Afrexit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
