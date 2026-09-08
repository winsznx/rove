import React from 'react';
import { Download, FileText } from 'lucide-react';

export const BenchmarkExplorer: React.FC = () => {

  const headline = {
    experiment: 'Rove Bench 20-Intent Route-Flip Experiment',
    totalEvaluatedIntents: 20,
    routeFlipRate: '100.0%',
    constraintEnforcementRate: '65.0%',
    medianCostSavingsBps: '12.02',
    frozenSnapshotsCount: 100,
  };

  const sampleRows = [
    {
      id: 'INT-001',
      text: 'Buy $750 of BNB now with lowest immediate execution cost.',
      winner: 'CONVERT',
      baseline: 'SPOT',
      flipped: true,
      delta: '10.00 bps',
      reason: 'Convert RFQ won retail small ticket due to 0 book slippage.',
    },
    {
      id: 'INT-002',
      text: 'Buy $10,000 of BNB. Keep observed execution cost under 8 bps.',
      winner: 'CONVERT',
      baseline: 'SPOT',
      flipped: true,
      delta: '12.02 bps',
      reason: 'Deep book walk on Spot exceeded 8 bps ceiling; Convert quote survived.',
    },
    {
      id: 'INT-006',
      text: 'Hedge 70% of my BNB exposure for 24 hours. Do not sell my BNB. Keep leverage below 1.5x.',
      winner: 'USD_M_PERP',
      baseline: 'SPOT',
      flipped: true,
      delta: '12.50 bps',
      reason: 'Spot rejected: RETAIN_UNDERLYING_CONFLICT. Switched to USD-M perp.',
    },
    {
      id: 'INT-007',
      text: 'Hedge 100% of my BNB exposure for 8 hours. Retain underlying BNB. Max leverage 1.0x.',
      winner: 'USD_M_PERP',
      baseline: 'SPOT',
      flipped: true,
      delta: '11.80 bps',
      reason: 'Spot & Convert rejected: RETAIN_UNDERLYING_CONFLICT. USD-M compliant.',
    },
    {
      id: 'INT-009',
      text: 'Hedge 70% of my BNB exposure for 24 hours. Retain underlying. Cap estimated carry at 1.0 bps.',
      winner: 'NONE',
      baseline: 'SPOT',
      flipped: true,
      delta: '0.00 bps',
      reason: 'Spot rejected (retain underlying); USD-M rejected: CARRY_LIMIT (3.75 > 1.0).',
    },
    {
      id: 'INT-011',
      text: 'Hedge 80% of BTC exposure for 48 hours. Retain underlying BTC. Leverage <= 1.5x.',
      winner: 'USD_M_PERP',
      baseline: 'SPOT',
      flipped: true,
      delta: '14.20 bps',
      reason: 'Spot rejected (retain underlying); USD-M perp executed cleanly.',
    },
    {
      id: 'INT-019',
      text: 'Buy $250 of BNB (retail small ticket). Compare RFQ Convert vs Spot market order.',
      winner: 'CONVERT',
      baseline: 'SPOT',
      flipped: true,
      delta: '9.80 bps',
      reason: 'Convert zero-fee RFQ beat Spot taker commission.',
    },
  ];

  return (
    <div>
      {/* Metrics Banner */}
      <div className="hero-stats" style={{ marginBottom: '2rem' }}>
        <div className="stat-item">
          <div className="stat-value">{headline.routeFlipRate}</div>
          <div className="stat-label">Route-Flip Rate vs Baseline</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{headline.constraintEnforcementRate}</div>
          <div className="stat-label">Constraint Enforcement Rate</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{headline.medianCostSavingsBps} bps</div>
          <div className="stat-label">Median Observed Cost Delta</div>
        </div>
      </div>

      {/* Table Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Route-Flip Experiment Matrix (20 Canonical Intents)</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href="/benchmarks/results.csv"
            download="results.csv"
            className="btn-github"
            style={{ fontSize: '0.8rem' }}
          >
            <Download size={14} /> Download CSV
          </a>
          <a
            href="/benchmarks/results.json"
            download="results.json"
            className="btn-github"
            style={{ fontSize: '0.8rem' }}
          >
            <FileText size={14} /> Download JSON
          </a>
        </div>
      </div>

      {/* Benchmark Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Intent ID</th>
              <th>Natural Language Goal</th>
              <th>Winning Route</th>
              <th>Baseline</th>
              <th>Cost Delta</th>
              <th>Deterministic Decision Rationale</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row) => (
              <tr key={row.id}>
                <td style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{row.id}</td>
                <td style={{ fontFamily: 'var(--font-sans)', maxWidth: '320px' }}>{row.text}</td>
                <td>
                  <span className={`badge ${row.winner === 'NONE' ? 'rejected' : 'best'}`}>
                    {row.winner}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{row.baseline}</td>
                <td style={{ color: 'var(--color-best)', fontWeight: 600 }}>{row.delta}</td>
                <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ablation Summary */}
      <div className="section-block" style={{ padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Ablation Analysis Results</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="mono" style={{ fontSize: '0.8rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ color: 'var(--text-muted)' }}>Spot-Only Ablation</div>
            <div style={{ color: 'var(--color-rejected)', fontWeight: 700, marginTop: '0.25rem' }}>
              65% Failure Rate
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Violates retain-underlying constraint
            </div>
          </div>
          <div className="mono" style={{ fontSize: '0.8rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ color: 'var(--text-muted)' }}>No-Convert Ablation</div>
            <div style={{ color: 'var(--color-warning)', fontWeight: 700, marginTop: '0.25rem' }}>
              +10 bps Spread Cost
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Forces book slippage on small retail orders
            </div>
          </div>
          <div className="mono" style={{ fontSize: '0.8rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ color: 'var(--text-muted)' }}>No-Funding Awareness</div>
            <div style={{ color: 'var(--color-rejected)', fontWeight: 700, marginTop: '0.25rem' }}>
              Blind Carry Risk
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Fails to project 24h+ funding drag
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
