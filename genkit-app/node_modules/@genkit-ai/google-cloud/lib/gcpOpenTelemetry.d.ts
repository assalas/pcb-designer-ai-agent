import { InMemoryMetricExporter } from '@opentelemetry/sdk-metrics';
import { NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { GcpTelemetryConfig } from './types.js';
import '@opentelemetry/auto-instrumentations-node';
import '@opentelemetry/instrumentation';
import 'google-auth-library';

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

/**
 * Provides a {TelemetryConfig} for exporting OpenTelemetry data (Traces,
 * Metrics, and Logs) to the Google Cloud Operations Suite.
 */
declare class GcpOpenTelemetry {
    private readonly config;
    private readonly resource;
    constructor(config: GcpTelemetryConfig);
    /**
     * Log hook for writing trace and span metadata to log messages in the format
     * required by GCP.
     */
    private gcpTraceLogHook;
    getConfig(): Promise<Partial<NodeSDKConfiguration>>;
    private createSpanExporter;
    /**
     * Creates a {MetricReader} for pushing metrics out to GCP via OpenTelemetry.
     */
    private createMetricReader;
    /** Gets all open telemetry instrumentations as configured by the plugin. */
    private getInstrumentations;
    private shouldExportTraces;
    private shouldExportMetrics;
    /** Always configure the Pino and Winston instrumentations */
    private getDefaultLoggingInstrumentations;
    private buildMetricExporter;
}
/** @hidden */
declare function __getMetricExporterForTesting(): InMemoryMetricExporter;
/** @hidden */
declare function __getSpanExporterForTesting(): InMemorySpanExporter;
/** @hidden */
declare function __forceFlushSpansForTesting(): void;

export { GcpOpenTelemetry, __forceFlushSpansForTesting, __getMetricExporterForTesting, __getSpanExporterForTesting };
