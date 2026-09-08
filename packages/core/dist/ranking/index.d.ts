import { RoutePath } from '../routes/index.js';
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
export declare function rankRoutes(routes: RoutePath[]): RoutePath[];
//# sourceMappingURL=index.d.ts.map