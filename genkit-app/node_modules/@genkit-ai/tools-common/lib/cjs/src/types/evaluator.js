"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvalResponseSchema = exports.EvalFnResponseSchema = exports.EvalRequestSchema = exports.ScoreSchema = exports.EvalStatusEnumSchema = exports.BaseEvalDataPointSchema = exports.BaseDataPointSchema = void 0;
const zod_1 = require("zod");
exports.BaseDataPointSchema = zod_1.z.object({
    input: zod_1.z.unknown(),
    output: zod_1.z.unknown().optional(),
    context: zod_1.z.array(zod_1.z.unknown()).optional(),
    reference: zod_1.z.unknown().optional(),
    testCaseId: zod_1.z.string().optional(),
    traceIds: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.BaseEvalDataPointSchema = exports.BaseDataPointSchema.extend({
    testCaseId: zod_1.z.string(),
});
exports.EvalStatusEnumSchema = zod_1.z.enum(['UNKNOWN', 'PASS', 'FAIL']);
exports.ScoreSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .describe('Optional ID to differentiate different scores')
        .optional(),
    score: zod_1.z.union([zod_1.z.number(), zod_1.z.string(), zod_1.z.boolean()]).optional(),
    status: exports.EvalStatusEnumSchema.optional(),
    error: zod_1.z.string().optional(),
    details: zod_1.z
        .object({
        reasoning: zod_1.z.string().optional(),
    })
        .passthrough()
        .optional(),
});
exports.EvalRequestSchema = zod_1.z.object({
    dataset: zod_1.z.array(exports.BaseDataPointSchema),
    evalRunId: zod_1.z.string(),
    options: zod_1.z.unknown(),
});
exports.EvalFnResponseSchema = zod_1.z.object({
    sampleIndex: zod_1.z.number().optional(),
    testCaseId: zod_1.z.string(),
    traceId: zod_1.z.string().optional(),
    spanId: zod_1.z.string().optional(),
    evaluation: zod_1.z.union([exports.ScoreSchema, zod_1.z.array(exports.ScoreSchema)]),
});
exports.EvalResponseSchema = zod_1.z.array(exports.EvalFnResponseSchema);
//# sourceMappingURL=evaluator.js.map