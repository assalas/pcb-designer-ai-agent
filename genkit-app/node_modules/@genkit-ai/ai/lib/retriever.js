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
var retriever_exports = {};
__export(retriever_exports, {
  CommonRetrieverOptionsSchema: () => CommonRetrieverOptionsSchema,
  Document: () => import_document2.Document,
  DocumentDataSchema: () => import_document2.DocumentDataSchema,
  IndexerInfoSchema: () => IndexerInfoSchema,
  RetrieverInfoSchema: () => RetrieverInfoSchema,
  defineIndexer: () => defineIndexer,
  defineRetriever: () => defineRetriever,
  defineSimpleRetriever: () => defineSimpleRetriever,
  index: () => index,
  indexer: () => indexer,
  indexerRef: () => indexerRef,
  retrieve: () => retrieve,
  retriever: () => retriever,
  retrieverRef: () => retrieverRef
});
module.exports = __toCommonJS(retriever_exports);
var import_core = require("@genkit-ai/core");
var import_schema = require("@genkit-ai/core/schema");
var import_document = require("./document.js");
var import_document2 = require("./document.js");
const RetrieverRequestSchema = import_core.z.object({
  query: import_document.DocumentDataSchema,
  options: import_core.z.any().optional()
});
const RetrieverResponseSchema = import_core.z.object({
  documents: import_core.z.array(import_document.DocumentDataSchema)
  // TODO: stats, etc.
});
const IndexerRequestSchema = import_core.z.object({
  documents: import_core.z.array(import_document.DocumentDataSchema),
  options: import_core.z.any().optional()
});
const RetrieverInfoSchema = import_core.z.object({
  label: import_core.z.string().optional(),
  /** Supported model capabilities. */
  supports: import_core.z.object({
    /** Model can process media as part of the prompt (multimodal input). */
    media: import_core.z.boolean().optional()
  }).optional()
});
function retrieverWithMetadata(retriever2, configSchema) {
  const withMeta = retriever2;
  withMeta.__configSchema = configSchema;
  return withMeta;
}
function indexerWithMetadata(indexer2, configSchema) {
  const withMeta = indexer2;
  withMeta.__configSchema = configSchema;
  return withMeta;
}
function defineRetriever(registry, options, runner) {
  const r = retriever(options, runner);
  registry.registerAction("retriever", r);
  return r;
}
function retriever(options, runner) {
  const retriever2 = (0, import_core.action)(
    {
      actionType: "retriever",
      name: options.name,
      inputSchema: options.configSchema ? RetrieverRequestSchema.extend({
        options: options.configSchema.optional()
      }) : RetrieverRequestSchema,
      outputSchema: RetrieverResponseSchema,
      metadata: {
        type: "retriever",
        info: options.info,
        retriever: {
          customOptions: options.configSchema ? (0, import_schema.toJsonSchema)({ schema: options.configSchema }) : void 0
        }
      }
    },
    (i) => runner(new import_document.Document(i.query), i.options)
  );
  const rwm = retrieverWithMetadata(
    retriever2,
    options.configSchema
  );
  return rwm;
}
function defineIndexer(registry, options, runner) {
  const r = indexer(options, runner);
  registry.registerAction("indexer", r);
  return r;
}
function indexer(options, runner) {
  const indexer2 = (0, import_core.action)(
    {
      actionType: "indexer",
      name: options.name,
      inputSchema: options.configSchema ? IndexerRequestSchema.extend({
        options: options.configSchema.optional()
      }) : IndexerRequestSchema,
      outputSchema: import_core.z.void(),
      metadata: {
        type: "indexer",
        embedderInfo: options.embedderInfo,
        indexer: {
          customOptions: options.configSchema ? (0, import_schema.toJsonSchema)({ schema: options.configSchema }) : void 0
        }
      }
    },
    (i) => runner(
      i.documents.map((dd) => new import_document.Document(dd)),
      i.options
    )
  );
  const iwm = indexerWithMetadata(
    indexer2,
    options.configSchema
  );
  return iwm;
}
async function retrieve(registry, params) {
  let retriever2;
  if (typeof params.retriever === "string") {
    retriever2 = await registry.lookupAction(`/retriever/${params.retriever}`);
  } else if (Object.hasOwnProperty.call(params.retriever, "info")) {
    retriever2 = await registry.lookupAction(
      `/retriever/${params.retriever.name}`
    );
  } else {
    retriever2 = params.retriever;
  }
  if (!retriever2) {
    throw new Error("Unable to resolve the retriever");
  }
  const response = await retriever2({
    query: typeof params.query === "string" ? import_document.Document.fromText(params.query) : params.query,
    options: params.options
  });
  return response.documents.map((d) => new import_document.Document(d));
}
async function index(registry, params) {
  let indexer2;
  if (typeof params.indexer === "string") {
    indexer2 = await registry.lookupAction(`/indexer/${params.indexer}`);
  } else if (Object.hasOwnProperty.call(params.indexer, "info")) {
    indexer2 = await registry.lookupAction(`/indexer/${params.indexer.name}`);
  } else {
    indexer2 = params.indexer;
  }
  if (!indexer2) {
    throw new Error("Unable to utilize the provided indexer");
  }
  return await indexer2({
    documents: params.documents,
    options: params.options
  });
}
const CommonRetrieverOptionsSchema = import_core.z.object({
  k: import_core.z.number().describe("Number of documents to retrieve").optional()
});
function retrieverRef(options) {
  return { ...options };
}
const IndexerInfoSchema = RetrieverInfoSchema;
function indexerRef(options) {
  return { ...options };
}
function itemToDocument(item, options) {
  if (!item)
    throw new import_core.GenkitError({
      status: "INVALID_ARGUMENT",
      message: `Items returned from simple retriever must be non-null.`
    });
  if (typeof item === "string") return import_document.Document.fromText(item);
  if (typeof options.content === "function") {
    const transformed = options.content(item);
    return typeof transformed === "string" ? import_document.Document.fromText(transformed) : new import_document.Document({ content: transformed });
  }
  if (typeof options.content === "string" && typeof item === "object")
    return import_document.Document.fromText(item[options.content]);
  throw new import_core.GenkitError({
    status: "INVALID_ARGUMENT",
    message: `Cannot convert item to document without content option. Item: ${JSON.stringify(item)}`
  });
}
function itemToMetadata(item, options) {
  if (typeof item === "string") return void 0;
  if (Array.isArray(options.metadata) && typeof item === "object") {
    const out = {};
    options.metadata.forEach((key) => out[key] = item[key]);
    return out;
  }
  if (typeof options.metadata === "function") return options.metadata(item);
  if (!options.metadata && typeof item === "object") {
    const out = { ...item };
    if (typeof options.content === "string") delete out[options.content];
    return out;
  }
  throw new import_core.GenkitError({
    status: "INVALID_ARGUMENT",
    message: `Unable to extract metadata from item with supplied options. Item: ${JSON.stringify(item)}`
  });
}
function defineSimpleRetriever(registry, options, handler) {
  return defineRetriever(
    registry,
    {
      name: options.name,
      configSchema: options.configSchema
    },
    async (query, config) => {
      const result = await handler(query, config);
      return {
        documents: result.map((item) => {
          const doc = itemToDocument(item, options);
          if (typeof item !== "string")
            doc.metadata = itemToMetadata(item, options);
          return doc;
        })
      };
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CommonRetrieverOptionsSchema,
  Document,
  DocumentDataSchema,
  IndexerInfoSchema,
  RetrieverInfoSchema,
  defineIndexer,
  defineRetriever,
  defineSimpleRetriever,
  index,
  indexer,
  indexerRef,
  retrieve,
  retriever,
  retrieverRef
});
//# sourceMappingURL=retriever.js.map