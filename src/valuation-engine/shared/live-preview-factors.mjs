const premiumStateSet = new Set(['lagos_island', 'lagos_mainland', 'fct']);
const establishedStateSet = new Set(['rivers', 'ogun', 'oyo', 'kano', 'anambra', 'delta', 'edo', 'kaduna', 'akwa_ibom']);
const level1AssetHeavySet = new Set(['agriculture', 'manufacturing', 'construction', 'transport', 'real_estate']);
const level1ScalableSet = new Set(['software', 'professional', 'education']);

export const marketPositionScoreMaps = {
  catchmentArea: {
    local_city: 48,
    single_state: 58,
    multi_state: 70,
    national_single_base: 82,
    national_multi_base: 92,
    international: 98,
  },
  differentiation: { price: 42, reliability: 64, hard_to_copy: 86, founder_trust: 38, not_sure: 50 },
  pricingPower: { none: 38, some: 58, premium: 82, strong_premium: 96, not_sure: 48 },
};

export const marketPositionWeights = {
  catchmentArea: 0.5,
  differentiation: 0.2,
  pricingPower: 0.3,
};

const fxExposureFactorMap = { low: 1, moderate: 0.99, high: 0.97, very_high: 0.94 };
const traceabilityFactorMap = { '80_100': 1, '50_79': 0.985, '20_49': 0.95, lt_20: 0.9 };

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizePrimaryState(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return 'lagos_mainland';

  const aliases = {
    abuja_fct: 'fct',
    abuja: 'fct',
    port_harcourt: 'rivers',
  };

  return aliases[normalized] || normalized;
}

export function buildGeographyAdjustmentFromPrimaryState(primaryState) {
  const normalizedPrimaryState = normalizePrimaryState(primaryState);

  if (premiumStateSet.has(normalizedPrimaryState)) {
    return {
      normalizedPrimaryState,
      geographyBucket: 'premium_hub',
      geographyAdjustmentFactor: 1.025,
    };
  }

  if (establishedStateSet.has(normalizedPrimaryState)) {
    return {
      normalizedPrimaryState,
      geographyBucket: 'established_hub',
      geographyAdjustmentFactor: 1,
    };
  }

  return {
    normalizedPrimaryState,
    geographyBucket: 'other_state',
    geographyAdjustmentFactor: 0.975,
  };
}

export function scoreOperatingYearsBand(value) {
  const map = {
    lt_1: 35,
    '1_3': 48,
    '3_5': 60,
    '5_10': 72,
    '10_20': 82,
    gt_20: 88,
  };

  return map[String(value ?? '').trim()] ?? 55;
}

export function buildLevel1AdjustmentFromLevel1(level1) {
  const normalizedLevel1 = String(level1 ?? '').trim();
  if (level1ScalableSet.has(normalizedLevel1)) {
    return {
      normalizedLevel1,
      level1Bucket: 'scalable_light',
      level1Score: 72,
      level1AdjustmentFactor: 1.01,
    };
  }

  if (level1AssetHeavySet.has(normalizedLevel1)) {
    return {
      normalizedLevel1,
      level1Bucket: 'asset_execution_heavy',
      level1Score: 48,
      level1AdjustmentFactor: 0.99,
    };
  }

  return {
    normalizedLevel1,
    level1Bucket: 'mainstream_balanced',
    level1Score: 60,
    level1AdjustmentFactor: 1,
  };
}

export function buildMarketPositionAdjustmentFromValues({ catchmentArea, differentiation, pricingPower }) {
  const catchmentScore = marketPositionScoreMaps.catchmentArea[String(catchmentArea ?? '')] ?? 50;
  const differentiationScore = marketPositionScoreMaps.differentiation[String(differentiation ?? '')] ?? 50;
  const pricingPowerScore = marketPositionScoreMaps.pricingPower[String(pricingPower ?? '')] ?? 50;

  const marketPositionSignalScore =
    catchmentScore * marketPositionWeights.catchmentArea +
    differentiationScore * marketPositionWeights.differentiation +
    pricingPowerScore * marketPositionWeights.pricingPower;

  const marketPositionAdjustmentFactor = clamp(1 + (marketPositionSignalScore - 60) / 420, 0.94, 1.09);

  return {
    marketPositionSignalScore: Math.round(marketPositionSignalScore),
    marketPositionAdjustmentFactor: Number(marketPositionAdjustmentFactor.toFixed(4)),
    componentScores: {
      catchmentArea: catchmentScore,
      differentiation: differentiationScore,
      pricingPower: pricingPowerScore,
    },
  };
}

export function buildFxExposureAdjustmentFromValue(fxExposure) {
  const normalized = String(fxExposure ?? '').trim();
  return {
    fxExposure: normalized,
    fxExposureAdjustmentFactor: fxExposureFactorMap[normalized] ?? 1,
  };
}

export function buildTraceabilityAdjustmentFromValue(traceablePaymentsShare) {
  const normalized = String(traceablePaymentsShare ?? '').trim();
  return {
    traceablePaymentsShare: normalized,
    traceabilityAdjustmentFactor: traceabilityFactorMap[normalized] ?? 1,
  };
}
