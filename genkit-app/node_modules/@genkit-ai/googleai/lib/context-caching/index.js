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
var context_caching_exports = {};
__export(context_caching_exports, {
  handleCacheIfNeeded: () => handleCacheIfNeeded,
  handleContextCache: () => handleContextCache
});
module.exports = __toCommonJS(context_caching_exports);
var import_server = require("@google/generative-ai/server");
var import_genkit = require("genkit");
var import_logging = require("genkit/logging");
var import_utils = require("./utils.js");
async function handleContextCache(apiKey, request, chatRequest, modelVersion, cacheConfigDetails) {
  const cacheManager = new import_server.GoogleAICacheManager(apiKey);
  const { cachedContent, chatRequest: newChatRequest } = (0, import_utils.getContentForCache)(
    request,
    chatRequest,
    modelVersion,
    cacheConfigDetails
  );
  cachedContent.model = modelVersion;
  const cacheKey = (0, import_utils.generateCacheKey)(cachedContent);
  cachedContent.displayName = cacheKey;
  let cache = await (0, import_utils.lookupContextCache)(cacheManager, cacheKey);
  import_logging.logger.debug(`Cache hit: ${cache ? "true" : "false"}`);
  if (!cache) {
    try {
      import_logging.logger.debug("No cache found, creating one.");
      const createParams = {
        ...cachedContent,
        ttlSeconds: (0, import_utils.calculateTTL)(cacheConfigDetails)
      };
      cache = await cacheManager.create(createParams);
      import_logging.logger.debug(`Created new cache entry with key: ${cacheKey}`);
    } catch (cacheError) {
      import_logging.logger.error(
        `Failed to create cache with key ${cacheKey}: ${cacheError}`
      );
      throw new import_genkit.GenkitError({
        status: "INTERNAL",
        message: `Failed to create cache: ${cacheError}`
      });
    }
  }
  if (!cache) {
    throw new import_genkit.GenkitError({
      status: "INTERNAL",
      message: "Failed to use context cache feature"
    });
  }
  return { cache, newChatRequest };
}
async function handleCacheIfNeeded(apiKey, request, chatRequest, modelVersion, cacheConfigDetails) {
  if (!cacheConfigDetails || !(0, import_utils.validateContextCacheRequest)(request, modelVersion)) {
    return { chatRequest, cache: null };
  }
  const { cache, newChatRequest } = await handleContextCache(
    apiKey,
    request,
    chatRequest,
    modelVersion,
    cacheConfigDetails
  );
  return { chatRequest: newChatRequest, cache };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handleCacheIfNeeded,
  handleContextCache
});
//# sourceMappingURL=index.js.map