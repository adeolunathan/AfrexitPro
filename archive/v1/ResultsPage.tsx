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
  BarChart3,
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
  onGoHome?: () => void;
  onOpenDisclaimer?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

function getScoreTheme(score: number) {
  if (score >= 70) {
    return {
      badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
      valueCircle: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-700',
      icon: 'text-emerald-600',
      note: 'Strong transferability signal for buyers. Your business is well-positioned for sale.',
    };
  }

  if (score >= 40) {
    return {
      badge: 'bg-amber-50 border-amber-200 text-amber-700',
      gradient: 'from-amber-500/20 via-amber-400/10 to-transparent',
      valueCircle: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-700',
      icon: 'text-amber-600',
      note: 'Good value potential, but buyers will ask hard questions. Some improvements recommended.',
    };
  }

  return {
    badge: 'bg-rose-50 border-rose-200 text-rose-700',
    gradient: 'from-rose-500/20 via-rose-400/10 to-transparent',
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

function ScoreGauge({ score, theme }: { score: number; theme: ReturnType<typeof getScoreTheme> }) {
  const radius = 50;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-36 w-36 sm:h-44 sm:w-44">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
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
        <span className="text-4xl font-extrabold text-gray-900 sm:text-5xl">{score}</span>
        <span className="text-sm font-semibold text-gray-500">/100</span>
      </div>
    </div>
  );
}

export function ResultsPage({
  data,
  contact,
  onRestart,
  onGoHome,
  onOpenDisclaimer,
  onOpenTerms,
  onOpenPrivacy,
}: ResultsPageProps) {
  const theme = getScoreTheme(data.sellabilityScore);
  const hasWarnings = Boolean(data.warnings && data.warnings.length > 0);
  const firstName = contact?.firstName?.trim() || 'there';
  const businessName = contact?.businessName?.trim();
  const email = contact?.email?.trim();

  const nextSteps = [
    {
      icon: FileText,
      color: 'text-purple-600 bg-purple-100',
      title: 'Review Your Estimate',
      description: 'Check your email for the summary and identify the factors most likely to affect buyer confidence.',
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
      description: 'Re-run the estimate after improvements to see how your score changes.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              type="button"
              onClick={onGoHome ?? onRestart}
              aria-label="Go to homepage"
              className="flex items-center gap-2"
            >
              <img
                src="/logo-mark.png"
                alt="Afrexit logo"
                className="h-10 w-10 shrink-0 object-contain"
              />
              <span className="text-xl font-bold">
                <span className="text-purple-600">Afr</span>
                <span className="text-blue-600">exit</span>
              </span>
            </button>
            <div className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
              <span>Sell-side readiness and M&A support for SMEs</span>
              <span className="text-purple-600">•</span>
              <span>Free Estimate Tool</span>
            </div>
          </div>
        </div>
      </nav>

      <section className={`bg-gradient-to-b px-4 pb-4 pt-24 sm:px-6 lg:px-8 ${theme.gradient}`}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex justify-center">
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${theme.badge}`}>
              <CheckCircle2 className="h-4 w-4" />
              {data.rating}
            </div>
          </div>

          <div className="mb-6 text-center">
            <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
              Hi {firstName}! Your estimate is ready
            </h1>
            <p className="mx-auto max-w-2xl text-gray-600">
              {businessName ? (
                <>
                  Based on your responses, your preliminary estimate for{' '}
                  <span className="font-semibold text-gray-900">{businessName}</span> is about{' '}
                  <span className="font-semibold text-gray-900">{formatNairaMillions(data.adjustedValue)}</span>. {theme.note}
                </>
              ) : (
                <>
                  Based on your responses, your preliminary business value estimate is about{' '}
                  <span className="font-semibold text-gray-900">{formatNairaMillions(data.adjustedValue)}</span>. {theme.note}
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <main className="-mt-2 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Preliminary Value Range</h2>
              </div>

              <div className="grid items-center gap-6 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="mb-1 text-sm text-gray-500">Conservative</p>
                  <p className="text-2xl font-bold text-gray-700 sm:text-3xl">
                    {formatNairaMillions(data.lowEstimate)}
                  </p>
                </div>

                <div className={`rounded-xl border-2 p-6 text-center shadow-lg ${theme.valueCircle}`}>
                  <p className="mb-1 text-sm font-medium opacity-80">Most Likely</p>
                  <p className="text-3xl font-bold sm:text-4xl">
                    {formatNairaMillions(data.adjustedValue)}
                  </p>
                  <p className="mt-2 text-xs opacity-70">Based on your responses</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="mb-1 text-sm text-gray-500">Optimistic</p>
                  <p className="text-2xl font-bold text-gray-700 sm:text-3xl">
                    {formatNairaMillions(data.highEstimate)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Before you rely on this number</h3>
                <p className="mt-1 text-sm leading-6 text-amber-900/90">
                  This is an automated preliminary estimate, not a certified valuation, fairness opinion, broker quote, or commitment to transact.
                  Any live advisory support, buyer outreach, or deal representation requires a separate written engagement.
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <button
                    type="button"
                    onClick={onOpenDisclaimer}
                    className="font-medium text-amber-900 underline underline-offset-4"
                  >
                    Important Disclosures
                  </button>
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="font-medium text-amber-900 underline underline-offset-4"
                  >
                    Terms of Use
                  </button>
                  <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="font-medium text-amber-900 underline underline-offset-4"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Sellability Score</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">What to Do Next</h2>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col items-center">
                  <ScoreGauge score={data.sellabilityScore} theme={theme} />
                  <div className="mt-4 text-center">
                    <p className="text-sm leading-relaxed text-gray-600">
                      This score reflects how documented, transferable, and buyer-ready your business appears.
                      Higher scores typically attract more buyers and better offers.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="space-y-2">
                    {nextSteps.map((step, index) => (
                      <div
                        key={index}
                        className="flex gap-3 rounded-lg bg-gray-50 p-2.5 transition-colors hover:bg-gray-100"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${step.color}`}>
                          <step.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
                          <p className="text-xs leading-relaxed text-gray-500">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-purple-100 bg-purple-50">
            <div className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <Mail className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="mb-0.5 text-sm font-semibold text-gray-900">Estimate Summary Sent</h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    A copy of your estimate summary has been sent to{' '}
                    <span className="font-semibold text-gray-900">{email || 'your email'}</span>.
                    It includes the automated estimate, readiness signals, and next-step guidance.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {hasWarnings && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <TriangleAlert className="h-5 w-5 text-amber-600" />
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

          <section className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button
              onClick={onRestart}
              className="w-full rounded-xl bg-purple-600 px-8 py-5 text-base font-semibold text-white shadow-lg shadow-purple-200 hover:bg-purple-700 sm:w-auto"
            >
              Start Another Estimate
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm text-gray-400">
            © 2026 Afrexit. Automated estimate tool plus transaction-readiness support for SMEs.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={onOpenDisclaimer}
              className="text-gray-500 underline underline-offset-4 hover:text-purple-600"
            >
              Important Disclosures
            </button>
            <button
              type="button"
              onClick={onOpenTerms}
              className="text-gray-500 underline underline-offset-4 hover:text-purple-600"
            >
              Terms of Use
            </button>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-gray-500 underline underline-offset-4 hover:text-purple-600"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
