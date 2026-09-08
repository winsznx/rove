import { ExecutionIntent } from '../intent/index.js';
import { ObservedExecutionCost, EstimatedCarry } from '../cost/index.js';
export declare const REJECTION_CODES: readonly ["RETAIN_UNDERLYING_CONFLICT", "INSUFFICIENT_BALANCE", "INSUFFICIENT_COLLATERAL", "PERMISSION_MISSING", "PRODUCT_UNAVAILABLE", "SYMBOL_UNSUPPORTED", "LEVERAGE_LIMIT", "EXECUTION_COST_LIMIT", "CARRY_LIMIT", "QUOTE_EXPIRED", "SNAPSHOT_STALE", "SNAPSHOT_SKEW", "COST_COMPONENT_UNAVAILABLE", "POSITION_STATE_UNAVAILABLE", "INTENT_INCOMPLETE", "MARKET_UNAVAILABLE", "SIZE_BELOW_MINIMUM", "SIZE_ABOVE_LIMIT", "INSUFFICIENT_VISIBLE_DEPTH", "ACCOUNT_STATE_UNAVAILABLE", "EXECUTION_STATE_UNKNOWN", "ORDER_VALIDATION_FAILED", "ROUTE_SEMANTICS_MISMATCH"];
export type RejectionCode = (typeof REJECTION_CODES)[number];
export type ConstraintState = 'PASS' | 'FAIL' | 'NA' | 'UNKNOWN';
export type ConstraintResult = {
    key: string;
    state: ConstraintState;
    reason?: string;
    observedValue?: string;
    limitValue?: string;
};
export type Rejection = {
    code: RejectionCode;
    message: string;
    evidence?: Record<string, string>;
};
export type PathEvaluationContext = {
    kind: 'spot' | 'convert' | 'usd_m_perp' | 'margin' | 'coin_m_perp';
    side: 'buy' | 'sell';
    disposesUnderlying: boolean;
    requiredLeverage?: string;
    execution?: ObservedExecutionCost;
    carry?: EstimatedCarry;
    hasPermission: boolean;
    isProductAvailable: boolean;
    validUntilTimestamp?: number;
    sufficientDepth?: boolean;
    currentTimeMs: number;
};
/**
 * Deterministically evaluates all constraints for a candidate route against an ExecutionIntent.
 */
export declare function evaluateRouteConstraints(intent: ExecutionIntent, ctx: PathEvaluationContext): {
    constraints: ConstraintResult[];
    rejection?: Rejection;
    isValid: boolean;
};
//# sourceMappingURL=index.d.ts.map