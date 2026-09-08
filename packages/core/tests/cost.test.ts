import { describe, it, expect } from 'vitest';
import {
  calculateSpotCost,
  calculateConvertCost,
  calculateUsdMCost,
} from '../src/cost/index.js';

describe('Cost Engine', () => {
  it('calculates Spot cost including book slippage and taker fee', () => {
    const walk = {
      filledBaseQuantity: '1.00000000',
      spentOrReceivedQuote: '750.75000000',
      vwap: '750.75000000',
      levelsConsumed: 1,
      sufficientDepth: true,
    };
    const midPrice = '750.00000000';
    const feeBps = '10.00'; // 10 bps

    const cost = calculateSpotCost(walk, midPrice, feeBps, 'buy');
    expect(cost.status).toBe('COMPLETE');
    expect(cost.feeBps).toBe('10.00');
    expect(cost.slippageBps).toBe('10.00'); // (750.75 - 750)/750 = 0.001 = 10 bps
    expect(cost.observedExecutionCostBps).toBe('20.00');
  });

  it('calculates Convert cost from quote delta against spot reference', () => {
    const effectivePrice = '751.50000000';
    const referencePrice = '750.00000000';

    const cost = calculateConvertCost(effectivePrice, referencePrice, 'buy', 'quote-123');
    expect(cost.status).toBe('COMPLETE');
    expect(cost.feeBps).toBe('0.00');
    // Delta = (751.5 - 750) / 750 = 0.002 = 20 bps
    expect(cost.observedExecutionCostBps).toBe('20.00');
    expect(cost.convertQuoteDeltaBps).toBe('20.00');
  });

  it('separates USD-M observed cost and estimated horizon funding carry', () => {
    const markPrice = '750.00';
    const fundingRateBps = '1.50'; // 1.5 bps per 8h interval
    const fundingIntervalHours = 8;
    const takerFeeBps = '5.00';
    const horizon = { value: 24, unit: 'hours' as const };

    const { execution, carry } = calculateUsdMCost(
      markPrice,
      fundingRateBps,
      fundingIntervalHours,
      takerFeeBps,
      horizon
    );

    // Observed immediate execution
    expect(execution.status).toBe('COMPLETE');
    expect(execution.observedExecutionCostBps).toBe('5.00');

    // Estimated carry over 24h = 3 intervals * 1.5 bps = 4.5 bps
    expect(carry).toBeDefined();
    expect(carry?.status).toBe('COMPLETE');
    expect(carry?.assumption).toContain('Estimated 24h carry if the current 8h funding rate persisted');
    expect(carry?.assumption).toContain('(scenario only, not a known future cost)');
  });
});
