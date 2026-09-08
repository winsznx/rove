import { describe, it, expect } from 'vitest';
import {
  ExecutionIntent,
  ComparisonSnapshot,
  generateAndEvaluateRoutes,
  rankRoutes,
} from '../src/index.js';

describe('End-to-End Core Engine Fixtures', () => {
  const mockCapabilityRegistry = {
    spot: { marketRead: true, accountRead: true, trade: true, feeRead: true },
    convert: { quote: true, trade: true },
    usdM: { marketRead: true, fundingRead: true, positionRead: true, trade: true, feeRead: true },
    margin: { marketRead: true, borrowRateRead: true, accountRead: true, trade: false, costingComplete: false },
    coinM: { marketRead: true, fundingRead: true, positionRead: true, trade: true, feeRead: true, costingComplete: true },
  };

  const mockSnapshot: ComparisonSnapshot = {
    id: 'snap-bnb-fixture-001',
    mode: 'fixture',
    startedAt: '2026-09-08T12:00:00.000Z',
    completedAt: '2026-09-08T12:00:00.050Z',
    maxObservedSkewMs: 45,
    account: {
      timestamp: 1788870000000,
      canTrade: true,
      makerFeeBps: '10.00',
      takerFeeBps: '10.00',
      balances: {
        BNB: { asset: 'BNB', free: '10.00000000', locked: '0.00000000' },
        USDT: { asset: 'USDT', free: '5000.00000000', locked: '0.00000000' },
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
      timestamp: 1788870000010,
      bidPrice: '750.50000000',
      askPrice: '750.60000000',
      bids: [
        ['750.50', '5.0'],
        ['750.40', '10.0'],
      ],
      asks: [
        ['750.60', '5.0'],
        ['750.70', '10.0'],
      ],
    },
    convert: {
      fromAsset: 'BNB',
      toAsset: 'USDT',
      timestamp: 1788870000020,
      ratio: '750.45000000',
      inverseRatio: '0.00133253',
      fromAmount: '7.0',
      toAmount: '5253.15',
      validTimestamp: 1788870010000, // +10s validity
      quoteId: 'quote-fixture-123',
    },
    usdM: {
      symbol: 'BNBUSDT',
      timestamp: 1788870000015,
      markPrice: '750.55',
      currentFundingRateBps: '1.25', // 1.25 bps per 8h
      fundingIntervalHours: 8,
      positions: [],
    },
    capabilityRegistry: mockCapabilityRegistry,
    sourceFingerprint: 'sha256-mock-fingerprint',
  };

  it('executes US-02: Hedge 70% BNB for 24h, must retain underlying, leverage <= 1.5x', () => {
    const intent: ExecutionIntent = {
      version: '1',
      objective: 'hedge',
      asset: 'BNB',
      amount: { type: 'exposure_fraction', value: '0.7' },
      horizon: { value: 24, unit: 'hours' },
      must_retain_underlying: true,
      max_leverage: '1.5',
      urgency: 'normal',
    };

    const routes = generateAndEvaluateRoutes({
      intent,
      snapshot: mockSnapshot,
      currentTimeMs: 1788870000030,
    });

    // 1. Spot selling must be REJECTED with RETAIN_UNDERLYING_CONFLICT
    const spotRoute = routes.find((r) => r.kind === 'spot');
    expect(spotRoute).toBeDefined();
    expect(spotRoute?.status).toBe('REJECTED');
    expect(spotRoute?.rejection?.code).toBe('RETAIN_UNDERLYING_CONFLICT');

    // 2. Convert selling must be REJECTED with RETAIN_UNDERLYING_CONFLICT
    const convertRoute = routes.find((r) => r.kind === 'convert');
    expect(convertRoute).toBeDefined();
    expect(convertRoute?.status).toBe('REJECTED');
    expect(convertRoute?.rejection?.code).toBe('RETAIN_UNDERLYING_CONFLICT');

    // 3. USD-M Perp does not sell BNB underlying -> VALID
    const usdMRoute = routes.find((r) => r.kind === 'usd_m_perp');
    expect(usdMRoute).toBeDefined();
    expect(usdMRoute?.status).toBe('VALID');
    expect(usdMRoute?.carry?.estimatedCarryBps).toBe('3.75'); // 24h / 8h = 3 intervals * 1.25 = 3.75 bps

    // 4. Ranking places USD-M as SELECTED winner
    const ranked = rankRoutes(routes);
    expect(ranked[0].kind).toBe('usd_m_perp');
    expect(ranked[0].status).toBe('SELECTED');
  });

  it('executes US-05: What-if recompilation on carry ceiling change', () => {
    const originalIntent: ExecutionIntent = {
      version: '1',
      objective: 'hedge',
      asset: 'BNB',
      amount: { type: 'exposure_fraction', value: '0.7' },
      horizon: { value: 24, unit: 'hours' },
      must_retain_underlying: true,
      max_leverage: '1.5',
      max_estimated_carry_bps: '10.0', // High ceiling
      urgency: 'normal',
    };

    const originalRoutes = rankRoutes(
      generateAndEvaluateRoutes({
        intent: originalIntent,
        snapshot: mockSnapshot,
        currentTimeMs: 1788870000030,
      })
    );

    expect(originalRoutes[0].kind).toBe('usd_m_perp');
    expect(originalRoutes[0].status).toBe('SELECTED');

    // User edits constraint: "Same hedge, but cap estimated carry at 2.0 bps"
    const editedIntent: ExecutionIntent = {
      ...originalIntent,
      max_estimated_carry_bps: '2.0', // Lower than projected 3.75 bps
    };

    const recompiledRoutes = rankRoutes(
      generateAndEvaluateRoutes({
        intent: editedIntent,
        snapshot: mockSnapshot,
        currentTimeMs: 1788870000030,
      })
    );

    const recompiledUsdM = recompiledRoutes.find((r) => r.kind === 'usd_m_perp');
    expect(recompiledUsdM?.status).toBe('REJECTED');
    expect(recompiledUsdM?.rejection?.code).toBe('CARRY_LIMIT');
    expect(recompiledUsdM?.rejection?.message).toContain('exceeds your ceiling of 2.0 bps');

    // Winner changed: no valid routes now
    const winner = recompiledRoutes.find((r) => r.status === 'SELECTED');
    expect(winner).toBeUndefined();
  });
});
