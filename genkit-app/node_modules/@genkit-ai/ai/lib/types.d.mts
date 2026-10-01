import { z, Action } from '@genkit-ai/core';

/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

declare const LlmStatsSchema: z.ZodObject<{
    latencyMs: z.ZodOptional<z.ZodNumber>;
    inputTokenCount: z.ZodOptional<z.ZodNumber>;
    outputTokenCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    latencyMs?: number | undefined;
    inputTokenCount?: number | undefined;
    outputTokenCount?: number | undefined;
}, {
    latencyMs?: number | undefined;
    inputTokenCount?: number | undefined;
    outputTokenCount?: number | undefined;
}>;
type LlmStats = z.infer<typeof LlmStatsSchema>;
declare const ToolSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    schema: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    schema?: any;
}, {
    name: string;
    description?: string | undefined;
    schema?: any;
}>;
type Tool = z.infer<typeof ToolSchema>;
declare const ToolCallSchema: z.ZodObject<{
    toolName: z.ZodString;
    arguments: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    toolName: string;
    arguments?: any;
}, {
    toolName: string;
    arguments?: any;
}>;
type ToolCall = z.infer<typeof ToolCallSchema>;
declare const LlmResponseSchema: z.ZodObject<{
    completion: z.ZodString;
    toolCalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        toolName: z.ZodString;
        arguments: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        toolName: string;
        arguments?: any;
    }, {
        toolName: string;
        arguments?: any;
    }>, "many">>;
    stats: z.ZodObject<{
        latencyMs: z.ZodOptional<z.ZodNumber>;
        inputTokenCount: z.ZodOptional<z.ZodNumber>;
        outputTokenCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        latencyMs?: number | undefined;
        inputTokenCount?: number | undefined;
        outputTokenCount?: number | undefined;
    }, {
        latencyMs?: number | undefined;
        inputTokenCount?: number | undefined;
        outputTokenCount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    completion: string;
    stats: {
        latencyMs?: number | undefined;
        inputTokenCount?: number | undefined;
        outputTokenCount?: number | undefined;
    };
    toolCalls?: {
        toolName: string;
        arguments?: any;
    }[] | undefined;
}, {
    completion: string;
    stats: {
        latencyMs?: number | undefined;
        inputTokenCount?: number | undefined;
        outputTokenCount?: number | undefined;
    };
    toolCalls?: {
        toolName: string;
        arguments?: any;
    }[] | undefined;
}>;
type LlmResponse = z.infer<typeof LlmResponseSchema>;
/**
 * Converts actions to tool definition sent to model inputs.
 */
declare function toToolWireFormat(actions?: Action<any, any>[]): z.infer<typeof ToolSchema>[] | undefined;

export { type LlmResponse, LlmResponseSchema, type LlmStats, LlmStatsSchema, type Tool, type ToolCall, ToolCallSchema, ToolSchema, toToolWireFormat };
