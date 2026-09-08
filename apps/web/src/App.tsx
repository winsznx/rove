import React, { useState } from 'react';
import { WhatIfSimulator } from './components/WhatIfSimulator.js';
import { BenchmarkExplorer } from './components/BenchmarkExplorer.js';
import { EvidenceExplorer } from './components/EvidenceExplorer.js';
import { ComparisonSnapshot } from '@rove/core';
import { GitBranch, Shield, ArrowRight } from 'lucide-react';

const mockSnapshot: ComparisonSnapshot = {
  id: 'snap-live-read-bnb-001',
  mode: 'live-read',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  maxObservedSkewMs: 38,
  account: {
    timestamp: Date.now(),
    canTrade: true,
    makerFeeBps: '10.00',
    takerFeeBps: '10.00',
    balances: {
      BNB: { asset: 'BNB', free: '24.50000000', locked: '0.00000000' },
      USDT: { asset: 'USDT', free: '15000.00000000', locked: '0.00000000' },
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
    timestamp: Date.now(),
    bidPrice: '750.84',
    askPrice: '750.85',
    bids: [
      ['750.84', '3.706'],
      ['750.83', '4.024'],
      ['750.82', '6.221'],
    ],
    asks: [
      ['750.85', '5.070'],
      ['750.86', '4.651'],
      ['750.87', '9.058'],
    ],
  },
  convert: {
    fromAsset: 'BNB',
    toAsset: 'USDT',
    timestamp: Date.now(),
    ratio: '750.78',
    inverseRatio: '0.00133194',
    fromAmount: '1.0',
    toAmount: '750.78',
    validTimestamp: Date.now() + 15000,
    quoteId: 'conv-live-098',
  },
  usdM: {
    symbol: 'BNBUSDT',
    timestamp: Date.now(),
    markPrice: '750.66',
    currentFundingRateBps: '1.25',
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
  sourceFingerprint: 'sha256-live-read-fingerprint-bnb',
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compiler' | 'benchmarks' | 'evidence' | 'install'>('compiler');

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="brand">
          <span>ROVE</span>
          <span className="brand-badge">BINANCE AGENT OS</span>
        </div>
        <div className="nav-links">
          <button
            onClick={() => setActiveTab('compiler')}
            className={`tab-btn ${activeTab === 'compiler' ? 'active' : ''}`}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            Compiler
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`tab-btn ${activeTab === 'benchmarks' ? 'active' : ''}`}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            Rove Bench
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            Evidence
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`tab-btn ${activeTab === 'install' ? 'active' : ''}`}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            Install
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn-github"
          >
            <GitBranch size={14} /> GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero">
        <div className="hero-tag">
          <Shield size={14} />
          <span>Binance Agent OS Mini Hackathon • Track A</span>
        </div>
        <h1 className="hero-title">
          Tell Rove the outcome you want.<br />
          It finds the Binance path that fits.
        </h1>
        <p className="hero-subtitle">
          Language intelligence compiles your intent. Deterministic TypeScript walks the books,
          enforces hard constraints, separates observed costs from estimated carry, and prepares one Route Card for approval.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            className="btn-primary"
            onClick={() => setActiveTab('compiler')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>Explore Live Route Cards</span>
            <ArrowRight size={16} />
          </button>
          <button
            className="btn-github"
            onClick={() => setActiveTab('benchmarks')}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
          >
            <span>View 100-Snapshot Benchmark</span>
          </button>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'compiler' ? 'active' : ''}`}
          onClick={() => setActiveTab('compiler')}
        >
          Route Compiler & What-If Recompilation
        </button>
        <button
          className={`tab-btn ${activeTab === 'benchmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmarks')}
        >
          Rove Bench (20-Intent Experiment & Ablations)
        </button>
        <button
          className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          Ground-Truth Evidence & MCP Capability
        </button>
        <button
          className={`tab-btn ${activeTab === 'install' ? 'active' : ''}`}
          onClick={() => setActiveTab('install')}
        >
          Installation & Setup
        </button>
      </div>

      {/* Tab Content */}
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
          <div className="simulator-box">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              Install Rove into Antigravity or Any MCP Client
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Rove connects to Binance through official <b>Binance Agent OS</b> without local API secrets.
              Trading operations run within a permission-scoped, non-withdrawable Agentic sub-account.
            </p>

            <div className="section-block" style={{ marginBottom: '1.25rem' }}>
              <div className="section-label">1. Connect Binance Agent OS in Antigravity / Claude Code</div>
              <pre className="mono" style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', fontSize: '0.85rem', overflowX: 'auto' }}>
{`# Add the official Binance Agent OS endpoint
claude mcp add binance --transport http https://agent.binance.com/mcp/agentic

# Or in Antigravity mcp_config.json:
{
  "mcpServers": {
    "binance": {
      "serverUrl": "https://agent.binance.com/mcp/agentic"
    }
  }
}`}
              </pre>
            </div>

            <div className="section-block" style={{ marginBottom: '1.25rem' }}>
              <div className="section-label">2. Clone & Run Clean-Room Verification</div>
              <pre className="mono" style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', fontSize: '0.85rem', overflowX: 'auto' }}>
{`git clone https://github.com/rove-finance/rove.git
cd rove
pnpm install
pnpm verify`}
              </pre>
            </div>

            <div className="section-block">
              <div className="section-label">3. Example Prompt in Agent Chat</div>
              <div className="mono" style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--color-accent)' }}>
                "Hedge 70% of my BNB exposure for 24 hours. Don't sell my BNB. Keep leverage below 1.5x."
              </div>
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
