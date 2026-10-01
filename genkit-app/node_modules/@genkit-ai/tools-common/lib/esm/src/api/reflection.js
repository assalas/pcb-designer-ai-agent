import { OpenAPIRegistry, OpenApiGeneratorV3, } from '@asteasolutions/zod-to-openapi';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as z from 'zod';
import * as action from '../types/action';
import * as apis from '../types/apis';
import { SpanDataSchema, TraceDataSchema } from '../types/trace';
const registry = new OpenAPIRegistry();
registry.register('CustomAny', action.CustomAnySchema.openapi('CustomAny'));
registry.register('JSONSchema7', action.JSONSchema7Schema.openapi('JSONSchema7'));
registry.register('Action', action.ActionSchema.openapi('Action'));
registry.register('TraceData', TraceDataSchema.openapi('TraceData'));
registry.register('SpanData', SpanDataSchema.openapi('SpanData'));
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
const generator = new OpenApiGeneratorV3(registry.definitions);
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