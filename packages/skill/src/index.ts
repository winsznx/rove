import {
  ExecutionIntent,
  validateIntentInput,
  ParsedIntentEnvelope,
  generateAndEvaluateRoutes,
  rankRoutes,
  buildRouteCardData,
  formatRouteCardMarkdown,
  RoutePath,
  SnapshotMode,
} from '@rove/core';
import {
  BinanceAgentOsAdapter,
  SnapshotCollector,
  OrderExecutor,
  McpCaller,
  PreparedOrder,
} from '@rove/binance-agent-os';

export interface RoveExecutionPipelineResult {
  intent: ExecutionIntent;
  routes: RoutePath[];
  winningRoute?: RoutePath;
  routeCardsMarkdown: string;
  preparedOrder?: PreparedOrder;
}

/**
 * Compiles natural language input into typed ExecutionIntent with deterministic validation.
 */
export function compileUserIntent(
  rawInput: Record<string, unknown>,
  originalText: string
): ParsedIntentEnvelope {
  return validateIntentInput(rawInput, originalText);
}

/**
 * Executes the full Rove compiler pipeline:
 * live state read -> constraint evaluation -> deterministic ranking -> Route Cards
 */
export async function runRovePipeline(
  intent: ExecutionIntent,
  mcpCaller: McpCaller,
  options: {
    mode?: SnapshotMode;
    enableLiveTrade?: boolean;
    maxSkewMs?: number;
  } = {}
): Promise<RoveExecutionPipelineResult> {
  const adapter = new BinanceAgentOsAdapter(mcpCaller);

  // Read permissions to construct capability registry
  const perms = await adapter.getApiKeyPermissions();
  const capabilityRegistry = {
    spot: {
      marketRead: true,
      accountRead: perms.enableReading,
      trade: perms.enableSpotAndMarginTrading,
      feeRead: true,
    },
    convert: {
      quote: true,
      trade: perms.enableSpotAndMarginTrading,
    },
    usdM: {
      marketRead: true,
      fundingRead: true,
      positionRead: perms.enableFutures,
      trade: perms.enableFutures,
      feeRead: true,
    },
    margin: {
      marketRead: true,
      borrowRateRead: true,
      accountRead: false,
      trade: false,
      costingComplete: false,
    },
    coinM: {
      marketRead: true,
      fundingRead: true,
      positionRead: perms.enableFutures,
      trade: perms.enableFutures,
      feeRead: true,
      costingComplete: false,
    },
  };

  const collector = new SnapshotCollector(adapter, capabilityRegistry);
  const snapshot = await collector.captureSnapshot({
    asset: intent.asset,
    mode: options.mode ?? 'live-read',
    maxSkewMs: options.maxSkewMs,
  });

  const evaluatedRoutes = generateAndEvaluateRoutes({
    intent,
    snapshot,
  });

  const rankedRoutes = rankRoutes(evaluatedRoutes);
  const winningRoute = rankedRoutes.find((r) => r.status === 'SELECTED');

  // Build Route Cards markdown
  let routeCardsMarkdown = `## Rove Comparison — ${intent.asset} (${intent.objective.toUpperCase()})\n\n`;
  for (const r of rankedRoutes) {
    const cardData = buildRouteCardData(r, intent, snapshot.mode, snapshot.completedAt);
    routeCardsMarkdown += formatRouteCardMarkdown(cardData) + '\n---\n\n';
  }

  let preparedOrder: PreparedOrder | undefined;
  if (winningRoute) {
    const executor = new OrderExecutor(mcpCaller, options.enableLiveTrade ?? false);
    preparedOrder = executor.prepareOrder(intent, winningRoute, snapshot);
  }

  return {
    intent,
    routes: rankedRoutes,
    winningRoute,
    routeCardsMarkdown,
    preparedOrder,
  };
}
