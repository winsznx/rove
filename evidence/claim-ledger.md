# Rove Claim Ledger

This ledger records every public claim made by Rove alongside its verifying evidence artifact, code path, and reproduction test. No headline claim may be asserted without an entry in this ledger.

| Claim ID | Claim Statement | Evidence Artifact | Verification Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **CLM-001** | Binance Agent OS MCP provides 81 live tools across Spot, Convert, Futures, Margin, and Wallet. | `evidence/mcp/tool-list.json`, `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | Discovered via live MCP connection on 2026-09-08. |
| **CLM-002** | Spot account fees are read directly from live account state rather than hardcoded. | `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | `spot.getAccount` returned maker 10 bps, taker 10 bps. |
| **CLM-003** | Convert pricing is obtained from live quote requests. | `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | `convert.sendQuoteRequest` returned real-time ratio & inverse ratio. |
| **CLM-004** | USD-M perpetual funding and mark price are read live. | `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | `futures_usds.premiumIndexKlineData` returned premium index intervals. |
| **CLM-005** | Retain-underlying constraint deterministically rejects spot/convert selling when protecting an asset. | `packages/core/tests/constraints.test.ts` | **VERIFIED_TEST** | Unit and fixture tests pass (100% rejection rate on asset disposal). |
| **CLM-006** | Observed execution cost and estimated horizon carry are strictly separate data structures. | `packages/core/src/cost/` | **VERIFIED_CODE** | Hard TypeScript types enforce separation of observed vs estimated terms. |
| **CLM-007** | Same snapshot + same intent + same engine version produces byte-identical ranking. | `benchmarks/results.json` | **VERIFIED_BENCH** | Proven across 100 frozen benchmark replays. |
| **CLM-008** | Margin route fails closed as `UNAVAILABLE` when margin trading is disabled on sub-account. | `evidence/mcp/capability-map.json` | **VERIFIED_LIVE** | `margin.queryCrossMarginAccountDetails` returned `tradeEnabled: false`. |
| **CLM-009** | Route-flip rate of 100% across 20 varied intents vs naive Spot baseline. | `benchmarks/results.csv`, `evidence/headline.json` | **VERIFIED_BENCH** | Rove dynamically routes to Convert or USD-M based on intent constraints. |
| **CLM-010** | Hard constraints pruned invalid execution paths in 65% of test scenarios. | `benchmarks/results.json`, `evidence/headline.json` | **VERIFIED_BENCH** | Enforced retain-underlying, carry limits, and execution-cost caps. |
| **CLM-011** | Median observed cost savings of 12.02 bps when routing retail tickets or hedging. | `evidence/headline.json` | **VERIFIED_BENCH** | Zero book slippage on RFQ Convert + optimal derivative hedging. |
| **CLM-012** | Multi-path live state capture operates within bounded skew (< 50ms) and zero withdrawal capability. | `evidence/live/live-snapshot-bnb.json`, `evidence/live/live-route-card-hedge.md` | **VERIFIED_LIVE** | Captured live against BNBUSDT on Binance Agent OS; permissions enforce enableWithdrawals=false. |
