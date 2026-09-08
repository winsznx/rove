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
export function generateAndEvaluateRoutes(input: GenerateRoutesInput): RoutePath[] {
  const { intent, snapshot } = input;
  const currentTimeMs = input.currentTimeMs ?? Date.now();
  const routes: RoutePath[] = [];

  const quoteAsset = 'USDT';
  const baseAsset = intent.asset;

  // Derive trade size
  let requestedBaseQuantity: string | undefined;
  let requestedQuoteNotional: string | undefined;

  if (intent.amount) {
    if (intent.amount.type === 'notional') {
      requestedQuoteNotional = intent.amount.value;
    } else if (intent.amount.type === 'asset_quantity') {
      requestedBaseQuantity = intent.amount.value;
    } else if (intent.amount.type === 'exposure_fraction') {
      // Look up balance or position of the base asset from account snapshot
      const bal = snapshot.account.balances[baseAsset];
      const freeAmount = bal ? toDecimal(bal.free) : toDecimal(0);
      const frac = toDecimal(intent.amount.value);
      requestedBaseQuantity = freeAmount.times(frac).toFixed(8);
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
  if (snapshot.convert) {
    let execution: ObservedExecutionCost | undefined;
    const effectivePrice = side === 'buy' ? snapshot.convert.inverseRatio : snapshot.convert.ratio;
    const refPrice = snapshot.spot
      ? toDecimal(snapshot.spot.bidPrice).plus(toDecimal(snapshot.spot.askPrice)).dividedBy(2).toFixed(8)
      : effectivePrice;

    execution = calculateConvertCost(
      effectivePrice,
      refPrice,
      side,
      snapshot.convert.quoteId,
      new Date(snapshot.convert.timestamp).toISOString()
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
      validUntilTimestamp: snapshot.convert.validTimestamp,
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
      quoteFreshnessMs: Math.max(0, currentTimeMs - snapshot.convert.timestamp),
      snapshotId: snapshot.id,
    });
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
      const requiredLeverage = intent.max_leverage ? intent.max_leverage : '1.0';
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
        quoteFreshnessMs: Math.max(0, currentTimeMs - snapshot.usdM.timestamp),
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
