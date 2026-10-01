import { GcpTelemetryConfigOptions } from '@genkit-ai/google-cloud';
export { defineFirestoreRetriever } from './firestore-retriever.js';
import '@google-cloud/firestore';
import 'genkit';
import 'genkit/retriever';

/**
 * @license
 *
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
 * @module /
 */

interface FirebaseTelemetryOptions extends GcpTelemetryConfigOptions {
}
/**
 * Enables telemetry export to Genkit Monitoring, backed by the
 * Google Cloud Observability suite.
 *
 * @param options configuration options
 */
declare function enableFirebaseTelemetry(options?: FirebaseTelemetryOptions | GcpTelemetryConfigOptions): Promise<void>;

export { type FirebaseTelemetryOptions, enableFirebaseTelemetry };
