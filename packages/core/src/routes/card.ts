import { RoutePath, HedgeSemantics } from './index.js';
import { ExecutionIntent } from '../intent/index.js';
import { SnapshotMode } from '../snapshot/index.js';

export type RouteCardData = {
  routeId: string;
  kind: RoutePath['kind'];
  badge: 'BEST' | 'VALID' | 'REJECTED' | 'UNAVAILABLE' | 'EXPIRED';
  side: 'buy' | 'sell';
  sizeFormatted: string;
  mode: SnapshotMode;
  snapshotTimestamp: string;
  observedNow: {
    expectedFillPrice?: string;
    slippageBps?: string;
    feeBps?: string;
    observedExecutionCostBps?: string;
    currentFundingRateBps?: string;
    convertQuoteDeltaBps?: string;
    quoteAgeMs?: number;
    quoteId?: string;
    quoteExpiryRemainingMs?: number;
  };
  estimatedHorizon?: {
    horizonFormatted: string;
    estimatedCarryBps?: string;
    assumption: string;
    status: string;
  };
  hedgeSemantics?: HedgeSemantics;
  constraints: Array<{
    key: string;
    state: 'PASS' | 'FAIL' | 'NA' | 'UNKNOWN';
    observedValue?: string;
    limitValue?: string;
    reason?: string;
  }>;
  decisionReason: string;
  evidence: {
    snapshotId: string;
    components: Array<{
      key: string;
      valueBps: string | null;
      source: string;
      status: string;
      note?: string;
    }>;
  };
};

/**
 * Builds a structured RouteCardData from a RoutePath and ExecutionIntent.
 */
export function buildRouteCardData(
  route: RoutePath,
  intent: ExecutionIntent,
  mode: SnapshotMode = 'live-read',
  snapshotTimestamp?: string
): RouteCardData {
  let badge: RouteCardData['badge'] = 'VALID';
  if (route.status === 'SELECTED') {
    badge = 'BEST';
  } else if (route.status === 'REJECTED') {
    badge = 'REJECTED';
  } else if (route.status === 'UNAVAILABLE') {
    badge = 'UNAVAILABLE';
  } else if (route.status === 'EXPIRED') {
    badge = 'EXPIRED';
  }

  let sizeFormatted = '';
  if (route.requestedQuantity) {
    sizeFormatted = `${route.requestedQuantity} ${route.baseAsset}`;
  } else if (route.requestedNotional) {
    sizeFormatted = `$${route.requestedNotional} ${route.quoteAsset}`;
  }

  let decisionReason = '';
  if (route.status === 'SELECTED') {
    decisionReason = `Ranked first because it satisfies every hard constraint and has the lowest observed execution cost (${route.execution?.observedExecutionCostBps ?? '0'} bps) on this snapshot.`;
  } else if (route.rejection) {
    decisionReason = route.rejection.message;
  } else if (route.status === 'VALID') {
    decisionReason = 'Satisfies all constraints; evaluated against competing routes.';
  } else {
    decisionReason = 'Route unavailable or expired.';
  }

  let estimatedHorizon: RouteCardData['estimatedHorizon'];
  if (route.carry && intent.horizon) {
    estimatedHorizon = {
      horizonFormatted: `${intent.horizon.value} ${intent.horizon.unit}`,
      estimatedCarryBps: route.carry.estimatedCarryBps,
      assumption: route.carry.assumption,
      status: route.carry.status,
    };
  }

  return {
    routeId: route.id,
    kind: route.kind,
    badge,
    side: route.side,
    sizeFormatted,
    mode,
    snapshotTimestamp: snapshotTimestamp ?? new Date().toISOString(),
    observedNow: {
      expectedFillPrice: route.execution?.expectedFillPrice,
      slippageBps: route.execution?.slippageBps,
      feeBps: route.execution?.feeBps,
      observedExecutionCostBps: route.execution?.observedExecutionCostBps,
      currentFundingRateBps: route.execution?.components.find((c) => c.key === 'current_funding_rate')?.valueBps ?? undefined,
      convertQuoteDeltaBps: route.execution?.convertQuoteDeltaBps,
      quoteAgeMs: route.quoteFreshnessMs,
      quoteId: route.quoteId ?? (route.kind === 'convert' ? 'convert-quote' : undefined),
      quoteExpiryRemainingMs: route.quoteExpiryRemainingMs,
    },
    estimatedHorizon,
    hedgeSemantics: route.hedgeSemantics,
    constraints: route.constraints.map((c) => ({
      key: c.key,
      state: c.state,
      observedValue: c.observedValue,
      limitValue: c.limitValue,
      reason: c.reason,
    })),
    decisionReason,
    evidence: {
      snapshotId: route.snapshotId,
      components: route.execution?.components ?? [],
    },
  };
}

/**
 * Formats a RouteCardData into clean GitHub Flavored Markdown.
 */
export function formatRouteCardMarkdown(card: RouteCardData): string {
  const badgeEmoji =
    card.badge === 'BEST'
      ? '🟢 BEST'
      : card.badge === 'VALID'
      ? '⚪ VALID'
      : card.badge === 'REJECTED'
      ? '🔴 REJECTED'
      : '⚠️ ' + card.badge;

  const modeChip = `[${card.mode.toUpperCase()}]`;

  let md = `### ${card.kind.toUpperCase()} Route — ${badgeEmoji} ${modeChip}\n\n`;
  md += `**Direction**: ${card.side.toUpperCase()} ${card.sizeFormatted}  \n`;
  md += `**Timestamp**: \`${card.snapshotTimestamp}\`  \n\n`;

  // Observed section
  md += `#### Observed Now\n`;
  if (card.observedNow.expectedFillPrice) {
    md += `- **Expected Fill**: \`${card.observedNow.expectedFillPrice}\`\n`;
  }
  if (card.observedNow.slippageBps) {
    md += `- **Book Slippage**: \`${card.observedNow.slippageBps} bps\`\n`;
  }
  if (card.observedNow.convertQuoteDeltaBps) {
    md += `- **RFQ Spread Markup**: \`${card.observedNow.convertQuoteDeltaBps} bps\` (embedded rate markup vs Spot mid)\n`;
  }
  if (card.observedNow.feeBps) {
    md += `- **Exchange Fee**: \`${card.observedNow.feeBps} bps\`\n`;
  }
  if (card.observedNow.currentFundingRateBps) {
    md += `- **Current Funding Rate**: \`${card.observedNow.currentFundingRateBps} bps per 8h\` (Observed live)\n`;
  }
  if (card.observedNow.observedExecutionCostBps) {
    md += `- **Total Observed Immediate Cost**: **\`${card.observedNow.observedExecutionCostBps} bps\`**\n`;
  }
  if (card.observedNow.quoteId) {
    md += `- **Quote ID**: \`${card.observedNow.quoteId}\`\n`;
  }
  if (card.observedNow.quoteExpiryRemainingMs !== undefined) {
    md += `- **Quote Expiry Remaining**: \`${card.observedNow.quoteExpiryRemainingMs} ms\`\n`;
  }
  if (card.observedNow.quoteAgeMs !== undefined) {
    md += `- **Quote Freshness**: \`${card.observedNow.quoteAgeMs} ms\`\n`;
  }
  md += `\n`;

  // Estimated Horizon section
  if (card.estimatedHorizon) {
    md += `#### Estimated Over Horizon (${card.estimatedHorizon.horizonFormatted})\n`;
    md += `- **Projected Funding Carry**: **\`${card.estimatedHorizon.estimatedCarryBps} bps\`**\n`;
    md += `- *${card.estimatedHorizon.assumption}*\n\n`;
  }

  // Hedge Sizing & Resulting Delta section (if applicable)
  if (card.hedgeSemantics) {
    const hs = card.hedgeSemantics;
    md += `#### Hedge Sizing & Resulting Delta\n`;
    md += `- **Source Exposure**: \`${hs.sourceExposure} ${hs.sourceAsset}\` (from free spot balance)\n`;
    md += `- **Target Fraction**: \`${hs.targetFraction}\` (${(parseFloat(hs.targetFraction) * 100).toFixed(1)}%)\n`;
    md += `- **Calculated Quantity**: \`${hs.rawHedgeQuantity} ${hs.sourceAsset}\` (rounded to \`${hs.roundedHedgeQuantity}\` at \`${hs.roundingPrecision}\` step size)\n`;
    md += `- **Hedge Notional**: \`$${hs.hedgeNotionalUsdt} USDT\` at mark price \`${hs.markPrice}\`\n`;
    if (hs.availableCollateralUsdt) {
      md += `- **Available Margin Collateral**: \`$${hs.availableCollateralUsdt} USDT\`\n`;
    }
    if (hs.requiredLeverage) {
      md += `- **Required / Effective Leverage**: **\`${hs.requiredLeverage}x\`**${hs.maxLeverageCap ? ` (within user ceiling of \`${hs.maxLeverageCap}x\`)` : ''}\n`;
    }
    md += `- **Resulting Intended Delta**: \`${hs.resultingIntendedDelta}\`\n\n`;
  }

  // Constraint strip
  md += `#### Constraints\n`;
  md += `| Constraint | Result | Observed / Limit |\n`;
  md += `| :--- | :---: | :--- |\n`;
  for (const c of card.constraints) {
    const icon = c.state === 'PASS' ? '✅ PASS' : c.state === 'FAIL' ? '❌ FAIL' : '➖ ' + c.state;
    const detail = c.observedValue && c.limitValue ? `${c.observedValue} (limit: ${c.limitValue})` : c.reason ?? 'Compliant';
    md += `| \`${c.key}\` | **${icon}** | ${detail} |\n`;
  }
  md += `\n`;

  // Decision reason
  md += `> **Decision**: ${card.decisionReason}\n\n`;

  // Expandable evidence
  md += `<details><summary><b>View Machine Evidence & Formula Details</b></summary>\n\n`;
  md += `- **Snapshot ID**: \`${card.evidence.snapshotId}\`\n`;
  md += `- **Cost Components**:\n`;
  for (const comp of card.evidence.components) {
    md += `  - \`${comp.key}\`: ${comp.valueBps ?? 'N/A'} bps (${comp.status} from ${comp.source}${comp.note ? ` — ${comp.note}` : ''})\n`;
  }
  md += `\n</details>\n`;

  return md;
}
