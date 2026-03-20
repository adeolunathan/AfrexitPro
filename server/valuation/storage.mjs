import { getSupabaseAdminClient } from './supabase.mjs';

function extractSubmissionSummary(request, result, source) {
  return {
    source,
    business_name: request.company?.businessName || '',
    first_name: request.company?.firstName || '',
    last_name: request.company?.lastName || '',
    email: request.company?.email || '',
    whatsapp: request.company?.whatsapp || '',
    respondent_role: request.meta?.respondentRole || 'owner',
    level1: request.classification?.level1 || '',
    level2: request.classification?.level2 || '',
    policy_group_id: request.classification?.policyGroupId || '',
    primary_state: request.company?.primaryState || '',
    adjusted_value_millions: result.summary?.adjustedValue ?? null,
    low_estimate_millions: result.summary?.lowEstimate ?? null,
    high_estimate_millions: result.summary?.highEstimate ?? null,
    readiness_score: result.summary?.readinessScore ?? null,
    confidence_score: result.summary?.confidenceScore ?? null,
    request_snapshot_jsonb: request,
    result_snapshot_jsonb: result,
  };
}

function mapSubmissionRow(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: row.source,
    businessName: row.business_name,
    firstName: row.first_name,
    lastName: row.last_name || '',
    email: row.email,
    whatsapp: row.whatsapp,
    respondentRole: row.respondent_role,
    level1: row.level1,
    level2: row.level2,
    policyGroupId: row.policy_group_id,
    primaryState: row.primary_state,
    adjustedValue: row.adjusted_value_millions,
    lowEstimate: row.low_estimate_millions,
    highEstimate: row.high_estimate_millions,
    readinessScore: row.readiness_score,
    confidenceScore: row.confidence_score,
    answersSnapshot: row.answers_snapshot_jsonb,
    requestSnapshot: row.request_snapshot_jsonb,
    resultSnapshot: row.result_snapshot_jsonb,
  };
}

function mapScenarioRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    sourceType: row.source_type,
    sourceSubmissionId: row.source_submission_id || '',
    tags: row.tags || [],
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    answersSnapshot: row.answers_snapshot_jsonb,
    requestSnapshot: row.request_snapshot_jsonb,
    resultSnapshot: row.result_snapshot_jsonb,
  };
}

export async function createSubmission({ source, answersSnapshot, requestSnapshot, resultSnapshot }) {
  const supabase = getSupabaseAdminClient();
  const payload = {
    ...extractSubmissionSummary(requestSnapshot, resultSnapshot, source),
    answers_snapshot_jsonb: answersSnapshot || null,
  };

  const { data, error } = await supabase
    .from('valuation_submissions')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSubmissionRow(data);
}

export async function listSubmissions() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('valuation_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapSubmissionRow);
}

export async function getSubmissionById(id) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('valuation_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`Unknown submission: ${id}`);
  }

  return mapSubmissionRow(data);
}

export async function listScenarios() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('admin_scenarios')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapScenarioRow);
}

export async function createScenario(entry) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('admin_scenarios')
    .insert({
      title: entry.title,
      description: entry.description || '',
      source_type: entry.sourceType,
      source_submission_id: entry.sourceSubmissionId || null,
      tags: entry.tags || [],
      notes: entry.notes || '',
      answers_snapshot_jsonb: entry.answersSnapshot || null,
      request_snapshot_jsonb: entry.requestSnapshot || null,
      result_snapshot_jsonb: entry.resultSnapshot || null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapScenarioRow(data);
}

export async function updateScenario(id, patch) {
  const supabase = getSupabaseAdminClient();
  const updatePayload = {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description || '' } : {}),
    ...(patch.sourceType !== undefined ? { source_type: patch.sourceType } : {}),
    ...(patch.sourceSubmissionId !== undefined ? { source_submission_id: patch.sourceSubmissionId || null } : {}),
    ...(patch.tags !== undefined ? { tags: patch.tags || [] } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes || '' } : {}),
    ...(patch.answersSnapshot !== undefined ? { answers_snapshot_jsonb: patch.answersSnapshot || null } : {}),
    ...(patch.requestSnapshot !== undefined ? { request_snapshot_jsonb: patch.requestSnapshot || null } : {}),
    ...(patch.resultSnapshot !== undefined ? { result_snapshot_jsonb: patch.resultSnapshot || null } : {}),
  };

  const { data, error } = await supabase
    .from('admin_scenarios')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapScenarioRow(data);
}

export async function listInternalObservations() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('internal_observations')
    .select('*')
    .order('observed_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function createInternalObservation(entry) {
  const supabase = getSupabaseAdminClient();
  const payload = {
    id: entry.id,
    case_id: entry.caseId,
    company_alias: entry.companyAlias || null,
    case_type: entry.caseType,
    case_stage: entry.caseStage,
    transaction_context: entry.transactionContext,
    policy_group_id: entry.policyGroupId,
    level1: entry.level1 || null,
    level2: entry.level2 || null,
    primary_state: entry.primaryState || null,
    metric: entry.metric,
    basis: entry.basis,
    value: entry.value,
    source_kind: entry.sourceKind,
    size_band: entry.sizeBand,
    quality: entry.quality,
    observed_at: entry.observedAt,
    source_name: entry.sourceName,
    source_url: entry.sourceUrl || null,
    source_date: entry.sourceDate || null,
    notes: entry.notes || null,
    calibration_eligible: entry.calibrationEligible,
    entered_by: entry.enteredBy || null,
    source_submission_id: entry.sourceSubmissionId || null,
    source_submission_timestamp: entry.sourceSubmissionTimestamp || null,
    approval_status: entry.approvalStatus,
    approval_notes: entry.approvalNotes || null,
    approved_by: entry.approvedBy || null,
    approved_at: entry.approvedAt || null,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };

  const { data, error } = await supabase
    .from('internal_observations')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateInternalObservation(id, nextEntry) {
  const supabase = getSupabaseAdminClient();
  const payload = {
    case_id: nextEntry.caseId,
    company_alias: nextEntry.companyAlias || null,
    case_type: nextEntry.caseType,
    case_stage: nextEntry.caseStage,
    transaction_context: nextEntry.transactionContext,
    policy_group_id: nextEntry.policyGroupId,
    level1: nextEntry.level1 || null,
    level2: nextEntry.level2 || null,
    primary_state: nextEntry.primaryState || null,
    metric: nextEntry.metric,
    basis: nextEntry.basis,
    value: nextEntry.value,
    source_kind: nextEntry.sourceKind,
    size_band: nextEntry.sizeBand,
    quality: nextEntry.quality,
    observed_at: nextEntry.observedAt,
    source_name: nextEntry.sourceName,
    source_url: nextEntry.sourceUrl || null,
    source_date: nextEntry.sourceDate || null,
    notes: nextEntry.notes || null,
    calibration_eligible: nextEntry.calibrationEligible,
    entered_by: nextEntry.enteredBy || null,
    source_submission_id: nextEntry.sourceSubmissionId || null,
    source_submission_timestamp: nextEntry.sourceSubmissionTimestamp || null,
    approval_status: nextEntry.approvalStatus,
    approval_notes: nextEntry.approvalNotes || null,
    approved_by: nextEntry.approvedBy || null,
    approved_at: nextEntry.approvedAt || null,
    updated_at: nextEntry.updatedAt,
  };

  const { data, error } = await supabase
    .from('internal_observations')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteInternalObservation(id) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('internal_observations')
    .delete()
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
