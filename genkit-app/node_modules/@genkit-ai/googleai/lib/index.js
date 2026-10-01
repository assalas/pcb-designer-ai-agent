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
var index_exports = {};
__export(index_exports, {
  default: () => index_default,
  gemini: () => import_gemini.gemini,
  gemini10Pro: () => import_gemini.gemini10Pro,
  gemini15Flash: () => import_gemini.gemini15Flash,
  gemini15Flash8b: () => import_gemini.gemini15Flash8b,
  gemini15Pro: () => import_gemini.gemini15Pro,
  gemini20Flash: () => import_gemini.gemini20Flash,
  gemini20FlashExp: () => import_gemini.gemini20FlashExp,
  gemini20FlashLite: () => import_gemini.gemini20FlashLite,
  gemini20ProExp0205: () => import_gemini.gemini20ProExp0205,
  gemini25FlashLite: () => import_gemini.gemini25FlashLite,
  gemini25FlashPreview0417: () => import_gemini.gemini25FlashPreview0417,
  gemini25ProExp0325: () => import_gemini.gemini25ProExp0325,
  gemini25ProPreview0325: () => import_gemini.gemini25ProPreview0325,
  geminiEmbedding001: () => import_embedder.geminiEmbedding001,
  googleAI: () => googleAI,
  googleAIPlugin: () => googleAIPlugin,
  textEmbedding004: () => import_embedder.textEmbedding004,
  textEmbeddingGecko001: () => import_embedder.textEmbeddingGecko001
});
module.exports = __toCommonJS(index_exports);
var import_genkit = require("genkit");
var import_logging = require("genkit/logging");
var import_model = require("genkit/model");
var import_plugin = require("genkit/plugin");
var import_common = require("./common.js");
var import_embedder = require("./embedder.js");
var import_gemini = require("./gemini.js");
var import_imagen = require("./imagen.js");
var import_list_models = require("./list-models.js");
var import_veo = require("./veo.js");
async function initializer(ai, options) {
  let apiVersions = ["v1"];
  if (options?.apiVersion) {
    if (Array.isArray(options?.apiVersion)) {
      apiVersions = options?.apiVersion;
    } else {
      apiVersions = [options?.apiVersion];
    }
  }
  if (apiVersions.includes("v1beta")) {
    Object.keys(import_gemini.SUPPORTED_GEMINI_MODELS).forEach(
      (name) => (0, import_gemini.defineGoogleAIModel)({
        ai,
        name,
        apiKey: options?.apiKey,
        apiVersion: "v1beta",
        baseUrl: options?.baseUrl,
        debugTraces: options?.experimental_debugTraces
      })
    );
  }
  if (apiVersions.includes("v1")) {
    Object.keys(import_gemini.SUPPORTED_GEMINI_MODELS).forEach(
      (name) => (0, import_gemini.defineGoogleAIModel)({
        ai,
        name,
        apiKey: options?.apiKey,
        apiVersion: void 0,
        baseUrl: options?.baseUrl,
        debugTraces: options?.experimental_debugTraces
      })
    );
    Object.keys(import_embedder.SUPPORTED_MODELS).forEach(
      (name) => (0, import_embedder.defineGoogleAIEmbedder)(ai, name, { apiKey: options?.apiKey })
    );
  }
  if (options?.models) {
    for (const modelOrRef of options?.models) {
      const modelName = typeof modelOrRef === "string" ? modelOrRef : (
        // strip out the `googleai/` prefix
        modelOrRef.name.split("/")[1]
      );
      const modelRef2 = typeof modelOrRef === "string" ? (0, import_gemini.gemini)(modelOrRef) : modelOrRef;
      (0, import_gemini.defineGoogleAIModel)({
        ai,
        name: modelName,
        apiKey: options?.apiKey,
        baseUrl: options?.baseUrl,
        info: {
          ...modelRef2.info,
          label: `Google AI - ${modelName}`
        },
        debugTraces: options?.experimental_debugTraces
      });
    }
  }
}
async function resolver(ai, actionType, actionName, options) {
  if (actionType === "embedder") {
    resolveEmbedder(ai, actionName, options);
  } else if (actionName.startsWith("veo")) {
    if (actionType === "background-model") {
      (0, import_veo.defineVeoModel)(ai, actionName, options?.apiKey);
    }
  } else if (actionType === "model") {
    resolveModel(ai, actionName, options);
  }
}
function resolveModel(ai, actionName, options) {
  if (actionName.startsWith("imagen")) {
    (0, import_imagen.defineImagenModel)(ai, actionName, options?.apiKey);
    return;
  }
  const modelRef2 = (0, import_gemini.gemini)(actionName);
  (0, import_gemini.defineGoogleAIModel)({
    ai,
    name: modelRef2.name,
    apiKey: options?.apiKey,
    baseUrl: options?.baseUrl,
    info: {
      ...modelRef2.info,
      label: `Google AI - ${actionName}`
    },
    debugTraces: options?.experimental_debugTraces
  });
}
function resolveEmbedder(ai, actionName, options) {
  (0, import_embedder.defineGoogleAIEmbedder)(ai, `googleai/${actionName}`, {
    apiKey: options?.apiKey
  });
}
async function listActions(options) {
  const apiKey = options?.apiKey || (0, import_common.getApiKeyFromEnvVar)();
  if (!apiKey) {
    import_logging.logger.error(
      "Pass in the API key or set the GEMINI_API_KEY or GOOGLE_API_KEY environment variable."
    );
    return [];
  }
  const models = await (0, import_list_models.listModels)(
    options?.baseUrl || "https://generativelanguage.googleapis.com",
    apiKey
  );
  return [
    // Imagen
    ...models.filter(
      (m) => m.supportedGenerationMethods.includes("predict") && m.name.includes("imagen")
    ).filter((m) => !m.description || !m.description.includes("deprecated")).map((m) => {
      const name = m.name.split("/").at(-1);
      return (0, import_genkit.modelActionMetadata)({
        name: `googleai/${name}`,
        info: { ...import_imagen.GENERIC_IMAGEN_INFO },
        configSchema: import_imagen.ImagenConfigSchema
      });
    }),
    // Veo
    ...models.filter(
      (m) => m.supportedGenerationMethods.includes("predictLongRunning") && m.name.includes("veo")
    ).filter((m) => !m.description || !m.description.includes("deprecated")).map((m) => {
      const name = m.name.split("/").at(-1);
      return (0, import_genkit.modelActionMetadata)({
        name: `googleai/${name}`,
        info: { ...import_veo.GENERIC_VEO_INFO },
        configSchema: import_veo.VeoConfigSchema,
        background: true
      });
    }),
    // Models
    ...models.filter((m) => m.supportedGenerationMethods.includes("generateContent")).filter((m) => !m.description || !m.description.includes("deprecated")).map((m) => {
      const ref = (0, import_gemini.gemini)(
        m.name.startsWith("models/") ? m.name.substring("models/".length) : m.name
      );
      return (0, import_genkit.modelActionMetadata)({
        name: ref.name,
        info: ref.info,
        configSchema: import_gemini.GeminiConfigSchema
      });
    }),
    // Embedders
    ...models.filter((m) => m.supportedGenerationMethods.includes("embedContent")).filter((m) => !m.description || !m.description.includes("deprecated")).map((m) => {
      const name = "googleai/" + (m.name.startsWith("models/") ? m.name.substring("models/".length) : m.name);
      return (0, import_genkit.embedderActionMetadata)({
        name,
        configSchema: import_embedder.GeminiEmbeddingConfigSchema,
        info: {
          dimensions: 768,
          label: `Google Gen AI - ${name}`,
          supports: {
            input: ["text"]
          }
        }
      });
    })
  ];
}
function googleAIPlugin(options) {
  let listActionsCache;
  return (0, import_plugin.genkitPlugin)(
    "googleai",
    async (ai) => await initializer(ai, options),
    async (ai, actionType, actionName) => await resolver(ai, actionType, actionName, options),
    async () => {
      if (listActionsCache) return listActionsCache;
      listActionsCache = await listActions(options);
      return listActionsCache;
    }
  );
}
const googleAI = googleAIPlugin;
googleAI.model = (name, config) => {
  if (name.startsWith("imagen")) {
    return (0, import_model.modelRef)({
      name: `googleai/${name}`,
      config,
      configSchema: import_imagen.ImagenConfigSchema
    });
  }
  if (name.startsWith("veo")) {
    return (0, import_model.modelRef)({
      name: `googleai/${name}`,
      config,
      configSchema: import_veo.VeoConfigSchema
    });
  }
  return (0, import_model.modelRef)({
    name: `googleai/${name}`,
    config,
    configSchema: import_gemini.GeminiConfigSchema
  });
};
googleAI.embedder = (name, config) => {
  return (0, import_genkit.embedderRef)({
    name: `googleai/${name}`,
    config,
    configSchema: import_embedder.GeminiEmbeddingConfigSchema
  });
};
var index_default = googleAI;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  gemini,
  gemini10Pro,
  gemini15Flash,
  gemini15Flash8b,
  gemini15Pro,
  gemini20Flash,
  gemini20FlashExp,
  gemini20FlashLite,
  gemini20ProExp0205,
  gemini25FlashLite,
  gemini25FlashPreview0417,
  gemini25ProExp0325,
  gemini25ProPreview0325,
  geminiEmbedding001,
  googleAI,
  googleAIPlugin,
  textEmbedding004,
  textEmbeddingGecko001
});
//# sourceMappingURL=index.js.map