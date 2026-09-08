# Rove Claim Ledger

This ledger records every public claim made by Rove alongside its verifying evidence artifact, code path, and reproduction test. No headline claim may be asserted without an entry in this ledger.

| Claim ID | Claim Statement | Evidence Artifact | Verification Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **CLM-001** | Binance Agent OS MCP provides 81 live tools across Spot, Convert, Futures, Margin, and Wallet. | `evidence/mcp/tool-list.json`, `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | Discovered via live MCP connection on 2026-09-08. |
| **CLM-002** | Spot account fees are read directly from live account state rather than hardcoded. | `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | `spot.getAccount` returned maker 10 bps, taker 10 bps. |
| **CLM-003** | Convert pricing is obtained from live quote requests. | `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | `convert.sendQuoteRequest` returned real-time ratio & inverse ratio. |
| **CLM-004** | USD-M perpetual funding and mark price are read live. | `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | `futures_usds.premiumIndexKlineData` returned premium index intervals. |
| **CLM-005** | Retain-underlying constraint deterministically rejects spot/convert selling when protecting an asset. | `packages/core/tests/constraints.test.ts` | **PENDING_TEST** | Will be proven by deterministic test suite. |
| **CLM-006** | Observed execution cost and estimated horizon carry are strictly separate data structures. | `packages/core/src/cost/` | **PENDING_TEST** | Hard typing enforces separation. |
| **CLM-007** | Same snapshot + same intent + same engine version produces byte-identical ranking. | `benchmarks/results.json` | **PENDING_BENCH** | Proven across 100 benchmark replays. |
| **CLM-008** | Margin route fails closed as `UNAVAILABLE` when margin trading is disabled on sub-account. | `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | `margin.queryCrossMarginAccountDetails` returned `tradeEnabled: false`. |
