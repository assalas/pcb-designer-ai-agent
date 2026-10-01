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
var node_exports = {};
__export(node_exports, {
  initNodeFeatures: () => initNodeFeatures
});
module.exports = __toCommonJS(node_exports);
var import_node_async_context = require("./node-async-context.js");
var import_node_telemetry_provider = require("./tracing/node-telemetry-provider.js");
function initNodeFeatures() {
  (0, import_node_async_context.initNodeAsyncContext)();
  (0, import_node_telemetry_provider.initNodeTelemetryProvider)();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initNodeFeatures
});
//# sourceMappingURL=node.js.map