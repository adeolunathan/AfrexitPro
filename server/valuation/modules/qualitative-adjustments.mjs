import { average, clamp, safeDivide } from './utils.mjs';
import {
  buildFxExposureAdjustmentFromValue,
  buildGeographyAdjustmentFromPrimaryState,
  buildLevel1AdjustmentFromLevel1,
  buildMarketPositionAdjustmentFromValues,
  buildTraceabilityAdjustmentFromValue,
  normalizePrimaryState as normalizeSharedPrimaryState,
  scoreOperatingYearsBand as scoreSharedOperatingYearsBand,
} from '../../../src/valuation-engine/shared/live-preview-factors.mjs';

const productRetailLevel2Set = new Set([
  'retail_physical',
  'retail_ecommerce',
  'wholesale',
  'distribution',
  'food_restaurant',
  'food_fast_food',
]);
const manufacturingLevel2Set = new Set([
  'manufacturing',
  'assembly',
  'production',
  'light_manufacturing',
  'fabrication',
]);

const branchScoreMaps = {
  productRights: { company_owned: 88, mixed_control: 65, customer_owned: 40, public_domain: 22, not_sure: 50 },
  quantities: { repeat_batches: 86, mixed_profile: 62, mostly_custom: 40, one_off_bespoke: 22, not_sure: 50 },
  productCustomisation: { standardized: 90, configured: 72, tailored: 46, fully_bespoke: 24, not_sure: 50 },
  grossMarginStability: { expanding: 88, stable: 75, volatile: 45, contracting: 25 },
  supplierConcentration: { diversified: 85, moderate: 65, concentrated: 40, single_source: 20 },
  shrinkageSpoilage: { minimal: 85, moderate: 65, significant: 40, major: 20 },
  peakSeasonDependency: { flat: 82, slight: 70, moderate: 50, extreme: 25 },
  staffUtilization: { gt_80: 85, '60_80': 72, '40_60': 50, lt_40: 30 },
  keyPersonDependencies: { none: 82, one: 65, few: 40, many: 20 },
  pricingPowerVsMarket: { premium: 85, market: 65, slight_discount: 45, significant_discount: 25 },
  capacityUtilization: { gt_90: 80, '70_90': 72, '50_70': 55, lt_50: 35 },
  manufacturingValueCreation: { in_house_majority: 86, balanced: 62, outsourced_majority: 40, assembly_only: 24, not_sure: 50 },
  equipmentAgeCondition: { modern: 85, good: 70, aging: 45, outdated: 20 },
  rawMaterialPriceExposure: { minimal: 82, moderate: 65, significant: 40, critical: 20 },
  qualityCertifications: { major: 85, local: 68, in_progress: 55, none: 35 },
};

function hasText(value) {
  return Boolean(String(value ?? '').trim());
}

function scoreFromMap(mapName, key, fallback = 50) {
  const map = branchScoreMaps[mapName] || {};
  return map[key] ?? fallback;
}

function buildSignal(key, value, score) {
  if (!hasText(value)) return null;
  return { key, value: String(value), score };
}

function scoreMaintenanceCapexContext(request) {
  const latestPeriod = request.financials?.historicals?.[0];
  const revenue = latestPeriod?.revenue || 0;
  const maintenanceCapex = latestPeriod?.maintenanceCapex || 0;

  if (maintenanceCapex <= 0 || revenue <= 0) {
    return null;
  }

  const ratio = safeDivide(maintenanceCapex, revenue, 0);
  if (ratio <= 0.015) return 80;
  if (ratio <= 0.03) return 68;
  if (ratio <= 0.06) return 52;
  return 35;
}

export function normalizePrimaryState(value) {
  return normalizeSharedPrimaryState(value);
}

export function buildGeographyAdjustment(primaryState) {
  return buildGeographyAdjustmentFromPrimaryState(primaryState);
}

export function scoreOperatingYearsBand(value) {
  return scoreSharedOperatingYearsBand(value);
}

export function buildLevel1Adjustment(level1) {
  return buildLevel1AdjustmentFromLevel1(level1);
}

export function buildMarketPositionAdjustment(request) {
  const operatingProfile = request.operatingProfile || {};
  return buildMarketPositionAdjustmentFromValues({
    catchmentArea: operatingProfile.catchmentArea,
    differentiation: operatingProfile.differentiation,
    pricingPower: operatingProfile.pricingPower,
  });
}

export function buildFxExposureAdjustment(request) {
  return buildFxExposureAdjustmentFromValue(request.operatingProfile?.fxExposure);
}

export function buildTraceabilityAdjustment(request) {
  return buildTraceabilityAdjustmentFromValue(request.financials?.sourceQuality?.traceablePaymentsShare);
}

export function buildTransactionGoalAdjustment(request) {
  const purpose = request.engagement?.purpose;
  const targetTransaction = request.engagement?.targetTransaction;

  if (purpose === 'fundraise' || targetTransaction === 'minority_raise') {
    return {
      transactionContextFactor: 1.01,
      transactionContextLabel: 'investment_context',
    };
  }

  if (targetTransaction === 'partial_sale') {
    return {
      transactionContextFactor: 0.995,
      transactionContextLabel: 'partial_sale_context',
    };
  }

  if (purpose === 'internal_planning') {
    return {
      transactionContextFactor: 1.005,
      transactionContextLabel: 'planning_context',
    };
  }

  return {
    transactionContextFactor: 1,
    transactionContextLabel: 'sale_context',
  };
}

export function buildBranchQualityAdjustment(request) {
  const operatingProfile = request.operatingProfile || {};
  const level2 = String(request.classification?.level2 ?? '').trim();
  let family;
  let signals = [];

  const looksManufacturingLevel2 = manufacturingLevel2Set.has(level2);
  const looksProductLevel2 = productRetailLevel2Set.has(level2);
  const hasManufacturingSignal =
    hasText(operatingProfile.capacityUtilization) ||
    hasText(operatingProfile.manufacturingValueCreation) ||
    hasText(operatingProfile.equipmentAgeCondition) ||
    hasText(operatingProfile.rawMaterialPriceExposure) ||
    hasText(operatingProfile.qualityCertifications);
  const hasProductSignal =
    hasText(operatingProfile.productRights) ||
    hasText(operatingProfile.quantities) ||
    hasText(operatingProfile.productCustomisation) ||
    hasText(operatingProfile.grossMarginStability) ||
    hasText(operatingProfile.supplierConcentration) ||
    hasText(operatingProfile.shrinkageSpoilage) ||
    hasText(operatingProfile.peakSeasonDependency);

  if (hasManufacturingSignal || (looksManufacturingLevel2 && hasProductSignal)) {
    family = 'manufacturing';
    signals = [
      buildSignal(
        'productRights',
        operatingProfile.productRights,
        scoreFromMap('productRights', operatingProfile.productRights)
      ),
      buildSignal(
        'quantities',
        operatingProfile.quantities,
        scoreFromMap('quantities', operatingProfile.quantities)
      ),
      buildSignal(
        'productCustomisation',
        operatingProfile.productCustomisation,
        scoreFromMap('productCustomisation', operatingProfile.productCustomisation)
      ),
      buildSignal(
        'manufacturingValueCreation',
        operatingProfile.manufacturingValueCreation,
        scoreFromMap('manufacturingValueCreation', operatingProfile.manufacturingValueCreation)
      ),
      buildSignal(
        'capacityUtilization',
        operatingProfile.capacityUtilization,
        scoreFromMap('capacityUtilization', operatingProfile.capacityUtilization)
      ),
      buildSignal(
        'equipmentAgeCondition',
        operatingProfile.equipmentAgeCondition,
        scoreFromMap('equipmentAgeCondition', operatingProfile.equipmentAgeCondition)
      ),
      buildSignal(
        'rawMaterialPriceExposure',
        operatingProfile.rawMaterialPriceExposure,
        scoreFromMap('rawMaterialPriceExposure', operatingProfile.rawMaterialPriceExposure)
      ),
      buildSignal(
        'qualityCertifications',
        operatingProfile.qualityCertifications,
        scoreFromMap('qualityCertifications', operatingProfile.qualityCertifications)
      ),
    ].filter(Boolean);

    const maintenanceCapexScore = scoreMaintenanceCapexContext(request);
    if (typeof maintenanceCapexScore === 'number') {
      signals.push({
        key: 'maintenanceCapexContext',
        value: 'derived_from_latest_period',
        score: maintenanceCapexScore,
      });
    }
  } else if (hasProductSignal || (looksProductLevel2 && hasProductSignal)) {
    family = 'product_retail';
    signals = [
      buildSignal(
        'productRights',
        operatingProfile.productRights,
        scoreFromMap('productRights', operatingProfile.productRights)
      ),
      buildSignal(
        'quantities',
        operatingProfile.quantities,
        scoreFromMap('quantities', operatingProfile.quantities)
      ),
      buildSignal(
        'productCustomisation',
        operatingProfile.productCustomisation,
        scoreFromMap('productCustomisation', operatingProfile.productCustomisation)
      ),
      buildSignal(
        'grossMarginStability',
        operatingProfile.grossMarginStability,
        scoreFromMap('grossMarginStability', operatingProfile.grossMarginStability)
      ),
      buildSignal(
        'supplierConcentration',
        operatingProfile.supplierConcentration,
        scoreFromMap('supplierConcentration', operatingProfile.supplierConcentration)
      ),
      buildSignal(
        'shrinkageSpoilage',
        operatingProfile.shrinkageSpoilage,
        scoreFromMap('shrinkageSpoilage', operatingProfile.shrinkageSpoilage)
      ),
      buildSignal(
        'peakSeasonDependency',
        operatingProfile.peakSeasonDependency,
        scoreFromMap('peakSeasonDependency', operatingProfile.peakSeasonDependency)
      ),
    ].filter(Boolean);
  } else if (
    hasText(operatingProfile.staffUtilization) ||
    hasText(operatingProfile.keyPersonDependencies) ||
    hasText(operatingProfile.pricingPowerVsMarket)
  ) {
    family = 'professional_services';
    signals = [
      buildSignal('founderRevenueDependence', operatingProfile.founderRevenueDependence, operatingProfile.founderRevenueDependence === 'very_little'
        ? 90
        : operatingProfile.founderRevenueDependence === 'some'
          ? 65
          : operatingProfile.founderRevenueDependence === 'large_share'
            ? 35
            : 15),
      buildSignal('recurringRevenueShare', operatingProfile.recurringRevenueShare, operatingProfile.recurringRevenueShare === 'very_little'
        ? 35
        : operatingProfile.recurringRevenueShare === 'some'
          ? 55
          : operatingProfile.recurringRevenueShare === 'meaningful'
            ? 75
            : 90),
      buildSignal('revenueVisibility', operatingProfile.revenueVisibility, operatingProfile.revenueVisibility === 'unpredictable'
        ? 30
        : operatingProfile.revenueVisibility === 'some_repeat'
          ? 55
          : operatingProfile.revenueVisibility === 'good_repeat'
            ? 75
            : 90),
      buildSignal(
        'staffUtilization',
        operatingProfile.staffUtilization,
        scoreFromMap('staffUtilization', operatingProfile.staffUtilization)
      ),
      buildSignal(
        'keyPersonDependencies',
        operatingProfile.keyPersonDependencies,
        scoreFromMap('keyPersonDependencies', operatingProfile.keyPersonDependencies)
      ),
      buildSignal(
        'pricingPowerVsMarket',
        operatingProfile.pricingPowerVsMarket,
        scoreFromMap('pricingPowerVsMarket', operatingProfile.pricingPowerVsMarket)
      ),
    ].filter(Boolean);
  }

  const validSignals = signals.filter(Boolean);
  if (!validSignals.length) {
    return {
      branchFamily: family,
      branchQualityFactor: 1,
      branchSignalScore: undefined,
      branchSignals: [],
    };
  }

  const branchSignalScore = average(validSignals.map((signal) => signal.score), 60);
  const branchQualityFactor = clamp(1 + (branchSignalScore - 60) / 500, 0.94, 1.06);

  return {
    branchFamily: family,
    branchQualityFactor: Number(branchQualityFactor.toFixed(4)),
    branchSignalScore: Math.round(branchSignalScore),
    branchSignals: validSignals,
  };
}
