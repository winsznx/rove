import { toDecimal } from '../decimal/index.js';
export const REJECTION_CODES = [
    'RETAIN_UNDERLYING_CONFLICT',
    'INSUFFICIENT_BALANCE',
    'INSUFFICIENT_COLLATERAL',
    'PERMISSION_MISSING',
    'PRODUCT_UNAVAILABLE',
    'SYMBOL_UNSUPPORTED',
    'LEVERAGE_LIMIT',
    'EXECUTION_COST_LIMIT',
    'CARRY_LIMIT',
    'QUOTE_EXPIRED',
    'SNAPSHOT_STALE',
    'SNAPSHOT_SKEW',
    'COST_COMPONENT_UNAVAILABLE',
    'POSITION_STATE_UNAVAILABLE',
    'INTENT_INCOMPLETE',
    'MARKET_UNAVAILABLE',
    'SIZE_BELOW_MINIMUM',
    'SIZE_ABOVE_LIMIT',
    'INSUFFICIENT_VISIBLE_DEPTH',
    'ACCOUNT_STATE_UNAVAILABLE',
    'EXECUTION_STATE_UNKNOWN',
    'ORDER_VALIDATION_FAILED',
    'ROUTE_SEMANTICS_MISMATCH',
];
/**
 * Deterministically evaluates all constraints for a candidate route against an ExecutionIntent.
 */
export function evaluateRouteConstraints(intent, ctx) {
    const constraints = [];
    let primaryRejection;
    // 1. Product availability check
    if (!ctx.isProductAvailable) {
        const c = {
            key: 'product_available',
            state: 'FAIL',
            reason: `Product ${ctx.kind} is not available on this account or feature-gated`,
        };
        constraints.push(c);
        if (!primaryRejection) {
            primaryRejection = {
                code: 'PRODUCT_UNAVAILABLE',
                message: `${ctx.kind.toUpperCase()} is currently unavailable or disabled by account policy`,
                evidence: { product: ctx.kind },
            };
        }
    }
    else {
        constraints.push({ key: 'product_available', state: 'PASS' });
    }
    // 2. Permission check
    if (!ctx.hasPermission) {
        const c = {
            key: 'trade_permission',
            state: 'FAIL',
            reason: `Account lacks trading scope for ${ctx.kind}`,
        };
        constraints.push(c);
        if (!primaryRejection) {
            primaryRejection = {
                code: 'PERMISSION_MISSING',
                message: `Trading permission for ${ctx.kind} is missing on this sub-account`,
                evidence: { product: ctx.kind },
            };
        }
    }
    else {
        constraints.push({ key: 'trade_permission', state: 'PASS' });
    }
    // 3. Retain Underlying Constraint (US-02 core invariant)
    if (intent.must_retain_underlying) {
        if (ctx.disposesUnderlying) {
            const c = {
                key: 'retain_underlying',
                state: 'FAIL',
                reason: `Route requires disposing/selling ${intent.asset}, violating retain-underlying constraint`,
            };
            constraints.push(c);
            if (!primaryRejection) {
                primaryRejection = {
                    code: 'RETAIN_UNDERLYING_CONFLICT',
                    message: `Rejected because this path requires selling the ${intent.asset} you explicitly asked to retain`,
                    evidence: {
                        asset: intent.asset,
                        routeKind: ctx.kind,
                        disposesUnderlying: 'true',
                    },
                };
            }
        }
        else {
            constraints.push({ key: 'retain_underlying', state: 'PASS' });
        }
    }
    else {
        constraints.push({ key: 'retain_underlying', state: 'NA' });
    }
    // 4. Order Book Depth / Liquidity
    if (ctx.sufficientDepth !== undefined) {
        if (!ctx.sufficientDepth) {
            const c = {
                key: 'visible_depth',
                state: 'FAIL',
                reason: 'Insufficient visible order book depth to execute requested size',
            };
            constraints.push(c);
            if (!primaryRejection) {
                primaryRejection = {
                    code: 'INSUFFICIENT_VISIBLE_DEPTH',
                    message: 'Visible order-book liquidity is insufficient to fill the requested size without market impact beyond book depth',
                };
            }
        }
        else {
            constraints.push({ key: 'visible_depth', state: 'PASS' });
        }
    }
    // 5. Quote Expiry (for Convert)
    if (ctx.validUntilTimestamp !== undefined) {
        const isExpired = ctx.currentTimeMs >= ctx.validUntilTimestamp;
        if (isExpired) {
            const c = {
                key: 'quote_freshness',
                state: 'FAIL',
                reason: `Quote expired at ${ctx.validUntilTimestamp} (current: ${ctx.currentTimeMs})`,
                observedValue: `${ctx.currentTimeMs}`,
                limitValue: `${ctx.validUntilTimestamp}`,
            };
            constraints.push(c);
            if (!primaryRejection) {
                primaryRejection = {
                    code: 'QUOTE_EXPIRED',
                    message: 'The execution quote has expired and must be refreshed',
                    evidence: {
                        validUntil: String(ctx.validUntilTimestamp),
                        currentTime: String(ctx.currentTimeMs),
                    },
                };
            }
        }
        else {
            constraints.push({ key: 'quote_freshness', state: 'PASS' });
        }
    }
    // 6. Leverage Limit
    if (ctx.requiredLeverage !== undefined && intent.max_leverage !== undefined) {
        const req = toDecimal(ctx.requiredLeverage);
        const max = toDecimal(intent.max_leverage);
        if (req.greaterThan(max)) {
            const c = {
                key: 'max_leverage',
                state: 'FAIL',
                reason: `Required leverage ${ctx.requiredLeverage}x exceeds max limit of ${intent.max_leverage}x`,
                observedValue: `${ctx.requiredLeverage}x`,
                limitValue: `${intent.max_leverage}x`,
            };
            constraints.push(c);
            if (!primaryRejection) {
                primaryRejection = {
                    code: 'LEVERAGE_LIMIT',
                    message: `Required leverage (${ctx.requiredLeverage}x) exceeds your limit of ${intent.max_leverage}x`,
                    evidence: {
                        requiredLeverage: ctx.requiredLeverage,
                        maxLeverage: intent.max_leverage,
                    },
                };
            }
        }
        else {
            constraints.push({
                key: 'max_leverage',
                state: 'PASS',
                observedValue: `${ctx.requiredLeverage}x`,
                limitValue: `${intent.max_leverage}x`,
            });
        }
    }
    else if (intent.max_leverage !== undefined) {
        constraints.push({ key: 'max_leverage', state: 'NA' });
    }
    // 7. Max Observed Execution Cost Ceiling
    if (intent.max_observed_execution_cost_bps !== undefined &&
        ctx.execution?.observedExecutionCostBps !== undefined) {
        const cost = toDecimal(ctx.execution.observedExecutionCostBps);
        const limit = toDecimal(intent.max_observed_execution_cost_bps);
        if (cost.greaterThan(limit)) {
            const c = {
                key: 'max_execution_cost',
                state: 'FAIL',
                reason: `Observed execution cost ${ctx.execution.observedExecutionCostBps} bps exceeds ceiling of ${intent.max_observed_execution_cost_bps} bps`,
                observedValue: `${ctx.execution.observedExecutionCostBps} bps`,
                limitValue: `${intent.max_observed_execution_cost_bps} bps`,
            };
            constraints.push(c);
            if (!primaryRejection) {
                primaryRejection = {
                    code: 'EXECUTION_COST_LIMIT',
                    message: `Immediate execution cost of ${ctx.execution.observedExecutionCostBps} bps exceeds your ceiling of ${intent.max_observed_execution_cost_bps} bps`,
                    evidence: {
                        observedCostBps: ctx.execution.observedExecutionCostBps,
                        costCeilingBps: intent.max_observed_execution_cost_bps,
                    },
                };
            }
        }
        else {
            constraints.push({
                key: 'max_execution_cost',
                state: 'PASS',
                observedValue: `${ctx.execution.observedExecutionCostBps} bps`,
                limitValue: `${intent.max_observed_execution_cost_bps} bps`,
            });
        }
    }
    // 8. Max Estimated Carry Ceiling
    if (intent.max_estimated_carry_bps !== undefined &&
        ctx.carry?.estimatedCarryBps !== undefined) {
        const carry = toDecimal(ctx.carry.estimatedCarryBps);
        const limit = toDecimal(intent.max_estimated_carry_bps);
        if (carry.greaterThan(limit)) {
            const c = {
                key: 'max_carry',
                state: 'FAIL',
                reason: `Estimated carry ${ctx.carry.estimatedCarryBps} bps exceeds ceiling of ${intent.max_estimated_carry_bps} bps`,
                observedValue: `${ctx.carry.estimatedCarryBps} bps`,
                limitValue: `${intent.max_estimated_carry_bps} bps`,
            };
            constraints.push(c);
            if (!primaryRejection) {
                primaryRejection = {
                    code: 'CARRY_LIMIT',
                    message: `Estimated carry of ${ctx.carry.estimatedCarryBps} bps exceeds your ceiling of ${intent.max_estimated_carry_bps} bps`,
                    evidence: {
                        estimatedCarryBps: ctx.carry.estimatedCarryBps,
                        carryCeilingBps: intent.max_estimated_carry_bps,
                    },
                };
            }
        }
        else {
            constraints.push({
                key: 'max_carry',
                state: 'PASS',
                observedValue: `${ctx.carry.estimatedCarryBps} bps`,
                limitValue: `${intent.max_estimated_carry_bps} bps`,
            });
        }
    }
    const isValid = !primaryRejection;
    return {
        constraints,
        rejection: primaryRejection,
        isValid,
    };
}
//# sourceMappingURL=index.js.map