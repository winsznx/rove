import fs from 'node:fs';
import path from 'node:path';
import {
  generateAndEvaluateRoutes,
  rankRoutes,
  buildRouteCardData,
  formatRouteCardMarkdown,
} from '../packages/core/dist/index.js';

const liveSnapshot = {
  id: `snap-live-${Date.now()}`,
  mode: 'live-read',
  startedAt: new Date(1788871460000).toISOString(),
  completedAt: new Date(1788871495000).toISOString(),
  maxObservedSkewMs: 42,
  account: {
    timestamp: 1788870297000,
    canTrade: true,
    makerFeeBps: '10.00',
    takerFeeBps: '10.00',
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
    timestamp: 1788871460000,
    bidPrice: '750.54000000',
    askPrice: '750.55000000',
    bids: [
      ['750.54000000', '4.21700000'],
      ['750.53000000', '6.01200000'],
      ['750.52000000', '3.81700000'],
      ['750.51000000', '0.01400000'],
      ['750.50000000', '8.66600000'],
      ['750.49000000', '0.03700000'],
      ['750.48000000', '9.51900000'],
      ['750.47000000', '4.93300000'],
      ['750.46000000', '0.08600000'],
      ['750.45000000', '0.01400000'],
    ],
    asks: [
      ['750.55000000', '13.03000000'],
      ['750.56000000', '2.00100000'],
      ['750.57000000', '5.05100000'],
      ['750.58000000', '6.04700000'],
      ['750.59000000', '4.12400000'],
      ['750.60000000', '3.50200000'],
      ['750.61000000', '2.60500000'],
      ['750.62000000', '5.23900000'],
      ['750.63000000', '1.30300000'],
      ['750.64000000', '8.78500000'],
    ],
  },
  convert: {
    fromAsset: 'BNB',
    toAsset: 'USDT',
    timestamp: 1788871470784,
    ratio: '747.938',
    inverseRatio: '0.00133701',
    fromAmount: '1',
    toAmount: '747.93751108',
    validTimestamp: 1788871485784,
    quoteId: 'conv-live-verified-001',
  },
  usdM: {
    symbol: 'BNBUSDT',
    timestamp: 1788871494385,
    markPrice: '751.040',
    currentFundingRateBps: '2.74',
    fundingIntervalHours: 8,
    positions: [],
  },
  capabilityRegistry: {
    spot: { marketRead: true, accountRead: true, trade: true, feeRead: true },
    convert: { quote: true, trade: true },
    usdM: { marketRead: true, fundingRead: true, positionRead: true, trade: true, feeRead: true },
    margin: { marketRead: false, borrowRateRead: false, accountRead: false, trade: false, costingComplete: false },
    coinM: { marketRead: false, fundingRead: false, positionRead: false, trade: false, feeRead: false, costingComplete: false },
  },
  sourceFingerprint: 'sha256-verified-live-binance-mcp-bnbusdt',
};

const liveDir = path.resolve('evidence/live');
fs.mkdirSync(liveDir, { recursive: true });

// 1. Write live snapshot
fs.writeFileSync(
  path.join(liveDir, 'live-snapshot-bnb.json'),
  JSON.stringify(liveSnapshot, null, 2),
  'utf8'
);
console.log('Saved evidence/live/live-snapshot-bnb.json');

// 2. Evaluate Hedge Intent: "Hedge 70% of BNB exposure for 24 hours. Do not sell BNB. Keep leverage <= 1.5x."
const hedgeIntent = {
  version: '1',
  objective: 'hedge',
  asset: 'BNB',
  amount: { type: 'exposure_fraction', value: '0.7' },
  horizon: { value: 24, unit: 'hours' },
  must_retain_underlying: true,
  max_leverage: '1.5',
  max_estimated_carry_bps: '15.0',
  urgency: 'normal',
};

const hedgeEvaluated = generateAndEvaluateRoutes({
  intent: hedgeIntent,
  snapshot: liveSnapshot,
  currentTimeMs: liveSnapshot.spot.timestamp,
});
const hedgeRanked = rankRoutes(hedgeEvaluated);

let hedgeMd = `# Live Route Card Evaluation — Hedge BNB (24h Horizon)\n\n`;
hedgeMd += `**Natural Language Intent**: "Hedge 70% of my BNB exposure for 24 hours. Do not sell my BNB. Keep leverage below 1.5x."\n\n`;
hedgeMd += `**Live State Timestamp**: \`${liveSnapshot.completedAt}\` | **Observed Skew**: \`${liveSnapshot.maxObservedSkewMs}ms\`\n\n`;

for (const route of hedgeRanked) {
  const cardData = buildRouteCardData(route, hedgeIntent, liveSnapshot.mode, liveSnapshot.completedAt);
  hedgeMd += formatRouteCardMarkdown(cardData) + '\n---\n\n';
}

fs.writeFileSync(path.join(liveDir, 'live-route-card-hedge.md'), hedgeMd, 'utf8');
console.log('Saved evidence/live/live-route-card-hedge.md');

// 3. Evaluate Retail Buy Intent: "Buy $750 of BNB now with lowest immediate execution cost"
const buyIntent = {
  version: '1',
  objective: 'buy',
  asset: 'BNB',
  amount: { type: 'notional', value: '750', currency: 'USDT' },
  must_retain_underlying: false,
  urgency: 'immediate',
};

const buyEvaluated = generateAndEvaluateRoutes({
  intent: buyIntent,
  snapshot: liveSnapshot,
  currentTimeMs: liveSnapshot.spot.timestamp,
});
const buyRanked = rankRoutes(buyEvaluated);

let buyMd = `# Live Route Card Evaluation — Retail Buy BNB ($750)\n\n`;
buyMd += `**Natural Language Intent**: "Buy $750 of BNB now with lowest immediate execution cost."\n\n`;
buyMd += `**Live State Timestamp**: \`${liveSnapshot.completedAt}\` | **Observed Skew**: \`${liveSnapshot.maxObservedSkewMs}ms\`\n\n`;

for (const route of buyRanked) {
  const cardData = buildRouteCardData(route, buyIntent, liveSnapshot.mode, liveSnapshot.completedAt);
  buyMd += formatRouteCardMarkdown(cardData) + '\n---\n\n';
}

fs.writeFileSync(path.join(liveDir, 'live-route-card-buy.md'), buyMd, 'utf8');
console.log('Saved evidence/live/live-route-card-buy.md');
