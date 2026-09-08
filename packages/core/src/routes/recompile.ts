import { ExecutionIntent } from '../intent/index.js';
import { ComparisonSnapshot } from '../snapshot/index.js';
import { RoutePath, PathKind, generateAndEvaluateRoutes } from './index.js';
import { rankRoutes } from '../ranking/index.js';
import { RejectionCode } from '../constraints/index.js';

export type RouteStatusDelta = {
  kind: PathKind;
  previousStatus: RoutePath['status'];
  newStatus: RoutePath['status'];
  rejectionReason?: string;
  rejectionCode?: RejectionCode;
};

export type WhatIfDiff = {
  winnerChanged: boolean;
  previousWinner?: PathKind;
  newWinner?: PathKind;
  newlyRejected: RouteStatusDelta[];
  newlyValid: RouteStatusDelta[];
  costDeltas: Array<{
    kind: PathKind;
    previousObservedCostBps?: string;
    newObservedCostBps?: string;
    previousCarryBps?: string;
    newCarryBps?: string;
  }>;
  routes: RoutePath[];
};

/**
 * Recompiles routes with updated intent constraints against a comparison snapshot,
 * detecting exactly what changed, what flipped, and which constraints triggered.
 */
export function recompileWhatIf(
  previousRoutes: RoutePath[],
  updatedIntent: ExecutionIntent,
  snapshot: ComparisonSnapshot,
  currentTimeMs?: number
): WhatIfDiff {
  const previousWinner = previousRoutes.find((r) => r.status === 'SELECTED')?.kind;

  const newEvaluated = generateAndEvaluateRoutes({
    intent: updatedIntent,
    snapshot,
    currentTimeMs,
  });

  const rankedNew = rankRoutes(newEvaluated);
  const newWinner = rankedNew.find((r) => r.status === 'SELECTED')?.kind;

  const newlyRejected: RouteStatusDelta[] = [];
  const newlyValid: RouteStatusDelta[] = [];
  const costDeltas: WhatIfDiff['costDeltas'] = [];

  for (const newRoute of rankedNew) {
    const prevRoute = previousRoutes.find((r) => r.kind === newRoute.kind);
    if (!prevRoute) continue;

    const prevWasValid = prevRoute.status === 'VALID' || prevRoute.status === 'SELECTED';
    const newIsValid = newRoute.status === 'VALID' || newRoute.status === 'SELECTED';

    if (prevWasValid && !newIsValid) {
      newlyRejected.push({
        kind: newRoute.kind,
        previousStatus: prevRoute.status,
        newStatus: newRoute.status,
        rejectionReason: newRoute.rejection?.message,
        rejectionCode: newRoute.rejection?.code,
      });
    } else if (!prevWasValid && newIsValid) {
      newlyValid.push({
        kind: newRoute.kind,
        previousStatus: prevRoute.status,
        newStatus: newRoute.status,
      });
    }

    if (
      prevRoute.execution?.observedExecutionCostBps !== newRoute.execution?.observedExecutionCostBps ||
      prevRoute.carry?.estimatedCarryBps !== newRoute.carry?.estimatedCarryBps
    ) {
      costDeltas.push({
        kind: newRoute.kind,
        previousObservedCostBps: prevRoute.execution?.observedExecutionCostBps,
        newObservedCostBps: newRoute.execution?.observedExecutionCostBps,
        previousCarryBps: prevRoute.carry?.estimatedCarryBps,
        newCarryBps: newRoute.carry?.estimatedCarryBps,
      });
    }
  }

  return {
    winnerChanged: previousWinner !== newWinner,
    previousWinner,
    newWinner,
    newlyRejected,
    newlyValid,
    costDeltas,
    routes: rankedNew,
  };
}
