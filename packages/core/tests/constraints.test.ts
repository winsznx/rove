import { describe, it, expect } from 'vitest';
import { evaluateRouteConstraints } from '../src/constraints/index.js';
import { ExecutionIntent } from '../src/intent/index.js';

describe('Constraint Engine & Rejection Codes', () => {
  const baseIntent: ExecutionIntent = {
    version: '1',
    objective: 'hedge',
    asset: 'BNB',
    amount: { type: 'exposure_fraction', value: '0.7' },
    horizon: { value: 24, unit: 'hours' },
    must_retain_underlying: true,
    max_leverage: '1.5',
    max_estimated_carry_bps: '10.0',
    max_observed_execution_cost_bps: '15.0',
    urgency: 'normal',
  };

  it('rejects route with RETAIN_UNDERLYING_CONFLICT if route sells the protected asset', () => {
    const res = evaluateRouteConstraints(baseIntent, {
      kind: 'spot',
      side: 'sell',
      disposesUnderlying: true, // Selling BNB
      hasPermission: true,
      isProductAvailable: true,
      currentTimeMs: 1000,
    });

    expect(res.isValid).toBe(false);
    expect(res.rejection?.code).toBe('RETAIN_UNDERLYING_CONFLICT');
    expect(res.rejection?.message).toContain('requires selling the BNB you explicitly asked to retain');
  });

  it('rejects route with LEVERAGE_LIMIT if required leverage exceeds cap', () => {
    const res = evaluateRouteConstraints(baseIntent, {
      kind: 'usd_m_perp',
      side: 'sell',
      disposesUnderlying: false,
      requiredLeverage: '2.0', // Exceeds 1.5x cap
      hasPermission: true,
      isProductAvailable: true,
      currentTimeMs: 1000,
    });

    expect(res.isValid).toBe(false);
    expect(res.rejection?.code).toBe('LEVERAGE_LIMIT');
    expect(res.rejection?.message).toContain('exceeds your limit of 1.5x');
  });

  it('rejects route with CARRY_LIMIT if carry exceeds ceiling', () => {
    const res = evaluateRouteConstraints(baseIntent, {
      kind: 'usd_m_perp',
      side: 'sell',
      disposesUnderlying: false,
      requiredLeverage: '1.0',
      hasPermission: true,
      isProductAvailable: true,
      carry: {
        estimatedCarryBps: '12.50', // Exceeds 10.0 bps limit
        assumption: '...',
        components: [],
        status: 'COMPLETE',
      },
      currentTimeMs: 1000,
    });

    expect(res.isValid).toBe(false);
    expect(res.rejection?.code).toBe('CARRY_LIMIT');
  });

  it('rejects route with QUOTE_EXPIRED if quote has lapsed', () => {
    const res = evaluateRouteConstraints(baseIntent, {
      kind: 'convert',
      side: 'sell',
      disposesUnderlying: false,
      hasPermission: true,
      isProductAvailable: true,
      validUntilTimestamp: 1000,
      currentTimeMs: 1001, // Lapsed by 1ms
    });

    expect(res.isValid).toBe(false);
    expect(res.rejection?.code).toBe('QUOTE_EXPIRED');
  });

  it('rejects route with PERMISSION_MISSING if trading scope is disabled', () => {
    const res = evaluateRouteConstraints(baseIntent, {
      kind: 'usd_m_perp',
      side: 'sell',
      disposesUnderlying: false,
      hasPermission: false, // Permission missing
      isProductAvailable: true,
      currentTimeMs: 1000,
    });

    expect(res.isValid).toBe(false);
    expect(res.rejection?.code).toBe('PERMISSION_MISSING');
  });

  it('passes all constraints when parameters adhere to user intent', () => {
    const res = evaluateRouteConstraints(baseIntent, {
      kind: 'usd_m_perp',
      side: 'sell',
      disposesUnderlying: false,
      requiredLeverage: '1.0',
      hasPermission: true,
      isProductAvailable: true,
      execution: {
        observedExecutionCostBps: '5.00', // <= 15.00 bps
        components: [],
        status: 'COMPLETE',
      },
      carry: {
        estimatedCarryBps: '4.50', // <= 10.00 bps
        assumption: '...',
        components: [],
        status: 'COMPLETE',
      },
      currentTimeMs: 1000,
    });

    expect(res.isValid).toBe(true);
    expect(res.rejection).toBeUndefined();
  });
});
