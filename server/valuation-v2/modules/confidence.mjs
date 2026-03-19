import { average, clamp, safeDivide } from './utils.mjs';
import { scoreFromMap } from './scorecards.mjs';
import { buildBranchQualityAdjustment, scoreOperatingYearsBand } from './qualitative-adjustments.mjs';

function buildNormalizationQualityScore(normalizationSchedule) {
  if (!normalizationSchedule.length) {
    return 45;
  }

  const lineScores = normalizationSchedule.map((item) => {
    let score = 52;
    if (typeof item.reportedAmount === 'number') score += 8;
    if (typeof item.normalizedAmount === 'number') score += 8;
    if (item.evidenceLevel === 'owner_statement') score -= 4;
    if (item.confidence === 'medium') score += 4;
    if (item.confidence === 'high') score += 8;
    return clamp(score, 38, 78);
  });

  return average(lineScores, 50);
}

function buildMethodDispersionPct(approaches) {
  if (approaches.length < 2) {
    return 0;
  }

  const mids = approaches.map((approach) => approach.mid).filter((value) => value > 0);
  if (mids.length < 2) {
    return 0;
  }

  const midPoint = average(mids, 1);
  return safeDivide(Math.max(...mids) - Math.min(...mids), midPoint, 0) * 100;
}

export function buildConfidenceAssessment(request, scorecard, policyResolution, normalizationSchedule, historicalSummary, normalizedMetrics, approaches, policyGroup) {
  const yearsAvailableScore = clamp(38 + (historicalSummary.yearsAvailable - 1) * 18, 38, 86);
  const operatingYearsScore = scoreOperatingYearsBand(request.company.operatingYearsBand);
  const forecastCoverageScore =
    request.financials?.forecast?.forecastYears?.length
      ? request.financials.forecast.forecastConfidence === 'high'
        ? 78
        : request.financials.forecast.forecastConfidence === 'medium'
          ? 68
          : 58
      : undefined;
  const historicalDepthScore = average([yearsAvailableScore, operatingYearsScore, forecastCoverageScore], yearsAvailableScore);
  const workingCapitalCoverage =
    typeof normalizedMetrics.actualWorkingCapital === 'number' && typeof normalizedMetrics.normalizedWorkingCapital === 'number' ? 72 : 42;
  const normalizationQuality = buildNormalizationQualityScore(normalizationSchedule);
  const branchQuality = buildBranchQualityAdjustment(request);
  const calibrationEvidenceScore = policyGroup?.calibration?.evidenceScore ?? 35;
  const calibrationFreshnessStatus = policyGroup?.calibration?.freshnessStatus ?? 'stale';
  const freshnessCoverage = calibrationFreshnessStatus === 'fresh' ? 85 : calibrationFreshnessStatus === 'aging' ? 65 : 40;
  const freshnessDays = policyGroup?.calibration?.freshnessDays ?? 999;
  const sourceReliabilityScore = policyGroup?.calibration?.sourceReliabilityScore ?? 35;
  const internalObservationCount = policyGroup?.calibration?.internalObservationCount ?? 0;
  const benchmarkCoverage = average([
    policyResolution.fallback ? 45 : 68,
    request.evidence.benchmarkCoverage?.transactionCompsAvailable ? 72 : 45,
    request.evidence.benchmarkCoverage?.publicCompsAvailable ? 65 : 42,
    request.evidence.benchmarkCoverage?.workingCapitalBenchmarkAvailable ? 68 : 45,
    calibrationEvidenceScore,
    freshnessCoverage,
    sourceReliabilityScore,
  ]);
  const earningsStability = average([
    historicalSummary.blendedStabilityScore,
    scoreFromMap('growthOutlook', request.operatingProfile.growthOutlook),
    scoreFromMap('marketDemand', request.operatingProfile.marketDemand),
    scoreFromMap('workingCapitalHealth', request.operatingProfile.workingCapitalHealth),
    branchQuality.branchSignalScore,
  ]);
  const methodDispersionPct = buildMethodDispersionPct(approaches);
  const dispersionPenaltyWeight = policyGroup?.ownerPhase?.dispersionPenaltyWeight ?? 0.18;
  const freshnessPenalty = calibrationFreshnessStatus === 'fresh' ? 0 : calibrationFreshnessStatus === 'aging' ? 3 : 7;
  const weakEvidencePenalty = sourceReliabilityScore < 55 ? (55 - sourceReliabilityScore) * 0.14 : 0;
  const internalEvidenceBonus = Math.min(6, internalObservationCount * 1.5);

  const overallScore = clamp(
    historicalDepthScore * 0.2 +
      scorecard.financialQuality * 0.22 +
      normalizationQuality * 0.16 +
      workingCapitalCoverage * 0.12 +
      benchmarkCoverage * 0.14 +
      earningsStability * 0.16 -
      freshnessPenalty -
      weakEvidencePenalty +
      internalEvidenceBonus -
      methodDispersionPct * dispersionPenaltyWeight,
    38,
    90
  );

  const rangeWidthPct = clamp(34 - overallScore * 0.17 + methodDispersionPct * 0.12, 12, 38);
  const notes = [];

  if (historicalSummary.yearsAvailable < 3) notes.push('Owner mode currently has limited historical depth, so the range remains wider than an advisor-grade output.');
  if (request.financials?.forecast?.forecastYears?.length) {
    notes.push('Current-year forecast inputs are included with cautious weight and modestly improve data completeness, but they are still treated as less reliable than completed-year actuals.');
  }
  if (operatingYearsScore < 50) notes.push('The short operating history of the business itself also increases owner-mode uncertainty.');
  if (normalizationSchedule.length > 0) notes.push('Normalization adjustments are quantified from owner-provided amounts, but they remain unverified until advisor review.');
  if (policyResolution.fallback) notes.push('Level 2 policy fell back to a generic owner-operated service policy due to missing registry match.');
  if (policyGroup?.calibration?.source === 'benchmark_calibrated') {
    notes.push(`Policy-group calibration is benchmark-backed, using ${policyGroup.calibration.observationCount} recorded observations across ${policyGroup.calibration.benchmarkSetIds.length} set(s).`);
  }
  if (calibrationFreshnessStatus !== 'fresh') {
    notes.push(
      calibrationFreshnessStatus === 'aging'
        ? `Benchmark evidence is aging (${freshnessDays} days since last verification), so confidence is reduced modestly.`
        : `Benchmark evidence is stale (${freshnessDays} days since last verification), so confidence is reduced until the set is refreshed.`
    );
  }
  if (sourceReliabilityScore < 55) {
    notes.push('Benchmark source quality is still mixed for this policy group, so owner-mode confidence remains constrained.');
  }
  if (internalObservationCount > 0) {
    notes.push(`Calibration already includes ${internalObservationCount} Afrexit internal observation(s), which improves Nigeria relevance.`);
  }
  if (methodDispersionPct > 45) notes.push('The valuation methods are giving materially different answers, which keeps confidence moderate.');
  if (Math.abs(normalizedMetrics.workingCapitalDelta || 0) > normalizedMetrics.revenue * 0.08) {
    notes.push('Working-capital adjustment is material relative to revenue, so the equity bridge is more sensitive than usual.');
  }
  if (branchQuality.branchFamily && typeof branchQuality.branchSignalScore === 'number') {
    notes.push(
      branchQuality.branchSignalScore >= 65
        ? `Branch-specific operating signals for ${branchQuality.branchFamily.replaceAll('_', ' ')} modestly support confidence.`
        : `Branch-specific operating signals for ${branchQuality.branchFamily.replaceAll('_', ' ')} currently weaken confidence modestly.`
    );
  }

  return {
    overallScore: Math.round(overallScore),
    dataCompleteness: Math.round(average([historicalDepthScore, workingCapitalCoverage, normalizationQuality], 50)),
    recordsQuality: Math.round(scorecard.financialQuality),
    benchmarkCoverage: Math.round(benchmarkCoverage),
    earningsStability: Math.round(earningsStability),
    rangeWidthPct: Number(rangeWidthPct.toFixed(1)),
    notes,
  };
}
