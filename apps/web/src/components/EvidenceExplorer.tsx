import React from 'react';
import { Database, Layers, Terminal } from 'lucide-react';

export const EvidenceExplorer: React.FC = () => {
  const claims = [
    {
      id: 'CLM-001',
      claim: 'Binance Agent OS MCP provides 81 live tools across Spot, Convert, Futures, Margin, and Wallet.',
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
      claim: 'Convert pricing is obtained from live quote requests.',
      status: 'VERIFIED_LIVE',
      artifact: 'evidence/mcp/capability-map.json',
    },
    {
      id: 'CLM-004',
      claim: 'USD-M perpetual funding and mark price are read live.',
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
  ];

  return (
    <div>
      {/* Capability Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="section-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Terminal size={16} color="var(--color-accent)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Agent OS Endpoint</span>
          </div>
          <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            https://agent.binance.com/mcp/agentic
          </div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-best)', marginTop: '0.35rem' }}>
            ● LIVE STREAMABLE HTTP / JSON-RPC
          </div>
        </div>

        <div className="section-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Database size={16} color="var(--color-accent)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Discovered MCP Tools</span>
          </div>
          <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            81 Tools Cataloged
          </div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Spot (11), Convert (10), USD-M (16), Margin (13), Wallet (11), COIN-M (16)
          </div>
        </div>

        <div className="section-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Layers size={16} color="var(--color-accent)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sub-Account Permissions</span>
          </div>
          <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Market: READY • Account: READY • Trade: READY
          </div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-best)', marginTop: '0.35rem' }}>
            Withdrawals: DISABLED (Agentic Guardrail)
          </div>
        </div>
      </div>

      {/* Claim Ledger */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
        Ground-Truth Claim Ledger
      </h3>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Verifiable Public Claim</th>
              <th>Status</th>
              <th>Evidence Artifact</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{c.id}</td>
                <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>{c.claim}</td>
                <td>
                  <span className="badge best" style={{ fontSize: '0.7rem' }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{c.artifact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
