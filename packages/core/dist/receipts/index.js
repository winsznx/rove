import { calculateDeltaBps } from '../decimal/index.js';
/**
 * Creates an initial PREPARED execution receipt.
 */
export function createPreparedReceipt(input) {
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
export function finalizeReceipt(receipt, update) {
    let realizedVsExpectedBps;
    if (receipt.expectedPrice && update.realizedPrice) {
        try {
            realizedVsExpectedBps = calculateDeltaBps(update.realizedPrice, receipt.expectedPrice);
        }
        catch {
            realizedVsExpectedBps = undefined;
        }
    }
    return {
        ...receipt,
        ...update,
        realizedVsExpectedBps,
    };
}
//# sourceMappingURL=index.js.map