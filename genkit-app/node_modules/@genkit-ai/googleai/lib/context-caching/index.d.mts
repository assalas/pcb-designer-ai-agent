import { StartChatParams, CachedContent } from '@google/generative-ai';
import { GenerateRequest, z } from 'genkit';
import { CacheConfigDetails } from './types.mjs';

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

/**
 * Handles context caching and transforms the chatRequest
 * @param apiKey
 * @param request
 * @param chatRequest
 * @param modelVersion
 * @returns
 */
declare function handleContextCache(apiKey: string, request: GenerateRequest<z.ZodTypeAny>, chatRequest: StartChatParams, modelVersion: string, cacheConfigDetails: CacheConfigDetails): Promise<{
    cache: CachedContent;
    newChatRequest: StartChatParams;
}>;
/**
 * Handles cache validation, creation, and usage, transforming the chatRequest if necessary.
 * @param apiKey The API key for accessing Google AI Gemini.
 * @param request The generate request passed to the model.
 * @param chatRequest The current chat request configuration.
 * @param modelVersion The version of the model being used.
 * @param cacheConfigDetails Configuration details for caching.
 * @returns A transformed chat request and cache data (if applicable).
 */
declare function handleCacheIfNeeded(apiKey: string, request: GenerateRequest<z.ZodTypeAny>, chatRequest: StartChatParams, modelVersion: string, cacheConfigDetails: CacheConfigDetails | null): Promise<{
    chatRequest: StartChatParams;
    cache: CachedContent | null;
}>;

export { handleCacheIfNeeded, handleContextCache };
