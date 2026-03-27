import { Info, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import type { PartialValuationResult } from '@/api/valuation-partial';
import { formatRange } from '@/api/valuation-partial';

interface ConfidenceMeterProps {
  result: PartialValuationResult;
  questionsAnswered: number;
  totalQuestions: number;
  phase: 'anchor' | 'branch' | 'closing';
  previousRange?: { low: number; high: number };
}

export function ConfidenceMeter({
  result,
  questionsAnswered,
  totalQuestions,
  phase,
  previousRange,
}: ConfidenceMeterProps) {
  const { range, confidence, confidenceScore, flags } = result;

  const confidenceLabels: Record<string, { label: string; color: string }> = {
    very_low: { label: 'Very Low', color: 'text-red-500' },
    low: { label: 'Low', color: 'text-orange-500' },
    medium: { label: 'Medium', color: 'text-yellow-600' },
    high: { label: 'High', color: 'text-green-600' },
    very_high: { label: 'Very High', color: 'text-green-700' },
  };

  const confidenceInfo = confidenceLabels[confidence] || confidenceLabels.low;
  const progressWidth = Math.min(100, (confidenceScore / 100) * 100);

  // Calculate range improvement
  const showImprovement = previousRange && 
    (previousRange.high - previousRange.low) > (range.high - range.low);
  
  const rangeImprovement = showImprovement
    ? Math.round(
        ((previousRange.high - previousRange.low) - (range.high - range.low)) /
          (previousRange.high - previousRange.low) *
          100
      )
    : 0;
  const displayedRangeWidth =
    typeof result.rangeWidthPct === 'number' && Number.isFinite(result.rangeWidthPct)
      ? result.rangeWidthPct
      : range.mid > 0
        ? Math.round(((range.high - range.low) / 2 / range.mid) * 100)
        : 0;

  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-purple-900">Valuation Confidence</p>
          <p className={`text-2xl font-bold ${confidenceInfo.color}`}>
            {confidenceInfo.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-purple-700">Current Range</p>
          <p className="text-xl font-bold text-purple-900">
            {formatRange(range.low, range.high)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 w-full rounded-full bg-purple-200">
          <div
            className="h-2 rounded-full bg-purple-600 transition-all duration-500"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-purple-600">
          <span>Speculative</span>
          <span>Preliminary</span>
          <span>Precise</span>
        </div>
      </div>

      {/* Range Tightening Indicator */}
      {showImprovement && rangeImprovement > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">
          <TrendingDown className="h-4 w-4" />
          <span>Range tightened by {rangeImprovement}%</span>
        </div>
      )}

      {/* What's Included */}
      <div className="mb-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-purple-700">
          What's included
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-purple-900">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Revenue and profit foundation</span>
          </div>
          {phase !== 'anchor' && (
            <div className="flex items-center gap-2 text-sm text-purple-900">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Industry-specific factors</span>
            </div>
          )}
          {phase === 'closing' && (
            <>
              <div className="flex items-center gap-2 text-sm text-purple-900">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Owner transferability</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-900">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Working capital position</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* What's Still Needed */}
      {phase !== 'closing' && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-purple-700">
            Still needed for higher confidence
          </p>
          <div className="space-y-1">
            {phase === 'anchor' && (
              <>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <div className="h-4 w-4 rounded-full border-2 border-purple-300" />
                  <span>Industry-specific operations</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <div className="h-4 w-4 rounded-full border-2 border-purple-300" />
                  <span>Owner transferability</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <div className="h-4 w-4 rounded-full border-2 border-purple-300" />
                  <span>Working capital details</span>
                </div>
              </>
            )}
            {phase === 'branch' && (
              <>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <div className="h-4 w-4 rounded-full border-2 border-purple-300" />
                  <span>Owner transferability</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <div className="h-4 w-4 rounded-full border-2 border-purple-300" />
                  <span>Working capital position</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Range Width Indicator */}
      <div className="mb-4 rounded-lg bg-white/60 p-3">
        <p className="text-sm text-purple-900">
          <span className="font-medium">Range width: </span>
          ±{displayedRangeWidth.toFixed(1)}%
        </p>
        {phase !== 'closing' && (
          <p className="text-xs text-purple-700">
            With full assessment: Typically tightens to ±15-20%
          </p>
        )}
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="space-y-2">
          {flags.map((flag, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 rounded-lg p-2 text-sm ${
                flag.type === 'warning'
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              {flag.type === 'warning' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{flag.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Question Counter */}
      <div className="mt-4 border-t border-purple-200 pt-3">
        <p className="text-xs text-purple-600">
          Question {questionsAnswered} of ~{totalQuestions}
        </p>
      </div>
    </div>
  );
}
