# ROVE — Builder-Grade Product Requirements Document v1.0

Status: BUILD CANDIDATE  
Hackathon: Binance Agent OS Mini Hackathon, Track A  
Product: Rove  
Category: agent-native Binance execution-path compiler  
Primary sponsor surface: Binance Agent OS MCP  
Submission deadline: 2026-09-08 23:59 UTC  
Primary live path: Spot + Convert + USD-M Perpetual Futures  
Feature-gated paths: Margin + COIN-M Futures  
Primary user artifact: Route Card  
Primary internal object: ExecutionIntent  

---

# 1. Executive summary

Rove lets a Binance user describe the economic outcome they want without forcing them to choose the Binance product first.

The user says something like:

> Hedge 70% of my BNB exposure for 24 hours. Do not sell my BNB. Keep leverage below 1.5x.

Rove:

1. compiles the sentence into a typed `ExecutionIntent`;
2. reads the live Binance account and market state through Agent OS;
3. generates the eligible execution paths;
4. prices those paths against the same timestamped snapshot;
5. rejects paths that violate the user's hard constraints;
6. separates observed-now cost from horizon-dependent estimates;
7. ranks the valid survivors deterministically;
8. produces one Route Card for user review;
9. revalidates immediately before send;
10. hands the selected path to the official Binance confirmation flow;
11. records the final execution outcome and evidence receipt.

The product's memorable loop is:

> compile → reject → rank → confirm

Rove is not a trading-signal bot, autonomous portfolio manager, policy engine, copy-trading agent, hosted exchange frontend, or generic chatbot over Binance data.

---

# 2. Product thesis

The same economic goal can often be expressed through more than one Binance product.

Users usually think in outcomes:

- buy exposure
- sell exposure
- hedge exposure
- flatten exposure
- keep an underlying asset while reducing directional risk
- minimize immediate execution cost
- cap estimated carry
- keep leverage below a personal limit
- avoid routes whose data is stale or incomplete

Existing agent flows usually assume the product choice has already been made.

Rove moves the decision boundary one layer upward.

The internal question is:

> Given the same user intent, account state, and timestamped Binance market state, which eligible Binance path best satisfies the user's constraints?

The judge-facing question is simpler:

> Which Binance path fits this outcome best right now?

---

# 3. Product principles

## 3.1 Outcome first

The user's first decision is the outcome they want.

Rove owns the translation from outcome to supported Binance path.

## 3.2 Deterministic money logic

The LLM may:

- parse language
- ask clarifying questions
- explain results

The LLM must not authoritatively calculate:

- slippage
- fees
- order size
- leverage
- funding scenario cost
- route score
- final order quantity
- route eligibility

All consequential numeric logic lives in deterministic code.

## 3.3 Same-state comparison

Competing routes must be compared from the same bounded snapshot window.

Rove may not compare:

- Spot from 12:00:00
- Convert from 12:00:08
- Futures from 11:59:41

and present them as one simultaneous decision.

Every comparison must carry snapshot timing metadata and a maximum allowed skew.

## 3.4 Fail closed

Missing data must never silently become zero.

Examples:

- missing account fee → `UNAVAILABLE`
- missing funding → `UNAVAILABLE`
- stale Convert quote → `EXPIRED`
- missing required scope → `PERMISSION_MISSING`
- unsupported product → `PRODUCT_UNAVAILABLE`

If a required cost component or safety input is unavailable, the route must be rejected unless a documented comparison rule proves the component is irrelevant for that exact case.

## 3.5 Observed now is not estimated later

Every cost display must separate:

### Observed now
- live book slippage
- quoted Convert delta
- known fees
- current funding rate
- current market spread
- quote freshness

### Estimated over horizon
- funding carry if the current rate persisted
- borrow cost if Margin is later enabled
- other horizon-dependent assumptions

Do not print one fake-precise "total cost" if part of it is merely an estimate.

## 3.6 Human approval by default

Rove prepares the consequential action.

The user remains the final approver in the normal product mode.

## 3.7 Binance must be load-bearing

The product's central claim must fail if Binance Agent OS is removed.

A public price feed is acceptable only for:

- unit tests
- synthetic controls
- local development fixtures

It is not acceptable as a hidden live fallback.

## 3.8 Narrow universe, deep product

V1 does not need every Binance surface.

It does need the supported path to feel complete.

---

# 4. Scope

## 4.1 Canonical live V1 paths

Ship these first:

1. Spot
2. Convert
3. USD-M Perpetual Futures

These three form the default route universe for the hackathon demo.

## 4.2 Feature-gated paths

Architect for:

4. Margin
5. COIN-M Futures

These remain disabled until both conditions pass:

- authenticated Agent OS capability exists;
- every required cost and state term can be measured honestly.

A disabled path must appear only as:

`UNAVAILABLE`

It must never display placeholder economics.

## 4.3 Explicit non-goals

Do not build for this event:

- x402 payments
- P2P merchant automation
- DEX routing
- cross-exchange routing
- options routing
- copy trading
- token issuance
- social trading feed
- strategy backtesting
- autonomous unattended trading loops
- generic portfolio optimization
- AI market prediction
- compliance console
- policy/slashing middleware
- external withdrawal automation
- a hosted Binance custody UI

---

# 5. Primary user

Rove's first user is an eligible Binance trader who knows the economic outcome they want but does not want to manually compare:

- Spot
- Convert
- Futures
- fees
- live liquidity
- current funding
- product eligibility
- account balance
- position state
- leverage implications
- route-specific constraints

Initial distribution:

- Claude
- Codex
- compatible agent client
- Binance Agent OS MCP
- installable Rove skill
- GitHub
- lightweight public replay/evidence page

---

# 6. User-facing terminology

Use these words consistently.

Product:
- Rove

User input:
- Intent

Typed internal object:
- ExecutionIntent

Candidate Binance expression:
- Path

Final visual object:
- Route Card

Deterministic decision system:
- Route Engine

Stored market/account state:
- Comparison Snapshot

Final stored proof object:
- Execution Receipt

Benchmark:
- Rove Bench

Avoid making "mandate" a visible product term.

---

# 7. Core user stories

## US-01 — Buy

User:

> Buy $750 of BNB now. Keep observed execution cost under 8 bps.

Expected behavior:

- compile `objective=buy`
- derive candidate Spot and Convert paths
- evaluate any valid Futures expression only if it actually matches the economic objective
- price all eligible paths from the same snapshot
- reject any path above the hard execution-cost ceiling
- rank survivors
- show best Route Card
- require approval before send

## US-02 — Hedge without selling

User:

> Hedge 70% of my BNB exposure for 24 hours. Do not sell my BNB. Keep leverage below 1.5x.

Expected behavior:

- read current BNB exposure
- derive hedge notional
- set `must_retain_underlying=true`
- Spot sale fails with `RETAIN_UNDERLYING_CONFLICT`
- Convert paths that require disposing of the underlying fail
- USD-M may survive if:
  - supported
  - permissioned
  - collateralized
  - leverage-compliant
  - carry-compliant
- show observed-now cost and estimated 24h carry separately

## US-03 — Sell

User:

> Sell $2,500 of ETH with the lowest observed execution cost right now.

Expected behavior:

- compare eligible cash disposal paths
- walk Spot book
- obtain Convert quote
- rank on observed execution cost
- do not use horizon-dependent carry unless a route actually introduces it

## US-04 — Flatten

User:

> Flatten my BTC directional exposure.

Expected behavior:

- read relevant BTC positions
- derive signed net exposure only from supported, reliable account state
- generate eligible offsetting/closing paths
- refuse if current position state is ambiguous or incomplete
- require approval before send

## US-05 — Edit a constraint

User:

> Same hedge, but cap estimated carry at 10 bps.

Expected behavior:

- preserve prior intent context
- update the carry ceiling only
- rerun the same comparison logic
- show which paths changed state
- visually mark newly rejected and newly valid paths

## US-06 — Missing decision-changing information

User:

> Hedge my BNB.

Expected behavior:

Rove asks one concise question if the missing value can change eligibility or ranking.

Examples:

- hedge amount / exposure fraction
- horizon
- retain-underlying preference

Do not ask questions whose answers do not matter.

## US-07 — Quote expires before confirmation

Expected behavior:

- mark Route Card `EXPIRED`
- refuse execution
- refresh the snapshot
- show what changed
- create a new card

## US-08 — Permission missing

Expected behavior:

A path may be priceable but not executable.

Rove should show:

> USD-M can be priced, but the required Futures trading permission is not currently available.

The route can remain visible as non-executable evidence but must not become the selected live route.

---

# 8. ExecutionIntent schema

Canonical V1 TypeScript representation:

```ts
export type Objective =
  | "buy"
  | "sell"
  | "hedge"
  | "flatten";

export type Urgency =
  | "immediate"
  | "normal"
  | "patient";

export type Amount =
  | {
      type: "notional";
      value: string;
      currency: "USDT" | "USDC";
    }
  | {
      type: "asset_quantity";
      value: string;
      asset: string;
    }
  | {
      type: "exposure_fraction";
      value: string;
    };

export type Horizon = {
  value: number;
  unit: "minutes" | "hours" | "days";
};

export type ExecutionIntent = {
  version: "1";
  objective: Objective;
  asset: string;
  amount?: Amount;
  horizon?: Horizon;
  must_retain_underlying: boolean;
  max_leverage?: string;
  max_estimated_carry_bps?: string;
  max_observed_execution_cost_bps?: string;
  urgency: Urgency;
};
```

## 8.1 Numeric representation

Use decimal-safe strings or a fixed-precision decimal library.

Do not use JavaScript floating-point numbers for authoritative financial arithmetic.

Recommended:

- `decimal.js`
- `big.js`
- equivalent deterministic decimal type

## 8.2 Validation rules

- `asset` must resolve to supported Binance instrument metadata
- notional must be positive
- exposure fraction must satisfy `0 < x <= 1`
- leverage must be positive
- carry ceiling requires a horizon
- hedge requires enough information to derive hedge size
- flatten may derive size from live position state
- urgency defaults to `normal`
- unsupported currencies fail
- malformed percentages fail
- vague natural-language values must not silently become arbitrary numeric values

## 8.3 Parser output envelope

```ts
export type ParsedIntentEnvelope = {
  originalText: string;
  intent: ExecutionIntent | null;
  missingFields: string[];
  clarifyingQuestion?: string;
  parserModel: string;
  parsedAt: string;
};
```

Do not expose chain-of-thought.

---

# 9. Agent contract

The agent has three authoritative responsibilities.

## 9.1 Compile

Transform natural language into `ExecutionIntent`.

The model response must pass schema validation before any market call begins.

## 9.2 Clarify

Ask the smallest decision-changing question.

Examples:

Good:

> What portion of the BNB exposure should I hedge?

Bad:

> What is your risk tolerance, investment horizon, portfolio strategy, and preferred execution method?

## 9.3 Explain

The agent may explain:

- why a path was rejected
- why a path survived
- why the selected path ranked first
- what is observed
- what is estimated
- what changed after recompilation
- what the user is approving

The agent must never override deterministic results.

---

# 10. Core domain models

## 10.1 RoutePath

```ts
export type PathKind =
  | "spot"
  | "convert"
  | "usd_m_perp"
  | "margin"
  | "coin_m_perp";

export type PathStatus =
  | "GENERATED"
  | "QUOTED"
  | "VALID"
  | "REJECTED"
  | "UNAVAILABLE"
  | "EXPIRED"
  | "SELECTED";

export type RoutePath = {
  id: string;
  kind: PathKind;
  status: PathStatus;
  side: "buy" | "sell";
  baseAsset: string;
  quoteAsset: string;
  requestedQuantity?: string;
  requestedNotional?: string;
  execution?: ObservedExecutionCost;
  carry?: EstimatedCarry;
  constraints: ConstraintResult[];
  rejection?: Rejection;
  quoteFreshnessMs?: number;
  snapshotId: string;
};
```

## 10.2 ConstraintResult

```ts
export type ConstraintState =
  | "PASS"
  | "FAIL"
  | "NA"
  | "UNKNOWN";

export type ConstraintResult = {
  key: string;
  state: ConstraintState;
  reason?: string;
  observedValue?: string;
  limitValue?: string;
};
```

## 10.3 Rejection

```ts
export type Rejection = {
  code: RejectionCode;
  message: string;
  evidence?: Record<string, string>;
};
```

---

# 11. Rejection codes

Initial stable enum:

```text
RETAIN_UNDERLYING_CONFLICT
INSUFFICIENT_BALANCE
INSUFFICIENT_COLLATERAL
PERMISSION_MISSING
PRODUCT_UNAVAILABLE
SYMBOL_UNSUPPORTED
LEVERAGE_LIMIT
EXECUTION_COST_LIMIT
CARRY_LIMIT
QUOTE_EXPIRED
SNAPSHOT_STALE
SNAPSHOT_SKEW
COST_COMPONENT_UNAVAILABLE
POSITION_STATE_UNAVAILABLE
INTENT_INCOMPLETE
MARKET_UNAVAILABLE
SIZE_BELOW_MINIMUM
SIZE_ABOVE_LIMIT
INSUFFICIENT_VISIBLE_DEPTH
ACCOUNT_STATE_UNAVAILABLE
EXECUTION_STATE_UNKNOWN
ORDER_VALIDATION_FAILED
ROUTE_SEMANTICS_MISMATCH
```

Every rejection should be:

- machine-readable
- reproducible
- human-readable
- backed by stored evidence where practical

---

# 12. Capability registry

Do not hardcode sponsor marketing text as runtime truth.

At setup/runtime, inspect authenticated capabilities and map them into:

```ts
export type CapabilityRegistry = {
  spot: {
    marketRead: boolean;
    accountRead: boolean;
    trade: boolean;
    feeRead: boolean;
  };
  convert: {
    quote: boolean;
    trade: boolean;
  };
  usdM: {
    marketRead: boolean;
    fundingRead: boolean;
    positionRead: boolean;
    trade: boolean;
    feeRead: boolean;
  };
  margin: {
    marketRead: boolean;
    borrowRateRead: boolean;
    accountRead: boolean;
    trade: boolean;
    costingComplete: boolean;
  };
  coinM: {
    marketRead: boolean;
    fundingRead: boolean;
    positionRead: boolean;
    trade: boolean;
    feeRead: boolean;
    costingComplete: boolean;
  };
};
```

Route generation must obey this registry.

---

# 13. Comparison Snapshot

Canonical model:

```ts
export type ComparisonSnapshot = {
  id: string;
  mode: "fixture" | "live-read" | "live-trade";
  startedAt: string;
  completedAt: string;
  maxObservedSkewMs: number;
  account: AccountSnapshot;
  spot?: SpotSnapshot;
  convert?: ConvertSnapshot;
  usdM?: UsdMSnapshot;
  margin?: MarginSnapshot;
  coinM?: CoinMSnapshot;
  capabilityRegistry: CapabilityRegistry;
  sourceFingerprint: string;
};
```

## 13.1 Required account state

As available and relevant:

- balances
- open positions
- enabled products
- permissions/scopes
- fee tier/account fee
- collateral
- leverage state
- minimum order constraints

## 13.2 Required market state

Spot:
- symbol
- bid/ask
- order-book depth
- timestamp

Convert:
- from asset
- to asset
- quoted quantity
- quote id
- quote price/rate
- expiry
- timestamp

USD-M:
- symbol
- bid/ask
- depth
- current funding
- next funding timing if available
- position data
- timestamp

---

# 14. Snapshot synchronization

Define:

```text
MAX_SNAPSHOT_SKEW_MS
```

Default initial target:

`<= 2000 ms`

The value may be changed after live MCP behavior is measured.

If source timestamps exceed the threshold:

1. retry the stale source;
2. if still skewed, reject the comparison with `SNAPSHOT_SKEW`.

Do not silently broaden the threshold until the benchmark looks better.

Store both:

- local collection time
- source-reported time, where available

---

# 15. Cost model

## 15.1 ObservedExecutionCost

```ts
export type ObservedExecutionCost = {
  referencePrice?: string;
  expectedFillPrice?: string;
  observedExecutionCostBps?: string;
  slippageBps?: string;
  feeBps?: string;
  spreadBps?: string;
  convertQuoteDeltaBps?: string;
  components: CostComponent[];
  status: "COMPLETE" | "PARTIAL" | "UNAVAILABLE";
};
```

## 15.2 EstimatedCarry

```ts
export type EstimatedCarry = {
  horizon?: Horizon;
  estimatedCarryBps?: string;
  assumption: string;
  components: CostComponent[];
  status: "COMPLETE" | "PARTIAL" | "UNAVAILABLE";
};
```

## 15.3 CostComponent

```ts
export type CostComponent = {
  key: string;
  valueBps: string | null;
  source: string;
  observedAt?: string;
  status: "OBSERVED" | "ESTIMATED" | "UNAVAILABLE";
  note?: string;
};
```

---

# 16. Cost calculation rules

## 16.1 Spot market route

Observed immediate cost may include:

```text
book_walk_slippage
+ known_account_fee
+ spread/reference adjustment
```

Never assume default account fees if the authoritative account-specific value is obtainable but missing.

If fee data is unavailable and material:

`COST_COMPONENT_UNAVAILABLE`

## 16.2 Convert route

Use the actual Convert quote.

Compare against the defined shared reference price.

Store:

- quote id
- quote expiry
- effective rate
- comparable reference
- implied quote delta

The quote must be valid when the Route Card is produced and revalidated before send.

## 16.3 USD-M route

Observed-now:

- order-book execution cost
- known fee
- current funding rate as an observation

Estimated-over-horizon:

```text
current_funding_rate × estimated number of funding intervals
```

only if the engine uses the explicit assumption:

> current funding remains unchanged across the requested horizon

That estimate must be labeled.

Do not claim expected future funding as known.

## 16.4 Margin route

Feature-gated.

Required before enablement:

- live borrow rate
- exact borrow semantics
- fee data
- account/collateral state
- execution path
- complete cost model

If any of these are missing:

`costingComplete=false`

## 16.5 COIN-M

Feature-gated under the same standard.

---

# 17. Order-book walk

The book walker must be a pure deterministic function.

Input:

```ts
type BookLevel = [price: string, quantity: string];

type BookWalkInput = {
  side: "buy" | "sell";
  requestedBaseQuantity?: string;
  requestedQuoteNotional?: string;
  bids: BookLevel[];
  asks: BookLevel[];
};
```

Output:

```ts
type BookWalkResult = {
  filledBaseQuantity: string;
  spentOrReceivedQuote: string;
  vwap: string;
  levelsConsumed: number;
  sufficientDepth: boolean;
};
```

Rules:

- buy consumes asks from lowest upward
- sell consumes bids from highest downward
- stop when requested size is filled
- no interpolation beyond visible depth
- insufficient depth must be explicit
- all arithmetic decimal-safe
- same input must produce byte-for-byte equivalent normalized output

---

# 18. Constraint engine

The constraint engine runs before ranking.

Example checks:

### Retain underlying
If `must_retain_underlying=true`, reject any route whose economics require selling/transferring away the underlying position being protected.

### Max leverage
Compute required effective leverage deterministically.

If:

```text
required_leverage > max_leverage
```

reject.

### Max observed execution cost
If the complete observed immediate cost exceeds the ceiling, reject.

### Max estimated carry
If:
- horizon is present
- carry is complete
- estimated carry exceeds ceiling

reject.

If carry is required but unavailable, reject.

### Permissions
If a path cannot be executed with current permissions, it cannot become the live selected path.

### Account readiness
Reject:
- insufficient balance
- insufficient collateral
- unsupported symbol
- below minimum notional
- above product/account limit

---

# 19. Route generation

The route generator should be objective-aware.

Do not generate every product for every intent.

Examples:

## Buy
Potential:
- Spot
- Convert

Futures only if the intent semantics actually mean synthetic directional exposure rather than asset acquisition.

## Sell
Potential:
- Spot
- Convert

## Hedge
Potential:
- USD-M
- Margin later
- other paths only if economically equivalent and supported

## Flatten
Potential:
- product-specific closing path
- offsetting path only if flatten semantics remain correct

If route semantics are not equivalent to the user's objective:

`ROUTE_SEMANTICS_MISMATCH`

This is important. Do not force three cards merely to make the screenshot look full.

---

# 20. Ranking

Rove should not expose an opaque proprietary score in V1.

Deterministic rank order:

1. all hard constraints pass
2. complete required cost data
3. lower observed immediate execution cost
4. lower estimated carry under the declared scenario
5. fresher quote
6. lower operational complexity as a fixed deterministic tie-breaker

Example pseudo-code:

```ts
function rank(validPaths: RoutePath[]): RoutePath[] {
  return validPaths.sort(compareBy(
    observedExecutionCost,
    estimatedCarry,
    quoteFreshness,
    operationalComplexityRank
  ));
}
```

Document all tie-break rules.

---

# 21. Route Card

The Route Card is the product's primary visual artifact.

## 21.1 Header

- route type
- `BEST`, `VALID`, `REJECTED`, `UNAVAILABLE`, or `EXPIRED`
- direction
- size
- snapshot timestamp
- live/replay mode

## 21.2 Observed now

- expected fill
- slippage
- fee
- observed execution cost
- current funding where relevant
- quote age

## 21.3 Estimated over horizon

- horizon
- estimated carry
- exact assumption
- status

## 21.4 Constraint strip

Examples:

```text
retain underlying   PASS
leverage <= 1.5x    PASS
carry <= 20 bps     PASS
freshness            PASS
trade permission     PASS
```

## 21.5 Decision reason

Deterministic, short, factual.

Examples:

> Rejected because this path requires selling the BNB you asked to retain.

> Ranked first because it satisfies every hard constraint and has the lowest observed immediate execution cost on this snapshot.

## 21.6 Evidence drawer

Expandable:

- raw cost components
- formula
- order-book levels consumed
- source timestamps
- quote id
- fee provenance
- snapshot id

---

# 22. Comparison view

The comparison surface should make state differences obvious.

Required states:

- best
- valid
- rejected
- unavailable
- expired

For each path show only high-value data first.

Desktop target:

three cards in one row.

Mobile:

stacked cards.

Do not show a generic dashboard before the cards.

---

# 23. What-if recompilation

Allow a user to edit:

- notional
- horizon
- retain-underlying
- max leverage
- max carry
- max immediate execution cost
- urgency

Then re-run the route engine.

Visually highlight:

- winner changed
- newly rejected
- newly valid
- changed cost assumption
- expired quotes refreshed

This is a high-value feature because it makes the compiler mechanism visible.

---

# 24. Account readiness

Before live execution:

- MCP connected
- Agentic account available
- read scope available
- selected product enabled
- selected trade scope available
- sufficient balance/collateral
- order parameters within product limits

Render readiness clearly.

Example:

```text
Market read       READY
Account read      READY
USD-M trade       MISSING
```

Do not hide permissions inside logs.

---

# 25. Confirmation and execution

## 25.1 Modes

```text
fixture
live-read
live-trade
```

The mode must be visible in:

- UI
- logs
- receipts
- benchmark artifacts

## 25.2 Prepare-only

Default safe path.

Rove:

- compiles
- compares
- selects
- shows card
- does not send

## 25.3 Prepare-and-confirm

If live trade capability is proven:

1. selected Route Card exists
2. card not expired
3. refresh critical price/account state
4. rerun relevant constraints
5. create deterministic order request
6. show final user confirmation
7. require explicit approval
8. send via Agent OS
9. read resulting order state
10. write receipt

## 25.4 No silent substitution

If the selected route becomes invalid after refresh, Rove must not silently choose the next route.

It should:

- invalidate the selection
- recompile
- show the new ranking
- ask for approval again

---

# 26. Order request construction

The LLM must never directly create authoritative final order quantities.

Instead:

```text
ExecutionIntent
+ selected RoutePath
+ live account state
+ product metadata
→ deterministic OrderRequest
```

Every order request must pass:

- symbol validation
- side validation
- quantity precision
- minimum notional
- maximum size
- leverage limit
- balance/collateral check
- quote freshness
- selected path identity

---

# 27. Execution Receipt

```ts
export type ExecutionReceipt = {
  id: string;
  intentId: string;
  routeId: string;
  snapshotId: string;
  mode: "fixture" | "live-read" | "live-trade";
  preparedAt: string;
  confirmedAt?: string;
  sentAt?: string;
  finalState:
    | "PREPARED"
    | "USER_REJECTED"
    | "EXPIRED"
    | "SENT"
    | "PARTIAL"
    | "FILLED"
    | "CANCELED"
    | "FAILED"
    | "UNKNOWN";
  binanceOrderId?: string;
  fillIds?: string[];
  realizedPrice?: string;
  realizedFee?: string;
  realizedVsExpectedBps?: string;
  failureCode?: string;
  engineVersion: string;
  commitSha: string;
};
```

Receipts are stored locally/repo-side for V1.

No blockchain attestation is needed.

---

# 28. History

Provide a lightweight history page or command:

- original intent
- selected route
- rejected routes
- snapshot time
- approval state
- execution state
- saved receipt
- replay action

Optional advanced feature:

> Replay this historical snapshot against the current engine version.

If the new engine ranks differently, mark it clearly.

---

# 29. Public replay surface

Rove should have a lightweight public site, not a hosted trading terminal.

Purpose:

- explain the product
- replay sanitized frozen evidence
- show Route Cards
- show benchmark outputs
- show install instructions
- link GitHub

Replay must be labeled:

`FROZEN REPLAY`

Live data must be labeled:

`LIVE`

Never blur these.

---

# 30. Public page information architecture

## Hero

One sentence:

> Tell Rove the outcome you want. It finds the Binance path that fits.

Primary visual:
- real Route Card comparison

Primary action:
- View a replay
- Install Rove

## Example

Show:

> Hedge 70% of my BNB exposure for 24h. Don't sell my BNB.

Then cards.

## How it works

1. Compile intent
2. Price eligible paths
3. Reject violations
4. Approve one route

## Evidence

- snapshot id
- benchmark results
- replay link

## Trust / limitations

- observed vs estimated
- user approval
- no external withdrawal path
- stale quote handling
- not investment advice

## Install

- Agent OS connection
- skill setup
- local benchmark

---

# 31. Product UX states

Must implement:

- not connected
- auth required
- Agentic account unavailable
- read-only
- market loading
- account loading
- incomplete intent
- clarifying question
- no eligible paths
- one valid path
- multiple valid paths
- cost incomplete
- path rejected
- path unavailable
- quote stale
- card expired
- confirmation requested
- user rejected
- order sent
- partial fill
- filled
- canceled
- failed
- unknown execution state
- replay mode
- live-read
- live-trade

No raw exception dumps in normal product UI.

---

# 32. Benchmark: Rove Bench

Rove Bench is mandatory.

## 32.1 Data target

- 100 frozen comparison snapshots
- 20 varied live-read intents if auth is stable
- 1 live confirmed execution if available and safe

## 32.2 Dimensions

Vary:

- BTC
- BNB
- ETH
- notional
- buy
- sell
- hedge
- flatten where support is clean
- horizon
- retain-underlying
- leverage cap
- carry cap
- execution-cost cap
- urgency

## 32.3 Primary baseline

Use whichever best matches the intent:

- always Spot
- user-named product

## 32.4 Secondary baseline

LLM selects the product without the live multi-path comparison.

The LLM baseline must not secretly see data withheld from the stated condition.

## 32.5 Reference

Deterministic route engine on the same frozen snapshot.

---

# 33. Ablations

Required:

1. Spot-only
2. no Convert
3. no Futures
4. no funding awareness
5. no horizon
6. ticker-only instead of depth-aware book walk
7. LLM-only path choice

Optional:

8. no account-specific fee
9. widened snapshot skew
10. no retain-underlying constraint

---

# 34. Controls

Required controls:

- Spot winner case
- Convert winner case if naturally observed
- Futures winner case if naturally observed
- retain-underlying rejection
- stale quote abort
- missing permission
- missing cost component
- insufficient depth
- invalid leverage

Synthetic cases may be used only for correctness controls and must be labeled `SYNTHETIC`.

Do not use synthetic cases to support the real-market headline.

---

# 35. Route-flip gate

Before expanding the product, run 20 varied live-read intents.

Measure:

- how often route eligibility changes
- how often the winner changes
- why it changes
- whether the change comes from:
  - user constraints
  - market state
  - account state
  - product costs

## Lock condition

Lock the multi-path compiler thesis if the winner/eligibility changes often enough to demonstrate material route differentiation.

## Kill condition

If one path dominates almost every representative case and the comparison adds little economic or user value, stop selling the compiler thesis.

Backup:

`Execution Desk`

Reuse:

- snapshot collector
- book walker
- cost model
- constraint engine
- route card
- execution receipt

Change the job to execution-method choice rather than cross-product choice.

---

# 36. Headline metrics

Do not pre-fill.

Generate from artifacts.

Possible metrics:

- route-change rate vs baseline
- median observed cost difference
- hard-constraint violation rate
- stale-card abort accuracy
- deterministic replay match rate
- percentage of invalid paths rejected with named reason
- realized vs expected execution delta on live orders

The headline stays blank until the CSV exists.

---

# 37. Evidence artifacts

Create:

```text
evidence/
  claim-ledger.md
  run-manifest.json
  headline.json
  live/
  replays/
  receipts/
  screenshots/
  demo/
```

Create:

```text
benchmarks/
  intents/
  snapshots/
  expected/
  results.csv
  results.json
  ablations/
  controls/
```

Every result row should link to:

- intent
- snapshot
- engine version
- baseline result
- Rove result
- rejection reason
- cost components
- rank

---

# 38. Repo architecture

```text
rove/
├── README.md
├── PRODUCT.md
├── ARCHITECTURE.md
├── SECURITY.md
├── SETUP.md
├── DECISIONS.md
├── CONTRIBUTIONS.md
├── LIMITATIONS.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
│
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── intent/
│   │   │   ├── snapshot/
│   │   │   ├── routes/
│   │   │   ├── cost/
│   │   │   ├── constraints/
│   │   │   ├── ranking/
│   │   │   ├── orderbook/
│   │   │   └── receipts/
│   │   └── tests/
│   │
│   ├── binance-agent-os/
│   │   ├── src/
│   │   │   ├── mcp/
│   │   │   ├── capability/
│   │   │   ├── account/
│   │   │   ├── spot/
│   │   │   ├── convert/
│   │   │   ├── usd-m/
│   │   │   ├── margin/
│   │   │   └── coin-m/
│   │   └── tests/
│   │
│   ├── skill/
│   │   ├── SKILL.md
│   │   ├── prompts/
│   │   └── src/
│   │
│   ├── benchmark/
│   │   └── src/
│   │
│   └── ui/
│       └── src/
│
├── apps/
│   ├── replay/
│   └── dev-console/
│
├── benchmarks/
├── evidence/
└── scripts/
```

`dev-console` is internal only.

Do not make the developer console the public product.

---

# 39. Suggested stack

Recommended:

- TypeScript
- Node 20+
- pnpm
- Turborepo
- Zod
- decimal.js
- Vitest
- Playwright
- React / Next.js or Vite for replay
- Tailwind only if it speeds delivery without turning the UI generic

Avoid introducing a database unless history/replay genuinely needs one.

For the hackathon, file-backed JSON evidence is acceptable and more reproducible.

---

# 40. Environment variables

Example:

```bash
ROVE_MODE=live-read

BINANCE_AGENT_OS_MCP_URL=https://agent.binance.com/mcp/agentic

ROVE_MAX_SNAPSHOT_SKEW_MS=2000
ROVE_ROUTE_TTL_MS=5000
ROVE_ENABLE_LIVE_TRADE=false

ROVE_ENABLE_MARGIN=false
ROVE_ENABLE_COIN_M=false

ROVE_EVIDENCE_DIR=./evidence
ROVE_BENCHMARK_DIR=./benchmarks
```

Do not put Binance secrets in `.env` if the official MCP auth flow does not require local credentials.

Follow the official auth model.

---

# 41. MCP adapter contract

The adapter should isolate sponsor-specific tool names from the core engine.

Core code should depend on interfaces such as:

```ts
export interface BinanceMarketAdapter {
  getSpotBook(input: SpotBookRequest): Promise<SpotBook>;
  getConvertQuote(input: ConvertQuoteRequest): Promise<ConvertQuote>;
  getUsdMBook(input: UsdMBookRequest): Promise<UsdMBook>;
  getUsdMFunding(input: FundingRequest): Promise<FundingSnapshot>;
}

export interface BinanceAccountAdapter {
  getBalances(): Promise<BalanceSnapshot[]>;
  getUsdMPositions(): Promise<PositionSnapshot[]>;
  getPermissions(): Promise<PermissionSnapshot>;
  getFees(): Promise<FeeSnapshot>;
}

export interface BinanceExecutionAdapter {
  prepareSpotOrder(input: SpotOrderIntent): Promise<PreparedOrder>;
  prepareConvert(input: ConvertExecutionIntent): Promise<PreparedOrder>;
  prepareUsdMOrder(input: UsdMOrderIntent): Promise<PreparedOrder>;
  submit(input: PreparedOrder): Promise<ExecutionResult>;
}
```

The exact MCP tool names should be mapped in one sponsor adapter layer.

Do not leak them throughout the repository.

---

# 42. Tool discovery requirement

Before Claude implements live adapters, record the exact authenticated MCP tool list.

Create:

```text
evidence/mcp/tool-list.json
evidence/mcp/capability-map.json
```

Each route implementation must reference the exact discovered capability.

No invented tool names.

No docs-only assumptions.

---

# 43. Security model

## Assets

- Agentic sub-account funds
- user intent
- account balances
- positions
- permissions
- order parameters
- evidence artifacts
- receipts

## Threats

- stale quote
- quote replay
- cross-product unit mismatch
- symbol mismatch
- side inversion
- precision bug
- leverage miscalculation
- missing fee treated as zero
- current funding presented as future fact
- prompt asks agent to skip confirmation
- model fabricates route values
- malformed MCP response
- partial fill shown as full
- replay shown as live
- live-read shown as executed
- old Route Card sent after state changed

## Controls

- strict schemas
- decimal arithmetic
- deterministic order builder
- route expiry
- pre-send refresh
- explicit confirmation
- environment labels
- idempotency where supported
- unknown execution state fails closed
- evidence redaction
- no external withdrawal path
- no autonomous send by default

---

# 44. Invariants

1. rejected route can never become selected
2. unavailable required cost term can never silently equal zero
3. stale card can never execute
4. retain-underlying conflict must reject disposal route
5. selected leverage must never exceed cap
6. same intent + same snapshot + same engine version must produce same result
7. replay cannot be labeled live
8. observed and estimated cost must remain separately labeled
9. model output cannot directly bypass deterministic validation
10. unknown execution state cannot be shown as filled
11. a feature-gated route cannot appear active
12. route ranking cannot depend on UI order
13. order quantity must pass product precision/minimum checks
14. snapshot skew over threshold must invalidate comparison
15. route cannot silently change between approval and send

---

# 45. Test plan

## Unit tests

- ExecutionIntent validation
- parser envelope validation
- decimal conversions
- book walk
- slippage
- fee arithmetic
- funding scenario
- leverage
- constraints
- ranking
- tie breaks
- quote expiry
- symbol mapping
- precision
- rejection codes

## Property/fuzz tests

- rejected route never ranks
- invalid decimal never propagates
- larger market order never consumes fewer book levels under same book
- deterministic replay
- no stale execution
- leverage cap invariant
- finite outputs only
- side inversion detection

## Fixture integration tests

- Spot only
- Convert only
- Futures only
- mixed comparison
- retain-underlying
- missing fee
- stale quote
- no permission
- insufficient balance
- insufficient depth
- carry rejection
- route winner changes after intent edit

## Live-read tests

Separate suite.

- auth
- tool discovery
- balance read
- Spot book
- Convert quote
- USD-M book
- funding
- positions
- fees
- permissions

## Live-trade tests

Require:

```text
ROVE_ENABLE_LIVE_TRADE=true
```

Never run in CI by default.

---

# 46. Observability

Structured events:

```text
intent.received
intent.compiled
intent.clarification_required
snapshot.started
snapshot.source_completed
snapshot.completed
snapshot.invalid
path.generated
path.quoted
path.rejected
path.valid
rank.completed
route.selected
route.expired
confirmation.requested
confirmation.rejected
order.prepared
order.sent
order.partial
order.filled
order.failed
receipt.written
```

Correlation IDs:

- intentId
- snapshotId
- pathId
- receiptId

---

# 47. Logging rules

Never log:

- private auth tokens
- secret headers
- hidden credentials

Public evidence must redact:

- sensitive balances if not needed
- account identifiers
- private metadata

Keep enough detail to reproduce the route decision.

---

# 48. Upstream contribution

Preferred:

- submit the Rove skill to Binance Skills Hub if clean and aligned
- or submit a reusable quote/comparison helper if upstream maintainers prefer smaller primitives

Do not make an unrelated cosmetic PR.

Track contribution in:

`CONTRIBUTIONS.md`

Include:

- issue/PR link
- rationale
- status
- what remains useful independent of the hackathon

---

# 49. Documentation requirements

## README.md

Top section must show:

1. one-line value
2. one real intent
3. resulting Route Card
4. live Binance Agent OS path
5. install/run
6. measured proof when available

## PRODUCT.md

Product thesis and user workflow.

## ARCHITECTURE.md

System diagram and sponsor-critical path.

## SECURITY.md

Threat model and trust boundaries.

## SETUP.md

Fresh-user setup.

## DECISIONS.md

Important tradeoffs.

## LIMITATIONS.md

Every honest limitation.

## CONTRIBUTIONS.md

Sponsor upstream work.

---

# 50. Clean-room reproducibility

Before submission:

1. clone repo into a clean directory
2. install with documented command
3. run tests
4. run benchmark
5. replay a frozen Route Card
6. connect live MCP following docs
7. run live-read path
8. confirm no absolute local paths
9. confirm no hidden local fixture dependency
10. confirm CI matches local behavior where applicable

Provide one top-level command where practical:

```bash
pnpm verify
```

Suggested behavior:

```text
lint
typecheck
unit
fixture integration
benchmark replay
evidence validation
build
```

---

# 51. Demo target

45–70 seconds.

## Canonical demo

1. Open Claude/Codex with Binance Agent OS connected.
2. User says:

   > Hedge 70% of my BNB exposure for 24 hours. Don't sell my BNB. Keep leverage below 1.5x.

3. Rove shows compact compiled intent.
4. Rove captures live comparison state.
5. Route Cards render.
6. One route is rejected for an obvious real reason.
7. One path ranks first.
8. Observed-now and estimated-over-horizon values are visibly separate.
9. User approves.
10. Rove revalidates.
11. Show:
    - fill, or
    - clean stale-card abort if the market moved materially.
12. End on Route Card + GitHub/replay.

Never pre-script which product must win.

---

# 52. Winning screenshot

One screen.

Top:
- user intent
- compact ExecutionIntent chips

Middle:
- 2–3 Route Cards
- one `BEST`
- one named rejection if real

Each card:
- observed execution cost
- estimated carry if relevant
- constraint strip
- freshness

Bottom/right:
- approval state
- snapshot timestamp
- `LIVE`
- Binance Agent OS connected

No architecture diagram.

No wall of metrics.

---

# 53. Route Card acceptance criteria

A Route Card is accepted only if:

- path identity is correct
- live/replay mode visible
- timestamp visible
- cost status visible
- observed and estimated sections separate
- every failed hard constraint visible
- rejection reason deterministic
- snapshot id linked
- stale card cannot execute
- selected card matches deterministic ranking output

---

# 54. Public replay acceptance criteria

A public replay is accepted only if:

- frozen state clearly labeled
- no private account data exposed
- same fixture reproduces same rank
- route evidence expandable
- benchmark row linked
- user can understand product without repo narration
- mobile layout works
- no fake live controls

---

# 55. Route-flip experiment spec

Create a controlled 20-intent experiment before Product Lock.

Suggested matrix:

- 5 buy/sell
- 10 hedge with varied retain-underlying/horizon/carry
- 5 flatten or constrained execution cases

Vary:
- size
- urgency
- horizon
- retain-underlying
- leverage
- carry ceiling

Report:

```text
intent_id
eligible_paths
winner
baseline_winner
winner_changed
why_changed
observed_cost_delta
constraint_delta
snapshot_id
```

Decision rule must be documented before looking at final aggregate results.

---

# 56. Business thesis

Do not invent monetization complexity for the hackathon.

Post-hackathon options:

- free installable skill
- premium route analytics
- pro execution intelligence
- team/desk features
- routed-volume business model if platform policy supports it
- B2B integration for agentic trading desks

The first proof is usage and route value, not token economics.

---

# 57. Product Lock

Current:

`REVISE → LOCK`

Pending:

1. authenticated MCP capability map
2. honest live cost inputs
3. route-flip probe
4. at least one viable execution/confirmation path
5. no hidden mock in the sponsor-critical path

Once these pass:

freeze:

- name: Rove
- canonical V1 routes: Spot + Convert + USD-M
- internal object: ExecutionIntent
- primary artifact: Route Card
- primary mechanism: deterministic compile/reject/rank flow

Do not expand into x402, P2P, or extra agents after lock.

---

# 58. Build sequence

## Phase 0 — Ground truth

1. authenticate Agent OS
2. dump exact MCP tool list
3. create capability map
4. verify account read
5. verify Spot data
6. verify Convert quote
7. verify USD-M data
8. verify funding
9. verify fee source
10. verify confirmation/trade support
11. run route-flip probe

## Phase 1 — Core

12. schemas
13. decimal layer
14. snapshot model
15. book walker
16. cost model
17. constraint engine
18. rejection codes
19. route generation
20. ranking
21. deterministic replay

## Phase 2 — Skill

22. compile prompt
23. clarification logic
24. explanation contract
25. MCP adapter
26. capability-aware orchestration
27. Route Card renderer

## Phase 3 — Execution

28. order builder
29. route TTL
30. pre-send revalidation
31. confirmation
32. execution result parsing
33. receipt

## Phase 4 — Product UX

34. comparison cards
35. what-if edits
36. readiness state
37. history
38. replay
39. landing narrative
40. responsive/error states

## Phase 5 — Proof

41. snapshot collector
42. 100 fixtures
43. 20 live intents
44. baseline
45. ablations
46. controls
47. results exporter
48. headline generator
49. claim ledger

## Phase 6 — Submission

50. docs
51. clean-room
52. CI
53. Skill Hub contribution
54. live demo recording
55. screenshot
56. X post
57. survey
58. final evidence audit

---

# 59. Final one-line definition

> Rove turns the outcome you want into the Binance path that fits, rejects the routes that break your constraints, and prepares one Route Card for approval.

---

# 60. Builder instruction

Claude or any implementation agent must treat this PRD as the product contract.

It may:

- improve implementation quality
- refactor internal code
- add tests
- improve type safety
- improve UI polish
- improve reproducibility
- propose sponsor-compatible fixes

It may not silently:

- add new product categories
- invent MCP tools
- fabricate fees
- simulate live execution and label it live
- change the route-ranking policy
- allow LLM arithmetic to become authoritative
- enable Margin/COIN-M without proof
- remove approval
- broaden scope into another hackathon idea
- change the core user flow

Any product-level deviation belongs in `DECISIONS.md` with:

- proposed change
- reason
- evidence
- effect on judging
- effect on safety/correctness
- accept/reject decision
