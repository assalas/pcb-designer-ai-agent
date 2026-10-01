import type { DefaultJson2CsvOptions } from './types';
export declare const Json2Csv: (options: DefaultJson2CsvOptions) => {
    convert: (data: object[]) => string;
};
