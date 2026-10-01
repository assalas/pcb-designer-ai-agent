"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = validateSchema;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const _1 = require(".");
const types_1 = require("../types");
const utils_1 = require("../utils");
async function validateSchema(manager, request) {
    const { dataSource, actionRef } = request;
    const { datasetId, data } = dataSource;
    if (!datasetId && !data) {
        throw new Error(`Either 'data' or 'datasetId' must be provided`);
    }
    const targetAction = await getAction(manager, actionRef);
    const targetSchema = targetAction?.inputSchema;
    if (!targetAction) {
        throw new Error(`Could not find matching action for ${actionRef}`);
    }
    if (!targetSchema) {
        return { valid: true };
    }
    const errorsMap = {};
    if (datasetId) {
        const datasetStore = await (0, _1.getDatasetStore)();
        const dataset = await datasetStore.getDataset(datasetId);
        if (dataset.length === 0) {
            return { valid: true };
        }
        dataset.forEach((sample) => {
            const response = validate(actionRef, targetSchema, sample.input);
            if (!response.valid) {
                errorsMap[sample.testCaseId] = response.errors ?? [];
            }
        });
        return Object.keys(errorsMap).length === 0
            ? { valid: true }
            : { valid: false, errors: errorsMap };
    }
    else {
        const dataset = types_1.InferenceDatasetSchema.parse(data);
        dataset.forEach((sample, index) => {
            const response = validate(actionRef, targetSchema, sample.input);
            if (!response.valid) {
                errorsMap[index.toString()] = response.errors ?? [];
            }
        });
        return Object.keys(errorsMap).length === 0
            ? { valid: true }
            : { valid: false, errors: errorsMap };
    }
}
function validate(actionRef, jsonSchema, data) {
    const isModelAction = actionRef.startsWith('/model');
    let input;
    if (isModelAction) {
        try {
            input = (0, utils_1.getModelInput)(data, undefined);
        }
        catch (e) {
            return {
                valid: false,
                errors: [
                    {
                        path: '(root)',
                        message: `Unable to convert to model input. Details: ${e}`,
                    },
                ],
            };
        }
    }
    else {
        input = data;
    }
    const ajv = new ajv_1.default();
    (0, ajv_formats_1.default)(ajv);
    const validator = ajv.compile(jsonSchema);
    const valid = validator(input);
    const errors = validator.errors?.map((e) => e);
    return { valid, errors: errors?.map(toErrorDetail) };
}
function toErrorDetail(error) {
    return {
        path: error.instancePath.substring(1).replace(/\//g, '.') || '(root)',
        message: error.message,
    };
}
async function getAction(manager, actionRef) {
    const actions = await manager.listActions();
    return actions[actionRef];
}
//# sourceMappingURL=validate.js.map