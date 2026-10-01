"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonRetrieverOptionsSchema = exports.RetrieverResponseSchema = exports.RetrieverRequestSchema = void 0;
const zod_1 = require("zod");
const document_1 = require("./document");
exports.RetrieverRequestSchema = zod_1.z.object({
    query: document_1.DocumentDataSchema,
    options: zod_1.z.any().optional(),
});
exports.RetrieverResponseSchema = zod_1.z.object({
    documents: zod_1.z.array(document_1.DocumentDataSchema),
});
exports.CommonRetrieverOptionsSchema = zod_1.z.object({
    k: zod_1.z.number().describe('Number of documents to retrieve').optional(),
});
//# sourceMappingURL=retriever.js.map