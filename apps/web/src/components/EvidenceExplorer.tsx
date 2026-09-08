import React, { useState, useMemo } from 'react';
import {
  Database,
  Layers,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  ExternalLink,
} from 'lucide-react';

export const EvidenceExplorer: React.FC = () => {
  const [toolCategory, setToolCategory] = useState<string>('all');
  const [toolSearch, setToolSearch] = useState<string>('');

  const claims = [
    {
      id: 'CLM-001',
      claim: '81 authenticated Binance Agent OS tools catalogued. Live-read path verified against production Binance. Live-trade path implemented, tested with fixtures, and safety-gated pending explicit execution verification.',
      status: 'VERIFIED_LIVE',
      artifact: 'evidence/mcp/tool-list.json',
    },
    {
      id: 'CLM-002',
      claim: 'Spot account fees are read directly from live account state rather than hardcoded.',
      status: 'VERIFIED_LIVE',
      artifact: 'evidence/mcp/capability-map.json',
    },
    {
      id: 'CLM-003',
      claim: 'Convert pricing is obtained from live quote requests; RFQ spread markup is embedded into observed execution cost.',
      status: 'VERIFIED_LIVE',
      artifact: 'evidence/mcp/capability-map.json',
    },
    {
      id: 'CLM-004',
      claim: 'USD-M perpetual funding and mark price are read live from production Binance.',
      status: 'VERIFIED_LIVE',
      artifact: 'evidence/mcp/capability-map.json',
    },
    {
      id: 'CLM-005',
      claim: 'Retain-underlying constraint deterministically rejects spot/convert selling when protecting an asset.',
      status: 'VERIFIED_TEST',
      artifact: 'packages/core/tests/constraints.test.ts',
    },
    {
      id: 'CLM-006',
      claim: 'Observed execution cost and estimated horizon carry are strictly separate data structures.',
      status: 'VERIFIED_CODE',
      artifact: 'packages/core/src/cost/',
    },
    {
      id: 'CLM-007',
      claim: 'Same snapshot + same intent + same engine version produces byte-identical ranking.',
      status: 'VERIFIED_BENCH',
      artifact: 'benchmarks/results.json',
    },
    {
      id: 'CLM-008',
      claim: 'Margin route fails closed as UNAVAILABLE when margin trading is disabled on sub-account.',
      status: 'VERIFIED_LIVE',
      artifact: 'evidence/mcp/capability-map.json',
    },
    {
      id: 'CLM-009',
      claim: 'Route Decision Change Rate of 31.6% across 2,000 evaluations (100 synthetic scenarios) vs Spot-default baseline.',
      status: 'VERIFIED_BENCH',
      artifact: 'benchmarks/results.csv',
    },
    {
      id: 'CLM-010',
      claim: 'Constraint Rescue Rate of 27.2%; on Rove Bench, the Spot-default baseline violated at least one hard intent constraint in 75.7% of evaluations, while Rove produced 0 hard-constraint violations.',
      status: 'VERIFIED_BENCH',
      artifact: 'evidence/headline.json',
    },
    {
      id: 'CLM-011',
      claim: 'Comparable Route Savings evaluated strictly on valid, economically equivalent paths (396/396 comparable evaluations) yields a median of 0.00 bps.',
      status: 'VERIFIED_BENCH',
      artifact: 'evidence/headline.json',
    },
    {
      id: 'CLM-012',
      claim: 'Multi-path live state capture operates within bounded skew (< 50ms) and zero withdrawal capability.',
      status: 'VERIFIED_LIVE',
      artifact: 'evidence/live/live-snapshot-bnb.json',
    },
  ];

  const tools = [
    // Spot (11)
    { name: 'spot.depth', category: 'spot', desc: 'Order book depth levels (bids & asks)' },
    { name: 'spot.exchangeInfo', category: 'spot', desc: 'Trading rules, symbol filters, and precisions' },
    { name: 'spot.getAccount', category: 'spot', desc: 'Account permissions, commission rates & balances' },
    { name: 'spot.getOpenOrders', category: 'spot', desc: 'Current active spot open orders' },
    { name: 'spot.getOrder', category: 'spot', desc: 'Query specific spot order status and fills' },
    { name: 'spot.klines', category: 'spot', desc: 'Historical OHLCV candlestick data' },
    { name: 'spot.myTrades', category: 'spot', desc: 'Historical trades and realized fees' },
    { name: 'spot.newOrder', category: 'spot', desc: 'Submit limit or market spot order' },
    { name: 'spot.ticker24hr', category: 'spot', desc: '24-hour price change and rolling volume statistics' },
    { name: 'spot.tickerPrice', category: 'spot', desc: 'Instantaneous latest mid price ticker' },
    { name: 'spot.deleteOrder', category: 'spot', desc: 'Cancel single active spot order' },

    // Convert (10)
    { name: 'convert.sendQuoteRequest', category: 'convert', desc: 'Request binding RFQ quote for asset swap' },
    { name: 'convert.acceptQuote', category: 'convert', desc: 'Accept and execute binding RFQ quote' },
    { name: 'convert.orderStatus', category: 'convert', desc: 'Query status of executed convert trade' },
    { name: 'convert.listAllConvertPairs', category: 'convert', desc: 'All tradable convert token pairs' },
    { name: 'convert.queryOrderQuantityPrecisionPerAsset', category: 'convert', desc: 'Precision limits per asset' },
    { name: 'convert.getConvertTradeHistory', category: 'convert', desc: 'Historical convert execution logs' },
    { name: 'convert.placeLimitOrder', category: 'convert', desc: 'Place limit order on convert RFQ engine' },
    { name: 'convert.queryLimitOpenOrders', category: 'convert', desc: 'Active convert limit orders' },
    { name: 'convert.cancelLimitOrder', category: 'convert', desc: 'Cancel convert limit order' },
    { name: 'convert.quoteStatus', category: 'convert', desc: 'Inspect validity of active RFQ quote' },

    // USD-M (16)
    { name: 'futures_usds.accountInformationV3', category: 'usd_m', desc: 'Futures account equity, margin & positions' },
    { name: 'futures_usds.premiumIndexKlineData', category: 'usd_m', desc: 'Funding rate intervals and mark premium' },
    { name: 'futures_usds.symbolPriceTicker', category: 'usd_m', desc: 'Perpetual contract latest mark ticker' },
    { name: 'futures_usds.positionInformationV2', category: 'usd_m', desc: 'Active leveraged futures positions' },
    { name: 'futures_usds.newOrder', category: 'usd_m', desc: 'Execute market or limit perpetual order' },
    { name: 'futures_usds.changeInitialLeverage', category: 'usd_m', desc: 'Set position initial leverage multiplier' },
    { name: 'futures_usds.changeMarginType', category: 'usd_m', desc: 'Toggle ISOLATED vs CROSSED margin' },
    { name: 'futures_usds.cancelOrder', category: 'usd_m', desc: 'Cancel active futures order' },
    { name: 'futures_usds.currentAllOpenOrders', category: 'usd_m', desc: 'List all open futures orders' },
    { name: 'futures_usds.exchangeInformation', category: 'usd_m', desc: 'Contract specifications and tick sizes' },
    { name: 'futures_usds.futuresAccountBalanceV3', category: 'usd_m', desc: 'Futures collateral balance breakdown' },
    { name: 'futures_usds.indexPriceKlineCandlestickData', category: 'usd_m', desc: 'Spot index constituent price klines' },
    { name: 'futures_usds.klineCandlestickData', category: 'usd_m', desc: 'Futures market trade candlestick bars' },
    { name: 'futures_usds.markPriceKlineCandlestickData', category: 'usd_m', desc: 'Mark price historical intervals' },
    { name: 'futures_usds.queryOrder', category: 'usd_m', desc: 'Query specific futures order fill state' },
    { name: 'futures_usds.continuousContractKlineCandlestickData', category: 'usd_m', desc: 'Perpetual continuous price klines' },

    // Margin (13)
    { name: 'margin.queryCrossMarginAccountDetails', category: 'margin', desc: 'Account margin level, risk & borrow capability' },
    { name: 'margin.crossMarginCollateralRatio', category: 'margin', desc: 'Collateral haircuts and discount factors' },
    { name: 'margin.getAllIsolatedMarginSymbol', category: 'margin', desc: 'Isolated margin pairs catalog' },
    { name: 'margin.getAllMarginAssets', category: 'margin', desc: 'Borrowable and collateral assets' },
    { name: 'margin.marginAccountBorrowRepay', category: 'margin', desc: 'Borrow loan or repay principal' },
    { name: 'margin.marginAccountNewOrder', category: 'margin', desc: 'Submit margin order with auto-borrow' },
    { name: 'margin.marginAccountCancelOrder', category: 'margin', desc: 'Cancel margin order' },
    { name: 'margin.queryMarginAccountsOrder', category: 'margin', desc: 'Query margin order details' },
    { name: 'margin.queryMarginAccountsOpenOrders', category: 'margin', desc: 'Active margin open orders' },
    { name: 'margin.queryMarginAccountsAllOrders', category: 'margin', desc: 'Historical margin orders' },
    { name: 'margin.queryMarginAccountsTradeList', category: 'margin', desc: 'Margin trades and interest logs' },
    { name: 'margin.queryMaxBorrow', category: 'margin', desc: 'Maximum borrowable quantity for asset' },
    { name: 'margin.marginAccountCancelAllOpenOrdersOnASymbol', category: 'margin', desc: 'Batch cancel margin orders' },

    // Wallet (11)
    { name: 'wallet.getApiKeyPermission', category: 'wallet', desc: 'Live API permissions (withdrawals disabled)' },
    { name: 'wallet.accountStatus', category: 'wallet', desc: 'Account operational and KYC state' },
    { name: 'wallet.allCoinsInformation', category: 'wallet', desc: 'Coin deposit/withdraw network status' },
    { name: 'wallet.dailyAccountSnapshot', category: 'wallet', desc: 'Historical daily asset valuation snapshots' },
    { name: 'wallet.depositAddress', category: 'wallet', desc: 'Inbound deposit addresses' },
    { name: 'wallet.depositHistory', category: 'wallet', desc: 'Inbound deposit history' },
    { name: 'wallet.queryUserUniversalTransferHistory', category: 'wallet', desc: 'Internal sub-account transfers' },
    { name: 'wallet.queryUserWalletBalance', category: 'wallet', desc: 'Universal multi-wallet balance aggregate' },
    { name: 'wallet.userUniversalTransfer', category: 'wallet', desc: 'Internal transfer between sub-accounts' },
    { name: 'wallet.withdrawHistory', category: 'wallet', desc: 'Historical external withdrawal records' },
    { name: 'sub_account.getMainAccountAsset', category: 'wallet', desc: 'Master account asset query' },
  ];

  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      if (toolCategory !== 'all' && t.category !== toolCategory) return false;
      if (toolSearch) {
        const q = toolSearch.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tools, toolCategory, toolSearch]);

  return (
    <div>
      {/* Infrastructure & Security Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card-section" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <Terminal size={18} color="var(--color-brand-dark)" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Binance Agent OS MCP</span>
          </div>
          <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            https://agent.binance.com/mcp/agentic
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
            <span className="pulse-dot" />
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-best-text)' }}>
              LIVE STREAMABLE HTTP / JSON-RPC
            </span>
          </div>
        </div>

        <div className="card-section" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <Database size={18} color="var(--color-accent-text)" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Discovered MCP Tools</span>
          </div>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            81 Tools Catalogued
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            7 Rove-critical exercised live • 1 state-gated verified • 73 dormant
          </div>
        </div>

        <div className="card-section" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <Lock size={18} color="var(--color-best)" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Non-Custodial Safety Gate</span>
          </div>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-best-text)' }}>
            0 Withdrawals
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Permissions strictly enforce <code>enableWithdrawals: false</code>
          </div>
        </div>
      </div>

      {/* Discovered Tools Explorer */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Binance Agent OS Discovered Tool Directory ({filteredTools.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Cataloged live via MCP protocol handshake during Phase 0 discovery.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', width: '200px' }}
                placeholder="Search tools..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="segmented-control" style={{ marginBottom: '1.25rem', overflowX: 'auto' }}>
          {[
            { key: 'all', label: 'All Tools (81)' },
            { key: 'spot', label: 'Spot (11)' },
            { key: 'convert', label: 'Convert (10)' },
            { key: 'usd_m', label: 'USD-M Futures (16)' },
            { key: 'margin', label: 'Margin (13)' },
            { key: 'wallet', label: 'Wallet & Account (11)' },
          ].map((cat) => (
            <button
              key={cat.key}
              className={`segment-btn ${toolCategory === cat.key ? 'active' : ''}`}
              onClick={() => setToolCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tool Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', padding: '0.25rem' }}>
          {filteredTools.map((tool) => (
            <div
              key={tool.name}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {tool.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {tool.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Ledger Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Verifiable Public Claim Ledger ({claims.length} Verified Claims)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Every public statement is paired with its verifiable evidence artifact and test path.
            </p>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Claim ID</th>
                <th>Public Claim Statement</th>
                <th style={{ width: '160px' }}>Verification Status</th>
                <th style={{ width: '280px' }}>Evidence Artifact</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id}>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--color-accent-text)' }}>
                    {claim.id}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {claim.claim}
                  </td>
                  <td>
                    <span className="badge best">
                      <CheckCircle2 size={12} /> {claim.status}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {claim.artifact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
