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
var context_exports = {};
__export(context_exports, {
  apiKey: () => apiKey,
  getContext: () => getContext,
  runWithContext: () => runWithContext
});
module.exports = __toCommonJS(context_exports);
var import_action = require("./action.js");
var import_async_context = require("./async-context.js");
var import_error = require("./error.js");
const contextAlsKey = "core.auth.context";
function runWithContext(context, fn) {
  if (context === void 0) {
    return fn();
  }
  return (0, import_async_context.getAsyncContext)().run(
    contextAlsKey,
    context,
    () => (0, import_action.runInActionRuntimeContext)(fn)
  );
}
function getContext() {
  return (0, import_async_context.getAsyncContext)().getStore(contextAlsKey);
}
function apiKey(valueOrPolicy) {
  return async (request) => {
    const context = {
      auth: { apiKey: request.headers["authorization"] }
    };
    if (typeof valueOrPolicy === "string") {
      if (!context.auth?.apiKey) {
        console.error("THROWING UNAUTHENTICATED");
        throw new import_error.UserFacingError("UNAUTHENTICATED", "Unauthenticated");
      }
      if (context.auth?.apiKey != valueOrPolicy) {
        console.error("Throwing PERMISSION_DENIED");
        throw new import_error.UserFacingError("PERMISSION_DENIED", "Permission Denied");
      }
    } else if (typeof valueOrPolicy === "function") {
      await valueOrPolicy(context);
    } else if (typeof valueOrPolicy !== "undefined") {
      throw new Error(
        `Invalid type ${typeof valueOrPolicy} passed to apiKey()`
      );
    }
    return context;
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  apiKey,
  getContext,
  runWithContext
});
//# sourceMappingURL=context.js.map