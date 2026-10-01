"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var data_connect_exports = {};
__export(data_connect_exports, {
  dataConnectTools: () => dataConnectTools,
  serverAppFromContext: () => serverAppFromContext
});
module.exports = __toCommonJS(data_connect_exports);
var import_app = require("firebase/app");
var import_data_connect = require("firebase/data-connect");
var import_fs = require("fs");
var import_genkit = require("genkit");
var import_logging = require("genkit/logging");
var import_plugin = require("genkit/plugin");
function serverAppFromContext(context, config) {
  if ("firebaseApp" in context)
    return context.firebaseApp;
  try {
    if (!config) config = (0, import_app.getApp)();
  } catch (e) {
    throw new import_genkit.GenkitError({
      status: "FAILED_PRECONDITION",
      message: `Must either supply a 'firebaseApp' option or have already initialized a default FirebaseApp when calling Data Connect tools.`
    });
  }
  return (0, import_app.initializeServerApp)(config, {
    authIdToken: context.auth?.rawToken,
    appCheckToken: context.app?.rawToken
  });
}
function dataConnectTools(options) {
  if (!options.config && !options.configFile)
    throw new import_genkit.GenkitError({
      status: "INVALID_ARGUMENT",
      message: "Must supply `config` or `configFile` when initializing a Data Connect tools plugin."
    });
  if (!options.config) {
    try {
      options.config = JSON.parse(
        (0, import_fs.readFileSync)(options.configFile, "utf8")
      );
    } catch (e) {
      throw new import_genkit.GenkitError({
        status: "INVALID_ARGUMENT",
        message: `Could not parse Data Connect tools config from ${options.configFile}: ${e.message}`
      });
    }
  }
  return (0, import_plugin.genkitPlugin)(options.name, (ai) => {
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
          const dc = (0, import_data_connect.getDataConnect)(serverApp, {
            connector: config.connector,
            location: config.location,
            service: config.service
          });
          try {
            if (tool.type === "query") {
              const { data: data2 } = await (0, import_data_connect.executeQuery)(
                (0, import_data_connect.queryRef)(dc, tool.name, input)
              );
              return data2;
            }
            const { data } = await (0, import_data_connect.executeMutation)(
              (0, import_data_connect.mutationRef)(dc, tool.name, input)
            );
            import_logging.logger.debug(
              `[dataConnectTools] ${tool.name}(${JSON.stringify(input)}) -> ${JSON.stringify(data)}`
            );
            return data;
          } catch (e) {
            import_logging.logger.info("[dataConnectTools] error on tool call:", e);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  dataConnectTools,
  serverAppFromContext
});
//# sourceMappingURL=data-connect.js.map