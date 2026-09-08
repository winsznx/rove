import { ExecutionIntent, ComparisonSnapshot, RoutePath, PathKind } from '@rove/core';

export type BenchmarkResultRow = {
  intentId: string;
  intentText: string;
  snapshotId: string;
  eligiblePaths: PathKind[];
  roveWinner?: PathKind;
  roveStatus?: RoutePath['status'];
  roveObservedCostBps?: string;
  roveEstimatedCarryBps?: string;
  baselineWinner?: PathKind;
  baselineStatus?: 'VALID' | 'REJECTED';
  baselineObservedCostBps?: string;
  winnerChanged: boolean;
  whyChanged: string;
  isConstraintRescue: boolean;
  isComparable: boolean;
  comparable_for_cost_savings: boolean;
  comparability_reason?: string;
  costDeltaBps?: string;
  baselineConstraintViolated?: string;
  constraintTriggered?: string;
  rejectionReason?: string;
};

export type AblationType =
  | 'none'
  | 'spot_only'
  | 'no_convert'
  | 'no_futures'
  | 'no_funding_awareness'
  | 'no_horizon'
  | 'ticker_only'
  | 'spot_default'
  | 'llm_only';

export type BenchmarkRunSummary = {
  runId: string;
  timestamp: string;
  engineVersion: string;
  totalIntents: number;
  routeDecisionChangeRate: string;
  constraintRescueRate: string;
  comparableRouteSavingsBps: string;
  baselineViolationRate: string;
  roveViolationRate: string;
  failClosedRate: string;
  // Backward compatibility aliases
  routeFlipRate: string;
  constraintEnforcementRate: string;
  medianCostSavingsBps: string;
  rows: BenchmarkResultRow[];
};
