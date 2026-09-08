import { toDecimal } from '../decimal/index.js';

export type BookLevel = [price: string, quantity: string];

export type BookWalkInput = {
  side: 'buy' | 'sell';
  requestedBaseQuantity?: string;
  requestedQuoteNotional?: string;
  bids: BookLevel[];
  asks: BookLevel[];
};

export type BookWalkResult = {
  filledBaseQuantity: string;
  spentOrReceivedQuote: string;
  vwap: string;
  levelsConsumed: number;
  sufficientDepth: boolean;
};

/**
 * Pure, deterministic order-book walking function.
 * Walks visible levels without interpolation beyond available depth.
 */
export function walkOrderBook(input: BookWalkInput): BookWalkResult {
  const { side, requestedBaseQuantity, requestedQuoteNotional, bids, asks } = input;

  if (!requestedBaseQuantity && !requestedQuoteNotional) {
    throw new Error('Either requestedBaseQuantity or requestedQuoteNotional must be specified');
  }

  const isBuy = side === 'buy';
  const levels = isBuy ? asks : bids;

  // For buy: asks should be sorted ascending (cheapest first)
  // For sell: bids should be sorted descending (highest price first)
  const sortedLevels = [...levels].sort((a, b) => {
    const pA = toDecimal(a[0]);
    const pB = toDecimal(b[0]);
    return isBuy ? pA.comparedTo(pB) : pB.comparedTo(pA);
  });

  let totalBaseFilled = toDecimal(0);
  let totalQuote = toDecimal(0);
  let levelsConsumed = 0;

  const targetBase = requestedBaseQuantity ? toDecimal(requestedBaseQuantity) : null;
  const targetQuote = requestedQuoteNotional ? toDecimal(requestedQuoteNotional) : null;

  for (const [levelPriceStr, levelQtyStr] of sortedLevels) {
    const levelPrice = toDecimal(levelPriceStr);
    const levelQty = toDecimal(levelQtyStr);

    if (levelPrice.isZero() || levelQty.isZero()) {
      continue;
    }

    levelsConsumed += 1;

    if (targetBase) {
      const remainingBase = targetBase.minus(totalBaseFilled);
      if (remainingBase.lessThanOrEqualTo(0)) {
        break;
      }

      const fillBase = remainingBase.lessThan(levelQty) ? remainingBase : levelQty;
      const fillQuote = fillBase.times(levelPrice);

      totalBaseFilled = totalBaseFilled.plus(fillBase);
      totalQuote = totalQuote.plus(fillQuote);

      if (totalBaseFilled.greaterThanOrEqualTo(targetBase)) {
        break;
      }
    } else if (targetQuote) {
      const remainingQuote = targetQuote.minus(totalQuote);
      if (remainingQuote.lessThanOrEqualTo(0)) {
        break;
      }

      const maxLevelQuote = levelQty.times(levelPrice);
      if (remainingQuote.lessThanOrEqualTo(maxLevelQuote)) {
        const fillBase = remainingQuote.dividedBy(levelPrice);
        totalBaseFilled = totalBaseFilled.plus(fillBase);
        totalQuote = totalQuote.plus(remainingQuote);
        break;
      } else {
        totalBaseFilled = totalBaseFilled.plus(levelQty);
        totalQuote = totalQuote.plus(maxLevelQuote);
      }
    }
  }

  const sufficientDepth = targetBase
    ? totalBaseFilled.greaterThanOrEqualTo(targetBase)
    : targetQuote
    ? totalQuote.greaterThanOrEqualTo(targetQuote)
    : false;

  const vwap = totalBaseFilled.isZero()
    ? '0.00000000'
    : totalQuote.dividedBy(totalBaseFilled).toFixed(8);

  return {
    filledBaseQuantity: totalBaseFilled.toFixed(8),
    spentOrReceivedQuote: totalQuote.toFixed(8),
    vwap,
    levelsConsumed,
    sufficientDepth,
  };
}
