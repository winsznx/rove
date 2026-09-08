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
  baselineObservedCostBps?: string;
  winnerChanged: boolean;
  whyChanged: string;
  costDeltaBps?: string;
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
  | 'llm_only';

export type BenchmarkRunSummary = {
  runId: string;
  timestamp: string;
  engineVersion: string;
  totalIntents: number;
  routeFlipRate: string; // Percentage where Rove chose different route from Spot baseline
  constraintEnforcementRate: string; // Percentage where constraints changed winner or rejected invalid
  medianCostSavingsBps: string;
  rows: BenchmarkResultRow[];
};
