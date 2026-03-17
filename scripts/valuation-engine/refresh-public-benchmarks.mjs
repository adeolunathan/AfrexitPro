import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname, '..');
const BENCHMARK_DATA_PATH = path.join(ROOT, 'src/valuation-engine/benchmark-data.json');
const POLICY_REGISTRY_PATH = path.join(ROOT, 'src/valuation-engine/policy-registry.json');
const REFRESH_DATE = '2026-03-07';

const DAMODARAN_SOURCES = {
  ps: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/psdata.htm',
  ve: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/vebitda.html',
  wc: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/wcdata.html',
};

const POLICY_GROUP_SOURCE_MAP = {
  PG_AGRI_PRIMARY: ['Farming/Agriculture', 'Food Wholesalers'],
  PG_AGRO_PROCESSING: ['Food Processing', 'Beverage (Soft)', 'Packaging & Container'],
  PG_CONTRACT_MANUFACTURING: ['Machinery', 'Packaging & Container', 'Electrical Equipment'],
  PG_CREATIVE_AGENCY: ['Advertising', 'Business & Consumer Services', 'Publishing & Newspapers'],
  PG_EDUCATION_ENROLLMENT: ['Education', 'Information Services', 'Business & Consumer Services'],
  PG_HEALTHCARE_DISTRIBUTION: ['Healthcare Products', 'Drugs (Pharmaceutical)', 'Healthcare Support Services'],
  PG_HEALTHCARE_SERVICE: ['Hospitals/Healthcare Facilities', 'Healthcare Support Services', 'Heathcare Information and Technology'],
  PG_HOSPITALITY_VENUE: ['Hotel/Gaming', 'Restaurant/Dining', 'Recreation'],
  PG_LOGISTICS_ASSET: ['Transportation', 'Trucking', 'Air Transport'],
  PG_PROFESSIONAL_PLATFORM: ['Business & Consumer Services', 'Information Services', 'Computer Services'],
  PG_PROJECT_CONTRACTING: ['Engineering/Construction', 'Construction Supplies', 'Building Materials'],
  PG_PROJECT_SOFTWARE_IT: ['Computer Services', 'Software (System & Application)', 'Information Services'],
  PG_PROPERTY_ASSET_NAV: ['Real Estate (Development)', 'Real Estate (General/Diversified)', 'R.E.I.T.'],
  PG_REAL_ESTATE_SERVICE: ['Real Estate (Operations & Services)', 'Business & Consumer Services', 'R.E.I.T.'],
  PG_RETAIL_COMMERCE: ['Retail (General)', 'Retail (Special Lines)', 'Retail (Distributors)', 'Retail (Grocery and Food)'],
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function cleanHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseHtmlTable(html) {
  const rows = [];
  const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const rowHtml of rowMatches) {
    const cells = Array.from(rowHtml.matchAll(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi)).map((match) => cleanHtml(match[1]));
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function toNumber(value) {
  const numeric = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toPercentAsDecimal(value) {
  const numeric = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric / 100 : undefined;
}

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function buildSetId(policyGroupId) {
  return `BMK_OWNER_NG_${policyGroupId.replace(/^PG_/, '')}_2026Q1`;
}

function buildObservationId(policyGroupId, metric, index) {
  return `${policyGroupId.replace(/^PG_/, '').toLowerCase()}-${metric}-${index + 1}`;
}

function buildIndustryMaps(rows, kind) {
  if (kind === 'ps') {
    return Object.fromEntries(rows.slice(1).map((row) => [row[0], { evSales: toNumber(row[4]) }]));
  }

  if (kind === 've') {
    return Object.fromEntries(
      rows.slice(2).map((row) => [
        row[0],
        {
          evEbitda: toNumber(row[3]),
          evEbit: toNumber(row[4]),
        },
      ])
    );
  }

  return Object.fromEntries(
    rows.slice(1).map((row) => [
      row[0],
      {
        nonCashWorkingCapitalPct: toPercentAsDecimal(row[5]),
      },
    ])
  );
}

function inferMarketMultipleValue(policyGroup, psRow, veRow) {
  const metric = policyGroup.ownerPhase.marketMetric;
  if (metric === 'revenue') {
    return psRow?.evSales;
  }
  if (metric === 'adjustedEbitda') {
    return veRow?.evEbitda;
  }
  return veRow?.evEbit;
}

function inferCapitalizationRateValue(policyGroup, veRow) {
  const metric = policyGroup.ownerPhase.capitalizedMetric;
  if (!metric) {
    return undefined;
  }

  const multiple = metric === 'adjustedEbitda' ? veRow?.evEbitda : veRow?.evEbit;
  if (!multiple || multiple <= 0) {
    return undefined;
  }

  return round(1 / multiple, 4);
}

function buildMarketabilityObservations(policyGroupId, policyGroup) {
  const floor = policyGroup.ownerPhase.marketabilityFloor ?? 0.8;
  const ceiling = policyGroup.ownerPhase.marketabilityCeiling ?? 0.94;
  const midpoint = round((floor + ceiling) / 2, 4);

  return [floor, midpoint, ceiling].map((value, index) => ({
    id: buildObservationId(policyGroupId, 'marketability', index),
    metric: 'marketability_factor',
    basis: 'enterprise_value',
    value: round(value, 4),
    sourceKind: 'curated_secondary',
    sizeBand: 'sub_1bn_revenue',
    observedAt: REFRESH_DATE,
    quality: index === 1 ? 'medium' : 'low',
  }));
}

function buildDamodaranBenchmarkSet(policyGroupId, policyGroup, psMap, veMap, wcMap) {
  const industries = POLICY_GROUP_SOURCE_MAP[policyGroupId];
  if (!industries) {
    return null;
  }

  const observations = [];
  const sourceNotes = [
    'Current public-company sector observations sourced from Damodaran January 2026 industry datasets.',
    `Mapped industries: ${industries.join(', ')}.`,
    'Marketability factors remain curated-secondary until a stronger private-market discount dataset is added.',
  ];

  industries.forEach((industry, index) => {
    const psRow = psMap[industry];
    const veRow = veMap[industry];
    const wcRow = wcMap[industry];

    if (!psRow && !veRow && !wcRow) {
      throw new Error(`Missing Damodaran industry mapping for ${policyGroupId}: ${industry}`);
    }

    const marketMultiple = inferMarketMultipleValue(policyGroup, psRow, veRow);
    if (marketMultiple) {
      observations.push({
        id: buildObservationId(policyGroupId, 'market', index),
        metric: 'market_multiple',
        basis:
          policyGroup.ownerPhase.marketMetric === 'revenue'
            ? 'ev_sales_public_comp'
            : policyGroup.ownerPhase.marketMetric === 'adjustedEbitda'
              ? 'ev_ebitda_public_comp'
              : 'ev_ebit_proxy_for_owner_metric',
        value: round(marketMultiple, 4),
        sourceKind: 'public_comp',
        sizeBand: 'sub_1bn_revenue',
        observedAt: REFRESH_DATE,
        quality: 'medium',
      });
    }

    const capitalizationRate = inferCapitalizationRateValue(policyGroup, veRow);
    if (capitalizationRate) {
      observations.push({
        id: buildObservationId(policyGroupId, 'caprate', index),
        metric: 'capitalization_rate',
        basis:
          policyGroup.ownerPhase.capitalizedMetric === 'adjustedEbitda'
            ? 'inverse_ev_ebitda_public_comp'
            : 'inverse_ev_ebit_public_comp',
        value: capitalizationRate,
        sourceKind: 'public_comp',
        sizeBand: 'sub_1bn_revenue',
        observedAt: REFRESH_DATE,
        quality: 'medium',
      });
    }

    if (typeof wcRow?.nonCashWorkingCapitalPct === 'number') {
      observations.push({
        id: buildObservationId(policyGroupId, 'wc', index),
        metric: 'working_capital_pct',
        basis: 'non_cash_working_capital_over_revenue',
        value: round(wcRow.nonCashWorkingCapitalPct, 4),
        sourceKind: 'public_comp',
        sizeBand: 'sub_1bn_revenue',
        observedAt: REFRESH_DATE,
        quality: 'medium',
      });
    }
  });

  observations.push(...buildMarketabilityObservations(policyGroupId, policyGroup));

  return {
    id: buildSetId(policyGroupId),
    policyGroupId,
    label: `${policyGroup.label} public benchmark set`,
    mode: 'owner',
    geography: 'Global public comps proxy for Nigeria owner mode',
    asOfDate: REFRESH_DATE,
    sourceMix: ['damodaran_public_comps', 'curated_secondary'],
    sourceNotes,
    observations,
  };
}

async function main() {
  const benchmarkData = readJson(BENCHMARK_DATA_PATH);
  const policyRegistry = readJson(POLICY_REGISTRY_PATH);

  const [psHtml, veHtml, wcHtml] = await Promise.all([
    fetchText(DAMODARAN_SOURCES.ps),
    fetchText(DAMODARAN_SOURCES.ve),
    fetchText(DAMODARAN_SOURCES.wc),
  ]);

  const psMap = buildIndustryMaps(parseHtmlTable(psHtml), 'ps');
  const veMap = buildIndustryMaps(parseHtmlTable(veHtml), 've');
  const wcMap = buildIndustryMaps(parseHtmlTable(wcHtml), 'wc');

  const nextSets = benchmarkData.benchmarkSets.map((set) => {
    const policyGroup = policyRegistry.policyGroups[set.policyGroupId];
    if (!policyGroup) {
      return set;
    }

    if (!POLICY_GROUP_SOURCE_MAP[set.policyGroupId]) {
      return set;
    }

    return buildDamodaranBenchmarkSet(set.policyGroupId, policyGroup, psMap, veMap, wcMap);
  });

  writeJson(BENCHMARK_DATA_PATH, {
    benchmarkSets: nextSets,
  });

  const rebuildResult = spawnSync('node', [path.join(ROOT, 'scripts/valuation-engine/calibration-maintenance.mjs'), 'rebuild'], {
    stdio: 'inherit',
  });

  if (rebuildResult.status !== 0) {
    process.exit(rebuildResult.status ?? 1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
