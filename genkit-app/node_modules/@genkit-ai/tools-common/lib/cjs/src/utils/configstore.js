"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configstore = void 0;
exports.getUserSettings = getUserSettings;
exports.setUserSettings = setUserSettings;
const configstore_1 = __importDefault(require("configstore"));
const package_1 = require("./package");
const USER_SETTINGS_TAG = 'userSettings';
exports.configstore = new configstore_1.default(package_1.toolsPackage.name);
function getUserSettings() {
    return exports.configstore.get(USER_SETTINGS_TAG) || {};
}
function setUserSettings(s) {
    exports.configstore.set(USER_SETTINGS_TAG, s);
}
//# sourceMappingURL=configstore.js.map