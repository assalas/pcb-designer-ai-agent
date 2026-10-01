import { z } from "genkit";
import { SPAN_TYPE_ATTR, appendSpan } from "genkit/tracing";
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
const FirebaseUserFeedbackSchema = z.object({
  /** User sentiment of response. */
  value: z.nativeEnum(FirebaseUserFeedbackEnum),
  /** Optional free text feedback to supplement score. */
  text: z.optional(z.string())
});
const FirebaseUserAcceptanceSchema = z.object({
  /** Whether the user took the desired action based on the response. */
  value: z.nativeEnum(FirebaseUserAcceptanceEnum)
});
const FirebaseUserEngagementSchema = z.object({
  /** Flow or feature name. */
  name: z.string(),
  /**
   * The trace ID of the execution for which we've received user engagement data.
   */
  traceId: z.string(),
  /** The root span ID of the execution for which we've received user engagement data. */
  spanId: z.string(),
  /** Explicit user feedback on response. */
  feedback: z.optional(FirebaseUserFeedbackSchema),
  /** Implicit user acceptance of response. */
  acceptance: z.optional(FirebaseUserAcceptanceSchema)
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
    await appendSpan(
      userEngagement.traceId,
      userEngagement.spanId,
      {
        name: "user-feedback",
        path: `/{${userEngagement.name}}`,
        metadata
      },
      {
        [SPAN_TYPE_ATTR]: "userEngagement"
      }
    );
  }
  if (userEngagement.acceptance?.value) {
    await appendSpan(
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
        [SPAN_TYPE_ATTR]: "userEngagement"
      }
    );
  }
}
export {
  FirebaseUserAcceptanceEnum,
  FirebaseUserAcceptanceSchema,
  FirebaseUserEngagementSchema,
  FirebaseUserFeedbackEnum,
  FirebaseUserFeedbackSchema,
  collectUserEngagement
};
//# sourceMappingURL=user-engagement.mjs.map