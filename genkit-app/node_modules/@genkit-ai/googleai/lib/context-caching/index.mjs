import {
  GoogleAICacheManager
} from "@google/generative-ai/server";
import { GenkitError } from "genkit";
import { logger } from "genkit/logging";
import {
  calculateTTL,
  generateCacheKey,
  getContentForCache,
  lookupContextCache,
  validateContextCacheRequest
} from "./utils.js";
async function handleContextCache(apiKey, request, chatRequest, modelVersion, cacheConfigDetails) {
  const cacheManager = new GoogleAICacheManager(apiKey);
  const { cachedContent, chatRequest: newChatRequest } = getContentForCache(
    request,
    chatRequest,
    modelVersion,
    cacheConfigDetails
  );
  cachedContent.model = modelVersion;
  const cacheKey = generateCacheKey(cachedContent);
  cachedContent.displayName = cacheKey;
  let cache = await lookupContextCache(cacheManager, cacheKey);
  logger.debug(`Cache hit: ${cache ? "true" : "false"}`);
  if (!cache) {
    try {
      logger.debug("No cache found, creating one.");
      const createParams = {
        ...cachedContent,
        ttlSeconds: calculateTTL(cacheConfigDetails)
      };
      cache = await cacheManager.create(createParams);
      logger.debug(`Created new cache entry with key: ${cacheKey}`);
    } catch (cacheError) {
      logger.error(
        `Failed to create cache with key ${cacheKey}: ${cacheError}`
      );
      throw new GenkitError({
        status: "INTERNAL",
        message: `Failed to create cache: ${cacheError}`
      });
    }
  }
  if (!cache) {
    throw new GenkitError({
      status: "INTERNAL",
      message: "Failed to use context cache feature"
    });
  }
  return { cache, newChatRequest };
}
async function handleCacheIfNeeded(apiKey, request, chatRequest, modelVersion, cacheConfigDetails) {
  if (!cacheConfigDetails || !validateContextCacheRequest(request, modelVersion)) {
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
export {
  handleCacheIfNeeded,
  handleContextCache
};
//# sourceMappingURL=index.mjs.map