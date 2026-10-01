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
var index_exports = {};
__export(index_exports, {
  defineFirestoreRetriever: () => import_firestore_retriever.defineFirestoreRetriever,
  enableFirebaseTelemetry: () => enableFirebaseTelemetry
});
module.exports = __toCommonJS(index_exports);
var import_google_cloud = require("@genkit-ai/google-cloud");
var import_logging = require("genkit/logging");
var import_firestore_retriever = require("./firestore-retriever.js");
/**
 * @license
 *
 * Copyright 2024 Google LLC
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
async function enableFirebaseTelemetry(options) {
  import_logging.logger.debug("Initializing Firebase Genkit Monitoring.");
  await (0, import_google_cloud.enableGoogleCloudTelemetry)(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  defineFirestoreRetriever,
  enableFirebaseTelemetry
});
//# sourceMappingURL=index.js.map