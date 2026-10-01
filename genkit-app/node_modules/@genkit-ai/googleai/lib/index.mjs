import {
  embedderActionMetadata,
  embedderRef,
  modelActionMetadata
} from "genkit";
import { logger } from "genkit/logging";
import { modelRef } from "genkit/model";
import { genkitPlugin } from "genkit/plugin";
import { getApiKeyFromEnvVar } from "./common.js";
import {
  SUPPORTED_MODELS as EMBEDDER_MODELS,
  GeminiEmbeddingConfigSchema,
  defineGoogleAIEmbedder,
  geminiEmbedding001,
  textEmbedding004,
  textEmbeddingGecko001
} from "./embedder.js";
import {
  GeminiConfigSchema,
  SUPPORTED_GEMINI_MODELS,
  defineGoogleAIModel,
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
  gemini25ProPreview0325
} from "./gemini.js";
import {
  GENERIC_IMAGEN_INFO,
  ImagenConfigSchema,
  defineImagenModel
} from "./imagen.js";
import { listModels } from "./list-models.js";
import {
  GENERIC_VEO_INFO,
  VeoConfigSchema,
  defineVeoModel
} from "./veo.js";
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
    Object.keys(SUPPORTED_GEMINI_MODELS).forEach(
      (name) => defineGoogleAIModel({
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
    Object.keys(SUPPORTED_GEMINI_MODELS).forEach(
      (name) => defineGoogleAIModel({
        ai,
        name,
        apiKey: options?.apiKey,
        apiVersion: void 0,
        baseUrl: options?.baseUrl,
        debugTraces: options?.experimental_debugTraces
      })
    );
    Object.keys(EMBEDDER_MODELS).forEach(
      (name) => defineGoogleAIEmbedder(ai, name, { apiKey: options?.apiKey })
    );
  }
  if (options?.models) {
    for (const modelOrRef of options?.models) {
      const modelName = typeof modelOrRef === "string" ? modelOrRef : (
        // strip out the `googleai/` prefix
        modelOrRef.name.split("/")[1]
      );
      const modelRef2 = typeof modelOrRef === "string" ? gemini(modelOrRef) : modelOrRef;
      defineGoogleAIModel({
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
      defineVeoModel(ai, actionName, options?.apiKey);
    }
  } else if (actionType === "model") {
    resolveModel(ai, actionName, options);
  }
}
function resolveModel(ai, actionName, options) {
  if (actionName.startsWith("imagen")) {
    defineImagenModel(ai, actionName, options?.apiKey);
    return;
  }
  const modelRef2 = gemini(actionName);
  defineGoogleAIModel({
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
  defineGoogleAIEmbedder(ai, `googleai/${actionName}`, {
    apiKey: options?.apiKey
  });
}
async function listActions(options) {
  const apiKey = options?.apiKey || getApiKeyFromEnvVar();
  if (!apiKey) {
    logger.error(
      "Pass in the API key or set the GEMINI_API_KEY or GOOGLE_API_KEY environment variable."
    );
    return [];
  }
  const models = await listModels(
    options?.baseUrl || "https://generativelanguage.googleapis.com",
    apiKey
  );
  return [
    // Imagen
    ...models.filter(
      (m) => m.supportedGenerationMethods.includes("predict") && m.name.includes("imagen")
    ).filter((m) => !m.description || !m.description.includes("deprecated")).map((m) => {
      const name = m.name.split("/").at(-1);
      return modelActionMetadata({
        name: `googleai/${name}`,
        info: { ...GENERIC_IMAGEN_INFO },
        configSchema: ImagenConfigSchema
      });
    }),
    // Veo
    ...models.filter(
      (m) => m.supportedGenerationMethods.includes("predictLongRunning") && m.name.includes("veo")
    ).filter((m) => !m.description || !m.description.includes("deprecated")).map((m) => {
      const name = m.name.split("/").at(-1);
      return modelActionMetadata({
        name: `googleai/${name}`,
        info: { ...GENERIC_VEO_INFO },
        configSchema: VeoConfigSchema,
        background: true
      });
    }),
    // Models
    ...models.filter((m) => m.supportedGenerationMethods.includes("generateContent")).filter((m) => !m.description || !m.description.includes("deprecated")).map((m) => {
      const ref = gemini(
        m.name.startsWith("models/") ? m.name.substring("models/".length) : m.name
      );
      return modelActionMetadata({
        name: ref.name,
        info: ref.info,
        configSchema: GeminiConfigSchema
      });
    }),
    // Embedders
    ...models.filter((m) => m.supportedGenerationMethods.includes("embedContent")).filter((m) => !m.description || !m.description.includes("deprecated")).map((m) => {
      const name = "googleai/" + (m.name.startsWith("models/") ? m.name.substring("models/".length) : m.name);
      return embedderActionMetadata({
        name,
        configSchema: GeminiEmbeddingConfigSchema,
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
  return genkitPlugin(
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
    return modelRef({
      name: `googleai/${name}`,
      config,
      configSchema: ImagenConfigSchema
    });
  }
  if (name.startsWith("veo")) {
    return modelRef({
      name: `googleai/${name}`,
      config,
      configSchema: VeoConfigSchema
    });
  }
  return modelRef({
    name: `googleai/${name}`,
    config,
    configSchema: GeminiConfigSchema
  });
};
googleAI.embedder = (name, config) => {
  return embedderRef({
    name: `googleai/${name}`,
    config,
    configSchema: GeminiEmbeddingConfigSchema
  });
};
var index_default = googleAI;
export {
  index_default as default,
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
};
//# sourceMappingURL=index.mjs.map