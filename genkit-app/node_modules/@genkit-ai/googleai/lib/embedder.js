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
var embedder_exports = {};
__export(embedder_exports, {
  GeminiEmbeddingConfigSchema: () => GeminiEmbeddingConfigSchema,
  SUPPORTED_MODELS: () => SUPPORTED_MODELS,
  TaskTypeSchema: () => TaskTypeSchema,
  defineGoogleAIEmbedder: () => defineGoogleAIEmbedder,
  geminiEmbedding001: () => geminiEmbedding001,
  textEmbedding004: () => textEmbedding004,
  textEmbeddingGecko001: () => textEmbeddingGecko001
});
module.exports = __toCommonJS(embedder_exports);
var import_generative_ai = require("@google/generative-ai");
var import_genkit = require("genkit");
var import_embedder = require("genkit/embedder");
var import_common = require("./common.js");
const TaskTypeSchema = import_genkit.z.enum([
  "RETRIEVAL_DOCUMENT",
  "RETRIEVAL_QUERY",
  "SEMANTIC_SIMILARITY",
  "CLASSIFICATION",
  "CLUSTERING"
]);
const GeminiEmbeddingConfigSchema = import_genkit.z.object({
  /** Override the API key provided at plugin initialization. */
  apiKey: import_genkit.z.string().optional(),
  /**
   * The `task_type` parameter is defined as the intended downstream application to help the model
   * produce better quality embeddings.
   **/
  taskType: TaskTypeSchema.optional(),
  title: import_genkit.z.string().optional(),
  version: import_genkit.z.string().optional(),
  /**
   * The `outputDimensionality` parameter allows you to specify the dimensionality of the embedding output.
   * By default, the model generates embeddings with 768 dimensions. Models such as
   * `text-embedding-004`, `text-embedding-005`, and `text-multilingual-embedding-002`
   * allow the output dimensionality to be adjusted between 1 and 768.
   * By selecting a smaller output dimensionality, users can save memory and storage space, leading to more efficient computations.
   **/
  outputDimensionality: import_genkit.z.number().min(1).max(768).optional()
});
const textEmbeddingGecko001 = (0, import_embedder.embedderRef)({
  name: "googleai/embedding-001",
  configSchema: GeminiEmbeddingConfigSchema,
  info: {
    dimensions: 768,
    label: "Google Gen AI - Text Embedding Gecko (Legacy)",
    supports: {
      input: ["text"]
    }
  }
});
const textEmbedding004 = (0, import_embedder.embedderRef)({
  name: "googleai/text-embedding-004",
  configSchema: GeminiEmbeddingConfigSchema,
  info: {
    dimensions: 768,
    label: "Google Gen AI - Text Embedding 001",
    supports: {
      input: ["text"]
    }
  }
});
const geminiEmbedding001 = (0, import_embedder.embedderRef)({
  name: "googleai/gemini-embedding-001",
  configSchema: GeminiEmbeddingConfigSchema,
  info: {
    dimensions: 768,
    label: "Google Gen AI - Gemini Embedding 001",
    supports: {
      input: ["text"]
    }
  }
});
const SUPPORTED_MODELS = {
  "embedding-001": textEmbeddingGecko001,
  "text-embedding-004": textEmbedding004,
  "gemini-embedding-001": geminiEmbedding001
};
function defineGoogleAIEmbedder(ai, name, pluginOptions) {
  let apiKey;
  if (pluginOptions.apiKey !== false) {
    apiKey = pluginOptions?.apiKey || (0, import_common.getApiKeyFromEnvVar)();
    if (!apiKey)
      throw new Error(
        "Please pass in the API key or set either GEMINI_API_KEY or GOOGLE_API_KEY environment variable.\nFor more details see https://genkit.dev/docs/plugins/google-genai"
      );
  }
  const embedder = SUPPORTED_MODELS[name] ?? (0, import_embedder.embedderRef)({
    name,
    configSchema: GeminiEmbeddingConfigSchema,
    info: {
      dimensions: 768,
      label: `Google AI - ${name}`,
      supports: {
        input: ["text", "image", "video"]
      }
    }
  });
  const apiModelName = embedder.name.startsWith("googleai/") ? embedder.name.substring("googleai/".length) : embedder.name;
  return ai.defineEmbedder(
    {
      name: embedder.name,
      configSchema: GeminiEmbeddingConfigSchema,
      info: embedder.info
    },
    async (input, options) => {
      if (pluginOptions.apiKey === false && !options?.apiKey) {
        throw new import_genkit.GenkitError({
          status: "INVALID_ARGUMENT",
          message: "GoogleAI plugin was initialized with {apiKey: false} but no apiKey configuration was passed at call time."
        });
      }
      const client = new import_generative_ai.GoogleGenerativeAI(
        options?.apiKey || apiKey
      ).getGenerativeModel({
        model: options?.version || embedder.config?.version || embedder.version || apiModelName
      });
      const embeddings = await Promise.all(
        input.map(async (doc) => {
          const response = await client.embedContent({
            taskType: options?.taskType,
            title: options?.title,
            content: {
              role: "",
              parts: [{ text: doc.text }]
            },
            outputDimensionality: options?.outputDimensionality
          });
          const values = response.embedding.values;
          return { embedding: values };
        })
      );
      return { embeddings };
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GeminiEmbeddingConfigSchema,
  SUPPORTED_MODELS,
  TaskTypeSchema,
  defineGoogleAIEmbedder,
  geminiEmbedding001,
  textEmbedding004,
  textEmbeddingGecko001
});
//# sourceMappingURL=embedder.js.map