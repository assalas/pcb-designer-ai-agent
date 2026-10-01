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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tracing_exports = {};
__export(tracing_exports, {
  disableGenkitOTelInitialization: () => disableGenkitOTelInitialization,
  enableTelemetry: () => enableTelemetry,
  ensureBasicTelemetryInstrumentation: () => ensureBasicTelemetryInstrumentation,
  flushTracing: () => flushTracing,
  setTelemetryProvider: () => setTelemetryProvider
});
module.exports = __toCommonJS(tracing_exports);
var import_error = require("./error.js");
var import_logging = require("./logging.js");
__reExport(tracing_exports, require("./tracing/exporter.js"), module.exports);
__reExport(tracing_exports, require("./tracing/instrumentation.js"), module.exports);
__reExport(tracing_exports, require("./tracing/types.js"), module.exports);
const oTelInitializationKey = "__GENKIT_DISABLE_GENKIT_OTEL_INITIALIZATION";
const instrumentationKey = "__GENKIT_TELEMETRY_INSTRUMENTED";
const telemetryProviderKey = "__GENKIT_TELEMETRY_PROVIDER";
async function ensureBasicTelemetryInstrumentation() {
  await checkFirebaseMonitoringAutoInit();
  if (global[instrumentationKey]) {
    return await global[instrumentationKey];
  }
  await enableTelemetry({});
}
async function checkFirebaseMonitoringAutoInit() {
  if (!global[instrumentationKey] && process.env.ENABLE_FIREBASE_MONITORING === "true") {
    try {
      const importModule = new Function(
        "moduleName",
        "return import(moduleName)"
      );
      const firebaseModule = await importModule("@genkit-ai/firebase");
      firebaseModule.enableFirebaseTelemetry();
    } catch (e) {
      import_logging.logger.warn(
        "It looks like you're trying to enable firebase monitoring, but haven't installed the firebase plugin. Please run `npm i --save @genkit-ai/firebase` and redeploy."
      );
    }
  }
}
function getTelemetryProvider() {
  if (global[telemetryProviderKey]) {
    return global[telemetryProviderKey];
  }
  throw new import_error.GenkitError({
    status: "FAILED_PRECONDITION",
    message: "TelemetryProvider is not initialized."
  });
}
function setTelemetryProvider(provider) {
  if (global[telemetryProviderKey]) return;
  global[telemetryProviderKey] = provider;
}
async function enableTelemetry(telemetryConfig) {
  if (isOTelInitializationDisabled()) {
    return;
  }
  global[instrumentationKey] = telemetryConfig instanceof Promise ? telemetryConfig : Promise.resolve();
  return getTelemetryProvider().enableTelemetry(telemetryConfig);
}
async function flushTracing() {
  return getTelemetryProvider().flushTracing();
}
function isOTelInitializationDisabled() {
  return global[oTelInitializationKey] === true;
}
function disableGenkitOTelInitialization() {
  global[oTelInitializationKey] = true;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  disableGenkitOTelInitialization,
  enableTelemetry,
  ensureBasicTelemetryInstrumentation,
  flushTracing,
  setTelemetryProvider,
  ...require("./tracing/exporter.js"),
  ...require("./tracing/instrumentation.js"),
  ...require("./tracing/types.js")
});
//# sourceMappingURL=tracing.js.map