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
} from 'lucide-react';

interface WhatIfSimulatorProps {
  baseSnapshot: ComparisonSnapshot;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ baseSnapshot }) => {
  const [objective, setObjective] = useState<'hedge' | 'buy' | 'sell' | 'flatten'>('hedge');
  const [asset, setAsset] = useState<string>('BNB');
  const [fraction, setFraction] = useState<string>('0.7');
  const [horizonHours, setHorizonHours] = useState<number>(24);
  const [mustRetain, setMustRetain] = useState<boolean>(true);
  const [maxLeverage, setMaxLeverage] = useState<string>('1.5');
  const [maxCarryBps, setMaxCarryBps] = useState<string>('15.0');
  const [maxExecutionCostBps, setMaxExecutionCostBps] = useState<string>('25.0');
  const [activePreset, setActivePreset] = useState<string>('hedge-bnb');

  // Intent Presets
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
      setHorizonHours(168); // 7 days
      setMustRetain(true);
      setMaxLeverage('1.2');
      setMaxCarryBps('20.0');
      setMaxExecutionCostBps('25.0');
    }
  };

  const intent: ExecutionIntent = useMemo(() => {
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
  }, [objective, asset, fraction, horizonHours, mustRetain, maxLeverage, maxCarryBps, maxExecutionCostBps]);

  const routes = useMemo(() => {
    const evaluated = generateAndEvaluateRoutes({
      intent,
      snapshot: baseSnapshot,
      currentTimeMs: Date.now(),
    });
    return rankRoutes(evaluated);
  }, [intent, baseSnapshot]);

  const winner = routes.find((r) => r.status === 'SELECTED');
  const spotRoute = routes.find((r) => r.kind === 'spot');

  return (
    <div>
      {/* Intent Presets Picker */}
      <div className="presets-container">
        <div className="presets-label">
          <Sparkles size={13} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Verified Hackathon Scenarios (Quick-Start Presets)
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
              Must retain BNB for Launchpool. Selects USD-M short.
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
              Spot book walk (10.01 bps) beats Convert RFQ spread markup (50.9 bps).
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
              Enforces strict 10 bps execution ceiling on deep walk.
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
            <span>Interactive Execution-Path Compiler</span>
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
              🔒 Must Retain Underlying Token ({asset})
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
                ● Spot selling pruned: RETAIN_UNDERLYING
              </span>
            )}
            {!mustRetain && winner?.kind === 'convert' && (
              <span style={{ color: 'var(--color-best-text)' }}>
                ● Route flipped to Convert: Saved 10.07 bps vs Spot
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rendered Route Cards Grid */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Evaluated Execution Paths ({routes.length})
        </h3>
        <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          State Captured: {baseSnapshot.completedAt} (<span style={{ color: 'var(--color-best-text)' }}>{baseSnapshot.maxObservedSkewMs}ms skew</span>)
        </span>
      </div>

      <div className="cards-grid">
        {routes.map((route) => (
          <RouteCardView
            key={route.id}
            route={route}
            intent={intent}
            mode={baseSnapshot.mode}
            snapshotTimestamp={baseSnapshot.completedAt}
          />
        ))}
      </div>
    </div>
  );
};
