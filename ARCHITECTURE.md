# Rove — Technical Architecture & Implementation Spec

## 1. System Topology

```
                       ┌─────────────────────────────────────┐
                       │          Client Interfaces          │
                       │  • Web UI (apps/web)                │
                       │  • Antigravity Agent Skill          │
                       │  • Claude Code CLI                  │
                       └──────────────────┬──────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   @rove/skill Layer                                    │
│  • Compiles natural language input into typed ExecutionIntent                          │
│  • Orchestrates snapshot capture, route evaluation, ranking, and order preparation     │
└──────────────────┬──────────────────────────────────────────────────┬──────────────────┘
                   │                                                  │
                   ▼                                                  ▼
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│       @rove/binance-agent-os         │          │             @rove/core               │
│  • Sponsor Isolation Adapter         │          │  • Pure deterministic TypeScript     │
│  • Concurrent Snapshot Collector     │◄─────────┤  • Fixed-point decimal arithmetic    │
│  • Multi-path Bounded-Skew (<50ms)   │          │  • 23 named hard constraints         │
│  • Safety-gated Order Executor       │          │  • Lexicographic objective ranking   │
└──────────────────┬───────────────────┘          │  • Route Card data builder           │
                   │                              │  • What-If recompilation engine      │
                   ▼                              └──────────────────────────────────────┘
┌──────────────────────────────────────┐
│        Binance Agent OS MCP          │
│  • Streamable HTTP / JSON-RPC        │
│  • 81 Discovered Tools               │
│  • Non-withdrawable Sub-account      │
└──────────────────────────────────────┘
```

---

## 2. Package Dependency Architecture

The monorepo uses **pnpm workspaces** and **Turborepo** with strictly enforced one-way dependency flow:

1. **`@rove/core`** (Zero external dependencies besides `decimal.js` and `zod`):
   * Contains all financial logic, math, schemas, order book walking, constraint evaluations, and card formatting.
   * Completely decoupled from Binance MCP tools, HTTP APIs, or network I/O.
   * 100% deterministic and testable in isolation.

2. **`@rove/binance-agent-os`** (Depends on `@rove/core`):
   * Implements the sponsor isolation adapter.
   * Maps live MCP tool responses into standardized core data types.
   * Houses the `SnapshotCollector` that captures cross-market state within bounded skew.
   * Houses the `OrderExecutor` with the `ROVE_ENABLE_LIVE_TRADE` safety gate.

3. **`@rove/benchmark`** (Depends on `@rove/core` and `@rove/binance-agent-os`):
   * Provides the 20 canonical intents matrix.
   * Houses the frozen snapshot runner and ablation matrix.
   * Exports CSV, JSON, and markdown summary artifacts.

4. **`@rove/skill`** (Depends on `@rove/core` and `@rove/binance-agent-os`):
   * Exposes high-level pipeline helpers (`compileUserIntent`, `runRovePipeline`).
   * Adheres to the Agent Skills portable specification.

5. **`apps/web`** (Depends on `@rove/core`):
   * React 19 + Vite dashboard.
   * Non-custodial, client-side evaluation engine.
   * Interactive What-If Simulator, Benchmark Explorer, and Evidence Audit viewer.

---

## 3. Orderbook Walking & Fixed-Precision Math

Floating-point numbers in JavaScript (`0.1 + 0.2 !== 0.3`) are strictly prohibited across Rove. All calculations use `decimal.js` configured with 28 decimal places of precision.

### Orderbook Walker Algorithm (`packages/core/src/orderbook/`)
To determine the true effective execution price of a market order:
1. Sort bids descending (for sells) or asks ascending (for buys).
2. Sequentially consume quantity at each price level until the requested quantity (or target notional) is satisfied.
3. Compute Volume Weighted Average Price (VWAP):
   $$\text{VWAP} = \frac{\sum_{i=1}^{k} P_i \times Q_i}{\sum_{i=1}^{k} Q_i}$$
4. Calculate Book Slippage in basis points relative to top-of-book ($P_{\text{top}}$):
   $$\text{Slippage}_{\text{bps}} = \left| \frac{\text{VWAP} - P_{\text{top}}}{P_{\text{top}}} \right| \times 10,000$$

If the requested volume exceeds total liquidity across available depth levels, the route fails closed with `INSUFFICIENT_LIQUIDITY`.

---

## 4. Cross-Market Snapshot Bounded Skew

A valid comparison requires that Spot, Convert, and Futures prices represent the same market state. Rove's `SnapshotCollector` executes state capture concurrently via `Promise.all`:

```typescript
const [spotAccount, permissions, spotDepth, convertQuote, markPrice, funding, futuresAccount] =
  await Promise.all([
    adapter.getSpotAccount(),
    adapter.getApiKeyPermissions(),
    adapter.getSpotDepth({ symbol, limit: 20 }),
    adapter.getConvertQuote({ fromAsset, toAsset, fromAmount }),
    adapter.getUsdMMarkPrice(symbol),
    adapter.getUsdMFunding(symbol),
    adapter.getUsdMAccount(),
  ]);
```

* **Skew Calculation**: $\text{Skew} = T_{\text{completed}} - T_{\text{started}}$
* **Skew Threshold**: Default maximum skew is 1,500 ms (empirically measured at 38–48 ms live).
* If skew exceeds threshold, the snapshot is marked invalid, preventing stale comparisons.

---

## 5. Cost Separation Architecture

Rove strictly separates immediate observed execution cost from forward-looking carry:

### 1. Observed Immediate Cost (`ObservedExecutionCost`)
* **Components**:
  * Exchange taker or maker fee (authoritatively read from `spot.getAccount` or futures schedule).
  * Book slippage (derived from book walk).
  * Convert quote spread delta relative to mid-market.
* **Property**: Certain and measurable at the moment of snapshot capture.

### 2. Estimated Horizon Carry (`EstimatedCarryCost`)
* **Components**:
  * Projected funding payments over user horizon:
    $$\text{Carry}_{\text{bps}} = \text{Rate}_{\text{bps}} \times \left( \frac{\text{Horizon}_{\text{hours}}}{\text{Interval}_{\text{hours}}} \right)$$
* **Property**: Conditional and probabilistic. Must include mandatory disclosure:
  *"Explicit assumption: current funding rate of X bps persists across Y hours."*

---

## 6. Deterministic Multi-Objective Ranking

Surviving candidate routes are ranked using a deterministic lexicographic comparator:

1. **Validity Check**: Routes with status `SELECTED` or `VALID` rank above `REJECTED`, which rank above `UNAVAILABLE`.
2. **Objective Optimization**:
   * For `buy` / `sell` (Immediate execution): Lowest `observedExecutionCostBps`.
   * For `hedge` (Horizon-based): Lowest combined total cost (`observedExecutionCostBps + estimatedCarryBps`).
3. **Tiebreaker 1**: Lowest projected carry.
4. **Tiebreaker 2**: Lower required leverage.
5. **Tiebreaker 3**: Execution venue certainty order (`CONVERT` > `SPOT` > `USD_M_PERP`).

---

## 7. Replay Determinism & Verification

Given identical input (`ComparisonSnapshot`, `ExecutionIntent`, and timestamp), the Rove compiler is mathematically guaranteed to generate the exact same Route Cards, rankings, rejection codes, and order payloads byte-for-byte across all runtime environments.
