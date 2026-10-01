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
var node_async_context_exports = {};
__export(node_async_context_exports, {
  NodeAsyncContext: () => NodeAsyncContext,
  initNodeAsyncContext: () => initNodeAsyncContext
});
module.exports = __toCommonJS(node_async_context_exports);
var import_node_async_hooks = require("node:async_hooks");
var import_async_context = require("./async-context.js");
class NodeAsyncContext {
  asls = {};
  getStore(key) {
    return this.asls[key]?.getStore();
  }
  run(key, store, callback) {
    if (!this.asls[key]) {
      this.asls[key] = new import_node_async_hooks.AsyncLocalStorage();
    }
    return this.asls[key].run(store, callback);
  }
}
function initNodeAsyncContext() {
  (0, import_async_context.setAsyncContext)(new NodeAsyncContext());
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NodeAsyncContext,
  initNodeAsyncContext
});
//# sourceMappingURL=node-async-context.js.map