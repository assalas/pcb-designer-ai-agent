import { FirebaseOptions, FirebaseApp, FirebaseServerApp } from 'firebase/app';
import { JSONSchema7 } from 'genkit';
import { GenkitPlugin } from 'genkit/plugin';

/**
 * Copyright 2025 Google LLC
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

interface DataConnectTool {
    name: string;
    type: 'query' | 'mutation';
    description?: string;
    parameters: JSONSchema7;
}
interface ToolsConfig {
    connector: string;
    location: string;
    service: string;
    tools: DataConnectTool[];
}
interface DataConnectToolsOptions {
    /** Provide a name for the plugin. All tools will have this prefix, e.g. `myname/myTool` */
    name: string;
    /** Pass in tool definitions as generated from Data Connect's `llmTools` generator. */
    config?: ToolsConfig;
    /** Path to the file output by the `llmTools` generator. */
    configFile: string;
    /**
     * Your Firebase client SDK config or a FirebaseApp or a FirebaseServerApp. If not provided
     * the plugin will attempt to use `context.firebaseApp` for an in-context app or will fall
     * back the default app.
     */
    firebaseApp?: FirebaseOptions | FirebaseApp;
    /**
     * How to handle errors coming from Data Connect tools:
     *
     * - `return`: (default) return the error to the model to allow it to decide how to proceed
     * - `throw`: throw an error, halting execution
     *
     * You may also supply a custom error handler. Whatever is returned from the handler will
     * be returned to the LLM. If you throw an exception from the handler, execution will be
     * halted with an error.
     */
    onError?: 'return' | 'throw' | ((tool: DataConnectTool, error: Error) => any | Promise<any>);
}
declare function serverAppFromContext(context: Record<string, any>, config?: FirebaseOptions | FirebaseApp): FirebaseServerApp | FirebaseApp;
/**
 * dataConnectTools connects Genkit to your Data Connect operations by creating tools from
 * your connector's queries and mutations. This plugin is driven by the generated JSON file
 * from the `llmTools` option. You can generate this file using the `llmTools` option in
 * `connector.yaml`, for example:
 *
 * ```yaml
 * connectorId: tools
 * generate:
 *   llmTools:
 *     outputFile: ../../tools.json
 * ```
 *
 * Once you have the tools file, you can use this function to register the tools as a Genkit
 * plugin:
 *
 * ```ts
 * const app = initializeFirebase({...});
 *
 * const ai = genkit({
 *   plugins: [..., dataConnectTool({
 *     name: 'myTools',
 *     configFile: 'tools.json',
 *     sdk: app,
 *   })]
 * })
 * ```
 *
 * **IMPORTANT:** This plugin relies on the *client SDKs* for Firebase and does not have
 * administrative access to Data Connect. To authenticate this plugin requires a `firebaseApp`
 * instance on `context` with appropriate privileges or the use of the `firebaseContext()`
 * context provider.
 *
 * @param options Configuration options for the plugin.
 * @returns A Genkit plugin.
 */
declare function dataConnectTools(options: DataConnectToolsOptions): GenkitPlugin;

export { type DataConnectTool, type DataConnectToolsOptions, type ToolsConfig, dataConnectTools, serverAppFromContext };
