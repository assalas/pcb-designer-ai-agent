"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonRerankerOptionsSchema = exports.RerankerResponseSchema = exports.RerankerRequestSchema = exports.RankedDocumentDataSchema = exports.RankedDocumentMetadataSchema = void 0;
const zod_1 = require("zod");
const document_1 = require("./document");
exports.RankedDocumentMetadataSchema = zod_1.z
    .object({
    score: zod_1.z.number(),
})
    .passthrough();
exports.RankedDocumentDataSchema = zod_1.z.object({
    content: zod_1.z.array(document_1.DocumentPartSchema),
    metadata: exports.RankedDocumentMetadataSchema,
});
exports.RerankerRequestSchema = zod_1.z.object({
    query: document_1.DocumentDataSchema,
    documents: zod_1.z.array(document_1.DocumentDataSchema),
    options: zod_1.z.any().optional(),
});
exports.RerankerResponseSchema = zod_1.z.object({
    documents: zod_1.z.array(exports.RankedDocumentDataSchema),
});
exports.CommonRerankerOptionsSchema = zod_1.z.object({
    k: zod_1.z.number().describe('Number of documents to rerank').optional(),
});
//# sourceMappingURL=reranker.js.map