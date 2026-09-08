import { SnapshotMode } from '../snapshot/index.js';
import { calculateDeltaBps } from '../decimal/index.js';

export type ReceiptFinalState =
  | 'PREPARED'
  | 'USER_REJECTED'
  | 'EXPIRED'
  | 'SENT'
  | 'PARTIAL'
  | 'FILLED'
  | 'CANCELED'
  | 'FAILED'
  | 'UNKNOWN';

export type ExecutionReceipt = {
  id: string;
  intentId: string;
  routeId: string;
  snapshotId: string;
  mode: SnapshotMode;
  preparedAt: string;
  confirmedAt?: string;
  sentAt?: string;
  finalState: ReceiptFinalState;
  binanceOrderId?: string;
  fillIds?: string[];
  expectedPrice?: string;
  realizedPrice?: string;
  realizedFee?: string;
  realizedVsExpectedBps?: string;
  failureCode?: string;
  engineVersion: string;
  commitSha: string;
};

export type CreateReceiptInput = {
  intentId: string;
  routeId: string;
  snapshotId: string;
  mode: SnapshotMode;
  expectedPrice?: string;
  engineVersion?: string;
  commitSha?: string;
};

/**
 * Creates an initial PREPARED execution receipt.
 */
export function createPreparedReceipt(input: CreateReceiptInput): ExecutionReceipt {
  return {
    id: `rcpt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    intentId: input.intentId,
    routeId: input.routeId,
    snapshotId: input.snapshotId,
    mode: input.mode,
    preparedAt: new Date().toISOString(),
    finalState: 'PREPARED',
    expectedPrice: input.expectedPrice,
    engineVersion: input.engineVersion ?? '1.0.0',
    commitSha: input.commitSha ?? 'local',
  };
}

/**
 * Completes a receipt after execution confirmation or abort.
 */
export function finalizeReceipt(
  receipt: ExecutionReceipt,
  update: {
    finalState: ReceiptFinalState;
    confirmedAt?: string;
    sentAt?: string;
    binanceOrderId?: string;
    fillIds?: string[];
    realizedPrice?: string;
    realizedFee?: string;
    failureCode?: string;
  }
): ExecutionReceipt {
  let realizedVsExpectedBps: string | undefined;
  if (receipt.expectedPrice && update.realizedPrice) {
    try {
      realizedVsExpectedBps = calculateDeltaBps(update.realizedPrice, receipt.expectedPrice);
    } catch {
      realizedVsExpectedBps = undefined;
    }
  }

  return {
    ...receipt,
    ...update,
    realizedVsExpectedBps,
  };
}
