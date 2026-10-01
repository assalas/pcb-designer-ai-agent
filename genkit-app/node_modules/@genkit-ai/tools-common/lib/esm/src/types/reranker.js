import { z } from 'zod';
import { DocumentDataSchema, DocumentPartSchema } from './document';
export const RankedDocumentMetadataSchema = z
    .object({
    score: z.number(),
})
    .passthrough();
export const RankedDocumentDataSchema = z.object({
    content: z.array(DocumentPartSchema),
    metadata: RankedDocumentMetadataSchema,
});
export const RerankerRequestSchema = z.object({
    query: DocumentDataSchema,
    documents: z.array(DocumentDataSchema),
    options: z.any().optional(),
});
export const RerankerResponseSchema = z.object({
    documents: z.array(RankedDocumentDataSchema),
});
export const CommonRerankerOptionsSchema = z.object({
    k: z.number().describe('Number of documents to rerank').optional(),
});
//# sourceMappingURL=reranker.js.map