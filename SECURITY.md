# Rove — Security Policy & Threat Model

## 1. Security Architecture Principles

Financial automation systems operating with autonomous agents present unique safety risks. Rove is architected around **defense-in-depth**, **non-custodial execution**, and **deterministic safety gates**.

---

## 2. Threat Model & Mitigation Matrix

| Threat | Description | Rove Defense Mechanism |
| :--- | :--- | :--- |
| **Unauthorized Fund Siphoning** | Malicious prompt injection attempting to withdraw funds to an attacker's address. | **Zero Withdrawal Permissions**: Binance Agent OS sub-account permissions enforce `enableWithdrawals: false`. No withdrawal tool exists in the execution surface. |
| **Runaway Autonomous Trading** | Agent entering infinite execution loops or placing unauthorized live orders. | **Hard Live Safety Gate**: `ROVE_ENABLE_LIVE_TRADE=false` by default. Code execution fails immediately if live trade is requested without explicit boolean override. |
| **API Secret Exfiltration** | Web frontend or agent logs leaking user API keys or private credentials. | **Non-Custodial Architecture**: Core compiler and Web UI accept zero secrets. Agent OS authentication is handled via OAuth 2.0 PKCE directly with Binance. |
| **Stale Quote Arbitrage / Front-running** | Market moving significantly between snapshot capture and user confirmation. | **Pre-Execution Revalidation**: Before submitting an order, Rove compares fresh top-of-book against snapshot state. If drift exceeds 50 bps, execution halts. |
| **Financial Hallucination** | LLM inventing leverage caps, fee tiers, or order sizes. | **Deterministic Type Engine**: Money math and constraints are evaluated strictly in TypeScript. The LLM cannot alter order sizing or bypass constraint rejections. |

---

## 3. The Live Trading Safety Gate (`OrderExecutor`)

In `packages/binance-agent-os/src/execution.ts`, the order execution pipeline contains a hardcoded, non-bypassable guard:

```typescript
export class OrderExecutor {
  private caller: McpCaller;
  private enableLiveTrade: boolean;

  constructor(caller: McpCaller, enableLiveTrade: boolean = false) {
    this.caller = caller;
    this.enableLiveTrade = enableLiveTrade;
  }

  async executeOrder(preparedOrder: PreparedOrder, currentSnapshot: ComparisonSnapshot): Promise<ExecutionResult> {
    // HARD GATE: live trades require explicit affirmative enablement
    if (!this.enableLiveTrade) {
      return {
        success: false,
        finalState: 'SIMULATED',
        error: 'ROVE_ENABLE_LIVE_TRADE is false. Live trading is gated off for safety.',
      };
    }
    // ...
  }
}
```

By default, any call to execute an order returns status `SIMULATED`. Live trading requires explicitly setting the environment variable `ROVE_ENABLE_LIVE_TRADE=true` AND passing `enableLiveTrade: true` in the execution options.

---

## 4. Binance Agent OS Permission Scoping

Rove interacts with Binance Agent OS through a dedicated **Agentic Sub-account**. Authoritative permissions verified via `wallet.getApiKeyPermission`:

```json
{
  "ipRestrict": false,
  "enableReading": true,
  "enableSpotAndMarginTrading": true,
  "enableFutures": true,
  "enableMargin": true,
  "enableWithdrawals": false,
  "enableInternalTransfer": false
}
```

### Safety Features:
1. **No External Transfers**: Assets cannot leave the Binance ecosystem.
2. **Sub-account Boundary**: Losses or position commitments are strictly segregated from the user's primary Binance master account.
3. **Audit Trails**: All MCP tool calls are logged with unique request IDs and timestamps.

---

## 5. State Fingerprinting & Drift Detection

Every `ComparisonSnapshot` generates a SHA-256 fingerprint of its market book and account balance:

1. When a user approves a Route Card, the order payload contains `revalidationHash`.
2. Before order dispatch, Rove captures the instantaneous top-of-book.
3. If price drift exceeds the allowed slippage tolerance (e.g. 50 bps), the trade aborts with code `PRICE_DRIFT_EXCEEDED`, protecting the user against adverse market moves.

---

## 6. Responsible Disclosure

If you discover a security vulnerability or discrepancy within Rove, please submit a report to `security@rove.finance` or open an encrypted issue on GitHub.
