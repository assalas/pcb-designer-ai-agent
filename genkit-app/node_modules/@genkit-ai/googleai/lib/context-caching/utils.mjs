import crypto from "crypto";
import { GenkitError } from "genkit";
import {
  CONTEXT_CACHE_SUPPORTED_MODELS,
  DEFAULT_TTL,
  INVALID_ARGUMENT_MESSAGES
} from "./constants";
import {
  cacheConfigSchema
} from "./types";
function generateCacheKey(request) {
  return crypto.createHash("sha256").update(JSON.stringify(request)).digest("hex");
}
function getContentForCache(request, chatRequest, modelVersion, cacheConfigDetails) {
  if (!modelVersion) {
    throw new Error("No model version provided for context caching");
  }
  if (!chatRequest.history?.length) {
    throw new Error("No history provided for context caching");
  }
  validateHistoryLength(request, chatRequest);
  const { endOfCachedContents, cacheConfig } = cacheConfigDetails;
  const cachedContent = {
    model: modelVersion,
    contents: chatRequest.history.slice(0, endOfCachedContents + 1)
  };
  chatRequest.history = chatRequest.history.slice(endOfCachedContents + 1);
  return { cachedContent, chatRequest, cacheConfig };
}
function validateHistoryLength(request, chatRequest) {
  if (chatRequest.history?.length !== request.messages.length - 1) {
    throw new GenkitError({
      status: "INTERNAL",
      message: "Genkit request history and Gemini chat request history length do not match"
    });
  }
}
async function lookupContextCache(cacheManager, cacheKey, maxPages = 100, pageSize = 100) {
  let currentPage = 0;
  let pageToken;
  try {
    while (currentPage < maxPages) {
      const { cachedContents, nextPageToken } = await cacheManager.list({
        pageSize,
        pageToken
      });
      const found = cachedContents?.find(
        (content) => content.displayName === cacheKey
      );
      if (found) return found;
      if (!nextPageToken) break;
      pageToken = nextPageToken;
      currentPage++;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Network Error";
    throw new GenkitError({
      status: "INTERNAL",
      message: `Error looking up context cache: ${message}`
    });
  }
  return null;
}
const extractCacheConfig = (request) => {
  const endOfCachedContents = findLastIndex(
    request.messages,
    (message) => !!message.metadata?.cache
  );
  return endOfCachedContents === -1 ? null : {
    endOfCachedContents,
    cacheConfig: cacheConfigSchema.parse(
      request.messages[endOfCachedContents].metadata?.cache
    )
  };
};
function validateContextCacheRequest(request, modelVersion) {
  if (!modelVersion || !CONTEXT_CACHE_SUPPORTED_MODELS.includes(modelVersion)) {
    throw new GenkitError({
      status: "INVALID_ARGUMENT",
      message: INVALID_ARGUMENT_MESSAGES.modelVersion
    });
  }
  if (request.tools?.length)
    throw new GenkitError({
      status: "INVALID_ARGUMENT",
      message: INVALID_ARGUMENT_MESSAGES.tools
    });
  if (request.config?.codeExecution)
    throw new GenkitError({
      status: "INVALID_ARGUMENT",
      message: INVALID_ARGUMENT_MESSAGES.codeExecution
    });
  return true;
}
function findLastIndex(array, callback) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (callback(array[i], i, array)) return i;
  }
  return -1;
}
function calculateTTL(cacheConfig) {
  if (cacheConfig.cacheConfig === true) {
    return DEFAULT_TTL;
  }
  if (cacheConfig.cacheConfig === false) {
    return 0;
  }
  return cacheConfig.cacheConfig.ttlSeconds || DEFAULT_TTL;
}
export {
  calculateTTL,
  extractCacheConfig,
  findLastIndex,
  generateCacheKey,
  getContentForCache,
  lookupContextCache,
  validateContextCacheRequest
};
//# sourceMappingURL=utils.mjs.map