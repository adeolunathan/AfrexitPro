function hasText(value) {
  return String(value ?? '').trim() !== '';
}

function toNumber(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parsePathSegments(path) {
  const segments = [];

  for (const part of String(path || '').split('.').filter(Boolean)) {
    const matches = part.matchAll(/([^[\]]+)|\[(\d+)\]/g);
    for (const match of matches) {
      if (match[1]) {
        segments.push(match[1]);
      } else if (match[2]) {
        segments.push(Number(match[2]));
      }
    }
  }

  return segments;
}

export function getByPath(target, path) {
  return parsePathSegments(path).reduce((current, segment) => current?.[segment], target);
}

export function setByPath(target, path, value) {
  const segments = parsePathSegments(path);
  if (!segments.length) {
    return;
  }

  let current = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];

    if (current[segment] === undefined || current[segment] === null || typeof current[segment] !== 'object') {
      current[segment] = typeof nextSegment === 'number' ? [] : {};
    }

    current = current[segment];
  }

  current[segments[segments.length - 1]] = value;
}

function normalizeGrowthOutlook(value) {
  switch (String(value ?? '').trim()) {
    case 'current_market':
    case 'new_markets':
      return 'strong_growth';
    case 'limited':
      return 'stable';
    case 'uncertain':
      return 'not_sure';
    case 'strong_growth':
    case 'moderate_growth':
    case 'stable':
    case 'decline':
    case 'not_sure':
      return String(value);
    default:
      return 'not_sure';
  }
}

function normalizeFounderDependence(value) {
  switch (String(value ?? '').trim()) {
    case 'brand_not_personal':
      return 'very_little';
    case 'knows_not_expected':
      return 'some';
    case 'expects_involvement':
      return 'large_share';
    case 'buying_owner':
      return 'most';
    case 'very_little':
    case 'some':
    case 'large_share':
    case 'most':
      return String(value);
    default:
      return 'some';
  }
}

function mapPurposeToTransactionGoal(engagement) {
  if (engagement?.targetTransaction === 'partial_sale') return 'partial_sale';
  if (engagement?.targetTransaction === 'minority_raise') return 'investor_entry';
  if (engagement?.purpose === 'succession') return 'internal_handover';
  if (engagement?.purpose === 'internal_planning') return 'value_improvement';
  return 'external_sale';
}

function mapUrgencyToTransactionTimeline(urgency) {
  if (urgency === 'forced') return 'within_6m';
  if (urgency === 'accelerated') return '6_12m';
  return '12_24m';
}

function mapPurpose(transactionGoal) {
  switch (transactionGoal) {
    case 'external_sale':
    case 'partial_sale':
      return 'sale';
    case 'investor_entry':
      return 'fundraise';
    case 'internal_handover':
      return 'succession';
    case 'value_improvement':
    default:
      return 'internal_planning';
  }
}

function mapUrgency(transactionTimeline, transactionGoal) {
  if (transactionTimeline === 'within_6m') {
    return transactionGoal === 'external_sale' || transactionGoal === 'partial_sale' ? 'forced' : 'accelerated';
  }

  if (transactionTimeline === '6_12m') {
    return 'accelerated';
  }

  return 'orderly';
}

function mapTargetTransaction(transactionGoal) {
  switch (transactionGoal) {
    case 'external_sale':
      return 'full_sale';
    case 'partial_sale':
      return 'partial_sale';
    case 'investor_entry':
      return 'minority_raise';
    default:
      return 'not_sure';
  }
}

function mapStandardOfValue(purpose, transactionGoal) {
  if (purpose === 'fundraise') return 'investment_value';
  if (transactionGoal === 'partial_sale') return 'investment_value';
  return 'fair_market_value';
}

function mapPremiseOfValue(urgency) {
  if (urgency === 'forced') return 'forced_liquidation';
  if (urgency === 'accelerated') return 'orderly_liquidation';
  return 'going_concern';
}

function scoreLargestSupplierShare(value) {
  switch (String(value ?? '').trim()) {
    case 'lt_20':
      return 85;
    case '20_35':
      return 65;
    case '35_60':
      return 40;
    case 'gt_60':
      return 20;
    default:
      return undefined;
  }
}

function scoreSupplierReplacementTime(value) {
  switch (String(value ?? '').trim()) {
    case 'lt_2w':
      return 85;
    case '2_8w':
      return 65;
    case '2_6m':
      return 40;
    case 'gt_6m':
      return 20;
    default:
      return undefined;
  }
}

function normalizeSupplierTransferability(value) {
  switch (String(value ?? '').trim()) {
    case 'no_dependency':
    case 'replaceable_weeks':
      return 'very_easy';
    case 'replaceable_year':
      return 'uncertain';
    case 'difficult_replace':
      return 'very_difficult';
    case 'very_easy':
    case 'manageable':
    case 'uncertain':
    case 'very_difficult':
      return String(value);
    default:
      return 'manageable';
  }
}

function deriveSupplierTransferability(largestSupplierShare, supplierReplacementTime, fallbackValue) {
  const shareScore = scoreLargestSupplierShare(largestSupplierShare);
  const replacementScore = scoreSupplierReplacementTime(supplierReplacementTime);
  if (typeof shareScore !== 'number' && typeof replacementScore !== 'number') {
    return normalizeSupplierTransferability(fallbackValue);
  }

  const compositeScore =
    typeof shareScore === 'number' && typeof replacementScore === 'number'
      ? (shareScore + replacementScore) / 2
      : shareScore ?? replacementScore ?? 50;

  if (compositeScore >= 76) return 'very_easy';
  if (compositeScore >= 56) return 'manageable';
  if (compositeScore >= 36) return 'uncertain';
  return 'very_difficult';
}

function mapSupplierTransferabilityToLargestSupplierShare(value) {
  switch (String(value ?? '').trim()) {
    case 'very_easy':
      return 'lt_20';
    case 'manageable':
      return '20_35';
    case 'uncertain':
      return '35_60';
    case 'very_difficult':
      return 'gt_60';
    default:
      return '';
  }
}

function mapSupplierTransferabilityToReplacementTime(value) {
  switch (String(value ?? '').trim()) {
    case 'very_easy':
      return 'lt_2w';
    case 'manageable':
      return '2_8w';
    case 'uncertain':
      return '2_6m';
    case 'very_difficult':
      return 'gt_6m';
    default:
      return '';
  }
}

function scoreCriticalHireTime(value) {
  switch (String(value ?? '').trim()) {
    case 'lt_30d':
      return 82;
    case '1_3m':
      return 65;
    case '3_6m':
      return 40;
    case 'gt_6m':
      return 20;
    default:
      return undefined;
  }
}

function scoreCriticalHireSalaryPremium(value) {
  switch (String(value ?? '').trim()) {
    case 'none':
      return 82;
    case 'up_to_10':
      return 68;
    case '10_25':
      return 45;
    case 'gt_25':
      return 25;
    default:
      return undefined;
  }
}

function normalizeHiringDifficulty(value) {
  switch (String(value ?? '').trim()) {
    case 'no_shortage':
      return 'easy';
    case 'competition':
      return 'feasible';
    case 'severe_shortage':
      return 'severe';
    case 'easy':
    case 'feasible':
    case 'difficult':
    case 'severe':
      return String(value);
    default:
      return 'feasible';
  }
}

function deriveHiringDifficulty(criticalHireTime, criticalHireSalaryPremium, fallbackValue) {
  const hireTimeScore = scoreCriticalHireTime(criticalHireTime);
  const salaryPremiumScore = scoreCriticalHireSalaryPremium(criticalHireSalaryPremium);
  if (typeof hireTimeScore !== 'number' && typeof salaryPremiumScore !== 'number') {
    return normalizeHiringDifficulty(fallbackValue);
  }

  const compositeScore =
    typeof hireTimeScore === 'number' && typeof salaryPremiumScore === 'number'
      ? (hireTimeScore + salaryPremiumScore) / 2
      : hireTimeScore ?? salaryPremiumScore ?? 50;

  if (compositeScore >= 74) return 'easy';
  if (compositeScore >= 56) return 'feasible';
  if (compositeScore >= 36) return 'difficult';
  return 'severe';
}

function mapHiringDifficultyToHireTime(value) {
  switch (String(value ?? '').trim()) {
    case 'easy':
      return 'lt_30d';
    case 'feasible':
      return '1_3m';
    case 'difficult':
      return '3_6m';
    case 'severe':
      return 'gt_6m';
    default:
      return '';
  }
}

function mapHiringDifficultyToSalaryPremium(value) {
  switch (String(value ?? '').trim()) {
    case 'easy':
      return 'none';
    case 'feasible':
      return 'up_to_10';
    case 'difficult':
      return '10_25';
    case 'severe':
      return 'gt_25';
    default:
      return '';
  }
}

function createNormalizationLineItem(id, category, label, adjustmentAmount, direction, affects, notes, options = {}) {
  return {
    id,
    category,
    label,
    periodId: 'latest_owner_input',
    reportedAmount: options.reportedAmount,
    normalizedAmount: options.normalizedAmount,
    adjustmentAmount,
    direction,
    recurrence: options.recurrence || 'recurring',
    confidence: 'low',
    evidenceLevel: 'owner_statement',
    affects,
    notes,
  };
}

function buildNormalizationSchedule(values) {
  const schedule = [];
  const ownerTotalComp = toNumber(values.ownerTotalCompensation);
  const marketManagerComp = toNumber(values.marketManagerCompensation);
  const rentActual = toNumber(values.relatedPartyRentPaid);
  const rentMarket = toNumber(values.marketRentEquivalent);
  const relatedPartyCompActual = toNumber(values.relatedPartyCompPaid);
  const relatedPartyCompMarket = toNumber(values.marketRelatedPartyCompEquivalent);
  const privateExpensesAmount = toNumber(values.privateExpensesAmount);
  const oneOffExpenseAmount = toNumber(values.oneOffExpenseAmount);
  const oneOffIncomeAmount = toNumber(values.oneOffIncomeAmount);
  const nonCoreIncomeAmount = toNumber(values.nonCoreIncomeAmount);

  if (ownerTotalComp > 0) {
    schedule.push(
      createNormalizationLineItem(
        'owner-comp-total',
        'owner_comp',
        'Owner total compensation added back for SDE view',
        ownerTotalComp,
        'add_back',
        'sde',
        'Owner-provided estimate of total annual compensation taken from the business.',
        { recurrence: 'recurring', reportedAmount: ownerTotalComp, normalizedAmount: 0 }
      )
    );
  }

  if (ownerTotalComp !== marketManagerComp) {
    const delta = Math.abs(ownerTotalComp - marketManagerComp);
    const direction = ownerTotalComp > marketManagerComp ? 'add_back' : 'remove';
    schedule.push(
      createNormalizationLineItem(
        'owner-comp-market-delta',
        'owner_comp',
        'Owner compensation normalized to market replacement cost',
        delta,
        direction,
        'ebitda',
        'Difference between owner take-home and estimated market replacement cost.',
        { recurrence: 'recurring', reportedAmount: ownerTotalComp, normalizedAmount: marketManagerComp }
      )
    );
  }

  if (rentActual !== rentMarket) {
    const delta = Math.abs(rentActual - rentMarket);
    const direction = rentActual > rentMarket ? 'add_back' : 'remove';
    schedule.push(
      createNormalizationLineItem(
        'related-party-rent-delta',
        'related_party_rent',
        'Related-party or non-market rent normalization',
        delta,
        direction,
        'ebitda',
        'Difference between actual rent paid and estimated market-equivalent rent.',
        { recurrence: 'recurring', reportedAmount: rentActual, normalizedAmount: rentMarket }
      )
    );
  }

  if (relatedPartyCompActual !== relatedPartyCompMarket) {
    const delta = Math.abs(relatedPartyCompActual - relatedPartyCompMarket);
    const direction = relatedPartyCompActual > relatedPartyCompMarket ? 'add_back' : 'remove';
    schedule.push(
      createNormalizationLineItem(
        'related-party-pay-delta',
        'family_payroll',
        'Related-party compensation normalization',
        delta,
        direction,
        'ebitda',
        'Difference between related-party pay and estimated market-equivalent cost.',
        { recurrence: 'recurring', reportedAmount: relatedPartyCompActual, normalizedAmount: relatedPartyCompMarket }
      )
    );
  }

  if (privateExpensesAmount > 0) {
    schedule.push(
      createNormalizationLineItem(
        'private-expenses',
        'personal_expense',
        'Personal or private expenses through the business',
        privateExpensesAmount,
        'add_back',
        'ebitda',
        'Owner estimate of non-business expenses included in reported profit.',
        { recurrence: 'recurring', reportedAmount: privateExpensesAmount }
      )
    );
  }

  if (oneOffExpenseAmount > 0) {
    schedule.push(
      createNormalizationLineItem(
        'one-off-expenses',
        'one_off_expense',
        'One-off expenses removed from maintainable earnings',
        oneOffExpenseAmount,
        'add_back',
        'ebitda',
        'Owner estimate of unusual or non-recurring expenses.',
        { recurrence: 'non_recurring', reportedAmount: oneOffExpenseAmount }
      )
    );
  }

  if (oneOffIncomeAmount > 0) {
    schedule.push(
      createNormalizationLineItem(
        'one-off-income',
        'one_off_income',
        'One-off income removed from maintainable earnings',
        oneOffIncomeAmount,
        'remove',
        'ebitda',
        'Owner estimate of unusual or non-recurring income.',
        { recurrence: 'non_recurring', reportedAmount: oneOffIncomeAmount }
      )
    );
  }

  if (nonCoreIncomeAmount > 0) {
    schedule.push(
      createNormalizationLineItem(
        'non-core-income',
        'non_operating_income',
        'Income not related to the core operating business',
        nonCoreIncomeAmount,
        'remove',
        'ebit',
        'Owner estimate of non-core or non-operating income embedded in profit.',
        { recurrence: 'partly_recurring', reportedAmount: nonCoreIncomeAmount }
      )
    );
  }

  return schedule;
}

function getNormalizationItem(schedule, predicate) {
  return (schedule || []).find(predicate);
}

function getNormalizationAmount(item, key) {
  const value = item?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof item?.adjustmentAmount === 'number' && Number.isFinite(item.adjustmentAmount) && key === 'reportedAmount') {
    return item.adjustmentAmount;
  }

  return 0;
}

function extractNormalizationInputs(request) {
  const schedule = request.normalization?.schedule || [];
  const ownerCompTotal =
    getNormalizationItem(schedule, (item) => item.id === 'owner-comp-total') ||
    getNormalizationItem(schedule, (item) => item.id === 'owner-comp-market-delta');
  const ownerCompMarket = getNormalizationItem(schedule, (item) => item.id === 'owner-comp-market-delta');
  const relatedPartyRent = getNormalizationItem(schedule, (item) => item.id === 'related-party-rent-delta');
  const relatedPartyComp = getNormalizationItem(schedule, (item) => item.id === 'related-party-pay-delta');
  const privateExpenses = getNormalizationItem(schedule, (item) => item.id === 'private-expenses');
  const oneOffExpense = getNormalizationItem(schedule, (item) => item.id === 'one-off-expenses');
  const oneOffIncome = getNormalizationItem(schedule, (item) => item.id === 'one-off-income');
  const nonCoreIncome = getNormalizationItem(schedule, (item) => item.id === 'non-core-income');

  return {
    ownerTotalCompensation: getNormalizationAmount(ownerCompTotal, 'reportedAmount'),
    marketManagerCompensation: getNormalizationAmount(ownerCompMarket, 'normalizedAmount'),
    relatedPartyRentPaid: getNormalizationAmount(relatedPartyRent, 'reportedAmount'),
    marketRentEquivalent: getNormalizationAmount(relatedPartyRent, 'normalizedAmount'),
    relatedPartyCompPaid: getNormalizationAmount(relatedPartyComp, 'reportedAmount'),
    marketRelatedPartyCompEquivalent: getNormalizationAmount(relatedPartyComp, 'normalizedAmount'),
    privateExpensesAmount: getNormalizationAmount(privateExpenses, 'reportedAmount'),
    oneOffExpenseAmount: getNormalizationAmount(oneOffExpense, 'reportedAmount'),
    oneOffIncomeAmount: getNormalizationAmount(oneOffIncome, 'reportedAmount'),
    nonCoreIncomeAmount: getNormalizationAmount(nonCoreIncome, 'reportedAmount'),
  };
}

function applyNormalizationMutation(request, questionId, value) {
  const nextValues = extractNormalizationInputs(request);
  nextValues[questionId] = toNumber(value);
  request.normalization.schedule = buildNormalizationSchedule(nextValues);
}

export function applyQuestionValueMutation(request, { questionId, canonicalPath, value }) {
  switch (questionId) {
    case 'transactionGoal': {
      const nextPurpose = mapPurpose(value);
      const currentTimeline = mapUrgencyToTransactionTimeline(request.engagement?.urgency);
      const nextUrgency = mapUrgency(currentTimeline, value);
      request.engagement.purpose = nextPurpose;
      request.engagement.urgency = nextUrgency;
      request.engagement.targetTransaction = mapTargetTransaction(value);
      request.engagement.standardOfValue = mapStandardOfValue(nextPurpose, value);
      request.engagement.premiseOfValue = mapPremiseOfValue(nextUrgency);
      return request;
    }
    case 'transactionTimeline': {
      const currentGoal = mapPurposeToTransactionGoal(request.engagement || {});
      const nextUrgency = mapUrgency(value, currentGoal);
      request.engagement.urgency = nextUrgency;
      request.engagement.premiseOfValue = mapPremiseOfValue(nextUrgency);
      return request;
    }
    case 'growthPotential':
      setByPath(request, 'operatingProfile.growthOutlook', normalizeGrowthOutlook(value));
      return request;
    case 'ownerCustomerRelationship':
      setByPath(request, 'operatingProfile.founderRevenueDependence', normalizeFounderDependence(value));
      return request;
    case 'largestSupplierShare': {
      const currentReplacementTime =
        request.operatingProfile?.supplierReplacementTime ||
        mapSupplierTransferabilityToReplacementTime(request.operatingProfile?.supplierTransferability);
      request.operatingProfile.largestSupplierShare = String(value || '');
      request.operatingProfile.supplierReplacementTime = currentReplacementTime;
      request.operatingProfile.supplierTransferability = deriveSupplierTransferability(
        value,
        currentReplacementTime,
        request.operatingProfile?.supplierTransferability
      );
      return request;
    }
    case 'supplierReplacementTime': {
      const currentLargestShare =
        request.operatingProfile?.largestSupplierShare ||
        mapSupplierTransferabilityToLargestSupplierShare(request.operatingProfile?.supplierTransferability);
      request.operatingProfile.largestSupplierShare = currentLargestShare;
      request.operatingProfile.supplierReplacementTime = String(value || '');
      request.operatingProfile.supplierTransferability = deriveSupplierTransferability(
        currentLargestShare,
        value,
        request.operatingProfile?.supplierTransferability
      );
      return request;
    }
    case 'criticalHireTime': {
      const currentSalaryPremium =
        request.operatingProfile?.criticalHireSalaryPremium ||
        mapHiringDifficultyToSalaryPremium(request.operatingProfile?.hiringDifficulty);
      request.operatingProfile.criticalHireTime = String(value || '');
      request.operatingProfile.criticalHireSalaryPremium = currentSalaryPremium;
      request.operatingProfile.hiringDifficulty = deriveHiringDifficulty(
        value,
        currentSalaryPremium,
        request.operatingProfile?.hiringDifficulty
      );
      return request;
    }
    case 'criticalHireSalaryPremium': {
      const currentHireTime =
        request.operatingProfile?.criticalHireTime ||
        mapHiringDifficultyToHireTime(request.operatingProfile?.hiringDifficulty);
      request.operatingProfile.criticalHireTime = currentHireTime;
      request.operatingProfile.criticalHireSalaryPremium = String(value || '');
      request.operatingProfile.hiringDifficulty = deriveHiringDifficulty(
        currentHireTime,
        value,
        request.operatingProfile?.hiringDifficulty
      );
      return request;
    }
    case 'ownerTotalCompensation':
    case 'marketManagerCompensation':
    case 'relatedPartyRentPaid':
    case 'marketRentEquivalent':
    case 'relatedPartyCompPaid':
    case 'marketRelatedPartyCompEquivalent':
    case 'privateExpensesAmount':
    case 'oneOffExpenseAmount':
    case 'oneOffIncomeAmount':
    case 'nonCoreIncomeAmount':
      applyNormalizationMutation(request, questionId, value);
      return request;
    default:
      setByPath(request, canonicalPath, value);
      return request;
  }
}
