import React, { useState, useEffect } from 'react';
import { WhatIfSimulator } from './components/WhatIfSimulator.js';
import { BenchmarkExplorer } from './components/BenchmarkExplorer.js';
import { EvidenceExplorer } from './components/EvidenceExplorer.js';
import { ComparisonSnapshot } from '@rove/core';
import {
  GitBranch,
  Shield,
  ArrowRight,
  Sun,
  Moon,
  Terminal,
  Copy,
  Check,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

const mockSnapshot: ComparisonSnapshot = {
  id: 'snap-live-1788876898005',
  mode: 'live-read',
  startedAt: '2026-09-08T12:44:20.000Z',
  completedAt: '2026-09-08T12:44:55.000Z',
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
    ],
    asks: [
      ['750.55000000', '13.03000000'],
      ['750.56000000', '2.00100000'],
      ['750.57000000', '5.05100000'],
      ['750.58000000', '6.04700000'],
      ['750.59000000', '4.12400000'],
    ],
  },
  convert: {
    fromAsset: 'USDT',
    toAsset: 'BNB',
    timestamp: 1788871470784,
    ratio: '0.00132508',
    inverseRatio: '754.671',
    fromAmount: '750',
    toAmount: '0.99381104',
    validTimestamp: 1788871485784,
    quoteId: 'conv-live-verified-buy-002',
  },
  convertQuotes: [
    {
      fromAsset: 'USDT',
      toAsset: 'BNB',
      timestamp: 1788871470784,
      ratio: '0.00132508',
      inverseRatio: '754.671',
      fromAmount: '750',
      toAmount: '0.99381104',
      validTimestamp: 1788871485784,
      quoteId: 'conv-live-verified-buy-002',
    },
    {
      fromAsset: 'BNB',
      toAsset: 'USDT',
      timestamp: 1788871470784,
      ratio: '747.938',
      inverseRatio: '0.00133701',
      fromAmount: '1.0',
      toAmount: '747.938',
      validTimestamp: 1788871485784,
      quoteId: 'conv-live-verified-sell-001',
    },
  ],
  usdM: {
    symbol: 'BNBUSDT',
    timestamp: 1788871494385,
    markPrice: '751.040',
    currentFundingRateBps: '2.74',
    fundingIntervalHours: 8,
    positions: [],
    availableMargin: '5000.00',
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compiler' | 'benchmarks' | 'evidence' | 'install'>('compiler');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Initialize theme from localStorage or default to light
  useEffect(() => {
    const saved = localStorage.getItem('rove-theme') as 'light' | 'dark' | null;
    const initial = saved || 'light';
    setTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('rove-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="brand-wrapper">
          <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); setActiveTab('compiler'); }}>
            <div className="brand-icon">R</div>
            <span>ROVE</span>
          </a>
          <div className="status-pill">
            <span className="pulse-dot" />
            <span>Binance Agent OS Live</span>
          </div>
        </div>

        <div className="nav-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <a
            href="https://github.com/winsznx/rove"
            target="_blank"
            rel="noreferrer"
            className="btn-github"
          >
            <GitBranch size={15} />
            <span>GitHub</span>
          </a>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="hero">
        <div className="hero-tag">
          <Shield size={14} color="var(--color-brand-dark)" />
          <span>Binance Agent OS Mini Hackathon • Track A</span>
        </div>

        <h1 className="hero-title">
          Tell Rove the outcome you want.<br />
          <span className="brand-gradient">It finds the Binance path that fits.</span>
        </h1>

        <p className="hero-subtitle">
          Language intelligence compiles your intent. Deterministic TypeScript walks the order books,
          enforces hard constraints, separates observed costs from estimated carry, and prepares one auditable Route Card.
        </p>
      </header>

      {/* Main Tab Navigation */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'compiler' ? 'active' : ''}`}
          onClick={() => setActiveTab('compiler')}
        >
          <Cpu size={15} />
          <span>Route Compiler & What-If Engine</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'benchmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmarks')}
        >
          <Layers size={15} />
          <span>Rove Bench (100 Scenarios & Matrix)</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          <Shield size={15} />
          <span>Ground-Truth Evidence & MCP Tools</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'install' ? 'active' : ''}`}
          onClick={() => setActiveTab('install')}
        >
          <Terminal size={15} />
          <span>Install & Agent Skill</span>
        </button>
      </div>

      {/* Tab Panels */}
      <main>
        {activeTab === 'compiler' && (
          <WhatIfSimulator baseSnapshot={mockSnapshot} />
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarkExplorer />
        )}

        {activeTab === 'evidence' && (
          <EvidenceExplorer />
        )}

        {activeTab === 'install' && (
          <div className="simulator-box" style={{ maxWidth: '820px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Integrate Rove with Antigravity, Claude Code, or Cursor
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Rove connects to Binance through official <b>Binance Agent OS</b> without local API keys.
              Trading operations run inside a permission-scoped sub-account with zero withdrawal permissions.
            </p>

            {/* Step 1 */}
            <div className="card-section" style={{ marginBottom: '1.25rem', padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  1. Connect Official Binance Agent OS Gateway
                </span>
                <button
                  onClick={() => copyCode('claude mcp add binance --transport http https://agent.binance.com/mcp/agentic', 1)}
                  className="btn-secondary"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                >
                  {copiedIndex === 1 ? <Check size={12} color="var(--color-best)" /> : <Copy size={12} />}
                  {copiedIndex === 1 ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="mono" style={{ background: 'var(--bg-app)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
{`# Add via Claude Code CLI:
claude mcp add binance --transport http https://agent.binance.com/mcp/agentic

# Or in Antigravity ~/.gemini/config/mcp_config.json:
{
  "mcpServers": {
    "binance": {
      "serverUrl": "https://agent.binance.com/mcp/agentic"
    }
  }
}`}
              </pre>
            </div>

            {/* Step 2 */}
            <div className="card-section" style={{ marginBottom: '1.25rem', padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  2. Clone & Run Clean-Room Verification
                </span>
                <button
                  onClick={() => copyCode('git clone https://github.com/winsznx/rove.git\ncd rove\npnpm install\npnpm verify', 2)}
                  className="btn-secondary"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                >
                  {copiedIndex === 2 ? <Check size={12} color="var(--color-best)" /> : <Copy size={12} />}
                  {copiedIndex === 2 ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="mono" style={{ background: 'var(--bg-app)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
{`git clone https://github.com/winsznx/rove.git
cd rove
pnpm install
pnpm verify`}
              </pre>
            </div>

            {/* Step 3 */}
            <div className="card-section" style={{ padding: '1.15rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.65rem' }}>
                3. Ask Your Agent Economic Intents in Natural Language
              </div>
              <div className="card-section" style={{ background: 'var(--color-brand-subtle)', borderColor: 'var(--color-brand)', color: 'var(--color-brand-text)', margin: 0 }}>
                <p className="mono" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  "Hedge 70% of my BNB exposure for 24 hours. Don't sell my BNB. Keep leverage below 1.5x."
                </p>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                The agent parses the intent, captures live market state in under 50ms, rejects invalid paths, and formats the winning Route Card for your approval.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <span>ROVE • Built for Binance Agent OS Mini Hackathon Track A</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Observed vs Estimated Strictly Separated</span>
          <span>Zero External Withdrawals</span>
          <span>Not Financial Advice</span>
        </div>
      </footer>
    </div>
  );
};
