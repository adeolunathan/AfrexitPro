import type { ApiResponse, FormData, ResultData } from '../types/valuation';
import { valuationResultSchema } from '../valuation-engine/contracts';
import { buildOwnerValuationRequest } from '../valuation-engine/owner-intake';

// Production API endpoint - update this when backend is deployed
// For local development: http://localhost:8788/api/valuation-v2
const API_URL = import.meta.env.VITE_VALUATION_API_URL || 'http://localhost:8788/api/valuation-v2';

export async function submitValuation(payload: FormData): Promise<ResultData> {
  const canonicalPayload = buildOwnerValuationRequest(payload);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(canonicalPayload),
  });

  const result = (await response.json()) as ApiResponse;

  if (!response.ok || result.status !== 'success' || !result.data) {
    throw new Error(result.message || 'The valuation service did not return a usable response.');
  }

  return valuationResultSchema.parse(result.data) as ResultData;
}
