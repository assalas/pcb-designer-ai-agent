import {
  FunctionCallingMode,
  GoogleGenerativeAI,
  SchemaType
} from "@google/generative-ai";
import { GenkitError, z } from "genkit";
import {
  GenerationCommonConfigDescriptions,
  GenerationCommonConfigSchema,
  getBasicUsageStats,
  modelRef
} from "genkit/model";
import { downloadRequestMedia } from "genkit/model/middleware";
import { runInNewSpan } from "genkit/tracing";
import { getApiKeyFromEnvVar, getGenkitClientHeader } from "./common";
import { handleCacheIfNeeded } from "./context-caching";
import { extractCacheConfig } from "./context-caching/utils";
const SafetySettingsSchema = z.object({
  category: z.enum([
    "HARM_CATEGORY_UNSPECIFIED",
    "HARM_CATEGORY_HATE_SPEECH",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "HARM_CATEGORY_HARASSMENT",
    "HARM_CATEGORY_DANGEROUS_CONTENT",
    "HARM_CATEGORY_CIVIC_INTEGRITY"
  ]),
  threshold: z.enum([
    "BLOCK_LOW_AND_ABOVE",
    "BLOCK_MEDIUM_AND_ABOVE",
    "BLOCK_ONLY_HIGH",
    "BLOCK_NONE"
  ])
});
const VoiceConfigSchema = z.object({
  prebuiltVoiceConfig: z.object({
    // TODO: Make this an array of objects so we can also specify the description
    // for each voiceName.
    voiceName: z.union([
      z.enum([
        "Zephyr",
        "Puck",
        "Charon",
        "Kore",
        "Fenrir",
        "Leda",
        "Orus",
        "Aoede",
        "Callirrhoe",
        "Autonoe",
        "Enceladus",
        "Iapetus",
        "Umbriel",
        "Algieba",
        "Despina",
        "Erinome",
        "Algenib",
        "Rasalgethi",
        "Laomedeia",
        "Achernar",
        "Alnilam",
        "Schedar",
        "Gacrux",
        "Pulcherrima",
        "Achird",
        "Zubenelgenubi",
        "Vindemiatrix",
        "Sadachbia",
        "Sadaltager",
        "Sulafat"
      ]),
      // To allow any new string values
      z.string()
    ]).describe("Name of the preset voice to use").optional()
  }).describe("Configuration for the prebuilt speaker to use").passthrough().optional()
}).describe("Configuration for the voice to use").passthrough();
const GeminiConfigSchema = GenerationCommonConfigSchema.extend({
  temperature: z.number().min(0).max(2).describe(
    GenerationCommonConfigDescriptions.temperature + " The default value is 1.0."
  ).optional(),
  topP: z.number().min(0).max(1).describe(
    GenerationCommonConfigDescriptions.topP + " The default value is 0.95."
  ).optional(),
  apiKey: z.string().describe("Overrides the plugin-configured API key, if specified.").optional(),
  safetySettings: z.array(SafetySettingsSchema).describe(
    "Adjust how likely you are to see responses that could be harmful. Content is blocked based on the probability that it is harmful."
  ).optional(),
  codeExecution: z.union([z.boolean(), z.object({}).strict()]).describe("Enables the model to generate and run code.").optional(),
  contextCache: z.boolean().describe(
    "Context caching allows you to save and reuse precomputed input tokens that you wish to use repeatedly."
  ).optional(),
  functionCallingConfig: z.object({
    mode: z.enum(["MODE_UNSPECIFIED", "AUTO", "ANY", "NONE"]).optional(),
    allowedFunctionNames: z.array(z.string()).optional()
  }).describe(
    "Controls how the model uses the provided tools (function declarations). With AUTO (Default) mode, the model decides whether to generate a natural language response or suggest a function call based on the prompt and context. With ANY, the model is constrained to always predict a function call and guarantee function schema adherence. With NONE, the model is prohibited from making function calls."
  ).optional(),
  responseModalities: z.array(z.enum(["TEXT", "IMAGE", "AUDIO"])).describe(
    "The modalities to be used in response. Only supported for 'gemini-2.0-flash-exp' model at present."
  ).optional(),
  googleSearchRetrieval: z.union([z.boolean(), z.object({}).passthrough()]).describe(
    "Retrieve public web data for grounding, powered by Google Search."
  ).optional(),
  thinkingConfig: z.object({
    includeThoughts: z.boolean().describe(
      "Indicates whether to include thoughts in the response.If true, thoughts are returned only when available."
    ).optional(),
    thinkingBudget: z.number().min(0).max(24576).describe(
      "The thinking budget parameter gives the model guidance on the number of thinking tokens it can use when generating a response. A greater number of tokens is typically associated with more detailed thinking, which is needed for solving more complex tasks. Setting the thinking budget to 0 disables thinking."
    ).optional()
  }).optional()
}).passthrough();
const GeminiGemmaConfigSchema = GeminiConfigSchema.extend({
  temperature: z.number().min(0).max(1).describe(
    GenerationCommonConfigDescriptions.temperature + " The default value is 1.0."
  ).optional()
}).passthrough();
const GeminiTtsConfigSchema = GeminiConfigSchema.extend({
  speechConfig: z.object({
    voiceConfig: VoiceConfigSchema.optional(),
    multiSpeakerVoiceConfig: z.object({
      speakerVoiceConfigs: z.array(
        z.object({
          speaker: z.string().describe("Name of the speaker to use"),
          voiceConfig: VoiceConfigSchema
        }).describe(
          "Configuration for a single speaker in a multi speaker setup"
        ).passthrough()
      ).describe("Configuration for all the enabled speaker voices")
    }).describe("Configuration for multi-speaker setup").passthrough().optional()
  }).describe("Speech generation config").passthrough().optional()
}).passthrough();
const gemini10Pro = modelRef({
  name: "googleai/gemini-1.0-pro",
  info: {
    label: "Google AI - Gemini Pro",
    versions: ["gemini-pro", "gemini-1.0-pro-latest", "gemini-1.0-pro-001"],
    supports: {
      multiturn: true,
      media: false,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini15Pro = modelRef({
  name: "googleai/gemini-1.5-pro",
  info: {
    label: "Google AI - Gemini 1.5 Pro",
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    },
    versions: [
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro-001",
      "gemini-1.5-pro-002"
    ]
  },
  configSchema: GeminiConfigSchema
});
const gemini15Flash = modelRef({
  name: "googleai/gemini-1.5-flash",
  info: {
    label: "Google AI - Gemini 1.5 Flash",
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools",
      // @ts-ignore
      contextCache: true
    },
    versions: [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-001",
      "gemini-1.5-flash-002"
    ]
  },
  configSchema: GeminiConfigSchema
});
const gemini15Flash8b = modelRef({
  name: "googleai/gemini-1.5-flash-8b",
  info: {
    label: "Google AI - Gemini 1.5 Flash",
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    },
    versions: ["gemini-1.5-flash-8b-latest", "gemini-1.5-flash-8b-001"]
  },
  configSchema: GeminiConfigSchema
});
const gemini20Flash = modelRef({
  name: "googleai/gemini-2.0-flash",
  info: {
    label: "Google AI - Gemini 2.0 Flash",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini20FlashExp = modelRef({
  name: "googleai/gemini-2.0-flash-exp",
  info: {
    label: "Google AI - Gemini 2.0 Flash (Experimental)",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini20FlashLite = modelRef({
  name: "googleai/gemini-2.0-flash-lite",
  info: {
    label: "Google AI - Gemini 2.0 Flash Lite",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini20ProExp0205 = modelRef({
  name: "googleai/gemini-2.0-pro-exp-02-05",
  info: {
    label: "Google AI - Gemini 2.0 Pro Exp 02-05",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini25FlashPreview0417 = modelRef({
  name: "googleai/gemini-2.5-flash-preview-04-17",
  info: {
    label: "Google AI - Gemini 2.5 Flash Preview 04-17",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini25FlashPreviewTts = modelRef({
  name: "googleai/gemini-2.5-flash-preview-tts",
  info: {
    label: "Google AI - Gemini 2.5 Flash Preview TTS",
    versions: [],
    supports: {
      multiturn: false,
      media: false,
      tools: false,
      toolChoice: false,
      systemRole: false,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiTtsConfigSchema
});
const gemini25ProExp0325 = modelRef({
  name: "googleai/gemini-2.5-pro-exp-03-25",
  info: {
    label: "Google AI - Gemini 2.5 Pro Exp 03-25",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini25ProPreview0325 = modelRef({
  name: "googleai/gemini-2.5-pro-preview-03-25",
  info: {
    label: "Google AI - Gemini 2.5 Pro Preview 03-25",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini25ProPreviewTts = modelRef({
  name: "googleai/gemini-2.5-pro-preview-tts",
  info: {
    label: "Google AI - Gemini 2.5 Pro Preview TTS",
    versions: [],
    supports: {
      multiturn: false,
      media: false,
      tools: false,
      toolChoice: false,
      systemRole: false,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiTtsConfigSchema
});
const gemini25Pro = modelRef({
  name: "googleai/gemini-2.5-pro",
  info: {
    label: "Google AI - Gemini 2.5 Pro",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini25Flash = modelRef({
  name: "googleai/gemini-2.5-flash",
  info: {
    label: "Google AI - Gemini 2.5 Flash",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemini25FlashLite = modelRef({
  name: "googleai/gemini-2.5-flash-lite",
  info: {
    label: "Google AI - Gemini 2.5 Flash Lite",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiConfigSchema
});
const gemma312bit = modelRef({
  name: "googleai/gemma-3-12b-it",
  info: {
    label: "Google AI - Gemma 3 12B",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiGemmaConfigSchema
});
const gemma31bit = modelRef({
  name: "googleai/gemma-3-1b-it",
  info: {
    label: "Google AI - Gemma 3 1B",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiGemmaConfigSchema
});
const gemma327bit = modelRef({
  name: "googleai/gemma-3-27b-it",
  info: {
    label: "Google AI - Gemma 3 27B",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiGemmaConfigSchema
});
const gemma34bit = modelRef({
  name: "googleai/gemma-3-4b-it",
  info: {
    label: "Google AI - Gemma 3 4B",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiGemmaConfigSchema
});
const gemma3ne4bit = modelRef({
  name: "googleai/gemma-3n-e4b-it",
  info: {
    label: "Google AI - Gemma 3n E4B",
    versions: [],
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  },
  configSchema: GeminiGemmaConfigSchema
});
const SUPPORTED_GEMINI_MODELS = {
  "gemini-1.5-pro": gemini15Pro,
  "gemini-1.5-flash": gemini15Flash,
  "gemini-1.5-flash-8b": gemini15Flash8b,
  "gemini-2.0-pro-exp-02-05": gemini20ProExp0205,
  "gemini-2.0-flash": gemini20Flash,
  "gemini-2.0-flash-lite": gemini20FlashLite,
  "gemini-2.0-flash-exp": gemini20FlashExp,
  "gemini-2.5-pro-exp-03-25": gemini25ProExp0325,
  "gemini-2.5-pro-preview-03-25": gemini25ProPreview0325,
  "gemini-2.5-pro-preview-tts": gemini25ProPreviewTts,
  "gemini-2.5-flash-preview-04-17": gemini25FlashPreview0417,
  "gemini-2.5-flash-preview-tts": gemini25FlashPreviewTts,
  "gemini-2.5-flash": gemini25Flash,
  "gemini-2.5-flash-lite": gemini25FlashLite,
  "gemini-2.5-pro": gemini25Pro,
  "gemma-3-12b-it": gemma312bit,
  "gemma-3-1b-it": gemma31bit,
  "gemma-3-27b-it": gemma327bit,
  "gemma-3-4b-it": gemma34bit,
  "gemma-3n-e4b-it": gemma3ne4bit
};
const GENERIC_GEMINI_MODEL = modelRef({
  name: "googleai/gemini",
  configSchema: GeminiConfigSchema,
  info: {
    label: "Google Gemini",
    supports: {
      multiturn: true,
      media: true,
      tools: true,
      toolChoice: true,
      systemRole: true,
      constrained: "no-tools"
    }
  }
});
function longestMatchingPrefix(version, potentialMatches) {
  return potentialMatches.filter((p) => version.startsWith(p)).reduce(
    (longest, current) => current.length > longest.length ? current : longest,
    ""
  );
}
function gemini(version, options = {}) {
  const nearestModel = nearestGeminiModelRef(version);
  return modelRef({
    name: `googleai/${version}`,
    config: options,
    configSchema: GeminiConfigSchema,
    info: {
      ...nearestModel.info,
      // If exact suffix match for a known model, use its label, otherwise create a new label
      label: nearestModel.name.endsWith(version) ? nearestModel.info?.label : `Google AI - ${version}`
    }
  });
}
function nearestGeminiModelRef(version, options = {}) {
  const matchingKey = longestMatchingPrefix(
    version,
    Object.keys(SUPPORTED_GEMINI_MODELS)
  );
  if (matchingKey) {
    return SUPPORTED_GEMINI_MODELS[matchingKey].withConfig({
      ...options,
      version
    });
  }
  return GENERIC_GEMINI_MODEL.withConfig({ ...options, version });
}
function toGeminiRole(role, model) {
  switch (role) {
    case "user":
      return "user";
    case "model":
      return "model";
    case "system":
      if (model?.info?.supports?.systemRole) {
        throw new Error(
          "system role is only supported for a single message in the first position"
        );
      } else {
        throw new Error("system role is not supported");
      }
    case "tool":
      return "function";
    default:
      return "user";
  }
}
function convertSchemaProperty(property) {
  if (!property || !property.type) {
    return void 0;
  }
  const baseSchema = {};
  if (property.description) {
    baseSchema.description = property.description;
  }
  if (property.enum) {
    baseSchema.type = SchemaType.STRING;
    baseSchema.enum = property.enum;
  }
  if (property.nullable) {
    baseSchema.nullable = property.nullable;
  }
  let propertyType;
  if (Array.isArray(property.type)) {
    const types = property.type;
    if (types.includes("null")) {
      baseSchema.nullable = true;
    }
    propertyType = types.find((t) => t !== "null");
  } else {
    propertyType = property.type;
  }
  if (propertyType === "object") {
    const nestedProperties = {};
    Object.keys(property.properties ?? {}).forEach((key) => {
      nestedProperties[key] = convertSchemaProperty(property.properties[key]);
    });
    return {
      ...baseSchema,
      type: SchemaType.OBJECT,
      properties: nestedProperties,
      required: property.required
    };
  } else if (propertyType === "array") {
    return {
      ...baseSchema,
      type: SchemaType.ARRAY,
      items: convertSchemaProperty(property.items)
    };
  } else {
    const schemaType = SchemaType[propertyType.toUpperCase()];
    if (!schemaType) {
      throw new GenkitError({
        status: "INVALID_ARGUMENT",
        message: `Unsupported property type ${propertyType.toUpperCase()}`
      });
    }
    return {
      ...baseSchema,
      type: schemaType
    };
  }
}
function toGeminiTool(tool) {
  const declaration = {
    name: tool.name.replace(/\//g, "__"),
    // Gemini throws on '/' in tool name
    description: tool.description,
    parameters: convertSchemaProperty(tool.inputSchema)
  };
  return declaration;
}
function toInlineData(part) {
  const dataUrl = part.media.url;
  const b64Data = dataUrl.substring(dataUrl.indexOf(",") + 1);
  const contentType = part.media.contentType || dataUrl.substring(dataUrl.indexOf(":") + 1, dataUrl.indexOf(";"));
  return { inlineData: { mimeType: contentType, data: b64Data } };
}
function toFileData(part) {
  if (!part.media.contentType)
    throw new Error(
      "Must supply a `contentType` when sending File URIs to Gemini."
    );
  return {
    fileData: { mimeType: part.media.contentType, fileUri: part.media.url }
  };
}
function fromInlineData(inlinePart) {
  if (!inlinePart.inlineData || !inlinePart.inlineData.hasOwnProperty("mimeType") || !inlinePart.inlineData.hasOwnProperty("data")) {
    throw new Error("Invalid InlineDataPart: missing required properties");
  }
  const { mimeType, data } = inlinePart.inlineData;
  const dataUrl = `data:${mimeType};base64,${data}`;
  return {
    media: {
      url: dataUrl,
      contentType: mimeType
    }
  };
}
function toFunctionCall(part) {
  if (!part?.toolRequest?.input) {
    throw Error("Invalid ToolRequestPart: input was missing.");
  }
  return {
    functionCall: {
      name: part.toolRequest.name,
      args: part.toolRequest.input
    }
  };
}
function fromFunctionCall(part, ref) {
  if (!part.functionCall) {
    throw Error("Invalid FunctionCallPart");
  }
  return {
    toolRequest: {
      name: part.functionCall.name,
      input: part.functionCall.args,
      ref
    }
  };
}
function toFunctionResponse(part) {
  if (!part?.toolResponse?.output) {
    throw Error("Invalid ToolResponsePart: output was missing.");
  }
  return {
    functionResponse: {
      name: part.toolResponse.name,
      response: {
        name: part.toolResponse.name,
        content: part.toolResponse.output
      }
    }
  };
}
function fromFunctionResponse(part) {
  if (!part.functionResponse) {
    throw new Error("Invalid FunctionResponsePart.");
  }
  return {
    toolResponse: {
      name: part.functionResponse.name.replace(/__/g, "/"),
      // restore slashes
      output: part.functionResponse.response
    }
  };
}
function fromExecutableCode(part) {
  if (!part.executableCode) {
    throw new Error("Invalid GeminiPart: missing executableCode");
  }
  return {
    custom: {
      executableCode: {
        language: part.executableCode.language,
        code: part.executableCode.code
      }
    }
  };
}
function fromCodeExecutionResult(part) {
  if (!part.codeExecutionResult) {
    throw new Error("Invalid GeminiPart: missing codeExecutionResult");
  }
  return {
    custom: {
      codeExecutionResult: {
        outcome: part.codeExecutionResult.outcome,
        output: part.codeExecutionResult.output
      }
    }
  };
}
function fromThought(part) {
  return {
    reasoning: part.text || "",
    metadata: { thoughtSignature: part.thoughtSignature }
  };
}
function toCustomPart(part) {
  if (!part.custom) {
    throw new Error("Invalid GeminiPart: missing custom");
  }
  if (part.custom.codeExecutionResult) {
    return { codeExecutionResult: part.custom.codeExecutionResult };
  }
  if (part.custom.executableCode) {
    return { executableCode: part.custom.executableCode };
  }
  throw new Error("Unsupported Custom Part type");
}
function toThought(part) {
  const outPart = { thought: true };
  if (part.metadata?.thoughtSignature)
    outPart.thoughtSignature = part.metadata.thoughtSignature;
  if (part.reasoning?.length) outPart.text = part.reasoning;
  return outPart;
}
function toGeminiPart(part) {
  if (part.text !== void 0) return { text: part.text || " " };
  if (part.media) {
    if (part.media.url.startsWith("data:")) return toInlineData(part);
    return toFileData(part);
  }
  if (part.toolRequest) return toFunctionCall(part);
  if (part.toolResponse) return toFunctionResponse(part);
  if (part.custom) return toCustomPart(part);
  if (typeof part.reasoning === "string") return toThought(part);
  throw new Error("Unsupported Part type" + JSON.stringify(part));
}
function fromGeminiPart(part, jsonMode, ref) {
  if ("thought" in part) return fromThought(part);
  if (typeof part.text === "string") return { text: part.text };
  if (part.inlineData) return fromInlineData(part);
  if (part.functionCall) return fromFunctionCall(part, ref);
  if (part.functionResponse) return fromFunctionResponse(part);
  if (part.executableCode) return fromExecutableCode(part);
  if (part.codeExecutionResult) return fromCodeExecutionResult(part);
  throw new Error("Unsupported GeminiPart type: " + JSON.stringify(part));
}
function toGeminiMessage(message, model) {
  let sortedParts = message.content;
  if (message.role === "tool") {
    sortedParts = [...message.content].sort((a, b) => {
      const aRef = a.toolResponse?.ref;
      const bRef = b.toolResponse?.ref;
      if (!aRef && !bRef) return 0;
      if (!aRef) return 1;
      if (!bRef) return -1;
      return Number.parseInt(aRef, 10) - Number.parseInt(bRef, 10);
    });
  }
  return {
    role: toGeminiRole(message.role, model),
    parts: sortedParts.map(toGeminiPart)
  };
}
function toGeminiSystemInstruction(message) {
  return {
    role: "user",
    parts: message.content.map(toGeminiPart)
  };
}
function fromGeminiFinishReason(reason) {
  if (!reason) return "unknown";
  switch (reason) {
    case "STOP":
      return "stop";
    case "MAX_TOKENS":
      return "length";
    case "SAFETY":
    // blocked for safety
    case "RECITATION":
      return "blocked";
    default:
      return "unknown";
  }
}
function fromGeminiCandidate(candidate, jsonMode = false) {
  const parts = candidate.content?.parts || [];
  const genkitCandidate = {
    index: candidate.index || 0,
    message: {
      role: "model",
      content: parts.map(
        (part, index) => fromGeminiPart(part, jsonMode, index.toString())
      )
    },
    finishReason: fromGeminiFinishReason(candidate.finishReason),
    finishMessage: candidate.finishMessage,
    custom: {
      safetyRatings: candidate.safetyRatings,
      citationMetadata: candidate.citationMetadata
    }
  };
  return genkitCandidate;
}
function cleanSchema(schema) {
  const out = structuredClone(schema);
  for (const key in out) {
    if (key === "$schema" || key === "additionalProperties") {
      delete out[key];
      continue;
    }
    if (typeof out[key] === "object") {
      out[key] = cleanSchema(out[key]);
    }
    if (key === "type" && Array.isArray(out[key])) {
      out[key] = out[key].find((t) => t !== "null");
    }
  }
  return out;
}
function defineGoogleAIModel({
  ai,
  name,
  apiKey: apiKeyOption,
  apiVersion,
  baseUrl,
  info,
  defaultConfig,
  debugTraces
}) {
  let apiKey;
  if (apiKeyOption !== false) {
    apiKey = apiKeyOption || getApiKeyFromEnvVar();
    if (!apiKey) {
      throw new GenkitError({
        status: "FAILED_PRECONDITION",
        message: "Please pass in the API key or set the GEMINI_API_KEY or GOOGLE_API_KEY environment variable.\nFor more details see https://genkit.dev/docs/plugins/google-genai"
      });
    }
  }
  const apiModelName = name.startsWith("googleai/") ? name.substring("googleai/".length) : name;
  const model = SUPPORTED_GEMINI_MODELS[apiModelName] ?? modelRef({
    name: `googleai/${apiModelName}`,
    info: {
      label: `Google AI - ${apiModelName}`,
      supports: {
        multiturn: true,
        media: true,
        tools: true,
        systemRole: true,
        output: ["text", "json"]
      },
      ...info
    },
    configSchema: GeminiConfigSchema
  });
  const middleware = [];
  if (model.info?.supports?.media) {
    middleware.push(
      downloadRequestMedia({
        maxBytes: 1024 * 1024 * 10,
        // don't downlaod files that have been uploaded using the Files API
        filter: (part) => {
          try {
            const url = new URL(part.media.url);
            if (
              // Gemini can handle these URLs
              [
                "generativelanguage.googleapis.com",
                "www.youtube.com",
                "youtube.com",
                "youtu.be"
              ].includes(url.hostname)
            )
              return false;
          } catch {
          }
          return true;
        }
      })
    );
  }
  return ai.defineModel(
    {
      apiVersion: "v2",
      name: model.name,
      ...model.info,
      configSchema: model.configSchema,
      use: middleware
    },
    async (request, { streamingRequested, sendChunk, abortSignal }) => {
      const options = { apiClient: getGenkitClientHeader() };
      if (apiVersion) {
        options.apiVersion = apiVersion;
      }
      if (apiVersion) {
        options.baseUrl = baseUrl;
      }
      const requestConfig = {
        ...defaultConfig,
        ...request.config
      };
      const messages = [...request.messages];
      if (messages.length === 0) throw new Error("No messages provided.");
      let systemInstruction = void 0;
      if (model.info?.supports?.systemRole) {
        const systemMessage = messages.find((m) => m.role === "system");
        if (systemMessage) {
          messages.splice(messages.indexOf(systemMessage), 1);
          systemInstruction = toGeminiSystemInstruction(systemMessage);
        }
      }
      const tools = [];
      if (request.tools?.length) {
        tools.push({
          functionDeclarations: request.tools.map(toGeminiTool)
        });
      }
      const {
        apiKey: apiKeyFromConfig,
        safetySettings: safetySettingsFromConfig,
        codeExecution: codeExecutionFromConfig,
        version: versionFromConfig,
        functionCallingConfig,
        googleSearchRetrieval,
        tools: toolsFromConfig,
        ...restOfConfigOptions
      } = requestConfig;
      if (codeExecutionFromConfig) {
        tools.push({
          codeExecution: request.config.codeExecution === true ? {} : request.config.codeExecution
        });
      }
      if (toolsFromConfig) {
        tools.push(...toolsFromConfig);
      }
      if (googleSearchRetrieval) {
        tools.push({
          googleSearch: googleSearchRetrieval === true ? {} : googleSearchRetrieval
        });
      }
      let toolConfig;
      if (functionCallingConfig) {
        toolConfig = {
          functionCallingConfig: {
            allowedFunctionNames: functionCallingConfig.allowedFunctionNames,
            mode: toFunctionModeEnum(functionCallingConfig.mode)
          }
        };
      } else if (request.toolChoice) {
        toolConfig = {
          functionCallingConfig: {
            mode: toGeminiFunctionModeEnum(request.toolChoice)
          }
        };
      }
      const jsonMode = request.output?.format === "json" || request.output?.contentType === "application/json" && tools.length === 0;
      const generationConfig = {
        ...restOfConfigOptions,
        candidateCount: request.candidates || void 0,
        responseMimeType: jsonMode ? "application/json" : void 0
      };
      if (request.output?.constrained && jsonMode) {
        generationConfig.responseSchema = cleanSchema(request.output.schema);
      }
      const msg = toGeminiMessage(messages[messages.length - 1], model);
      const fromJSONModeScopedGeminiCandidate = (candidate) => {
        return fromGeminiCandidate(candidate, jsonMode);
      };
      const chatRequest = {
        systemInstruction,
        generationConfig,
        tools: tools.length ? tools : void 0,
        toolConfig,
        history: messages.slice(0, -1).map((message) => toGeminiMessage(message, model)),
        safetySettings: safetySettingsFromConfig
      };
      const modelVersion = versionFromConfig || model.version || apiModelName;
      const cacheConfigDetails = extractCacheConfig(request);
      const { chatRequest: updatedChatRequest, cache } = await handleCacheIfNeeded(
        apiKey,
        request,
        chatRequest,
        modelVersion,
        cacheConfigDetails
      );
      if (!apiKeyFromConfig && !apiKey) {
        throw new GenkitError({
          status: "INVALID_ARGUMENT",
          message: "GoogleAI plugin was initialized with {apiKey: false} but no apiKey configuration was passed at call time."
        });
      }
      const client = new GoogleGenerativeAI(apiKeyFromConfig || apiKey);
      let genModel;
      if (cache) {
        genModel = client.getGenerativeModelFromCachedContent(
          cache,
          {
            model: modelVersion
          },
          options
        );
      } else {
        genModel = client.getGenerativeModel(
          {
            model: modelVersion
          },
          options
        );
      }
      const callGemini = async () => {
        let response;
        if (streamingRequested) {
          const result = await genModel.startChat(updatedChatRequest).sendMessageStream(msg.parts, { ...options, signal: abortSignal });
          const chunks = [];
          for await (const item of result.stream) {
            chunks.push(item);
            item.candidates?.forEach(
              (candidate) => {
                const c = fromJSONModeScopedGeminiCandidate(candidate);
                sendChunk({
                  index: c.index,
                  content: c.message.content
                });
              }
            );
          }
          response = aggregateResponses(chunks);
        } else {
          const result = await genModel.startChat(updatedChatRequest).sendMessage(msg.parts, { ...options, signal: abortSignal });
          response = result.response;
        }
        const candidates = response.candidates || [];
        if (response.candidates?.["undefined"]) {
          candidates.push(response.candidates["undefined"]);
        }
        if (!candidates.length) {
          throw new GenkitError({
            status: "FAILED_PRECONDITION",
            message: "No valid candidates returned."
          });
        }
        const candidateData = candidates.map(fromJSONModeScopedGeminiCandidate) || [];
        const usageMetadata = response.usageMetadata;
        return {
          candidates: candidateData,
          custom: response,
          usage: {
            ...getBasicUsageStats(request.messages, candidateData),
            inputTokens: usageMetadata?.promptTokenCount,
            outputTokens: usageMetadata?.candidatesTokenCount,
            thoughtsTokens: usageMetadata?.thoughtsTokenCount,
            totalTokens: usageMetadata?.totalTokenCount,
            cachedContentTokens: usageMetadata?.cachedContentTokenCount
          }
        };
      };
      return debugTraces ? await runInNewSpan(
        ai.registry,
        {
          metadata: {
            name: streamingRequested ? "sendMessageStream" : "sendMessage"
          }
        },
        async (metadata) => {
          metadata.input = {
            sdk: "@google/generative-ai",
            cache,
            model: genModel.model,
            chatOptions: updatedChatRequest,
            parts: msg.parts,
            options
          };
          const response = await callGemini();
          metadata.output = response.custom;
          return response;
        }
      ) : await callGemini();
    }
  );
}
function toFunctionModeEnum(configEnum) {
  if (configEnum === void 0) {
    return void 0;
  }
  switch (configEnum) {
    case "MODE_UNSPECIFIED": {
      return FunctionCallingMode.MODE_UNSPECIFIED;
    }
    case "ANY": {
      return FunctionCallingMode.ANY;
    }
    case "AUTO": {
      return FunctionCallingMode.AUTO;
    }
    case "NONE": {
      return FunctionCallingMode.NONE;
    }
    default:
      throw new Error(`unsupported function calling mode: ${configEnum}`);
  }
}
function toGeminiFunctionModeEnum(genkitMode) {
  if (genkitMode === void 0) {
    return void 0;
  }
  switch (genkitMode) {
    case "required": {
      return FunctionCallingMode.ANY;
    }
    case "auto": {
      return FunctionCallingMode.AUTO;
    }
    case "none": {
      return FunctionCallingMode.NONE;
    }
    default:
      throw new Error(`unsupported function calling mode: ${genkitMode}`);
  }
}
function aggregateResponses(responses) {
  const lastResponse = responses[responses.length - 1];
  const aggregatedResponse = {
    promptFeedback: lastResponse?.promptFeedback
  };
  for (const response of responses) {
    if (response.candidates) {
      let candidateIndex = 0;
      for (const candidate of response.candidates) {
        if (!aggregatedResponse.candidates) {
          aggregatedResponse.candidates = [];
        }
        if (!aggregatedResponse.candidates[candidateIndex]) {
          aggregatedResponse.candidates[candidateIndex] = {
            index: candidateIndex
          };
        }
        aggregatedResponse.candidates[candidateIndex].citationMetadata = candidate.citationMetadata;
        aggregatedResponse.candidates[candidateIndex].groundingMetadata = candidate.groundingMetadata;
        aggregatedResponse.candidates[candidateIndex].finishReason = candidate.finishReason;
        aggregatedResponse.candidates[candidateIndex].finishMessage = candidate.finishMessage;
        aggregatedResponse.candidates[candidateIndex].safetyRatings = candidate.safetyRatings;
        if (candidate.content && candidate.content.parts) {
          if (!aggregatedResponse.candidates[candidateIndex].content) {
            aggregatedResponse.candidates[candidateIndex].content = {
              role: candidate.content.role || "user",
              parts: []
            };
          }
          for (const part of candidate.content.parts) {
            const newPart = {};
            if (part.text) {
              newPart.text = part.text;
            }
            if (part.thought) {
              newPart.thought = part.thought;
            }
            if (part.thoughtSignature) {
              newPart.thoughtSignature = part.thoughtSignature;
            }
            if (part.functionCall) {
              newPart.functionCall = part.functionCall;
            }
            if (part.executableCode) {
              newPart.executableCode = part.executableCode;
            }
            if (part.codeExecutionResult) {
              newPart.codeExecutionResult = part.codeExecutionResult;
            }
            if (Object.keys(newPart).length === 0) {
              newPart.text = "";
            }
            aggregatedResponse.candidates[candidateIndex].content.parts.push(
              newPart
            );
          }
        }
      }
      candidateIndex++;
    }
    if (response.usageMetadata) {
      aggregatedResponse.usageMetadata = response.usageMetadata;
    }
  }
  return aggregatedResponse;
}
export {
  GENERIC_GEMINI_MODEL,
  GeminiConfigSchema,
  GeminiGemmaConfigSchema,
  GeminiTtsConfigSchema,
  SUPPORTED_GEMINI_MODELS,
  aggregateResponses,
  cleanSchema,
  defineGoogleAIModel,
  fromGeminiCandidate,
  gemini,
  gemini10Pro,
  gemini15Flash,
  gemini15Flash8b,
  gemini15Pro,
  gemini20Flash,
  gemini20FlashExp,
  gemini20FlashLite,
  gemini20ProExp0205,
  gemini25Flash,
  gemini25FlashLite,
  gemini25FlashPreview0417,
  gemini25FlashPreviewTts,
  gemini25Pro,
  gemini25ProExp0325,
  gemini25ProPreview0325,
  gemini25ProPreviewTts,
  gemma312bit,
  gemma31bit,
  gemma327bit,
  gemma34bit,
  gemma3ne4bit,
  toGeminiMessage,
  toGeminiSystemInstruction,
  toGeminiTool
};
//# sourceMappingURL=gemini.mjs.map