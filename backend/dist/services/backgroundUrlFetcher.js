"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const streamService_1 = require("./streamService");
const youtubeDataApiService_1 = require("./youtubeDataApiService");
const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_BATCH_DELAY_MS = 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class BackgroundUrlFetcher {
    isRunning = false;
    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        try {
            const trendingIds = await this.getTrendingSongIds();
            if (trendingIds.length === 0) {
                logger_1.default.info('BackgroundUrlFetcher: no trending songs available to warm');
                return;
            }
            logger_1.default.info(`BackgroundUrlFetcher: warming ${trendingIds.length} trending songs`);
            const batches = this.chunkArray(trendingIds, DEFAULT_BATCH_SIZE);
            for (const batch of batches) {
                await Promise.all(batch.map(async (videoId) => {
                    try {
                        await (0, streamService_1.resolveStreamDescriptor)(videoId, 'warm');
                    }
                    catch (error) {
                        logger_1.default.warn(`BackgroundUrlFetcher failed to warm ${videoId}: ${error instanceof Error ? error.message : 'unknown error'}`);
                    }
                }));
                await sleep(DEFAULT_BATCH_DELAY_MS);
            }
        }
        catch (error) {
            logger_1.default.warn(`BackgroundUrlFetcher start failed: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
        finally {
            this.isRunning = false;
        }
    }
    async getTrendingSongIds() {
        try {
            return await (0, youtubeDataApiService_1.getTrendingVideoIds)(20);
        }
        catch (error) {
            logger_1.default.warn(`BackgroundUrlFetcher could not fetch trending songs: ${error instanceof Error ? error.message : 'unknown error'}`);
            return [];
        }
    }
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}
exports.default = new BackgroundUrlFetcher();
