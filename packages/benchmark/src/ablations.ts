import {
  ExecutionIntent,
  ComparisonSnapshot,
  RoutePath,
  generateAndEvaluateRoutes,
  rankRoutes,
} from '@rove/core';
import { AblationType } from './types.js';

export function runAblation(
  intent: ExecutionIntent,
  snapshot: ComparisonSnapshot,
  ablation: AblationType,
  currentTimeMs?: number
): RoutePath[] {
  let adjustedIntent = { ...intent };
  let adjustedSnapshot = { ...snapshot };

  switch (ablation) {
    case 'spot_only': {
      // Only keep spot in snapshot
      adjustedSnapshot = {
        ...snapshot,
        convert: undefined,
        usdM: undefined,
      };
      break;
    }
    case 'no_convert': {
      adjustedSnapshot = {
        ...snapshot,
        convert: undefined,
      };
      break;
    }
    case 'no_futures': {
      adjustedSnapshot = {
        ...snapshot,
        usdM: undefined,
      };
      break;
    }
    case 'no_funding_awareness': {
      // Set current funding rate to 0.00 bps
      if (adjustedSnapshot.usdM) {
        adjustedSnapshot = {
          ...snapshot,
          usdM: {
            ...adjustedSnapshot.usdM,
            currentFundingRateBps: '0.00',
          },
        };
      }
      break;
    }
    case 'no_horizon': {
      // Strip horizon from intent
      adjustedIntent = {
        ...intent,
        horizon: undefined,
        max_estimated_carry_bps: undefined,
      };
      break;
    }
    case 'ticker_only': {
      // Deep book with huge liquidity at mid price, eliminating slippage
      if (adjustedSnapshot.spot) {
        const mid = adjustedSnapshot.spot.bidPrice;
        adjustedSnapshot = {
          ...snapshot,
          spot: {
            ...adjustedSnapshot.spot,
            bids: [[mid, '1000000.0']],
            asks: [[mid, '1000000.0']],
          },
        };
      }
      break;
    }
    case 'llm_only': {
      // Simulated LLM-only path choice: naive model chooses Spot for buy/sell,
      // and naive choice for hedge without checking retain underlying or fees
      const standardRoutes = generateAndEvaluateRoutes({
        intent: adjustedIntent,
        snapshot: adjustedSnapshot,
        currentTimeMs,
      });
      // LLM blindly picks Spot if available, regardless of constraints
      const spotRoute = standardRoutes.find((r) => r.kind === 'spot');
      if (spotRoute) {
        return [{ ...spotRoute, status: 'SELECTED' }];
      }
      return standardRoutes;
    }
    case 'none':
    default:
      break;
  }

  const routes = generateAndEvaluateRoutes({
    intent: adjustedIntent,
    snapshot: adjustedSnapshot,
    currentTimeMs,
  });

  return rankRoutes(routes);
}
