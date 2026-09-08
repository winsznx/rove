import { describe, it, expect } from 'vitest';
import {
  ExecutionIntentSchema,
  validateIntentInput,
} from '../src/intent/index.js';

describe('ExecutionIntent Validation', () => {
  it('validates canonical US-01 Buy Intent', () => {
    const raw = {
      version: '1',
      objective: 'buy',
      asset: 'BNB',
      amount: {
        type: 'notional',
        value: '750',
        currency: 'USDT',
      },
      must_retain_underlying: false,
      max_observed_execution_cost_bps: '8',
      urgency: 'immediate',
    };

    const parsed = ExecutionIntentSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
  });

  it('validates canonical US-02 BNB Hedge Intent', () => {
    const raw = {
      version: '1',
      objective: 'hedge',
      asset: 'BNB',
      amount: {
        type: 'exposure_fraction',
        value: '0.7',
      },
      horizon: {
        value: 24,
        unit: 'hours',
      },
      must_retain_underlying: true,
      max_leverage: '1.5',
      urgency: 'normal',
    };

    const parsed = ExecutionIntentSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
  });

  it('rejects carry ceiling if horizon is missing', () => {
    const raw = {
      version: '1',
      objective: 'hedge',
      asset: 'BNB',
      amount: {
        type: 'exposure_fraction',
        value: '0.7',
      },
      must_retain_underlying: true,
      max_estimated_carry_bps: '15',
      urgency: 'normal',
    };

    const parsed = ExecutionIntentSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain('carry ceiling (max_estimated_carry_bps) requires a specified horizon');
    }
  });

  it('detects missing fields and generates clarification question', () => {
    const envelope = validateIntentInput(
      {
        objective: 'hedge',
        asset: 'BNB',
      },
      'Hedge my BNB.'
    );

    expect(envelope.intent).toBeNull();
    expect(envelope.missingFields).toContain('amount');
    expect(envelope.clarifyingQuestion).toContain('What portion or amount of your BNB exposure should I hedge?');
  });

  it('enforces exposure fraction bounds (0 < x <= 1)', () => {
    const invalidZero = ExecutionIntentSchema.safeParse({
      objective: 'hedge',
      asset: 'BNB',
      amount: { type: 'exposure_fraction', value: '0' },
      must_retain_underlying: true,
    });
    expect(invalidZero.success).toBe(false);

    const invalidOverOne = ExecutionIntentSchema.safeParse({
      objective: 'hedge',
      asset: 'BNB',
      amount: { type: 'exposure_fraction', value: '1.2' },
      must_retain_underlying: true,
    });
    expect(invalidOverOne.success).toBe(false);

    const validOne = ExecutionIntentSchema.safeParse({
      objective: 'hedge',
      asset: 'BNB',
      amount: { type: 'exposure_fraction', value: '1.0' },
      must_retain_underlying: true,
    });
    expect(validOne.success).toBe(true);
  });
});
