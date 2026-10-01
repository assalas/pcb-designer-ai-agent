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
var enum_exports = {};
__export(enum_exports, {
  enumFormatter: () => enumFormatter
});
module.exports = __toCommonJS(enum_exports);
var import_core = require("@genkit-ai/core");
const enumFormatter = {
  name: "enum",
  config: {
    contentType: "text/enum",
    constrained: true
  },
  handler: (schema) => {
    if (schema && schema.type !== "string" && schema.type !== "enum") {
      throw new import_core.GenkitError({
        status: "INVALID_ARGUMENT",
        message: `Must supply a 'string' or 'enum' schema type when using the enum parser format.`
      });
    }
    let instructions;
    if (schema?.enum) {
      instructions = `Output should be ONLY one of the following enum values. Do not output any additional information or add quotes.

${schema.enum.map((v) => v.toString()).join("\n")}`;
    }
    return {
      parseMessage: (message) => {
        return message.text.replace(/['"]/g, "").trim();
      },
      instructions
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  enumFormatter
});
//# sourceMappingURL=enum.js.map