import { z } from 'zod';
export declare const RankedDocumentMetadataSchema: z.ZodObject<{
    score: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    score: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    score: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const RankedDocumentDataSchema: z.ZodObject<{
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
    metadata: z.ZodObject<{
        score: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        score: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        score: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
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
    metadata: {
        score: number;
    } & {
        [k: string]: unknown;
    };
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
    metadata: {
        score: number;
    } & {
        [k: string]: unknown;
    };
}>;
export type RankedDocumentData = z.infer<typeof RankedDocumentDataSchema>;
export declare const RerankerRequestSchema: z.ZodObject<{
    query: z.ZodObject<{
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
    }>;
    documents: z.ZodArray<z.ZodObject<{
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
    query: {
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
    };
    documents: {
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
    query: {
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
    };
    documents: {
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
export declare const RerankerResponseSchema: z.ZodObject<{
    documents: z.ZodArray<z.ZodObject<{
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
        metadata: z.ZodObject<{
            score: z.ZodNumber;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            score: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            score: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough">>;
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
        metadata: {
            score: number;
        } & {
            [k: string]: unknown;
        };
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
        metadata: {
            score: number;
        } & {
            [k: string]: unknown;
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    documents: {
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
        metadata: {
            score: number;
        } & {
            [k: string]: unknown;
        };
    }[];
}, {
    documents: {
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
        metadata: {
            score: number;
        } & {
            [k: string]: unknown;
        };
    }[];
}>;
export type RerankerResponse = z.infer<typeof RerankerResponseSchema>;
export declare const CommonRerankerOptionsSchema: z.ZodObject<{
    k: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    k?: number | undefined;
}, {
    k?: number | undefined;
}>;
