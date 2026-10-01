import { z } from "genkit";
const cacheConfigSchema = z.union([
  z.boolean(),
  z.object({ ttlSeconds: z.number().optional() }).passthrough()
]);
const cacheConfigDetailsSchema = z.object({
  cacheConfig: cacheConfigSchema,
  endOfCachedContents: z.number()
});
export {
  cacheConfigDetailsSchema,
  cacheConfigSchema
};
//# sourceMappingURL=types.mjs.map