"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_UNIQUE_STRING_DIST = void 0;
exports.enrichResultsWithScoring = enrichResultsWithScoring;
exports.extractMetricsMetadata = extractMetricsMetadata;
exports.extractMetricSummaries = extractMetricSummaries;
const eval_1 = require("../utils/eval");
exports.MAX_UNIQUE_STRING_DIST = 5;
function enrichResultsWithScoring(scores, evalDataset) {
    const scoreMap = {};
    Object.keys(scores).forEach((evaluator) => {
        const evaluatorResponse = scores[evaluator];
        evaluatorResponse.forEach((scoredSample) => {
            if (!scoredSample.testCaseId) {
                throw new Error('testCaseId expected to be present');
            }
            const score = Array.isArray(scoredSample.evaluation)
                ? scoredSample.evaluation
                : [scoredSample.evaluation];
            const existingScores = scoreMap[scoredSample.testCaseId] ?? [];
            const newScores = existingScores.concat(score.map((s) => ({
                evaluator,
                score: s.score,
                scoreId: s.id,
                status: s.status,
                rationale: s.details?.reasoning,
                error: s.error,
                traceId: scoredSample.traceId,
                spanId: scoredSample.spanId,
            })));
            scoreMap[scoredSample.testCaseId] = newScores;
        });
    });
    return evalDataset.map((evalResult) => {
        return {
            ...evalResult,
            metrics: scoreMap[evalResult.testCaseId] ?? [],
        };
    });
}
function extractMetricsMetadata(evaluatorActions) {
    const metadata = {};
    for (const action of evaluatorActions) {
        metadata[action.name] = {
            displayName: action.metadata.evaluator[eval_1.EVALUATOR_METADATA_KEY_DISPLAY_NAME],
            definition: action.metadata.evaluator[eval_1.EVALUATOR_METADATA_KEY_DEFINITION],
        };
    }
    return metadata;
}
function extractMetricSummaries(scores) {
    const testCaseCountMap = {};
    const entries = Object.entries(scores)
        .map(([evaluator, responseArray]) => {
        testCaseCountMap[evaluator] = responseArray.length;
        return {
            evaluator,
            score: responseArray.flatMap((response) => Array.isArray(response.evaluation)
                ? response.evaluation
                : [response.evaluation]),
        };
    })
        .flatMap((entry) => {
        const groupedScores = (0, eval_1.groupBy)(entry.score, 'id');
        const groupedScoresKeys = Object.keys(groupedScores);
        if (groupedScoresKeys.length === 1 &&
            groupedScoresKeys[0] === 'undefined') {
            return entry.score.flatMap((score) => ({
                evaluator: entry.evaluator,
                testCaseCount: testCaseCountMap[entry.evaluator] ?? 0,
                status: score.status,
                score: score.score,
                error: score.error,
            }));
        }
        else {
            return Object.entries(groupedScores).flatMap(([scoreId, scores]) => {
                if (scoreId === 'undefined') {
                    return scores.map((score) => ({
                        evaluator: entry.evaluator,
                        testCaseCount: testCaseCountMap[entry.evaluator] ?? 0,
                        status: score.status,
                        score: score.score,
                        error: score.error,
                    }));
                }
                else {
                    testCaseCountMap[entry.evaluator + '/' + scoreId] =
                        testCaseCountMap[entry.evaluator] ?? 0;
                    return scores.map((score) => ({
                        evaluator: entry.evaluator + '/' + scoreId,
                        testCaseCount: testCaseCountMap[entry.evaluator] ?? 0,
                        status: score.status,
                        score: score.score,
                        error: score.error,
                    }));
                }
            });
        }
    });
    const grouped = (0, eval_1.groupBy)(entries, 'evaluator');
    const summaries = Object.entries(grouped).map(([evaluator, items]) => {
        const definedItems = items.filter((item) => typeof item.score !== 'undefined');
        const scoreUndefinedCount = items.filter((item) => typeof item.score === 'undefined').length;
        const errorCount = items.filter((item) => item.error !== undefined).length;
        const statusDistribution = (0, eval_1.countBy)(items, 'status');
        if (definedItems.length > 0) {
            const validItem = definedItems[0];
            const scoreType = typeof validItem.score;
            if (scoreType === 'number') {
                return {
                    evaluator,
                    testCaseCount: validItem.testCaseCount,
                    errorCount,
                    scoreUndefinedCount,
                    statusDistribution,
                    averageScore: (0, eval_1.meanBy)(definedItems, 'score'),
                };
            }
            else if (scoreType === 'boolean') {
                return {
                    evaluator,
                    testCaseCount: validItem.testCaseCount,
                    errorCount,
                    scoreUndefinedCount,
                    statusDistribution,
                    scoreDistribution: (0, eval_1.countBy)(definedItems, 'score'),
                };
            }
            else if (scoreType === 'string') {
                const scoreDistribution = (0, eval_1.countBy)(definedItems, 'score');
                if (Object.keys(scoreDistribution).length <= exports.MAX_UNIQUE_STRING_DIST) {
                    return {
                        evaluator,
                        testCaseCount: validItem.testCaseCount,
                        errorCount,
                        scoreUndefinedCount,
                        scoreDistribution,
                        statusDistribution,
                    };
                }
            }
        }
        return {
            evaluator,
            testCaseCount: testCaseCountMap[evaluator] ?? 0,
            errorCount,
            scoreUndefinedCount,
            statusDistribution,
        };
    });
    return summaries;
}
//# sourceMappingURL=parser.js.map