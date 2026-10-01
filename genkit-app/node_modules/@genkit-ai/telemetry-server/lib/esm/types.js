import { TraceQueryFilterSchema, } from '@genkit-ai/tools-common';
import * as z from 'zod';
export const TraceQuerySchema = z.object({
    limit: z.coerce.number().optional(),
    continuationToken: z.string().optional(),
    filter: TraceQueryFilterSchema.optional(),
});
//# sourceMappingURL=types.js.map