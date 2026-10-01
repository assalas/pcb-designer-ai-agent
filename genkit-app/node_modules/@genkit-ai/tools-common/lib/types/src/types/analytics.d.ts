import * as z from 'zod';
export declare const AnalyticsInfoSchema: z.ZodUnion<[z.ZodObject<{
    enabled: z.ZodLiteral<false>;
}, "strip", z.ZodTypeAny, {
    enabled: false;
}, {
    enabled: false;
}>, z.ZodObject<{
    enabled: z.ZodLiteral<true>;
    property: z.ZodString;
    measurementId: z.ZodString;
    apiSecret: z.ZodString;
    clientId: z.ZodString;
    sessionId: z.ZodString;
    debug: z.ZodObject<{
        debugMode: z.ZodBoolean;
        validateOnly: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        debugMode: boolean;
        validateOnly: boolean;
    }, {
        debugMode: boolean;
        validateOnly: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    enabled: true;
    property: string;
    measurementId: string;
    apiSecret: string;
    clientId: string;
    sessionId: string;
    debug: {
        debugMode: boolean;
        validateOnly: boolean;
    };
}, {
    enabled: true;
    property: string;
    measurementId: string;
    apiSecret: string;
    clientId: string;
    sessionId: string;
    debug: {
        debugMode: boolean;
        validateOnly: boolean;
    };
}>]>;
export type AnalyticsInfo = z.infer<typeof AnalyticsInfoSchema>;
