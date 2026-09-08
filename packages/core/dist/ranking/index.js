import { toDecimal } from '../decimal/index.js';
const OPERATIONAL_COMPLEXITY = {
    convert: 1,
    spot: 2,
    usd_m_perp: 3,
    coin_m_perp: 4,
    margin: 5,
};
/**
 * Pure deterministic ranking algorithm adhering strictly to PRD Section 20.
 *
 * Precedence:
 * 1. Hard constraints pass (status === 'VALID' ahead of others)
 * 2. Complete cost data (execution.status === 'COMPLETE')
 * 3. Lower observed immediate execution cost (observedExecutionCostBps)
 * 4. Lower estimated carry (estimatedCarryBps)
 * 5. Fresher quote (quoteFreshnessMs ascending)
 * 6. Operational complexity (Convert > Spot > USD-M > COIN-M > Margin)
 */
export function rankRoutes(routes) {
    const sorted = [...routes].sort((a, b) => {
        // 1. Hard constraint validity
        const aValid = a.status === 'VALID' || a.status === 'SELECTED';
        const bValid = b.status === 'VALID' || b.status === 'SELECTED';
        if (aValid && !bValid)
            return -1;
        if (!aValid && bValid)
            return 1;
        // If neither is valid, retain stable order by product complexity
        if (!aValid && !bValid) {
            return OPERATIONAL_COMPLEXITY[a.kind] - OPERATIONAL_COMPLEXITY[b.kind];
        }
        // 2. Cost completeness
        const aComplete = a.execution?.status === 'COMPLETE';
        const bComplete = b.execution?.status === 'COMPLETE';
        if (aComplete && !bComplete)
            return -1;
        if (!aComplete && bComplete)
            return 1;
        // 3. Lower observed immediate execution cost
        const aCost = toDecimal(a.execution?.observedExecutionCostBps ?? '999999');
        const bCost = toDecimal(b.execution?.observedExecutionCostBps ?? '999999');
        const costCmp = aCost.comparedTo(bCost);
        if (costCmp !== 0)
            return costCmp;
        // 4. Lower estimated carry (if present)
        const aCarry = toDecimal(a.carry?.estimatedCarryBps ?? '0');
        const bCarry = toDecimal(b.carry?.estimatedCarryBps ?? '0');
        const carryCmp = aCarry.comparedTo(bCarry);
        if (carryCmp !== 0)
            return carryCmp;
        // 5. Fresher quote
        const aFresh = a.quoteFreshnessMs ?? 999999;
        const bFresh = b.quoteFreshnessMs ?? 999999;
        if (aFresh !== bFresh)
            return aFresh - bFresh;
        // 6. Operational complexity tie-break
        return OPERATIONAL_COMPLEXITY[a.kind] - OPERATIONAL_COMPLEXITY[b.kind];
    });
    // Mark the top valid route as SELECTED
    let foundWinner = false;
    return sorted.map((route) => {
        if ((route.status === 'VALID' || route.status === 'SELECTED') && !foundWinner) {
            foundWinner = true;
            return { ...route, status: 'SELECTED' };
        }
        return route;
    });
}
//# sourceMappingURL=index.js.map