import { z } from 'zod';
export declare const ObjectiveSchema: z.ZodEnum<["buy", "sell", "hedge", "flatten"]>;
export type Objective = z.infer<typeof ObjectiveSchema>;
export declare const UrgencySchema: z.ZodEnum<["immediate", "normal", "patient"]>;
export type Urgency = z.infer<typeof UrgencySchema>;
export declare const AmountSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"notional">;
    value: z.ZodEffects<z.ZodString, string, string>;
    currency: z.ZodEnum<["USDT", "USDC"]>;
}, "strip", z.ZodTypeAny, {
    type: "notional";
    value: string;
    currency: "USDT" | "USDC";
}, {
    type: "notional";
    value: string;
    currency: "USDT" | "USDC";
}>, z.ZodObject<{
    type: z.ZodLiteral<"asset_quantity">;
    value: z.ZodEffects<z.ZodString, string, string>;
    asset: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "asset_quantity";
    value: string;
    asset: string;
}, {
    type: "asset_quantity";
    value: string;
    asset: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"exposure_fraction">;
    value: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    type: "exposure_fraction";
    value: string;
}, {
    type: "exposure_fraction";
    value: string;
}>]>;
export type Amount = z.infer<typeof AmountSchema>;
export declare const HorizonSchema: z.ZodObject<{
    value: z.ZodNumber;
    unit: z.ZodEnum<["minutes", "hours", "days"]>;
}, "strip", z.ZodTypeAny, {
    value: number;
    unit: "minutes" | "hours" | "days";
}, {
    value: number;
    unit: "minutes" | "hours" | "days";
}>;
export type Horizon = z.infer<typeof HorizonSchema>;
export declare const ExecutionIntentSchema: z.ZodEffects<z.ZodObject<{
    version: z.ZodDefault<z.ZodLiteral<"1">>;
    objective: z.ZodEnum<["buy", "sell", "hedge", "flatten"]>;
    asset: z.ZodEffects<z.ZodString, string, string>;
    amount: z.ZodOptional<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"notional">;
        value: z.ZodEffects<z.ZodString, string, string>;
        currency: z.ZodEnum<["USDT", "USDC"]>;
    }, "strip", z.ZodTypeAny, {
        type: "notional";
        value: string;
        currency: "USDT" | "USDC";
    }, {
        type: "notional";
        value: string;
        currency: "USDT" | "USDC";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"asset_quantity">;
        value: z.ZodEffects<z.ZodString, string, string>;
        asset: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "asset_quantity";
        value: string;
        asset: string;
    }, {
        type: "asset_quantity";
        value: string;
        asset: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"exposure_fraction">;
        value: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        type: "exposure_fraction";
        value: string;
    }, {
        type: "exposure_fraction";
        value: string;
    }>]>>;
    horizon: z.ZodOptional<z.ZodObject<{
        value: z.ZodNumber;
        unit: z.ZodEnum<["minutes", "hours", "days"]>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        unit: "minutes" | "hours" | "days";
    }, {
        value: number;
        unit: "minutes" | "hours" | "days";
    }>>;
    must_retain_underlying: z.ZodDefault<z.ZodBoolean>;
    max_leverage: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    max_estimated_carry_bps: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    max_observed_execution_cost_bps: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    urgency: z.ZodDefault<z.ZodEnum<["immediate", "normal", "patient"]>>;
}, "strip", z.ZodTypeAny, {
    asset: string;
    version: "1";
    objective: "buy" | "sell" | "hedge" | "flatten";
    must_retain_underlying: boolean;
    urgency: "immediate" | "normal" | "patient";
    amount?: {
        type: "notional";
        value: string;
        currency: "USDT" | "USDC";
    } | {
        type: "asset_quantity";
        value: string;
        asset: string;
    } | {
        type: "exposure_fraction";
        value: string;
    } | undefined;
    horizon?: {
        value: number;
        unit: "minutes" | "hours" | "days";
    } | undefined;
    max_leverage?: string | undefined;
    max_estimated_carry_bps?: string | undefined;
    max_observed_execution_cost_bps?: string | undefined;
}, {
    asset: string;
    objective: "buy" | "sell" | "hedge" | "flatten";
    version?: "1" | undefined;
    amount?: {
        type: "notional";
        value: string;
        currency: "USDT" | "USDC";
    } | {
        type: "asset_quantity";
        value: string;
        asset: string;
    } | {
        type: "exposure_fraction";
        value: string;
    } | undefined;
    horizon?: {
        value: number;
        unit: "minutes" | "hours" | "days";
    } | undefined;
    must_retain_underlying?: boolean | undefined;
    max_leverage?: string | undefined;
    max_estimated_carry_bps?: string | undefined;
    max_observed_execution_cost_bps?: string | undefined;
    urgency?: "immediate" | "normal" | "patient" | undefined;
}>, {
    asset: string;
    version: "1";
    objective: "buy" | "sell" | "hedge" | "flatten";
    must_retain_underlying: boolean;
    urgency: "immediate" | "normal" | "patient";
    amount?: {
        type: "notional";
        value: string;
        currency: "USDT" | "USDC";
    } | {
        type: "asset_quantity";
        value: string;
        asset: string;
    } | {
        type: "exposure_fraction";
        value: string;
    } | undefined;
    horizon?: {
        value: number;
        unit: "minutes" | "hours" | "days";
    } | undefined;
    max_leverage?: string | undefined;
    max_estimated_carry_bps?: string | undefined;
    max_observed_execution_cost_bps?: string | undefined;
}, {
    asset: string;
    objective: "buy" | "sell" | "hedge" | "flatten";
    version?: "1" | undefined;
    amount?: {
        type: "notional";
        value: string;
        currency: "USDT" | "USDC";
    } | {
        type: "asset_quantity";
        value: string;
        asset: string;
    } | {
        type: "exposure_fraction";
        value: string;
    } | undefined;
    horizon?: {
        value: number;
        unit: "minutes" | "hours" | "days";
    } | undefined;
    must_retain_underlying?: boolean | undefined;
    max_leverage?: string | undefined;
    max_estimated_carry_bps?: string | undefined;
    max_observed_execution_cost_bps?: string | undefined;
    urgency?: "immediate" | "normal" | "patient" | undefined;
}>;
export type ExecutionIntent = z.infer<typeof ExecutionIntentSchema>;
export declare const ParsedIntentEnvelopeSchema: z.ZodObject<{
    originalText: z.ZodString;
    intent: z.ZodNullable<z.ZodEffects<z.ZodObject<{
        version: z.ZodDefault<z.ZodLiteral<"1">>;
        objective: z.ZodEnum<["buy", "sell", "hedge", "flatten"]>;
        asset: z.ZodEffects<z.ZodString, string, string>;
        amount: z.ZodOptional<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"notional">;
            value: z.ZodEffects<z.ZodString, string, string>;
            currency: z.ZodEnum<["USDT", "USDC"]>;
        }, "strip", z.ZodTypeAny, {
            type: "notional";
            value: string;
            currency: "USDT" | "USDC";
        }, {
            type: "notional";
            value: string;
            currency: "USDT" | "USDC";
        }>, z.ZodObject<{
            type: z.ZodLiteral<"asset_quantity">;
            value: z.ZodEffects<z.ZodString, string, string>;
            asset: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "asset_quantity";
            value: string;
            asset: string;
        }, {
            type: "asset_quantity";
            value: string;
            asset: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"exposure_fraction">;
            value: z.ZodEffects<z.ZodString, string, string>;
        }, "strip", z.ZodTypeAny, {
            type: "exposure_fraction";
            value: string;
        }, {
            type: "exposure_fraction";
            value: string;
        }>]>>;
        horizon: z.ZodOptional<z.ZodObject<{
            value: z.ZodNumber;
            unit: z.ZodEnum<["minutes", "hours", "days"]>;
        }, "strip", z.ZodTypeAny, {
            value: number;
            unit: "minutes" | "hours" | "days";
        }, {
            value: number;
            unit: "minutes" | "hours" | "days";
        }>>;
        must_retain_underlying: z.ZodDefault<z.ZodBoolean>;
        max_leverage: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        max_estimated_carry_bps: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        max_observed_execution_cost_bps: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        urgency: z.ZodDefault<z.ZodEnum<["immediate", "normal", "patient"]>>;
    }, "strip", z.ZodTypeAny, {
        asset: string;
        version: "1";
        objective: "buy" | "sell" | "hedge" | "flatten";
        must_retain_underlying: boolean;
        urgency: "immediate" | "normal" | "patient";
        amount?: {
            type: "notional";
            value: string;
            currency: "USDT" | "USDC";
        } | {
            type: "asset_quantity";
            value: string;
            asset: string;
        } | {
            type: "exposure_fraction";
            value: string;
        } | undefined;
        horizon?: {
            value: number;
            unit: "minutes" | "hours" | "days";
        } | undefined;
        max_leverage?: string | undefined;
        max_estimated_carry_bps?: string | undefined;
        max_observed_execution_cost_bps?: string | undefined;
    }, {
        asset: string;
        objective: "buy" | "sell" | "hedge" | "flatten";
        version?: "1" | undefined;
        amount?: {
            type: "notional";
            value: string;
            currency: "USDT" | "USDC";
        } | {
            type: "asset_quantity";
            value: string;
            asset: string;
        } | {
            type: "exposure_fraction";
            value: string;
        } | undefined;
        horizon?: {
            value: number;
            unit: "minutes" | "hours" | "days";
        } | undefined;
        must_retain_underlying?: boolean | undefined;
        max_leverage?: string | undefined;
        max_estimated_carry_bps?: string | undefined;
        max_observed_execution_cost_bps?: string | undefined;
        urgency?: "immediate" | "normal" | "patient" | undefined;
    }>, {
        asset: string;
        version: "1";
        objective: "buy" | "sell" | "hedge" | "flatten";
        must_retain_underlying: boolean;
        urgency: "immediate" | "normal" | "patient";
        amount?: {
            type: "notional";
            value: string;
            currency: "USDT" | "USDC";
        } | {
            type: "asset_quantity";
            value: string;
            asset: string;
        } | {
            type: "exposure_fraction";
            value: string;
        } | undefined;
        horizon?: {
            value: number;
            unit: "minutes" | "hours" | "days";
        } | undefined;
        max_leverage?: string | undefined;
        max_estimated_carry_bps?: string | undefined;
        max_observed_execution_cost_bps?: string | undefined;
    }, {
        asset: string;
        objective: "buy" | "sell" | "hedge" | "flatten";
        version?: "1" | undefined;
        amount?: {
            type: "notional";
            value: string;
            currency: "USDT" | "USDC";
        } | {
            type: "asset_quantity";
            value: string;
            asset: string;
        } | {
            type: "exposure_fraction";
            value: string;
        } | undefined;
        horizon?: {
            value: number;
            unit: "minutes" | "hours" | "days";
        } | undefined;
        must_retain_underlying?: boolean | undefined;
        max_leverage?: string | undefined;
        max_estimated_carry_bps?: string | undefined;
        max_observed_execution_cost_bps?: string | undefined;
        urgency?: "immediate" | "normal" | "patient" | undefined;
    }>>;
    missingFields: z.ZodArray<z.ZodString, "many">;
    clarifyingQuestion: z.ZodOptional<z.ZodString>;
    parserModel: z.ZodString;
    parsedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    originalText: string;
    intent: {
        asset: string;
        version: "1";
        objective: "buy" | "sell" | "hedge" | "flatten";
        must_retain_underlying: boolean;
        urgency: "immediate" | "normal" | "patient";
        amount?: {
            type: "notional";
            value: string;
            currency: "USDT" | "USDC";
        } | {
            type: "asset_quantity";
            value: string;
            asset: string;
        } | {
            type: "exposure_fraction";
            value: string;
        } | undefined;
        horizon?: {
            value: number;
            unit: "minutes" | "hours" | "days";
        } | undefined;
        max_leverage?: string | undefined;
        max_estimated_carry_bps?: string | undefined;
        max_observed_execution_cost_bps?: string | undefined;
    } | null;
    missingFields: string[];
    parserModel: string;
    parsedAt: string;
    clarifyingQuestion?: string | undefined;
}, {
    originalText: string;
    intent: {
        asset: string;
        objective: "buy" | "sell" | "hedge" | "flatten";
        version?: "1" | undefined;
        amount?: {
            type: "notional";
            value: string;
            currency: "USDT" | "USDC";
        } | {
            type: "asset_quantity";
            value: string;
            asset: string;
        } | {
            type: "exposure_fraction";
            value: string;
        } | undefined;
        horizon?: {
            value: number;
            unit: "minutes" | "hours" | "days";
        } | undefined;
        must_retain_underlying?: boolean | undefined;
        max_leverage?: string | undefined;
        max_estimated_carry_bps?: string | undefined;
        max_observed_execution_cost_bps?: string | undefined;
        urgency?: "immediate" | "normal" | "patient" | undefined;
    } | null;
    missingFields: string[];
    parserModel: string;
    parsedAt: string;
    clarifyingQuestion?: string | undefined;
}>;
export type ParsedIntentEnvelope = z.infer<typeof ParsedIntentEnvelopeSchema>;
/**
 * Validates a candidate ExecutionIntent or detects missing fields and generates
 * the minimum decision-changing clarifying question.
 */
export declare function validateIntentInput(rawInput: Record<string, unknown>, originalText: string, parserModel?: string): ParsedIntentEnvelope;
//# sourceMappingURL=index.d.ts.map