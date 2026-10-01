import * as winston from 'winston';
import { Writable } from 'stream';
import { GcpTelemetryConfig } from './types.js';
import '@opentelemetry/auto-instrumentations-node';
import '@opentelemetry/instrumentation';
import '@opentelemetry/sdk-trace-base';
import 'google-auth-library';

/**
 * Provides a logger for exporting Genkit debug logs to GCP Cloud
 * logs.
 */
declare class GcpLogger {
    private readonly config;
    constructor(config: GcpTelemetryConfig);
    getLogger(env: string): Promise<winston.Logger>;
    private getErrorHandler;
    private shouldExport;
}
/** @hidden */
declare function __addTransportStreamForTesting(stream: Writable): void;
/** @hidden */
declare function __useJsonFormatForTesting(): void;

export { GcpLogger, __addTransportStreamForTesting, __useJsonFormatForTesting };
