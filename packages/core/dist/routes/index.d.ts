import { ExecutionIntent } from '../intent/index.js';
import { ComparisonSnapshot } from '../snapshot/index.js';
import { ObservedExecutionCost, EstimatedCarry } from '../cost/index.js';
import { ConstraintResult, Rejection } from '../constraints/index.js';
export type PathKind = 'spot' | 'convert' | 'usd_m_perp' | 'margin' | 'coin_m_perp';
export type PathStatus = 'GENERATED' | 'QUOTED' | 'VALID' | 'REJECTED' | 'UNAVAILABLE' | 'EXPIRED' | 'SELECTED';
export type RoutePath = {
    id: string;
    kind: PathKind;
    status: PathStatus;
    side: 'buy' | 'sell';
    baseAsset: string;
    quoteAsset: string;
    requestedQuantity?: string;
    requestedNotional?: string;
    execution?: ObservedExecutionCost;
    carry?: EstimatedCarry;
    constraints: ConstraintResult[];
    rejection?: Rejection;
    quoteFreshnessMs?: number;
    snapshotId: string;
};
export type GenerateRoutesInput = {
    intent: ExecutionIntent;
    snapshot: ComparisonSnapshot;
    currentTimeMs?: number;
};
/**
 * Objective-aware route generation and deterministic evaluation against a ComparisonSnapshot.
 */
export declare function generateAndEvaluateRoutes(input: GenerateRoutesInput): RoutePath[];
//# sourceMappingURL=index.d.ts.map