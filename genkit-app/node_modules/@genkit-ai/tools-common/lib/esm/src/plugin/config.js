import * as clc from 'colorette';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { z } from 'zod';
import { TraceDataSchema } from '../types/trace';
import { ToolPluginSchema } from './plugins';
const CONFIG_NAME = 'genkit-tools.conf.js';
export const EVAL_FIELDS = ['input', 'output', 'context'];
const InputSelectorSchema = z.object({
    inputOf: z.string(),
});
const OutputSelectorSchema = z.object({
    outputOf: z.string(),
});
const StepSelectorSchema = z.union([InputSelectorSchema, OutputSelectorSchema]);
const EvaluationExtractorSchema = z.record(z.enum(EVAL_FIELDS), z.union([
    z.string(),
    StepSelectorSchema,
    z.function().args(TraceDataSchema).returns(z.any()),
]));
export function isEvalField(input) {
    const foundField = EVAL_FIELDS.some((v) => v === input);
    return !!foundField;
}
const EvaluatorConfig = z.object({
    actionRef: z
        .string()
        .describe('specify which flow this config is for')
        .optional(),
    extractors: EvaluationExtractorSchema,
});
const ToolsConfigSchema = z
    .object({
    cliPlugins: z.optional(z.array(ToolPluginSchema)),
    builder: z
        .object({
        cmd: z.string().optional(),
    })
        .optional(),
    evaluators: z.array(EvaluatorConfig).optional(),
    runner: z
        .object({
        mode: z.enum(['default', 'harness']).default('default'),
        files: z.array(z.string()).optional(),
    })
        .optional(),
})
    .strict();
let cachedConfig = null;
export async function findToolsConfig() {
    if (!cachedConfig) {
        cachedConfig = findToolsConfigInternal();
    }
    return cachedConfig;
}
async function findToolsConfigInternal() {
    let current = process.cwd();
    while (path.resolve(current, '..') !== current) {
        if (fs.existsSync(path.resolve(current, CONFIG_NAME))) {
            const configPath = path.resolve(current, CONFIG_NAME);
            const config = (await import(configPath));
            const result = ToolsConfigSchema.safeParse(config.default);
            if (result.success) {
                return result.data;
            }
            console.warn(`${clc.bold(clc.yellow('Warning:'))} ` +
                `Malformed tools schema:\n${result.error.toString()}`);
            return null;
        }
        current = path.resolve(current, '..');
    }
    return null;
}
export function genkitToolsConfig(cfg) {
    return cfg;
}
//# sourceMappingURL=config.js.map