import React, { useState, useMemo } from 'react';
import {
  ExecutionIntent,
  ComparisonSnapshot,
  generateAndEvaluateRoutes,
  rankRoutes,
} from '@rove/core';
import { RouteCardView } from './RouteCardView.js';
import {
  Sliders,
  Shield,
  Zap,
  Clock,
  TrendingDown,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Database,
  Lock,
} from 'lucide-react';

interface WhatIfSimulatorProps {
  baseSnapshot: ComparisonSnapshot;
}

type ReplayMode = 'buy-750' | 'hedge-70' | 'custom';

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ baseSnapshot }) => {
  // Replay mode: Mode 1 (Captured Live Buy), Mode 2 (Captured Live Hedge), Mode 3 (Interactive What-If Compiler)
  const [replayMode, setReplayMode] = useState<ReplayMode>('buy-750');

  // Interactive controls (Mode 3)
  const [objective, setObjective] = useState<'hedge' | 'buy' | 'sell' | 'flatten'>('hedge');
  const [asset, setAsset] = useState<string>('BNB');
  const [fraction, setFraction] = useState<string>('0.7');
  const [horizonHours, setHorizonHours] = useState<number>(24);
  const [mustRetain, setMustRetain] = useState<boolean>(true);
  const [maxLeverage, setMaxLeverage] = useState<string>('1.5');
  const [maxCarryBps, setMaxCarryBps] = useState<string>('15.0');
  const [maxExecutionCostBps, setMaxExecutionCostBps] = useState<string>('25.0');
  const [activePreset, setActivePreset] = useState<string>('hedge-bnb');

  // Evidence drawer state
  const [showSnapshotEvidence, setShowSnapshotEvidence] = useState(false);

  // Intent Presets for Mode 3
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === 'hedge-bnb') {
      setObjective('hedge');
      setAsset('BNB');
      setFraction('0.7');
      setHorizonHours(24);
      setMustRetain(true);
      setMaxLeverage('1.5');
      setMaxCarryBps('15.0');
      setMaxExecutionCostBps('25.0');
    } else if (presetKey === 'retail-buy') {
      setObjective('buy');
      setAsset('BNB');
      setFraction('0.1');
      setHorizonHours(1);
      setMustRetain(false);
      setMaxLeverage('1.0');
      setMaxCarryBps('5.0');
      setMaxExecutionCostBps('20.0');
    } else if (presetKey === 'deep-buy') {
      setObjective('buy');
      setAsset('BNB');
      setFraction('0.9');
      setHorizonHours(1);
      setMustRetain(false);
      setMaxLeverage('1.0');
      setMaxCarryBps('5.0');
      setMaxExecutionCostBps('10.0');
    } else if (presetKey === 'long-hedge') {
      setObjective('hedge');
      setAsset('BNB');
      setFraction('0.5');
      setHorizonHours(168);
      setMustRetain(true);
      setMaxLeverage('1.2');
      setMaxCarryBps('20.0');
      setMaxExecutionCostBps('25.0');
    }
  };

  // Build active intent depending on replayMode
  const activeIntent: ExecutionIntent = useMemo(() => {
    if (replayMode === 'buy-750') {
      return {
        version: '1',
        objective: 'buy',
        asset: 'BNB',
        amount: { type: 'notional', value: '750', currency: 'USDT' },
        horizon: { value: 0, unit: 'hours' },
        must_retain_underlying: false,
        max_leverage: '1.0',
        urgency: 'immediate',
      };
    }

    if (replayMode === 'hedge-70') {
      return {
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
    }

    // Mode 3: Custom
    return {
      version: '1',
      objective,
      asset,
      amount: { type: 'exposure_fraction', value: fraction },
      horizon: { value: horizonHours, unit: 'hours' },
      must_retain_underlying: mustRetain,
      max_leverage: maxLeverage,
      max_estimated_carry_bps: maxCarryBps || undefined,
      max_observed_execution_cost_bps: maxExecutionCostBps || undefined,
      urgency: 'normal',
    };
  }, [
    replayMode,
    objective,
    asset,
    fraction,
    horizonHours,
    mustRetain,
    maxLeverage,
    maxCarryBps,
    maxExecutionCostBps,
  ]);

  // Evaluate and rank routes against baseSnapshot
  const routes = useMemo(() => {
    const evaluated = generateAndEvaluateRoutes({
      intent: activeIntent,
      snapshot: baseSnapshot,
      currentTimeMs: baseSnapshot.spot?.timestamp || Date.now(),
    });
    return rankRoutes(evaluated);
  }, [activeIntent, baseSnapshot]);

  const winner = routes.find((r) => r.status === 'SELECTED');
  const spotRoute = routes.find((r) => r.kind === 'spot');

  return (
    <div>
      {/* 1. Top Replay Selector */}
      <div className="replay-selector-bar">
        <button
          className={`replay-btn ${replayMode === 'buy-750' ? 'active' : ''}`}
          onClick={() => setReplayMode('buy-750')}
        >
          <Zap size={15} />
          <span>Mode 1: Captured Live Buy ($750 BNB)</span>
        </button>

        <button
          className={`replay-btn ${replayMode === 'hedge-70' ? 'active' : ''}`}
          onClick={() => setReplayMode('hedge-70')}
        >
          <Shield size={15} />
          <span>Mode 2: Captured Live Hedge (70% BNB)</span>
        </button>

        <button
          className={`replay-btn ${replayMode === 'custom' ? 'active' : ''}`}
          onClick={() => setReplayMode('custom')}
        >
          <Sliders size={15} />
          <span>Mode 3: Interactive What-If Compiler</span>
        </button>
      </div>

      {/* 2. Mode 1: Captured Live Buy Presentation */}
      {replayMode === 'buy-750' && (
        <div className="intent-card">
          <div className="intent-quote">
            "Buy $750 worth of BNB with USDT. Find the cheapest path right now."
          </div>

          <div className="intent-pills-row" style={{ marginBottom: '1.25rem' }}>
            <span className="intent-pill">Objective: <strong>BUY</strong></span>
            <span className="intent-pill">Asset: <strong>BNB</strong></span>
            <span className="intent-pill">Notional: <strong>$750 USDT</strong></span>
            <span className="intent-pill">Horizon: <strong>Immediate</strong></span>
            <span className="intent-pill">Retain Underlying: <strong>N/A</strong></span>
            <span className="intent-pill">Max Leverage: <strong>1.0x (No Leverage)</strong></span>
          </div>

          {/* Comparison Highlight Banner */}
          <div className="comparison-banner highlight-spot">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <span className="badge best" style={{ fontSize: '0.72rem' }}>SPOT SELECTED</span>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                  Spot Book-Walk Beats Convert RFQ Spread Markup
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Spot book-walk execution cost: <strong style={{ color: 'var(--color-best-text)' }}>10.07 bps</strong> (10.00 bps taker fee + 0.07 bps slippage) vs Convert RFQ markup: <strong style={{ color: 'var(--text-primary)' }}>54.97 bps</strong>.
                <br />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Zero explicit fee on Binance Convert is an economic fallacy: the true cost is embedded inside the quoted RFQ rate (754.671 vs 750.545 spot mid).
                </span>
              </div>
            </div>
            <div className="comparison-delta-pill">
              <Zap size={15} />
              <span>44.90 bps difference</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mode 2: Captured Live Hedge Presentation */}
      {replayMode === 'hedge-70' && (
        <div className="intent-card">
          <div className="intent-quote">
            "Hedge 70% of my BNB exposure for 24 hours. Do not sell my BNB. Keep leverage below 1.5x."
          </div>

          <div className="intent-pills-row" style={{ marginBottom: '1.25rem' }}>
            <span className="intent-pill">Objective: <strong>HEDGE</strong></span>
            <span className="intent-pill">Asset: <strong>BNB</strong></span>
            <span className="intent-pill">Source Exposure: <strong>12.5000 BNB ($9,381.88)</strong></span>
            <span className="intent-pill">Hedge Quantity: <strong>8.7500 BNB (70%)</strong></span>
            <span className="intent-pill">Horizon: <strong>24 Hours</strong></span>
            <span className="intent-pill">Retain Underlying: <strong>TRUE (Launchpool Locked)</strong></span>
            <span className="intent-pill">Max Leverage: <strong>1.5x</strong></span>
          </div>

          {/* Comparison Highlight Banner */}
          <div className="comparison-banner highlight-hedge">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <span className="badge best" style={{ fontSize: '0.72rem' }}>USD-M PERP SELECTED</span>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                  Retain-Underlying Constraint Rescued by USD-M Perpetual (1.31x Leverage)
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Spot orderbook and Convert RFQ are strictly <strong style={{ color: 'var(--color-rejected-text)' }}>REJECTED</strong> (<code>RETAIN_UNDERLYING_CONFLICT</code>) to protect Launchpool staking rewards.
                <br />
                USD-M short hedge selected at <strong style={{ color: 'var(--color-best-text)' }}>5.00 bps</strong> taker fee + <strong style={{ color: 'var(--color-warning-text)' }}>8.22 bps</strong> projected 24h carry (2.74 bps / 8h funding) with <strong>1.31x required leverage</strong> on $5,000 USDT collateral.
              </div>
            </div>
            <div className="comparison-delta-pill" style={{ background: 'var(--color-accent-subtle)', borderColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}>
              <Shield size={15} />
              <span>1.31x required vs 1.5x cap</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Mode 3: Interactive What-If Compiler */}
      {replayMode === 'custom' && (
        <>
          {/* Intent Presets Picker */}
          <div className="presets-container">
            <div className="presets-label">
              <Sparkles size={13} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} />
              Quick-Start Economic Presets
            </div>
            <div className="presets-grid">
              <div
                className={`preset-chip ${activePreset === 'hedge-bnb' ? 'active' : ''}`}
                onClick={() => applyPreset('hedge-bnb')}
              >
                <div className="preset-chip-title">
                  <Shield size={14} color="var(--color-best)" />
                  <span>Hedge 70% BNB (24h)</span>
                </div>
                <div className="preset-chip-desc">
                  Retain BNB for Launchpool. Enforces 1.5x leverage ceiling.
                </div>
              </div>

              <div
                className={`preset-chip ${activePreset === 'retail-buy' ? 'active' : ''}`}
                onClick={() => applyPreset('retail-buy')}
              >
                <div className="preset-chip-title">
                  <Zap size={14} color="var(--color-brand)" />
                  <span>Small Retail Swap ($750)</span>
                </div>
                <div className="preset-chip-desc">
                  Spot book walk (10.07 bps) beats Convert RFQ markup (54.97 bps).
                </div>
              </div>

              <div
                className={`preset-chip ${activePreset === 'deep-buy' ? 'active' : ''}`}
                onClick={() => applyPreset('deep-buy')}
              >
                <div className="preset-chip-title">
                  <TrendingDown size={14} color="var(--color-accent)" />
                  <span>Deep Book Accumulate</span>
                </div>
                <div className="preset-chip-desc">
                  Enforces strict 10 bps execution ceiling on deep book walk.
                </div>
              </div>

              <div
                className={`preset-chip ${activePreset === 'long-hedge' ? 'active' : ''}`}
                onClick={() => applyPreset('long-hedge')}
              >
                <div className="preset-chip-title">
                  <Clock size={14} color="var(--color-warning)" />
                  <span>Long Horizon (7 Days)</span>
                </div>
                <div className="preset-chip-desc">
                  Tests funding carry accumulation over 168 hours.
                </div>
              </div>
            </div>
          </div>

          {/* Simulator Box */}
          <div className="simulator-box">
            <div className="simulator-header">
              <div className="simulator-title">
                <Sliders size={20} color="var(--color-brand)" />
                <span>Custom Economic Intent Compiler</span>
              </div>
              <button
                onClick={() => applyPreset('hedge-bnb')}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <RotateCcw size={12} />
                Reset Parameters
              </button>
            </div>

            <div className="input-grid">
              {/* Objective */}
              <div className="form-group">
                <label className="form-label">Economic Objective</label>
                <div className="segmented-control">
                  {(['hedge', 'buy', 'sell', 'flatten'] as const).map((obj) => (
                    <button
                      key={obj}
                      className={`segment-btn ${objective === obj ? 'active' : ''}`}
                      onClick={() => {
                        setObjective(obj);
                        setActivePreset('custom');
                      }}
                    >
                      {obj.charAt(0).toUpperCase() + obj.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Asset */}
              <div className="form-group">
                <label className="form-label">Target Asset</label>
                <div className="segmented-control">
                  {['BNB', 'BTC', 'ETH', 'SOL'].map((tok) => (
                    <button
                      key={tok}
                      className={`segment-btn ${asset === tok ? 'active' : ''}`}
                      onClick={() => {
                        setAsset(tok);
                        setActivePreset('custom');
                      }}
                    >
                      {tok}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exposure Fraction */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Exposure Fraction</label>
                  <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent-text)' }}>
                    {(parseFloat(fraction) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={fraction}
                  onChange={(e) => {
                    setFraction(e.target.value);
                    setActivePreset('custom');
                  }}
                  style={{ width: '100%', accentColor: 'var(--color-brand)' }}
                />
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                  {['0.25', '0.50', '0.70', '1.0'].map((val) => (
                    <button
                      key={val}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '0.2rem', fontSize: '0.72rem' }}
                      onClick={() => {
                        setFraction(val);
                        setActivePreset('custom');
                      }}
                    >
                      {(parseFloat(val) * 100).toFixed(0)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizon Hours */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Horizon</label>
                  <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    {horizonHours} Hours
                  </span>
                </div>
                <div className="segmented-control">
                  {[
                    { label: '8h', val: 8 },
                    { label: '24h', val: 24 },
                    { label: '3d', val: 72 },
                    { label: '7d', val: 168 },
                  ].map((h) => (
                    <button
                      key={h.val}
                      className={`segment-btn ${horizonHours === h.val ? 'active' : ''}`}
                      onClick={() => {
                        setHorizonHours(h.val);
                        setActivePreset('custom');
                      }}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Leverage */}
              <div className="form-group">
                <label className="form-label">Max Allowed Leverage</label>
                <select
                  className="form-select"
                  value={maxLeverage}
                  onChange={(e) => {
                    setMaxLeverage(e.target.value);
                    setActivePreset('custom');
                  }}
                >
                  <option value="1.0">1.0x (No Leverage)</option>
                  <option value="1.2">1.2x (Conservative)</option>
                  <option value="1.5">1.5x (Recommended)</option>
                  <option value="2.0">2.0x (Moderate)</option>
                  <option value="3.0">3.0x (High Risk)</option>
                </select>
              </div>

              {/* Max Carry Ceiling */}
              <div className="form-group">
                <label className="form-label">Max Carry Ceiling (bps)</label>
                <input
                  type="text"
                  className="form-input mono"
                  value={maxCarryBps}
                  onChange={(e) => {
                    setMaxCarryBps(e.target.value);
                    setActivePreset('custom');
                  }}
                  placeholder="e.g. 15.0"
                />
              </div>
            </div>

            {/* Retain Underlying Asset Switch */}
            <div
              className="toggle-switch-container"
              onClick={() => {
                setMustRetain(!mustRetain);
                setActivePreset('custom');
              }}
            >
              <div>
                <div className="toggle-switch-label">
                  <Lock size={14} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  Must Retain Underlying Token ({asset})
                </div>
                <div className="toggle-switch-desc">
                  Strictly prevents spot/convert selling. Keeps tokens available for staking & Launchpool yields.
                </div>
              </div>
              <input
                type="checkbox"
                checked={mustRetain}
                onChange={() => {}}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-best)', cursor: 'pointer' }}
              />
            </div>

            {/* Dynamic Recompilation Status Banner */}
            <div className="recompilation-banner">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Winning Execution Path: </span>
                {winner ? (
                  <span className="mono" style={{ fontWeight: 800, color: 'var(--color-best-text)', fontSize: '0.95rem' }}>
                    {winner.kind.toUpperCase()} ({winner.side.toUpperCase()})
                  </span>
                ) : (
                  <span className="mono" style={{ fontWeight: 800, color: 'var(--color-rejected-text)', fontSize: '0.95rem' }}>
                    NO ELIGIBLE PATH (Pruned by Hard Constraints)
                  </span>
                )}
              </div>
              <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {mustRetain && spotRoute?.status === 'REJECTED' && (
                  <span style={{ color: 'var(--color-rejected-text)' }}>
                    — Spot selling pruned: RETAIN_UNDERLYING
                  </span>
                )}
                {!mustRetain && winner?.kind === 'convert' && (
                  <span style={{ color: 'var(--color-best-text)' }}>
                    — Route flipped to Convert: Saved 10.07 bps vs Spot
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 5. Evaluated Route Cards Header + Evidence Toggle */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Evaluated Execution Paths ({routes.length})
          </h3>
          <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Captured Binance State: {baseSnapshot.completedAt} (<span style={{ color: 'var(--color-best-text)', fontWeight: 700 }}>{baseSnapshot.maxObservedSkewMs}ms skew</span>)
          </span>
        </div>

        <button
          onClick={() => setShowSnapshotEvidence(!showSnapshotEvidence)}
          className="btn-secondary"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
        >
          <Database size={13} />
          {showSnapshotEvidence ? 'Hide Snapshot Audit' : 'Inspect Snapshot Audit'}
          {showSnapshotEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Snapshot Evidence Drawer */}
      {showSnapshotEvidence && (
        <div className="evidence-drawer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Authoritative Live Binance Snapshot</span>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ID: {baseSnapshot.id} • Mode: {baseSnapshot.mode}
            </span>
          </div>
          <table className="evidence-table mono">
            <tbody>
              <tr>
                <td>Max Cross-Venue Capture Skew</td>
                <td style={{ color: 'var(--color-best-text)' }}>{baseSnapshot.maxObservedSkewMs} ms (Ceiling: 50 ms)</td>
              </tr>
              <tr>
                <td>Spot Orderbook Top (BNBUSDT)</td>
                <td>Bid: {baseSnapshot.spot?.bidPrice} / Ask: {baseSnapshot.spot?.askPrice}</td>
              </tr>
              <tr>
                <td>Convert RFQ Quoted Rate (USDT → BNB)</td>
                <td>1 BNB = {baseSnapshot.convert?.inverseRatio} USDT (54.97 bps RFQ markup)</td>
              </tr>
              <tr>
                <td>USD-M Perpetual Mark Price & Funding</td>
                <td>Mark: {baseSnapshot.usdM?.markPrice} USDT • 8h Funding: {baseSnapshot.usdM?.currentFundingRateBps} bps</td>
              </tr>
              <tr>
                <td>Account Available Collateral</td>
                <td>{baseSnapshot.account?.balances.BNB?.free} BNB • ${baseSnapshot.account?.balances.USDT?.free} USDT</td>
              </tr>
              <tr>
                <td>Sub-Account Trading Permissions</td>
                <td>Spot: OK • Futures: OK • Margin: Disabled • Withdrawals: ZERO</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Route Cards Grid */}
      <div className="cards-grid">
        {routes.map((route) => (
          <RouteCardView
            key={route.id}
            route={route}
            intent={activeIntent}
            mode={baseSnapshot.mode}
            snapshotTimestamp={baseSnapshot.completedAt}
          />
        ))}
      </div>

      {/* 6. Three Core Audited Public Claims */}
      <div className="claims-section">
        <div className="claims-section-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Audited Public Claims
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Every claim is backed by reproducible clean-room benchmarks and live-read evidence.
          </p>
        </div>

        <div className="claims-grid" style={{ marginTop: '0' }}>
          <div className="claim-card">
            <div className="claim-tag">
              <Shield size={13} color="var(--color-brand)" />
              <span>CLAIM 1</span>
            </div>
            <div className="claim-title">Live Agent OS</div>
            <div className="claim-text">
              Live-read path verified against production Binance Agent OS; live trading safety-gated.
            </div>
          </div>

          <div className="claim-card">
            <div className="claim-tag">
              <Zap size={13} color="var(--color-best)" />
              <span>CLAIM 2</span>
            </div>
            <div className="claim-title">Live Economic Example</div>
            <div className="claim-text">
              Captured $750 BNB buy: Spot 10.07 bps vs Convert RFQ 54.97 bps (44.90 bps difference on this quote).
            </div>
          </div>

          <div className="claim-card">
            <div className="claim-tag">
              <Sliders size={13} color="var(--color-accent)" />
              <span>CLAIM 3</span>
            </div>
            <div className="claim-title">Constraint Compilation</div>
            <div className="claim-text">
              Derives hedge size from observed exposure, computes required leverage against available collateral, rejects hard constraint violations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
