import { useCallback, useEffect, useRef, useState } from 'react';
import { calculatePreliminaryRange, fetchPartialValuation, type PartialValuationResult } from '@/api/valuation-partial';
import type { FormData } from '@/types/valuation';
import { parseMillionsNumber } from '@/lib/million-currency';

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`).join(',')}}`;
  }

  return JSON.stringify(value ?? null);
}

function buildInputSignature(formData: FormData) {
  return stableSerialize(formData);
}

function buildPreviewSignature(result: PartialValuationResult) {
  return JSON.stringify({
    low: result.range.low,
    high: result.range.high,
    mid: result.range.mid,
    adjustedValue: result.adjustedValue,
    preciseAdjustedValue: result.preciseAdjustedValue,
    readinessScore: result.readinessScore,
    confidenceScore: result.confidenceScore,
    rangeWidthPct: result.rangeWidthPct,
    primaryMethod: result.primaryMethod,
    marketPositionFactor: result.qualitativeAdjustments?.marketPositionAdjustmentFactor,
    transactionContextFactor: result.qualitativeAdjustments?.transactionContextFactor,
    urgencyFactor: result.qualitativeAdjustments?.achievableUrgencyFactor,
  });
}

export function canCalculateOwnerLivePreview(formData: FormData) {
  const level1 = String(formData.level1 || '').trim();
  const level2 = String(formData.level2 || '').trim();
  const revenue = parseMillionsNumber(formData.revenueLatest);
  const operatingProfit = parseMillionsNumber(formData.operatingProfitLatest);
  return Boolean(level1 && level2 && ((revenue ?? 0) > 0 || (operatingProfit ?? 0) > 0));
}

export function useOwnerLivePreview(formData: FormData, options?: { debounceMs?: number; enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const debounceMs = options?.debounceMs ?? 450;
  const [result, setResult] = useState<PartialValuationResult | null>(null);
  const [previousResult, setPreviousResult] = useState<PartialValuationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const latestResultRef = useRef<PartialValuationResult | null>(null);
  const latestRequestIdRef = useRef(0);
  const latestResolvedInputSignatureRef = useRef<string | null>(null);
  const canCalculatePreview = enabled && canCalculateOwnerLivePreview(formData);
  const currentInputSignature = buildInputSignature(formData);

  const commitResult = useCallback((nextResult: PartialValuationResult, inputSignature: string) => {
    const current = latestResultRef.current;
    if (current && buildPreviewSignature(current) !== buildPreviewSignature(nextResult)) {
      setPreviousResult(current);
    }
    latestResultRef.current = nextResult;
    latestResolvedInputSignatureRef.current = inputSignature;
    setResult(nextResult);
  }, []);

  useEffect(() => {
    if (!canCalculatePreview) {
      latestResultRef.current = null;
      latestRequestIdRef.current += 1;
      setResult(null);
      setPreviousResult(null);
      setIsCalculating(false);
      latestResolvedInputSignatureRef.current = null;
      return;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    const delayMs = latestResultRef.current ? debounceMs : 0;

    const timer = window.setTimeout(() => {
      setIsCalculating(true);

      fetchPartialValuation(formData)
        .catch((error) => {
          console.log('Backend partial valuation failed, using fallback:', error.message);
          return calculatePreliminaryRange(formData);
        })
        .then((nextResult) => {
          if (latestRequestIdRef.current !== requestId) {
            return;
          }
          commitResult(nextResult, currentInputSignature);
        })
        .finally(() => {
          if (latestRequestIdRef.current === requestId) {
            setIsCalculating(false);
          }
        });
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [formData, canCalculatePreview, debounceMs, commitResult, currentInputSignature]);

  const isResultCurrent =
    Boolean(result) &&
    latestResolvedInputSignatureRef.current === currentInputSignature &&
    !isCalculating;

  return {
    result,
    previousResult,
    isCalculating,
    canCalculatePreview,
    isResultCurrent,
  };
}

export function useLivePreviewDebugToggle() {
  const [debugAvailable, setDebugAvailable] = useState(false);
  const [debugEnabled, setDebugEnabledState] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const debugParamEnabled = params.get('liveDebug') === '1';
    const available = import.meta.env.DEV || window.location.hostname === 'localhost' || debugParamEnabled;
    setDebugAvailable(available);

    const storedValue = window.localStorage.getItem('afrexit.live-preview-debug');
    if (storedValue === '1') {
      setDebugEnabledState(true);
      return;
    }

    if (debugParamEnabled) {
      setDebugEnabledState(true);
    }
  }, []);

  const setDebugEnabled = useCallback((nextValue: boolean) => {
    setDebugEnabledState(nextValue);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('afrexit.live-preview-debug', nextValue ? '1' : '0');
    }
  }, []);

  return {
    debugAvailable,
    debugEnabled,
    setDebugEnabled,
  };
}
