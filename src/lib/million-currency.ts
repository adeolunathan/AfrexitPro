export function sanitizeMillionInput(value: string, allowNegative = false): string {
  const trimmed = value.replace(/[₦,\smM]/g, '');
  if (!trimmed) return '';

  const negative = allowNegative && trimmed.startsWith('-');
  const unsigned = trimmed.replace(/-/g, '').replace(/[^0-9.]/g, '');
  const [wholePart = '', ...decimalParts] = unsigned.split('.');
  const decimalPart = decimalParts.join('').slice(0, 2);
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, '');
  const hasTrailingDecimal = unsigned.endsWith('.') && decimalPart === '';

  if (!normalizedWhole && !decimalPart && !hasTrailingDecimal) return negative ? '-' : '';
  return `${negative ? '-' : ''}${normalizedWhole || '0'}${decimalPart ? `.${decimalPart}` : hasTrailingDecimal ? '.' : ''}`;
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

export function hasMillionValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  return sanitizeMillionInput(String(value), true) !== '';
}

export function formatMillionsCurrency(value: string | number, allowNegative = false): string {
  const formatted = formatMillions(value, allowNegative);
  if (!formatted) return '';
  if (formatted.startsWith('-')) {
    return `-₦${formatted.slice(1)}m`;
  }
  return `₦${formatted}m`;
}

export function formatMillionsDisplay(
  value: string | number | null | undefined,
  options?: {
    allowNegative?: boolean;
    emptyDisplay?: string;
  }
): string {
  const allowNegative = options?.allowNegative ?? false;
  const emptyDisplay = options?.emptyDisplay ?? '0';

  if (!hasMillionValue(value)) {
    return emptyDisplay;
  }

  const formatted = formatMillionsCurrency(String(value), allowNegative);
  return formatted || emptyDisplay;
}

export function parseMillionsNumber(
  value: unknown,
  options?: {
    allowNegative?: boolean;
  }
): number | null {
  const normalized = serializeMillions(String(value ?? ''), options?.allowNegative ?? false);
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
