import JSON5 from "json5";
import { Allow, parse } from "partial-json";
function parsePartialJson(jsonString) {
  return JSON5.parse(JSON.stringify(parse(jsonString, Allow.ALL)));
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
        return JSON5.parse(text.substring(startPos || 0, i + 1));
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
          const obj = JSON5.parse(text.substring(objectStart, i + 1));
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
export {
  extractItems,
  extractJson,
  parsePartialJson
};
//# sourceMappingURL=extract.mjs.map