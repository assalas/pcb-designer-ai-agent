"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusSchema = exports.StatusCodes = void 0;
const z = __importStar(require("zod"));
var StatusCodes;
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
})(StatusCodes || (exports.StatusCodes = StatusCodes = {}));
const StatusCodesSchema = z.nativeEnum(StatusCodes);
exports.StatusSchema = z.object({
    code: StatusCodesSchema,
    message: z.string(),
    details: z.any().optional(),
});
//# sourceMappingURL=status.js.map