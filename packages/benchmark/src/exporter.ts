import fs from 'node:fs';
import path from 'node:path';
import { BenchmarkResultRow, BenchmarkRunSummary } from './types.js';

/**
 * Serializes BenchmarkResultRows into PRD-compliant CSV format.
 */
export function formatBenchmarkCsv(rows: BenchmarkResultRow[]): string {
  const headers = [
    'intent_id',
    'eligible_paths',
    'winner',
    'baseline_winner',
    'winner_changed',
    'why_changed',
    'observed_cost_delta',
    'constraint_delta',
    'snapshot_id',
    'comparable_for_cost_savings',
    'comparability_reason',
  ];

  const lines = [headers.join(',')];

  for (const r of rows) {
    const row = [
      r.intentId,
      `"${r.eligiblePaths.join(';')}"`,
      r.roveWinner ?? 'NONE',
      r.baselineWinner ?? 'NONE',
      r.winnerChanged ? 'TRUE' : 'FALSE',
      `"${r.whyChanged.replace(/"/g, '""')}"`,
      r.costDeltaBps ?? '0.00',
      r.constraintTriggered ?? 'NONE',
      r.snapshotId,
      r.comparable_for_cost_savings ? 'TRUE' : 'FALSE',
      `"${(r.comparability_reason ?? '').replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Saves benchmark outputs to file destinations.
 */
export function saveBenchmarkArtifacts(
  summary: BenchmarkRunSummary,
  outputDir: string = './benchmarks'
): { jsonPath: string; csvPath: string } {
  fs.mkdirSync(outputDir, { recursive: true });

  const csv = formatBenchmarkCsv(summary.rows);
  const csvPath = path.join(outputDir, 'results.csv');
  fs.writeFileSync(csvPath, csv, 'utf8');

  const jsonPath = path.join(outputDir, 'results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');

  return { jsonPath, csvPath };
}
