import { calculateDeltaBps, addDecimals, toDecimal } from '../decimal/index.js';
/**
 * Calculates Spot observed execution cost from order book walk result and account fee.
 */
export function calculateSpotCost(walkResult, midPrice, feeBps, side, observedAt) {
    if (!walkResult.sufficientDepth) {
        return {
            referencePrice: midPrice,
            components: [
                {
                    key: 'slippage',
                    valueBps: null,
                    source: 'orderbook_walk',
                    observedAt,
                    status: 'UNAVAILABLE',
                    note: 'Insufficient visible order book depth to complete size',
                },
            ],
            status: 'UNAVAILABLE',
        };
    }
    const vwap = walkResult.vwap;
    // Slippage is the difference between VWAP and mid/best reference price
    let slippageBpsDecimal;
    if (side === 'buy') {
        slippageBpsDecimal = toDecimal(calculateDeltaBps(vwap, midPrice));
    }
    else {
        slippageBpsDecimal = toDecimal(calculateDeltaBps(midPrice, vwap));
    }
    // Ensure non-negative slippage
    const zero = toDecimal(0);
    const slippageBps = slippageBpsDecimal.lessThan(zero) ? '0.00' : slippageBpsDecimal.toFixed(2);
    const totalObservedCostBps = addDecimals(slippageBps, feeBps).toFixed(2);
    const components = [
        {
            key: 'slippage',
            valueBps: slippageBps,
            source: 'spot_orderbook_walk',
            observedAt,
            status: 'OBSERVED',
            note: `Consumed ${walkResult.levelsConsumed} book levels`,
        },
        {
            key: 'exchange_fee',
            valueBps: feeBps,
            source: 'spot_account_commission',
            observedAt,
            status: 'OBSERVED',
            note: 'Authoritative account taker commission',
        },
    ];
    return {
        referencePrice: midPrice,
        expectedFillPrice: vwap,
        observedExecutionCostBps: totalObservedCostBps,
        slippageBps,
        feeBps,
        components,
        status: 'COMPLETE',
    };
}
/**
 * Calculates Convert observed execution cost from Convert quote and reference spot price.
 */
export function calculateConvertCost(effectivePrice, referencePrice, side, quoteId, observedAt) {
    let deltaBpsDecimal;
    if (side === 'buy') {
        deltaBpsDecimal = toDecimal(calculateDeltaBps(effectivePrice, referencePrice));
    }
    else {
        deltaBpsDecimal = toDecimal(calculateDeltaBps(referencePrice, effectivePrice));
    }
    const zero = toDecimal(0);
    const convertQuoteDeltaBps = deltaBpsDecimal.lessThan(zero) ? '0.00' : deltaBpsDecimal.toFixed(2);
    const components = [
        {
            key: 'quote_spread_delta',
            valueBps: convertQuoteDeltaBps,
            source: 'convert_quote',
            observedAt,
            status: 'OBSERVED',
            note: quoteId ? `Quote ID: ${quoteId}` : 'Quote pricing (unfunded pre-quote)',
        },
        {
            key: 'exchange_fee',
            valueBps: '0.00',
            source: 'binance_convert',
            observedAt,
            status: 'OBSERVED',
            note: 'Zero trading fees on Binance Convert',
        },
    ];
    return {
        referencePrice,
        expectedFillPrice: effectivePrice,
        observedExecutionCostBps: convertQuoteDeltaBps,
        convertQuoteDeltaBps,
        feeBps: '0.00',
        components,
        status: 'COMPLETE',
    };
}
/**
 * Calculates USD-M Perpetual observed execution cost and estimated carry across horizon.
 */
export function calculateUsdMCost(markPrice, currentFundingRateBps, fundingIntervalHours, takerFeeBps, horizon, slippageBps = '0.00', observedAt) {
    const executionCostBps = addDecimals(slippageBps, takerFeeBps).toFixed(2);
    const execution = {
        referencePrice: markPrice,
        expectedFillPrice: markPrice,
        observedExecutionCostBps: executionCostBps,
        slippageBps,
        feeBps: takerFeeBps,
        components: [
            {
                key: 'perpetual_taker_fee',
                valueBps: takerFeeBps,
                source: 'futures_usds_schedule',
                observedAt,
                status: 'OBSERVED',
                note: 'Futures taker fee',
            },
            {
                key: 'slippage',
                valueBps: slippageBps,
                source: 'futures_market_depth',
                observedAt,
                status: 'OBSERVED',
            },
            {
                key: 'current_funding_rate',
                valueBps: currentFundingRateBps,
                source: 'futures_usds_premium_index',
                observedAt,
                status: 'OBSERVED',
                note: 'Observed current funding rate per interval',
            },
        ],
        status: 'COMPLETE',
    };
    if (!horizon) {
        return { execution };
    }
    // Convert horizon to hours
    let horizonHours = horizon.value;
    if (horizon.unit === 'minutes') {
        horizonHours = horizon.value / 60;
    }
    else if (horizon.unit === 'days') {
        horizonHours = horizon.value * 24;
    }
    const intervalHours = fundingIntervalHours > 0 ? fundingIntervalHours : 8;
    const numIntervals = toDecimal(horizonHours).dividedBy(intervalHours);
    const fundingRateDecimal = toDecimal(currentFundingRateBps);
    const estimatedCarryBps = fundingRateDecimal.times(numIntervals).abs().toFixed(2);
    const assumption = `Explicit assumption: current funding rate of ${currentFundingRateBps} bps per ${intervalHours}h persists unchanged across ${horizon.value} ${horizon.unit}.`;
    const carry = {
        horizon,
        estimatedCarryBps,
        assumption,
        components: [
            {
                key: 'projected_funding_carry',
                valueBps: estimatedCarryBps,
                source: 'funding_projection_model',
                observedAt,
                status: 'ESTIMATED',
                note: `${numIntervals.toFixed(2)} funding intervals at ${currentFundingRateBps} bps`,
            },
        ],
        status: 'COMPLETE',
    };
    return { execution, carry };
}
//# sourceMappingURL=index.js.map