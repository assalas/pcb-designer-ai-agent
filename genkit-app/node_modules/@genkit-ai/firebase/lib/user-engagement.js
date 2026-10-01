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
var user_engagement_exports = {};
__export(user_engagement_exports, {
  FirebaseUserAcceptanceEnum: () => FirebaseUserAcceptanceEnum,
  FirebaseUserAcceptanceSchema: () => FirebaseUserAcceptanceSchema,
  FirebaseUserEngagementSchema: () => FirebaseUserEngagementSchema,
  FirebaseUserFeedbackEnum: () => FirebaseUserFeedbackEnum,
  FirebaseUserFeedbackSchema: () => FirebaseUserFeedbackSchema,
  collectUserEngagement: () => collectUserEngagement
});
module.exports = __toCommonJS(user_engagement_exports);
var import_genkit = require("genkit");
var import_tracing = require("genkit/tracing");
var FirebaseUserFeedbackEnum = /* @__PURE__ */ ((FirebaseUserFeedbackEnum2) => {
  FirebaseUserFeedbackEnum2["POSITIVE"] = "positive";
  FirebaseUserFeedbackEnum2["NEGATIVE"] = "negative";
  return FirebaseUserFeedbackEnum2;
})(FirebaseUserFeedbackEnum || {});
var FirebaseUserAcceptanceEnum = /* @__PURE__ */ ((FirebaseUserAcceptanceEnum2) => {
  FirebaseUserAcceptanceEnum2["ACCEPTED"] = "accepted";
  FirebaseUserAcceptanceEnum2["REJECTED"] = "rejected";
  return FirebaseUserAcceptanceEnum2;
})(FirebaseUserAcceptanceEnum || {});
const FirebaseUserFeedbackSchema = import_genkit.z.object({
  /** User sentiment of response. */
  value: import_genkit.z.nativeEnum(FirebaseUserFeedbackEnum),
  /** Optional free text feedback to supplement score. */
  text: import_genkit.z.optional(import_genkit.z.string())
});
const FirebaseUserAcceptanceSchema = import_genkit.z.object({
  /** Whether the user took the desired action based on the response. */
  value: import_genkit.z.nativeEnum(FirebaseUserAcceptanceEnum)
});
const FirebaseUserEngagementSchema = import_genkit.z.object({
  /** Flow or feature name. */
  name: import_genkit.z.string(),
  /**
   * The trace ID of the execution for which we've received user engagement data.
   */
  traceId: import_genkit.z.string(),
  /** The root span ID of the execution for which we've received user engagement data. */
  spanId: import_genkit.z.string(),
  /** Explicit user feedback on response. */
  feedback: import_genkit.z.optional(FirebaseUserFeedbackSchema),
  /** Implicit user acceptance of response. */
  acceptance: import_genkit.z.optional(FirebaseUserAcceptanceSchema)
});
async function collectUserEngagement(userEngagement) {
  if (userEngagement.feedback?.value) {
    const metadata = {
      feedbackValue: userEngagement.feedback.value,
      subtype: "userFeedback"
    };
    if (userEngagement.feedback.text) {
      metadata["textFeedback"] = userEngagement.feedback.text;
    }
    await (0, import_tracing.appendSpan)(
      userEngagement.traceId,
      userEngagement.spanId,
      {
        name: "user-feedback",
        path: `/{${userEngagement.name}}`,
        metadata
      },
      {
        [import_tracing.SPAN_TYPE_ATTR]: "userEngagement"
      }
    );
  }
  if (userEngagement.acceptance?.value) {
    await (0, import_tracing.appendSpan)(
      userEngagement.traceId,
      userEngagement.spanId,
      {
        name: "user-acceptance",
        path: `/{${userEngagement.name}}`,
        metadata: {
          acceptanceValue: userEngagement.acceptance.value,
          subtype: "userAcceptance"
        }
      },
      {
        [import_tracing.SPAN_TYPE_ATTR]: "userEngagement"
      }
    );
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FirebaseUserAcceptanceEnum,
  FirebaseUserAcceptanceSchema,
  FirebaseUserEngagementSchema,
  FirebaseUserFeedbackEnum,
  FirebaseUserFeedbackSchema,
  collectUserEngagement
});
//# sourceMappingURL=user-engagement.js.map