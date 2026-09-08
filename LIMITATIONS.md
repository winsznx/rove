# Rove — Scope, Assumptions & Limitations

To ensure absolute credibility and truth in advertising, this document explicitly details the known technical boundaries, assumptions, and scope limitations of Rove V1.

---

## 1. Scope of Canonical Execution Venues

In Rove V1, three Binance execution venues are fully implemented and verified:
1. **Spot Exchange** (`spot.*`): Full L2 depth walking, maker/taker fee derivation, balance checks, and limit/market orders.
2. **Binance Convert** (`convert.*`): Real-time RFQ pricing, zero-slippage execution, valid timestamp windows, and quote acceptance.
3. **USD-M Perpetual Futures** (`futures_usds.*`): Mark pricing, basis point premium indexing, position tracking, leverage validation, and market orders.

### Feature-Gated Venues
* **Cross Margin** (`margin.*`): During Phase 0 empirical testing, `margin.queryCrossMarginAccountDetails` returned `tradeEnabled: false` and `borrowEnabled: false` on the Binance Agent OS sub-account. To prevent misleading or synthetic quotes, Cross Margin is strictly feature-gated and returns status `UNAVAILABLE` with reason code `CROSS_MARGIN_DISABLED`.
* **COIN-M Perpetual Futures** (`futures_coin.*`): While the sub-account possesses futures capabilities (`canTrade: true`), COIN-M inverse contract pricing is feature-gated in V1 to maintain focus on the canonical trio (Spot, Convert, USD-M).

---

## 2. Forward-Looking Funding Assumptions

Perpetual futures contracts adjust funding rates every 8 hours based on market premiums. When calculating projected carry over horizons exceeding the current funding interval:
* **Assumption**: Rove projects carry under the explicit mathematical assumption that the currently observed funding rate persists linearly across the specified horizon.
* **Disclosure**: Every Route Card and benchmark output prominently prints:
  *`Explicit assumption: current funding rate of X bps persists across Y hours.`*
* **Limitation**: Rove does not forecast or simulate dynamic funding regime shifts or volatility smiles.

---

## 3. Orderbook Depth & Ticket Size Limits

* **Depth Limit**: Orderbook snapshots capture the top 20 bid and ask price levels from `spot.depth`.
* **Liquidity Exhaustion**: If a user specifies an order size larger than the cumulative liquidity across these 20 levels, Rove safely rejects the Spot route with `INSUFFICIENT_LIQUIDITY` rather than assuming infinite top-of-book depth.
* **Large Ticket Execution**: Institutional block orders requiring multi-hour TWAP/VWAP algorithmic slicing are outside V1 scope.

---

## 4. Cross-Market Skew & Volatility

* **Concurrent Capture**: Rove captures Spot, Convert, and Futures quotes concurrently via `Promise.all`.
* **Empirical Skew**: Measured skew in live testing is 38–48 ms.
* **Threshold**: If network congestion causes skew to exceed 1,500 ms, the snapshot fails validation.
* **Flash Crashes**: During extreme market dislocations occurring within the 40ms capture window, minor quote divergence is theoretically possible; pre-execution revalidation hashes safeguard against execution drift.

---

## 5. Regulatory & Custodial Notice

* Rove is non-custodial software and does not hold user deposits or private keys.
* Rove does not provide automated financial advice or guarantee trading profit.
* All live trade executions require explicit human confirmation.
