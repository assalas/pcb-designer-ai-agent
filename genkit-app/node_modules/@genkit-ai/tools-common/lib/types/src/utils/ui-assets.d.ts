interface DownloadAndExtractOptions {
    fileUrl: string;
    extractPath: string;
    zipFileName: string;
}
export declare function downloadAndExtractUiAssets({ fileUrl, extractPath, zipFileName, }: DownloadAndExtractOptions): Promise<void>;
export {};
