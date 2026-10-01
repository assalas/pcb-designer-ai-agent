import { z } from 'zod';
export type EmbeddingBatch = {
    embedding: number[];
}[];
export declare const EmbeddingSchema: z.ZodObject<{
    embedding: z.ZodArray<z.ZodNumber, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    embedding: number[];
    metadata?: Record<string, unknown> | undefined;
}, {
    embedding: number[];
    metadata?: Record<string, unknown> | undefined;
}>;
export type Embedding = z.infer<typeof EmbeddingSchema>;
export declare const EmbedRequestSchema: z.ZodObject<{
    input: z.ZodArray<z.ZodObject<{
        content: z.ZodArray<z.ZodUnion<[z.ZodObject<{
            media: z.ZodOptional<z.ZodNever>;
            toolRequest: z.ZodOptional<z.ZodNever>;
            toolResponse: z.ZodOptional<z.ZodNever>;
            data: z.ZodOptional<z.ZodUnknown>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            reasoning: z.ZodOptional<z.ZodNever>;
            resource: z.ZodOptional<z.ZodNever>;
        } & {
            text: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            media?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        }, {
            text: string;
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            media?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        }>, z.ZodObject<{
            text: z.ZodOptional<z.ZodNever>;
            toolRequest: z.ZodOptional<z.ZodNever>;
            toolResponse: z.ZodOptional<z.ZodNever>;
            data: z.ZodOptional<z.ZodUnknown>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            reasoning: z.ZodOptional<z.ZodNever>;
            resource: z.ZodOptional<z.ZodNever>;
        } & {
            media: z.ZodObject<{
                contentType: z.ZodOptional<z.ZodString>;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                contentType?: string | undefined;
            }, {
                url: string;
                contentType?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            media: {
                url: string;
                contentType?: string | undefined;
            };
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            text?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        }, {
            media: {
                url: string;
                contentType?: string | undefined;
            };
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            text?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        }>]>, "many">;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        content: ({
            text: string;
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            media?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        } | {
            media: {
                url: string;
                contentType?: string | undefined;
            };
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            text?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        })[];
        metadata?: Record<string, any> | undefined;
    }, {
        content: ({
            text: string;
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            media?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        } | {
            media: {
                url: string;
                contentType?: string | undefined;
            };
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            text?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        })[];
        metadata?: Record<string, any> | undefined;
    }>, "many">;
    options: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    input: {
        content: ({
            text: string;
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            media?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        } | {
            media: {
                url: string;
                contentType?: string | undefined;
            };
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            text?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        })[];
        metadata?: Record<string, any> | undefined;
    }[];
    options?: any;
}, {
    input: {
        content: ({
            text: string;
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            media?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        } | {
            media: {
                url: string;
                contentType?: string | undefined;
            };
            custom?: Record<string, unknown> | undefined;
            metadata?: Record<string, unknown> | undefined;
            text?: undefined;
            toolRequest?: undefined;
            toolResponse?: undefined;
            data?: unknown;
            reasoning?: undefined;
            resource?: undefined;
        })[];
        metadata?: Record<string, any> | undefined;
    }[];
    options?: any;
}>;
export declare const EmbedResponseSchema: z.ZodObject<{
    embeddings: z.ZodArray<z.ZodObject<{
        embedding: z.ZodArray<z.ZodNumber, "many">;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        embedding: number[];
        metadata?: Record<string, unknown> | undefined;
    }, {
        embedding: number[];
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    embeddings: {
        embedding: number[];
        metadata?: Record<string, unknown> | undefined;
    }[];
}, {
    embeddings: {
        embedding: number[];
        metadata?: Record<string, unknown> | undefined;
    }[];
}>;
export type EmbedResponse = z.infer<typeof EmbedResponseSchema>;
