import { BookLevel } from '../orderbook/index.js';

export type CapabilityRegistry = {
  spot: {
    marketRead: boolean;
    accountRead: boolean;
    trade: boolean;
    feeRead: boolean;
  };
  convert: {
    quote: boolean;
    trade: boolean;
  };
  usdM: {
    marketRead: boolean;
    fundingRead: boolean;
    positionRead: boolean;
    trade: boolean;
    feeRead: boolean;
  };
  margin: {
    marketRead: boolean;
    borrowRateRead: boolean;
    accountRead: boolean;
    trade: boolean;
    costingComplete: boolean;
  };
  coinM: {
    marketRead: boolean;
    fundingRead: boolean;
    positionRead: boolean;
    trade: boolean;
    feeRead: boolean;
    costingComplete: boolean;
  };
};

export type BalanceItem = {
  asset: string;
  free: string;
  locked: string;
};

export type PositionItem = {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  unrealizedProfit: string;
  leverage: string;
  isolated: boolean;
};

export type AccountSnapshot = {
  timestamp: number;
  canTrade: boolean;
  makerFeeBps: string;
  takerFeeBps: string;
  balances: Record<string, BalanceItem>;
  permissions: {
    spotTrade: boolean;
    futuresTrade: boolean;
    marginTrade: boolean;
    reading: boolean;
  };
};

export type SpotSnapshot = {
  symbol: string;
  timestamp: number;
  bidPrice: string;
  askPrice: string;
  bids: BookLevel[];
  asks: BookLevel[];
  lastUpdateId?: number;
};

export type ConvertSnapshot = {
  fromAsset: string;
  toAsset: string;
  timestamp: number;
  ratio: string;
  inverseRatio: string;
  toAmount: string;
  fromAmount: string;
  validTimestamp: number;
  quoteId?: string;
};

export type UsdMSnapshot = {
  symbol: string;
  timestamp: number;
  markPrice: string;
  indexPrice?: string;
  currentFundingRateBps: string;
  fundingIntervalHours: number;
  availableMargin?: string;
  bids?: BookLevel[];
  asks?: BookLevel[];
  positions: PositionItem[];
};

export type MarginSnapshot = {
  tradeEnabled: boolean;
  borrowEnabled: boolean;
  marginLevel?: string;
  timestamp: number;
};

export type CoinMSnapshot = {
  symbol: string;
  timestamp: number;
  canTrade: boolean;
  feeTier: number;
  positions: PositionItem[];
};

export type SnapshotMode = 'fixture' | 'live-read' | 'live-trade';

export type ComparisonSnapshot = {
  id: string;
  mode: SnapshotMode;
  startedAt: string;
  completedAt: string;
  maxObservedSkewMs: number;
  account: AccountSnapshot;
  spot?: SpotSnapshot;
  convert?: ConvertSnapshot;
  convertQuotes?: ConvertSnapshot[];
  usdM?: UsdMSnapshot;
  margin?: MarginSnapshot;
  coinM?: CoinMSnapshot;
  capabilityRegistry: CapabilityRegistry;
  sourceFingerprint: string;
};

export const DEFAULT_MAX_SNAPSHOT_SKEW_MS = 2000;

/**
 * Calculates the maximum timestamp skew between all present route states in a snapshot.
 */
export function calculateSnapshotSkew(snapshot: {
  account: { timestamp: number };
  spot?: { timestamp: number };
  convert?: { timestamp: number };
  usdM?: { timestamp: number };
}): number {
  const timestamps: number[] = [snapshot.account.timestamp];
  if (snapshot.spot) timestamps.push(snapshot.spot.timestamp);
  if (snapshot.convert) timestamps.push(snapshot.convert.timestamp);
  if (snapshot.usdM) timestamps.push(snapshot.usdM.timestamp);

  if (timestamps.length <= 1) return 0;

  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  return max - min;
}

/**
 * Verifies that the snapshot skew does not exceed the allowed threshold.
 */
export function isSnapshotSkewAcceptable(
  snapshot: {
    account: { timestamp: number };
    spot?: { timestamp: number };
    convert?: { timestamp: number };
    usdM?: { timestamp: number };
  },
  maxSkewMs: number = DEFAULT_MAX_SNAPSHOT_SKEW_MS
): { acceptable: boolean; observedSkewMs: number } {
  const observedSkewMs = calculateSnapshotSkew(snapshot);
  return {
    acceptable: observedSkewMs <= maxSkewMs,
    observedSkewMs,
  };
}
