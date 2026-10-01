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
/**
 * Parses partially complete JSON string.
 */
declare function parsePartialJson<T = unknown>(jsonString: string): T;
/**
 * Extracts JSON from string with lenient parsing rules to improve likelihood of successful extraction.
 */
declare function extractJson<T = unknown>(text: string, throwOnBadJson?: true): T;
declare function extractJson<T = unknown>(text: string, throwOnBadJson?: false): T | null;
interface ExtractItemsResult {
    items: unknown[];
    cursor: number;
}
/**
 * Extracts complete objects from the first array found in the text.
 * Processes text from the cursor position and returns both complete items
 * and the new cursor position.
 */
declare function extractItems(text: string, cursor?: number): ExtractItemsResult;

export { extractItems, extractJson, parsePartialJson };
