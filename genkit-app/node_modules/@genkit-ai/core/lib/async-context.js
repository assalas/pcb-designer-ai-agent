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
var async_context_exports = {};
__export(async_context_exports, {
  getAsyncContext: () => getAsyncContext,
  setAsyncContext: () => setAsyncContext
});
module.exports = __toCommonJS(async_context_exports);
var import_error = require("./error.js");
const asyncContextKey = "__genkit_AsyncContext";
function getAsyncContext() {
  if (!global[asyncContextKey]) {
    throw new import_error.GenkitError({
      status: "FAILED_PRECONDITION",
      message: "Async context is not initialized."
    });
  }
  return global[asyncContextKey];
}
function setAsyncContext(context) {
  if (global[asyncContextKey]) return;
  global[asyncContextKey] = context;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAsyncContext,
  setAsyncContext
});
//# sourceMappingURL=async-context.js.map