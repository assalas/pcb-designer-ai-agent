import { z } from 'genkit';

/**
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

/** Explicit user sentiment of response. */
declare enum FirebaseUserFeedbackEnum {
    /** The user reacted positively to the response. */
    POSITIVE = "positive",
    /** The user reacted negatively to the response. */
    NEGATIVE = "negative"
}
/** Implicit user acceptance of response. */
declare enum FirebaseUserAcceptanceEnum {
    /** The user took the desired action. */
    ACCEPTED = "accepted",
    /** The user did not take the desired action. */
    REJECTED = "rejected"
}
/** Explicit user feedback on response. */
declare const FirebaseUserFeedbackSchema: z.ZodObject<{
    /** User sentiment of response. */
    value: z.ZodNativeEnum<typeof FirebaseUserFeedbackEnum>;
    /** Optional free text feedback to supplement score. */
    text: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: FirebaseUserFeedbackEnum;
    text?: string | undefined;
}, {
    value: FirebaseUserFeedbackEnum;
    text?: string | undefined;
}>;
/** Implicit user acceptance of response. */
declare const FirebaseUserAcceptanceSchema: z.ZodObject<{
    /** Whether the user took the desired action based on the response. */
    value: z.ZodNativeEnum<typeof FirebaseUserAcceptanceEnum>;
}, "strip", z.ZodTypeAny, {
    value: FirebaseUserAcceptanceEnum;
}, {
    value: FirebaseUserAcceptanceEnum;
}>;
/** Schema for providing user engagement metadata. One or both of feedback and acceptance should be provided. */
declare const FirebaseUserEngagementSchema: z.ZodObject<{
    /** Flow or feature name. */
    name: z.ZodString;
    /**
     * The trace ID of the execution for which we've received user engagement data.
     */
    traceId: z.ZodString;
    /** The root span ID of the execution for which we've received user engagement data. */
    spanId: z.ZodString;
    /** Explicit user feedback on response. */
    feedback: z.ZodOptional<z.ZodObject<{
        /** User sentiment of response. */
        value: z.ZodNativeEnum<typeof FirebaseUserFeedbackEnum>;
        /** Optional free text feedback to supplement score. */
        text: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: FirebaseUserFeedbackEnum;
        text?: string | undefined;
    }, {
        value: FirebaseUserFeedbackEnum;
        text?: string | undefined;
    }>>;
    /** Implicit user acceptance of response. */
    acceptance: z.ZodOptional<z.ZodObject<{
        /** Whether the user took the desired action based on the response. */
        value: z.ZodNativeEnum<typeof FirebaseUserAcceptanceEnum>;
    }, "strip", z.ZodTypeAny, {
        value: FirebaseUserAcceptanceEnum;
    }, {
        value: FirebaseUserAcceptanceEnum;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    traceId: string;
    spanId: string;
    feedback?: {
        value: FirebaseUserFeedbackEnum;
        text?: string | undefined;
    } | undefined;
    acceptance?: {
        value: FirebaseUserAcceptanceEnum;
    } | undefined;
}, {
    name: string;
    traceId: string;
    spanId: string;
    feedback?: {
        value: FirebaseUserFeedbackEnum;
        text?: string | undefined;
    } | undefined;
    acceptance?: {
        value: FirebaseUserAcceptanceEnum;
    } | undefined;
}>;
type FirebaseUserEngagement = z.infer<typeof FirebaseUserEngagementSchema>;
/** Associates user engagement metadata with the specified flow execution. */
declare function collectUserEngagement(userEngagement: FirebaseUserEngagement): Promise<void>;

export { FirebaseUserAcceptanceEnum, FirebaseUserAcceptanceSchema, type FirebaseUserEngagement, FirebaseUserEngagementSchema, FirebaseUserFeedbackEnum, FirebaseUserFeedbackSchema, collectUserEngagement };
