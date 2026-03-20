export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function average(values, fallback = 50) {
  const valid = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (!valid.length) return fallback;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function safeDivide(numerator, denominator, fallback = 0) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }

  return numerator / denominator;
}

export function roundIfNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : undefined;
}

export function standardDeviation(values) {
  const valid = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (valid.length < 2) return 0;

  const mean = average(valid, 0);
  const variance = average(valid.map((value) => (value - mean) ** 2), 0);
  return Math.sqrt(variance);
}
