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
exports.ToolPluginSchema = exports.ToolPluginSubCommandsSchema = exports.ToolPluginActionSchema = exports.BaseToolPluginActionSchema = void 0;
exports.cliCommand = cliCommand;
const child_process_1 = require("child_process");
const clc = __importStar(require("colorette"));
const zod_1 = require("zod");
const SupportedFlagValuesSchema = zod_1.z.union([
    zod_1.z.undefined(),
    zod_1.z.string(),
    zod_1.z.boolean(),
    zod_1.z.array(zod_1.z.string()),
]);
exports.BaseToolPluginActionSchema = zod_1.z.object({
    args: zod_1.z.optional(zod_1.z.array(zod_1.z.object({
        description: zod_1.z.string(),
        flag: zod_1.z.string(),
        defaultValue: SupportedFlagValuesSchema,
    }))),
    hook: zod_1.z
        .function()
        .args(zod_1.z.optional(zod_1.z.record(zod_1.z.string(), SupportedFlagValuesSchema)))
        .returns(zod_1.z.union([zod_1.z.void(), zod_1.z.promise(zod_1.z.void())])),
});
exports.ToolPluginActionSchema = exports.BaseToolPluginActionSchema.extend({
    action: zod_1.z.string(),
    helpText: zod_1.z.string(),
});
exports.ToolPluginSubCommandsSchema = zod_1.z.object({
    login: zod_1.z.optional(exports.BaseToolPluginActionSchema),
    deploy: zod_1.z.optional(exports.BaseToolPluginActionSchema),
});
exports.ToolPluginSchema = zod_1.z.object({
    name: zod_1.z.string(),
    keyword: zod_1.z.string(),
    actions: zod_1.z.array(exports.ToolPluginActionSchema),
    subCommands: zod_1.z.optional(exports.ToolPluginSubCommandsSchema),
});
const SEPARATOR = '===========================';
function cliCommand(command, options) {
    const commandString = command + (options ? ` ${options}` : '');
    console.log(`Running ${clc.bold(commandString)}...\n${SEPARATOR}`);
    try {
        (0, child_process_1.execSync)(commandString, { stdio: 'inherit', encoding: 'utf8' });
    }
    catch (e) {
        console.log(`${SEPARATOR}\n`);
        throw e;
    }
    console.log(`${SEPARATOR}\n`);
}
//# sourceMappingURL=plugins.js.map