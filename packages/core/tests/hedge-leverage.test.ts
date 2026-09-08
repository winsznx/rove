import { describe, it, expect } from 'vitest';
import { generateAndEvaluateRoutes } from '../src/routes/index.js';
import { ExecutionIntent } from '../src/intent/index.js';
import { ComparisonSnapshot } from '../src/snapshot/index.js';

describe('Audited Hedge Sizing & Resulting Delta & Actual Leverage Calculation', () => {
  const baseSnapshot: ComparisonSnapshot = {
    id: 'snap-hedge-test',
    mode: 'live-read',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    maxObservedSkewMs: 25,
    account: {
      timestamp: Date.now(),
      canTrade: true,
      makerFeeBps: '2.00',
      takerFeeBps: '5.00',
      balances: {
        BNB: { asset: 'BNB', free: '12.50000000', locked: '0.00000000' },
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
      timestamp: Date.now(),
      bidPrice: '750.54',
      askPrice: '750.55',
      bids: [['750.54', '10.0']],
      asks: [['750.55', '10.0']],
    },
    usdM: {
      symbol: 'BNBUSDT',
      timestamp: Date.now(),
      markPrice: '751.04',
      currentFundingRateBps: '1.20',
      fundingIntervalHours: 8,
      positions: [],
      availableMargin: '5000.00',
    },
    capabilityRegistry: {
      spot: { marketRead: true, accountRead: true, trade: true, feeRead: true },
      convert: { quote: true, trade: true },
      usdM: { marketRead: true, fundingRead: true, positionRead: true, trade: true, feeRead: true },
      margin: { marketRead: false, borrowRateRead: false, accountRead: false, trade: false, costingComplete: false },
      coinM: { marketRead: false, fundingRead: false, positionRead: false, trade: false, feeRead: false, costingComplete: false },
    },
    sourceFingerprint: 'hash-hedge-audit',
  };

  it('correctly derives hedge quantity and required leverage from free spot balance and collateral', () => {
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
      snapshot: baseSnapshot,
    });

    const perpRoute = routes.find((r) => r.kind === 'usd_m_perp');
    expect(perpRoute).toBeDefined();
    expect(perpRoute?.status).toBe('VALID');

    // Sizing derivation: 12.5 free * 0.7 = 8.75 BNB
    expect(perpRoute?.hedgeSemantics).toBeDefined();
    expect(perpRoute?.hedgeSemantics?.sourceExposure).toBe('12.50000000');
    expect(perpRoute?.hedgeSemantics?.targetFraction).toBe('0.7000');
    expect(perpRoute?.hedgeSemantics?.roundedHedgeQuantity).toBe('8.750');
    expect(perpRoute?.hedgeSemantics?.side).toBe('sell');
    expect(perpRoute?.hedgeSemantics?.resultingIntendedDelta).toBe('+3.75000000 BNB (30.0% unhedged)');

    // Leverage derivation:
    // Notional = 8.75 * 751.04 = $6,571.60 USDT
    // Collateral = $5,000.00 USDT
    // Required leverage = 6571.60 / 5000.00 = 1.3143... -> 1.31x
    expect(perpRoute?.hedgeSemantics?.hedgeNotionalUsdt).toBe('6571.60');
    expect(perpRoute?.hedgeSemantics?.availableCollateralUsdt).toBe('5000.00');
    expect(perpRoute?.hedgeSemantics?.requiredLeverage).toBe('1.31');
    expect(perpRoute?.leverage).toBe('1.31');
  });

  it('rejects route with LEVERAGE_LIMIT when actual required leverage exceeds user ceiling', () => {
    const tightIntent: ExecutionIntent = {
      version: '1',
      objective: 'hedge',
      asset: 'BNB',
      amount: { type: 'exposure_fraction', value: '0.7' },
      horizon: { value: 24, unit: 'hours' },
      must_retain_underlying: true,
      max_leverage: '1.0', // 1.31x required exceeds 1.0x ceiling!
      urgency: 'normal',
    };

    const routes = generateAndEvaluateRoutes({
      intent: tightIntent,
      snapshot: baseSnapshot,
    });

    const perpRoute = routes.find((r) => r.kind === 'usd_m_perp');
    expect(perpRoute).toBeDefined();
    expect(perpRoute?.status).toBe('REJECTED');
    expect(perpRoute?.rejection?.code).toBe('LEVERAGE_LIMIT');
    expect(perpRoute?.rejection?.message).toContain('exceeds your limit of 1.0x');
  });

  it('fails closed with COLLATERAL_STATE_UNAVAILABLE when available collateral cannot be determined', () => {
    const noCollateralSnapshot: ComparisonSnapshot = {
      ...baseSnapshot,
      account: {
        ...baseSnapshot.account,
        balances: {
          BNB: { asset: 'BNB', free: '12.50000000', locked: '0.00000000' },
          // No USDT balance!
        },
      },
      usdM: {
        ...baseSnapshot.usdM!,
        availableMargin: undefined, // No available margin!
      },
    };

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
      snapshot: noCollateralSnapshot,
    });

    const perpRoute = routes.find((r) => r.kind === 'usd_m_perp');
    expect(perpRoute).toBeDefined();
    expect(perpRoute?.status).toBe('REJECTED');
    expect(perpRoute?.rejection?.code).toBe('COLLATERAL_STATE_UNAVAILABLE');
    expect(perpRoute?.rejection?.message).toContain('Authoritative collateral balance unavailable');
  });
});
