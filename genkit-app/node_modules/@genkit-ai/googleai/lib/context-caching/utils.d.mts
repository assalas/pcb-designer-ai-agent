import { CachedContent, StartChatParams } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { z } from 'genkit';
import { GenerateRequest } from 'genkit/model';
import { CacheConfigDetails, CacheConfig } from './types.mjs';

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
 * Generates a SHA-256 hash to use as a cache key.
 * @param request CachedContent - request object to hash
 * @returns string - the generated cache key
 */
declare function generateCacheKey(request: CachedContent): string;
/**
 * Retrieves the content needed for the cache based on the chat history and config details.
 */
declare function getContentForCache(request: GenerateRequest<z.ZodTypeAny>, chatRequest: StartChatParams, modelVersion: string, cacheConfigDetails: CacheConfigDetails): {
    cachedContent: CachedContent;
    chatRequest: StartChatParams;
    cacheConfig?: CacheConfig;
};
/**
 * Looks up context cache using a cache manager and returns the found item, if any.
 */
/**
 * Looks up context cache using a cache manager and returns the found item, if any.
 */
declare function lookupContextCache(cacheManager: GoogleAICacheManager, cacheKey: string, maxPages?: number, pageSize?: number): Promise<CachedContent | null>;
/**
 * Extracts the cache configuration from the request if available.
 */
declare const extractCacheConfig: (request: GenerateRequest<z.ZodTypeAny>) => {
    cacheConfig: {
        ttlSeconds?: number;
    } | boolean;
    endOfCachedContents: number;
} | null;
/**
 * Validates context caching request for compatibility with model and request configurations.
 */
declare function validateContextCacheRequest(request: GenerateRequest<z.ZodTypeAny>, modelVersion: string): boolean;
/**
 * Polyfill function for Array.prototype.findLastIndex for ES2015 compatibility.
 */
declare function findLastIndex<T>(array: T[], callback: (element: T, index: number, array: T[]) => boolean): number;
/**
 * Calculates the TTL (Time-To-Live) for the cache based on cacheConfigDetails.
 * @param cacheConfig - The caching configuration details.
 * @returns The TTL in seconds.
 */
declare function calculateTTL(cacheConfig: CacheConfigDetails): number;

export { calculateTTL, extractCacheConfig, findLastIndex, generateCacheKey, getContentForCache, lookupContextCache, validateContextCacheRequest };
