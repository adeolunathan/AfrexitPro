import type { V2ApiResponse, V2FormData, V2ResultData } from './valuation-v2-types';
import { valuationResultSchema } from './valuation-engine/contracts';
import { buildOwnerValuationRequest } from './valuation-engine/owner-intake';

const LOCAL_API_URL = 'http://localhost:8788/api/valuation-v2';

export async function submitValuationV2(payload: V2FormData): Promise<V2ResultData> {
  const canonicalPayload = buildOwnerValuationRequest(payload);

  const response = await fetch(LOCAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(canonicalPayload),
  });

  const result = (await response.json()) as V2ApiResponse;

  if (!response.ok || result.status !== 'success' || !result.data) {
    throw new Error(result.message || 'The local valuation-v2 backend did not return a usable response.');
  }

  return valuationResultSchema.parse(result.data) as V2ResultData;
}
