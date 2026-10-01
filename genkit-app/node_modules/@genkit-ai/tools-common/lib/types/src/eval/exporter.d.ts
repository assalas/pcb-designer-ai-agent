import type { EvalRun } from '../types/eval';
export type EvalExporter = (evalRun: EvalRun, filePath: string) => Promise<void>;
export declare function toCsv(evalRun: EvalRun, filePath: string): Promise<void>;
export declare function toJson(evalRun: EvalRun, filePath: string): Promise<void>;
export declare function getExporterForString(outputFormat: string): EvalExporter;
