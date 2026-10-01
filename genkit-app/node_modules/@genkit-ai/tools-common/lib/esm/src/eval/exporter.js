import { writeFile } from 'fs/promises';
import { json2csv } from 'json-2-csv';
import { logger } from '../utils/logger';
const SUPPORTED_FORMATS = {
    csv: toCsv,
    json: toJson,
};
export async function toCsv(evalRun, filePath) {
    const unpackedCases = unpackMetricsToColumns(evalRun);
    const csvRecords = json2csv(unpackedCases, {
        emptyFieldValue: '',
        expandNestedObjects: false,
    });
    logger.info(`Writing csv results to '${filePath}'...`);
    await writeFile(filePath, csvRecords);
}
export async function toJson(evalRun, filePath) {
    logger.info(`Writing json results to '${filePath}'...`);
    await writeFile(filePath, JSON.stringify(evalRun.results, undefined, '  '));
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
export function getExporterForString(outputFormat) {
    if (!(outputFormat in SUPPORTED_FORMATS)) {
        logger.info(`Encountered unrecognized output format ${outputFormat}. Defaulting to json.`);
        return toJson;
    }
    return SUPPORTED_FORMATS[outputFormat];
}
//# sourceMappingURL=exporter.js.map