import { Decimal } from 'decimal.js';
export { Decimal };
export type DecimalInstance = Decimal;
export type DecimalValue = string | number | Decimal;
export declare function toDecimal(val: DecimalValue): Decimal;
export declare function toDecimalOrNull(val: DecimalValue | null | undefined): Decimal | null;
export declare function formatDecimal(val: DecimalValue, decimalPlaces?: number): string;
export declare function formatTrimmed(val: DecimalValue, maxDecimals?: number): string;
/**
 * Calculates basis points difference: ((actual - reference) / reference) * 10,000
 */
export declare function calculateDeltaBps(actual: DecimalValue, reference: DecimalValue): string;
/**
 * Calculates absolute cost in basis points: (cost / totalNotional) * 10,000
 */
export declare function calculateBps(cost: DecimalValue, totalNotional: DecimalValue): string;
export declare function addDecimals(a: DecimalValue, b: DecimalValue): Decimal;
export declare function subDecimals(a: DecimalValue, b: DecimalValue): Decimal;
export declare function mulDecimals(a: DecimalValue, b: DecimalValue): Decimal;
export declare function divDecimals(a: DecimalValue, b: DecimalValue): Decimal;
export declare function compareDecimals(a: DecimalValue, b: DecimalValue): number;
//# sourceMappingURL=index.d.ts.map