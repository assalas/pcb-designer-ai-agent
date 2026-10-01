import {
  z
} from "genkit";
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
      configSchema: z.object({
        where: z.record(z.any()).optional(),
        /** Max number of results to return. Defaults to 10. */
        limit: z.number().optional(),
        /* Supply or override the distanceMeasure */
        distanceMeasure: z.enum(["COSINE", "DOT_PRODUCT", "EUCLIDEAN"]).optional(),
        /* Supply or override the distanceThreshold */
        distanceThreshold: z.number().optional(),
        /* Supply or override the metadata field where distances are stored. */
        distanceResultField: z.string().optional(),
        /* Supply or override the collection for retrieval. */
        collection: z.string().optional()
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
export {
  defineFirestoreRetriever
};
//# sourceMappingURL=firestore-retriever.mjs.map