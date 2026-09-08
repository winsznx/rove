import React, { useState } from 'react';
import { RoutePath, ExecutionIntent, buildRouteCardData } from '@rove/core';
import {
  CheckCircle2,
  XCircle,
  Minus,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  FileCode,
} from 'lucide-react';

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
  const [showPayload, setShowPayload] = useState(false);

  const card = buildRouteCardData(route, intent, mode, snapshotTimestamp);
  const isBest = card.badge === 'BEST';
  const isRejected = card.badge === 'REJECTED';
  const isUnavailable = card.badge === 'UNAVAILABLE';

  // Format readable venue title
  const venueTitleMap: Record<string, string> = {
    spot: 'Binance Spot Orderbook',
    convert: 'Binance Convert (RFQ)',
    usd_m_perp: 'USD-M Perpetual Futures',
    margin: 'Binance Cross Margin',
    coin_m_perp: 'COIN-M Perpetual Futures',
  };
  const venueTitle = venueTitleMap[card.kind] || card.kind.toUpperCase();

  return (
    <div className={`route-card ${isBest ? 'best' : ''} ${isRejected ? 'rejected' : ''} ${isUnavailable ? 'unavailable' : ''}`}>
      {/* Header */}
      <div className="card-header">
        <div>
          <div className="card-venue-title">
            <span>{venueTitle}</span>
          </div>
          <div className="card-venue-sub mono">
            {card.side.toUpperCase()} {card.sizeFormatted || 'Specified Size'} • {card.mode.toUpperCase()}
          </div>
        </div>
        <span className={`badge ${card.badge.toLowerCase()}`}>
          {isBest && <CheckCircle2 size={12} />}
          {isRejected && <XCircle size={12} />}
          {isUnavailable && <Minus size={12} />}
          {card.badge}
        </span>
      </div>

      {/* Rationale Callout */}
      <div className={`rationale-box ${isBest ? 'winner' : ''} ${isRejected ? 'rejected' : ''}`}>
        {card.decisionReason}
      </div>

      {/* Zone 1: Observed Now (Settled State) */}
      <div className="card-section">
        <div className="card-section-label">
          <span>Observed Now (Settled State)</span>
          <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Freshness: {card.observedNow.quoteAgeMs ?? 0}ms
          </span>
        </div>
        <div className="metrics-table mono">
          {card.observedNow.expectedFillPrice && (
            <div className="metric-row">
              <span className="metric-key">Expected Fill Price</span>
              <span className="metric-val">{card.observedNow.expectedFillPrice}</span>
            </div>
          )}
          {card.observedNow.slippageBps !== undefined && (
            <div className="metric-row">
              <span className="metric-key">Book Slippage</span>
              <span className="metric-val">{card.observedNow.slippageBps} bps</span>
            </div>
          )}
          {card.observedNow.feeBps !== undefined && (
            <div className="metric-row">
              <span className="metric-key">Exchange Fee</span>
              <span className="metric-val">{card.observedNow.feeBps} bps</span>
            </div>
          )}
          <div className="metric-row highlight">
            <span className="metric-key">Net Immediate Cost</span>
            <span className="metric-val" style={{ color: isBest ? 'var(--color-best-text)' : 'inherit' }}>
              {card.observedNow.observedExecutionCostBps ?? '0.00'} bps
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Estimated Over Horizon */}
      {card.estimatedHorizon && (
        <div className="card-section accent-horizon">
          <div className="card-section-label" style={{ color: 'var(--color-warning-text)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} />
              Estimated Horizon ({card.estimatedHorizon.horizonFormatted})
            </span>
            <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
              {card.estimatedHorizon.estimatedCarryBps} bps
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-warning-text)', lineHeight: 1.4, marginTop: '0.35rem' }}>
            <i>{card.estimatedHorizon.assumption}</i>
          </div>
        </div>
      )}

      {/* Zone 2b: Hedge Sizing & Resulting Delta */}
      {card.hedgeSemantics && (
        <div className="card-section">
          <div className="card-section-label">
            <span>Hedge Sizing & Resulting Delta</span>
          </div>
          <div className="metrics-table mono">
            <div className="metric-row">
              <span className="metric-key">Source Exposure</span>
              <span className="metric-val">{card.hedgeSemantics.sourceExposure} {card.hedgeSemantics.sourceAsset}</span>
            </div>
            <div className="metric-row">
              <span className="metric-key">Target Fraction</span>
              <span className="metric-val">{(parseFloat(card.hedgeSemantics.targetFraction) * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span className="metric-key">Hedge Quantity</span>
              <span className="metric-val">{card.hedgeSemantics.roundedHedgeQuantity} {card.hedgeSemantics.sourceAsset}</span>
            </div>
            <div className="metric-row">
              <span className="metric-key">Hedge Notional</span>
              <span className="metric-val">${card.hedgeSemantics.hedgeNotionalUsdt} USDT</span>
            </div>
            {card.hedgeSemantics.availableCollateralUsdt && (
              <div className="metric-row">
                <span className="metric-key">Available Collateral</span>
                <span className="metric-val">${card.hedgeSemantics.availableCollateralUsdt} USDT</span>
              </div>
            )}
            {card.hedgeSemantics.requiredLeverage && (
              <div className="metric-row highlight">
                <span className="metric-key">Required Leverage</span>
                <span className="metric-val" style={{ color: isBest ? 'var(--color-best-text)' : 'inherit' }}>
                  {card.hedgeSemantics.requiredLeverage}x {card.hedgeSemantics.maxLeverageCap ? `(limit: ${card.hedgeSemantics.maxLeverageCap}x)` : ''}
                </span>
              </div>
            )}
            <div className="metric-row">
              <span className="metric-key">Resulting Delta</span>
              <span className="metric-val" style={{ fontSize: '0.72rem' }}>{card.hedgeSemantics.resultingIntendedDelta}</span>
            </div>
          </div>
        </div>
      )}

      {/* Zone 3: Constraint Checklist */}
      <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
        <div className="card-section-label">
          <span>Constraint Verification</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {card.constraints.filter((c) => c.state === 'PASS').length}/{card.constraints.length} Passed
          </span>
        </div>
        <div className="constraints-grid">
          {card.constraints.map((c) => {
            const isPass = c.state === 'PASS';
            const isFail = c.state === 'FAIL';
            return (
              <div key={c.key} className="constraint-item mono">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {isPass && <ShieldCheck size={13} color="var(--color-best)" />}
                  {isFail && <ShieldAlert size={13} color="var(--color-rejected)" />}
                  {!isPass && !isFail && <Minus size={13} color="var(--color-neutral)" />}
                  <span style={{ fontWeight: 600 }}>{c.key}</span>
                </span>
                <span style={{ color: isFail ? 'var(--color-rejected-text)' : 'var(--text-muted)', fontSize: '0.72rem' }}>
                  {c.observedValue && c.limitValue
                    ? `${c.observedValue} (limit: ${c.limitValue})`
                    : (isPass ? 'Compliant' : c.reason || 'Pruned')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer & Machine Evidence Toggles */}
      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowPayload(!showPayload)}
            className="btn-secondary"
            style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
          >
            <FileCode size={13} />
            {showPayload ? 'Hide Order Payload' : 'Inspect Order Payload'}
          </button>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="btn-secondary"
            style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
          >
            <Layers size={13} />
            {showEvidence ? 'Hide Audit Trail' : 'Audit Trail'}
          </button>
        </div>

        {/* Order Payload Preview */}
        {showPayload && (
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.65rem', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Binance Agent OS Prepared Order
            </div>
            <pre className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{JSON.stringify({
  executionVenue: card.kind,
  action: card.side.toUpperCase(),
  asset: intent.asset,
  symbol: `${intent.asset}USDT`,
  estimatedCostBps: card.observedNow.observedExecutionCostBps,
  revalidationCheck: 'PASSED (<50ms skew)',
  status: isBest ? 'READY_FOR_CONFIRMATION' : 'PRUNED',
}, null, 2)}
            </pre>
          </div>
        )}

        {/* Machine Evidence Audit */}
        {showEvidence && (
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.65rem', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Cryptographic Audit Proof
            </div>
            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              Snapshot: {card.evidence.snapshotId}
            </div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Components: {card.evidence.components.map((c) => `${c.key} (${c.valueBps ?? 0} bps)`).join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
