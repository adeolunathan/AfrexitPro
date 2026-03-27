// The runtime implementation lives in .mjs so both the browser and Node valuation paths can share it.
// TypeScript's bundler resolution does not infer declarations for that import cleanly here, so this file
// provides a typed frontend wrapper without changing the server runtime path.
// @ts-expect-error Shared runtime module is implemented in .mjs.
import * as runtime from './live-preview-factors.mjs';

export const marketPositionScoreMaps = runtime.marketPositionScoreMaps as {
  catchmentArea: Record<string, number>;
  differentiation: Record<string, number>;
  pricingPower: Record<string, number>;
};

export const marketPositionWeights = runtime.marketPositionWeights as {
  catchmentArea: number;
  differentiation: number;
  pricingPower: number;
};

export const clamp = runtime.clamp as (value: number, min: number, max: number) => number;

export const normalizePrimaryState = runtime.normalizePrimaryState as (value: unknown) => string;

export const buildGeographyAdjustmentFromPrimaryState = runtime.buildGeographyAdjustmentFromPrimaryState as (
  primaryState: unknown
) => {
  normalizedPrimaryState: string;
  geographyBucket: string;
  geographyAdjustmentFactor: number;
};

export const scoreOperatingYearsBand = runtime.scoreOperatingYearsBand as (value: unknown) => number;

export const buildLevel1AdjustmentFromLevel1 = runtime.buildLevel1AdjustmentFromLevel1 as (
  level1: unknown
) => {
  normalizedLevel1: string;
  level1Bucket: string;
  level1Score: number;
  level1AdjustmentFactor: number;
};

export const buildMarketPositionAdjustmentFromValues = runtime.buildMarketPositionAdjustmentFromValues as (input: {
  catchmentArea?: unknown;
  differentiation?: unknown;
  pricingPower?: unknown;
}) => {
  marketPositionSignalScore: number;
  marketPositionAdjustmentFactor: number;
  componentScores: {
    catchmentArea: number;
    differentiation: number;
    pricingPower: number;
  };
};

export const buildFxExposureAdjustmentFromValue = runtime.buildFxExposureAdjustmentFromValue as (
  fxExposure: unknown
) => {
  fxExposure: string;
  fxExposureAdjustmentFactor: number;
};

export const buildTraceabilityAdjustmentFromValue = runtime.buildTraceabilityAdjustmentFromValue as (
  traceablePaymentsShare: unknown
) => {
  traceablePaymentsShare: string;
  traceabilityAdjustmentFactor: number;
};
