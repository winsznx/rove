import { describe, it, expect } from 'vitest';
import { compileUserIntent, runRovePipeline } from '../src/index.js';
import { McpCaller } from '@rove/binance-agent-os';

describe('@rove/skill integration', () => {
  it('validates and compiles natural language intent envelope', () => {
    const raw = {
      version: '1',
      objective: 'hedge',
      asset: 'BNB',
      amount: { type: 'exposure_fraction', value: '0.7' },
      horizon: { value: 24, unit: 'hours' },
      must_retain_underlying: true,
      max_leverage: '1.5',
      urgency: 'normal',
    };

    const res = compileUserIntent(raw, 'Hedge 70% of BNB for 24 hours');
    expect(res.intent).toBeDefined();
    expect(res.intent?.objective).toBe('hedge');
    expect(res.missingFields.length).toBe(0);
  });

  it('detects missing fields and generates clarifying questions', () => {
    const raw = {
      objective: 'hedge',
    };

    const res = compileUserIntent(raw, 'I want to hedge');
    expect(res.intent).toBeNull();
    expect(res.missingFields).toContain('asset');
    expect(res.clarifyingQuestion).toBeDefined();
  });

  it('runs rove pipeline with mock MCP caller to generate Route Cards', async () => {
    const mockMcpCaller: McpCaller = {
      callTool: async (name: string, _args?: Record<string, unknown>) => {
        if (name === 'wallet.getApiKeyPermission') {
          return {
            enableReading: true,
            enableSpotAndMarginTrading: true,
            enableFutures: true,
            enableMargin: false,
            enableWithdrawals: false,
          };
        }
        if (name === 'spot.getAccount') {
          return {
            canTrade: true,
            makerCommission: 10,
            takerCommission: 10,
            commissionRates: { maker: '0.00100000', taker: '0.00100000' },
            balances: [
              { asset: 'BNB', free: '50.00000000', locked: '0.00000000' },
              { asset: 'USDT', free: '20000.00000000', locked: '0.00000000' },
            ],
          };
        }
        if (name === 'spot.depth') {
          return {
            lastUpdateId: 1001,
            bids: [['750.00', '10.0']],
            asks: [['750.10', '10.0']],
          };
        }
        if (name === 'spot.tickerPrice') {
          return { symbol: 'BNBUSDT', price: '750.05' };
        }
        if (name === 'convert.sendQuoteRequest') {
          return {
            ratio: '750.00',
            inverseRatio: '0.00133333',
            fromAmount: '1.0',
            toAmount: '750.00',
            validTimestamp: Date.now() + 15000,
            quoteId: 'quote-mock-123',
          };
        }
        if (name === 'futures_usds.symbolPriceTicker') {
          return { symbol: 'BNBUSDT', price: '750.00', time: Date.now() };
        }
        if (name === 'futures_usds.premiumIndexKlineData') {
          return [[Date.now(), '0.0001', '0.0001', '0.0001', '0.0001', '0', 0, '0', 0, '0', '0', '0']];
        }
        if (name === 'futures_usds.continuousContractKlineCandlestickData') {
          return [[Date.now(), '750.00', '750.00', '750.00', '750.00', '0', 0, '0', 0, '0', '0', '0']];
        }
        if (name === 'futures_usds.accountInformationV3') {
          return {
            canTrade: true,
            positions: [],
          };
        }
        return {};
      },
    };

    const intent = {
      version: '1' as const,
      objective: 'hedge' as const,
      asset: 'BNB',
      amount: { type: 'exposure_fraction' as const, value: '0.7' },
      horizon: { value: 24, unit: 'hours' as const },
      must_retain_underlying: true,
      max_leverage: '1.5',
      urgency: 'normal' as const,
    };

    const result = await runRovePipeline(intent, mockMcpCaller, {
      mode: 'live-read',
      enableLiveTrade: false,
    });

    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.winningRoute).toBeDefined();
    expect(result.winningRoute?.kind).toBe('usd_m_perp');
    expect(result.routeCardsMarkdown).toContain('USD_M_PERP');
    expect(result.preparedOrder).toBeDefined();
    expect(result.preparedOrder?.routeKind).toBe('usd_m_perp');
    expect(result.preparedOrder?.orderType).toBe('MARKET');
  });
});
