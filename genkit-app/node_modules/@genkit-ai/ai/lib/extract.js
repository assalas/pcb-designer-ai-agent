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
var extract_exports = {};
__export(extract_exports, {
  extractItems: () => extractItems,
  extractJson: () => extractJson,
  parsePartialJson: () => parsePartialJson
});
module.exports = __toCommonJS(extract_exports);
var import_json5 = __toESM(require("json5"));
var import_partial_json = require("partial-json");
function parsePartialJson(jsonString) {
  return import_json5.default.parse(JSON.stringify((0, import_partial_json.parse)(jsonString, import_partial_json.Allow.ALL)));
}
function extractJson(text, throwOnBadJson) {
  let openingChar;
  let closingChar;
  let startPos;
  let nestingCount = 0;
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i].replace(/\u00A0/g, " ");
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === "\\") {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (!openingChar && (char === "{" || char === "[")) {
      openingChar = char;
      closingChar = char === "{" ? "}" : "]";
      startPos = i;
      nestingCount++;
    } else if (char === openingChar) {
      nestingCount++;
    } else if (char === closingChar) {
      nestingCount--;
      if (!nestingCount) {
        return import_json5.default.parse(text.substring(startPos || 0, i + 1));
      }
    }
  }
  if (startPos !== void 0 && nestingCount > 0) {
    try {
      return parsePartialJson(text.substring(startPos));
    } catch {
      if (throwOnBadJson) {
        throw new Error(`Invalid JSON extracted from model output: ${text}`);
      }
      return null;
    }
  }
  if (throwOnBadJson) {
    throw new Error(`Invalid JSON extracted from model output: ${text}`);
  }
  return null;
}
function extractItems(text, cursor = 0) {
  const items = [];
  let currentCursor = cursor;
  if (cursor === 0) {
    const arrayStart = text.indexOf("[");
    if (arrayStart === -1) {
      return { items: [], cursor: text.length };
    }
    currentCursor = arrayStart + 1;
  }
  let objectStart = -1;
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  for (let i = currentCursor; i < text.length; i++) {
    const char = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === "\\") {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === "{") {
      if (braceCount === 0) {
        objectStart = i;
      }
      braceCount++;
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0 && objectStart !== -1) {
        try {
          const obj = import_json5.default.parse(text.substring(objectStart, i + 1));
          items.push(obj);
          currentCursor = i + 1;
          objectStart = -1;
        } catch {
        }
      }
    } else if (char === "]" && braceCount === 0) {
      break;
    }
  }
  return {
    items,
    cursor: currentCursor
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  extractItems,
  extractJson,
  parsePartialJson
});
//# sourceMappingURL=extract.js.map