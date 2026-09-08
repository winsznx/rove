import { describe, it, expect } from 'vitest';
import {
  toDecimal,
  calculateDeltaBps,
  calculateBps,
  addDecimals,
  subDecimals,
  mulDecimals,
  divDecimals,
  formatDecimal,
} from '../src/decimal/index.js';

describe('Decimal Arithmetic Module', () => {
  it('converts safe strings and numbers to Decimal', () => {
    expect(toDecimal('100.5').toString()).toBe('100.5');
    expect(toDecimal(42).toString()).toBe('42');
    expect(() => toDecimal('not_a_number')).toThrow();
    expect(() => toDecimal('')).toThrow();
  });

  it('performs exact addition and subtraction without JS float drift', () => {
    // Standard JS float error: 0.1 + 0.2 = 0.30000000000000004
    const sum = addDecimals('0.1', '0.2');
    expect(sum.toString()).toBe('0.3');

    const diff = subDecimals('1.0', '0.9');
    expect(diff.toString()).toBe('0.1');
  });

  it('calculates basis point delta correctly', () => {
    // 101 vs 100 is +1% = 100 bps
    expect(calculateDeltaBps('101', '100')).toBe('100.00');

    // 100.08 vs 100 is 8 bps
    expect(calculateDeltaBps('100.08', '100')).toBe('8.00');

    // Reference zero throws
    expect(() => calculateDeltaBps('100', '0')).toThrow();
  });

  it('calculates basis points of cost over notional', () => {
    // $1 fee on $1000 notional = 10 bps
    expect(calculateBps('1.00', '1000.00')).toBe('10.00');

    // $0 fee = 0 bps
    expect(calculateBps('0', '1000')).toBe('0.00');
  });

  it('formats decimals deterministically', () => {
    expect(formatDecimal('123.456', 2)).toBe('123.46');
    expect(formatDecimal('123.456', 8)).toBe('123.45600000');
  });
});
