"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCsv = toCsv;
exports.toJson = toJson;
exports.getExporterForString = getExporterForString;
const promises_1 = require("fs/promises");
const json_2_csv_1 = require("json-2-csv");
const logger_1 = require("../utils/logger");
const SUPPORTED_FORMATS = {
    csv: toCsv,
    json: toJson,
};
async function toCsv(evalRun, filePath) {
    const unpackedCases = unpackMetricsToColumns(evalRun);
    const csvRecords = (0, json_2_csv_1.json2csv)(unpackedCases, {
        emptyFieldValue: '',
        expandNestedObjects: false,
    });
    logger_1.logger.info(`Writing csv results to '${filePath}'...`);
    await (0, promises_1.writeFile)(filePath, csvRecords);
}
async function toJson(evalRun, filePath) {
    logger_1.logger.info(`Writing json results to '${filePath}'...`);
    await (0, promises_1.writeFile)(filePath, JSON.stringify(evalRun.results, undefined, '  '));
}
function unpackMetricsToColumns(evalRun) {
    return evalRun.results.map((result) => {
        const record = {
            ...result,
        };
        delete record['metrics'];
        result.metrics?.forEach((metric) => {
            record[`${metric.evaluator}_score`] = metric.score;
            record[`${metric.evaluator}_rationale`] = metric.rationale;
            record[`${metric.evaluator}_error`] = metric.error;
            record[`${metric.evaluator}_traceId`] = metric.traceId;
            record[`${metric.evaluator}_spanId`] = metric.spanId;
        });
        return record;
    });
}
function getExporterForString(outputFormat) {
    if (!(outputFormat in SUPPORTED_FORMATS)) {
        logger_1.logger.info(`Encountered unrecognized output format ${outputFormat}. Defaulting to json.`);
        return toJson;
    }
    return SUPPORTED_FORMATS[outputFormat];
}
//# sourceMappingURL=exporter.js.map