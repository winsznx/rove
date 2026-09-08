import { Decimal } from 'decimal.js';

// Configure Decimal for deterministic financial precision
Decimal.set({
  precision: 36,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -18,
  toExpPos: 36,
});

export { Decimal };
export type DecimalInstance = Decimal;
export type DecimalValue = string | number | Decimal;

export function toDecimal(val: DecimalValue): Decimal {
  if (val instanceof Decimal) {
    return val;
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      throw new Error(`Cannot convert non-finite number to Decimal: ${val}`);
    }
    return new Decimal(val.toString());
  }
  const clean = val.trim();
  if (clean === '' || clean.toLowerCase() === 'nan') {
    throw new Error(`Invalid decimal string: "${val}"`);
  }
  return new Decimal(clean);
}

export function toDecimalOrNull(val: DecimalValue | null | undefined): Decimal | null {
  if (val === null || val === undefined) return null;
  try {
    return toDecimal(val);
  } catch {
    return null;
  }
}

export function formatDecimal(val: DecimalValue, decimalPlaces: number = 8): string {
  const d = toDecimal(val);
  return d.toFixed(decimalPlaces);
}

export function formatTrimmed(val: DecimalValue, maxDecimals: number = 8): string {
  const d = toDecimal(val);
  const fixed = d.toFixed(maxDecimals);
  // Strip trailing zeros after decimal point
  if (fixed.includes('.')) {
    const trimmed = fixed.replace(/\.?0+$/, '');
    return trimmed === '' ? '0' : trimmed;
  }
  return fixed;
}

/**
 * Calculates basis points difference: ((actual - reference) / reference) * 10,000
 */
export function calculateDeltaBps(actual: DecimalValue, reference: DecimalValue): string {
  const a = toDecimal(actual);
  const ref = toDecimal(reference);
  if (ref.isZero()) {
    throw new Error('Reference price cannot be zero when calculating delta bps');
  }
  const bps = a.minus(ref).dividedBy(ref).times(10000);
  return bps.toFixed(2);
}

/**
 * Calculates absolute cost in basis points: (cost / totalNotional) * 10,000
 */
export function calculateBps(cost: DecimalValue, totalNotional: DecimalValue): string {
  const c = toDecimal(cost);
  const notional = toDecimal(totalNotional);
  if (notional.isZero()) {
    return '0.00';
  }
  return c.dividedBy(notional).times(10000).toFixed(2);
}

export function addDecimals(a: DecimalValue, b: DecimalValue): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

export function subDecimals(a: DecimalValue, b: DecimalValue): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function mulDecimals(a: DecimalValue, b: DecimalValue): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

export function divDecimals(a: DecimalValue, b: DecimalValue): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) {
    throw new Error('Division by zero');
  }
  return toDecimal(a).dividedBy(divisor);
}

export function compareDecimals(a: DecimalValue, b: DecimalValue): number {
  return toDecimal(a).comparedTo(toDecimal(b));
}
