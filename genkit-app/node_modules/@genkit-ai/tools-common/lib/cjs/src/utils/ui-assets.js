"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadAndExtractUiAssets = downloadAndExtractUiAssets;
const adm_zip_1 = __importDefault(require("adm-zip"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
async function downloadAndExtractUiAssets({ fileUrl, extractPath, zipFileName, }) {
    try {
        const downloadedFilePath = path_1.default.join(extractPath, zipFileName);
        if (!(0, fs_1.existsSync)(downloadedFilePath)) {
            const response = await (0, axios_1.default)({
                url: fileUrl,
                method: 'GET',
                responseType: 'arraybuffer',
            });
            (0, fs_1.mkdirSync)(extractPath, { recursive: true });
            (0, fs_1.writeFileSync)(downloadedFilePath, response.data);
        }
        const zip = new adm_zip_1.default(downloadedFilePath);
        zip.extractAllTo(extractPath, true);
    }
    catch (error) {
        logger_1.logger.error('Error downloading or extracting UI assets zip: ', error);
    }
}
//# sourceMappingURL=ui-assets.js.map