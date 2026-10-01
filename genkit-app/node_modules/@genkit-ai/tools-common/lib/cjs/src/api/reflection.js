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
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
const z = __importStar(require("zod"));
const action = __importStar(require("../types/action"));
const apis = __importStar(require("../types/apis"));
const trace_1 = require("../types/trace");
const registry = new zod_to_openapi_1.OpenAPIRegistry();
registry.register('CustomAny', action.CustomAnySchema.openapi('CustomAny'));
registry.register('JSONSchema7', action.JSONSchema7Schema.openapi('JSONSchema7'));
registry.register('Action', action.ActionSchema.openapi('Action'));
registry.register('TraceData', trace_1.TraceDataSchema.openapi('TraceData'));
registry.register('SpanData', trace_1.SpanDataSchema.openapi('SpanData'));
registry.registerPath({
    method: 'get',
    path: '/api/actions',
    summary: 'Retrieves all runnable actions.',
    responses: {
        '200': {
            description: 'Success',
            content: {
                'application/json': {
                    schema: z.record(z.string(), action.ActionSchema),
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/runAction',
    summary: 'Runs an action and returns the result.',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: apis.RunActionRequestSchema,
                },
            },
        },
    },
    responses: {
        '200': {
            description: 'Success',
            content: {
                'application/json': {
                    schema: action.RunActionResponseSchema,
                },
            },
        },
    },
});
const generator = new zod_to_openapi_1.OpenApiGeneratorV3(registry.definitions);
const document = generator.generateDocument({
    openapi: '3.0.0',
    info: {
        version: '0.0.1',
        title: 'Genkit Reflection API',
        description: 'A control API that allows clients to inspect app code to view actions, run them, and view the results.',
    },
});
if (!process.argv[2]) {
    throw Error('Please provide an absolute path to output the generated API spec.');
}
fs.writeFileSync(path.join(process.argv[2], 'reflectionApi.yaml'), yaml.dump(document), {
    encoding: 'utf-8',
});
//# sourceMappingURL=reflection.js.map