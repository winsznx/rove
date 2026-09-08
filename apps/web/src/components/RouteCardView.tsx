import React, { useState } from 'react';
import { RoutePath, ExecutionIntent, buildRouteCardData } from '@rove/core';
import { Info, CheckCircle2, XCircle, Minus } from 'lucide-react';

interface RouteCardViewProps {
  route: RoutePath;
  intent: ExecutionIntent;
  mode?: 'fixture' | 'live-read' | 'live-trade';
  snapshotTimestamp?: string;
}

export const RouteCardView: React.FC<RouteCardViewProps> = ({
  route,
  intent,
  mode = 'live-read',
  snapshotTimestamp,
}) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const card = buildRouteCardData(route, intent, mode, snapshotTimestamp);

  const isBest = card.badge === 'BEST';
  const isRejected = card.badge === 'REJECTED';

  return (
    <div className={`route-card ${isBest ? 'best' : ''} ${isRejected ? 'rejected' : ''}`}>
      {/* Header */}
      <div className="card-header">
        <div>
          <div className="card-title">
            <span>{card.kind.toUpperCase()}</span>
            <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ({card.side.toUpperCase()})
            </span>
          </div>
          <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {card.sizeFormatted || 'Default Size'} • {card.mode.toUpperCase()}
          </div>
        </div>
        <span className={`badge ${card.badge.toLowerCase()}`}>
          {card.badge}
        </span>
      </div>

      {/* Observed Now */}
      <div className="section-block">
        <div className="section-label">Observed Now</div>
        {card.observedNow.expectedFillPrice && (
          <div className="metrics-row">
            <span className="metric-key">Expected Fill</span>
            <span className="metric-val">{card.observedNow.expectedFillPrice}</span>
          </div>
        )}
        {card.observedNow.slippageBps && (
          <div className="metrics-row">
            <span className="metric-key">Book Slippage</span>
            <span className="metric-val">{card.observedNow.slippageBps} bps</span>
          </div>
        )}
        {card.observedNow.feeBps && (
          <div className="metrics-row">
            <span className="metric-key">Exchange Fee</span>
            <span className="metric-val">{card.observedNow.feeBps} bps</span>
          </div>
        )}
        <div className="metrics-row" style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span className="metric-key" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Observed Cost</span>
          <span className="metric-val" style={{ color: isBest ? 'var(--color-best)' : 'var(--text-primary)' }}>
            {card.observedNow.observedExecutionCostBps ?? 'N/A'} bps
          </span>
        </div>
      </div>

      {/* Estimated Horizon */}
      {card.estimatedHorizon && (
        <div className="section-block">
          <div className="section-label">Estimated Over Horizon ({card.estimatedHorizon.horizonFormatted})</div>
          <div className="metrics-row">
            <span className="metric-key">Projected Carry</span>
            <span className="metric-val" style={{ color: 'var(--color-warning)' }}>
              {card.estimatedHorizon.estimatedCarryBps} bps
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontStyle: 'italic' }}>
            {card.estimatedHorizon.assumption}
          </div>
        </div>
      )}

      {/* Constraints Strip */}
      <div className="constraint-strip">
        {card.constraints.map((c, i) => (
          <div key={i} className={`constraint-pill ${c.state.toLowerCase()}`}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{c.key}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
              {c.state === 'PASS' && <CheckCircle2 size={13} color="var(--color-best)" />}
              {c.state === 'FAIL' && <XCircle size={13} color="var(--color-rejected)" />}
              {c.state === 'NA' && <Minus size={13} color="var(--text-muted)" />}
              <span className="mono">{c.observedValue ? `${c.observedValue}` : c.state}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Decision Reason */}
      <div className="card-reason">
        {card.decisionReason}
      </div>

      {/* Expandable Machine Evidence */}
      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-accent)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: 0,
          }}
        >
          <Info size={12} />
          {showEvidence ? 'Hide Machine Evidence' : 'View Machine Evidence'}
        </button>

        {showEvidence && (
          <div style={{ marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
            <div className="mono" style={{ color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Snapshot: {card.evidence.snapshotId}
            </div>
            {card.evidence.components.map((comp, idx) => (
              <div key={idx} className="mono" style={{ marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                • {comp.key}: {comp.valueBps ?? 'N/A'} bps ({comp.status})
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
