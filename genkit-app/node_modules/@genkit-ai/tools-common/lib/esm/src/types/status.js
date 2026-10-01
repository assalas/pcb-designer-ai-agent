import * as z from 'zod';
export var StatusCodes;
(function (StatusCodes) {
    StatusCodes[StatusCodes["OK"] = 0] = "OK";
    StatusCodes[StatusCodes["CANCELLED"] = 1] = "CANCELLED";
    StatusCodes[StatusCodes["UNKNOWN"] = 2] = "UNKNOWN";
    StatusCodes[StatusCodes["INVALID_ARGUMENT"] = 3] = "INVALID_ARGUMENT";
    StatusCodes[StatusCodes["DEADLINE_EXCEEDED"] = 4] = "DEADLINE_EXCEEDED";
    StatusCodes[StatusCodes["NOT_FOUND"] = 5] = "NOT_FOUND";
    StatusCodes[StatusCodes["ALREADY_EXISTS"] = 6] = "ALREADY_EXISTS";
    StatusCodes[StatusCodes["PERMISSION_DENIED"] = 7] = "PERMISSION_DENIED";
    StatusCodes[StatusCodes["UNAUTHENTICATED"] = 16] = "UNAUTHENTICATED";
    StatusCodes[StatusCodes["RESOURCE_EXHAUSTED"] = 8] = "RESOURCE_EXHAUSTED";
    StatusCodes[StatusCodes["FAILED_PRECONDITION"] = 9] = "FAILED_PRECONDITION";
    StatusCodes[StatusCodes["ABORTED"] = 10] = "ABORTED";
    StatusCodes[StatusCodes["OUT_OF_RANGE"] = 11] = "OUT_OF_RANGE";
    StatusCodes[StatusCodes["UNIMPLEMENTED"] = 12] = "UNIMPLEMENTED";
    StatusCodes[StatusCodes["INTERNAL"] = 13] = "INTERNAL";
    StatusCodes[StatusCodes["UNAVAILABLE"] = 14] = "UNAVAILABLE";
    StatusCodes[StatusCodes["DATA_LOSS"] = 15] = "DATA_LOSS";
})(StatusCodes || (StatusCodes = {}));
const StatusCodesSchema = z.nativeEnum(StatusCodes);
export const StatusSchema = z.object({
    code: StatusCodesSchema,
    message: z.string(),
    details: z.any().optional(),
});
//# sourceMappingURL=status.js.map