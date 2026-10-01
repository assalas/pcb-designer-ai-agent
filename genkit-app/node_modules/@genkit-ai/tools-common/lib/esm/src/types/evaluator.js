import { z } from 'zod';
export const BaseDataPointSchema = z.object({
    input: z.unknown(),
    output: z.unknown().optional(),
    context: z.array(z.unknown()).optional(),
    reference: z.unknown().optional(),
    testCaseId: z.string().optional(),
    traceIds: z.array(z.string()).optional(),
});
export const BaseEvalDataPointSchema = BaseDataPointSchema.extend({
    testCaseId: z.string(),
});
export const EvalStatusEnumSchema = z.enum(['UNKNOWN', 'PASS', 'FAIL']);
export const ScoreSchema = z.object({
    id: z
        .string()
        .describe('Optional ID to differentiate different scores')
        .optional(),
    score: z.union([z.number(), z.string(), z.boolean()]).optional(),
    status: EvalStatusEnumSchema.optional(),
    error: z.string().optional(),
    details: z
        .object({
        reasoning: z.string().optional(),
    })
        .passthrough()
        .optional(),
});
export const EvalRequestSchema = z.object({
    dataset: z.array(BaseDataPointSchema),
    evalRunId: z.string(),
    options: z.unknown(),
});
export const EvalFnResponseSchema = z.object({
    sampleIndex: z.number().optional(),
    testCaseId: z.string(),
    traceId: z.string().optional(),
    spanId: z.string().optional(),
    evaluation: z.union([ScoreSchema, z.array(ScoreSchema)]),
});
export const EvalResponseSchema = z.array(EvalFnResponseSchema);
//# sourceMappingURL=evaluator.js.map