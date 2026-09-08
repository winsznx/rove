import { Horizon } from '../intent/index.js';
import { Decimal, DecimalInstance, calculateDeltaBps, addDecimals, toDecimal } from '../decimal/index.js';
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
export function calculateSpotCost(
  walkResult: BookWalkResult,
  midPrice: string,
  feeBps: string,
  side: 'buy' | 'sell',
  observedAt?: string
): ObservedExecutionCost {
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
  let slippageBpsDecimal: DecimalInstance;
  if (side === 'buy') {
    slippageBpsDecimal = toDecimal(calculateDeltaBps(vwap, midPrice));
  } else {
    slippageBpsDecimal = toDecimal(calculateDeltaBps(midPrice, vwap));
  }

  // Ensure non-negative slippage
  const zero = toDecimal(0);
  const slippageBps = slippageBpsDecimal.lessThan(zero) ? '0.00' : slippageBpsDecimal.toFixed(2);
  const totalObservedCostBps = addDecimals(slippageBps, feeBps).toFixed(2);

  const components: CostComponent[] = [
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
 * For a BUY: delta = ((effectivePrice - refPrice) / refPrice) * 10,000
 * For a SELL: delta = ((refPrice - effectivePrice) / refPrice) * 10,000
 * Any spread markup embedded by the RFQ market maker is counted as observed immediate cost.
 */
export function calculateConvertCost(
  effectivePrice: string,
  referencePrice: string,
  side: 'buy' | 'sell',
  quoteId?: string,
  observedAt?: string
): ObservedExecutionCost {
  const eff = toDecimal(effectivePrice);
  const ref = toDecimal(referencePrice);
  if (ref.isZero()) {
    throw new Error('Reference price cannot be zero');
  }

  let deltaBpsDecimal: DecimalInstance;
  if (side === 'buy') {
    // When buying, paying more than referencePrice is an embedded cost:
    // delta = ((effectivePrice - referencePrice) / referencePrice) * 10,000
    deltaBpsDecimal = eff.minus(ref).dividedBy(ref).times(10000);
  } else {
    // When selling, receiving less than referencePrice is an embedded cost:
    // delta = ((referencePrice - effectivePrice) / referencePrice) * 10,000
    deltaBpsDecimal = ref.minus(eff).dividedBy(ref).times(10000);
  }

  const zero = toDecimal(0);
  const convertQuoteDeltaBps = deltaBpsDecimal.lessThan(zero) ? '0.00' : deltaBpsDecimal.toFixed(2);

  const components: CostComponent[] = [
    {
      key: 'quote_spread_delta',
      valueBps: convertQuoteDeltaBps,
      source: 'convert_quote',
      observedAt,
      status: 'OBSERVED',
      note: quoteId
        ? `Quote ID: ${quoteId} (Embedded RFQ spread markup vs Spot mid)`
        : 'Embedded RFQ spread markup vs Spot mid',
    },
    {
      key: 'exchange_fee',
      valueBps: '0.00',
      source: 'binance_convert',
      observedAt,
      status: 'OBSERVED',
      note: 'Zero explicit trading fee on Binance Convert (cost is embedded in quoted rate)',
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
export function calculateUsdMCost(
  markPrice: string,
  currentFundingRateBps: string,
  fundingIntervalHours: number,
  takerFeeBps: string,
  horizon?: Horizon,
  slippageBps: string = '0.00',
  observedAt?: string
): { execution: ObservedExecutionCost; carry?: EstimatedCarry } {
  const executionCostBps = addDecimals(slippageBps, takerFeeBps).toFixed(2);

  const execution: ObservedExecutionCost = {
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
  } else if (horizon.unit === 'days') {
    horizonHours = horizon.value * 24;
  }

  const intervalHours = fundingIntervalHours > 0 ? fundingIntervalHours : 8;
  const numIntervals = toDecimal(horizonHours).dividedBy(intervalHours);

  const fundingRateDecimal = toDecimal(currentFundingRateBps);
  const estimatedCarryBps = fundingRateDecimal.times(numIntervals).abs().toFixed(2);

  const assumption = `Estimated ${horizonHours}h carry if the current ${intervalHours}h funding rate persisted (scenario only, not a known future cost).`;

  const carry: EstimatedCarry = {
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
