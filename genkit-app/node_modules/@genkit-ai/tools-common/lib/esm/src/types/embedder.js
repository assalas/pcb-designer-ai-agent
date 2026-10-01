import { z } from 'zod';
import { DocumentDataSchema } from './document';
export const EmbeddingSchema = z.object({
    embedding: z.array(z.number()),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const EmbedRequestSchema = z.object({
    input: z.array(DocumentDataSchema),
    options: z.any().optional(),
});
export const EmbedResponseSchema = z.object({
    embeddings: z.array(EmbeddingSchema),
});
//# sourceMappingURL=embedder.js.map