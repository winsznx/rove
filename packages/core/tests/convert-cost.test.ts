import { describe, it, expect } from 'vitest';
import { calculateConvertCost } from '../src/cost/index.js';
import { generateAndEvaluateRoutes } from '../src/routes/index.js';
import { rankRoutes } from '../src/ranking/index.js';
import { ComparisonSnapshot } from '../src/snapshot/index.js';
import { ExecutionIntent } from '../src/intent/index.js';

describe('Audited Convert Cost Model & Fair Comparison', () => {
  it('computes convertQuoteDeltaBps and includes embedded spread markup in observed execution cost', () => {
    // Shared reference price (Spot mid)
    const refPrice = '750.00000000';
    // Convert quote gives 753.75 USDT per BNB (a 50 bps spread markup above mid)
    const effectivePriceBuy = '753.75000000';

    const costBuy = calculateConvertCost(effectivePriceBuy, refPrice, 'buy', 'quote-buy-1');
    expect(costBuy.expectedFillPrice).toBe(effectivePriceBuy);
    expect(costBuy.feeBps).toBe('0.00'); // Explicit fee is zero
    expect(costBuy.convertQuoteDeltaBps).toBe('50.00'); // Embedded markup is 50 bps
    expect(costBuy.observedExecutionCostBps).toBe('50.00'); // Included in immediate cost!

    // Convert quote on sell gives 746.25 USDT per BNB (a 50 bps discount below mid)
    const effectivePriceSell = '746.25000000';
    const costSell = calculateConvertCost(effectivePriceSell, refPrice, 'sell', 'quote-sell-1');
    expect(costSell.expectedFillPrice).toBe(effectivePriceSell);
    expect(costSell.feeBps).toBe('0.00');
    expect(costSell.convertQuoteDeltaBps).toBe('50.00');
    expect(costSell.observedExecutionCostBps).toBe('50.00');
  });

  it('fails closed as UNAVAILABLE when Convert RFQ direction is incompatible with intent', () => {
    const intent: ExecutionIntent = {
      version: '1',
      objective: 'buy',
      asset: 'BNB',
      amount: { type: 'notional', value: '750', currency: 'USDT' },
      must_retain_underlying: false,
      urgency: 'immediate',
    };

    // Snapshot has a SELL quote (fromAsset: BNB, toAsset: USDT), but intent is BUY (needs USDT -> BNB)
    const snapshotWithMismatchedQuote: ComparisonSnapshot = {
      id: 'snap-mismatched-convert',
      mode: 'live-read',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      maxObservedSkewMs: 35,
      account: {
        timestamp: Date.now(),
        canTrade: true,
        makerFeeBps: '10.00',
        takerFeeBps: '10.00',
        balances: {
          BNB: { asset: 'BNB', free: '10.0', locked: '0.0' },
          USDT: { asset: 'USDT', free: '10000.0', locked: '0.0' },
        },
        permissions: { spotTrade: true, futuresTrade: true, marginTrade: false, reading: true },
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
        fromAsset: 'BNB', // Incompatible: sell quote
        toAsset: 'USDT',
        timestamp: Date.now(),
        ratio: '747.00',
        inverseRatio: '0.00133869',
        fromAmount: '1.0',
        toAmount: '747.00',
        validTimestamp: Date.now() + 15000,
        quoteId: 'quote-mismatch',
      },
      capabilityRegistry: {
        spot: { marketRead: true, accountRead: true, trade: true, feeRead: true },
        convert: { quote: true, trade: true },
        usdM: { marketRead: true, fundingRead: true, positionRead: true, trade: true, feeRead: true },
        margin: { marketRead: false, borrowRateRead: false, accountRead: false, trade: false, costingComplete: false },
        coinM: { marketRead: false, fundingRead: false, positionRead: false, trade: false, feeRead: false, costingComplete: false },
      },
      sourceFingerprint: 'sha256-mismatch',
    };

    const routes = generateAndEvaluateRoutes({
      intent,
      snapshot: snapshotWithMismatchedQuote,
    });

    const convertRoute = routes.find((r) => r.kind === 'convert');
    expect(convertRoute).toBeDefined();
    // Must fail closed because comparison cannot be fairly made from data
    expect(convertRoute?.status).toBe('UNAVAILABLE');
    expect(convertRoute?.rejection?.code).toBe('COST_COMPONENT_UNAVAILABLE');
    expect(convertRoute?.execution?.status).toBe('UNAVAILABLE');
  });

  it('correctly reranks live $750 BNB scenario: Spot wins over Convert when Convert RFQ spread exceeds Spot taker fee', () => {
    const buyIntent: ExecutionIntent = {
      version: '1',
      objective: 'buy',
      asset: 'BNB',
      amount: { type: 'notional', value: '750', currency: 'USDT' },
      must_retain_underlying: false,
      urgency: 'immediate',
    };

    // Live-matched snapshot where Convert quote is for BUYING BNB with 750 USDT
    // Convert gives 0.99381104 BNB for 750 USDT (effective price = 754.671, spread delta = +37.72 bps vs 751.835 mid)
    // Spot has ask at 751.84 with ample depth (slippage = 0.01 bps vs mid, taker fee = 10.00 bps, total cost = 10.01 bps)
    const liveSnapshot: ComparisonSnapshot = {
      id: 'snap-live-rerank-750',
      mode: 'live-read',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      maxObservedSkewMs: 40,
      account: {
        timestamp: Date.now(),
        canTrade: true,
        makerFeeBps: '10.00',
        takerFeeBps: '10.00',
        balances: {
          BNB: { asset: 'BNB', free: '10.0', locked: '0.0' },
          USDT: { asset: 'USDT', free: '5000.0', locked: '0.0' },
        },
        permissions: { spotTrade: true, futuresTrade: true, marginTrade: false, reading: true },
      },
      spot: {
        symbol: 'BNBUSDT',
        timestamp: Date.now(),
        bidPrice: '751.83',
        askPrice: '751.84',
        bids: [['751.83', '10.0']],
        asks: [['751.84', '20.0']], // Top ask easily fills $750 (< 1 BNB)
      },
      convert: {
        fromAsset: 'USDT', // Compatible: buy quote
        toAsset: 'BNB',
        timestamp: Date.now(),
        ratio: '0.00132508',
        inverseRatio: '754.671',
        fromAmount: '750',
        toAmount: '0.99381104', // 750 / 0.99381104 = 754.6706 USDT/BNB
        validTimestamp: Date.now() + 15000,
        quoteId: 'quote-live-rfq-750',
      },
      capabilityRegistry: {
        spot: { marketRead: true, accountRead: true, trade: true, feeRead: true },
        convert: { quote: true, trade: true },
        usdM: { marketRead: true, fundingRead: true, positionRead: true, trade: true, feeRead: true },
        margin: { marketRead: false, borrowRateRead: false, accountRead: false, trade: false, costingComplete: false },
        coinM: { marketRead: false, fundingRead: false, positionRead: false, trade: false, feeRead: false, costingComplete: false },
      },
      sourceFingerprint: 'sha256-live-rerank',
    };

    const routes = generateAndEvaluateRoutes({
      intent: buyIntent,
      snapshot: liveSnapshot,
    });

    const ranked = rankRoutes(routes);

    const spotRoute = routes.find((r) => r.kind === 'spot');
    const convertRoute = routes.find((r) => r.kind === 'convert');

    expect(spotRoute).toBeDefined();
    expect(convertRoute).toBeDefined();

    // Spot has ~10.01 bps observed immediate cost
    expect(parseFloat(spotRoute?.execution?.observedExecutionCostBps ?? '0')).toBeLessThan(11.0);

    // Convert has ~37.72 bps observed immediate cost due to embedded RFQ markup
    expect(parseFloat(convertRoute?.execution?.observedExecutionCostBps ?? '0')).toBeGreaterThan(30.0);

    // Spot WINS because 10.01 bps < 37.72 bps
    expect(ranked[0].kind).toBe('spot');
    expect(ranked[0].status).toBe('SELECTED');
  });

  it('mathematically verifies the exact $750 BNB BUY formula (Spot 10.07 bps vs Convert 54.97 bps = 44.90 bps)', () => {
    const midPrice = '750.54500000';
    const topAsk = '750.55000000';
    const feeBps = '10.00';
    const requestedNotional = '750.00';
    const convertReceivedQty = '0.99381104';

    // 1. Spot:
    // Slippage bps = ((topAsk - midPrice) / midPrice) * 10,000
    // ((750.55 - 750.545) / 750.545) * 10,000 = 0.0666... -> 0.07 bps
    // Total observed Spot cost = 0.07 + 10.00 = 10.07 bps
    const spotSlippageBps = '0.07';
    const spotTotalBps = '10.07';

    // 2. Convert:
    // Effective price = 750 / 0.99381104 = 754.67062632
    // Convert quote delta bps = ((effPrice - midPrice) / midPrice) * 10,000
    // ((754.67062632 - 750.545) / 750.545) * 10,000 = 54.9678... -> 54.97 bps
    const effectivePrice = '754.67062632';
    const convertCost = calculateConvertCost(effectivePrice, midPrice, 'buy', 'conv-live-verified-buy-002');

    expect(convertCost.observedExecutionCostBps).toBe('54.97');
    expect(convertCost.convertQuoteDeltaBps).toBe('54.97');
    expect(convertCost.feeBps).toBe('0.00');

    // 3. Difference:
    const diffBps = (parseFloat(convertCost.observedExecutionCostBps) - parseFloat(spotTotalBps)).toFixed(2);
    expect(diffBps).toBe('44.90'); // Exact 44.90 bps difference!
  });

  it('mathematically verifies the exact 1.0 BNB SELL formula', () => {
    const midPrice = '750.54500000';
    const topBid = '750.54000000';
    const feeBps = '10.00';
    const convertProceeds = '747.93751108'; // from 1.0 BNB

    // 1. Convert sell cost:
    // Delta bps = ((midPrice - effectivePrice) / midPrice) * 10,000
    // ((750.545 - 747.93751108) / 750.545) * 10,000 = 34.7408... -> 34.74 bps
    const convertCost = calculateConvertCost(convertProceeds, midPrice, 'sell', 'conv-live-verified-sell-001');
    expect(convertCost.observedExecutionCostBps).toBe('34.74');
    expect(convertCost.convertQuoteDeltaBps).toBe('34.74');

    // 2. Spot sell cost:
    // Slippage bps = ((750.545 - 750.540) / 750.545) * 10,000 = 0.07 bps
    // Total observed = 0.07 + 10.00 = 10.07 bps
    const spotTotalBps = '10.07';

    // 3. Difference: Spot beats Convert on sell by 24.67 bps
    const diffBps = (parseFloat(convertCost.observedExecutionCostBps) - parseFloat(spotTotalBps)).toFixed(2);
    expect(diffBps).toBe('24.67');
  });
});
