import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import registry from '../../src/valuation-engine/policy-registry.json' with { type: 'json' };
import calibrationTable from '../../src/valuation-engine/calibration-table.json' with { type: 'json' };
import benchmarkData from '../../src/valuation-engine/benchmark-data.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outputDir = path.join(repoRoot, 'docs/valuation-engine');
const jsonOutputPath = path.join(outputDir, 'generated-policy-calibration-audit.json');
const markdownOutputPath = path.join(outputDir, 'generated-policy-calibration-audit.md');

function compareJson(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function buildRecommendation(row) {
  if (row.id === 'PG_PROJECT_SOFTWARE_IT') {
    return 'Restored to EBITDA-led market multiples because the prior revenue-multiple override was based on a broad proxy pack and produced misleading early outputs for high-margin IT-support cases.';
  }

  if (row.metricOverride && row.metricOverride.from === 'adjustedEbitda' && row.metricOverride.to === 'revenue') {
    return 'Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset.';
  }

  if (row.metricOverride && row.metricOverride.from === 'adjustedEbit' && row.metricOverride.to === 'revenue') {
    return 'Review whether the calibration has become too revenue-led for a business model that base policy treats as earnings-sensitive.';
  }

  if (row.capitalizedMetricOverride && row.capitalizedMetricOverride.from === 'adjustedEbit' && row.capitalizedMetricOverride.to === 'sde') {
    return 'Confirm that the owner-mode calibration should truly anchor on SDE rather than maintainable EBIT for this policy family.';
  }

  return 'No immediate action beyond normal calibration monitoring.';
}

function buildSeverity(row) {
  const sourceNotes = (row.sourceNotes || []).join(' ').toLowerCase();
  const mentionsProxy = sourceNotes.includes('proxy') || sourceNotes.includes('blend') || sourceNotes.includes('curated');

  if (row.id === 'PG_PROJECT_SOFTWARE_IT') return 'fixed_now';
  if (row.metricOverride && ['adjustedEbitda', 'adjustedEbit'].includes(row.metricOverride.from) && row.metricOverride.to === 'revenue' && mentionsProxy) {
    return 'high';
  }
  if (row.metricOverride || row.capitalizedMetricOverride) return 'medium';
  return 'low';
}

function formatOverride(override) {
  if (!override) return 'No metric-basis override';
  return `${override.from} -> ${override.to}`;
}

async function main() {
  const benchmarkSetMap = Object.fromEntries((benchmarkData.benchmarkSets || []).map((set) => [set.id, set]));

  const rows = Object.entries(calibrationTable.policyGroups || {})
    .map(([policyGroupId, calibrationEntry]) => {
      const basePolicy = registry.policyGroups?.[policyGroupId];
      const calibrated = calibrationEntry?.ownerPhase || {};
      const baseOwnerPhase = basePolicy?.ownerPhase || {};
      const benchmarkSets = (calibrationEntry.benchmarkSetIds || []).map((id) => benchmarkSetMap[id]).filter(Boolean);
      const sourceMix = [...new Set(benchmarkSets.flatMap((set) => set.sourceMix || []))];
      const sourceNotes = benchmarkSets.flatMap((set) => set.sourceNotes || []);

      const metricOverride =
        calibrated.marketMetric && baseOwnerPhase.marketMetric && calibrated.marketMetric !== baseOwnerPhase.marketMetric
          ? { from: baseOwnerPhase.marketMetric, to: calibrated.marketMetric }
          : null;
      const capitalizedMetricOverride =
        calibrated.capitalizedMetric && baseOwnerPhase.capitalizedMetric && calibrated.capitalizedMetric !== baseOwnerPhase.capitalizedMetric
          ? { from: baseOwnerPhase.capitalizedMetric, to: calibrated.capitalizedMetric }
          : null;

      const rangeOverrides = {
        marketMultipleRangeChanged: Boolean(calibrated.marketMultipleRange && !compareJson(calibrated.marketMultipleRange, baseOwnerPhase.marketMultipleRange)),
        capitalizationRateRangeChanged: Boolean(calibrated.capitalizationRateRange && !compareJson(calibrated.capitalizationRateRange, baseOwnerPhase.capitalizationRateRange)),
        reconciliationWeightsChanged: Boolean(calibrated.reconciliationWeights && !compareJson(calibrated.reconciliationWeights, baseOwnerPhase.reconciliationWeights)),
      };

      const row = {
        id: policyGroupId,
        label: basePolicy?.label || policyGroupId,
        metricOverride,
        capitalizedMetricOverride,
        baseMarketMetric: baseOwnerPhase.marketMetric || null,
        calibratedMarketMetric: calibrated.marketMetric || baseOwnerPhase.marketMetric || null,
        baseMarketMultipleRange: baseOwnerPhase.marketMultipleRange || null,
        calibratedMarketMultipleRange: calibrated.marketMultipleRange || baseOwnerPhase.marketMultipleRange || null,
        baseCapitalizedMetric: baseOwnerPhase.capitalizedMetric || null,
        calibratedCapitalizedMetric: calibrated.capitalizedMetric || baseOwnerPhase.capitalizedMetric || null,
        baseCapitalizationRateRange: baseOwnerPhase.capitalizationRateRange || null,
        calibratedCapitalizationRateRange: calibrated.capitalizationRateRange || baseOwnerPhase.capitalizationRateRange || null,
        rangeOverrides,
        benchmarkSetIds: calibrationEntry.benchmarkSetIds || [],
        sourceMix,
        sourceNotes,
      };

      return {
        ...row,
        severity: buildSeverity(row),
        recommendation: buildRecommendation(row),
      };
    })
    .filter((row) => row.metricOverride || row.capitalizedMetricOverride || row.rangeOverrides.marketMultipleRangeChanged || row.rangeOverrides.capitalizationRateRangeChanged || row.rangeOverrides.reconciliationWeightsChanged)
    .sort((left, right) => {
      const severityOrder = { fixed_now: 0, high: 1, medium: 2, low: 3 };
      return (severityOrder[left.severity] ?? 9) - (severityOrder[right.severity] ?? 9) || left.id.localeCompare(right.id);
    });

  const summary = {
    generatedAt: new Date().toISOString(),
    totalPolicyGroups: Object.keys(registry.policyGroups || {}).length,
    groupsWithCalibrationOverrides: rows.length,
    marketMetricBasisOverrides: rows.filter((row) => row.metricOverride).length,
    capitalizedMetricBasisOverrides: rows.filter((row) => row.capitalizedMetricOverride).length,
    highPriorityGroups: rows.filter((row) => row.severity === 'high').map((row) => row.id),
    fixedNowGroups: rows.filter((row) => row.severity === 'fixed_now').map((row) => row.id),
  };

  const markdown = [
    '# Generated Policy Calibration Audit',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total policy groups: ${summary.totalPolicyGroups}`,
    `- Groups with calibration overrides: ${summary.groupsWithCalibrationOverrides}`,
    `- Market-metric basis overrides: ${summary.marketMetricBasisOverrides}`,
    `- Capitalized-metric basis overrides: ${summary.capitalizedMetricBasisOverrides}`,
    `- High-priority review groups: ${summary.highPriorityGroups.join(', ') || 'None'}`,
    `- Fixed in this pass: ${summary.fixedNowGroups.join(', ') || 'None'}`,
    '',
    '## Rows',
    '',
    '| Policy Group | Severity | Market Basis | Capitalized Basis | Key Range Overrides | Benchmark Sets | Recommendation |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => {
      const rangeSummary = [
        row.rangeOverrides.marketMultipleRangeChanged ? 'market range' : null,
        row.rangeOverrides.capitalizationRateRangeChanged ? 'cap-rate range' : null,
        row.rangeOverrides.reconciliationWeightsChanged ? 'weights' : null,
      ].filter(Boolean).join(', ') || 'none';
      return `| ${row.id} | ${row.severity} | ${formatOverride(row.metricOverride)} | ${formatOverride(row.capitalizedMetricOverride)} | ${rangeSummary} | ${row.benchmarkSetIds.join(', ')} | ${row.recommendation} |`;
    }),
    '',
    '## Notes',
    '',
    '- This audit compares the base policy registry against the calibration override table now in force.',
    '- A market-metric basis override is the strongest structural mismatch signal, because it can change the valuation family from earnings-led to revenue-led.',
    '- Proxy-blended benchmark sets deserve more skepticism when they flip metric basis, especially for service businesses with strong margins.',
    '',
  ].join('\n');

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonOutputPath, JSON.stringify({ summary, rows }, null, 2));
  await writeFile(markdownOutputPath, markdown);

  console.log(`Wrote ${jsonOutputPath}`);
  console.log(`Wrote ${markdownOutputPath}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
