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
var defaults_exports = {};
__export(defaults_exports, {
  TelemetryConfigs: () => TelemetryConfigs
});
module.exports = __toCommonJS(defaults_exports);
var import_sdk_trace_base = require("@opentelemetry/sdk-trace-base");
var import_genkit = require("genkit");
const TelemetryConfigs = {
  defaults: (overrides = {}) => {
    return (0, import_genkit.isDevEnv)() ? TelemetryConfigs.developmentDefaults(overrides) : TelemetryConfigs.productionDefaults(overrides);
  },
  developmentDefaults: (overrides = {}) => {
    const defaults = {
      sampler: new import_sdk_trace_base.AlwaysOnSampler(),
      autoInstrumentation: true,
      autoInstrumentationConfig: {
        "@opentelemetry/instrumentation-dns": { enabled: false }
      },
      instrumentations: [],
      metricExportIntervalMillis: 5e3,
      metricExportTimeoutMillis: 5e3,
      disableMetrics: false,
      disableTraces: false,
      exportInputAndOutput: !overrides.disableLoggingInputAndOutput,
      export: !!overrides.forceDevExport
      // false
    };
    return { ...defaults, ...overrides };
  },
  productionDefaults: (overrides = {}) => {
    const defaults = {
      sampler: new import_sdk_trace_base.AlwaysOnSampler(),
      autoInstrumentation: true,
      autoInstrumentationConfig: {
        "@opentelemetry/instrumentation-dns": { enabled: false }
      },
      instrumentations: [],
      metricExportIntervalMillis: 3e5,
      metricExportTimeoutMillis: 3e5,
      disableMetrics: false,
      disableTraces: false,
      exportInputAndOutput: !overrides.disableLoggingInputAndOutput,
      export: true
    };
    return { ...defaults, ...overrides };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TelemetryConfigs
});
//# sourceMappingURL=defaults.js.map