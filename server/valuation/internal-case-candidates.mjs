function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isTestLikeSubmission(submission) {
  const payload = submission?.payload || {};
  const meta = payload?.meta || {};
  const requestId = normalizeString(meta.requestId).toLowerCase();
  const engineVersion = normalizeString(meta.engineVersion).toLowerCase();
  const source = normalizeString(meta.source).toLowerCase();
  const email =
    normalizeString(payload?.company?.email) ||
    normalizeString(payload?.email);

  return (
    requestId.includes('fixture') ||
    requestId.includes('test') ||
    engineVersion.includes('fixture') ||
    email.endsWith('@example.com') ||
    source === 'api'
  );
}

function buildCandidateId(submission, policyGroupId) {
  const requestId =
    normalizeString(submission?.payload?.meta?.requestId) ||
    normalizeString(submission?.payload?.businessName) ||
    normalizeString(submission?.payload?.company?.businessName) ||
    submission?.timestamp;

  return `candidate_${slugify(policyGroupId)}_${slugify(requestId)}`;
}

function buildSuggestedAlias(businessName, policyGroupId) {
  const cleaned = normalizeString(businessName);
  if (!cleaned) {
    return `Internal ${policyGroupId.replace(/^PG_/, '').replace(/_/g, ' ')}`;
  }

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    return `${tokens[0].slice(0, 1).toUpperCase()}***`;
  }

  return `${tokens[0]} ${tokens.at(-1)?.slice(0, 1).toUpperCase()}***`;
}

function deriveCandidate(submission) {
  const payload = submission?.payload || {};
  const canonical = payload?.company && payload?.classification;
  const requestId = canonical ? payload.meta?.requestId : undefined;
  const businessName = canonical ? payload.company.businessName : payload.businessName;
  const email = canonical ? payload.company.email : payload.email;
  const policyGroupId = canonical ? payload.classification.policyGroupId : payload.result?.policyGroupId;
  const level1 = canonical ? payload.classification.level1 : payload.level1;
  const level2 = canonical ? payload.classification.level2 : payload.level2;
  const primaryState = canonical ? payload.company.primaryState : payload.primaryState;
  const purpose = canonical ? payload.engagement?.purpose : payload.transactionGoal;
  const urgency = canonical ? payload.engagement?.urgency : payload.transactionTimeline;
  const firstName = canonical ? payload.company.firstName : payload.firstName;
  const yearsAvailable = canonical ? payload.financials?.sourceQuality?.yearsAvailable : undefined;

  if (!policyGroupId || !businessName || !email) {
    return null;
  }

  const timestamp = submission.timestamp || new Date().toISOString();

  return {
    id: buildCandidateId(submission, policyGroupId),
    sourceSubmissionTimestamp: timestamp,
    sourceSubmissionId: requestId || slugify(`${businessName}-${timestamp}`),
    businessName,
    suggestedCompanyAlias: buildSuggestedAlias(businessName, policyGroupId),
    firstName: firstName || 'Business Owner',
    email,
    policyGroupId,
    level1: level1 || '',
    level2: level2 || '',
    primaryState: primaryState || '',
    suggestedCaseType: canonical ? 'valuation_review' : 'market_scan',
    suggestedTransactionContext: purpose === 'sale' || purpose === 'external_sale' ? 'full_sale' : purpose === 'fundraise' ? 'fundraise' : 'internal_planning',
    suggestedCaseStage: urgency === 'accelerated' ? 'analysis' : 'intake',
    candidateNotes: [
      'Built from a saved valuation submission and requires manual validation before capture.',
      yearsAvailable ? `${yearsAvailable} year(s) of financial history were present in the saved submission.` : 'Historical depth could not be derived automatically.',
      'Do not approve or ingest until the observation metric, basis, and numeric value are verified from a real Afrexit review or mandate note.',
    ],
  };
}

export function buildInternalCaseCandidates(submissions) {
  const seen = new Set();

  return submissions
    .filter((submission) => !isTestLikeSubmission(submission))
    .map(deriveCandidate)
    .filter(Boolean)
    .filter((candidate) => {
      if (seen.has(candidate.id)) {
        return false;
      }

      seen.add(candidate.id);
      return true;
    })
    .sort((left, right) => right.sourceSubmissionTimestamp.localeCompare(left.sourceSubmissionTimestamp));
}
