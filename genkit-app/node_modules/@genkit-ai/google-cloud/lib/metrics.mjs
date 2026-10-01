import {
  metrics
} from "@opentelemetry/api";
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
        metrics.getMeterProvider().getMeter(this.meterName)
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
export {
  METER_NAME,
  METRIC_NAME_PREFIX,
  MetricCounter,
  MetricHistogram,
  internalMetricNamespaceWrap
};
//# sourceMappingURL=metrics.mjs.map