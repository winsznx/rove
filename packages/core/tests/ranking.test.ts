import { describe, it, expect } from 'vitest';
import { rankRoutes } from '../src/ranking/index.js';
import { RoutePath } from '../src/routes/index.js';

describe('Deterministic Route Ranking Engine', () => {
  it('ranks valid survivor as SELECTED over rejected routes', () => {
    const routes: RoutePath[] = [
      {
        id: 'spot-1',
        kind: 'spot',
        status: 'REJECTED',
        side: 'sell',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        constraints: [],
        rejection: {
          code: 'RETAIN_UNDERLYING_CONFLICT',
          message: 'Sells protected asset',
        },
        snapshotId: 'snap-1',
      },
      {
        id: 'usd-m-1',
        kind: 'usd_m_perp',
        status: 'VALID',
        side: 'sell',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        execution: {
          observedExecutionCostBps: '5.00',
          components: [],
          status: 'COMPLETE',
        },
        constraints: [],
        snapshotId: 'snap-1',
      },
    ];

    const ranked = rankRoutes(routes);
    expect(ranked[0].id).toBe('usd-m-1');
    expect(ranked[0].status).toBe('SELECTED');
    expect(ranked[1].status).toBe('REJECTED');
  });

  it('ranks lower observed execution cost first when both are valid', () => {
    const routes: RoutePath[] = [
      {
        id: 'convert-1',
        kind: 'convert',
        status: 'VALID',
        side: 'buy',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        execution: {
          observedExecutionCostBps: '12.00',
          components: [],
          status: 'COMPLETE',
        },
        constraints: [],
        snapshotId: 'snap-1',
      },
      {
        id: 'spot-1',
        kind: 'spot',
        status: 'VALID',
        side: 'buy',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        execution: {
          observedExecutionCostBps: '8.50', // Cheaper
          components: [],
          status: 'COMPLETE',
        },
        constraints: [],
        snapshotId: 'snap-1',
      },
    ];

    const ranked = rankRoutes(routes);
    expect(ranked[0].id).toBe('spot-1');
    expect(ranked[0].status).toBe('SELECTED');
    expect(ranked[1].id).toBe('convert-1');
    expect(ranked[1].status).toBe('VALID');
  });

  it('uses operational complexity as deterministic tie-breaker when costs are equal', () => {
    const routes: RoutePath[] = [
      {
        id: 'spot-1',
        kind: 'spot',
        status: 'VALID',
        side: 'buy',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        execution: {
          observedExecutionCostBps: '10.00',
          components: [],
          status: 'COMPLETE',
        },
        quoteFreshnessMs: 50,
        constraints: [],
        snapshotId: 'snap-1',
      },
      {
        id: 'convert-1',
        kind: 'convert',
        status: 'VALID',
        side: 'buy',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        execution: {
          observedExecutionCostBps: '10.00', // Equal cost
          components: [],
          status: 'COMPLETE',
        },
        quoteFreshnessMs: 50, // Equal freshness
        constraints: [],
        snapshotId: 'snap-1',
      },
    ];

    const ranked = rankRoutes(routes);
    // Convert is rank 1 (less complex than Spot book walk)
    expect(ranked[0].id).toBe('convert-1');
    expect(ranked[0].status).toBe('SELECTED');
  });
});
