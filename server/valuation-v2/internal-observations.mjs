import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const booleanishSchema = z.union([z.boolean(), z.string(), z.number()]).transform((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
});

const captureSchema = z.object({
  caseId: z.string().min(1).max(80),
  companyAlias: z.string().max(120).optional().or(z.literal('')),
  caseType: z.enum(['sell_side_mandate', 'valuation_review', 'buyer_screen', 'diligence_support', 'market_scan', 'other']).default('valuation_review'),
  caseStage: z.enum(['intake', 'analysis', 'marketed', 'indication_received', 'closed', 'lost', 'on_hold']).default('analysis'),
  transactionContext: z.enum(['full_sale', 'partial_sale', 'fundraise', 'internal_planning', 'succession', 'other']).default('other'),
  policyGroupId: z.string().min(1),
  level1: z.string().max(80).optional().or(z.literal('')),
  level2: z.string().max(120).optional().or(z.literal('')),
  primaryState: z.string().max(80).optional().or(z.literal('')),
  metric: z.enum(['market_multiple', 'capitalization_rate', 'working_capital_pct', 'marketability_factor']),
  basis: z.string().min(1),
  value: z.coerce.number().finite().positive(),
  sourceKind: z.enum(['transaction', 'private_observation', 'curated_secondary']).default('private_observation'),
  sizeBand: z.string().min(1),
  quality: z.enum(['low', 'medium', 'high']),
  observedAt: z.string().min(1),
  sourceName: z.string().min(1).max(160),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  sourceDate: z.string().min(1).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  calibrationEligible: booleanishSchema.default(false),
  enteredBy: z.string().max(80).optional().or(z.literal('')),
  sourceSubmissionId: z.string().max(120).optional().or(z.literal('')),
  sourceSubmissionTimestamp: z.string().max(80).optional().or(z.literal('')),
  approvalStatus: z.enum(['draft', 'approved', 'rejected']).default('draft'),
  approvalNotes: z.string().max(1000).optional().or(z.literal('')),
  approvedBy: z.string().max(80).optional().or(z.literal('')),
});

const updateSchema = captureSchema.partial().extend({
  approvalStatus: z.enum(['draft', 'approved', 'rejected']).optional(),
  approvalNotes: z.string().max(1000).optional().or(z.literal('')),
  approvedBy: z.string().max(80).optional().or(z.literal('')),
});

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function parseInternalObservationPayload(payload) {
  const parsed = captureSchema.parse(payload);
  const createdAt = new Date().toISOString();
  const approvedAt = parsed.approvalStatus === 'approved' ? createdAt : undefined;

  return {
    id: `obs_${slugify(parsed.policyGroupId)}_${slugify(parsed.caseId)}_${randomUUID().slice(0, 8)}`,
    ...parsed,
    sourceUrl: parsed.sourceUrl || undefined,
    sourceDate: parsed.sourceDate || undefined,
    notes: parsed.notes || undefined,
    enteredBy: parsed.enteredBy || undefined,
    companyAlias: parsed.companyAlias || undefined,
    level1: parsed.level1 || undefined,
    level2: parsed.level2 || undefined,
    primaryState: parsed.primaryState || undefined,
    sourceSubmissionId: parsed.sourceSubmissionId || undefined,
    sourceSubmissionTimestamp: parsed.sourceSubmissionTimestamp || undefined,
    approvalNotes: parsed.approvalNotes || undefined,
    approvedBy: parsed.approvedBy || parsed.enteredBy || undefined,
    approvedAt,
    createdAt,
    updatedAt: createdAt,
  };
}

export function updateInternalObservationPayload(existingEntry, payload) {
  const parsed = updateSchema.parse(payload);
  const updatedAt = new Date().toISOString();
  const nextApprovalStatus = parsed.approvalStatus || existingEntry.approvalStatus || 'draft';
  const approvedAt =
    nextApprovalStatus === 'approved'
      ? existingEntry.approvedAt || updatedAt
      : undefined;

  return {
    ...existingEntry,
    ...parsed,
    sourceUrl: parsed.sourceUrl === '' ? undefined : parsed.sourceUrl ?? existingEntry.sourceUrl,
    sourceDate: parsed.sourceDate === '' ? undefined : parsed.sourceDate ?? existingEntry.sourceDate,
    notes: parsed.notes === '' ? undefined : parsed.notes ?? existingEntry.notes,
    enteredBy: parsed.enteredBy === '' ? undefined : parsed.enteredBy ?? existingEntry.enteredBy,
    companyAlias: parsed.companyAlias === '' ? undefined : parsed.companyAlias ?? existingEntry.companyAlias,
    level1: parsed.level1 === '' ? undefined : parsed.level1 ?? existingEntry.level1,
    level2: parsed.level2 === '' ? undefined : parsed.level2 ?? existingEntry.level2,
    primaryState: parsed.primaryState === '' ? undefined : parsed.primaryState ?? existingEntry.primaryState,
    sourceSubmissionId:
      parsed.sourceSubmissionId === '' ? undefined : parsed.sourceSubmissionId ?? existingEntry.sourceSubmissionId,
    sourceSubmissionTimestamp:
      parsed.sourceSubmissionTimestamp === '' ? undefined : parsed.sourceSubmissionTimestamp ?? existingEntry.sourceSubmissionTimestamp,
    approvalStatus: nextApprovalStatus,
    approvalNotes: parsed.approvalNotes === '' ? undefined : parsed.approvalNotes ?? existingEntry.approvalNotes,
    approvedBy:
      nextApprovalStatus === 'approved'
        ? (parsed.approvedBy === '' ? undefined : parsed.approvedBy) || existingEntry.approvedBy || parsed.enteredBy || existingEntry.enteredBy
        : undefined,
    approvedAt,
    updatedAt,
  };
}

export function sortInternalObservations(entries) {
  return [...entries].sort((left, right) => {
    const leftDate = `${left.observedAt || ''}T00:00:00Z`;
    const rightDate = `${right.observedAt || ''}T00:00:00Z`;
    return rightDate.localeCompare(leftDate) || right.createdAt.localeCompare(left.createdAt);
  });
}
