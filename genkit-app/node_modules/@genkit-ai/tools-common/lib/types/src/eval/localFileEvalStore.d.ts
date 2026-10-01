import type { ListEvalKeysRequest, ListEvalKeysResponse } from '../types/apis';
import { type EvalRun, type EvalStore } from '../types/eval';
export declare class LocalFileEvalStore implements EvalStore {
    private storeRoot;
    private indexFile;
    private static cachedEvalStore;
    private init;
    static getEvalStore(): Promise<LocalFileEvalStore>;
    static reset(): void;
    save(evalRun: EvalRun): Promise<void>;
    load(evalRunId: string): Promise<EvalRun | undefined>;
    list(query?: ListEvalKeysRequest | undefined): Promise<ListEvalKeysResponse>;
    delete(evalRunId: string): Promise<void>;
    private resolveEvalFilename;
    private resolveIndexFile;
    private processLineByLine;
    private generateRootPath;
    private getEvalsIndex;
}
