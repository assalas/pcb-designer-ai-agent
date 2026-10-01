import { Firestore, QueryDocumentSnapshot } from '@google-cloud/firestore';
import { Genkit, EmbedderArgument, RetrieverAction } from 'genkit';
import { Part } from 'genkit/retriever';

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
 * Define a retriever that uses vector similarity search to retrieve documents from Firestore.
 * You must create a vector index on the associated field before you can perform nearest-neighbor
 * search.
 **/
declare function defineFirestoreRetriever(ai: Genkit, config: {
    /** The name of the retriever. */
    name: string;
    /** Optional label for display in Developer UI. */
    label?: string;
    /** The Firestore database instance from which to query. */
    firestore: Firestore;
    /** The name of the collection from which to query. */
    collection?: string;
    /** The embedder to use with this retriever. */
    embedder: EmbedderArgument;
    /** The name of the field within the collection containing the vector data. */
    vectorField: string;
    /** The name of the field containing the document content you wish to return. */
    contentField: string | ((snap: QueryDocumentSnapshot) => Part[]);
    /** The distance measure to use when comparing vectors. Defaults to 'COSINE'. */
    distanceMeasure?: 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT';
    /**
     * Specifies a threshold for which no less similar documents will be returned. The behavior
     * of the specified `distanceMeasure` will affect the meaning of the distance threshold.
     *
     *  - For `distanceMeasure: "EUCLIDEAN"`, the meaning of `distanceThreshold` is:
     *     SELECT docs WHERE euclidean_distance <= distanceThreshold
     *  - For `distanceMeasure: "COSINE"`, the meaning of `distanceThreshold` is:
     *     SELECT docs WHERE cosine_distance <= distanceThreshold
     *  - For `distanceMeasure: "DOT_PRODUCT"`, the meaning of `distanceThreshold` is:
     *     SELECT docs WHERE dot_product_distance >= distanceThreshold
     */
    distanceThreshold?: number;
    /**
     * Optionally specifies the name of a metadata field that will be set on each returned Document,
     * which will contain the computed distance for the document.
     */
    distanceResultField?: string;
    /**
     * A list of fields to include in the returned document metadata. If not supplied, all fields other
     * than the vector are included. Alternatively, provide a transform function to extract the desired
     * metadata fields from a snapshot.
     **/
    metadataFields?: string[] | ((snap: QueryDocumentSnapshot) => Record<string, any>);
}): RetrieverAction;

export { defineFirestoreRetriever };
