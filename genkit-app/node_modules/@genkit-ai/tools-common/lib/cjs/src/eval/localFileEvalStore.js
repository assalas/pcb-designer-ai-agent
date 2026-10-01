"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFileEvalStore = void 0;
const fs_1 = __importDefault(require("fs"));
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const readline_1 = require("readline");
const eval_1 = require("../types/eval");
const logger_1 = require("../utils/logger");
class LocalFileEvalStore {
    storeRoot = '';
    indexFile = '';
    static cachedEvalStore = null;
    async init() {
        this.storeRoot = this.generateRootPath();
        this.indexFile = await this.resolveIndexFile();
        fs_1.default.mkdirSync(this.storeRoot, { recursive: true });
        if (!fs_1.default.existsSync(this.indexFile)) {
            fs_1.default.writeFileSync(path_1.default.resolve(this.indexFile), JSON.stringify({}));
        }
        logger_1.logger.debug(`Initialized local file eval store at root: ${this.storeRoot}`);
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
        logger_1.logger.debug(`Saving EvalRun ${evalRun.key.evalRunId} to ` +
            path_1.default.resolve(this.storeRoot, fileName));
        await (0, promises_1.writeFile)(path_1.default.resolve(this.storeRoot, fileName), JSON.stringify(evalRun));
        const index = await this.getEvalsIndex();
        index[evalRun.key.evalRunId] = evalRun.key;
        await (0, promises_1.writeFile)(path_1.default.resolve(this.indexFile), JSON.stringify(index, null, 2));
    }
    async load(evalRunId) {
        const filePath = path_1.default.resolve(this.storeRoot, this.resolveEvalFilename(evalRunId));
        if (!fs_1.default.existsSync(filePath)) {
            return undefined;
        }
        return await (0, promises_1.readFile)(filePath, 'utf8').then((data) => eval_1.EvalRunSchema.parse(JSON.parse(data)));
    }
    async list(query) {
        logger_1.logger.debug(`Listing keys for filter: ${JSON.stringify(query)}`);
        let keys = await this.getEvalsIndex().then((index) => Object.values(index));
        if (query?.filter?.actionRef) {
            keys = keys.filter((key) => key.actionRef === query?.filter?.actionRef);
        }
        return {
            evalRunKeys: keys,
        };
    }
    async delete(evalRunId) {
        const filePath = path_1.default.resolve(this.storeRoot, this.resolveEvalFilename(evalRunId));
        if (fs_1.default.existsSync(filePath)) {
            await (0, promises_1.unlink)(filePath);
            const index = await this.getEvalsIndex();
            delete index[evalRunId];
            await (0, promises_1.writeFile)(path_1.default.resolve(this.indexFile), JSON.stringify(index, null, 2));
        }
    }
    resolveEvalFilename(evalRunId) {
        return `${evalRunId}.json`;
    }
    async resolveIndexFile() {
        const txtPath = path_1.default.resolve(this.storeRoot, 'index.txt');
        const jsonPath = path_1.default.resolve(this.storeRoot, 'index.json');
        if (fs_1.default.existsSync(txtPath)) {
            const keys = await this.processLineByLine(txtPath);
            await (0, promises_1.writeFile)(path_1.default.resolve(jsonPath), JSON.stringify(keys, null, 2));
            await (0, promises_1.unlink)(txtPath);
        }
        return jsonPath;
    }
    async processLineByLine(filePath) {
        const fileStream = fs_1.default.createReadStream(filePath);
        const keys = {};
        const rl = (0, readline_1.createInterface)({
            input: fileStream,
            crlfDelay: Infinity,
        });
        for await (const line of rl) {
            try {
                const entry = JSON.parse(line);
                const runKey = eval_1.EvalRunKeySchema.parse(entry);
                keys[runKey.evalRunId] = runKey;
            }
            catch (e) {
                logger_1.logger.debug(`Error parsing ${line}:\n`, JSON.stringify(e));
            }
        }
        return keys;
    }
    generateRootPath() {
        return path_1.default.resolve(process.cwd(), '.genkit', 'evals');
    }
    async getEvalsIndex() {
        if (!fs_1.default.existsSync(this.indexFile)) {
            return Promise.resolve({});
        }
        return await (0, promises_1.readFile)(path_1.default.resolve(this.indexFile), 'utf8').then((data) => JSON.parse(data));
    }
}
exports.LocalFileEvalStore = LocalFileEvalStore;
//# sourceMappingURL=localFileEvalStore.js.map