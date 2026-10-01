import type { Action } from '../types/action';
import type { EvalInput, EvalResult } from '../types/eval';
import type { EvalResponse } from '../types/evaluator';
export declare const MAX_UNIQUE_STRING_DIST = 5;
export declare function enrichResultsWithScoring(scores: Record<string, EvalResponse>, evalDataset: EvalInput[]): EvalResult[];
export declare function extractMetricsMetadata(evaluatorActions: Action[]): Record<string, any>;
export declare function extractMetricSummaries(scores: Record<string, EvalResponse>): ({
    evaluator: string;
    testCaseCount: any;
    errorCount: number;
    scoreUndefinedCount: number;
    statusDistribution: Record<string, number>;
    averageScore: number | undefined;
    scoreDistribution?: undefined;
} | {
    evaluator: string;
    testCaseCount: any;
    errorCount: number;
    scoreUndefinedCount: number;
    statusDistribution: Record<string, number>;
    scoreDistribution: Record<string, number>;
    averageScore?: undefined;
} | {
    evaluator: string;
    testCaseCount: number;
    errorCount: number;
    scoreUndefinedCount: number;
    statusDistribution: Record<string, number>;
    averageScore?: undefined;
    scoreDistribution?: undefined;
})[];
