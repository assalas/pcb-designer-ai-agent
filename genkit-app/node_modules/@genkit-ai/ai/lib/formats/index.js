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
var formats_exports = {};
__export(formats_exports, {
  DEFAULT_FORMATS: () => DEFAULT_FORMATS,
  configureFormats: () => configureFormats,
  defineFormat: () => defineFormat,
  injectInstructions: () => injectInstructions,
  resolveFormat: () => resolveFormat,
  resolveInstructions: () => resolveInstructions
});
module.exports = __toCommonJS(formats_exports);
var import_array = require("./array.js");
var import_enum = require("./enum.js");
var import_json = require("./json.js");
var import_jsonl = require("./jsonl.js");
var import_text = require("./text.js");
function defineFormat(registry, options, handler) {
  const { name, ...config } = options;
  const formatter = { config, handler };
  registry.registerValue("format", name, formatter);
  return formatter;
}
async function resolveFormat(registry, outputOpts) {
  if (!outputOpts) return void 0;
  if ((outputOpts.jsonSchema || outputOpts.schema) && !outputOpts.format) {
    return registry.lookupValue("format", "json");
  }
  if (outputOpts.format) {
    return registry.lookupValue("format", outputOpts.format);
  }
  return void 0;
}
function resolveInstructions(format, schema, instructionsOption) {
  if (typeof instructionsOption === "string") return instructionsOption;
  if (instructionsOption === false) return void 0;
  if (!format) return void 0;
  return format.handler(schema).instructions;
}
function injectInstructions(messages, instructions) {
  if (!instructions) return messages;
  if (messages.find(
    (m2) => m2.content.find(
      (p) => p.metadata?.purpose === "output" && !p.metadata?.pending
    )
  )) {
    return messages;
  }
  const newPart = {
    text: instructions,
    metadata: { purpose: "output" }
  };
  let targetIndex = messages.findIndex((m2) => m2.role === "system");
  if (targetIndex < 0)
    targetIndex = messages.map((m2) => m2.role).lastIndexOf("user");
  if (targetIndex < 0) return messages;
  const m = {
    ...messages[targetIndex],
    content: [...messages[targetIndex].content]
  };
  const partIndex = m.content.findIndex(
    (p) => p.metadata?.purpose === "output" && p.metadata?.pending
  );
  if (partIndex > 0) {
    m.content.splice(partIndex, 1, newPart);
  } else {
    m.content.push(newPart);
  }
  const outMessages = [...messages];
  outMessages.splice(targetIndex, 1, m);
  return outMessages;
}
const DEFAULT_FORMATS = [
  import_json.jsonFormatter,
  import_array.arrayFormatter,
  import_text.textFormatter,
  import_enum.enumFormatter,
  import_jsonl.jsonlFormatter
];
function configureFormats(registry) {
  for (const format of DEFAULT_FORMATS) {
    defineFormat(
      registry,
      { name: format.name, ...format.config },
      format.handler
    );
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_FORMATS,
  configureFormats,
  defineFormat,
  injectInstructions,
  resolveFormat,
  resolveInstructions
});
//# sourceMappingURL=index.js.map