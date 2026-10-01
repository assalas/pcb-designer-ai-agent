import * as z from 'zod';
export declare enum StatusCodes {
    OK = 0,
    CANCELLED = 1,
    UNKNOWN = 2,
    INVALID_ARGUMENT = 3,
    DEADLINE_EXCEEDED = 4,
    NOT_FOUND = 5,
    ALREADY_EXISTS = 6,
    PERMISSION_DENIED = 7,
    UNAUTHENTICATED = 16,
    RESOURCE_EXHAUSTED = 8,
    FAILED_PRECONDITION = 9,
    ABORTED = 10,
    OUT_OF_RANGE = 11,
    UNIMPLEMENTED = 12,
    INTERNAL = 13,
    UNAVAILABLE = 14,
    DATA_LOSS = 15
}
export declare const StatusSchema: z.ZodObject<{
    code: z.ZodNativeEnum<typeof StatusCodes>;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    code: StatusCodes;
    message: string;
    details?: any;
}, {
    code: StatusCodes;
    message: string;
    details?: any;
}>;
export type Status = z.infer<typeof StatusSchema>;
