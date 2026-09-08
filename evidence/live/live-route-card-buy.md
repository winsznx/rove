# Live Route Card Evaluation — Retail Buy BNB ($750)

**Natural Language Intent**: "Buy $750 of BNB now with lowest immediate execution cost."

**Live State Timestamp**: `2026-09-08T12:44:55.000Z` | **Observed Skew**: `42ms`

### CONVERT Route — 🟢 BEST [LIVE-READ]

**Direction**: BUY $750 USDT  
**Timestamp**: `2026-09-08T12:44:55.000Z`  

#### Observed Now
- **Expected Fill**: `0.00133701`
- **Exchange Fee**: `0.00 bps`
- **Total Observed Immediate Cost**: **`0.00 bps`**
- **Quote Freshness**: `0 ms`

#### Constraints
| Constraint | Result | Observed / Limit |
| :--- | :---: | :--- |
| `product_available` | **✅ PASS** | Compliant |
| `trade_permission` | **✅ PASS** | Compliant |
| `retain_underlying` | **➖ NA** | Compliant |
| `quote_freshness` | **✅ PASS** | Compliant |

> **Decision**: Ranked first because it satisfies every hard constraint and has the lowest observed execution cost (0.00 bps) on this snapshot.

<details><summary><b>View Machine Evidence & Formula Details</b></summary>

- **Snapshot ID**: `snap-live-1788871520178`
- **Cost Components**:
  - `quote_spread_delta`: 0.00 bps (OBSERVED from convert_quote — Quote ID: conv-live-verified-001)
  - `exchange_fee`: 0.00 bps (OBSERVED from binance_convert — Zero trading fees on Binance Convert)

</details>

---

### SPOT Route — ⚪ VALID [LIVE-READ]

**Direction**: BUY $750 USDT  
**Timestamp**: `2026-09-08T12:44:55.000Z`  

#### Observed Now
- **Expected Fill**: `750.55000000`
- **Book Slippage**: `0.07 bps`
- **Exchange Fee**: `10.00 bps`
- **Total Observed Immediate Cost**: **`10.07 bps`**
- **Quote Freshness**: `0 ms`

#### Constraints
| Constraint | Result | Observed / Limit |
| :--- | :---: | :--- |
| `product_available` | **✅ PASS** | Compliant |
| `trade_permission` | **✅ PASS** | Compliant |
| `retain_underlying` | **➖ NA** | Compliant |
| `visible_depth` | **✅ PASS** | Compliant |

> **Decision**: Satisfies all constraints; evaluated against competing routes.

<details><summary><b>View Machine Evidence & Formula Details</b></summary>

- **Snapshot ID**: `snap-live-1788871520178`
- **Cost Components**:
  - `slippage`: 0.07 bps (OBSERVED from spot_orderbook_walk — Consumed 1 book levels)
  - `exchange_fee`: 10.00 bps (OBSERVED from spot_account_commission — Authoritative account taker commission)

</details>

---

### MARGIN Route — ⚠️ UNAVAILABLE [LIVE-READ]

**Direction**: BUY $750 USDT  
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

