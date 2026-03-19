import { RotateCcw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResultData } from '@/types/valuation';

interface ResultsPageProps {
  result: ResultData;
  onRestart: () => void;
  onEdit: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatOptionalCurrency(value: number | undefined) {
  return typeof value === 'number' ? formatCurrency(value) : 'N/A';
}

function formatPercent(value: number) {
  return `${Math.round(value)} / 100`;
}

function formatRatioPercent(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return 'N/A';
  }

  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
}

function formatMethodLabel(value: string) {
  return value.replaceAll('_', ' ');
}

function formatAdjustmentDirection(value: string) {
  if (value === 'add_back') return 'Add-back';
  if (value === 'remove') return 'Remove';
  if (value === 'bridge_only') return 'Bridge only';
  return value;
}

function formatAdjustmentAffects(value: string) {
  return value.toUpperCase().replaceAll('_', ' ');
}

function formatFactor(value: number | undefined) {
  return typeof value === 'number' ? `${value.toFixed(3)}x` : 'N/A';
}

export function ResultsPage({ result, onRestart, onEdit }: ResultsPageProps) {
  const summary = result.summary;
  const actualWorkingCapital = result.normalizedMetrics.actualWorkingCapital;
  const normalizedWorkingCapital = result.normalizedMetrics.normalizedWorkingCapital;
  const methodNormalizationImpacts = result.valueConclusion.reconciliation?.methodNormalizationImpacts || [];
  const qualitativeAdjustments = result.audit.qualitativeAdjustments;
  const workingCapitalGap =
    typeof actualWorkingCapital === 'number' && typeof normalizedWorkingCapital === 'number'
      ? actualWorkingCapital - normalizedWorkingCapital
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium uppercase tracking-[0.22em] text-gray-500">Business Valuation Report</div>
            <h1 className="text-4xl font-semibold tracking-tight text-black">{summary.businessName}</h1>
            <p className="text-base text-gray-600">
              Detailed valuation based on industry benchmarks and your business profile.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onEdit} className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50">
              Edit Answers
            </Button>
            <Button onClick={onRestart} className="bg-purple-600 text-white hover:bg-purple-700">
              <RotateCcw className="mr-2 h-4 w-4" />
              Start New Estimate
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm uppercase tracking-[0.18em] text-gray-500">Conservative Estimate</div>
            <div className="mt-4 text-3xl font-semibold text-gray-900">{formatCurrency(summary.lowEstimate)}</div>
          </div>
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
            <div className="text-sm uppercase tracking-[0.18em] text-purple-700">Most Likely Value</div>
            <div className="mt-4 text-3xl font-semibold text-purple-900">{formatCurrency(summary.adjustedValue)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm uppercase tracking-[0.18em] text-gray-500">Optimistic Estimate</div>
            <div className="mt-4 text-3xl font-semibold text-gray-900">{formatCurrency(summary.highEstimate)}</div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-gray-500">
              <TrendingUp className="h-4 w-4" />
              Business Health Scores
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Sale Readiness</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatPercent(summary.readinessScore)}</div>
                <div className="mt-1 text-sm text-purple-600">{summary.rating}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Estimate Confidence</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatPercent(summary.confidenceScore)}</div>
                <div className="mt-1 text-sm text-gray-600">Based on data quality</div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Market Position</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatPercent(summary.scorecard.marketPosition)}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Financial Quality</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatPercent(summary.scorecard.financialQuality)}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Owner Independence</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatPercent(summary.scorecard.ownerIndependence)}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Revenue Quality</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatPercent(summary.scorecard.revenueQuality)}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Operating Resilience</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatPercent(summary.scorecard.operatingResilience)}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Transaction Readiness</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatPercent(summary.scorecard.transactionReadiness)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-gray-500">
              Valuation Methodology
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm leading-7 text-purple-900">
              This valuation uses industry-specific benchmarks, market multiples, and your financial inputs to calculate 
              a probable range. Results depend on the accuracy of your inputs and market conditions.
            </div>
            <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm leading-7 text-gray-700">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">Method policy</div>
              <div className="mt-2">Policy group: {result.classification.policyGroupId}</div>
              <div>Primary method: {formatMethodLabel(result.selectedMethods.primaryMethod)}</div>
              {result.selectedMethods.secondaryMethods.length > 0 ? (
                <div>Secondary methods: {result.selectedMethods.secondaryMethods.map(formatMethodLabel).join(', ')}</div>
              ) : null}
              <div className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">Qualitative Adjustments</div>
              <div className="mt-2">Primary state bucket: {qualitativeAdjustments?.geographyBucket || 'N/A'}</div>
              <div>Geography factor: {formatFactor(qualitativeAdjustments?.geographyAdjustmentFactor)}</div>
              <div>Branch family: {qualitativeAdjustments?.branchFamily ? formatMethodLabel(qualitativeAdjustments.branchFamily) : 'N/A'}</div>
              <div>Branch quality factor: {formatFactor(qualitativeAdjustments?.branchQualityFactor)}</div>
              <div className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">Calibration</div>
              <div className="mt-2">Source: {formatMethodLabel(result.calibrationContext.source)}</div>
              <div>Benchmark observations: {result.calibrationContext.observationCount}</div>
              <div>Evidence score: {formatPercent(result.calibrationContext.evidenceScore)}</div>
              {result.calibrationContext.benchmarkSetIds.length > 0 ? (
                <div>Benchmark sets: {result.calibrationContext.benchmarkSetIds.join(', ')}</div>
              ) : null}
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-gray-700">
              {summary.warnings.length > 0 ? (
                summary.warnings.map((warning) => (
                  <li key={warning} className="rounded-2xl bg-gray-50 px-4 py-3">
                    {warning}
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-gray-50 px-4 py-3">No immediate warning flags were raised by this draft engine.</li>
              )}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Historical trend view</div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm text-slate-400">Years available</div>
              <div className="mt-2 text-lg font-semibold">{result.historyAnalysis.yearsAvailable}</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm text-slate-400">Latest revenue change</div>
              <div className="mt-2 text-lg font-semibold">{formatRatioPercent(result.historyAnalysis.revenueGrowthPct)}</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm text-slate-400">Revenue stability</div>
              <div className="mt-2 text-lg font-semibold">{formatPercent(result.historyAnalysis.revenueStabilityScore)}</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm text-slate-400">Margin stability</div>
              <div className="mt-2 text-lg font-semibold">{formatPercent(result.historyAnalysis.marginStabilityScore)}</div>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
            <div>Representative period basis: {result.historyAnalysis.representativePeriodId}</div>
            <div>Representative revenue: {formatCurrency(result.historyAnalysis.representativeRevenue)}</div>
            <div>Representative operating profit: {formatCurrency(result.historyAnalysis.representativeOperatingProfit)}</div>
          </div>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
            <div className="grid min-w-[760px] grid-cols-[1.1fr_1fr_1fr_0.8fr_1fr] gap-3 bg-white/5 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              <div>Period</div>
              <div>Revenue</div>
              <div>Operating profit</div>
              <div>Margin</div>
              <div>Working capital</div>
            </div>
            {result.historyAnalysis.periods.map((period) => (
              <div
                key={period.periodId}
                className="grid min-w-[760px] grid-cols-[1.1fr_1fr_1fr_0.8fr_1fr] gap-3 border-t border-white/10 px-4 py-4 text-sm text-slate-200"
              >
                <div>
                  <div className="font-medium">{period.label}</div>
                  {period.isLatest ? <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest submitted year</div> : null}
                </div>
                <div>{formatCurrency(period.revenue)}</div>
                <div>{formatCurrency(period.operatingProfit)}</div>
                <div>{formatRatioPercent(period.operatingMarginPct)}</div>
                <div>{formatOptionalCurrency(period.workingCapital)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Normalized operating view</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">Representative period</div>
                <div className="mt-2 text-lg font-semibold">{result.normalizedMetrics.representativePeriodId}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">Normalized revenue</div>
                <div className="mt-2 text-lg font-semibold">{formatCurrency(result.normalizedMetrics.revenue)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">Adjusted EBIT</div>
                <div className="mt-2 text-lg font-semibold">{formatOptionalCurrency(result.normalizedMetrics.adjustedEbit)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">Adjusted EBITDA</div>
                <div className="mt-2 text-lg font-semibold">{formatOptionalCurrency(result.normalizedMetrics.adjustedEbitda)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">SDE</div>
                <div className="mt-2 text-lg font-semibold">{formatOptionalCurrency(result.normalizedMetrics.sde)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">Maintenance capex</div>
                <div className="mt-2 text-lg font-semibold">{formatOptionalCurrency(result.normalizedMetrics.maintenanceCapex)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Working Capital and Bridge</div>
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">Actual working capital</div>
                <div className="mt-2 text-lg font-semibold">{formatOptionalCurrency(actualWorkingCapital)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">Normalized working capital</div>
                <div className="mt-2 text-lg font-semibold">{formatOptionalCurrency(normalizedWorkingCapital)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">Working-capital gap</div>
                <div className="mt-2 text-lg font-semibold">{formatOptionalCurrency(workingCapitalGap)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-slate-400">Net debt</div>
                <div className="mt-2 text-lg font-semibold">{formatOptionalCurrency(result.normalizedMetrics.netDebt)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Value Structure</div>
            <div className="space-y-3 text-sm leading-7 text-slate-300">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">Fundamental equity range</div>
                <div className="mt-2 font-semibold">
                  {formatCurrency(result.valueConclusion.equityValue.fundamentalLow)} to {formatCurrency(result.valueConclusion.equityValue.fundamentalHigh)}
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">Achievable today equity range</div>
                <div className="mt-2 font-semibold">
                  {formatCurrency(result.valueConclusion.equityValue.achievableTodayLow)} to {formatCurrency(result.valueConclusion.equityValue.achievableTodayHigh)}
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">Fundamental enterprise mid</div>
                <div className="mt-2 font-semibold">{formatCurrency(result.valueConclusion.enterpriseValue.fundamentalMid)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">Achievable today enterprise mid</div>
                <div className="mt-2 font-semibold">{formatCurrency(result.valueConclusion.enterpriseValue.achievableTodayMid)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Method Reconciliation</div>
            <div className="space-y-3 text-sm leading-7 text-slate-300">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">Market approach</div>
                <div className="mt-2 font-semibold">{formatOptionalCurrency(result.valueConclusion.reconciliation?.marketApproach)}</div>
                <div className="text-slate-500">Weight: {result.valueConclusion.reconciliation?.appliedWeights?.market_multiple ?? 'N/A'}</div>
                {methodNormalizationImpacts.find((impact) => impact.method === 'market_multiple') ? (
                  <div className="mt-2 text-slate-500">
                    Normalization impact:{' '}
                    {formatOptionalCurrency(methodNormalizationImpacts.find((impact) => impact.method === 'market_multiple')?.deltaMid)}
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">Income approach</div>
                <div className="mt-2 font-semibold">{formatOptionalCurrency(result.valueConclusion.reconciliation?.incomeApproach)}</div>
                <div className="text-slate-500">Weight: {result.valueConclusion.reconciliation?.appliedWeights?.capitalized_earnings ?? 'N/A'}</div>
                {methodNormalizationImpacts.find((impact) => impact.method === 'capitalized_earnings') ? (
                  <div className="mt-2 text-slate-500">
                    Normalization impact:{' '}
                    {formatOptionalCurrency(methodNormalizationImpacts.find((impact) => impact.method === 'capitalized_earnings')?.deltaMid)}
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">Asset approach</div>
                <div className="mt-2 font-semibold">{formatOptionalCurrency(result.valueConclusion.reconciliation?.assetApproach)}</div>
                <div className="text-slate-500">Weight: {result.valueConclusion.reconciliation?.appliedWeights?.asset_approach ?? 'N/A'}</div>
                {methodNormalizationImpacts.find((impact) => impact.method === 'asset_approach') ? (
                  <div className="mt-2 text-slate-500">
                    Normalization impact:{' '}
                    {formatOptionalCurrency(methodNormalizationImpacts.find((impact) => impact.method === 'asset_approach')?.deltaMid)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Normalization impact by method</div>
          <div className="grid gap-3 lg:grid-cols-3">
            {methodNormalizationImpacts.map((impact) => (
              <div key={impact.method} className="rounded-2xl bg-white/5 p-4 text-sm leading-7 text-slate-300">
                <div className="font-medium text-white">{formatMethodLabel(impact.method)}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{formatMethodLabel(impact.driverMetric)}</div>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-xl bg-slate-950/30 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Raw driver</div>
                    <div className="mt-1 font-medium">{formatOptionalCurrency(impact.rawDriverMetricValue)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/30 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Normalized driver</div>
                    <div className="mt-1 font-medium">{formatOptionalCurrency(impact.normalizedDriverMetricValue)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/30 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Raw mid value</div>
                    <div className="mt-1 font-medium">{formatOptionalCurrency(impact.rawMid)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/30 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Normalized mid value</div>
                    <div className="mt-1 font-medium">{formatOptionalCurrency(impact.normalizedMid)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/30 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Value delta from normalization</div>
                    <div className="mt-1 font-medium">{formatOptionalCurrency(impact.deltaMid)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Confidence Notes</div>
            <ul className="space-y-3 text-sm leading-7 text-slate-300">
              {result.confidenceAssessment.notes.map((note) => (
                <li key={note} className="rounded-2xl bg-white/5 px-4 py-3">
                  {note}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Normalization Schedule</div>
            {result.normalizationSchedule.length > 0 ? (
              <div className="space-y-3 text-sm leading-7 text-slate-300">
                {result.normalizationSchedule.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{item.label}</div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {formatMethodLabel(item.category)} · {formatAdjustmentDirection(item.direction)} · {formatAdjustmentAffects(item.affects)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Adjustment amount</div>
                        <div className="font-semibold">{formatCurrency(item.adjustmentAmount)}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-950/30 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Reported</div>
                        <div className="mt-1 font-medium">{formatOptionalCurrency(item.reportedAmount)}</div>
                      </div>
                      <div className="rounded-xl bg-slate-950/30 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Normalized</div>
                        <div className="mt-1 font-medium">{formatOptionalCurrency(item.normalizedAmount)}</div>
                      </div>
                    </div>
                    {item.notes ? <div className="mt-3 text-sm text-slate-400">{item.notes}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm leading-7 text-slate-300">
                No normalization line items were added to this owner-mode run.
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Assumptions</div>
            <ul className="space-y-3 text-sm leading-7 text-slate-300">
              {result.assumptions.map((assumption) => (
                <li key={assumption} className="rounded-2xl bg-white/5 px-4 py-3">
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
