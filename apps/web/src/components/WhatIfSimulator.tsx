import React, { useState, useMemo } from 'react';
import {
  ExecutionIntent,
  ComparisonSnapshot,
  generateAndEvaluateRoutes,
  rankRoutes,
} from '@rove/core';
import { RouteCardView } from './RouteCardView.js';
import { Sliders } from 'lucide-react';

interface WhatIfSimulatorProps {
  baseSnapshot: ComparisonSnapshot;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ baseSnapshot }) => {
  const [objective, setObjective] = useState<'buy' | 'sell' | 'hedge' | 'flatten'>('hedge');
  const [asset, setAsset] = useState<string>('BNB');
  const [fraction, setFraction] = useState<string>('0.7');
  const [horizonHours, setHorizonHours] = useState<number>(24);
  const [mustRetain, setMustRetain] = useState<boolean>(true);
  const [maxLeverage, setMaxLeverage] = useState<string>('1.5');
  const [maxCarryBps, setMaxCarryBps] = useState<string>('10.0');
  const [maxExecutionCostBps, setMaxExecutionCostBps] = useState<string>('25.0');

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

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="simulator-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Sliders size={18} color="var(--color-accent)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Interactive What-If Recompilation Engine</h3>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Economic Objective</label>
            <select
              className="form-input"
              value={objective}
              onChange={(e) => setObjective(e.target.value as any)}
            >
              <option value="hedge">Hedge Exposure</option>
              <option value="buy">Buy Asset</option>
              <option value="sell">Sell Asset</option>
              <option value="flatten">Flatten Position</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Asset</label>
            <select
              className="form-input"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
            >
              <option value="BNB">BNB</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="SOL">SOL</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Exposure Fraction (0.1 - 1.0)</label>
            <input
              type="text"
              className="form-input"
              value={fraction}
              onChange={(e) => setFraction(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Horizon (Hours)</label>
            <input
              type="number"
              className="form-input"
              value={horizonHours}
              onChange={(e) => setHorizonHours(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Leverage Cap</label>
            <input
              type="text"
              className="form-input"
              value={maxLeverage}
              onChange={(e) => setMaxLeverage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Carry Ceiling (bps)</label>
            <input
              type="text"
              className="form-input"
              value={maxCarryBps}
              onChange={(e) => setMaxCarryBps(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Exec Cost Ceiling (bps)</label>
            <input
              type="text"
              className="form-input"
              value={maxExecutionCostBps}
              onChange={(e) => setMaxExecutionCostBps(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mustRetain}
                onChange={(e) => setMustRetain(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>Must Retain Underlying Asset (rejects routes that dispose of protected token)</span>
            </label>
          </div>
        </div>

        {/* Dynamic Status Bar */}
        <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Selected Winner: </span>
            {winner ? (
              <span className="mono" style={{ fontWeight: 700, color: 'var(--color-best)' }}>
                {winner.kind.toUpperCase()} ({winner.side.toUpperCase()})
              </span>
            ) : (
              <span className="mono" style={{ color: 'var(--color-rejected)', fontWeight: 700 }}>
                NO VALID ROUTE (All prunned by constraints)
              </span>
            )}
          </div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Snapshot ID: {baseSnapshot.id}
          </div>
        </div>
      </div>

      {/* Rendered Route Cards */}
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
