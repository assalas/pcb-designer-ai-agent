"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMemoizer = void 0;
const lru_cache_1 = require("lru-cache");
const events_1 = require("events");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const freeze_1 = require("./freeze");
function syncMemoizer(options) {
    const cache = new lru_cache_1.LRUCache(options);
    const load = options.load;
    const hash = options.hash;
    const bypass = options.bypass;
    const itemTTL = options.itemTTL;
    const freeze = options.freeze;
    const clone = options.clone;
    const emitter = new events_1.EventEmitter();
    const defaultResult = Object.assign({
        del,
        reset: () => cache.clear(),
        keys: () => [...cache.keys()],
        on: emitter.on.bind(emitter),
        once: emitter.once.bind(emitter),
    }, options);
    if (options.disable) {
        return Object.assign(load, defaultResult);
    }
    function del() {
        const key = hash(...arguments);
        cache.delete(key);
    }
    function emit(event, ...parameters) {
        emitter.emit(event, ...parameters);
    }
    function isPromise(result) {
        // detect native, bluebird, A+ promises
        return result && result.then && typeof result.then === 'function';
    }
    function processResult(result) {
        let res = result;
        if (clone) {
            if (isPromise(res)) {
                res = res.then(lodash_clonedeep_1.default);
            }
            else {
                res = (0, lodash_clonedeep_1.default)(res);
            }
        }
        if (freeze) {
            if (isPromise(res)) {
                res = res.then(freeze_1.deepFreeze);
            }
            else {
                (0, freeze_1.deepFreeze)(res);
            }
        }
        return res;
    }
    const result = function (...args) {
        if (bypass && bypass(...args)) {
            emit('miss', ...args);
            return load(...args);
        }
        var key = hash(...args);
        var fromCache = cache.get(key);
        if (fromCache) {
            emit('hit', ...args);
            return processResult(fromCache);
        }
        emit('miss', ...args);
        const result = load(...args);
        if (itemTTL) {
            // @ts-ignore
            cache.set(key, result, { ttl: itemTTL(...args.concat([result])) });
        }
        else {
            cache.set(key, result);
        }
        return processResult(result);
    };
    return Object.assign(result, defaultResult);
}
exports.syncMemoizer = syncMemoizer;
//# sourceMappingURL=sync.js.map