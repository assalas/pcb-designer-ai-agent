import { z } from "@genkit-ai/core";
import { toJsonSchema } from "@genkit-ai/core/schema";
const LlmStatsSchema = z.object({
  latencyMs: z.number().optional(),
  inputTokenCount: z.number().optional(),
  outputTokenCount: z.number().optional()
});
const ToolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  schema: z.any()
});
const ToolCallSchema = z.object({
  toolName: z.string(),
  arguments: z.any()
});
const LlmResponseSchema = z.object({
  completion: z.string(),
  toolCalls: z.array(ToolCallSchema).optional(),
  stats: LlmStatsSchema
});
function toToolWireFormat(actions) {
  if (!actions) return void 0;
  return actions.map((a) => {
    return {
      name: a.__action.name,
      description: a.__action.description,
      schema: {
        input: toJsonSchema({
          schema: a.__action.inputSchema,
          jsonSchema: a.__action.inputJsonSchema
        }),
        output: toJsonSchema({
          schema: a.__action.outputSchema,
          jsonSchema: a.__action.outputJsonSchema
        })
      }
    };
  });
}
export {
  LlmResponseSchema,
  LlmStatsSchema,
  ToolCallSchema,
  ToolSchema,
  toToolWireFormat
};
//# sourceMappingURL=types.mjs.map