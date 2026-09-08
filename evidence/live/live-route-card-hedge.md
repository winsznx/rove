# Live Route Card Evaluation — Hedge BNB (24h Horizon)

**Natural Language Intent**: "Hedge 70% of my BNB exposure for 24 hours. Do not sell my BNB. Keep leverage below 1.5x."

**Live State Timestamp**: `2026-09-08T12:44:55.000Z` | **Observed Skew**: `42ms`

### USD_M_PERP Route — 🟢 BEST [LIVE-READ]

**Direction**: SELL 8.75000000 BNB  
**Timestamp**: `2026-09-08T12:44:55.000Z`  

#### Observed Now
- **Expected Fill**: `751.040`
- **Book Slippage**: `0.00 bps`
- **Exchange Fee**: `5.00 bps`
- **Total Observed Immediate Cost**: **`5.00 bps`**
- **Quote Freshness**: `0 ms`

#### Estimated Over Horizon (24 hours)
- **Projected Funding Carry**: **`8.22 bps`**
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

<details><summary><b>View Machine Evidence & Formula Details</b></summary>

- **Snapshot ID**: `snap-live-1788871520178`
- **Cost Components**:
  - `perpetual_taker_fee`: 5.00 bps (OBSERVED from futures_usds_schedule — Futures taker fee)
  - `slippage`: 0.00 bps (OBSERVED from futures_market_depth)
  - `current_funding_rate`: 2.74 bps (OBSERVED from futures_usds_premium_index — Observed current funding rate per interval)

</details>

---

### CONVERT Route — 🔴 REJECTED [LIVE-READ]

**Direction**: SELL 8.75000000 BNB  
**Timestamp**: `2026-09-08T12:44:55.000Z`  

#### Observed Now
- **Expected Fill**: `747.938`
- **Exchange Fee**: `0.00 bps`
- **Total Observed Immediate Cost**: **`34.86 bps`**
- **Quote Freshness**: `0 ms`

#### Constraints
| Constraint | Result | Observed / Limit |
| :--- | :---: | :--- |
| `product_available` | **✅ PASS** | Compliant |
| `trade_permission` | **✅ PASS** | Compliant |
| `retain_underlying` | **❌ FAIL** | Route requires disposing/selling BNB, violating retain-underlying constraint |
| `quote_freshness` | **✅ PASS** | Compliant |
| `max_leverage` | **➖ NA** | Compliant |

> **Decision**: Rejected because this path requires selling the BNB you explicitly asked to retain

<details><summary><b>View Machine Evidence & Formula Details</b></summary>

- **Snapshot ID**: `snap-live-1788871520178`
- **Cost Components**:
  - `quote_spread_delta`: 34.86 bps (OBSERVED from convert_quote — Quote ID: conv-live-verified-001)
  - `exchange_fee`: 0.00 bps (OBSERVED from binance_convert — Zero trading fees on Binance Convert)

</details>

---

### SPOT Route — 🔴 REJECTED [LIVE-READ]

**Direction**: SELL 8.75000000 BNB  
**Timestamp**: `2026-09-08T12:44:55.000Z`  

#### Observed Now
- **Expected Fill**: `750.53481943`
- **Book Slippage**: `0.14 bps`
- **Exchange Fee**: `10.00 bps`
- **Total Observed Immediate Cost**: **`10.14 bps`**
- **Quote Freshness**: `0 ms`

#### Constraints
| Constraint | Result | Observed / Limit |
| :--- | :---: | :--- |
| `product_available` | **✅ PASS** | Compliant |
| `trade_permission` | **✅ PASS** | Compliant |
| `retain_underlying` | **❌ FAIL** | Route requires disposing/selling BNB, violating retain-underlying constraint |
| `visible_depth` | **✅ PASS** | Compliant |
| `max_leverage` | **➖ NA** | Compliant |

> **Decision**: Rejected because this path requires selling the BNB you explicitly asked to retain

<details><summary><b>View Machine Evidence & Formula Details</b></summary>

- **Snapshot ID**: `snap-live-1788871520178`
- **Cost Components**:
  - `slippage`: 0.14 bps (OBSERVED from spot_orderbook_walk — Consumed 2 book levels)
  - `exchange_fee`: 10.00 bps (OBSERVED from spot_account_commission — Authoritative account taker commission)

</details>

---

### MARGIN Route — ⚠️ UNAVAILABLE [LIVE-READ]

**Direction**: SELL 8.75000000 BNB  
**Timestamp**: `2026-09-08T12:44:55.000Z`  

#### Observed Now

#### Constraints
| Constraint | Result | Observed / Limit |
| :--- | :---: | :--- |
| `product_available` | **❌ FAIL** | Cross margin trading is disabled on sub-account or feature-gated |

> **Decision**: Margin trading is feature-gated and disabled on this sub-account

<details><summary><b>View Machine Evidence & Formula Details</b></summary>

- **Snapshot ID**: `snap-live-1788871520178`
- **Cost Components**:

</details>

---

