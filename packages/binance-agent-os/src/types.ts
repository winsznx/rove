export interface McpCaller {
  callTool<T = any>(name: string, args?: Record<string, unknown>): Promise<T>;
}

export type SpotTickerPriceResponse = {
  symbol: string;
  price: string;
};

export type SpotDepthResponse = {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
};

export type SpotAccountBalance = {
  asset: string;
  free: string;
  locked: string;
};

export type SpotAccountResponse = {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  commissionRates: {
    maker: string;
    taker: string;
    buyer: string;
    seller: string;
  };
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: SpotAccountBalance[];
};

export type ConvertQuoteResponse = {
  ratio: string;
  inverseRatio: string;
  validTimestamp: number;
  toAmount: string;
  fromAmount: string;
  quoteId?: string;
};

export type ApiKeyPermissionResponse = {
  ipRestrict: boolean;
  createTime: number;
  enableReading: boolean;
  enableFutures: boolean;
  enableSpotAndMarginTrading: boolean;
  enableWithdrawals: boolean;
  enableInternalTransfer: boolean;
  permitsUniversalTransfer: boolean;
  enableVanillaOptions: boolean;
  enablePortfolioMarginTrading: boolean;
  enableFixApiTrade: boolean;
  enableFixReadOnly: boolean;
  enableMargin: boolean;
};

export type FuturesUsdsAccountResponse = {
  totalInitialMargin: string;
  totalMaintMargin: string;
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  totalMarginBalance: string;
  availableBalance: string;
  assets: Array<{
    asset: string;
    walletBalance: string;
    unrealizedProfit: string;
    marginBalance: string;
    availableBalance: string;
  }>;
  positions: Array<{
    symbol: string;
    positionAmt: string;
    entryPrice: string;
    unrealizedProfit: string;
    leverage: string;
    isolated: boolean;
  }>;
};

export type FuturesPremiumIndexKline = [
  openTime: number,
  open: string,
  high: string,
  low: string,
  close: string,
  volume: string,
  closeTime: number,
  quoteVolume: string,
  count: number,
  takerBuyVolume: string,
  takerBuyQuoteVolume: string,
  ignore: string
];

export type MarginAccountDetailsResponse = {
  tradeEnabled: boolean;
  transferEnabled: boolean;
  borrowEnabled: boolean;
  marginLevel: string;
  created: boolean;
  userAssets: Array<{
    asset: string;
    free: string;
    locked: string;
    borrowed: string;
    interest: string;
    netAsset: string;
  }>;
};
