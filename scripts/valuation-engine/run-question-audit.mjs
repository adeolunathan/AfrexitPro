import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFullQuestionAudit } from '../../server/valuation/question-audit/runner.mjs';
import { validateQuestionAuditManifest } from '../../server/valuation/question-audit/manifest.mjs';

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(THIS_DIR, '../..');
const OUTPUT_JSON = path.join(REPO_ROOT, 'docs/questionnaires/generated-question-audit-report.json');
const OUTPUT_MD = path.join(REPO_ROOT, 'docs/questionnaires/generated-question-audit-report.md');

function formatMoney(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}m`;
}

function summarize(result) {
  const counts = result.summary;
  return {
    passing: counts.passing || 0,
    wrongDirection: counts.wrongDirection || 0,
    tooWeak: counts.tooWeak || 0,
    methodSwitch: counts.methodSwitch || 0,
    noEffect: counts.noEffect || 0,
    contextOnly: counts.contextOnly || 0,
    structural: counts.structural || 0,
  };
}

function legacySummarize(result) {
  const totals = {
    passing: 0,
    wrongDirection: 0,
    tooWeak: 0,
    methodSwitch: 0,
    noEffect: 0,
    contextOnly: 0,
  };

  for (const entry of result.results || []) {
    if (entry.status.overallStatus === 'passing') totals.passing += 1;
    if (entry.status.overallStatus === 'wrong direction') totals.wrongDirection += 1;
    if (entry.status.overallStatus === 'too weak / tied') totals.tooWeak += 1;
    if (entry.status.overallStatus === 'unexpected method switch') totals.methodSwitch += 1;
    if (entry.status.overallStatus === 'no-effect') totals.noEffect += 1;
    if (entry.status.overallStatus === 'context-only by design') totals.contextOnly += 1;
    if (entry.status.overallStatus === 'structural by design') totals.structural += 1;
  }

  return totals;
}

function buildMarkdown(report) {
  const summary = summarize(report);
  const validation = report.validation;
  const results = report.results || [];
  const lines = [
    '# Generated Question Audit Report',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    '## Coverage',
    '',
    `- Manifest valid: ${validation.valid ? 'yes' : 'no'}`,
    `- Live questions covered: ${validation.liveIds.length}`,
    `- Passing: ${summary.passing}`,
    `- Wrong direction: ${summary.wrongDirection}`,
    `- Too weak / tied: ${summary.tooWeak}`,
    `- Unexpected method switch: ${summary.methodSwitch}`,
    `- No effect: ${summary.noEffect}`,
    `- Context-only by design: ${summary.contextOnly}`,
    `- Structural by design: ${summary.structural}`,
    '',
    '## Question Status',
    '',
    '| Question | Class | Canonical path | Baseline | Metric | Status | Baseline value | Best case | Worst case | Failures |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const entry of results) {
    const metricValues = entry.rows.map((row) => Number(row.metricValue)).filter((value) => Number.isFinite(value));
    const bestMetric = metricValues.length ? Math.max(...metricValues) : null;
    const worstMetric = metricValues.length ? Math.min(...metricValues) : null;
    const baselineValue = entry.baselineRow?.summary?.adjustedValue;
    lines.push(
      `| \`${entry.questionId}\` | ${entry.manifestEntry.auditClass} | \`${entry.manifestEntry.canonicalPath || 'context-only'}\` | ${
        entry.baseline?.label || 'custom'
      } | \`${entry.manifestEntry.primaryMetricPath || 'n/a'}\` | ${entry.status.overallStatus} | ${formatMoney(baselineValue)} | ${bestMetric === null ? '—' : bestMetric.toLocaleString('en-NG')} | ${worstMetric === null ? '—' : worstMetric.toLocaleString('en-NG')} | ${
        entry.status.failureReasons.length ? entry.status.failureReasons.join(', ') : '—'
      } |`
    );
  }

  lines.push('', '## Failures', '');

  for (const entry of results.filter(
    (result) => !['passing', 'context-only by design', 'structural by design'].includes(result.status.overallStatus)
  )) {
    lines.push(`### \`${entry.questionId}\``);
    lines.push('');
    lines.push(`- Status: ${entry.status.overallStatus}`);
    lines.push(`- Canonical path: \`${entry.manifestEntry.canonicalPath}\``);
    lines.push(`- Baseline: ${entry.baseline?.label || 'custom'}`);
    lines.push(`- Metric: \`${entry.manifestEntry.primaryMetricPath || 'n/a'}\``);
    lines.push(`- Failure reasons: ${entry.status.failureReasons.join(', ')}`);
    lines.push('');
    for (const row of entry.rows) {
      lines.push(
        `  - ${row.label}: metric=${typeof row.metricValue === 'number' ? row.metricValue.toFixed(3) : String(row.metricValue)}, adjusted=${formatMoney(
          row.summary.adjustedValue
        )}, readiness=${row.summary.readinessScore}, confidence=${row.summary.confidenceScore}, method=${row.summary.primaryMethod}`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const report = runFullQuestionAudit();
  const validation = report.validation;
  ensureParent(OUTPUT_JSON);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(report));

  const summary = summarize(report);
  console.table(summary);
  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_MD}`);
}

main();
