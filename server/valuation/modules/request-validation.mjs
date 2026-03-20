function requireString(value, fieldName) {
  if (!String(value ?? '').trim()) {
    throw new Error(`Missing required field: ${fieldName}`);
  }
}

export function isCanonicalRequest(input) {
  return Boolean(
    input &&
      typeof input === 'object' &&
      input.meta &&
      input.engagement &&
      input.company &&
      input.classification &&
      input.financials &&
      input.normalization &&
      input.bridge
  );
}

export function validateCanonicalRequest(request) {
  requireString(request.company?.firstName, 'company.firstName');
  requireString(request.company?.businessName, 'company.businessName');
  requireString(request.company?.email, 'company.email');
  requireString(request.company?.whatsapp, 'company.whatsapp');
  requireString(request.classification?.level1, 'classification.level1');
  requireString(request.classification?.level2, 'classification.level2');

  const historicals = request.financials?.historicals || [];
  if (!historicals.length) {
    throw new Error('At least one historical financial period is required.');
  }

  const firstPeriod = historicals[0];
  if ((firstPeriod?.revenue || 0) <= 0 && (firstPeriod?.operatingProfit || firstPeriod?.ebit || 0) <= 0) {
    throw new Error('Revenue or operating profit must be greater than zero.');
  }
}
