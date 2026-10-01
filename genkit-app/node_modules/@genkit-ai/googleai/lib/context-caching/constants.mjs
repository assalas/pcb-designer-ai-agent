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
export {
  CONTEXT_CACHE_SUPPORTED_MODELS,
  DEFAULT_TTL,
  INVALID_ARGUMENT_MESSAGES
};
//# sourceMappingURL=constants.mjs.map