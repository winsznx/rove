# Rove — Product Specification & Vision

## 1. Product Overview & Purpose

Rove is an **agent-native execution-path compiler for Binance**. It accepts a user's high-level economic intent expressed in natural language, compiles it into a strictly typed `ExecutionIntent`, compares candidate Binance execution venues against the exact same live orderbook state, deterministically rejects non-viable paths with named codes, ranks surviving paths according to user objectives, and prepares a single, auditable **Route Card** for operator approval.

Rove was built for the **Binance Agent OS Mini Hackathon, Track A: Agentic Commerce & Trading Applications**.

---

## 2. The Core Problem: The Naive LLM Fallacy

When traditional AI agents are granted access to cryptocurrency exchange APIs, they suffer from two critical architectural defects:

### Defect 1: The Monolithic Spot Trap
Most AI trading agents have only one tool: `createSpotOrder`. When a user provides a complex economic request:
> *"I have 50 BNB. I want to protect myself against downside over the next 48 hours, but I want to keep my BNB for Launchpool rewards. Keep my leverage under 2x."*

A naive LLM will execute `spot.newOrder(symbol="BNBUSDT", side="SELL")`. This action:
* Destroys the user's Launchpool yield and voting rights.
* Incurs immediate spot taker fees (10 bps).
* Incurs market depth slippage.
* Irrevocably disposes of the underlying asset contrary to the user's explicit instructions.

### Defect 2: Financial Hallucination & Arithmetic Incoherence
Language models are probabilistic token predictors, not arithmetic engines. When asked to evaluate execution options:
* They hallucinate order book depth, inventing average fill prices.
* They confuse maker, taker, and convert spread costs.
* They treat dynamic 8-hour perpetual funding rates as fixed or known constants.
* They cannot deterministically enforce hard numeric constraints (e.g., maximum leverage of 1.5x).

---

## 3. The Solution: Strict Division of Responsibility

Rove resolves this architectural defect through strict functional partitioning:

```
┌────────────────────────────────────────────────────────┐
│                   Agent Host (LLM)                     │
│  - Understands ambiguous user requests                 │
│  - Extracts economic goals and constraints             │
│  - Formats typed ExecutionIntent                       │
│  - Never calculates prices, slippage, or funding       │
└───────────────────────────┬────────────────────────────┘
                            │ Strongly Typed ExecutionIntent
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Rove Compiler Engine                   │
│  - Pure deterministic TypeScript logic                 │
│  - Fixed-point arithmetic via Decimal.js               │
│  - Live concurrent orderbook state capture (<50ms skew)│
│  - 23 hard rejection constraints                       │
│  - Strict Observed vs Estimated cost separation        │
│  - Lexicographic multi-objective ranking               │
└───────────────────────────┬────────────────────────────┘
                            │ Authoritative Route Card
                            ▼
┌────────────────────────────────────────────────────────┐
│                   User Confirmation                    │
│  - Auditable breakdown of cost, carry, and rationale   │
│  - Single click / signature confirmation               │
│  - Exact order payload ready for execution             │
└────────────────────────────────────────────────────────┘
```

---

## 4. The Four-Stage Pipeline: Compile → Reject → Rank → Confirm

### Stage 1: Compile
The user's prompt is parsed into an `ExecutionIntent`. If required parameters are missing or ambiguous (such as unspecified hedge horizon or unstated size), Rove generates the **minimum decision-changing clarifying question** rather than guessing.

### Stage 2: Reject (Constraint Pruning)
Every candidate route is evaluated against 23 deterministic hard constraints:
* `RETAIN_UNDERLYING_VIOLATION`: Rejects Spot / Convert selling if the user specified underlying retention.
* `MAX_LEVERAGE_EXCEEDED`: Rejects futures or margin paths exceeding the specified leverage cap.
* `CARRY_CEILING_EXCEEDED`: Rejects perpetual routes whose projected funding carry exceeds the user's ceiling.
* `INSUFFICIENT_LIQUIDITY`: Rejects orderbook routes where liquidity is insufficient to fill the requested size within the book depth.
* `QUOTE_EXPIRED`: Rejects RFQ quotes past their validity window.
* `PRODUCT_UNAVAILABLE`: Rejects routes feature-gated or disabled on the sub-account (e.g. Cross Margin).

### Stage 3: Rank
Surviving eligible routes are deterministically ranked according to the user's primary objective:
1. Primary Metric: Lowest observed immediate execution cost (or lowest total cost for short horizons).
2. First Tiebreaker: Lowest projected horizon carry.
3. Second Tiebreaker: Lower leverage.
4. Third Tiebreaker: Higher quote certainty (Convert RFQ > Spot limit > Spot market).

### Stage 4: Confirm
Rove formats the winning and alternative routes into a standardized **Route Card**. Execution is halted until the operator confirms the trade. When confirmed, Rove verifies that live market state has not drifted past safety thresholds before submitting the order to Binance Agent OS.

---

## 5. The Route Card Anatomy

Every Route Card adheres to strict information architecture:

1. **Header**: Route venue (`SPOT`, `CONVERT`, `USD_M_PERP`, `MARGIN`), direction (`BUY` / `SELL`), and status badge (`BEST`, `VALID`, `REJECTED`, `UNAVAILABLE`).
2. **Observed Now**: Authoritative metrics measured on the snapshot:
   * Expected fill price.
   * Orderbook slippage (in basis points).
   * Authoritative taker / maker / convert fee.
   * Total observed immediate cost (in basis points).
   * Quote freshness.
3. **Estimated Over Horizon**: Metrics requiring forward-looking assumptions:
   * Projected funding carry across specified horizon.
   * Prominent disclosure of explicit assumption: *"Current funding rate of X bps persists across Y hours."*
4. **Constraint Audit Table**: Full checklist showing pass/fail status and observed vs limit values for each constraint.
5. **Decision Rationale**: Human-readable explanation of why this path was selected or pruned.
6. **Machine Evidence**: Expandable JSON payload containing snapshot IDs, formulas, and tool provenance.

---

## 6. What-If Recompilation Engine

Rove includes a dynamic recompilation engine allowing users to modify parameters interactively:
* *"What if I hold the hedge for 7 days instead of 24 hours?"* → Rove recalculates projected carry; if carry exceeds tolerance, the route flips or warns the user.
* *"What if I increase the trade size to $50,000?"* → Rove walks the deeper orderbook; slippage increases, potentially flipping from Convert to Spot or vice versa.
* *"What if I lower my maximum execution cost ceiling to 8 bps?"* → Paths exceeding 8 bps are instantly pruned.

---

## 7. Canonical V1 Route Matrix

| Route Venue | Supported Objectives | Authoritative Pricing Source | Key Rejection Conditions |
| :--- | :--- | :--- | :--- |
| **Spot** | `buy`, `sell` | Live L2 orderbook depth (`spot.depth`) | Retain underlying, book liquidity exhaustion |
| **Convert** | `buy`, `sell` | Real-time binding RFQ (`convert.sendQuoteRequest`) | Quote expiry, minimum notional |
| **USD-M Perpetual** | `hedge`, `flatten`, `buy`, `sell` | Mark price + depth (`futures_usds.symbolPriceTicker`) | Max leverage exceeded, carry ceiling exceeded |
| **Margin** | Feature-gated V1 | Sub-account check (`margin.queryCrossMarginAccountDetails`) | Account disabled (`tradeEnabled: false`) |
| **COIN-M** | Feature-gated V1 | Inverse contracts (`futures_coin.accountInformation`) | Gated to preserve focus on canonical three |
