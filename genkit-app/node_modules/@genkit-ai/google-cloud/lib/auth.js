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
var auth_exports = {};
__export(auth_exports, {
  credentialsFromEnvironment: () => credentialsFromEnvironment,
  resolveCurrentPrincipal: () => resolveCurrentPrincipal
});
module.exports = __toCommonJS(auth_exports);
var import_logging = require("genkit/logging");
var import_google_auth_library = require("google-auth-library");
async function credentialsFromEnvironment() {
  let authClient;
  const options = {};
  if (process.env.GCLOUD_SERVICE_ACCOUNT_CREDS) {
    import_logging.logger.debug("Retrieving credentials from GCLOUD_SERVICE_ACCOUNT_CREDS");
    const serviceAccountCreds = JSON.parse(
      process.env.GCLOUD_SERVICE_ACCOUNT_CREDS
    );
    const authOptions = { credentials: serviceAccountCreds };
    authClient = new import_google_auth_library.GoogleAuth(authOptions);
    options.credentials = await authClient.getCredentials();
  } else {
    authClient = new import_google_auth_library.GoogleAuth();
  }
  try {
    const projectId = await authClient.getProjectId();
    if (projectId && projectId.length > 0) {
      options.projectId = projectId;
    }
  } catch (error) {
    import_logging.logger.warn(error);
  }
  return options;
}
async function resolveCurrentPrincipal() {
  const envCredentials = await credentialsFromEnvironment();
  let adcCredentials = {};
  try {
    adcCredentials = await import_google_auth_library.auth.getCredentials();
  } catch (e) {
    import_logging.logger.debug("Could not retrieve client_email from ADC.");
  }
  const serviceAccountEmail = envCredentials.credentials?.client_email ?? adcCredentials.client_email;
  return {
    projectId: envCredentials.projectId,
    serviceAccountEmail
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  credentialsFromEnvironment,
  resolveCurrentPrincipal
});
//# sourceMappingURL=auth.js.map