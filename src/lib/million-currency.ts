export function sanitizeMillionInput(value: string, allowNegative = false): string {
  const trimmed = value.replace(/[₦,\smM]/g, '');
  if (!trimmed) return '';

  const negative = allowNegative && trimmed.startsWith('-');
  const unsigned = trimmed.replace(/-/g, '').replace(/[^0-9.]/g, '');
  const [wholePart = '', ...decimalParts] = unsigned.split('.');
  const decimalPart = decimalParts.join('').slice(0, 2);
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, '');

  if (!normalizedWhole && !decimalPart) return negative ? '-' : '';
  return `${negative ? '-' : ''}${normalizedWhole || '0'}${decimalPart ? `.${decimalPart}` : ''}`;
}

export function serializeMillions(value: string, allowNegative = false): string {
  const normalized = sanitizeMillionInput(value, allowNegative);
  return normalized === '-' ? '' : normalized;
}

export function normalizeMillions(value: unknown): string {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return '';
  return parsed.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

export function formatMillions(value: string | number, allowNegative = false): string {
  const parsed = Number(normalizeMillions(value));
  if (!Number.isFinite(parsed)) return '';
  if (parsed < 0 && !allowNegative) return '';

  return parsed.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatMillionsCurrency(value: string | number, allowNegative = false): string {
  const formatted = formatMillions(value, allowNegative);
  return `₦${formatted || '0'}m`;
}
