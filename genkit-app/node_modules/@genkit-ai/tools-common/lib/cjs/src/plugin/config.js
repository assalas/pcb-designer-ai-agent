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
exports.EVAL_FIELDS = void 0;
exports.isEvalField = isEvalField;
exports.findToolsConfig = findToolsConfig;
exports.genkitToolsConfig = genkitToolsConfig;
const clc = __importStar(require("colorette"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const process = __importStar(require("process"));
const zod_1 = require("zod");
const trace_1 = require("../types/trace");
const plugins_1 = require("./plugins");
const CONFIG_NAME = 'genkit-tools.conf.js';
exports.EVAL_FIELDS = ['input', 'output', 'context'];
const InputSelectorSchema = zod_1.z.object({
    inputOf: zod_1.z.string(),
});
const OutputSelectorSchema = zod_1.z.object({
    outputOf: zod_1.z.string(),
});
const StepSelectorSchema = zod_1.z.union([InputSelectorSchema, OutputSelectorSchema]);
const EvaluationExtractorSchema = zod_1.z.record(zod_1.z.enum(exports.EVAL_FIELDS), zod_1.z.union([
    zod_1.z.string(),
    StepSelectorSchema,
    zod_1.z.function().args(trace_1.TraceDataSchema).returns(zod_1.z.any()),
]));
function isEvalField(input) {
    const foundField = exports.EVAL_FIELDS.some((v) => v === input);
    return !!foundField;
}
const EvaluatorConfig = zod_1.z.object({
    actionRef: zod_1.z
        .string()
        .describe('specify which flow this config is for')
        .optional(),
    extractors: EvaluationExtractorSchema,
});
const ToolsConfigSchema = zod_1.z
    .object({
    cliPlugins: zod_1.z.optional(zod_1.z.array(plugins_1.ToolPluginSchema)),
    builder: zod_1.z
        .object({
        cmd: zod_1.z.string().optional(),
    })
        .optional(),
    evaluators: zod_1.z.array(EvaluatorConfig).optional(),
    runner: zod_1.z
        .object({
        mode: zod_1.z.enum(['default', 'harness']).default('default'),
        files: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .optional(),
})
    .strict();
let cachedConfig = null;
async function findToolsConfig() {
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
            const config = (await Promise.resolve(`${configPath}`).then(s => __importStar(require(s))));
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
function genkitToolsConfig(cfg) {
    return cfg;
}
//# sourceMappingURL=config.js.map