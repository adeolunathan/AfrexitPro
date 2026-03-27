import type { FormData } from '@/types/valuation';
import type { BranchModule } from '@/data/branch-modules';
import { calculatePartialValuation } from '@/valuation-engine/calculatePartialValuation';

const API_ROOT_URL = (import.meta.env.VITE_VALUATION_API_URL || 'http://localhost:8788/api/valuation').replace(/\/$/, '');
const PARTIAL_URL = API_ROOT_URL.endsWith('/partial') ? API_ROOT_URL : `${API_ROOT_URL}/partial`;

export interface PreliminaryRange {
  low: number;
  high: number;
  mid: number;
}

export interface ConfidenceBreakdown {
  dataCompleteness: number;
  recordsQuality: number;
  benchmarkCoverage: number;
}

export interface PartialScorecardSummary {
  marketPosition: number;
  financialQuality: number;
  ownerIndependence: number;
  revenueQuality: number;
  operatingResilience: number;
  transactionReadiness: number;
}

export interface PartialFactorCard {
  key: string;
  label: string;
  factor: number;
  note?: string;
  appliesTo?: string[];
  signalScore?: number;
}

export interface PartialQualitativeAdjustments {
  geographyBucket?: string;
  normalizedPrimaryState?: string;
  geographyAdjustmentFactor?: number;
  level1Bucket?: string;
  level1AdjustmentFactor?: number;
  transactionContextLabel?: string;
  transactionContextFactor?: number;
  achievableUrgencyFactor?: number;
  marketPositionSignalScore?: number;
  marketPositionAdjustmentFactor?: number;
  fxExposure?: string;
  fxExposureAdjustmentFactor?: number;
  traceablePaymentsShare?: string;
  traceabilityAdjustmentFactor?: number;
  branchFamily?: string;
  branchQualityFactor?: number;
  branchSignalScore?: number;
}

export interface Flag {
  type: 'warning' | 'info';
  message: string;
  field?: string;
}

export interface PartialValuationResult {
  range: PreliminaryRange;
  adjustedValue: number;
  preciseAdjustedValue: number;
  preciseLowEstimate: number;
  preciseHighEstimate: number;
  readinessScore: number;
  confidence: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  confidenceScore: number;
  rangeWidthPct: number;
  confidenceBreakdown: ConfidenceBreakdown;
  flags: Flag[];
  phase: string;
  nextPhase: string;
  primaryMethod: string | null;
  scorecard: PartialScorecardSummary | null;
  qualitativeAdjustments: PartialQualitativeAdjustments | null;
  factorCards: PartialFactorCard[];
  sourceModel: 'owner_engine' | 'fallback';
}

/**
 * Fetch partial valuation from backend
 * Used for real-time range updates during questionnaire
 */
export async function fetchPartialValuation(answers: Partial<FormData>): Promise<PartialValuationResult> {
  const response = await fetch(PARTIAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answers),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to calculate partial valuation');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Client-side calculation
 * Used as fallback when backend is unavailable
 */
export function calculatePreliminaryRange(answers: Partial<FormData>): PartialValuationResult {
  const result = calculatePartialValuation(answers);
  return result;
}

export function formatCurrency(value: number): string {
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}m`;
}

export function formatRange(low: number, high: number): string {
  return `${formatCurrency(low)} – ${formatCurrency(high)}`;
}

/**
 * Calculate range tightening progress
 */
export function calculateRangeProgress(
  previousRange: PreliminaryRange,
  currentRange: PreliminaryRange
): { percentImprovement: number } {
  const previousWidth = previousRange.high - previousRange.low;
  const currentWidth = currentRange.high - currentRange.low;
  const reduction = previousWidth - currentWidth;
  
  if (previousWidth <= 0) return { percentImprovement: 0 };
  
  const percentImprovement = (reduction / previousWidth) * 100;
  return {
    percentImprovement: Math.max(0, Math.round(percentImprovement)),
  };
}

/**
 * Format branch information for display
 */
export function formatBranchInfo(branches: BranchModule[]): {
  totalMinutes: number;
  descriptions: string[];
} {
  const totalMinutes = branches.reduce((sum, b) => sum + (b.estimatedMinutes || 0), 0);
  const descriptions = branches.map(b => b.shortDescription || b.title);
  
  return { totalMinutes, descriptions };
}
