import { resolvePolicyGroup } from './policy-registry.mjs';
import { buildEnterpriseAndEquityValues } from './modules/bridge.mjs';
import { buildConfidenceAssessment } from './modules/confidence.mjs';
import { buildHistoricalSummary } from './modules/history.mjs';
import { selectOwnerMethods, reconcileApproaches } from './modules/method-selection.mjs';
import { buildNormalizedMetrics } from './modules/normalization.mjs';
import { buildAssumptions, buildOwnerResult, buildRedFlags } from './modules/output.mjs';
import { validateCanonicalRequest } from './modules/request-validation.mjs';
import { buildReadinessAssessment, buildScorecard } from './modules/scorecards.mjs';
import { buildMethodNormalizationImpacts, runSelectedApproaches } from './modules/approaches.mjs';
import { buildBranchQualityAdjustment, buildGeographyAdjustment } from './modules/qualitative-adjustments.mjs';

const ENGINE_VERSION = 'owner-phase-skeleton-v0.5';

export function evaluateSubmission(request) {
  validateCanonicalRequest(request);

  const policyResolution = resolvePolicyGroup(request.classification.level2);
  const policyGroup = policyResolution.policyGroup;
  request.classification.policyGroupId = policyResolution.policyGroupId;

  const historicalSummary = buildHistoricalSummary(request);
  const normalizedMetrics = buildNormalizedMetrics(request, policyGroup, historicalSummary);
  const branchQuality = buildBranchQualityAdjustment(request);
  const geographyAdjustment = buildGeographyAdjustment(request.company.primaryState);
  const scorecard = buildScorecard(request);
  const readinessAssessment = buildReadinessAssessment(request, scorecard);
  const { methodOrder, selectedMethods } = selectOwnerMethods(request, policyGroup, normalizedMetrics, scorecard, historicalSummary);
  const approaches = runSelectedApproaches(methodOrder, normalizedMetrics, request, policyGroup, branchQuality);
  const methodNormalizationImpacts = buildMethodNormalizationImpacts(methodOrder, normalizedMetrics, request, policyGroup, branchQuality);
  const reconciled = reconcileApproaches(policyGroup, approaches);
  const confidenceAssessment = buildConfidenceAssessment(
    request,
    scorecard,
    policyResolution,
    request.normalization.schedule,
    historicalSummary,
    normalizedMetrics,
    approaches,
    policyGroup
  );
  const bridgedValues = buildEnterpriseAndEquityValues(
    request,
    reconciled,
    readinessAssessment,
    confidenceAssessment,
    normalizedMetrics,
    policyGroup,
    geographyAdjustment,
    branchQuality
  );
  const redFlags = buildRedFlags(request, readinessAssessment, confidenceAssessment, normalizedMetrics, historicalSummary, selectedMethods);
  const assumptions = buildAssumptions(request, selectedMethods, historicalSummary, normalizedMetrics, policyGroup);

  return buildOwnerResult({
    engineVersion: ENGINE_VERSION,
    request,
    policyGroup,
    historicalSummary,
    scorecard,
    selectedMethods,
    normalizedMetrics,
    values: {
      ...bridgedValues,
      appliedWeights: reconciled.appliedWeights,
      appliedContributions: reconciled.contributions,
    },
    readinessAssessment,
    confidenceAssessment,
    redFlags,
    assumptions,
    approaches,
    methodNormalizationImpacts,
    branchQuality,
    geographyAdjustment,
  });
}
