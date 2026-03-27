export const marketPositionScoreMaps: {
  catchmentArea: Record<string, number>;
  differentiation: Record<string, number>;
  pricingPower: Record<string, number>;
};

export const marketPositionWeights: {
  catchmentArea: number;
  differentiation: number;
  pricingPower: number;
};

export function clamp(value: number, min: number, max: number): number;

export function normalizePrimaryState(value: unknown): string;

export function buildGeographyAdjustmentFromPrimaryState(primaryState: unknown): {
  normalizedPrimaryState: string;
  geographyBucket: string;
  geographyAdjustmentFactor: number;
};

export function scoreOperatingYearsBand(value: unknown): number;

export function buildLevel1AdjustmentFromLevel1(level1: unknown): {
  normalizedLevel1: string;
  level1Bucket: string;
  level1Score: number;
  level1AdjustmentFactor: number;
};

export function buildMarketPositionAdjustmentFromValues(input: {
  catchmentArea?: unknown;
  differentiation?: unknown;
  pricingPower?: unknown;
}): {
  marketPositionSignalScore: number;
  marketPositionAdjustmentFactor: number;
  componentScores: {
    catchmentArea: number;
    differentiation: number;
    pricingPower: number;
  };
};

export function buildFxExposureAdjustmentFromValue(fxExposure: unknown): {
  fxExposure: string;
  fxExposureAdjustmentFactor: number;
};

export function buildTraceabilityAdjustmentFromValue(traceablePaymentsShare: unknown): {
  traceablePaymentsShare: string;
  traceabilityAdjustmentFactor: number;
};
