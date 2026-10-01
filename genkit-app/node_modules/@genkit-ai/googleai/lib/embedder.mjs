import {
  GoogleGenerativeAI
} from "@google/generative-ai";
import {
  GenkitError,
  z
} from "genkit";
import { embedderRef } from "genkit/embedder";
import { getApiKeyFromEnvVar } from "./common.js";
const TaskTypeSchema = z.enum([
  "RETRIEVAL_DOCUMENT",
  "RETRIEVAL_QUERY",
  "SEMANTIC_SIMILARITY",
  "CLASSIFICATION",
  "CLUSTERING"
]);
const GeminiEmbeddingConfigSchema = z.object({
  /** Override the API key provided at plugin initialization. */
  apiKey: z.string().optional(),
  /**
   * The `task_type` parameter is defined as the intended downstream application to help the model
   * produce better quality embeddings.
   **/
  taskType: TaskTypeSchema.optional(),
  title: z.string().optional(),
  version: z.string().optional(),
  /**
   * The `outputDimensionality` parameter allows you to specify the dimensionality of the embedding output.
   * By default, the model generates embeddings with 768 dimensions. Models such as
   * `text-embedding-004`, `text-embedding-005`, and `text-multilingual-embedding-002`
   * allow the output dimensionality to be adjusted between 1 and 768.
   * By selecting a smaller output dimensionality, users can save memory and storage space, leading to more efficient computations.
   **/
  outputDimensionality: z.number().min(1).max(768).optional()
});
const textEmbeddingGecko001 = embedderRef({
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
const textEmbedding004 = embedderRef({
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
const geminiEmbedding001 = embedderRef({
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
    apiKey = pluginOptions?.apiKey || getApiKeyFromEnvVar();
    if (!apiKey)
      throw new Error(
        "Please pass in the API key or set either GEMINI_API_KEY or GOOGLE_API_KEY environment variable.\nFor more details see https://genkit.dev/docs/plugins/google-genai"
      );
  }
  const embedder = SUPPORTED_MODELS[name] ?? embedderRef({
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
        throw new GenkitError({
          status: "INVALID_ARGUMENT",
          message: "GoogleAI plugin was initialized with {apiKey: false} but no apiKey configuration was passed at call time."
        });
      }
      const client = new GoogleGenerativeAI(
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
export {
  GeminiEmbeddingConfigSchema,
  SUPPORTED_MODELS,
  TaskTypeSchema,
  defineGoogleAIEmbedder,
  geminiEmbedding001,
  textEmbedding004,
  textEmbeddingGecko001
};
//# sourceMappingURL=embedder.mjs.map