import { ExecutionIntent } from '../intent/index.js';
import { ComparisonSnapshot } from '../snapshot/index.js';
import { ObservedExecutionCost, EstimatedCarry, calculateSpotCost, calculateConvertCost, calculateUsdMCost } from '../cost/index.js';
import { ConstraintResult, Rejection, evaluateRouteConstraints } from '../constraints/index.js';
import { walkOrderBook } from '../orderbook/index.js';
import { toDecimal } from '../decimal/index.js';

export type PathKind = 'spot' | 'convert' | 'usd_m_perp' | 'margin' | 'coin_m_perp';

export type PathStatus =
  | 'GENERATED'
  | 'QUOTED'
  | 'VALID'
  | 'REJECTED'
  | 'UNAVAILABLE'
  | 'EXPIRED'
  | 'SELECTED';

export type HedgeSemantics = {
  sourceAsset: string;
  sourceExposure: string;
  targetFraction: string;
  rawHedgeQuantity: string;
  roundedHedgeQuantity: string;
  contractSymbol: string;
  side: 'buy' | 'sell';
  markPrice: string;
  hedgeNotionalUsdt: string;
  availableCollateralUsdt?: string;
  requiredLeverage?: string;
  maxLeverageCap?: string;
  resultingIntendedDelta: string;
  roundingPrecision: string;
  status: 'EXACT' | 'UNAVAILABLE';
};

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
  quoteId?: string;
  quoteExpiryRemainingMs?: number;
  leverage?: string;
  hedgeSemantics?: HedgeSemantics;
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
export function generateAndEvaluateRoutes(input: GenerateRoutesInput): RoutePath[] {
  const { intent, snapshot } = input;
  const currentTimeMs = input.currentTimeMs ?? Date.now();
  const routes: RoutePath[] = [];

  const quoteAsset = 'USDT';
  const baseAsset = intent.asset;

  // Derive trade size
  let requestedBaseQuantity: string | undefined;
  let requestedQuoteNotional: string | undefined;
  let hedgeSemantics: HedgeSemantics | undefined;

  const availableCollateral = snapshot.usdM?.availableMargin || snapshot.account.balances['USDT']?.free;

  if (intent.amount) {
    if (intent.amount.type === 'notional') {
      requestedQuoteNotional = intent.amount.value;
      if (intent.objective === 'hedge') {
        const markPrice = snapshot.usdM?.markPrice || (snapshot.spot ? toDecimal(snapshot.spot.bidPrice).plus(toDecimal(snapshot.spot.askPrice)).dividedBy(2).toFixed(8) : '1');
        const rawQty = toDecimal(markPrice).isZero() ? toDecimal(0) : toDecimal(intent.amount.value).dividedBy(toDecimal(markPrice));
        requestedBaseQuantity = rawQty.toFixed(8);
        const reqLev = (availableCollateral && toDecimal(availableCollateral).greaterThan(0))
          ? toDecimal(intent.amount.value).dividedBy(toDecimal(availableCollateral)).toFixed(2)
          : undefined;

        hedgeSemantics = {
          sourceAsset: baseAsset,
          sourceExposure: requestedBaseQuantity,
          targetFraction: '1.0',
          rawHedgeQuantity: rawQty.toFixed(8),
          roundedHedgeQuantity: rawQty.toFixed(3),
          contractSymbol: `${baseAsset}${quoteAsset}`,
          side: 'sell',
          markPrice,
          hedgeNotionalUsdt: intent.amount.value,
          availableCollateralUsdt: availableCollateral,
          requiredLeverage: reqLev,
          maxLeverageCap: intent.max_leverage,
          resultingIntendedDelta: `0.00000000 ${baseAsset} (100.0% hedged)`,
          roundingPrecision: '0.001',
          status: availableCollateral ? 'EXACT' : 'UNAVAILABLE',
        };
      }
    } else if (intent.amount.type === 'asset_quantity') {
      requestedBaseQuantity = intent.amount.value;
      if (intent.objective === 'hedge') {
        const markPrice = snapshot.usdM?.markPrice || (snapshot.spot ? toDecimal(snapshot.spot.bidPrice).plus(toDecimal(snapshot.spot.askPrice)).dividedBy(2).toFixed(8) : '1');
        const notional = toDecimal(intent.amount.value).times(toDecimal(markPrice)).toFixed(2);
        const reqLev = (availableCollateral && toDecimal(availableCollateral).greaterThan(0))
          ? toDecimal(notional).dividedBy(toDecimal(availableCollateral)).toFixed(2)
          : undefined;

        hedgeSemantics = {
          sourceAsset: baseAsset,
          sourceExposure: intent.amount.value,
          targetFraction: '1.0',
          rawHedgeQuantity: intent.amount.value,
          roundedHedgeQuantity: toDecimal(intent.amount.value).toFixed(3),
          contractSymbol: `${baseAsset}${quoteAsset}`,
          side: 'sell',
          markPrice,
          hedgeNotionalUsdt: notional,
          availableCollateralUsdt: availableCollateral,
          requiredLeverage: reqLev,
          maxLeverageCap: intent.max_leverage,
          resultingIntendedDelta: `0.00000000 ${baseAsset} (100.0% hedged)`,
          roundingPrecision: '0.001',
          status: availableCollateral ? 'EXACT' : 'UNAVAILABLE',
        };
      }
    } else if (intent.amount.type === 'exposure_fraction') {
      // Look up balance or position of the base asset from account snapshot
      const bal = snapshot.account.balances[baseAsset];
      const freeAmount = bal ? toDecimal(bal.free) : toDecimal(0);
      const frac = toDecimal(intent.amount.value);
      const rawQty = freeAmount.times(frac);
      requestedBaseQuantity = rawQty.toFixed(8);

      const markPrice = snapshot.usdM?.markPrice || (snapshot.spot ? toDecimal(snapshot.spot.bidPrice).plus(toDecimal(snapshot.spot.askPrice)).dividedBy(2).toFixed(8) : '1');
      const notional = rawQty.times(toDecimal(markPrice)).toFixed(2);
      const reqLev = (availableCollateral && toDecimal(availableCollateral).greaterThan(0))
        ? toDecimal(notional).dividedBy(toDecimal(availableCollateral)).toFixed(2)
        : undefined;

      const unhedgedFraction = toDecimal(1).minus(frac);
      const remainingExposure = freeAmount.times(unhedgedFraction).toFixed(8);

      hedgeSemantics = {
        sourceAsset: baseAsset,
        sourceExposure: freeAmount.toFixed(8),
        targetFraction: frac.toFixed(4),
        rawHedgeQuantity: rawQty.toFixed(8),
        roundedHedgeQuantity: rawQty.toFixed(3),
        contractSymbol: `${baseAsset}${quoteAsset}`,
        side: 'sell',
        markPrice,
        hedgeNotionalUsdt: notional,
        availableCollateralUsdt: availableCollateral,
        requiredLeverage: reqLev,
        maxLeverageCap: intent.max_leverage,
        resultingIntendedDelta: `+${remainingExposure} ${baseAsset} (${unhedgedFraction.times(100).toFixed(1)}% unhedged)`,
        roundingPrecision: '0.001',
        status: availableCollateral ? 'EXACT' : 'UNAVAILABLE',
      };
    }
  }

  // Determine trade side based on objective
  // Buy -> buy
  // Sell -> sell
  // Hedge -> sell/short exposure
  // Flatten -> opposite of current position
  const isBuy = intent.objective === 'buy';
  const isSellOrHedge = intent.objective === 'sell' || intent.objective === 'hedge';
  const side: 'buy' | 'sell' = isBuy ? 'buy' : 'sell';

  // --- 1. SPOT ROUTE ---
  if (snapshot.spot) {
    let execution: ObservedExecutionCost | undefined;
    let sufficientDepth = true;

    try {
      const walk = walkOrderBook({
        side,
        requestedBaseQuantity,
        requestedQuoteNotional,
        bids: snapshot.spot.bids,
        asks: snapshot.spot.asks,
      });

      sufficientDepth = walk.sufficientDepth;
      const midPrice = toDecimal(snapshot.spot.bidPrice)
        .plus(toDecimal(snapshot.spot.askPrice))
        .dividedBy(2)
        .toFixed(8);

      const feeBps = snapshot.account.takerFeeBps || '10.00';
      execution = calculateSpotCost(
        walk,
        midPrice,
        feeBps,
        side,
        new Date(snapshot.spot.timestamp).toISOString()
      );
    } catch {
      sufficientDepth = false;
    }

    const disposesUnderlying = side === 'sell';
    const hasPermission = snapshot.account.permissions.spotTrade && snapshot.capabilityRegistry.spot.trade;
    const isProductAvailable = snapshot.capabilityRegistry.spot.trade;

    const evalResult = evaluateRouteConstraints(intent, {
      kind: 'spot',
      side,
      disposesUnderlying,
      execution,
      hasPermission,
      isProductAvailable,
      sufficientDepth,
      currentTimeMs,
    });

    routes.push({
      id: `spot-${baseAsset}-${quoteAsset}`,
      kind: 'spot',
      status: evalResult.isValid ? 'VALID' : 'REJECTED',
      side,
      baseAsset,
      quoteAsset,
      requestedQuantity: requestedBaseQuantity,
      requestedNotional: requestedQuoteNotional,
      execution,
      constraints: evalResult.constraints,
      rejection: evalResult.rejection,
      quoteFreshnessMs: Math.max(0, currentTimeMs - snapshot.spot.timestamp),
      snapshotId: snapshot.id,
    });
  }

  // --- 2. CONVERT ROUTE ---
  const convertQuote = snapshot.convertQuotes?.find((q) =>
    side === 'buy'
      ? (q.fromAsset === quoteAsset && q.toAsset === baseAsset)
      : (q.fromAsset === baseAsset && q.toAsset === quoteAsset)
  ) || snapshot.convert;

  if (convertQuote) {
    const convert = convertQuote;
    let isDirectionCompatible = false;
    let effectivePrice: string | undefined;

    if (side === 'buy') {
      // User is buying baseAsset with quoteAsset:
      // Convert quote MUST convert FROM quoteAsset TO baseAsset
      if (convert.fromAsset === quoteAsset && convert.toAsset === baseAsset) {
        isDirectionCompatible = true;
        effectivePrice = toDecimal(convert.fromAmount).dividedBy(toDecimal(convert.toAmount)).toFixed(8);
      }
    } else {
      // User is selling baseAsset for quoteAsset:
      // Convert quote MUST convert FROM baseAsset TO quoteAsset
      if (convert.fromAsset === baseAsset && convert.toAsset === quoteAsset) {
        isDirectionCompatible = true;
        effectivePrice = toDecimal(convert.toAmount).dividedBy(toDecimal(convert.fromAmount)).toFixed(8);
      }
    }

    if (!isDirectionCompatible || !effectivePrice) {
      // Fail closed: Spot and Convert cannot be compared fairly from available data
      routes.push({
        id: `convert-${baseAsset}-${quoteAsset}`,
        kind: 'convert',
        status: 'UNAVAILABLE',
        side,
        baseAsset,
        quoteAsset,
        requestedQuantity: requestedBaseQuantity,
        requestedNotional: requestedQuoteNotional,
        execution: {
          status: 'UNAVAILABLE',
          components: [
            {
              key: 'quote_spread_delta',
              valueBps: null,
              source: 'convert_quote',
              status: 'UNAVAILABLE',
              note: `Convert RFQ direction (${convert.fromAsset} -> ${convert.toAsset}) is incompatible with requested trade direction (${side} ${baseAsset}/${quoteAsset}). Incomplete comparison.`,
            },
          ],
        },
        constraints: [
          {
            key: 'quote_direction_compatible',
            state: 'FAIL',
            reason: `Convert quote direction (${convert.fromAsset}->${convert.toAsset}) does not match trade side (${side})`,
          },
        ],
        rejection: {
          code: 'COST_COMPONENT_UNAVAILABLE',
          message: `Incompatible Convert RFQ direction (${convert.fromAsset}->${convert.toAsset}) for ${side} ${baseAsset}`,
        },
        quoteFreshnessMs: Math.max(0, currentTimeMs - convert.timestamp),
        quoteId: convert.quoteId,
        quoteExpiryRemainingMs: Math.max(0, convert.validTimestamp - currentTimeMs),
        snapshotId: snapshot.id,
      });
    } else {
      const refPrice = snapshot.spot
        ? toDecimal(snapshot.spot.bidPrice).plus(toDecimal(snapshot.spot.askPrice)).dividedBy(2).toFixed(8)
        : effectivePrice;

      const execution = calculateConvertCost(
        effectivePrice,
        refPrice,
        side,
        convert.quoteId,
        new Date(convert.timestamp).toISOString()
      );

      const disposesUnderlying = side === 'sell';
      const hasPermission = snapshot.account.permissions.spotTrade && snapshot.capabilityRegistry.convert.trade;
      const isProductAvailable = snapshot.capabilityRegistry.convert.trade;

      const evalResult = evaluateRouteConstraints(intent, {
        kind: 'convert',
        side,
        disposesUnderlying,
        execution,
        hasPermission,
        isProductAvailable,
        validUntilTimestamp: convert.validTimestamp,
        currentTimeMs,
      });

      routes.push({
        id: `convert-${baseAsset}-${quoteAsset}`,
        kind: 'convert',
        status: evalResult.isValid ? 'VALID' : 'REJECTED',
        side,
        baseAsset,
        quoteAsset,
        requestedQuantity: requestedBaseQuantity,
        requestedNotional: requestedQuoteNotional,
        execution,
        constraints: evalResult.constraints,
        rejection: evalResult.rejection,
        quoteFreshnessMs: Math.max(0, currentTimeMs - convert.timestamp),
        quoteId: convert.quoteId,
        quoteExpiryRemainingMs: Math.max(0, convert.validTimestamp - currentTimeMs),
        snapshotId: snapshot.id,
      });
    }
  }

  // --- 3. USD-M PERPETUAL FUTURES ROUTE ---
  if (snapshot.usdM) {
    const isApplicableForObjective = intent.objective === 'hedge' || intent.objective === 'flatten' || (intent.objective === 'buy' && intent.max_leverage !== undefined);

    if (isApplicableForObjective) {
      const takerFeeBps = '5.00'; // VIP 0 taker schedule
      const costOutput = calculateUsdMCost(
        snapshot.usdM.markPrice,
        snapshot.usdM.currentFundingRateBps,
        snapshot.usdM.fundingIntervalHours,
        takerFeeBps,
        intent.horizon,
        '0.00',
        new Date(snapshot.usdM.timestamp).toISOString()
      );

      // Derivatives hedge uses synthetic short perp without selling underlying BNB
      const disposesUnderlying = false;
      const requiredLeverage = hedgeSemantics?.requiredLeverage;
      const hasPermission = snapshot.account.permissions.futuresTrade && snapshot.capabilityRegistry.usdM.trade;
      const isProductAvailable = snapshot.capabilityRegistry.usdM.trade;

      const evalResult = evaluateRouteConstraints(intent, {
        kind: 'usd_m_perp',
        side: isSellOrHedge ? 'sell' : 'buy',
        disposesUnderlying,
        requiredLeverage,
        execution: costOutput.execution,
        carry: costOutput.carry,
        hasPermission,
        isProductAvailable,
        currentTimeMs,
      });

      routes.push({
        id: `usd_m_perp-${baseAsset}-${quoteAsset}`,
        kind: 'usd_m_perp',
        status: evalResult.isValid ? 'VALID' : 'REJECTED',
        side: isSellOrHedge ? 'sell' : 'buy',
        baseAsset,
        quoteAsset,
        requestedQuantity: requestedBaseQuantity,
        requestedNotional: requestedQuoteNotional,
        execution: costOutput.execution,
        carry: costOutput.carry,
        constraints: evalResult.constraints,
        rejection: evalResult.rejection,
        leverage: requiredLeverage,
        quoteFreshnessMs: Math.max(0, currentTimeMs - snapshot.usdM.timestamp),
        hedgeSemantics,
        snapshotId: snapshot.id,
      });
    }
  }

  // --- 4. MARGIN ROUTE (Feature-gated) ---
  if (snapshot.capabilityRegistry.margin) {
    routes.push({
      id: `margin-${baseAsset}-${quoteAsset}`,
      kind: 'margin',
      status: 'UNAVAILABLE',
      side,
      baseAsset,
      quoteAsset,
      requestedQuantity: requestedBaseQuantity,
      requestedNotional: requestedQuoteNotional,
      constraints: [
        {
          key: 'product_available',
          state: 'FAIL',
          reason: 'Cross margin trading is disabled on sub-account or feature-gated',
        },
      ],
      rejection: {
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Margin trading is feature-gated and disabled on this sub-account',
        evidence: { product: 'margin' },
      },
      snapshotId: snapshot.id,
    });
  }

  return routes;
}

export * from './card.js';
export * from './recompile.js';
