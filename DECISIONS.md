# Rove — Architectural & Product Decision Records

## ADR-001: Binance Agent OS MCP Endpoint & Tool Discovery
- **Status**: Accepted
- **Date**: 2026-09-08
- **Context**: Binance Agent OS provides an MCP gateway at `https://agent.binance.com/mcp/agentic`.
- **Empirical Evidence**:
  - Live OAuth 2.0 handshake verified (`agentic-oauth/authorize`, `oauth-agentic/token`, PKCE S256).
  - 81 discrete MCP tools discovered and cataloged in `evidence/mcp/tool-list.json`.
  - Canonical routes (Spot, Convert, USD-M) verified with live data reads.
- **Decision**: Use the discovered 81 tools mapped behind clean TypeScript adapter interfaces in `packages/binance-agent-os`. Core logic remains strictly independent of tool naming.

---

## ADR-002: Convert Quote ID & Pricing Behavior
- **Status**: Accepted
- **Date**: 2026-09-08
- **Context**: `convert.sendQuoteRequest` needs to be used for pricing and execution.
- **Empirical Evidence**: When calling `convert.sendQuoteRequest` with `fromAmount: "10"`, `fromAsset: "USDT"`, `toAsset: "BNB"`, the endpoint returned live pricing (`ratio: "0.00132334"`, `inverseRatio: "755.661"`, `validTimestamp: 1788870461108`, `toAmount: "0.01323344"`). However, `quoteId` is omitted unless the account has sufficient balance for the swap.
- **Decision**:
  - In `live-read` mode, use the live `ratio`, `inverseRatio`, and `validTimestamp` to evaluate Convert route pricing, spread delta, and freshness.
  - In `live-trade` mode, check for `quoteId`. If missing due to 0 balance, reject cleanly with `INSUFFICIENT_BALANCE` rather than failing unexpectedly.

---

## ADR-003: Spot Fee Derivation from Authoritative Account State
- **Status**: Accepted
- **Date**: 2026-09-08
- **Context**: PRD Section 3.4 & 16.1 forbid fabricating default fees if account-specific fees are obtainable.
- **Empirical Evidence**: Calling `spot.getAccount` returned `commissionRates: {"maker":"0.00100000","taker":"0.00100000"}`, `makerCommission: 10`, `takerCommission: 10` (10 bps).
- **Decision**: Read authoritative account fees directly from `spot.getAccount`. Never inject hardcoded defaults when live account data is accessible.

---

## ADR-004: USD-M Funding Rate Observation & Carry Horizon
- **Status**: Accepted
- **Date**: 2026-09-08
- **Context**: PRD Section 3.5 & 16.3 mandate separating observed immediate cost from estimated horizon carry under an explicit assumption.
- **Empirical Evidence**: `futures_usds.premiumIndexKlineData` supplies recent premium index intervals.
- **Decision**: Extract current funding rate from latest interval premium index. In all Route Cards, benchmark outputs, and receipts, carry cost must be explicitly labeled:
  `Estimated carry assuming current funding rate of X bps persists across Y horizon`. Never label future funding as known.

---

## ADR-005: Margin Feature Gate Policy
- **Status**: Accepted
- **Date**: 2026-09-08
- **Context**: PRD Section 4.2 permits Margin only if authenticated capability exists and full costing is honest.
- **Empirical Evidence**: `margin.queryCrossMarginAccountDetails` returned `tradeEnabled: false`, `borrowEnabled: false`, `created: false`.
- **Decision**: Keep Margin feature-gated `UNAVAILABLE` (`costingComplete: false`). Never generate synthetic borrow quotes.

---

## ADR-006: COIN-M Feature Gate Policy
- **Status**: Accepted
- **Date**: 2026-09-08
- **Context**: PRD Section 4.1 defines canonical V1 routes as Spot + Convert + USD-M Perpetual Futures.
- **Empirical Evidence**: `futures_coin.accountInformation` returned `canTrade: true` and inverse contract positions.
- **Decision**: Keep COIN-M feature-gated in V1 while architecting the types to support it without core refactoring. Focus primary product depth and benchmarking on the canonical three routes.

---

## ADR-007: Safe Live-Trading Gating
- **Status**: Accepted
- **Date**: 2026-09-08
- **Context**: User safety around live account funds.
- **Decision**: Live trade order submission is disabled by default via `ROVE_ENABLE_LIVE_TRADE=false`. All development, snapshot collection, route generation, what-if compilation, and benchmarks run in `live-read` or `fixture` mode. Live trade requires explicit user approval.
