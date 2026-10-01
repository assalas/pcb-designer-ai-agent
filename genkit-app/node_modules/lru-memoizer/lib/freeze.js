"use strict";
// From https://raw.githubusercontent.com/nikoskalogridis/deep-freeze/fb921b32064dce1645197be2bf975fe0385450b0/index.js
// which is sadly, no longer maintained
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepFreeze = void 0;
function deepFreeze(o) {
    if (o) {
        Object.freeze(o);
        Object.getOwnPropertyNames(o).forEach(function (prop) {
            if (o.hasOwnProperty(prop)
                && o[prop] !== null
                && (typeof o[prop] === 'object' || typeof o[prop] === 'function')
                && (o[prop].constructor !== Buffer)
                && !Object.isFrozen(o[prop])) {
                deepFreeze(o[prop]);
            }
        });
    }
    return o;
}
exports.deepFreeze = deepFreeze;
;
//# sourceMappingURL=freeze.js.map