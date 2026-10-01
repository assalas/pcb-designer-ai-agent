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
var vertexai_exports = {};
__export(vertexai_exports, {
  default: () => vertexai_default,
  vertexAI: () => vertexAI
});
module.exports = __toCommonJS(vertexai_exports);
var import_plugin = require("genkit/plugin");
var import_client = require("./client.js");
var embedder = __toESM(require("./embedder.js"));
var gemini = __toESM(require("./gemini.js"));
var imagen = __toESM(require("./imagen.js"));
var lyria = __toESM(require("./lyria.js"));
var veo = __toESM(require("./veo.js"));
var import_utils = require("./utils.js");
/**
 * @license
 *
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function initializer(pluginOptions) {
  const clientOptions = await (0, import_utils.getDerivedOptions)(pluginOptions);
  return [
    ...veo.listKnownModels(clientOptions, pluginOptions),
    ...imagen.listKnownModels(clientOptions, pluginOptions),
    ...lyria.listKnownModels(clientOptions, pluginOptions),
    ...gemini.listKnownModels(clientOptions, pluginOptions),
    ...embedder.listKnownModels(clientOptions, pluginOptions)
  ];
}
async function resolver(actionType, actionName, pluginOptions) {
  const clientOptions = await (0, import_utils.getDerivedOptions)(pluginOptions);
  switch (actionType) {
    case "model":
      if (lyria.isLyriaModelName(actionName)) {
        return lyria.defineModel(actionName, clientOptions, pluginOptions);
      } else if (imagen.isImagenModelName(actionName)) {
        return imagen.defineModel(actionName, clientOptions, pluginOptions);
      } else if (veo.isVeoModelName(actionName)) {
        return void 0;
      } else {
        return gemini.defineModel(actionName, clientOptions, pluginOptions);
      }
      break;
    case "background-model":
      if (veo.isVeoModelName(actionName)) {
        return veo.defineModel(actionName, clientOptions, pluginOptions);
      }
      break;
    case "embedder":
      return embedder.defineEmbedder(actionName, clientOptions, pluginOptions);
      break;
  }
  return void 0;
}
async function listActions(options) {
  try {
    const clientOptions = await (0, import_utils.getDerivedOptions)(options);
    const models = await (0, import_client.listModels)(clientOptions);
    return [
      ...gemini.listActions(models),
      ...imagen.listActions(models),
      ...lyria.listActions(models),
      ...veo.listActions(models)
      // We don't list embedders here
    ];
  } catch (e) {
    return [];
  }
}
function vertexAIPlugin(options) {
  let listActionsCache;
  return (0, import_plugin.genkitPluginV2)({
    name: "vertexai",
    init: async () => await initializer(options),
    resolve: async (actionType, actionName) => await resolver(actionType, actionName, options),
    list: async () => {
      if (listActionsCache) return listActionsCache;
      listActionsCache = await listActions(options);
      return listActionsCache;
    }
  });
}
const vertexAI = vertexAIPlugin;
vertexAI.model = (name, config) => {
  if (imagen.isImagenModelName(name)) {
    return imagen.model(name, config);
  }
  if (lyria.isLyriaModelName(name)) {
    return lyria.model(name, config);
  }
  if (veo.isVeoModelName(name)) {
    return veo.model(name, config);
  }
  return gemini.model(name, config);
};
vertexAI.embedder = (name, config) => {
  return embedder.model(name, config);
};
var vertexai_default = vertexAI;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  vertexAI
});
//# sourceMappingURL=index.js.map