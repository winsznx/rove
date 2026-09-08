import { describe, it, expect } from 'vitest';
import { walkOrderBook, BookLevel } from '../src/orderbook/index.js';

describe('Deterministic Order Book Walker', () => {
  const asks: BookLevel[] = [
    ['750.00', '1.0'],
    ['751.00', '2.0'],
    ['752.00', '5.0'],
  ];

  const bids: BookLevel[] = [
    ['749.00', '1.5'],
    ['748.00', '2.5'],
    ['747.00', '10.0'],
  ];

  it('walks buy order across asks from lowest upward', () => {
    // Buy 2.0 BNB
    // Level 1: 1.0 @ 750 = 750
    // Level 2: 1.0 @ 751 = 751
    // Total spent = 1501. VWAP = 1501 / 2 = 750.5
    const res = walkOrderBook({
      side: 'buy',
      requestedBaseQuantity: '2.0',
      bids,
      asks,
    });

    expect(res.sufficientDepth).toBe(true);
    expect(res.filledBaseQuantity).toBe('2.00000000');
    expect(res.spentOrReceivedQuote).toBe('1501.00000000');
    expect(res.vwap).toBe('750.50000000');
    expect(res.levelsConsumed).toBe(2);
  });

  it('walks sell order across bids from highest downward', () => {
    // Sell 3.0 BNB
    // Level 1: 1.5 @ 749 = 1123.5
    // Level 2: 1.5 @ 748 = 1122.0
    // Total quote = 2245.5. VWAP = 2245.5 / 3 = 748.5
    const res = walkOrderBook({
      side: 'sell',
      requestedBaseQuantity: '3.0',
      bids,
      asks,
    });

    expect(res.sufficientDepth).toBe(true);
    expect(res.filledBaseQuantity).toBe('3.00000000');
    expect(res.spentOrReceivedQuote).toBe('2245.50000000');
    expect(res.vwap).toBe('748.50000000');
    expect(res.levelsConsumed).toBe(2);
  });

  it('flags insufficient depth when order exceeds visible liquidity', () => {
    // Ask total quantity is 1 + 2 + 5 = 8.0. Request 10.0
    const res = walkOrderBook({
      side: 'buy',
      requestedBaseQuantity: '10.0',
      bids,
      asks,
    });

    expect(res.sufficientDepth).toBe(false);
    expect(res.filledBaseQuantity).toBe('8.00000000');
    expect(res.levelsConsumed).toBe(3);
  });

  it('walks notional quote amount accurately', () => {
    // Buy with $1501 USDT quote notional
    const res = walkOrderBook({
      side: 'buy',
      requestedQuoteNotional: '1501.00',
      bids,
      asks,
    });

    expect(res.sufficientDepth).toBe(true);
    expect(res.spentOrReceivedQuote).toBe('1501.00000000');
    expect(res.filledBaseQuantity).toBe('2.00000000');
    expect(res.vwap).toBe('750.50000000');
  });
});
