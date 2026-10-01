"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedResponseSchema = exports.EmbedRequestSchema = exports.EmbeddingSchema = void 0;
const zod_1 = require("zod");
const document_1 = require("./document");
exports.EmbeddingSchema = zod_1.z.object({
    embedding: zod_1.z.array(zod_1.z.number()),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.EmbedRequestSchema = zod_1.z.object({
    input: zod_1.z.array(document_1.DocumentDataSchema),
    options: zod_1.z.any().optional(),
});
exports.EmbedResponseSchema = zod_1.z.object({
    embeddings: zod_1.z.array(exports.EmbeddingSchema),
});
//# sourceMappingURL=embedder.js.map