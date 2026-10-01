import { z } from 'genkit';

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

declare const cacheConfigSchema: z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
    ttlSeconds: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    ttlSeconds: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    ttlSeconds: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>]>;
type CacheConfig = z.infer<typeof cacheConfigSchema>;
declare const cacheConfigDetailsSchema: z.ZodObject<{
    cacheConfig: z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
        ttlSeconds: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ttlSeconds: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ttlSeconds: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>]>;
    endOfCachedContents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    cacheConfig: boolean | z.objectOutputType<{
        ttlSeconds: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">;
    endOfCachedContents: number;
}, {
    cacheConfig: boolean | z.objectInputType<{
        ttlSeconds: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">;
    endOfCachedContents: number;
}>;
type CacheConfigDetails = z.infer<typeof cacheConfigDetailsSchema>;

export { type CacheConfig, type CacheConfigDetails, cacheConfigDetailsSchema, cacheConfigSchema };
