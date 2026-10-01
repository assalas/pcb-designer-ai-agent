import { GcpTelemetryConfig, GcpPrincipal } from './types.mjs';
import '@opentelemetry/auto-instrumentations-node';
import '@opentelemetry/instrumentation';
import '@opentelemetry/sdk-trace-base';
import 'google-auth-library';

/**
 * Allows Google Cloud credentials to be to passed in "raw" as an environment
 * variable. This is helpful in environments where the developer has limited
 * ability to configure their compute environment, but does have the ablilty to
 * set environment variables.
 *
 * This is different from the GOOGLE_APPLICATION_CREDENTIALS used by ADC, which
 * represents a path to a credential file on disk. In *most* cases, even for
 * 3rd party cloud providers, developers *should* attempt to use ADC, which
 * searches for credential files in standard locations, before using this
 * method.
 *
 * See also: https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#loading-credentials-from-environment-variables
 */
declare function credentialsFromEnvironment(): Promise<Partial<GcpTelemetryConfig>>;
/**
 * Resolve the currently configured principal, either from the Genkit specific
 * GCLOUD_SERVICE_ACCOUNT_CREDS environment variable, or from ADC.
 *
 * Since the Google Cloud Telemetry Exporter will discover credentials on its
 * own, we don't immediately have access to the current principal. This method
 * can be handy to get access to the current credential for logging debugging
 * information or other purposes.
 **/
declare function resolveCurrentPrincipal(): Promise<GcpPrincipal>;

export { credentialsFromEnvironment, resolveCurrentPrincipal };
