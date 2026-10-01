import { GenkitError } from "@genkit-ai/core";
const enumFormatter = {
  name: "enum",
  config: {
    contentType: "text/enum",
    constrained: true
  },
  handler: (schema) => {
    if (schema && schema.type !== "string" && schema.type !== "enum") {
      throw new GenkitError({
        status: "INVALID_ARGUMENT",
        message: `Must supply a 'string' or 'enum' schema type when using the enum parser format.`
      });
    }
    let instructions;
    if (schema?.enum) {
      instructions = `Output should be ONLY one of the following enum values. Do not output any additional information or add quotes.

${schema.enum.map((v) => v.toString()).join("\n")}`;
    }
    return {
      parseMessage: (message) => {
        return message.text.replace(/['"]/g, "").trim();
      },
      instructions
    };
  }
};
export {
  enumFormatter
};
//# sourceMappingURL=enum.mjs.map