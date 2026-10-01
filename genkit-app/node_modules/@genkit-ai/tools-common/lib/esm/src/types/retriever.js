import { z } from 'zod';
import { DocumentDataSchema } from './document';
export const RetrieverRequestSchema = z.object({
    query: DocumentDataSchema,
    options: z.any().optional(),
});
export const RetrieverResponseSchema = z.object({
    documents: z.array(DocumentDataSchema),
});
export const CommonRetrieverOptionsSchema = z.object({
    k: z.number().describe('Number of documents to retrieve').optional(),
});
//# sourceMappingURL=retriever.js.map