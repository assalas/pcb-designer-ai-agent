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
var chunk_exports = {};
__export(chunk_exports, {
  GenerateResponseChunk: () => GenerateResponseChunk
});
module.exports = __toCommonJS(chunk_exports);
var import_core = require("@genkit-ai/core");
var import_extract = require("../extract.js");
class GenerateResponseChunk {
  /** The index of the message this chunk corresponds to, starting with `0` for the first model response of the generation. */
  index;
  /** The role of the message this chunk corresponds to. Will always be `model` or `tool`. */
  role;
  /** The content generated in this chunk. */
  content;
  /** Custom model-specific data for this chunk. */
  custom;
  /** Accumulated chunks for partial output extraction. */
  previousChunks;
  /** The parser to be used to parse `output` from this chunk. */
  parser;
  constructor(data, options) {
    this.content = data.content || [];
    this.custom = data.custom;
    this.previousChunks = options.previousChunks ? [...options.previousChunks] : void 0;
    this.index = options.index;
    this.role = options.role;
    this.parser = options.parser;
  }
  /**
   * Concatenates all `text` parts present in the chunk with no delimiter.
   * @returns A string of all concatenated text parts.
   */
  get text() {
    return this.content.map((part) => part.text || "").join("");
  }
  /**
   * Concatenates all `reasoning` parts present in the chunk with no delimiter.
   * @returns A string of all concatenated reasoning parts.
   */
  get reasoning() {
    return this.content.map((part) => part.reasoning || "").join("");
  }
  /**
   * Concatenates all `text` parts of all chunks from the response thus far.
   * @returns A string of all concatenated chunk text content.
   */
  get accumulatedText() {
    return this.previousText + this.text;
  }
  /**
   * Concatenates all `text` parts of all preceding chunks.
   */
  get previousText() {
    if (!this.previousChunks)
      throw new import_core.GenkitError({
        status: "FAILED_PRECONDITION",
        message: "Cannot compose accumulated text without previous chunks."
      });
    return this.previousChunks?.map((c) => c.content.map((p) => p.text || "").join("")).join("");
  }
  /**
   * Returns the first media part detected in the chunk. Useful for extracting
   * (for example) an image from a generation expected to create one.
   * @returns The first detected `media` part in the chunk.
   */
  get media() {
    return this.content.find((part) => part.media)?.media || null;
  }
  /**
   * Returns the first detected `data` part of a chunk.
   * @returns The first `data` part detected in the chunk (if any).
   */
  get data() {
    return this.content.find((part) => part.data)?.data;
  }
  /**
   * Returns all tool request found in this chunk.
   * @returns Array of all tool request found in this chunk.
   */
  get toolRequests() {
    return this.content.filter(
      (part) => !!part.toolRequest
    );
  }
  /**
   * Parses the chunk into the desired output format using the parser associated
   * with the generate request, or falls back to naive JSON parsing otherwise.
   */
  get output() {
    if (this.parser) return this.parser(this);
    return this.data || (0, import_extract.extractJson)(this.accumulatedText);
  }
  toJSON() {
    const data = {
      role: this.role,
      index: this.index,
      content: this.content
    };
    if (this.custom) {
      data.custom = this.custom;
    }
    return data;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GenerateResponseChunk
});
//# sourceMappingURL=chunk.js.map