import { logger } from "genkit/logging";
import { GoogleAuth, auth } from "google-auth-library";
async function credentialsFromEnvironment() {
  let authClient;
  const options = {};
  if (process.env.GCLOUD_SERVICE_ACCOUNT_CREDS) {
    logger.debug("Retrieving credentials from GCLOUD_SERVICE_ACCOUNT_CREDS");
    const serviceAccountCreds = JSON.parse(
      process.env.GCLOUD_SERVICE_ACCOUNT_CREDS
    );
    const authOptions = { credentials: serviceAccountCreds };
    authClient = new GoogleAuth(authOptions);
    options.credentials = await authClient.getCredentials();
  } else {
    authClient = new GoogleAuth();
  }
  try {
    const projectId = await authClient.getProjectId();
    if (projectId && projectId.length > 0) {
      options.projectId = projectId;
    }
  } catch (error) {
    logger.warn(error);
  }
  return options;
}
async function resolveCurrentPrincipal() {
  const envCredentials = await credentialsFromEnvironment();
  let adcCredentials = {};
  try {
    adcCredentials = await auth.getCredentials();
  } catch (e) {
    logger.debug("Could not retrieve client_email from ADC.");
  }
  const serviceAccountEmail = envCredentials.credentials?.client_email ?? adcCredentials.client_email;
  return {
    projectId: envCredentials.projectId,
    serviceAccountEmail
  };
}
export {
  credentialsFromEnvironment,
  resolveCurrentPrincipal
};
//# sourceMappingURL=auth.mjs.map