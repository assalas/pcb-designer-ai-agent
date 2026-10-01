import Configstore from 'configstore';
export declare const configstore: Configstore;
export declare function getUserSettings(): Record<string, string | boolean | number>;
export declare function setUserSettings(s: Record<string, string | boolean | number>): void;
