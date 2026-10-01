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
var firestore_retriever_exports = {};
__export(firestore_retriever_exports, {
  defineFirestoreRetriever: () => defineFirestoreRetriever
});
module.exports = __toCommonJS(firestore_retriever_exports);
var import_genkit = require("genkit");
function toContent(d, contentField) {
  if (typeof contentField === "function") {
    return contentField(d);
  }
  return [{ text: d.get(contentField) }];
}
function toDocuments(result, vectorField, contentField, metadataFields) {
  return result.docs.map((d) => {
    const out = { content: toContent(d, contentField) };
    if (typeof metadataFields === "function") {
      out.metadata = metadataFields(d);
      return out;
    }
    out.metadata = { id: d.id };
    if (metadataFields) {
      for (const field of metadataFields) {
        out.metadata[field] = d.get(field);
      }
      return out;
    }
    out.metadata = d.data();
    delete out.metadata[vectorField];
    if (typeof contentField === "string") delete out.metadata[contentField];
    return out;
  });
}
function defineFirestoreRetriever(ai, config) {
  const {
    name,
    label,
    firestore,
    embedder,
    collection,
    vectorField,
    metadataFields,
    contentField,
    distanceMeasure,
    distanceThreshold,
    distanceResultField
  } = config;
  return ai.defineRetriever(
    {
      name,
      info: {
        label: label || `Firestore - ${name}`
      },
      configSchema: import_genkit.z.object({
        where: import_genkit.z.record(import_genkit.z.any()).optional(),
        /** Max number of results to return. Defaults to 10. */
        limit: import_genkit.z.number().optional(),
        /* Supply or override the distanceMeasure */
        distanceMeasure: import_genkit.z.enum(["COSINE", "DOT_PRODUCT", "EUCLIDEAN"]).optional(),
        /* Supply or override the distanceThreshold */
        distanceThreshold: import_genkit.z.number().optional(),
        /* Supply or override the metadata field where distances are stored. */
        distanceResultField: import_genkit.z.string().optional(),
        /* Supply or override the collection for retrieval. */
        collection: import_genkit.z.string().optional()
      })
    },
    async (content, options) => {
      options = options || {};
      if (!options.collection && !collection) {
        throw new Error(
          "Must specify a collection to query in Firestore retriever."
        );
      }
      let query = firestore.collection(
        options.collection || collection
      );
      for (const field in options.where || {}) {
        query = query.where(field, "==", options.where[field]);
      }
      const queryVector = (await ai.embed({ embedder, content }))[0].embedding;
      const result = await query.findNearest({
        vectorField,
        queryVector,
        limit: options.limit || 10,
        distanceMeasure: options.distanceMeasure || distanceMeasure || "COSINE",
        distanceResultField: options.distanceResultField || distanceResultField,
        distanceThreshold: options.distanceThreshold || distanceThreshold
      }).get();
      return {
        documents: toDocuments(
          result,
          vectorField,
          contentField,
          metadataFields
        )
      };
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  defineFirestoreRetriever
});
//# sourceMappingURL=firestore-retriever.js.map