import type { PartialFactorCard, PartialValuationResult } from '@/api/valuation-partial';

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}m`;
}

function formatFactor(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${value.toFixed(3)}x`;
}

function formatSignedMoneyDelta(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return '0';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value)}`;
}

function formatSignedDelta(value: number | null | undefined, suffix = '') {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return `0${suffix}`;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}${suffix}`;
}

function getTopFactors(factors: PartialFactorCard[]) {
  return [...factors]
    .sort((left, right) => Math.abs((right.factor || 1) - 1) - Math.abs((left.factor || 1) - 1))
    .slice(0, 6);
}

interface LiveEstimateDebugPanelProps {
  result: PartialValuationResult;
  previousResult?: PartialValuationResult | null;
}

export function LiveEstimateDebugPanel({ result, previousResult }: LiveEstimateDebugPanelProps) {
  const currentAdjustedValue = result.preciseAdjustedValue ?? result.adjustedValue;
  const previousAdjustedValue = previousResult?.preciseAdjustedValue ?? previousResult?.adjustedValue ?? currentAdjustedValue;
  const adjustedValueDelta = currentAdjustedValue - previousAdjustedValue;
  const readinessDelta = result.readinessScore - (previousResult?.readinessScore ?? result.readinessScore);
  const confidenceDelta = result.confidenceScore - (previousResult?.confidenceScore ?? result.confidenceScore);
  const rangeWidthDelta = result.rangeWidthPct - (previousResult?.rangeWidthPct ?? result.rangeWidthPct);
  const topFactors = getTopFactors(result.factorCards || []);
  const hasMovement =
    adjustedValueDelta !== 0 ||
    readinessDelta !== 0 ||
    confidenceDelta !== 0 ||
    Number(rangeWidthDelta.toFixed(3)) !== 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Internal Live Debug</p>
          <p className="mt-1 text-sm text-slate-300">
            Review-only view of the live estimate path. Normal users do not need this.
          </p>
        </div>
        <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
          {result.sourceModel === 'owner_engine' ? 'Source: full owner engine' : 'Source: local fallback'}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Adjusted Value</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatMoney(currentAdjustedValue)}</p>
          <p className={`mt-2 text-sm ${adjustedValueDelta > 0 ? 'text-emerald-300' : adjustedValueDelta < 0 ? 'text-rose-300' : 'text-slate-400'}`}>
            {formatSignedMoneyDelta(adjustedValueDelta)} vs previous answer
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Readiness</p>
          <p className="mt-2 text-2xl font-semibold text-white">{result.readinessScore.toFixed(1)}</p>
          <p className={`mt-2 text-sm ${readinessDelta > 0 ? 'text-emerald-300' : readinessDelta < 0 ? 'text-rose-300' : 'text-slate-400'}`}>
            {formatSignedDelta(readinessDelta)} pts
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Confidence</p>
          <p className="mt-2 text-2xl font-semibold text-white">{result.confidenceScore.toFixed(1)}</p>
          <p className={`mt-2 text-sm ${confidenceDelta > 0 ? 'text-emerald-300' : confidenceDelta < 0 ? 'text-rose-300' : 'text-slate-400'}`}>
            {formatSignedDelta(confidenceDelta)} pts
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Range Width</p>
          <p className="mt-2 text-2xl font-semibold text-white">{result.rangeWidthPct.toFixed(1)}%</p>
          <p className={`mt-2 text-sm ${rangeWidthDelta < 0 ? 'text-emerald-300' : rangeWidthDelta > 0 ? 'text-rose-300' : 'text-slate-400'}`}>
            {formatSignedDelta(rangeWidthDelta, '%')} pts
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Method Context</p>
            <p className="mt-1 text-sm text-slate-200">{result.primaryMethod || 'No method yet'}</p>
          </div>
          <div className="text-sm text-slate-300">
            {hasMovement
              ? 'The last answered question moved at least one live metric.'
              : 'The last answered question did not change midpoint, readiness, confidence, or range width.'}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top Active Factors</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topFactors.length ? (
            topFactors.map((factor) => (
              <div key={factor.key} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{factor.label}</p>
                  <span className="text-sm font-semibold text-cyan-300">{formatFactor(factor.factor)}</span>
                </div>
                {typeof factor.signalScore === 'number' ? (
                  <p className="mt-1 text-xs text-slate-400">Signal score: {factor.signalScore}</p>
                ) : null}
                {factor.note ? <p className="mt-2 text-xs leading-5 text-slate-400">{factor.note}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No active factors yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
