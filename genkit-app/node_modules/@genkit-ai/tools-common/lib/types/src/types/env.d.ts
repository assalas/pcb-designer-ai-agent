export interface EnvironmentVariable {
    name: string;
    value: string;
}
export interface GenkitEnvironment {
    packageVersion?: string;
    cliPackageVersion?: string;
    environmentVars?: EnvironmentVariable[];
}
