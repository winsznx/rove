export type BookLevel = [price: string, quantity: string];
export type BookWalkInput = {
    side: 'buy' | 'sell';
    requestedBaseQuantity?: string;
    requestedQuoteNotional?: string;
    bids: BookLevel[];
    asks: BookLevel[];
};
export type BookWalkResult = {
    filledBaseQuantity: string;
    spentOrReceivedQuote: string;
    vwap: string;
    levelsConsumed: number;
    sufficientDepth: boolean;
};
/**
 * Pure, deterministic order-book walking function.
 * Walks visible levels without interpolation beyond available depth.
 */
export declare function walkOrderBook(input: BookWalkInput): BookWalkResult;
//# sourceMappingURL=index.d.ts.map