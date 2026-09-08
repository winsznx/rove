# Rove — Agent-Native Execution-Path Compiler for Binance

[![CI](https://github.com/winsznx/rove/actions/workflows/ci.yml/badge.svg)](https://github.com/winsznx/rove/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Binance Agent OS](https://img.shields.io/badge/Binance%20Agent%20OS-Track%20A-F0B90B.svg)](https://agent.binance.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Built for the Binance Agent OS Mini Hackathon — Track A: Agentic Commerce & Trading Applications.**  
> *Live-read path verified against production Binance. Live-trade path implemented, tested with fixtures, and safety-gated pending explicit execution verification (`ROVE_ENABLE_LIVE_TRADE=false`). 81 authenticated Binance Agent OS tools catalogued.*

---

### The Core Idea

> **"Tell Rove the outcome you want. It finds the Binance path that fits."**

Today, unassisted agent pipelines connected to cryptocurrency exchanges typically encounter two fundamental challenges:
1. **Default blindly to Spot:** When a user asks an agent to *"Hedge 70% of my BNB for 24 hours without selling my BNB"*, a deterministic Spot-default execution attempts a Spot market sell—disposing of the user's underlying tokens, surrendering staking yields, and violating the user's economic constraint.
2. **Hallucinate financial calculations:** Direct generation fabricates orderbook slippage, invents fee schedules, confuses maker and taker rates, or hallucinates future funding rates as known facts.

### The Rove Principle: Division of Responsibility
```
┌─────────────────────────────────────────────────────────┐
│                      AGENT HOST                         │
│            Language Intelligence & Intent               │
│  "Hedge 70% of my BNB exposure for 24h. Don't sell."   │
└────────────────────────────┬────────────────────────────┘
                             │  Typed ExecutionIntent
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    ROVE COMPILER                        │
│            Deterministic Financial Engine               │
│  • Pure TypeScript fixed-precision math (decimal.js)    │
│  • Authoritative Binance state read (<50ms skew)        │
│  • 23 named hard constraints (rejects invalid routes)   │
│  • Observed immediate cost vs estimated carry split     │
│  • Deterministic objective ranking (lexicographic)      │
└────────────────────────────┬────────────────────────────┘
                             │  Single Authoritative Route Card
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    USER CONFIRMATION                    │
│      "Best Route: USD-M Perpetual Short (5.0 bps)"      │
└─────────────────────────────────────────────────────────┘
```

Rove enforces strict architectural separation:
* **Language intelligence belongs to the agent host:** Extracting user desires into a strongly typed `ExecutionIntent`.
* **Financial correctness and money logic belong strictly to deterministic TypeScript code:** Calculating book depth, fees, constraints, and ranking without LLM math.

---

## The Route Card

When an intent is compiled, Rove evaluates candidate Binance execution paths (**Spot**, **Convert**, **USD-M Perpetual Futures**, **Cross Margin**, and **COIN-M**) against the same live state snapshot and produces an authoritative **Route Card**:

```markdown
### USD_M_PERP Route — BEST [LIVE-READ]

**Direction**: SELL 8.75000000 BNB
**Timestamp**: 2026-09-08T12:44:55.000Z

#### Observed Now
- **Expected Fill**: 751.040 USDT
- **Book Slippage**: 0.00 bps
- **Exchange Fee**: 5.00 bps
- **Current Funding Rate**: 2.74 bps per 8h (Observed live)
- **Total Observed Immediate Cost**: 5.00 bps
- **Quote Freshness**: 0 ms

#### Estimated Over Horizon (24 hours)
- **Projected Funding Carry**: 8.22 bps
- *Estimated 24h carry if the current 8h funding rate persisted (scenario only, not a known future cost).*

#### Hedge Sizing & Resulting Delta
- **Source Exposure**: 12.50000000 BNB (from free spot balance)
- **Target Fraction**: 0.7000 (70.0%)
- **Calculated Quantity**: 8.75000000 BNB (rounded to 8.750 at 0.001 step size)
- **Hedge Notional**: $6571.60 USDT at mark price 751.040
- **Available Margin Collateral**: $5000.00 USDT
- **Required / Effective Leverage**: 1.31x (within user ceiling of 1.5x)
- **Resulting Intended Delta**: +3.75000000 BNB (30.0% unhedged)

#### Constraints
| Constraint | Result | Observed / Limit |
| :--- | :---: | :--- |
| `product_available` | **PASS** | Compliant |
| `trade_permission` | **PASS** | Compliant |
| `retain_underlying` | **PASS** | Compliant |
| `max_leverage` | **PASS** | 1.31x required (limit: 1.5x) |
| `max_carry` | **PASS** | 8.22 bps (limit: 15.0 bps) |

> **Decision**: Ranked first because it satisfies every hard constraint and has the lowest observed execution cost (5.00 bps) on this snapshot.
```

> [!IMPORTANT]
> **Strict Cost Separation**: Observed immediate cost (spread, slippage, taker fees) is strictly separated from estimated horizon carry (funding rates). Funding is never presented as guaranteed.

---

## Rove Bench: Empirical Route-Flip Benchmark

We constructed **Rove Bench**—running 2,000 deterministic evaluations across 20 economic intents and 100 synthetic multi-asset order-book scenarios anchored to observed Binance reference prices (BNB, BTC, ETH, SOL).

| Metric | Measured Result | Significance | Evidence Artifact |
| :--- | :---: | :--- | :--- |
| **Route Decision Change Rate** | **31.6%** (2,000 evaluations) | Rove picks optimal route differing from Spot-default baseline via venue flips or safe pruning | `evidence/headline.json` |
| **Constraint Rescue Rate** | **27.2%** | Rescues hedge intents from Spot-default liquidation to USD-M perpetual hedge | `evidence/headline.json` |
| **Baseline vs Rove Violations** | **75.7% vs 0.0%** | On Rove Bench, the Spot-default baseline violated at least one hard intent constraint in 75.7% of evaluations, while Rove produced 0 hard-constraint violations | `evidence/headline.json` |
| **Comparable Route Savings** | **0.00 bps** | Median savings strictly on valid, constraint-satisfying, economically equivalent routes (396/396 comparable evaluations) | `benchmarks/results.json` |
| **Fail-Closed Safety** | **100% across tested controls** | 100% correct fail-closed behavior across tested control cases (stale, incomplete, collateral, leverage, unavailable-cost) with named machine rejection codes | `packages/core/tests/constraints.test.ts` |
| **Snapshot Skew Bound** | **< 50 ms** | Cross-market state captured in single concurrency window | `evidence/live/live-snapshot-bnb.json` |
| **Withdrawal Safety** | **0 Withdrawals** | Sub-account permissions enforce `enableWithdrawals: false` | `evidence/claim-ledger.md` (CLM-012) |

### Key Route-Flip Scenarios

1. **Small Retail Swaps ($750 BNB):** Spot book walk (10.07 bps total observed cost) beats Convert RFQ because Convert embeds 54.97 bps of spread markup in the quoted rate despite claiming 0 explicit fees (saving 44.90 bps / $3.36 on Spot).
2. **Hedge Without Selling Underlying:** Spot and Convert are deterministically rejected with code `RETAIN_UNDERLYING_CONFLICT`. USD-M Perpetual Short is selected with dynamic 1.31x leverage check against collateral.
3. **Carry-Constrained Long Horizon:** When projected funding exceeds user ceiling `max_estimated_carry_bps`, Futures is rejected with `CARRY_LIMIT`, pruning the invalid path.

---

## Binance Agent OS Tool Surface Audit

**Live-read path verified against production Binance. Live-trade path implemented, tested with fixtures, and safety-gated pending explicit execution verification.**

- **81 Catalogued Tools** across 8 namespaces (`spot`, `convert`, `futures_usds`, `futures_coin`, `margin`, `wallet`, `sub_account`, `analysis`).
- **7 Rove-Critical Live-Exercised Tools:**
  1. `spot.depth` — Live orderbook depth reading and slippage computation.
  2. `spot.tickerPrice` — Real-time price reference.
  3. `convert.sendQuoteRequest` — Live RFQ quotation and embedded spread markup extraction.
  4. `futures_usds.premiumIndexKlineData` — Live funding rate and interval reading.
  5. `wallet.accountStatus` — Sub-account status verification.
  6. `wallet.getApiKeyPermission` — Zero-withdrawal permission verification.
  7. `wallet.queryUserWalletBalance` — Free balance asset availability.
- **1 Exercised State-Gated Tool:**
  - `margin.queryCrossMarginAccountDetails` — Rejected gracefully with code `-11001` (Margin account not enabled), proving deterministic fail-closed state verification.
- **73 Unexercised / Dormant Tools:** E.g., `futures_coin`, `sub_account`, and trade execution mutation tools held safely dormant behind `ROVE_ENABLE_LIVE_TRADE=false`.

---

## Monorepo Architecture

```
rove/
├── packages/
│   ├── core/                  # Pure deterministic compiler, fixed-point math, constraints, ranking
│   ├── binance-agent-os/      # Sponsor isolation layer, MCP client adapter, snapshot collector
│   ├── benchmark/             # 20-intent benchmark engine, 100 frozen snapshots, ablation runner
│   └── skill/                 # Antigravity & Claude Code portable skill definition
├── apps/
│   └── web/                   # Non-custodial reactive dashboard (What-If Simulator & Explorer)
├── evidence/
│   ├── claim-ledger.md        # Verifiable audit ledger for all public claims
│   ├── headline.json          # Machine-readable benchmark headline metrics
│   ├── live/                  # Live snapshot & route card captures against real Binance Agent OS
│   └── mcp/                   # Discovered 81-tool catalog and capability map
└── benchmarks/
    ├── results.csv            # Route-flip matrix across all 20 intents
    ├── results.json           # Detailed machine-readable run outputs
    └── snapshots/             # 100 frozen Binance orderbook snapshots
```

---

## Quickstart

### Prerequisites
* Node.js >= 22
* pnpm >= 10 (`npm install -g pnpm`)

### 1. Clone & Verify Clean Build
```bash
git clone https://github.com/winsznx/rove.git
cd rove
pnpm install
pnpm verify
```
`pnpm verify` executes `turbo run typecheck test build` across all 5 packages and apps, running 35 unit and integration tests.

### 2. Launch Local Web Dashboard
```bash
pnpm --filter rove-web dev
```
Open `http://localhost:5173` to explore the **Interactive What-If Recompilation Simulator**, **Rove Bench Results**, and **Ground-Truth Evidence Ledger**.

---

## SkillHub & Agent OS Skill Integration

Rove is packaged as a fully portable, production-ready agent skill conforming to standard open agent skill specifications (`.agents/skills/rove/SKILL.md` and `packages/skill/SKILL.md`), ready for submission to Binance Agent OS SkillHub registries.

### Skill Location & Structure
- **Root Agent Skill**: [`.agents/skills/rove/SKILL.md`](.agents/skills/rove/SKILL.md)
- **Monorepo Package**: [`packages/skill/SKILL.md`](packages/skill/SKILL.md)

### 1. Connect Official Binance Agent OS Gateway
```bash
# Connect official Binance Agent OS MCP transport
claude mcp add binance --transport http https://agent.binance.com/mcp/agentic
```

### 2. Natural Language Agent Interaction
In any Antigravity, Claude Code, Cursor, or Binance Agent OS session:
```text
User:  "Hedge 70% of my BNB exposure for 24 hours. Don't sell my BNB. Keep leverage below 1.5x."
Agent: [Invokes Rove Skill] -> Compiles intent -> Reads live Binance state -> Formats Route Card -> Awaits user confirmation.
```

The host LLM delegates all financial arithmetic, book walking, and constraint checks to `@rove/core`, while using language intelligence to parse user intent and explain formatted Route Cards.

---

## Safety Guarantees

* **Default Read-Only**: `ROVE_ENABLE_LIVE_TRADE=false` by default. Live trade orders cannot execute without explicit operator toggle.
* **Non-Custodial Architecture**: The web dashboard and core compiler require zero Binance API keys or secrets.
* **Zero External Withdrawals**: Binance Agent OS sub-account permissions strictly forbid external withdrawals (`enableWithdrawals: false`).
* **Deterministic Rejections**: 23 named rejection codes prune infeasible paths with auditable failure reasons.

---

## Documentation Suite

* [Product Vision & Specification (PRODUCT.md)](PRODUCT.md)
* [System Architecture & Invariants (ARCHITECTURE.md)](ARCHITECTURE.md)
* [Security Model & Safety Gates (SECURITY.md)](SECURITY.md)
* [Installation & Configuration (SETUP.md)](SETUP.md)
* [Scope & Limitations (LIMITATIONS.md)](LIMITATIONS.md)
* [Hackathon Submission & Team (CONTRIBUTIONS.md)](CONTRIBUTIONS.md)
* [Decisions & Empirical Findings (DECISIONS.md)](DECISIONS.md)
