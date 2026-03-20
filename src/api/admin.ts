import type { FormData, ResultData } from '@/types/valuation';
import type { ValuationRequest } from '@/valuation-engine/contracts';

function resolveAdminApiBase() {
  const configured = import.meta.env.VITE_VALUATION_API_URL || 'http://localhost:8788/api/valuation';
  return configured.replace(/\/api\/valuation\/?$/, '');
}

const API_URL = resolveAdminApiBase();

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  message?: string;
  data?: T;
};

export interface AdminSubmissionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  respondentRole: string;
  level1: string;
  level2: string;
  policyGroupId: string;
  primaryState: string;
  adjustedValue: number;
  lowEstimate: number;
  highEstimate: number;
  readinessScore: number;
  confidenceScore: number;
  answersSnapshot: FormData | null;
  requestSnapshot: ValuationRequest;
  resultSnapshot: ResultData;
}

export interface AdminScenarioRecord {
  id: string;
  title: string;
  description: string;
  sourceType: string;
  sourceSubmissionId: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  answersSnapshot: FormData | null;
  requestSnapshot: ValuationRequest | null;
  resultSnapshot: ResultData | null;
}

export interface AdminRunResponse {
  result: ResultData;
  summary: {
    adjustedValue: number;
    lowEstimate: number;
    highEstimate: number;
    readinessScore: number;
    confidenceScore: number;
    primaryMethod: string;
    secondaryMethods: string[];
    scorecard: ResultData['summary']['scorecard'];
    branchQualityFactor: number;
    geographyAdjustmentFactor: number;
  };
}

export interface SensitivityRunInput {
  label: string;
  request: ValuationRequest;
}

export interface SensitivityRow {
  label: string;
  metricValue: unknown;
  summary: AdminRunResponse['summary'];
  result: ResultData;
}

export interface InternalObservationRecord {
  id: string;
  case_id: string;
  company_alias?: string | null;
  case_type: string;
  case_stage: string;
  transaction_context: string;
  policy_group_id: string;
  level1?: string | null;
  level2?: string | null;
  primary_state?: string | null;
  metric: string;
  basis: string;
  value: number;
  source_kind: string;
  size_band: string;
  quality: string;
  observed_at: string;
  source_name: string;
  source_url?: string | null;
  source_date?: string | null;
  notes?: string | null;
  calibration_eligible: boolean;
  entered_by?: string | null;
  source_submission_id?: string | null;
  source_submission_timestamp?: string | null;
  approval_status: string;
  approval_notes?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

async function apiRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok || payload.status !== 'success' || payload.data === undefined) {
    throw new Error(payload.message || 'Admin API request failed.');
  }

  return payload.data;
}

export function listAdminSubmissions(token: string) {
  return apiRequest<AdminSubmissionRecord[]>('/api/admin/submissions', token);
}

export function listAdminScenarios(token: string) {
  return apiRequest<AdminScenarioRecord[]>('/api/admin/scenarios', token);
}

export function createAdminScenario(
  token: string,
  payload: {
    title: string;
    description?: string;
    sourceType?: string;
    sourceSubmissionId?: string;
    tags?: string[];
    notes?: string;
    answersSnapshot?: FormData | null;
    requestSnapshot?: ValuationRequest | null;
    resultSnapshot?: ResultData | null;
  }
) {
  return apiRequest<AdminScenarioRecord>('/api/admin/scenarios', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminScenario(
  token: string,
  id: string,
  payload: {
    title?: string;
    description?: string;
    sourceType?: string;
    sourceSubmissionId?: string;
    tags?: string[];
    notes?: string;
    answersSnapshot?: FormData | null;
    requestSnapshot?: ValuationRequest | null;
    resultSnapshot?: ResultData | null;
  }
) {
  return apiRequest<AdminScenarioRecord>(`/api/admin/scenarios/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function runAdminValuation(token: string, requestSnapshot: ValuationRequest) {
  return apiRequest<AdminRunResponse>('/api/admin/run', token, {
    method: 'POST',
    body: JSON.stringify({ requestSnapshot }),
  });
}

export function runAdminSensitivity(
  token: string,
  payload: {
    metricPath: string;
    runs: SensitivityRunInput[];
  }
) {
  return apiRequest<{ metricPath: string; rows: SensitivityRow[] }>('/api/admin/sensitivity', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listAdminInternalObservations(token: string) {
  return apiRequest<InternalObservationRecord[]>('/api/admin/internal-observations', token);
}
