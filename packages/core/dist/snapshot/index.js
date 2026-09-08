export const DEFAULT_MAX_SNAPSHOT_SKEW_MS = 2000;
/**
 * Calculates the maximum timestamp skew between all present route states in a snapshot.
 */
export function calculateSnapshotSkew(snapshot) {
    const timestamps = [snapshot.account.timestamp];
    if (snapshot.spot)
        timestamps.push(snapshot.spot.timestamp);
    if (snapshot.convert)
        timestamps.push(snapshot.convert.timestamp);
    if (snapshot.usdM)
        timestamps.push(snapshot.usdM.timestamp);
    if (timestamps.length <= 1)
        return 0;
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    return max - min;
}
/**
 * Verifies that the snapshot skew does not exceed the allowed threshold.
 */
export function isSnapshotSkewAcceptable(snapshot, maxSkewMs = DEFAULT_MAX_SNAPSHOT_SKEW_MS) {
    const observedSkewMs = calculateSnapshotSkew(snapshot);
    return {
        acceptable: observedSkewMs <= maxSkewMs,
        observedSkewMs,
    };
}
//# sourceMappingURL=index.js.map