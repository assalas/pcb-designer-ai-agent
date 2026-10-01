import Configstore from 'configstore';
import { toolsPackage } from './package';
const USER_SETTINGS_TAG = 'userSettings';
export const configstore = new Configstore(toolsPackage.name);
export function getUserSettings() {
    return configstore.get(USER_SETTINGS_TAG) || {};
}
export function setUserSettings(s) {
    configstore.set(USER_SETTINGS_TAG, s);
}
//# sourceMappingURL=configstore.js.map