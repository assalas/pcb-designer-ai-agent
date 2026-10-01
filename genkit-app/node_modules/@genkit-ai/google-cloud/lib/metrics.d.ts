import { Meter, Counter, Histogram } from '@opentelemetry/api';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';

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

declare const METER_NAME = "genkit";
declare const METRIC_NAME_PREFIX = "genkit";
declare function internalMetricNamespaceWrap(...namespaces: any[]): string;
type MetricCreateFn<T> = (meter: Meter) => T;
/**
 * Wrapper for OpenTelemetry metrics.
 *
 * The OpenTelemetry {MeterProvider} can only be accessed through the metrics
 * API after the NodeSDK library has been initialized. To prevent race
 * conditions we defer the instantiation of the metric to when it is first
 * ticked.
 */
declare class Metric<T> {
    readonly createFn: MetricCreateFn<T>;
    readonly meterName: string;
    metric?: T;
    constructor(createFn: MetricCreateFn<T>, meterName?: string);
    get(): T;
}
/**
 * Wrapper for an OpenTelemetry Counter.
 *
 * By using this wrapper, we defer initialization of the counter until it is
 * need, which ensures that the OpenTelemetry SDK has been initialized before
 * the metric has been defined.
 */
declare class MetricCounter extends Metric<Counter> {
    constructor(name: string, options: any);
    add(val?: number, opts?: any): void;
}
/**
 * Wrapper for an OpenTelemetry Histogram.
 *
 * By using this wrapper, we defer initialization of the counter until it is
 * need, which ensures that the OpenTelemetry SDK has been initialized before
 * the metric has been defined.
 */
declare class MetricHistogram extends Metric<Histogram> {
    constructor(name: string, options: any);
    record(val?: number, opts?: any): void;
}
interface Telemetry {
    tick(span: ReadableSpan, logIO: boolean, projectId?: string): void;
}

export { METER_NAME, METRIC_NAME_PREFIX, MetricCounter, MetricHistogram, type Telemetry, internalMetricNamespaceWrap };
