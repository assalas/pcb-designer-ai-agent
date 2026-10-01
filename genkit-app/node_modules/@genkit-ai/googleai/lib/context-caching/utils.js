"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var utils_exports = {};
__export(utils_exports, {
  calculateTTL: () => calculateTTL,
  extractCacheConfig: () => extractCacheConfig,
  findLastIndex: () => findLastIndex,
  generateCacheKey: () => generateCacheKey,
  getContentForCache: () => getContentForCache,
  lookupContextCache: () => lookupContextCache,
  validateContextCacheRequest: () => validateContextCacheRequest
});
module.exports = __toCommonJS(utils_exports);
var import_crypto = __toESM(require("crypto"));
var import_genkit = require("genkit");
var import_constants = require("./constants");
var import_types = require("./types");
function generateCacheKey(request) {
  return import_crypto.default.createHash("sha256").update(JSON.stringify(request)).digest("hex");
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
    throw new import_genkit.GenkitError({
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
    throw new import_genkit.GenkitError({
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
    cacheConfig: import_types.cacheConfigSchema.parse(
      request.messages[endOfCachedContents].metadata?.cache
    )
  };
};
function validateContextCacheRequest(request, modelVersion) {
  if (!modelVersion || !import_constants.CONTEXT_CACHE_SUPPORTED_MODELS.includes(modelVersion)) {
    throw new import_genkit.GenkitError({
      status: "INVALID_ARGUMENT",
      message: import_constants.INVALID_ARGUMENT_MESSAGES.modelVersion
    });
  }
  if (request.tools?.length)
    throw new import_genkit.GenkitError({
      status: "INVALID_ARGUMENT",
      message: import_constants.INVALID_ARGUMENT_MESSAGES.tools
    });
  if (request.config?.codeExecution)
    throw new import_genkit.GenkitError({
      status: "INVALID_ARGUMENT",
      message: import_constants.INVALID_ARGUMENT_MESSAGES.codeExecution
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
    return import_constants.DEFAULT_TTL;
  }
  if (cacheConfig.cacheConfig === false) {
    return 0;
  }
  return cacheConfig.cacheConfig.ttlSeconds || import_constants.DEFAULT_TTL;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  calculateTTL,
  extractCacheConfig,
  findLastIndex,
  generateCacheKey,
  getContentForCache,
  lookupContextCache,
  validateContextCacheRequest
});
//# sourceMappingURL=utils.js.map