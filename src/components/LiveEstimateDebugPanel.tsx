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
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return null;
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
  const fundamentalEnterpriseMid = result.fundamentalEnterpriseMid;
  const achievableEnterpriseMid = result.achievableEnterpriseMid;
  const bridgeDelta = result.bridgeDelta;
  const readinessDelta = result.readinessScore - (previousResult?.readinessScore ?? result.readinessScore);
  const confidenceDelta = result.confidenceScore - (previousResult?.confidenceScore ?? result.confidenceScore);
  const rangeWidthDelta = result.rangeWidthPct - (previousResult?.rangeWidthPct ?? result.rangeWidthPct);
  const topFactors = getTopFactors(result.factorCards || []);
  const hasMovement =
    adjustedValueDelta !== 0 ||
    readinessDelta !== 0 ||
    confidenceDelta !== 0 ||
    Number(rangeWidthDelta.toFixed(3)) !== 0;

  const signedDelta = formatSignedMoneyDelta(adjustedValueDelta);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 shadow-xl">

      {/* Panel header */}
      <div className="border-b border-slate-700/50 bg-slate-800/70 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400">
              Analyst View
            </p>
            <p className="mt-1 text-[12px] leading-5 text-slate-400">
              Live estimate · not visible to users
            </p>
          </div>
          <span className={`mt-0.5 shrink-0 rounded px-2 py-1 text-[11px] font-medium ring-1 ${
            result.sourceModel === 'owner_engine'
              ? 'bg-purple-950/60 text-purple-300 ring-purple-700/40'
              : 'bg-slate-800 text-slate-400 ring-slate-600/40'
          }`}>
            {result.sourceModel === 'owner_engine' ? 'Full engine' : 'Local fallback'}
          </span>
        </div>
      </div>

      {/* KPI sections separated by hairline dividers */}
      <div className="divide-y divide-slate-800">

        {/* Adjusted Value — full width, primary KPI */}
        <div className="px-5 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
            Adjusted Value
          </p>
          <p className="mt-2.5 text-[30px] font-semibold leading-none tracking-tight text-white">
            {formatMoney(currentAdjustedValue)}
          </p>
          <p className={`mt-2 text-[12px] ${
            adjustedValueDelta > 0 ? 'text-emerald-400' : adjustedValueDelta < 0 ? 'text-rose-400' : 'text-slate-600'
          }`}>
            {signedDelta ? `${signedDelta} vs previous answer` : 'No change vs previous answer'}
          </p>
          {(typeof fundamentalEnterpriseMid === 'number' || typeof achievableEnterpriseMid === 'number' || typeof bridgeDelta === 'number') ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-800/30 px-3.5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                Value Bridge
              </p>
              <div className="mt-2 space-y-1.5 text-[12px] text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Fundamental enterprise mid</span>
                  <span className="font-medium text-white">{formatMoney(fundamentalEnterpriseMid)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Achievable enterprise mid</span>
                  <span className="font-medium text-white">{formatMoney(achievableEnterpriseMid)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Bridge delta</span>
                  <span className={`font-medium ${typeof bridgeDelta === 'number' && bridgeDelta < 0 ? 'text-rose-400' : typeof bridgeDelta === 'number' && bridgeDelta > 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {formatSignedMoneyDelta(bridgeDelta) ?? formatMoney(bridgeDelta)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Readiness + Confidence — 2-column */}
        <div className="grid grid-cols-2 divide-x divide-slate-800">
          <div className="px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Readiness
            </p>
            <p className="mt-2 text-[22px] font-semibold leading-none text-white">
              {result.readinessScore.toFixed(1)}
            </p>
            <p className={`mt-2 text-[12px] ${
              readinessDelta > 0 ? 'text-emerald-400' : readinessDelta < 0 ? 'text-rose-400' : 'text-slate-600'
            }`}>
              {formatSignedDelta(readinessDelta)} pts
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Confidence
            </p>
            <p className="mt-2 text-[22px] font-semibold leading-none text-white">
              {result.confidenceScore.toFixed(1)}
            </p>
            <p className={`mt-2 text-[12px] ${
              confidenceDelta > 0 ? 'text-emerald-400' : confidenceDelta < 0 ? 'text-rose-400' : 'text-slate-600'
            }`}>
              {formatSignedDelta(confidenceDelta)} pts
            </p>
          </div>
        </div>

        {/* Range Width */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Range Width
            </p>
            <p className="mt-2 text-[22px] font-semibold leading-none text-white">
              {result.rangeWidthPct.toFixed(1)}%
            </p>
          </div>
          <p className={`shrink-0 text-[13px] font-medium ${
            rangeWidthDelta < 0 ? 'text-emerald-400' : rangeWidthDelta > 0 ? 'text-rose-400' : 'text-slate-600'
          }`}>
            {formatSignedDelta(rangeWidthDelta, '%')} pts
          </p>
        </div>

        {/* Method Context */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
            Method
          </p>
          <p className="mt-2 text-[13px] font-medium text-slate-200">
            {result.primaryMethodDetail || result.primaryMethod || 'No method selected yet'}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              hasMovement ? 'bg-emerald-400' : 'bg-slate-700'
            }`} />
            <span className="text-[11px] text-slate-500">
              {hasMovement
                ? 'Last answer moved at least one metric'
                : 'Last answer had no effect on metrics'}
            </span>
          </div>
        </div>

        {/* Top Active Factors */}
        <div className="px-5 py-5">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
            Top Active Factors
          </p>
          {topFactors.length ? (
            <div className="space-y-2">
              {topFactors.map((factor) => (
                <div
                  key={factor.key}
                  className="rounded-lg border border-slate-800 bg-slate-800/30 px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[12px] font-medium leading-5 text-slate-200">
                      {factor.label}
                    </p>
                    <span className={`shrink-0 text-[13px] font-semibold tabular-nums ${
                      (factor.factor ?? 1) > 1
                        ? 'text-emerald-400'
                        : (factor.factor ?? 1) < 1
                          ? 'text-rose-400'
                          : 'text-slate-500'
                    }`}>
                      {formatFactor(factor.factor)}
                    </span>
                  </div>
                  {(typeof factor.signalScore === 'number' || factor.note) ? (
                    <div className="mt-1.5 space-y-1">
                      {typeof factor.signalScore === 'number' ? (
                        <p className="text-[11px] text-slate-600">
                          Signal score: {factor.signalScore}
                        </p>
                      ) : null}
                      {factor.note ? (
                        <p className="text-[11px] leading-4 text-slate-500">{factor.note}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-slate-500">No active factors yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}
