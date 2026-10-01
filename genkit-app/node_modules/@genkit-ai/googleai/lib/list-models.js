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
var list_models_exports = {};
__export(list_models_exports, {
  listModels: () => listModels
});
module.exports = __toCommonJS(list_models_exports);
async function listModels(baseUrl, apiKey) {
  const res = await fetch(
    `${baseUrl}/v1beta/models?pageSize=1000&key=${apiKey}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
  const modelResponse = JSON.parse(await res.text());
  return modelResponse.models;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  listModels
});
//# sourceMappingURL=list-models.js.map