# Rove — Agent-Native Execution-Path Compiler for Binance

[![CI](https://github.com/rove-finance/rove/actions/workflows/ci.yml/badge.svg)](https://github.com/rove-finance/rove/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Binance Agent OS](https://img.shields.io/badge/Binance%20Agent%20OS-Track%20A-F0B90B.svg)](https://agent.binance.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Built for the Binance Agent OS Mini Hackathon — Track A: Agentic Commerce & Trading Applications.**  
> *Live MCP Endpoint Verified:* `https://agent.binance.com/mcp/agentic` (81 tools cataloged, zero withdrawals enabled).

---

## 🎯 The Core Idea

> **"Tell Rove the outcome you want. It finds the Binance path that fits."**

Today, AI agents connected to cryptocurrency exchanges do one of two naive things:
1. **Default blindly to Spot:** When a user asks an agent to *"Hedge 70% of my BNB for 24 hours without selling my BNB"*, naive LLMs execute a Spot market sell—disposing of the user's underlying tokens, surrendering staking yields, and failing the user's economic constraint.
2. **Hallucinate financial calculations:** LLMs fabricate orderbook slippage, invent fee schedules, confuse maker and taker rates, or hallucinate future funding rates as known facts.

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

## 📋 The Route Card

When an intent is compiled, Rove evaluates candidate Binance execution paths (**Spot**, **Convert**, **USD-M Perpetual Futures**, **Cross Margin**, and **COIN-M**) against the same live state snapshot and produces an authoritative **Route Card**:

```markdown
### USD_M_PERP Route — 🟢 BEST [LIVE-READ]

**Direction**: SELL 8.75000000 BNB
**Timestamp**: 2026-09-08T12:44:55.000Z

#### Observed Now
- **Expected Fill**: 751.040 USDT
- **Book Slippage**: 0.00 bps
- **Exchange Fee**: 5.00 bps
- **Total Observed Immediate Cost**: 5.00 bps
- **Quote Freshness**: 0 ms

#### Estimated Over Horizon (24 hours)
- **Projected Funding Carry**: 8.22 bps
- *Explicit assumption: current funding rate of 2.74 bps per 8h persists unchanged across 24 hours.*

#### Constraints
| Constraint | Result | Observed / Limit |
| :--- | :---: | :--- |
| `product_available` | **✅ PASS** | Compliant |
| `trade_permission` | **✅ PASS** | Compliant |
| `retain_underlying` | **✅ PASS** | Compliant |
| `max_leverage` | **✅ PASS** | 1.5x (limit: 1.5x) |
| `max_carry` | **✅ PASS** | 8.22 bps (limit: 15.0 bps) |

> **Decision**: Ranked first because it satisfies every hard constraint and has the lowest observed execution cost (5.00 bps) on this snapshot.
```

> [!IMPORTANT]
> **Strict Cost Separation**: Observed immediate cost (spread, slippage, taker fees) is strictly separated from estimated horizon carry (funding rates). Funding is never presented as guaranteed.

---

## 📊 Rove Bench: Empirical Route-Flip Benchmark

We constructed **Rove Bench**—a test matrix of 20 canonical economic intents evaluated across 100 frozen multi-path Binance orderbook snapshots (2,000 evaluated route decisions).

| Metric | Measured Result | Significance | Evidence Artifact |
| :--- | :---: | :--- | :--- |
| **Route Flip Rate** | **100.0%** | In every intent, Rove picked an optimal route different from naive Spot | `evidence/headline.json` |
| **Constraint Enforcement** | **65.0%** | Hard constraints pruned invalid paths (e.g. retain-underlying, carry cap) | `benchmarks/results.json` |
| **Median Cost Savings** | **12.02 bps** | Convert RFQ zero slippage + derivative shorting vs naive Spot selling | `benchmarks/results.csv` |
| **Snapshot Skew Bound** | **< 50 ms** | Cross-market state captured in single concurrency window | `evidence/live/live-snapshot-bnb.json` |
| **Withdrawal Safety** | **0 Withdrawals** | Sub-account permissions enforce `enableWithdrawals: false` | `evidence/claim-ledger.md` (CLM-012) |

### Key Route-Flip Scenarios

1. **Small Retail Swaps ($750 BNB):** Convert RFQ flips Spot because Convert offers 0.00 bps spread/fee vs Spot's 10.07 bps taker fee + book walk.
2. **Hedge Without Selling Underlying:** Spot and Convert are deterministically rejected with code `RETAIN_UNDERLYING_VIOLATION`. USD-M Perpetual Short is selected with 1.5x leverage cap.
3. **Carry-Constrained Long Horizon:** When projected 7-day funding exceeds user ceiling `max_estimated_carry_bps`, Futures is rejected with `CARRY_CEILING_EXCEEDED`, flipping back to Spot.

---

## 🏗️ Monorepo Architecture

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

## ⚡ Quickstart

### Prerequisites
* Node.js >= 22
* pnpm >= 10 (`npm install -g pnpm`)

### 1. Clone & Verify Clean Build
```bash
git clone https://github.com/rove-finance/rove.git
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

## 🤖 Antigravity & Claude Code Skill Integration

Rove is packaged as a ready-to-run agent skill under `.agents/skills/rove/` and `packages/skill/`:

```bash
# Connect official Binance Agent OS MCP
claude mcp add binance --transport http https://agent.binance.com/mcp/agentic
```

In any agent session:
```
User: "Hedge 70% of my BNB exposure for 24 hours. Don't sell my BNB. Keep leverage below 1.5x."
Agent: [Invokes Rove Skill] -> Compiles intent -> Collects live snapshot -> Formats Route Card -> Awaits user confirmation.
```

---

## 🔒 Safety Guarantees

* **Default Read-Only**: `ROVE_ENABLE_LIVE_TRADE=false` by default. Live trade orders cannot execute without explicit operator toggle.
* **Non-Custodial Architecture**: The web dashboard and core compiler require zero Binance API keys or secrets.
* **Zero External Withdrawals**: Binance Agent OS sub-account permissions strictly forbid external withdrawals (`enableWithdrawals: false`).
* **Deterministic Rejections**: 23 named rejection codes prune infeasible paths with auditable failure reasons.

---

## 📜 Documentation Suite

* [Product Vision & Specification (PRODUCT.md)](PRODUCT.md)
* [System Architecture & Invariants (ARCHITECTURE.md)](ARCHITECTURE.md)
* [Security Model & Safety Gates (SECURITY.md)](SECURITY.md)
* [Installation & Configuration (SETUP.md)](SETUP.md)
* [Scope & Limitations (LIMITATIONS.md)](LIMITATIONS.md)
* [Hackathon Submission & Team (CONTRIBUTIONS.md)](CONTRIBUTIONS.md)
* [Decisions & Empirical Findings (DECISIONS.md)](DECISIONS.md)
