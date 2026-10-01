'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepKeysFromList = exports.deepKeys = void 0;
const utils = __importStar(require("./utils"));
__exportStar(require("./types"), exports);
/**
 * Return the deep keys list for a single document
 * @param object
 * @param options
 * @returns {Array}
 */
function deepKeys(object, options) {
    const parsedOptions = mergeOptions(options);
    const visited = new WeakSet();
    if (typeof object === 'object' && object !== null) {
        return generateDeepKeysList('', object, parsedOptions, visited);
    }
    return [];
}
exports.deepKeys = deepKeys;
/**
 * Return the deep keys list for all documents in the provided list
 * @param list
 * @param options
 * @returns Array[Array[String]]
 */
function deepKeysFromList(list, options, visited) {
    const parsedOptions = mergeOptions(options);
    const localVisited = visited ?? new WeakSet();
    return list.map((document) => {
        if (typeof document === 'object' && document !== null) {
            // avoid re-traversing objects we've already seen (circular refs)
            if (localVisited.has(document)) {
                return [];
            }
            // if the data at the key is a document, then we retrieve the subHeading starting with an empty string heading and the doc
            return generateDeepKeysList('', document, parsedOptions, localVisited);
        }
        return [];
    });
}
exports.deepKeysFromList = deepKeysFromList;
function generateDeepKeysList(heading, data, options, visited) {
    const result = [];
    const rootKeys = Object.keys(data);
    // mark root as visited to match recursive entry behavior
    visited.add(data);
    const stack = [{ obj: data, keys: rootKeys, i: 0, basePath: heading }];
    while (stack.length) {
        const frame = stack[stack.length - 1];
        if (frame.i >= frame.keys.length) {
            // finished this object
            stack.pop();
            continue;
        }
        const currentKey = frame.keys[frame.i++];
        const value = frame.obj[currentKey];
        const keyName = buildKeyName(frame.basePath, escapeNestedDotsIfSpecified(currentKey, options));
        // If nested document or array-as-object via arrayIndexesAsKeys, descend (push new frame)
        if ((options.expandNestedObjects && utils.isDocumentToRecurOn(value)) || (options.arrayIndexesAsKeys && Array.isArray(value) && value.length)) {
            if (options.arrayIndexesAsKeys && Array.isArray(value)) {
                // treat array like an object with numeric keys
                const arr = value;
                // push frames in reverse so they are processed in increasing index order
                for (let idx = arr.length - 1; idx >= 0; idx--) {
                    const elem = arr[idx];
                    const elemPath = buildKeyName(keyName, String(idx));
                    if (typeof elem === 'object' && elem !== null && !Array.isArray(elem)) {
                        if (!visited.has(elem)) {
                            visited.add(elem);
                            stack.push({ obj: elem, keys: Object.keys(elem), i: 0, basePath: elemPath });
                        }
                    }
                    else {
                        // non-object -> behave like leaf (original recursion would have produced the index path)
                        result.push(elemPath);
                    }
                }
            }
            else {
                // value is an object -> push its frame (if not visited)
                if (!visited.has(value)) {
                    visited.add(value);
                    stack.push({ obj: value, keys: Object.keys(value), i: 0, basePath: keyName });
                }
            }
        }
        else if (options.expandArrayObjects && Array.isArray(value)) {
            // call helper and append its results in order
            const subKeys = processArrayKeys(value, keyName, options, visited);
            for (const k of subKeys) {
                result.push(k);
            }
        }
        else if (options.ignoreEmptyArrays && Array.isArray(value) && !value.length) {
            // skip
            continue;
        }
        else {
            // leaf key
            result.push(keyName);
        }
    }
    return utils.unique(result);
}
/**
 * Helper function to handle the processing of arrays when the expandArrayObjects
 * option is specified.
 * @param subArray
 * @param currentKeyPath
 * @param options
 * @returns {*}
 */
function processArrayKeys(subArray, currentKeyPath, options, visited) {
    let subArrayKeys = deepKeysFromList(subArray, options, visited);
    if (!subArray.length) {
        return options.ignoreEmptyArraysWhenExpanding ? [] : [currentKeyPath];
    }
    else if (subArray.length && utils.flatten(subArrayKeys).length === 0) {
        // Has items in the array, but no objects
        return [currentKeyPath];
    }
    else {
        subArrayKeys = subArrayKeys.map((schemaKeys) => {
            if (Array.isArray(schemaKeys) && schemaKeys.length === 0) {
                return [currentKeyPath];
            }
            return schemaKeys.map((subKey) => buildKeyName(currentKeyPath, escapeNestedDotsIfSpecified(subKey, options)));
        });
        return utils.unique(utils.flatten(subArrayKeys));
    }
}
function escapeNestedDotsIfSpecified(key, options) {
    if (options.escapeNestedDots) {
        return key.replace(/\./g, '\\.');
    }
    return key;
}
/**
 * Function used to generate the key path
 * @param upperKeyName String accumulated key path
 * @param currentKeyName String current key name
 * @returns String
 */
function buildKeyName(upperKeyName, currentKeyName) {
    if (upperKeyName) {
        return upperKeyName + '.' + currentKeyName;
    }
    return currentKeyName;
}
function mergeOptions(options) {
    return {
        arrayIndexesAsKeys: false,
        expandNestedObjects: true,
        expandArrayObjects: false,
        ignoreEmptyArraysWhenExpanding: false,
        escapeNestedDots: false,
        ignoreEmptyArrays: false,
        ...(options ?? {})
    };
}
