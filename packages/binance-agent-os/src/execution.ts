import {
  RoutePath,
  ExecutionIntent,
  ComparisonSnapshot,
  ExecutionReceipt,
  createPreparedReceipt,
  finalizeReceipt,
  ReceiptFinalState,
} from '@rove/core';
import { McpCaller } from './types.js';

export type PreparedOrder = {
  id: string;
  routeKind: RoutePath['kind'];
  symbol: string;
  side: 'buy' | 'sell';
  quantity?: string;
  quoteNotional?: string;
  orderType: 'MARKET' | 'LIMIT' | 'CONVERT';
  expectedPrice?: string;
  convertQuoteId?: string;
  leverage?: string;
  revalidationHash: string;
};

export type ExecutionResult = {
  success: boolean;
  finalState: ReceiptFinalState;
  binanceOrderId?: string;
  fillIds?: string[];
  realizedPrice?: string;
  realizedFee?: string;
  error?: string;
};

export class OrderExecutor {
  private caller: McpCaller;
  private enableLiveTrade: boolean;

  constructor(caller: McpCaller, enableLiveTrade: boolean = false) {
    this.caller = caller;
    this.enableLiveTrade = enableLiveTrade;
  }

  /**
   * Deterministically constructs an executable order from intent and selected RoutePath.
   */
  prepareOrder(
    intent: ExecutionIntent,
    selectedRoute: RoutePath,
    snapshot: ComparisonSnapshot
  ): PreparedOrder {
    if (selectedRoute.status !== 'SELECTED' && selectedRoute.status !== 'VALID') {
      throw new Error(`Cannot prepare order for non-valid route status: ${selectedRoute.status}`);
    }

    const symbol = `${selectedRoute.baseAsset}${selectedRoute.quoteAsset}`;
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let orderType: PreparedOrder['orderType'] = 'MARKET';
    if (selectedRoute.kind === 'convert') {
      orderType = 'CONVERT';
    }

    return {
      id: orderId,
      routeKind: selectedRoute.kind,
      symbol,
      side: selectedRoute.side,
      quantity: selectedRoute.requestedQuantity,
      quoteNotional: selectedRoute.requestedNotional,
      orderType,
      expectedPrice: selectedRoute.execution?.expectedFillPrice,
      convertQuoteId: snapshot.convert?.quoteId,
      leverage: selectedRoute.kind === 'usd_m_perp' ? intent.max_leverage ?? '1.0' : undefined,
      revalidationHash: snapshot.sourceFingerprint,
    };
  }

  /**
   * Submits a prepared order after explicit user approval.
   * Fails closed if ROVE_ENABLE_LIVE_TRADE is false.
   */
  async submitOrder(
    prepared: PreparedOrder,
    userApproved: boolean,
    receiptInput: {
      intentId: string;
      routeId: string;
      snapshotId: string;
    }
  ): Promise<{ receipt: ExecutionReceipt; result: ExecutionResult }> {
    const receipt = createPreparedReceipt({
      intentId: receiptInput.intentId,
      routeId: receiptInput.routeId,
      snapshotId: receiptInput.snapshotId,
      mode: this.enableLiveTrade ? 'live-trade' : 'live-read',
      expectedPrice: prepared.expectedPrice,
    });

    if (!userApproved) {
      const finalized = finalizeReceipt(receipt, {
        finalState: 'USER_REJECTED',
        failureCode: 'USER_CONFIRMATION_DECLINED',
      });
      return {
        receipt: finalized,
        result: {
          success: false,
          finalState: 'USER_REJECTED',
          error: 'User declined trade confirmation',
        },
      };
    }

    if (!this.enableLiveTrade) {
      // Safe dry-run mode: order prepared and validated, but submission is disabled by policy
      const finalized = finalizeReceipt(receipt, {
        finalState: 'PREPARED',
        confirmedAt: new Date().toISOString(),
      });
      return {
        receipt: finalized,
        result: {
          success: true,
          finalState: 'PREPARED',
          error: 'Live trade submission disabled (ROVE_ENABLE_LIVE_TRADE=false). Order prepared cleanly.',
        },
      };
    }

    // Live order submission to Binance Agent OS
    try {
      if (prepared.routeKind === 'spot') {
        const params: Record<string, unknown> = {
          symbol: prepared.symbol,
          side: prepared.side.toUpperCase(),
          type: 'MARKET',
        };
        if (prepared.quantity) params.quantity = prepared.quantity;
        if (prepared.quoteNotional) params.quoteOrderQty = prepared.quoteNotional;

        const res = await this.caller.callTool<{
          orderId: number;
          status: string;
          cummulativeQuoteQty?: string;
          executedQty?: string;
          fills?: Array<{ price: string; qty: string; commission: string }>;
        }>('spot.newOrder', params);

        const fillPrice = res.fills?.[0]?.price ?? prepared.expectedPrice;
        const fee = res.fills?.[0]?.commission ?? '0.00';

        const finalized = finalizeReceipt(receipt, {
          finalState: 'FILLED',
          confirmedAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          binanceOrderId: String(res.orderId),
          fillIds: res.fills?.map((_, i) => `fill-${res.orderId}-${i}`),
          realizedPrice: fillPrice,
          realizedFee: fee,
        });

        return {
          receipt: finalized,
          result: {
            success: true,
            finalState: 'FILLED',
            binanceOrderId: String(res.orderId),
            realizedPrice: fillPrice,
            realizedFee: fee,
          },
        };
      } else if (prepared.routeKind === 'convert') {
        if (!prepared.convertQuoteId) {
          throw new Error('Convert quoteId is missing');
        }

        const res = await this.caller.callTool<{
          orderId: string;
          orderStatus: string;
        }>('convert.acceptQuote', { quoteId: prepared.convertQuoteId });

        const finalized = finalizeReceipt(receipt, {
          finalState: 'FILLED',
          confirmedAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          binanceOrderId: res.orderId,
          realizedPrice: prepared.expectedPrice,
        });

        return {
          receipt: finalized,
          result: {
            success: true,
            finalState: 'FILLED',
            binanceOrderId: res.orderId,
            realizedPrice: prepared.expectedPrice,
          },
        };
      } else if (prepared.routeKind === 'usd_m_perp') {
        const params: Record<string, unknown> = {
          symbol: prepared.symbol,
          side: prepared.side.toUpperCase(),
          type: 'MARKET',
          quantity: prepared.quantity ?? '1.0',
        };

        const res = await this.caller.callTool<{
          orderId: number;
          status: string;
          avgPrice?: string;
        }>('futures_usds.newOrder', params);

        const finalized = finalizeReceipt(receipt, {
          finalState: 'FILLED',
          confirmedAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          binanceOrderId: String(res.orderId),
          realizedPrice: res.avgPrice ?? prepared.expectedPrice,
        });

        return {
          receipt: finalized,
          result: {
            success: true,
            finalState: 'FILLED',
            binanceOrderId: String(res.orderId),
            realizedPrice: res.avgPrice ?? prepared.expectedPrice,
          },
        };
      }

      throw new Error(`Unsupported live execution route: ${prepared.routeKind}`);
    } catch (err: any) {
      const finalized = finalizeReceipt(receipt, {
        finalState: 'FAILED',
        failureCode: err?.message ?? 'EXECUTION_FAILED',
      });
      return {
        receipt: finalized,
        result: {
          success: false,
          finalState: 'FAILED',
          error: err?.message,
        },
      };
    }
  }
}
