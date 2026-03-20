import process from 'node:process';
import fixturesData from '../../src/valuation-engine/owner-test-fixtures.json' with { type: 'json' };
import extendedFixturesData from '../../src/valuation-engine/owner-test-fixtures-extended.json' with { type: 'json' };
import { evaluateSubmission } from '../../server/valuation/owner-engine.mjs';

const ALL_FIXTURES = [...fixturesData.fixtures, ...extendedFixturesData.fixtures];

function parseArgs(argv) {
  const args = {};

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;

    const [key, inlineValue] = token.slice(2).split('=');
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
      args[key] = argv[index + 1];
      index += 1;
      continue;
    }

    args[key] = 'true';
  }

  return args;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseLiteralValue(rawValue) {
  if (rawValue === 'true') return true;
  if (rawValue === 'false') return false;
  if (rawValue === 'null') return null;
  if (rawValue === 'undefined') return undefined;

  const numericValue = Number(rawValue);
  if (rawValue !== '' && Number.isFinite(numericValue) && /^-?\d+(\.\d+)?$/.test(rawValue)) {
    return numericValue;
  }

  return rawValue;
}

function getByPath(target, path) {
  return path.split('.').reduce((current, segment) => current?.[segment], target);
}

function setByPath(target, path, value) {
  const segments = path.split('.');
  let current = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (!current[segment] || typeof current[segment] !== 'object') {
      current[segment] = {};
    }
    current = current[segment];
  }

  current[segments[segments.length - 1]] = value;
}

function formatMoney(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}m`;
}

function compareInOrder(values, direction) {
  for (let index = 1; index < values.length; index += 1) {
    if (direction === 'asc' && values[index] < values[index - 1]) {
      return false;
    }
    if (direction === 'desc' && values[index] > values[index - 1]) {
      return false;
    }
  }

  return true;
}

function buildRow(result, valueLabel, metricPath) {
  return {
    value: valueLabel,
    adjustedValue: result.summary.adjustedValue,
    lowEstimate: result.summary.lowEstimate,
    highEstimate: result.summary.highEstimate,
    readinessScore: result.summary.readinessScore,
    confidenceScore: result.summary.confidenceScore,
    primaryMethod: result.selectedMethods.primaryMethod,
    marketPosition: result.summary.scorecard.marketPosition,
    ownerIndependence: result.summary.scorecard.ownerIndependence,
    revenueQuality: result.summary.scorecard.revenueQuality,
    operatingResilience: result.summary.scorecard.operatingResilience,
    branchQualityFactor: result.audit?.qualitativeAdjustments?.branchQualityFactor ?? 1,
    geographyAdjustmentFactor: result.audit?.qualitativeAdjustments?.geographyAdjustmentFactor ?? 1,
    metricValue: getByPath(result, metricPath),
  };
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  npm run valuation:sensitivity -- --fixture <fixture-id> --path <request.path> --values <value1,value2,...> [--metric summary.adjustedValue] [--order asc|desc]',
      '',
      'Example:',
      '  npm run valuation:sensitivity -- --fixture owner-manufacturing-two-year --path operatingProfile.productRights --values company_owned,public_domain --metric summary.adjustedValue --order desc',
    ].join('\n')
  );
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help === 'true' || !args.fixture || !args.path || !args.values) {
    printUsage();
    if (args.help === 'true') return;
    throw new Error('Missing required args: --fixture, --path, and --values are required.');
  }

  const fixture = ALL_FIXTURES.find((candidate) => candidate.id === args.fixture);
  if (!fixture) {
    throw new Error(`No fixture matched ${args.fixture}.`);
  }

  const values = String(args.values)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!values.length) {
    throw new Error('At least one value must be provided in --values.');
  }

  const metricPath = args.metric || 'summary.adjustedValue';
  const rows = [];

  for (const rawValue of values) {
    const request = deepClone(fixture.request);
    setByPath(request, args.path, parseLiteralValue(rawValue));
    const result = evaluateSubmission(request);
    rows.push(buildRow(result, rawValue, metricPath));
  }

  console.table(
    rows.map((row) => ({
      value: row.value,
      adjustedValue: formatMoney(row.adjustedValue),
      readinessScore: row.readinessScore,
      confidenceScore: row.confidenceScore,
      primaryMethod: row.primaryMethod,
      marketPosition: row.marketPosition,
      ownerIndependence: row.ownerIndependence,
      revenueQuality: row.revenueQuality,
      operatingResilience: row.operatingResilience,
      branchQualityFactor: row.branchQualityFactor,
      geographyAdjustmentFactor: row.geographyAdjustmentFactor,
      metricValue: typeof row.metricValue === 'number' ? row.metricValue : String(row.metricValue ?? ''),
    }))
  );

  console.log(JSON.stringify({
    fixtureId: fixture.id,
    mutationPath: args.path,
    metricPath,
    rows,
  }, null, 2));

  if (args.order) {
    const metricValues = rows.map((row) => Number(row.metricValue));
    if (metricValues.some((value) => !Number.isFinite(value))) {
      throw new Error(`Cannot apply --order to non-numeric metric path ${metricPath}.`);
    }

    if (!compareInOrder(metricValues, args.order)) {
      throw new Error(`Metric ${metricPath} did not move in ${args.order} order for values ${values.join(', ')}.`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
