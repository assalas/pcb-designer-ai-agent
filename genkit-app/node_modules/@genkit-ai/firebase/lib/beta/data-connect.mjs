import {
  getApp,
  initializeServerApp
} from "firebase/app";
import {
  executeMutation,
  executeQuery,
  getDataConnect,
  mutationRef,
  queryRef
} from "firebase/data-connect";
import { readFileSync } from "fs";
import { GenkitError } from "genkit";
import { logger } from "genkit/logging";
import { genkitPlugin } from "genkit/plugin";
function serverAppFromContext(context, config) {
  if ("firebaseApp" in context)
    return context.firebaseApp;
  try {
    if (!config) config = getApp();
  } catch (e) {
    throw new GenkitError({
      status: "FAILED_PRECONDITION",
      message: `Must either supply a 'firebaseApp' option or have already initialized a default FirebaseApp when calling Data Connect tools.`
    });
  }
  return initializeServerApp(config, {
    authIdToken: context.auth?.rawToken,
    appCheckToken: context.app?.rawToken
  });
}
function dataConnectTools(options) {
  if (!options.config && !options.configFile)
    throw new GenkitError({
      status: "INVALID_ARGUMENT",
      message: "Must supply `config` or `configFile` when initializing a Data Connect tools plugin."
    });
  if (!options.config) {
    try {
      options.config = JSON.parse(
        readFileSync(options.configFile, "utf8")
      );
    } catch (e) {
      throw new GenkitError({
        status: "INVALID_ARGUMENT",
        message: `Could not parse Data Connect tools config from ${options.configFile}: ${e.message}`
      });
    }
  }
  return genkitPlugin(options.name, (ai) => {
    const config = options.config;
    for (const tool of config.tools) {
      ai.defineTool(
        {
          name: `${options.name}/${tool.name}`,
          description: tool.description || "",
          inputJsonSchema: tool.parameters
        },
        async (input, { context }) => {
          const serverApp = serverAppFromContext(context, options.firebaseApp);
          const dc = getDataConnect(serverApp, {
            connector: config.connector,
            location: config.location,
            service: config.service
          });
          try {
            if (tool.type === "query") {
              const { data: data2 } = await executeQuery(
                queryRef(dc, tool.name, input)
              );
              return data2;
            }
            const { data } = await executeMutation(
              mutationRef(dc, tool.name, input)
            );
            logger.debug(
              `[dataConnectTools] ${tool.name}(${JSON.stringify(input)}) -> ${JSON.stringify(data)}`
            );
            return data;
          } catch (e) {
            logger.info("[dataConnectTools] error on tool call:", e);
            if (options.onError === "throw") throw e;
            if (typeof options.onError === "function")
              return Promise.resolve(options.onError(tool, e));
            if (options.onError === "return" || !options.onError)
              return { error: e.message };
          }
        }
      );
    }
  });
}
export {
  dataConnectTools,
  serverAppFromContext
};
//# sourceMappingURL=data-connect.mjs.map