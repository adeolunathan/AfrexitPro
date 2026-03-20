import process from 'node:process';
import fixturesData from '../../src/valuation-engine/owner-test-fixtures.json' with { type: 'json' };
import extendedFixturesData from '../../src/valuation-engine/owner-test-fixtures-extended.json' with { type: 'json' };
import { evaluateSubmission } from '../../server/valuation/owner-engine.mjs';

const DEFAULT_API_URL = 'http://localhost:8788/api/valuation';
const ALL_FIXTURES = [...fixturesData.fixtures, ...extendedFixturesData.fixtures];

function parseArgs(argv) {
  const args = {};
  const positionals = [];

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      const [key, inlineValue] = token.slice(2).split('=');
      if (inlineValue !== undefined) {
        args[key] = inlineValue;
      } else if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
        args[key] = argv[index + 1];
        index += 1;
      } else {
        args[key] = 'true';
      }
    } else {
      positionals.push(token);
    }
  }

  return { args, positionals };
}

function assertFixture(result, expectations = {}) {
  const failures = [];

  if (expectations.policyGroupId && result.classification.policyGroupId !== expectations.policyGroupId) {
    failures.push(`Expected policy group ${expectations.policyGroupId}, got ${result.classification.policyGroupId}`);
  }

  if (expectations.primaryMethod && result.selectedMethods.primaryMethod !== expectations.primaryMethod) {
    failures.push(`Expected primary method ${expectations.primaryMethod}, got ${result.selectedMethods.primaryMethod}`);
  }

  if (typeof expectations.minConfidenceScore === 'number' && result.summary.confidenceScore < expectations.minConfidenceScore) {
    failures.push(`Expected confidence >= ${expectations.minConfidenceScore}, got ${result.summary.confidenceScore}`);
  }

  if (typeof expectations.maxConfidenceScore === 'number' && result.summary.confidenceScore > expectations.maxConfidenceScore) {
    failures.push(`Expected confidence <= ${expectations.maxConfidenceScore}, got ${result.summary.confidenceScore}`);
  }

  if (typeof expectations.minReadinessScore === 'number' && result.summary.readinessScore < expectations.minReadinessScore) {
    failures.push(`Expected readiness >= ${expectations.minReadinessScore}, got ${result.summary.readinessScore}`);
  }

  if (typeof expectations.maxReadinessScore === 'number' && result.summary.readinessScore > expectations.maxReadinessScore) {
    failures.push(`Expected readiness <= ${expectations.maxReadinessScore}, got ${result.summary.readinessScore}`);
  }

  return failures;
}

async function runViaApi(request, apiUrl) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const payload = await response.json();
  if (!response.ok || payload.status !== 'success' || !payload.data) {
    throw new Error(payload.message || 'Fixture API call failed.');
  }

  return payload.data;
}

function formatSummary(fixture, result, failures) {
  return {
    fixtureId: fixture.id,
    status: failures.length ? 'failed' : 'passed',
    businessName: result.summary.businessName,
    policyGroupId: result.classification.policyGroupId,
    primaryMethod: result.selectedMethods.primaryMethod,
    adjustedValue: result.summary.adjustedValue,
    readinessScore: result.summary.readinessScore,
    confidenceScore: result.summary.confidenceScore,
    warnings: result.summary.warnings,
    failures,
  };
}

async function main() {
  const { args } = parseArgs(process.argv);
  const mode = args.mode === 'api' ? 'api' : 'direct';
  const fixtureFilter = args.fixture;
  const apiUrl = args.url || DEFAULT_API_URL;

  const fixtures = fixtureFilter
    ? ALL_FIXTURES.filter((fixture) => fixture.id === fixtureFilter)
    : ALL_FIXTURES;

  if (!fixtures.length) {
    throw new Error(`No fixture matched ${fixtureFilter}.`);
  }

  const summaries = [];

  for (const fixture of fixtures) {
    const result = mode === 'api' ? await runViaApi(fixture.request, apiUrl) : evaluateSubmission(fixture.request);
    const failures = assertFixture(result, fixture.expectations);
    summaries.push(formatSummary(fixture, result, failures));
  }

  console.log(JSON.stringify({ mode, fixtureCount: summaries.length, summaries }, null, 2));

  if (summaries.some((summary) => summary.status === 'failed')) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
