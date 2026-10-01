"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var predict_exports = {};
__export(predict_exports, {
  checkOp: () => checkOp,
  predictModel: () => predictModel
});
module.exports = __toCommonJS(predict_exports);
var import_common = require("./common");
function predictEndpoint(options) {
  return `https://generativelanguage.googleapis.com/${options.apiVersion}/models/${options.model}:${options.method}?key=${options.apiKey}`;
}
function opCheckEndpoint(options) {
  return `https://generativelanguage.googleapis.com/${options.apiVersion}/${options.operation}?key=${options.apiKey}`;
}
function predictModel(model, apiKey, method) {
  return async (instances, parameters) => {
    const fetch = (await import("node-fetch")).default;
    const req = {
      instances,
      parameters
    };
    const response = await fetch(
      predictEndpoint({
        model,
        apiVersion: "v1beta",
        apiKey,
        method
      }),
      {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Client": (0, import_common.getGenkitClientHeader)()
        }
      }
    );
    if (!response.ok) {
      throw new Error(
        `Error from Gemini AI predict: HTTP ${response.status}: ${await response.text()}`
      );
    }
    return await response.json();
  };
}
async function checkOp(operation, apiKey) {
  const fetch = (await import("node-fetch")).default;
  const response = await fetch(
    opCheckEndpoint({
      apiVersion: "v1beta",
      operation,
      apiKey
    }),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Client": (0, import_common.getGenkitClientHeader)()
      }
    }
  );
  if (!response.ok) {
    throw new Error(
      `Error from operation API: HTTP ${response.status}: ${await response.text()}`
    );
  }
  return await response.json();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkOp,
  predictModel
});
//# sourceMappingURL=predict.js.map