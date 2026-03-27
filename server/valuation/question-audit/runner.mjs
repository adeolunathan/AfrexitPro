import { evaluateSubmission } from '../owner-engine.mjs';
import { getAuditBaseline } from './fixtures.mjs';
import { getQuestionManifestEntry, listQuestionEffectManifest, validateQuestionAuditManifest } from './manifest.mjs';
import { applyQuestionValueMutation, getByPath, setByPath } from './request-mutations.mjs';

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveAuditMetricPath(metricPath) {
  if (metricPath === 'summary.adjustedValue') return 'audit.calculationLedger.bridge.achievableEquityMid';
  if (metricPath === 'summary.lowEstimate') return 'audit.calculationLedger.bridge.achievableEquityLow';
  if (metricPath === 'summary.highEstimate') return 'audit.calculationLedger.bridge.achievableEquityHigh';
  if (metricPath === 'summary.readinessScore') return 'audit.calculationLedger.readiness.overallScore';
  if (metricPath === 'summary.confidenceScore') return 'audit.calculationLedger.confidence.overallAfterClamp';
  return metricPath;
}

const DOMAIN_SIGNAL_PATHS = {
  value: 'audit.calculationLedger.bridge.achievableEquityMid',
  readiness: 'audit.calculationLedger.readiness.overallScore',
  confidence: 'audit.calculationLedger.confidence.overallAfterClamp',
};

function formatSummary(result) {
  const qualitativeAdjustments =
    result.valueConclusion?.reconciliation?.qualitativeAdjustments || result.audit?.qualitativeAdjustments || {};

  return {
    adjustedValue: result.summary.adjustedValue,
    lowEstimate: result.summary.lowEstimate,
    highEstimate: result.summary.highEstimate,
    preciseAdjustedValue: result.audit?.calculationLedger?.bridge?.achievableEquityMid ?? result.summary.adjustedValue,
    preciseLowEstimate: result.audit?.calculationLedger?.bridge?.achievableEquityLow ?? result.summary.lowEstimate,
    preciseHighEstimate: result.audit?.calculationLedger?.bridge?.achievableEquityHigh ?? result.summary.highEstimate,
    readinessScore: result.summary.readinessScore,
    confidenceScore: result.summary.confidenceScore,
    primaryMethod: result.selectedMethods.primaryMethod,
    secondaryMethods: result.selectedMethods.secondaryMethods || [],
    marketPosition: result.summary.scorecard.marketPosition,
    financialQuality: result.summary.scorecard.financialQuality,
    ownerIndependence: result.summary.scorecard.ownerIndependence,
    revenueQuality: result.summary.scorecard.revenueQuality,
    operatingResilience: result.summary.scorecard.operatingResilience,
    transactionReadiness: result.summary.scorecard.transactionReadiness,
    branchQualityFactor: qualitativeAdjustments.branchQualityFactor ?? 1,
    geographyAdjustmentFactor: qualitativeAdjustments.geographyAdjustmentFactor ?? 1,
    level1AdjustmentFactor: qualitativeAdjustments.level1AdjustmentFactor ?? 1,
    transactionContextFactor: qualitativeAdjustments.transactionContextFactor ?? 1,
    urgencyFactor: qualitativeAdjustments.achievableUrgencyFactor ?? 1,
    marketPositionAdjustmentFactor: qualitativeAdjustments.marketPositionAdjustmentFactor ?? 1,
    fxExposureAdjustmentFactor: qualitativeAdjustments.fxExposureAdjustmentFactor ?? 1,
    traceabilityAdjustmentFactor: qualitativeAdjustments.traceabilityAdjustmentFactor ?? 1,
  };
}

function buildBaseRow(label, inputValue, result, manifestEntry, baselineResult) {
  const metricPath = manifestEntry.primaryMetricPath ? resolveAuditMetricPath(manifestEntry.primaryMetricPath) : null;
  const metricValue = metricPath ? getByPath(result, metricPath) : null;
  const baselineMetricValue = metricPath ? getByPath(baselineResult, metricPath) : null;

  return {
    label,
    inputValue,
    metricPath,
    metricValue,
    metricDelta:
      typeof metricValue === 'number' && typeof baselineMetricValue === 'number' ? metricValue - baselineMetricValue : null,
    summary: formatSummary(result),
    result,
    selectedMethods: {
      primaryMethod: result.selectedMethods.primaryMethod,
      secondaryMethods: result.selectedMethods.secondaryMethods || [],
    },
  };
}

function applyTransform(request, transform) {
  if (!transform) {
    return request;
  }

  if (transform.kind === 'financial_history_shift') {
    const latest = request.financials?.historicals?.[0];
    if (latest) {
      latest.revenue = Number(((latest.revenue || 0) * (transform.latestRevenueFactor || 1)).toFixed(4));
      latest.operatingProfit = Number(((latest.operatingProfit || 0) * (transform.latestOperatingProfitFactor || 1)).toFixed(4));
      if (typeof latest.ebit === 'number') {
        latest.ebit = Number((latest.ebit * (transform.latestOperatingProfitFactor || 1)).toFixed(4));
      }
    }
  }

  return request;
}

function buildRuns(manifestEntry, baseline) {
  if (manifestEntry.auditStrategy === 'context_only') {
    return [];
  }

  if (manifestEntry.auditStrategy === 'custom_runs') {
    return manifestEntry.customRuns.map((run) => {
      if (run.sourceBaselineId) {
        const sourceBaseline = getAuditBaseline(run.sourceBaselineId);
        return {
          label: run.label,
          inputValue: run.sourceBaselineId,
          request: deepClone(sourceBaseline.fixture.request),
          note: `Using ${sourceBaseline.label}.`,
        };
      }

      if (!baseline) {
        throw new Error(`Question ${manifestEntry.questionId} needs a baseline for custom mutation run ${run.label}.`);
      }

      const request = deepClone(baseline.fixture.request);
      if (run.mutationPath) {
        setByPath(request, run.mutationPath, run.value);
      }
      if (run.transform) {
        applyTransform(request, run.transform);
      }

      return {
        label: run.label,
        inputValue: run.value ?? run.transform?.kind ?? run.label,
        request,
      };
    });
  }

  if (manifestEntry.auditStrategy === 'numeric_values') {
    return (manifestEntry.testValues || []).map((value) => {
      const request = deepClone(baseline.fixture.request);
      applyQuestionValueMutation(request, {
        questionId: manifestEntry.questionId,
        canonicalPath: manifestEntry.canonicalPath,
        value,
      });
      return {
        label: String(value),
        inputValue: value,
        request,
      };
    });
  }

  return (manifestEntry.optionOrder || []).map((value) => {
    const request = deepClone(baseline.fixture.request);
    applyQuestionValueMutation(request, {
      questionId: manifestEntry.questionId,
      canonicalPath: manifestEntry.canonicalPath,
      value,
    });
    return {
      label: String(value),
      inputValue: value,
      request,
    };
  });
}

function collectAllowedSignals(row, manifestEntry) {
  return manifestEntry.allowedImpactDomains
    .map((domain) => DOMAIN_SIGNAL_PATHS[domain])
    .filter(Boolean)
    .map((path) => getByPath(row.result, path));
}

function compareNumericSequence(values, direction, allowTies) {
  for (let index = 1; index < values.length; index += 1) {
    const current = values[index];
    const previous = values[index - 1];
    if (!Number.isFinite(current) || !Number.isFinite(previous)) {
      return false;
    }
    if (direction === 'asc' && current < previous) {
      return false;
    }
    if (direction === 'desc' && current > previous) {
      return false;
    }
  }
  return true;
}

function buildQuestionStatus(manifestEntry, baselineRow, rows) {
  if (manifestEntry.auditStrategy === 'context_only') {
    return {
      overallStatus: 'context-only by design',
      directionPassed: null,
      tiePolicyPassed: null,
      influencePassed: true,
      methodSwitchPassed: true,
      failureReasons: [],
    };
  }

  if (manifestEntry.auditClass === 'structural_classifier') {
    return {
      overallStatus: 'structural by design',
      directionPassed: null,
      tiePolicyPassed: null,
      influencePassed: true,
      methodSwitchPassed: true,
      failureReasons: [],
    };
  }

  const metricValues = rows.map((row) => Number(row.metricValue));
  const allowTies = manifestEntry.monotonicity === 'weak_monotonic_allowed_ties';
  const directionPassed =
    manifestEntry.expectedDirection && manifestEntry.monotonicity !== 'non_monotonic_by_design'
      ? compareNumericSequence(metricValues, manifestEntry.expectedDirection, allowTies)
      : null;

  const tiePolicyPassed =
    manifestEntry.monotonicity === 'strictly_monotonic'
      ? rows.every((row, index) => index === 0 || row.metricValue !== rows[index - 1].metricValue)
      : true;

  const baselineSignals = collectAllowedSignals(baselineRow, manifestEntry);
  const influencePassed = rows.some((row) =>
    collectAllowedSignals(row, manifestEntry).some((signal, index) => signal !== baselineSignals[index])
  );

  const uniqueMethodSets = new Set(
    rows.map((row) => [row.selectedMethods.primaryMethod, ...(row.selectedMethods.secondaryMethods || [])].join('|'))
  );
  const methodSwitchPassed = manifestEntry.allowMethodSwitch ? true : uniqueMethodSets.size <= 1;

  const failureReasons = [];
  if (!influencePassed) failureReasons.push('no_effect_on_allowed_outputs');
  if (directionPassed === false) failureReasons.push('wrong_direction');
  if (!tiePolicyPassed) failureReasons.push('unexpected_tie');
  if (!methodSwitchPassed) failureReasons.push('unexpected_method_switch');

  let overallStatus = 'passing';
  if (!influencePassed) {
    overallStatus = 'no-effect';
  } else if (directionPassed === false) {
    overallStatus = 'wrong direction';
  } else if (!tiePolicyPassed) {
    overallStatus = 'too weak / tied';
  } else if (!methodSwitchPassed) {
    overallStatus = 'unexpected method switch';
  }

  return {
    overallStatus,
    directionPassed,
    tiePolicyPassed,
    influencePassed,
    methodSwitchPassed,
    failureReasons,
  };
}

export function runQuestionAudit(questionId, baselineIdOverride) {
  const manifestEntry = getQuestionManifestEntry(questionId);
  if (!manifestEntry) {
    throw new Error(`Unknown audit question ${questionId}.`);
  }

  const baselineId = baselineIdOverride || manifestEntry.baselineIds?.[0];
  const baseline = baselineId ? getAuditBaseline(baselineId) : null;

  if (manifestEntry.auditStrategy !== 'context_only' && !baseline && manifestEntry.auditStrategy !== 'custom_runs') {
    throw new Error(`Question ${questionId} requires an audit baseline.`);
  }

  const baselineRequest = baseline ? deepClone(baseline.fixture.request) : null;
  const baselineResult = baselineRequest ? evaluateSubmission(baselineRequest) : null;
  const baselineRow = baselineResult
    ? buildBaseRow(baseline?.label || 'Baseline', 'baseline', baselineResult, manifestEntry, baselineResult)
    : null;

  const runs = buildRuns(manifestEntry, baseline || null);
  const rows = runs.map((run) => {
    const result = evaluateSubmission(run.request);
    const referenceResult = baselineResult || result;
    return buildBaseRow(run.label, run.inputValue, result, manifestEntry, referenceResult);
  });
  const status = buildQuestionStatus(manifestEntry, baselineRow || rows[0], rows);

  return {
    questionId,
    manifestEntry,
    baseline: baseline
      ? {
          id: baseline.id,
          label: baseline.label,
          fixtureId: baseline.fixtureId,
          summary: baselineRow?.summary || null,
        }
      : null,
    baselineRow,
    rows,
    status,
  };
}

function summarizeAuditResults(results) {
  const counts = {
    passing: 0,
    wrongDirection: 0,
    tooWeak: 0,
    methodSwitch: 0,
    noEffect: 0,
    contextOnly: 0,
    structural: 0,
  };

  for (const entry of results) {
    if (entry.status.overallStatus === 'passing') counts.passing += 1;
    if (entry.status.overallStatus === 'wrong direction') counts.wrongDirection += 1;
    if (entry.status.overallStatus === 'too weak / tied') counts.tooWeak += 1;
    if (entry.status.overallStatus === 'unexpected method switch') counts.methodSwitch += 1;
    if (entry.status.overallStatus === 'no-effect') counts.noEffect += 1;
    if (entry.status.overallStatus === 'context-only by design') counts.contextOnly += 1;
    if (entry.status.overallStatus === 'structural by design') counts.structural += 1;
  }

  return counts;
}

export function runFullQuestionAudit() {
  const validation = validateQuestionAuditManifest();
  if (!validation.valid) {
    throw new Error(`Question audit manifest coverage failed. Missing: ${validation.missing.join(', ')} Extra: ${validation.extra.join(', ')}`);
  }

  const results = listQuestionEffectManifest().map((entry) => runQuestionAudit(entry.questionId));
  const summary = summarizeAuditResults(results);
  const failures = results
    .filter((entry) => !['passing', 'context-only by design', 'structural by design'].includes(entry.status.overallStatus))
    .map((entry) => ({
      questionId: entry.questionId,
      status: entry.status.overallStatus,
      metricPath: entry.manifestEntry.primaryMetricPath,
      failureReasons: entry.status.failureReasons,
    }));

  return {
    generatedAt: new Date().toISOString(),
    validation,
    coverage: {
      manifestValid: validation.valid,
      liveQuestionsCovered: validation.liveIds.length,
    },
    summary,
    results,
    failures,
  };
}
