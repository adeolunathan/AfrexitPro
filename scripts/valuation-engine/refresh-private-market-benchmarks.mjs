import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// This script rebuilds locally curated transaction-proxy benchmark packs.
// It does not fetch or scrape the referenced external URLs at runtime.
// Those links are retained only as manual sourcing references and may become stale.

const ROOT = path.resolve(new URL('..', import.meta.url).pathname, '..');
const POLICY_REGISTRY_PATH = path.join(ROOT, 'src/valuation-engine/policy-registry.json');
const BENCHMARK_DATA_PATH = path.join(ROOT, 'src/valuation-engine/benchmark-data.json');
const REFRESH_DATE = '2026-03-07';
const OBSERVED_AT = '2025-12-31';

const SOURCE_URLS = {
  agriculture: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/agriculture-businesses/',
  manufacturing: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/manufacturing-businesses/',
  retail: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/retail-businesses/',
  restaurant: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/restaurant-businesses/',
  catering: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/catering-businesses/',
  architectureEngineering: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/architecture-and-engineering-businesses/',
  technology: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/technology-businesses/',
  service: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/service-businesses/',
  financialServices: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/financial-services-businesses/',
  healthcare: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/healthcare-businesses/',
  medicalBilling: 'https://www.bizbuysell.com/learning-center/valuation-benchmarks/medical-billing-businesses/',
  insightTables: 'https://www.bizbuysell.com/insight-report-data-tables/',
};

const PACKS = {
  AGRICULTURE: {
    label: 'Agriculture sold-business transaction proxy',
    sourceReferences: [
      { id: 'agri-bbs', label: 'BizBuySell agriculture benchmark reference link', url: SOURCE_URLS.agriculture, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.42, 0.66, 0.86, 1.17],
    capitalizedMetric: 'sde',
    earningsMultiples: [1.94, 2.72, 3.27, 4.03],
    notes: ['Agriculture page reports sold-business revenue and earnings multiple quartiles for the last five years.'],
    quality: ['medium', 'medium', 'high', 'medium'],
  },
  MANUFACTURING_FOOD: {
    label: 'Manufacturing and food processing transaction proxy',
    sourceReferences: [
      { id: 'mfg-bbs', label: 'BizBuySell manufacturing benchmark reference link', url: SOURCE_URLS.manufacturing, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.58, 0.63, 0.72, 0.8],
    capitalizedMetric: 'sde',
    earningsMultiples: [2.71, 2.86, 3.07, 3.4],
    notes: [
      'Anchored to sold-business averages on the manufacturing benchmarks page, including Food Products and overall Manufacturing.',
      'Upper bounds remain constrained to the same published manufacturing-page context rather than public-company multiples.',
    ],
    quality: ['low', 'medium', 'high', 'medium'],
  },
  CONTRACT_MANUFACTURING: {
    label: 'Contract manufacturing transaction proxy',
    sourceReferences: [
      { id: 'mfg-bbs', label: 'BizBuySell manufacturing benchmark reference link', url: SOURCE_URLS.manufacturing, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.56, 0.72, 0.8, 0.92],
    capitalizedMetric: 'sde',
    earningsMultiples: [2.8, 3.07, 3.4, 4.2],
    notes: ['Derived from sold-business Manufacturing, Industrial Machinery, and other manufacturing comparison rows on the BizBuySell benchmarks page.'],
    quality: ['low', 'medium', 'medium', 'medium'],
  },
  PROJECT_CONTRACTING: {
    label: 'Project contracting and engineering transaction proxy',
    sourceReferences: [
      {
        id: 'arch-bbs',
        label: 'BizBuySell architecture and engineering benchmark reference link',
        url: SOURCE_URLS.architectureEngineering,
        sourceType: 'reference_link',
      },
      {
        id: 'tables-bbs',
        label: 'BizBuySell insight report data tables reference link',
        url: SOURCE_URLS.insightTables,
        sourceType: 'reference_link',
      },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.47, 0.66, 0.74, 0.9],
    capitalizedMetric: 'sde',
    earningsMultiples: [1.83, 2.48, 2.59, 3.15],
    notes: ['Architecture and engineering sold-business benchmarks provide explicit revenue and earnings quartiles usable as owner-mode project contracting proxies.'],
    quality: ['medium', 'medium', 'high', 'medium'],
  },
  RETAIL: {
    label: 'Retail and commerce transaction proxy',
    sourceReferences: [
      { id: 'retail-bbs', label: 'BizBuySell retail benchmark reference link', url: SOURCE_URLS.retail, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.29, 0.43, 0.53, 0.67],
    capitalizedMetric: 'sde',
    earningsMultiples: [1.62, 2.26, 2.62, 3.08],
    notes: ['Retail page reports sold-business revenue and earnings quartiles for the last five years.'],
    quality: ['medium', 'medium', 'high', 'medium'],
  },
  TECHNOLOGY: {
    label: 'Technology services transaction proxy',
    sourceReferences: [
      { id: 'tech-bbs', label: 'BizBuySell technology benchmark reference link', url: SOURCE_URLS.technology, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.98, 1.07, 1.1, 1.66],
    capitalizedMetric: 'sde',
    earningsMultiples: [2.66, 3.0, 3.18, 3.31],
    notes: [
      'Technology pack blends sold-business averages for IT/software services, all technology, graphic/web design, and websites/e-commerce.',
      'This is still a proxy for Nigeria owner mode and should be replaced over time with Nigeria-native service tech observations.',
    ],
    quality: ['medium', 'medium', 'medium', 'low'],
  },
  CREATIVE_SERVICE: {
    label: 'Creative and agency service transaction proxy',
    sourceReferences: [
      { id: 'service-bbs', label: 'BizBuySell service benchmark reference link', url: SOURCE_URLS.service, sourceType: 'reference_link' },
      { id: 'tech-bbs', label: 'BizBuySell technology benchmark reference link', url: SOURCE_URLS.technology, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.48, 0.82, 1.0, 1.04],
    capitalizedMetric: 'sde',
    earningsMultiples: [1.75, 2.38, 2.58, 2.66],
    notes: ['Creative-agency owner mode uses sold-business service and graphic/web design comparisons because direct Nigeria agency transaction evidence is still sparse.'],
    quality: ['low', 'medium', 'high', 'medium'],
  },
  TRANSPORT: {
    label: 'Transport and logistics transaction proxy',
    sourceReferences: [
      { id: 'tables-bbs', label: 'BizBuySell insight report data tables reference link', url: SOURCE_URLS.insightTables, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.71, 0.8, 0.9, 0.98],
    capitalizedMetric: 'sde',
    earningsMultiples: [2.57, 3.2, 3.83, 4.1],
    notes: ['Transport pack is anchored to trucking-company sold-business benchmarks from BizBuySell insight tables, with the midpoint expanded conservatively for broader owner-mode logistics use.'],
    quality: ['medium', 'low', 'medium', 'low'],
  },
  HOSPITALITY: {
    label: 'Hospitality and venue transaction proxy',
    sourceReferences: [
      { id: 'restaurant-bbs', label: 'BizBuySell restaurant benchmark reference link', url: SOURCE_URLS.restaurant, sourceType: 'reference_link' },
      { id: 'catering-bbs', label: 'BizBuySell catering benchmark reference link', url: SOURCE_URLS.catering, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.23, 0.33, 0.44, 0.55],
    capitalizedMetric: 'sde',
    earningsMultiples: [1.34, 1.85, 2.0, 2.53],
    notes: ['Hospitality owner mode blends restaurant and catering sold-business benchmarks from BizBuySell.'],
    quality: ['medium', 'medium', 'medium', 'medium'],
  },
  HEALTHCARE_SERVICE: {
    label: 'Healthcare service transaction proxy',
    sourceReferences: [
      { id: 'health-bbs', label: 'BizBuySell healthcare benchmark reference link', url: SOURCE_URLS.healthcare, sourceType: 'reference_link' },
      { id: 'medical-billing-bbs', label: 'BizBuySell medical billing benchmark reference link', url: SOURCE_URLS.medicalBilling, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.69, 0.79, 1.06, 1.24],
    capitalizedMetric: 'sde',
    earningsMultiples: [2.67, 2.71, 3.63, 4.8],
    notes: ['Healthcare pack blends all-healthcare, home-health, dental, and medical-billing sold-business comparisons to avoid pure public-comp anchoring.'],
    quality: ['medium', 'medium', 'medium', 'low'],
  },
  HEALTHCARE_DISTRIBUTION: {
    label: 'Healthcare distribution and retail transaction proxy',
    sourceReferences: [
      { id: 'retail-bbs', label: 'BizBuySell retail benchmark reference link', url: SOURCE_URLS.retail, sourceType: 'reference_link' },
      { id: 'health-bbs', label: 'BizBuySell healthcare benchmark reference link', url: SOURCE_URLS.healthcare, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.42, 0.53, 0.69, 0.79],
    capitalizedMetric: 'sde',
    earningsMultiples: [2.26, 2.67, 2.79, 3.1],
    notes: ['Healthcare distribution uses pharmacy/retail and healthcare sold-business comparisons as the closest sourceable owner-mode proxy.'],
    quality: ['medium', 'medium', 'medium', 'low'],
  },
  SERVICE_GENERAL: {
    label: 'General service-business transaction proxy',
    sourceReferences: [
      { id: 'service-bbs', label: 'BizBuySell service benchmark reference link', url: SOURCE_URLS.service, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.48, 0.71, 0.82, 1.04],
    capitalizedMetric: 'sde',
    earningsMultiples: [1.75, 2.38, 2.58, 3.13],
    notes: ['Service-business sold benchmarks are being used as a proxy where a narrower sold-business page was not sourceable during this refresh.'],
    quality: ['low', 'medium', 'high', 'medium'],
  },
  FINANCIAL_SERVICES: {
    label: 'Professional and financial services transaction proxy',
    sourceReferences: [
      {
        id: 'financial-bbs',
        label: 'BizBuySell financial services benchmark reference link',
        url: SOURCE_URLS.financialServices,
        sourceType: 'reference_link',
      },
      { id: 'service-bbs', label: 'BizBuySell service benchmark reference link', url: SOURCE_URLS.service, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [1.03, 1.3, 1.45, 1.59],
    capitalizedMetric: 'sde',
    earningsMultiples: [2.69, 3.46, 3.64, 3.72],
    notes: ['Professional platform businesses are anchored to sold financial/accounting-service benchmarks rather than public-company proxies.'],
    quality: ['medium', 'medium', 'high', 'medium'],
  },
  PROPERTY_SERVICE: {
    label: 'Property and facility services transaction proxy',
    sourceReferences: [
      { id: 'tables-bbs', label: 'BizBuySell insight report data tables reference link', url: SOURCE_URLS.insightTables, sourceType: 'reference_link' },
      { id: 'service-bbs', label: 'BizBuySell service benchmark reference link', url: SOURCE_URLS.service, sourceType: 'reference_link' },
    ],
    marketMetric: 'revenue',
    marketMultiples: [0.82, 0.85, 0.93, 1.02],
    capitalizedMetric: 'sde',
    earningsMultiples: [2.58, 2.7, 2.73, 3.05],
    notes: ['Property-management and adjacent facility-service sold-business benchmarks are the closest sourceable owner-mode proxy currently available.'],
    quality: ['medium', 'medium', 'high', 'low'],
  },
};

const POLICY_GROUP_PACK_MAP = {
  PG_AGRI_PRIMARY: 'AGRICULTURE',
  PG_AGRO_PROCESSING: 'MANUFACTURING_FOOD',
  PG_CONTRACT_MANUFACTURING: 'CONTRACT_MANUFACTURING',
  PG_PROJECT_CONTRACTING: 'PROJECT_CONTRACTING',
  PG_RETAIL_COMMERCE: 'RETAIL',
  PG_PROJECT_SOFTWARE_IT: 'TECHNOLOGY',
  PG_LOGISTICS_ASSET: 'TRANSPORT',
  PG_HOSPITALITY_VENUE: 'HOSPITALITY',
  PG_HEALTHCARE_SERVICE: 'HEALTHCARE_SERVICE',
  PG_HEALTHCARE_DISTRIBUTION: 'HEALTHCARE_DISTRIBUTION',
  PG_EDUCATION_ENROLLMENT: 'SERVICE_GENERAL',
  PG_PROFESSIONAL_PLATFORM: 'FINANCIAL_SERVICES',
  PG_REAL_ESTATE_SERVICE: 'PROPERTY_SERVICE',
  PG_PROPERTY_ASSET_NAV: 'PROPERTY_SERVICE',
  PG_CREATIVE_AGENCY: 'CREATIVE_SERVICE',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
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

function buildWorkingCapitalObservations(policyGroupId, policyGroup) {
  const target = policyGroup.ownerPhase.workingCapitalTargetPct ?? 0;
  if (!target) {
    return [];
  }

  return [0.9, 1, 1.1].map((multiplier, index) => ({
    id: buildObservationId(policyGroupId, 'working-capital', index),
    metric: 'working_capital_pct',
    basis: 'revenue',
    value: round(target * multiplier),
    sourceKind: 'curated_secondary',
    sizeBand: 'sub_1bn_revenue',
    observedAt: OBSERVED_AT,
    quality: index === 1 ? 'medium' : 'low',
    sourceReferenceId: 'wc-curated',
    notes: 'Working-capital targets remain curated until a stronger private-market working-capital dataset is accumulated.',
  }));
}

function buildMarketabilityObservations(policyGroupId, policyGroup) {
  const floor = policyGroup.ownerPhase.marketabilityFloor ?? 0.78;
  const ceiling = policyGroup.ownerPhase.marketabilityCeiling ?? 0.92;
  const midpoint = round((floor + ceiling) / 2, 4);

  return [floor, midpoint, ceiling].map((value, index) => ({
    id: buildObservationId(policyGroupId, 'marketability', index),
    metric: 'marketability_factor',
    basis: 'enterprise_value',
    value: round(value, 4),
    sourceKind: 'curated_secondary',
    sizeBand: 'sub_1bn_revenue',
    observedAt: OBSERVED_AT,
    quality: index === 1 ? 'medium' : 'low',
    sourceReferenceId: 'marketability-curated',
    notes: 'Marketability factors remain a curated owner-mode overlay until Afrexit has enough internal Nigeria transaction evidence.',
  }));
}

function buildRevenueObservations(policyGroupId, pack) {
  return pack.marketMultiples.map((value, index) => ({
    id: buildObservationId(policyGroupId, 'market', index),
    metric: 'market_multiple',
    basis: pack.marketMetric,
    value,
    sourceKind: 'transaction',
    sizeBand: 'sub_1bn_revenue',
    observedAt: OBSERVED_AT,
    quality: pack.quality[index] || 'medium',
    sourceReferenceId: pack.sourceReferences[0].id,
  }));
}

function buildCapRateObservations(policyGroupId, pack) {
  return pack.earningsMultiples.map((multiple, index) => ({
    id: buildObservationId(policyGroupId, 'caprate', index),
    metric: 'capitalization_rate',
    basis: pack.capitalizedMetric,
    value: round(1 / multiple),
    sourceKind: 'transaction',
    sizeBand: 'sub_1bn_revenue',
    observedAt: OBSERVED_AT,
    quality: pack.quality[index] || 'medium',
    sourceReferenceId: pack.sourceReferences.at(-1)?.id || pack.sourceReferences[0].id,
  }));
}

function buildTransactionProxySet(policyGroupId, policyGroup, pack) {
  return {
    id: buildSetId(policyGroupId),
    policyGroupId,
    label: `${policyGroup.label} transaction proxy benchmark set`,
    mode: 'owner',
    geography: 'Sourceable private-market transaction proxy for Nigeria owner mode',
    asOfDate: REFRESH_DATE,
    sourceMix: ['curated_transaction_proxy', 'curated_secondary'],
    sourceNotes: [
      'This set is rebuilt from locally curated proxy values. It is not a live scrape of the listed external pages.',
      'External URLs in this set are manual reference links from the sourcing pass and may become stale.',
      ...pack.notes,
      'These are still external small-business transaction proxies and should be replaced over time with Nigeria-native Afrexit observations.',
    ],
    sourceReferences: [
      ...pack.sourceReferences.map((reference) => ({
        ...reference,
        lastVerifiedAt: REFRESH_DATE,
      })),
      {
        id: 'wc-curated',
        label: 'Afrexit curated owner-mode working capital overlay',
        sourceType: 'manual_entry',
        lastVerifiedAt: REFRESH_DATE,
      },
      {
        id: 'marketability-curated',
        label: 'Afrexit curated owner-mode marketability overlay',
        sourceType: 'manual_entry',
        lastVerifiedAt: REFRESH_DATE,
      },
    ],
    observations: [
      ...buildRevenueObservations(policyGroupId, pack),
      ...buildCapRateObservations(policyGroupId, pack),
      ...buildWorkingCapitalObservations(policyGroupId, policyGroup),
      ...buildMarketabilityObservations(policyGroupId, policyGroup),
    ],
  };
}

function main() {
  const benchmarkData = readJson(BENCHMARK_DATA_PATH);
  const policyRegistry = readJson(POLICY_REGISTRY_PATH);

  const nextSets = benchmarkData.benchmarkSets.map((set) => {
    const packId = POLICY_GROUP_PACK_MAP[set.policyGroupId];
    if (!packId) {
      return set;
    }

    const policyGroup = policyRegistry.policyGroups[set.policyGroupId];
    const pack = PACKS[packId];
    return buildTransactionProxySet(set.policyGroupId, policyGroup, pack);
  });

  writeJson(BENCHMARK_DATA_PATH, {
    benchmarkSets: nextSets,
  });

  const rebuildResult = spawnSync('node', ['scripts/valuation-engine/calibration-maintenance.mjs', 'rebuild'], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (rebuildResult.status !== 0) {
    throw new Error(rebuildResult.stderr?.trim() || rebuildResult.stdout?.trim() || 'Calibration rebuild failed.');
  }

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        replacedPolicyGroups: Object.keys(POLICY_GROUP_PACK_MAP),
        rebuild: rebuildResult.stdout.trim(),
      },
      null,
      2
    )
  );
}

main();
