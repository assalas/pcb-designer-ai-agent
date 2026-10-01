"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var types_exports = {};
__export(types_exports, {
  LlmResponseSchema: () => LlmResponseSchema,
  LlmStatsSchema: () => LlmStatsSchema,
  ToolCallSchema: () => ToolCallSchema,
  ToolSchema: () => ToolSchema,
  toToolWireFormat: () => toToolWireFormat
});
module.exports = __toCommonJS(types_exports);
var import_core = require("@genkit-ai/core");
var import_schema = require("@genkit-ai/core/schema");
const LlmStatsSchema = import_core.z.object({
  latencyMs: import_core.z.number().optional(),
  inputTokenCount: import_core.z.number().optional(),
  outputTokenCount: import_core.z.number().optional()
});
const ToolSchema = import_core.z.object({
  name: import_core.z.string(),
  description: import_core.z.string().optional(),
  schema: import_core.z.any()
});
const ToolCallSchema = import_core.z.object({
  toolName: import_core.z.string(),
  arguments: import_core.z.any()
});
const LlmResponseSchema = import_core.z.object({
  completion: import_core.z.string(),
  toolCalls: import_core.z.array(ToolCallSchema).optional(),
  stats: LlmStatsSchema
});
function toToolWireFormat(actions) {
  if (!actions) return void 0;
  return actions.map((a) => {
    return {
      name: a.__action.name,
      description: a.__action.description,
      schema: {
        input: (0, import_schema.toJsonSchema)({
          schema: a.__action.inputSchema,
          jsonSchema: a.__action.inputJsonSchema
        }),
        output: (0, import_schema.toJsonSchema)({
          schema: a.__action.outputSchema,
          jsonSchema: a.__action.outputJsonSchema
        })
      }
    };
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LlmResponseSchema,
  LlmStatsSchema,
  ToolCallSchema,
  ToolSchema,
  toToolWireFormat
});
//# sourceMappingURL=types.js.map