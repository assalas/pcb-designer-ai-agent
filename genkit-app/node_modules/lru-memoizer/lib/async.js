"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncMemoizer = void 0;
const lru_cache_1 = require("lru-cache");
const events_1 = require("events");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const freeze_1 = require("./freeze");
const sync_1 = require("./sync");
function asyncMemoizer(options) {
    const cache = new lru_cache_1.LRUCache(options);
    const load = options.load;
    const hash = options.hash;
    const bypass = options.bypass;
    const itemTTL = options.itemTTL;
    const freeze = options.freeze;
    const clone = options.clone;
    const queueTTL = options.queueTTL || 1000;
    const loading = new Map();
    const emitter = new events_1.EventEmitter();
    const memoizerMethods = Object.assign({
        del,
        reset: () => cache.clear(),
        keys: () => [...cache.keys()],
        on: emitter.on.bind(emitter),
        once: emitter.once.bind(emitter)
    }, options);
    if (options.disable) {
        return Object.assign(load, memoizerMethods);
    }
    function del(...args) {
        const key = hash(...args);
        cache.delete(key);
    }
    function add(key, parameters, result) {
        if (freeze) {
            result.forEach(freeze_1.deepFreeze);
        }
        if (itemTTL) {
            cache.set(key, result, { ttl: itemTTL(...parameters.concat(result)) });
        }
        else {
            cache.set(key, result);
        }
    }
    function runCallbacks(callbacks, args) {
        for (const callback of callbacks) {
            // Simulate async call when returning from cache
            // and yield between callback resolution
            if (clone) {
                setImmediate(callback, ...args.map(lodash_clonedeep_1.default));
            }
            else {
                setImmediate(callback, ...args);
            }
        }
    }
    function emit(event, ...parameters) {
        emitter.emit(event, ...parameters);
    }
    function memoizedFunction(...args) {
        const parameters = args.slice(0, -1);
        const callback = args.slice(-1).pop();
        let key;
        if (bypass && bypass(...parameters)) {
            emit('miss', ...parameters);
            return load(...args);
        }
        if (parameters.length === 0 && !hash) {
            //the load function only receives callback.
            key = '_';
        }
        else {
            key = hash(...parameters);
        }
        const fromCache = cache.get(key);
        if (fromCache) {
            emit('hit', ...parameters);
            // found, invoke callback
            return runCallbacks([callback], [null].concat(fromCache));
        }
        const pendingLoad = loading.get(key);
        if (pendingLoad && pendingLoad.expiresAt > Date.now()) {
            // request already in progress, queue and return
            pendingLoad.queue.push(callback);
            emit('queue', ...parameters);
            return;
        }
        emit('miss', ...parameters);
        const started = Date.now();
        // no pending request or not resolved before expiration
        // create a new queue and invoke load
        const queue = [callback];
        loading.set(key, {
            queue,
            expiresAt: started + queueTTL
        });
        const loadHandler = (...args) => {
            const err = args[0];
            if (!err) {
                add(key, parameters, args.slice(1));
            }
            // this can potentially delete a different queue than `queue` if
            // this callback was called after expiration.
            // that will only cause a new call to be performed and a new queue to be
            // created
            loading.delete(key);
            emit('loaded', Date.now() - started, ...parameters);
            runCallbacks(queue, args);
        };
        load(...parameters, loadHandler);
    }
    ;
    return Object.assign(memoizedFunction, memoizerMethods);
}
exports.asyncMemoizer = asyncMemoizer;
asyncMemoizer.sync = sync_1.syncMemoizer;
//# sourceMappingURL=async.js.map