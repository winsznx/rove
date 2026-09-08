import crypto from 'node:crypto';
import {
  ComparisonSnapshot,
  CapabilityRegistry,
  SpotSnapshot,
  ConvertSnapshot,
  UsdMSnapshot,
  AccountSnapshot,
  calculateSnapshotSkew,
  DEFAULT_MAX_SNAPSHOT_SKEW_MS,
  SnapshotMode,
} from '@rove/core';
import { BinanceAgentOsAdapter } from './adapter.js';

export type SnapshotCollectionOptions = {
  asset: string;
  quoteAsset?: string;
  mode?: SnapshotMode;
  maxSkewMs?: number;
  fromAmount?: string;
  toAmount?: string;
};

export class SnapshotCollector {
  private adapter: BinanceAgentOsAdapter;
  private capabilityRegistry: CapabilityRegistry;

  constructor(adapter: BinanceAgentOsAdapter, capabilityRegistry: CapabilityRegistry) {
    this.adapter = adapter;
    this.capabilityRegistry = capabilityRegistry;
  }

  async captureSnapshot(options: SnapshotCollectionOptions): Promise<ComparisonSnapshot> {
    const startedAt = new Date().toISOString();
    const startTimeMs = Date.now();
    const quoteAsset = options.quoteAsset ?? 'USDT';
    const symbol = `${options.asset}${quoteAsset}`;
    const maxSkewMs = options.maxSkewMs ?? DEFAULT_MAX_SNAPSHOT_SKEW_MS;

    // Concurrently fetch all route state from Binance Agent OS
    const [
      spotAccountRes,
      permissionsRes,
      spotDepthRes,
      convertQuoteRes,
      usdMMarkPrice,
      usdMFundingRes,
      usdMAccountRes,
    ] = await Promise.all([
      this.adapter.getSpotAccount(),
      this.adapter.getApiKeyPermissions(),
      this.adapter.getSpotDepth({ symbol, limit: 20 }),
      this.adapter.getConvertQuote({
        fromAsset: options.asset,
        toAsset: quoteAsset,
        fromAmount: options.fromAmount ?? '1.0',
      }),
      this.adapter.getUsdMMarkPrice(symbol),
      this.adapter.getUsdMFunding(symbol),
      this.adapter.getUsdMAccount(),
    ]);

    const completedAt = new Date().toISOString();
    const snapshotTimestamp = Date.now();

    // Map balances
    const balances: AccountSnapshot['balances'] = {};
    for (const b of spotAccountRes.balances) {
      balances[b.asset] = {
        asset: b.asset,
        free: b.free,
        locked: b.locked,
      };
    }

    const account: AccountSnapshot = {
      timestamp: spotAccountRes.updateTime > 0 ? spotAccountRes.updateTime : snapshotTimestamp,
      canTrade: spotAccountRes.canTrade,
      makerFeeBps: (spotAccountRes.makerCommission).toFixed(2),
      takerFeeBps: (spotAccountRes.takerCommission).toFixed(2),
      balances,
      permissions: {
        spotTrade: permissionsRes.enableSpotAndMarginTrading,
        futuresTrade: permissionsRes.enableFutures,
        marginTrade: permissionsRes.enableMargin,
        reading: permissionsRes.enableReading,
      },
    };

    const bestBid = spotDepthRes.bids[0]?.[0] ?? '0';
    const bestAsk = spotDepthRes.asks[0]?.[0] ?? '0';

    const spot: SpotSnapshot = {
      symbol,
      timestamp: snapshotTimestamp,
      bidPrice: bestBid,
      askPrice: bestAsk,
      bids: spotDepthRes.bids,
      asks: spotDepthRes.asks,
      lastUpdateId: spotDepthRes.lastUpdateId,
    };

    const convert: ConvertSnapshot = {
      fromAsset: options.asset,
      toAsset: quoteAsset,
      timestamp: snapshotTimestamp,
      ratio: convertQuoteRes.ratio,
      inverseRatio: convertQuoteRes.inverseRatio,
      toAmount: convertQuoteRes.toAmount,
      fromAmount: convertQuoteRes.fromAmount,
      validTimestamp: convertQuoteRes.validTimestamp,
      quoteId: convertQuoteRes.quoteId,
    };

    const usdM: UsdMSnapshot = {
      symbol,
      timestamp: usdMFundingRes.timestamp > 0 ? usdMFundingRes.timestamp : snapshotTimestamp,
      markPrice: usdMMarkPrice,
      currentFundingRateBps: usdMFundingRes.rateBps,
      fundingIntervalHours: usdMFundingRes.intervalHours,
      positions: usdMAccountRes.positions.map((p) => ({
        symbol: p.symbol,
        positionAmt: p.positionAmt,
        entryPrice: p.entryPrice,
        unrealizedProfit: p.unrealizedProfit,
        leverage: p.leverage,
        isolated: p.isolated,
      })),
    };

    const observedSkewMs = calculateSnapshotSkew({
      account,
      spot,
      convert,
      usdM,
    });

    if (observedSkewMs > maxSkewMs) {
      throw new Error(
        `Snapshot skew ${observedSkewMs}ms exceeds maximum allowed threshold of ${maxSkewMs}ms`
      );
    }

    const payload = JSON.stringify({ symbol, spot, convert, usdM, account });
    const sourceFingerprint = crypto.createHash('sha256').update(payload).digest('hex');

    const id = `snap-${symbol.toLowerCase()}-${Date.now()}`;

    return {
      id,
      mode: options.mode ?? 'live-read',
      startedAt,
      completedAt,
      maxObservedSkewMs: observedSkewMs,
      account,
      spot,
      convert,
      usdM,
      capabilityRegistry: this.capabilityRegistry,
      sourceFingerprint,
    };
  }
}
