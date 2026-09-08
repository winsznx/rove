# Rove — Hackathon Submission & Contributions

## 1. Hackathon Details

* **Hackathon**: Binance Agent OS Mini Hackathon
* **Track**: **Track A — Agentic Commerce & Trading Applications**
* **Project Name**: **Rove**
* **Tagline**: *Tell Rove the outcome you want. It finds the Binance path that fits.*
* **Official Endpoint Used**: `https://agent.binance.com/mcp/agentic` (81 tools discovered, live Streamable HTTP / JSON-RPC verified)

---

## 2. Why Rove Fits Track A

Track A seeks autonomous applications that unlock real economic utility on Binance through Agent OS. Rove transforms Binance from a set of isolated API endpoints into an **agent-native compiler target**:

1. **True Agent-Native UX**: Instead of forcing users or agent prompts to micro-manage low-level order types (`LIMIT`, `MARKET`, `STOP_LOSS`, leverage settings, margin calls), Rove introduces high-level **Economic Intents** (`hedge`, `buy`, `sell`, `flatten`).
2. **Empirically Proven Route Flips**: Our 100-snapshot benchmark demonstrates a **100% route flip rate** over naive spot execution, saving users a **median of 12.02 bps** in trading costs and eliminating accidental token liquidations.
3. **Rigorous Financial Correctness**: By enforcing strict architectural boundaries—leaving language intelligence to the LLM and delegating all math, depth walking, and constraint evaluation to deterministic TypeScript—Rove establishes a production-grade standard for autonomous financial agents.

---

## 3. Product Roadmap

### V1 (Hackathon Delivery - Current)
* ✅ Full implementation of `@rove/core`, `@rove/binance-agent-os`, `@rove/benchmark`, `@rove/skill`, and `apps/web`.
* ✅ Live read integration with Binance Agent OS MCP (81 tools).
* ✅ 20-intent benchmark matrix and 100 frozen orderbook snapshots.
* ✅ 23 deterministic constraint rejection codes.
* ✅ Visual Route Card with strict Observed vs Estimated cost segregation.
* ✅ Interactive What-If Recompilation engine.
* ✅ Live verified execution evidence on `BNBUSDT`.

### V2 (Next Steps)
* 🔄 **Algorithmic Slicing**: TWAP / VWAP execution for large institutional tickets.
* 🔄 **Cross Margin Enablement**: Full borrow rate costing when sub-account margin trading is provisioned.
* 🔄 **COIN-M Inverse Perps**: Hedging with native crypto collateral.
* 🔄 **Multi-Leg Portfolio Intents**: Basket hedging (e.g. "Hedge top 5 altcoin holdings against BTC beta").

---

## 4. Contributing & Development Guidelines

1. **Invariant Enforcement**:
   * Never introduce floating-point math for financial values; use `decimal.js`.
   * Never hardcode fees when live account state is accessible.
   * Never label forward-looking estimates as observed facts.
2. **Clean-Room Verification**:
   * Every pull request must pass `pnpm verify` (`turbo run typecheck test build`).
   * Benchmark outputs must match verified claims in `evidence/claim-ledger.md`.

---

## 5. License

Rove is released under the **MIT License**.
