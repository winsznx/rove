import { SnapshotMode } from '../snapshot/index.js';
export type ReceiptFinalState = 'PREPARED' | 'USER_REJECTED' | 'EXPIRED' | 'SENT' | 'PARTIAL' | 'FILLED' | 'CANCELED' | 'FAILED' | 'UNKNOWN';
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
export declare function createPreparedReceipt(input: CreateReceiptInput): ExecutionReceipt;
/**
 * Completes a receipt after execution confirmation or abort.
 */
export declare function finalizeReceipt(receipt: ExecutionReceipt, update: {
    finalState: ReceiptFinalState;
    confirmedAt?: string;
    sentAt?: string;
    binanceOrderId?: string;
    fillIds?: string[];
    realizedPrice?: string;
    realizedFee?: string;
    failureCode?: string;
}): ExecutionReceipt;
//# sourceMappingURL=index.d.ts.map