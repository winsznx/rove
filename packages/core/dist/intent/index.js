import { z } from 'zod';
import { toDecimal } from '../decimal/index.js';
export const ObjectiveSchema = z.enum(['buy', 'sell', 'hedge', 'flatten']);
export const UrgencySchema = z.enum(['immediate', 'normal', 'patient']);
export const AmountSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('notional'),
        value: z.string().refine((val) => {
            try {
                return toDecimal(val).greaterThan(0);
            }
            catch {
                return false;
            }
        }, 'Notional value must be a positive number'),
        currency: z.enum(['USDT', 'USDC']),
    }),
    z.object({
        type: z.literal('asset_quantity'),
        value: z.string().refine((val) => {
            try {
                return toDecimal(val).greaterThan(0);
            }
            catch {
                return false;
            }
        }, 'Asset quantity value must be a positive number'),
        asset: z.string().min(1).toUpperCase(),
    }),
    z.object({
        type: z.literal('exposure_fraction'),
        value: z.string().refine((val) => {
            try {
                const d = toDecimal(val);
                return d.greaterThan(0) && d.lessThanOrEqualTo(1);
            }
            catch {
                return false;
            }
        }, 'Exposure fraction must be between 0 and 1 (exclusive of 0, inclusive of 1)'),
    }),
]);
export const HorizonSchema = z.object({
    value: z.number().int().positive('Horizon value must be a positive integer'),
    unit: z.enum(['minutes', 'hours', 'days']),
});
export const ExecutionIntentSchema = z
    .object({
    version: z.literal('1').default('1'),
    objective: ObjectiveSchema,
    asset: z
        .string()
        .min(1)
        .transform((val) => val.trim().toUpperCase()),
    amount: AmountSchema.optional(),
    horizon: HorizonSchema.optional(),
    must_retain_underlying: z.boolean().default(false),
    max_leverage: z
        .string()
        .refine((val) => {
        try {
            return toDecimal(val).greaterThan(0);
        }
        catch {
            return false;
        }
    }, 'Max leverage must be positive')
        .optional(),
    max_estimated_carry_bps: z
        .string()
        .refine((val) => {
        try {
            return toDecimal(val).greaterThanOrEqualTo(0);
        }
        catch {
            return false;
        }
    }, 'Max estimated carry must be non-negative')
        .optional(),
    max_observed_execution_cost_bps: z
        .string()
        .refine((val) => {
        try {
            return toDecimal(val).greaterThanOrEqualTo(0);
        }
        catch {
            return false;
        }
    }, 'Max observed execution cost must be non-negative')
        .optional(),
    urgency: UrgencySchema.default('normal'),
})
    .superRefine((data, ctx) => {
    // Validation rule: carry ceiling requires a horizon
    if (data.max_estimated_carry_bps !== undefined && !data.horizon) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['horizon'],
            message: 'A carry ceiling (max_estimated_carry_bps) requires a specified horizon',
        });
    }
    // Validation rule: buy and sell require amount to be specified
    if ((data.objective === 'buy' || data.objective === 'sell') && !data.amount) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['amount'],
            message: `Amount is required for ${data.objective} objective`,
        });
    }
    // Validation rule: hedge requires amount or exposure fraction
    if (data.objective === 'hedge' && !data.amount) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['amount'],
            message: 'Amount or exposure fraction is required for hedge objective',
        });
    }
});
export const ParsedIntentEnvelopeSchema = z.object({
    originalText: z.string(),
    intent: ExecutionIntentSchema.nullable(),
    missingFields: z.array(z.string()),
    clarifyingQuestion: z.string().optional(),
    parserModel: z.string(),
    parsedAt: z.string(),
});
/**
 * Validates a candidate ExecutionIntent or detects missing fields and generates
 * the minimum decision-changing clarifying question.
 */
export function validateIntentInput(rawInput, originalText, parserModel = 'antigravity') {
    const parsedAt = new Date().toISOString();
    const missingFields = [];
    const objective = rawInput.objective;
    const asset = rawInput.asset;
    if (!objective) {
        missingFields.push('objective');
    }
    if (!asset) {
        missingFields.push('asset');
    }
    // Objective specific requirements
    if (objective === 'buy' || objective === 'sell') {
        if (!rawInput.amount) {
            missingFields.push('amount');
        }
    }
    else if (objective === 'hedge') {
        if (!rawInput.amount) {
            missingFields.push('amount');
        }
        if (!rawInput.horizon) {
            missingFields.push('horizon');
        }
    }
    let clarifyingQuestion;
    if (missingFields.includes('amount') && objective === 'hedge') {
        clarifyingQuestion = `What portion or amount of your ${asset || 'token'} exposure should I hedge?`;
    }
    else if (missingFields.includes('horizon') && objective === 'hedge') {
        clarifyingQuestion = `What is the expected hedge horizon (e.g. 24 hours, 7 days)?`;
    }
    else if (missingFields.includes('amount')) {
        clarifyingQuestion = `How much ${asset || 'asset'} would you like to ${objective || 'trade'}?`;
    }
    else if (missingFields.includes('asset')) {
        clarifyingQuestion = `Which token or asset do you want to ${objective || 'trade'}?`;
    }
    const result = ExecutionIntentSchema.safeParse(rawInput);
    if (result.success) {
        return {
            originalText,
            intent: result.data,
            missingFields: [],
            parserModel,
            parsedAt,
        };
    }
    // Collect specific issue fields from zod
    const zodMissing = result.error.issues.map((i) => i.path.join('.'));
    const combinedMissing = Array.from(new Set([...missingFields, ...zodMissing]));
    return {
        originalText,
        intent: null,
        missingFields: combinedMissing,
        clarifyingQuestion: clarifyingQuestion || result.error.issues[0]?.message,
        parserModel,
        parsedAt,
    };
}
//# sourceMappingURL=index.js.map