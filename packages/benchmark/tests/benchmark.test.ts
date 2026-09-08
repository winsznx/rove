import { describe, it, expect } from 'vitest';
import { CANONICAL_20_INTENTS, runRouteFlipExperiment } from '../src/route-flip.js';
import { runAblation } from '../src/ablations.js';
import { ComparisonSnapshot } from '@rove/core';

const mockSnapshot: ComparisonSnapshot = {
  id: 'snap-bench-test',
  mode: 'fixture',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  maxObservedSkewMs: 25,
  account: {
    timestamp: Date.now(),
    canTrade: true,
    makerFeeBps: '10.00',
    takerFeeBps: '10.00',
    balances: {
      BNB: { asset: 'BNB', free: '50.0', locked: '0.0' },
      USDT: { asset: 'USDT', free: '50000.0', locked: '0.0' },
    },
    permissions: {
      spotTrade: true,
      futuresTrade: true,
      marginTrade: false,
      reading: true,
    },
  },
  spot: {
    symbol: 'BNBUSDT',
    timestamp: Date.now(),
    bidPrice: '750.00',
    askPrice: '750.10',
    bids: [['750.00', '100.0']],
    asks: [['750.10', '100.0']],
  },
  convert: {
    fromAsset: 'BNB',
    toAsset: 'USDT',
    timestamp: Date.now(),
    ratio: '750.05',
    inverseRatio: '0.00133324',
    fromAmount: '1.0',
    toAmount: '750.05',
    validTimestamp: Date.now() + 15000,
    quoteId: 'quote-bench-test',
  },
  usdM: {
    symbol: 'BNBUSDT',
    timestamp: Date.now(),
    markPrice: '750.00',
    currentFundingRateBps: '1.00',
    fundingIntervalHours: 8,
    positions: [],
  },
  capabilityRegistry: {
    spot: { marketRead: true, accountRead: true, trade: true, feeRead: true },
    convert: { quote: true, trade: true },
    usdM: { marketRead: true, fundingRead: true, positionRead: true, trade: true, feeRead: true },
    margin: { marketRead: false, borrowRateRead: false, accountRead: false, trade: false, costingComplete: false },
    coinM: { marketRead: false, fundingRead: false, positionRead: false, trade: false, feeRead: false, costingComplete: false },
  },
  sourceFingerprint: 'mock-sha256',
};

describe('Rove Benchmark Suite', () => {
  it('loads 20 canonical intents correctly', () => {
    expect(CANONICAL_20_INTENTS.length).toBe(20);
    for (const item of CANONICAL_20_INTENTS) {
      expect(item.id).toMatch(/^INT-\d{3}$/);
      expect(item.intent.version).toBe('1');
      expect(item.intent.objective).toBeDefined();
    }
  });

  it('runs route-flip experiment on snapshots', () => {
    const summary = runRouteFlipExperiment(mockSnapshot);
    expect(summary.totalIntents).toBe(20);
    expect(summary.rows.length).toBe(20);
    expect(summary.routeFlipRate).toBeDefined();
    expect(summary.constraintEnforcementRate).toBeDefined();
  });

  it('runs ablation successfully', () => {
    const intent = CANONICAL_20_INTENTS[0].intent;
    const spotOnlyRoutes = runAblation(intent, mockSnapshot, 'spot_only');
    expect(spotOnlyRoutes.length).toBeGreaterThan(0);
    const validRoutes = spotOnlyRoutes.filter((r) => r.status !== 'UNAVAILABLE');
    expect(validRoutes.every((r) => r.kind === 'spot')).toBe(true);

    const noConvertRoutes = runAblation(intent, mockSnapshot, 'no_convert');
    expect(noConvertRoutes.some((r) => r.kind === 'convert')).toBe(false);
  });
});
