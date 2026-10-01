import { execSync } from 'child_process';
import * as clc from 'colorette';
import { z } from 'zod';
const SupportedFlagValuesSchema = z.union([
    z.undefined(),
    z.string(),
    z.boolean(),
    z.array(z.string()),
]);
export const BaseToolPluginActionSchema = z.object({
    args: z.optional(z.array(z.object({
        description: z.string(),
        flag: z.string(),
        defaultValue: SupportedFlagValuesSchema,
    }))),
    hook: z
        .function()
        .args(z.optional(z.record(z.string(), SupportedFlagValuesSchema)))
        .returns(z.union([z.void(), z.promise(z.void())])),
});
export const ToolPluginActionSchema = BaseToolPluginActionSchema.extend({
    action: z.string(),
    helpText: z.string(),
});
export const ToolPluginSubCommandsSchema = z.object({
    login: z.optional(BaseToolPluginActionSchema),
    deploy: z.optional(BaseToolPluginActionSchema),
});
export const ToolPluginSchema = z.object({
    name: z.string(),
    keyword: z.string(),
    actions: z.array(ToolPluginActionSchema),
    subCommands: z.optional(ToolPluginSubCommandsSchema),
});
const SEPARATOR = '===========================';
export function cliCommand(command, options) {
    const commandString = command + (options ? ` ${options}` : '');
    console.log(`Running ${clc.bold(commandString)}...\n${SEPARATOR}`);
    try {
        execSync(commandString, { stdio: 'inherit', encoding: 'utf8' });
    }
    catch (e) {
        console.log(`${SEPARATOR}\n`);
        throw e;
    }
    console.log(`${SEPARATOR}\n`);
}
//# sourceMappingURL=plugins.js.map