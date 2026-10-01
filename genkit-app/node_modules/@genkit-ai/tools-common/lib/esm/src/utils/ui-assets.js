import AdmZip from 'adm-zip';
import axios from 'axios';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { logger } from './logger';
export async function downloadAndExtractUiAssets({ fileUrl, extractPath, zipFileName, }) {
    try {
        const downloadedFilePath = path.join(extractPath, zipFileName);
        if (!existsSync(downloadedFilePath)) {
            const response = await axios({
                url: fileUrl,
                method: 'GET',
                responseType: 'arraybuffer',
            });
            mkdirSync(extractPath, { recursive: true });
            writeFileSync(downloadedFilePath, response.data);
        }
        const zip = new AdmZip(downloadedFilePath);
        zip.extractAllTo(extractPath, true);
    }
    catch (error) {
        logger.error('Error downloading or extracting UI assets zip: ', error);
    }
}
//# sourceMappingURL=ui-assets.js.map