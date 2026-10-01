import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { getDatasetStore } from '.';
import { InferenceDatasetSchema, } from '../types';
import { getModelInput } from '../utils';
export async function validateSchema(manager, request) {
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
        const datasetStore = await getDatasetStore();
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
        const dataset = InferenceDatasetSchema.parse(data);
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
            input = getModelInput(data, undefined);
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
    const ajv = new Ajv();
    addFormats(ajv);
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