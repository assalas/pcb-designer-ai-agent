import { getClientHeader as defaultGetClientHeader } from "genkit";
import process from "process";
function getApiKeyFromEnvVar() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
}
function getGenkitClientHeader() {
  if (process.env.MONOSPACE_ENV == "true") {
    return defaultGetClientHeader() + " firebase-studio-vm";
  }
  return defaultGetClientHeader();
}
export {
  getApiKeyFromEnvVar,
  getGenkitClientHeader
};
//# sourceMappingURL=common.mjs.map