import {
  McpCaller,
  SpotTickerPriceResponse,
  SpotDepthResponse,
  SpotAccountResponse,
  ConvertQuoteResponse,
  ApiKeyPermissionResponse,
  FuturesUsdsAccountResponse,
  FuturesPremiumIndexKline,
  MarginAccountDetailsResponse,
} from './types.js';

export interface SpotBookRequest {
  symbol: string;
  limit?: number;
}

export interface ConvertQuoteRequest {
  fromAsset: string;
  toAsset: string;
  fromAmount?: string;
  toAmount?: string;
}

export interface BinanceMarketAdapter {
  getSpotPrice(symbol: string): Promise<SpotTickerPriceResponse>;
  getSpotDepth(input: SpotBookRequest): Promise<SpotDepthResponse>;
  getConvertQuote(input: ConvertQuoteRequest): Promise<ConvertQuoteResponse>;
  getUsdMMarkPrice(symbol: string): Promise<string>;
  getUsdMFunding(symbol: string): Promise<{ rateBps: string; intervalHours: number; timestamp: number }>;
}

export interface BinanceAccountAdapter {
  getSpotAccount(): Promise<SpotAccountResponse>;
  getUsdMAccount(): Promise<FuturesUsdsAccountResponse>;
  getApiKeyPermissions(): Promise<ApiKeyPermissionResponse>;
  getMarginAccount(): Promise<MarginAccountDetailsResponse>;
}

export class BinanceAgentOsAdapter implements BinanceMarketAdapter, BinanceAccountAdapter {
  private caller: McpCaller;

  constructor(caller: McpCaller) {
    this.caller = caller;
  }

  // --- MARKET READS ---

  async getSpotPrice(symbol: string): Promise<SpotTickerPriceResponse> {
    return this.caller.callTool<SpotTickerPriceResponse>('spot.tickerPrice', { symbol });
  }

  async getSpotDepth(input: SpotBookRequest): Promise<SpotDepthResponse> {
    return this.caller.callTool<SpotDepthResponse>('spot.depth', {
      symbol: input.symbol,
      limit: input.limit ?? 20,
    });
  }

  async getConvertQuote(input: ConvertQuoteRequest): Promise<ConvertQuoteResponse> {
    const args: Record<string, unknown> = {
      fromAsset: input.fromAsset,
      toAsset: input.toAsset,
    };
    if (input.fromAmount) args.fromAmount = input.fromAmount;
    if (input.toAmount) args.toAmount = input.toAmount;

    return this.caller.callTool<ConvertQuoteResponse>('convert.sendQuoteRequest', args);
  }

  async getUsdMMarkPrice(symbol: string): Promise<string> {
    const klines = await this.caller.callTool<Array<[number, string, string, string, string]>>(
      'futures_usds.markPriceKlineCandlestickData',
      {
        symbol,
        interval: '1h',
        limit: 1,
      }
    );
    if (klines && klines.length > 0) {
      // Close mark price
      return klines[0][4];
    }
    // Fallback to ticker
    const ticker = await this.caller.callTool<{ symbol: string; price: string }>(
      'futures_usds.symbolPriceTicker',
      { symbol }
    );
    return ticker.price;
  }

  async getUsdMFunding(symbol: string): Promise<{ rateBps: string; intervalHours: number; timestamp: number }> {
    const klines = await this.caller.callTool<FuturesPremiumIndexKline[]>(
      'futures_usds.premiumIndexKlineData',
      {
        symbol,
        interval: '1h',
        limit: 1,
      }
    );
    if (!klines || klines.length === 0) {
      throw new Error(`Failed to read premium index / funding for ${symbol}`);
    }
    const latest = klines[klines.length - 1];
    const closePremium = latest[4]; // Close premium index
    const timestamp = latest[0];

    // Premium index decimal to basis points: e.g. 0.0001 = 1 bps
    const rateBps = (parseFloat(closePremium) * 10000).toFixed(2);
    return {
      rateBps,
      intervalHours: 8,
      timestamp,
    };
  }

  // --- ACCOUNT READS ---

  async getSpotAccount(): Promise<SpotAccountResponse> {
    return this.caller.callTool<SpotAccountResponse>('spot.getAccount', {});
  }

  async getUsdMAccount(): Promise<FuturesUsdsAccountResponse> {
    return this.caller.callTool<FuturesUsdsAccountResponse>('futures_usds.accountInformationV3', {});
  }

  async getApiKeyPermissions(): Promise<ApiKeyPermissionResponse> {
    return this.caller.callTool<ApiKeyPermissionResponse>('wallet.getApiKeyPermission', {});
  }

  async getMarginAccount(): Promise<MarginAccountDetailsResponse> {
    return this.caller.callTool<MarginAccountDetailsResponse>('margin.queryCrossMarginAccountDetails', {});
  }
}
