import { describe, it, expect } from 'vitest';
import {
  BinanceAgentOsAdapter,
  SnapshotCollector,
  OrderExecutor,
  McpCaller,
} from '../src/index.js';
import { ExecutionIntent, RoutePath } from '@rove/core';

class MockMcpCaller implements McpCaller {
  public calls: Array<{ name: string; args?: Record<string, unknown> }> = [];

  async callTool<T = any>(name: string, args?: Record<string, unknown>): Promise<T> {
    this.calls.push({ name, args });

    if (name === 'spot.tickerPrice') {
      return { symbol: args?.symbol, price: '750.00' } as T;
    }
    if (name === 'spot.depth') {
      return {
        lastUpdateId: 1000,
        bids: [['749.50', '10.0']],
        asks: [['750.50', '10.0']],
      } as T;
    }
    if (name === 'spot.getAccount') {
      return {
        makerCommission: 10,
        takerCommission: 10,
        canTrade: true,
        updateTime: Date.now(),
        accountType: 'SPOT',
        balances: [{ asset: 'BNB', free: '5.0', locked: '0' }],
      } as T;
    }
    if (name === 'convert.sendQuoteRequest') {
      return {
        ratio: '749.80',
        inverseRatio: '0.00133368',
        validTimestamp: Date.now() + 10000,
        toAmount: '749.80',
        fromAmount: '1.0',
        quoteId: 'mock-quote-123',
      } as T;
    }
    if (name === 'futures_usds.markPriceKlineCandlestickData') {
      return [[1000, '750.0', '751.0', '749.0', '750.20']] as T;
    }
    if (name === 'futures_usds.premiumIndexKlineData') {
      return [[Date.now(), '0.0001', '0.0002', '0.00005', '0.00012', '0', 0, '0', 1, '0', '0', '0']] as T;
    }
    if (name === 'futures_usds.accountInformationV3') {
      return {
        totalWalletBalance: '1000.0',
        availableBalance: '1000.0',
        positions: [],
      } as T;
    }
    if (name === 'wallet.getApiKeyPermission') {
      return {
        enableReading: true,
        enableFutures: true,
        enableSpotAndMarginTrading: true,
        enableWithdrawals: false,
        permitsUniversalTransfer: true,
        enableMargin: false,
      } as T;
    }

    throw new Error(`Unhandled mock tool call: ${name}`);
  }
}

describe('BinanceAgentOsAdapter & SnapshotCollector', () => {
  it('collects multi-path snapshot with bounded skew', async () => {
    const caller = new MockMcpCaller();
    const adapter = new BinanceAgentOsAdapter(caller);
    const collector = new SnapshotCollector(adapter, {
      spot: { marketRead: true, accountRead: true, trade: true, feeRead: true },
      convert: { quote: true, trade: true },
      usdM: { marketRead: true, fundingRead: true, positionRead: true, trade: true, feeRead: true },
      margin: { marketRead: false, borrowRateRead: false, accountRead: false, trade: false, costingComplete: false },
      coinM: { marketRead: false, fundingRead: false, positionRead: false, trade: false, feeRead: false, costingComplete: false },
    });

    const snapshot = await collector.captureSnapshot({
      asset: 'BNB',
      maxSkewMs: 1000,
    });

    expect(snapshot.spot?.symbol).toBe('BNBUSDT');
    expect(snapshot.convert?.ratio).toBe('749.80');
    expect(snapshot.usdM?.markPrice).toBe('750.20');
    expect(snapshot.account.takerFeeBps).toBe('10.00');
    expect(snapshot.maxObservedSkewMs).toBeLessThanOrEqual(1000);
  });

  it('prepares order deterministically and aborts if user declines', async () => {
    const caller = new MockMcpCaller();
    const executor = new OrderExecutor(caller, false);

    const intent: ExecutionIntent = {
      version: '1',
      objective: 'buy',
      asset: 'BNB',
      amount: { type: 'notional', value: '750', currency: 'USDT' },
      must_retain_underlying: false,
      urgency: 'normal',
    };

    const route: RoutePath = {
      id: 'spot-BNB-USDT',
      kind: 'spot',
      status: 'SELECTED',
      side: 'buy',
      baseAsset: 'BNB',
      quoteAsset: 'USDT',
      requestedNotional: '750',
      execution: { expectedFillPrice: '750.50', observedExecutionCostBps: '12.0', components: [], status: 'COMPLETE' },
      constraints: [],
      snapshotId: 'snap-1',
    };

    const snapshot: any = {
      sourceFingerprint: 'hash-123',
    };

    const prepared = executor.prepareOrder(intent, route, snapshot);
    expect(prepared.symbol).toBe('BNBUSDT');
    expect(prepared.side).toBe('buy');
    expect(prepared.orderType).toBe('MARKET');

    // User rejects confirmation
    const outcome = await executor.submitOrder(prepared, false, {
      intentId: 'intent-1',
      routeId: route.id,
      snapshotId: 'snap-1',
    });

    expect(outcome.result.success).toBe(false);
    expect(outcome.receipt.finalState).toBe('USER_REJECTED');
  });

  it('prevents live order submission when ROVE_ENABLE_LIVE_TRADE=false', async () => {
    const caller = new MockMcpCaller();
    // Live trading is FALSE
    const executor = new OrderExecutor(caller, false);

    const intent: ExecutionIntent = {
      version: '1',
      objective: 'buy',
      asset: 'BNB',
      amount: { type: 'notional', value: '750', currency: 'USDT' },
      must_retain_underlying: false,
      urgency: 'normal',
    };

    const route: RoutePath = {
      id: 'spot-BNB-USDT',
      kind: 'spot',
      status: 'SELECTED',
      side: 'buy',
      baseAsset: 'BNB',
      quoteAsset: 'USDT',
      requestedNotional: '750',
      execution: { expectedFillPrice: '750.50', observedExecutionCostBps: '12.0', components: [], status: 'COMPLETE' },
      constraints: [],
      snapshotId: 'snap-1',
    };

    const prepared = executor.prepareOrder(intent, route, { sourceFingerprint: 'hash-123' } as any);

    // User approves, but safety gate prevents execution
    const outcome = await executor.submitOrder(prepared, true, {
      intentId: 'intent-1',
      routeId: route.id,
      snapshotId: 'snap-1',
    });

    expect(outcome.result.success).toBe(true);
    expect(outcome.receipt.finalState).toBe('PREPARED');
    expect(outcome.result.error).toContain('Live trade submission disabled');
    // Ensure spot.newOrder was NOT called
    expect(caller.calls.some((c) => c.name === 'spot.newOrder')).toBe(false);
  });
});
