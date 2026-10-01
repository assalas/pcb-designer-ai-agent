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
var metrics_exports = {};
__export(metrics_exports, {
  METER_NAME: () => METER_NAME,
  METRIC_NAME_PREFIX: () => METRIC_NAME_PREFIX,
  MetricCounter: () => MetricCounter,
  MetricHistogram: () => MetricHistogram,
  internalMetricNamespaceWrap: () => internalMetricNamespaceWrap
});
module.exports = __toCommonJS(metrics_exports);
var import_api = require("@opentelemetry/api");
const METER_NAME = "genkit";
const METRIC_NAME_PREFIX = "genkit";
const METRIC_DIMENSION_MAX_CHARS = 256;
function internalMetricNamespaceWrap(...namespaces) {
  return [METRIC_NAME_PREFIX, ...namespaces].join("/");
}
class Metric {
  createFn;
  meterName;
  metric;
  constructor(createFn, meterName = METER_NAME) {
    this.meterName = meterName;
    this.createFn = createFn;
  }
  get() {
    if (!this.metric) {
      this.metric = this.createFn(
        import_api.metrics.getMeterProvider().getMeter(this.meterName)
      );
    }
    return this.metric;
  }
}
class MetricCounter extends Metric {
  constructor(name, options) {
    super((meter) => meter.createCounter(name, options));
  }
  add(val, opts) {
    if (val) {
      truncateDimensions(opts);
      this.get().add(val, opts);
    }
  }
}
class MetricHistogram extends Metric {
  constructor(name, options) {
    super((meter) => meter.createHistogram(name, options));
  }
  record(val, opts) {
    if (val) {
      truncateDimensions(opts);
      this.get().record(val, opts);
    }
  }
}
function truncateDimensions(opts) {
  if (opts) {
    Object.keys(opts).forEach((k) => {
      if (typeof opts[k] === "string") {
        opts[k] = opts[k].substring(0, METRIC_DIMENSION_MAX_CHARS);
      }
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  METER_NAME,
  METRIC_NAME_PREFIX,
  MetricCounter,
  MetricHistogram,
  internalMetricNamespaceWrap
});
//# sourceMappingURL=metrics.js.map