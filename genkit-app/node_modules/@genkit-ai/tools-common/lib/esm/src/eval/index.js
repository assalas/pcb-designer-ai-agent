import { LocalFileDatasetStore } from './localFileDatasetStore';
import { LocalFileEvalStore } from './localFileEvalStore';
export { InferenceDatasetSchema } from '../types/eval';
export * from './evaluate';
export * from './exporter';
export * from './parser';
export * from './validate';
export async function getEvalStore() {
    return await LocalFileEvalStore.getEvalStore();
}
export function getDatasetStore() {
    return LocalFileDatasetStore.getDatasetStore();
}
//# sourceMappingURL=index.js.map