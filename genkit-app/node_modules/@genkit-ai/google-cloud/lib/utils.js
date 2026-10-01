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
var utils_exports = {};
__export(utils_exports, {
  createCommonLogAttributes: () => createCommonLogAttributes,
  extractErrorMessage: () => extractErrorMessage,
  extractErrorName: () => extractErrorName,
  extractErrorStack: () => extractErrorStack,
  extractOuterFeatureNameFromPath: () => extractOuterFeatureNameFromPath,
  extractOuterFlowNameFromPath: () => extractOuterFlowNameFromPath,
  loggingDenied: () => loggingDenied,
  loggingDeniedHelpText: () => loggingDeniedHelpText,
  metricsDenied: () => metricsDenied,
  metricsDeniedHelpText: () => metricsDeniedHelpText,
  permissionDeniedHelpText: () => permissionDeniedHelpText,
  requestDenied: () => requestDenied,
  tracingDenied: () => tracingDenied,
  tracingDeniedHelpText: () => tracingDeniedHelpText,
  truncate: () => truncate,
  truncatePath: () => truncatePath
});
module.exports = __toCommonJS(utils_exports);
var import_api = require("@opentelemetry/api");
var import_auth = require("./auth.js");
const MAX_LOG_CONTENT_CHARS = 128e3;
const MAX_PATH_CHARS = 4096;
function extractOuterFlowNameFromPath(path) {
  if (!path || path === "<unknown>") {
    return "<unknown>";
  }
  const flowName = path.match("/{(.+),t:flow}+");
  return flowName ? flowName[1] : "<unknown>";
}
function truncate(text, limit = MAX_LOG_CONTENT_CHARS) {
  return text ? text.substring(0, limit) : text;
}
function truncatePath(path) {
  return truncate(path, MAX_PATH_CHARS);
}
function extractOuterFeatureNameFromPath(path) {
  if (!path || path === "<unknown>") {
    return "<unknown>";
  }
  const first = path.split("/")[1];
  const featureName = first?.match(
    "{(.+),t:(flow|action|prompt|dotprompt|helper)"
  );
  return featureName ? featureName[1] : "<unknown>";
}
function extractErrorName(events) {
  return events.filter((event) => event.name === "exception").map((event) => {
    const attributes = event.attributes;
    return attributes ? truncate(attributes["exception.type"], 1024) : "<unknown>";
  }).at(0);
}
function extractErrorMessage(events) {
  return events.filter((event) => event.name === "exception").map((event) => {
    const attributes = event.attributes;
    return attributes ? truncate(attributes["exception.message"], 4096) : "<unknown>";
  }).at(0);
}
function extractErrorStack(events) {
  return events.filter((event) => event.name === "exception").map((event) => {
    const attributes = event.attributes;
    return attributes ? truncate(attributes["exception.stacktrace"], 32768) : "<unknown>";
  }).at(0);
}
function createCommonLogAttributes(span, projectId) {
  const spanContext = span.spanContext();
  const isSampled = !!(spanContext.traceFlags & import_api.TraceFlags.SAMPLED);
  return {
    "logging.googleapis.com/spanId": spanContext.spanId,
    "logging.googleapis.com/trace": `projects/${projectId}/traces/${spanContext.traceId}`,
    "logging.googleapis.com/trace_sampled": isSampled ? "1" : "0"
  };
}
function requestDenied(err) {
  return err.code === 7;
}
function loggingDenied(err) {
  return requestDenied(err) && err.statusDetails?.some((details) => {
    return details?.metadata?.permission === "logging.logEntries.create";
  });
}
function tracingDenied(err) {
  return requestDenied(err);
}
function metricsDenied(err) {
  return requestDenied(err);
}
async function permissionDeniedHelpText(role) {
  const principal = await (0, import_auth.resolveCurrentPrincipal)();
  return `Add the role '${role}' to your Service Account in the IAM & Admin page on the Google Cloud console, or use the following command:

gcloud projects add-iam-policy-binding ${principal.projectId ?? "${PROJECT_ID}"} \\
    --member=serviceAccount:${principal.serviceAccountEmail || "${SERVICE_ACCT}"} \\
    --role=${role}`;
}
async function loggingDeniedHelpText() {
  return permissionDeniedHelpText("roles/logging.logWriter");
}
async function tracingDeniedHelpText() {
  return permissionDeniedHelpText("roles/cloudtrace.agent");
}
async function metricsDeniedHelpText() {
  return permissionDeniedHelpText("roles/monitoring.metricWriter");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCommonLogAttributes,
  extractErrorMessage,
  extractErrorName,
  extractErrorStack,
  extractOuterFeatureNameFromPath,
  extractOuterFlowNameFromPath,
  loggingDenied,
  loggingDeniedHelpText,
  metricsDenied,
  metricsDeniedHelpText,
  permissionDeniedHelpText,
  requestDenied,
  tracingDenied,
  tracingDeniedHelpText,
  truncate,
  truncatePath
});
//# sourceMappingURL=utils.js.map