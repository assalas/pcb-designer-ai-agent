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
var constants_exports = {};
__export(constants_exports, {
  CONTEXT_CACHE_SUPPORTED_MODELS: () => CONTEXT_CACHE_SUPPORTED_MODELS,
  DEFAULT_TTL: () => DEFAULT_TTL,
  INVALID_ARGUMENT_MESSAGES: () => INVALID_ARGUMENT_MESSAGES
});
module.exports = __toCommonJS(constants_exports);
const CONTEXT_CACHE_SUPPORTED_MODELS = [
  "gemini-1.5-flash-001",
  "gemini-1.5-pro-001"
];
const INVALID_ARGUMENT_MESSAGES = {
  modelVersion: `Model version is required for context caching, supported only in ${CONTEXT_CACHE_SUPPORTED_MODELS.join(",")} models.`,
  tools: "Context caching cannot be used simultaneously with tools.",
  codeExecution: "Context caching cannot be used simultaneously with code execution."
};
const DEFAULT_TTL = 300;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CONTEXT_CACHE_SUPPORTED_MODELS,
  DEFAULT_TTL,
  INVALID_ARGUMENT_MESSAGES
});
//# sourceMappingURL=constants.js.map