import fs from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';
import { EvalRunKeySchema, EvalRunSchema, } from '../types/eval';
import { logger } from '../utils/logger';
export class LocalFileEvalStore {
    storeRoot = '';
    indexFile = '';
    static cachedEvalStore = null;
    async init() {
        this.storeRoot = this.generateRootPath();
        this.indexFile = await this.resolveIndexFile();
        fs.mkdirSync(this.storeRoot, { recursive: true });
        if (!fs.existsSync(this.indexFile)) {
            fs.writeFileSync(path.resolve(this.indexFile), JSON.stringify({}));
        }
        logger.debug(`Initialized local file eval store at root: ${this.storeRoot}`);
    }
    static async getEvalStore() {
        if (!this.cachedEvalStore) {
            this.cachedEvalStore = new LocalFileEvalStore();
            await this.cachedEvalStore.init();
        }
        return this.cachedEvalStore;
    }
    static reset() {
        this.cachedEvalStore = null;
    }
    async save(evalRun) {
        const fileName = this.resolveEvalFilename(evalRun.key.evalRunId);
        logger.debug(`Saving EvalRun ${evalRun.key.evalRunId} to ` +
            path.resolve(this.storeRoot, fileName));
        await writeFile(path.resolve(this.storeRoot, fileName), JSON.stringify(evalRun));
        const index = await this.getEvalsIndex();
        index[evalRun.key.evalRunId] = evalRun.key;
        await writeFile(path.resolve(this.indexFile), JSON.stringify(index, null, 2));
    }
    async load(evalRunId) {
        const filePath = path.resolve(this.storeRoot, this.resolveEvalFilename(evalRunId));
        if (!fs.existsSync(filePath)) {
            return undefined;
        }
        return await readFile(filePath, 'utf8').then((data) => EvalRunSchema.parse(JSON.parse(data)));
    }
    async list(query) {
        logger.debug(`Listing keys for filter: ${JSON.stringify(query)}`);
        let keys = await this.getEvalsIndex().then((index) => Object.values(index));
        if (query?.filter?.actionRef) {
            keys = keys.filter((key) => key.actionRef === query?.filter?.actionRef);
        }
        return {
            evalRunKeys: keys,
        };
    }
    async delete(evalRunId) {
        const filePath = path.resolve(this.storeRoot, this.resolveEvalFilename(evalRunId));
        if (fs.existsSync(filePath)) {
            await unlink(filePath);
            const index = await this.getEvalsIndex();
            delete index[evalRunId];
            await writeFile(path.resolve(this.indexFile), JSON.stringify(index, null, 2));
        }
    }
    resolveEvalFilename(evalRunId) {
        return `${evalRunId}.json`;
    }
    async resolveIndexFile() {
        const txtPath = path.resolve(this.storeRoot, 'index.txt');
        const jsonPath = path.resolve(this.storeRoot, 'index.json');
        if (fs.existsSync(txtPath)) {
            const keys = await this.processLineByLine(txtPath);
            await writeFile(path.resolve(jsonPath), JSON.stringify(keys, null, 2));
            await unlink(txtPath);
        }
        return jsonPath;
    }
    async processLineByLine(filePath) {
        const fileStream = fs.createReadStream(filePath);
        const keys = {};
        const rl = createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
        for await (const line of rl) {
            try {
                const entry = JSON.parse(line);
                const runKey = EvalRunKeySchema.parse(entry);
                keys[runKey.evalRunId] = runKey;
            }
            catch (e) {
                logger.debug(`Error parsing ${line}:\n`, JSON.stringify(e));
            }
        }
        return keys;
    }
    generateRootPath() {
        return path.resolve(process.cwd(), '.genkit', 'evals');
    }
    async getEvalsIndex() {
        if (!fs.existsSync(this.indexFile)) {
            return Promise.resolve({});
        }
        return await readFile(path.resolve(this.indexFile), 'utf8').then((data) => JSON.parse(data));
    }
}
//# sourceMappingURL=localFileEvalStore.js.map