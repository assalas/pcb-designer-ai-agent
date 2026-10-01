import { AlwaysOnSampler } from "@opentelemetry/sdk-trace-base";
import { isDevEnv } from "genkit";
const TelemetryConfigs = {
  defaults: (overrides = {}) => {
    return isDevEnv() ? TelemetryConfigs.developmentDefaults(overrides) : TelemetryConfigs.productionDefaults(overrides);
  },
  developmentDefaults: (overrides = {}) => {
    const defaults = {
      sampler: new AlwaysOnSampler(),
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
      sampler: new AlwaysOnSampler(),
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
export {
  TelemetryConfigs
};
//# sourceMappingURL=defaults.mjs.map