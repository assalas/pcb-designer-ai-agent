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
var gcpOpenTelemetry_exports = {};
__export(gcpOpenTelemetry_exports, {
  GcpOpenTelemetry: () => GcpOpenTelemetry,
  __forceFlushSpansForTesting: () => __forceFlushSpansForTesting,
  __getMetricExporterForTesting: () => __getMetricExporterForTesting,
  __getSpanExporterForTesting: () => __getSpanExporterForTesting
});
module.exports = __toCommonJS(gcpOpenTelemetry_exports);
var import_opentelemetry_cloud_monitoring_exporter = require("@google-cloud/opentelemetry-cloud-monitoring-exporter");
var import_opentelemetry_cloud_trace_exporter = require("@google-cloud/opentelemetry-cloud-trace-exporter");
var import_opentelemetry_resource_util = require("@google-cloud/opentelemetry-resource-util");
var import_api = require("@opentelemetry/api");
var import_auto_instrumentations_node = require("@opentelemetry/auto-instrumentations-node");
var import_instrumentation_pino = require("@opentelemetry/instrumentation-pino");
var import_instrumentation_winston = require("@opentelemetry/instrumentation-winston");
var import_resources = require("@opentelemetry/resources");
var import_sdk_metrics = require("@opentelemetry/sdk-metrics");
var import_sdk_trace_base = require("@opentelemetry/sdk-trace-base");
var import_genkit = require("genkit");
var import_logging = require("genkit/logging");
var import_action = require("./telemetry/action.js");
var import_engagement = require("./telemetry/engagement.js");
var import_feature = require("./telemetry/feature.js");
var import_generate = require("./telemetry/generate.js");
var import_path = require("./telemetry/path.js");
var import_utils = require("./utils.js");
let metricExporter;
let spanProcessor;
let spanExporter;
class GcpOpenTelemetry {
  config;
  resource;
  constructor(config) {
    this.config = config;
    this.resource = new import_resources.Resource({ type: "global" }).merge(
      new import_opentelemetry_resource_util.GcpDetectorSync().detect()
    );
  }
  /**
   * Log hook for writing trace and span metadata to log messages in the format
   * required by GCP.
   */
  gcpTraceLogHook = (span, record) => {
    const spanContext = span.spanContext();
    const isSampled = !!(spanContext.traceFlags & import_api.TraceFlags.SAMPLED);
    const projectId = this.config.projectId;
    record["logging.googleapis.com/trace"] ??= `projects/${projectId}/traces/${spanContext.traceId}`;
    record["logging.googleapis.com/trace_sampled"] ??= isSampled ? "1" : "0";
    record["logging.googleapis.com/spanId"] ??= spanContext.spanId;
    delete record["span_id"];
    delete record["trace_id"];
    delete record["trace_flags"];
  };
  async getConfig() {
    spanProcessor = new import_sdk_trace_base.BatchSpanProcessor(await this.createSpanExporter());
    return {
      resource: this.resource,
      spanProcessor,
      sampler: this.config.sampler,
      instrumentations: this.getInstrumentations(),
      metricReader: await this.createMetricReader()
    };
  }
  async createSpanExporter() {
    spanExporter = new AdjustingTraceExporter(
      this.shouldExportTraces() ? new import_opentelemetry_cloud_trace_exporter.TraceExporter({
        // provided projectId should take precedence over env vars, etc
        projectId: this.config.projectId,
        // creds for non-GCP environments, in lieu of using ADC.
        credentials: this.config.credentials
      }) : new import_sdk_trace_base.InMemorySpanExporter(),
      this.config.exportInputAndOutput,
      this.config.projectId,
      getErrorHandler(
        (err) => {
          return (0, import_utils.tracingDenied)(err);
        },
        await (0, import_utils.tracingDeniedHelpText)()
      )
    );
    return spanExporter;
  }
  /**
   * Creates a {MetricReader} for pushing metrics out to GCP via OpenTelemetry.
   */
  async createMetricReader() {
    metricExporter = await this.buildMetricExporter();
    return new import_sdk_metrics.PeriodicExportingMetricReader({
      exportIntervalMillis: this.config.metricExportIntervalMillis,
      exportTimeoutMillis: this.config.metricExportTimeoutMillis,
      exporter: metricExporter
    });
  }
  /** Gets all open telemetry instrumentations as configured by the plugin. */
  getInstrumentations() {
    let instrumentations = [];
    if (this.config.autoInstrumentation) {
      instrumentations = (0, import_auto_instrumentations_node.getNodeAutoInstrumentations)(
        this.config.autoInstrumentationConfig
      );
    }
    return instrumentations.concat(this.getDefaultLoggingInstrumentations()).concat(this.config.instrumentations ?? []);
  }
  shouldExportTraces() {
    return this.config.export && !this.config.disableTraces;
  }
  shouldExportMetrics() {
    return this.config.export && !this.config.disableMetrics;
  }
  /** Always configure the Pino and Winston instrumentations */
  getDefaultLoggingInstrumentations() {
    return [
      new import_instrumentation_winston.WinstonInstrumentation({ logHook: this.gcpTraceLogHook }),
      new import_instrumentation_pino.PinoInstrumentation({ logHook: this.gcpTraceLogHook })
    ];
  }
  async buildMetricExporter() {
    const exporter = this.shouldExportMetrics() ? new MetricExporterWrapper(
      {
        userAgent: {
          product: "genkit",
          version: import_genkit.GENKIT_VERSION
        },
        // provided projectId should take precedence over env vars, etc
        projectId: this.config.projectId,
        // creds for non-GCP environments, in lieu of using ADC.
        credentials: this.config.credentials
      },
      getErrorHandler(
        (err) => {
          return (0, import_utils.metricsDenied)(err);
        },
        await (0, import_utils.metricsDeniedHelpText)()
      )
    ) : new import_sdk_metrics.InMemoryMetricExporter(import_sdk_metrics.AggregationTemporality.DELTA);
    return exporter;
  }
}
class MetricExporterWrapper extends import_opentelemetry_cloud_monitoring_exporter.MetricExporter {
  constructor(options, errorHandler) {
    super(options);
    this.errorHandler = errorHandler;
  }
  promise = new Promise((resolve) => resolve());
  async export(metrics, resultCallback) {
    await this.promise;
    this.modifyStartTimes(metrics);
    this.promise = new Promise((resolve) => {
      super.export(metrics, (result) => {
        try {
          if (this.errorHandler && result.error) {
            this.errorHandler(result.error);
          }
          resultCallback(result);
        } finally {
          resolve();
        }
      });
    });
  }
  selectAggregation(instrumentType) {
    if (instrumentType === import_sdk_metrics.InstrumentType.HISTOGRAM) {
      return new import_sdk_metrics.ExponentialHistogramAggregation();
    }
    return new import_sdk_metrics.DefaultAggregation();
  }
  selectAggregationTemporality(instrumentType) {
    return import_sdk_metrics.AggregationTemporality.DELTA;
  }
  /**
   * Modify the start times of each data point to ensure no
   * overlap with previous exports.
   *
   * Cloud metrics do not support delta metrics for custom metrics
   * and will convert any DELTA aggregations to CUMULATIVE ones on
   * export. There is implicit overlap in the start/end times that
   * the Metric reader is sending -- the end_time of the previous
   * export will become the start_time of the current export. The
   * overlap in times means that only one of those records will
   * persist and the other will be overwritten. This
   * method adds a thousandth of a second to ensure discrete export
   * timeframes.
   */
  modifyStartTimes(metrics) {
    metrics.scopeMetrics.forEach((scopeMetric) => {
      scopeMetric.metrics.forEach((metric) => {
        metric.dataPoints.forEach((dataPoint) => {
          dataPoint.startTime[1] = dataPoint.startTime[1] + 1e6;
        });
      });
    });
  }
  async shutdown() {
    return await this.forceFlush();
  }
  async forceFlush() {
    await this.promise;
  }
}
class AdjustingTraceExporter {
  constructor(exporter, logInputAndOutput, projectId, errorHandler) {
    this.exporter = exporter;
    this.logInputAndOutput = logInputAndOutput;
    this.projectId = projectId;
    this.errorHandler = errorHandler;
  }
  export(spans, resultCallback) {
    this.exporter?.export(this.adjust(spans), (result) => {
      if (this.errorHandler && result.error) {
        this.errorHandler(result.error);
      }
      resultCallback(result);
    });
  }
  shutdown() {
    return this.exporter?.shutdown();
  }
  getExporter() {
    return this.exporter;
  }
  forceFlush() {
    if (this.exporter?.forceFlush) {
      return this.exporter.forceFlush();
    }
    return Promise.resolve();
  }
  adjust(spans) {
    return spans.map((span) => {
      this.tickTelemetry(span);
      span = this.redactInputOutput(span);
      span = this.markErrorSpanAsError(span);
      span = this.markFailedSpan(span);
      span = this.markGenkitFeature(span);
      span = this.markGenkitModel(span);
      span = this.normalizeLabels(span);
      return span;
    });
  }
  tickTelemetry(span) {
    const attributes = span.attributes;
    if (!Object.keys(attributes).includes("genkit:type")) {
      return;
    }
    const type = attributes["genkit:type"];
    const subtype = attributes["genkit:metadata:subtype"];
    const isRoot = !!span.attributes["genkit:isRoot"];
    import_path.pathsTelemetry.tick(span, this.logInputAndOutput, this.projectId);
    if (isRoot) {
      import_feature.featuresTelemetry.tick(span, this.logInputAndOutput, this.projectId);
      span.attributes["genkit:rootState"] = span.attributes["genkit:state"];
    } else {
      if (type === "action" && subtype === "model") {
        import_generate.generateTelemetry.tick(span, this.logInputAndOutput, this.projectId);
      }
      if (type === "action" && subtype === "tool") {
      }
      if (type === "action" || type === "flow" || type == "flowStep" || type == "util") {
        import_action.actionTelemetry.tick(span, this.logInputAndOutput, this.projectId);
      }
    }
    if (type === "userEngagement") {
      import_engagement.engagementTelemetry.tick(span, this.logInputAndOutput, this.projectId);
    }
  }
  redactInputOutput(span) {
    const hasInput = "genkit:input" in span.attributes;
    const hasOutput = "genkit:output" in span.attributes;
    return !hasInput && !hasOutput ? span : {
      ...span,
      spanContext: span.spanContext,
      attributes: {
        ...span.attributes,
        "genkit:input": "<redacted>",
        "genkit:output": "<redacted>"
      }
    };
  }
  // This is a workaround for GCP Trace to mark a span with a red
  // exclamation mark indicating that it is an error.
  markErrorSpanAsError(span) {
    return span.status.code !== import_api.SpanStatusCode.ERROR ? span : {
      ...span,
      spanContext: span.spanContext,
      attributes: {
        ...span.attributes,
        "/http/status_code": "599"
      }
    };
  }
  normalizeLabels(span) {
    const normalized = {};
    for (const [key, value] of Object.entries(span.attributes)) {
      normalized[key.replace(/\:/g, "/")] = value;
    }
    return {
      ...span,
      spanContext: span.spanContext,
      attributes: normalized
    };
  }
  markFailedSpan(span) {
    if (span.attributes["genkit:isFailureSource"]) {
      span.attributes["genkit:failedSpan"] = span.attributes["genkit:name"];
      span.attributes["genkit:failedPath"] = span.attributes["genkit:path"];
    }
    return span;
  }
  markGenkitFeature(span) {
    if (span.attributes["genkit:isRoot"] && !!span.attributes["genkit:name"]) {
      span.attributes["genkit:feature"] = span.attributes["genkit:name"];
    }
    return span;
  }
  markGenkitModel(span) {
    if (span.attributes["genkit:metadata:subtype"] === "model" && !!span.attributes["genkit:name"]) {
      span.attributes["genkit:model"] = span.attributes["genkit:name"];
    }
    return span;
  }
}
function getErrorHandler(shouldLogFn, helpText) {
  let instructionsLogged = false;
  return (err) => {
    const defaultLogger = import_logging.logger.defaultLogger;
    if (err && shouldLogFn(err)) {
      if (!instructionsLogged) {
        instructionsLogged = true;
        defaultLogger.error(
          `Unable to send telemetry to Google Cloud: ${err.message}

${helpText}
`
        );
      }
    } else if (err) {
      defaultLogger.error(`Unable to send telemetry to Google Cloud: ${err}`);
    }
  };
}
function __getMetricExporterForTesting() {
  return metricExporter;
}
function __getSpanExporterForTesting() {
  return spanExporter.getExporter();
}
function __forceFlushSpansForTesting() {
  spanProcessor.forceFlush();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GcpOpenTelemetry,
  __forceFlushSpansForTesting,
  __getMetricExporterForTesting,
  __getSpanExporterForTesting
});
//# sourceMappingURL=gcpOpenTelemetry.js.map