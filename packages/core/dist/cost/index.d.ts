import { Horizon } from '../intent/index.js';
import { BookWalkResult } from '../orderbook/index.js';
export type CostComponentStatus = 'OBSERVED' | 'ESTIMATED' | 'UNAVAILABLE';
export type CostComponent = {
    key: string;
    valueBps: string | null;
    source: string;
    observedAt?: string;
    status: CostComponentStatus;
    note?: string;
};
export type CostCompleteness = 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE';
export type ObservedExecutionCost = {
    referencePrice?: string;
    expectedFillPrice?: string;
    observedExecutionCostBps?: string;
    slippageBps?: string;
    feeBps?: string;
    spreadBps?: string;
    convertQuoteDeltaBps?: string;
    components: CostComponent[];
    status: CostCompleteness;
};
export type EstimatedCarry = {
    horizon?: Horizon;
    estimatedCarryBps?: string;
    assumption: string;
    components: CostComponent[];
    status: CostCompleteness;
};
/**
 * Calculates Spot observed execution cost from order book walk result and account fee.
 */
export declare function calculateSpotCost(walkResult: BookWalkResult, midPrice: string, feeBps: string, side: 'buy' | 'sell', observedAt?: string): ObservedExecutionCost;
/**
 * Calculates Convert observed execution cost from Convert quote and reference spot price.
 */
export declare function calculateConvertCost(effectivePrice: string, referencePrice: string, side: 'buy' | 'sell', quoteId?: string, observedAt?: string): ObservedExecutionCost;
/**
 * Calculates USD-M Perpetual observed execution cost and estimated carry across horizon.
 */
export declare function calculateUsdMCost(markPrice: string, currentFundingRateBps: string, fundingIntervalHours: number, takerFeeBps: string, horizon?: Horizon, slippageBps?: string, observedAt?: string): {
    execution: ObservedExecutionCost;
    carry?: EstimatedCarry;
};
//# sourceMappingURL=index.d.ts.map