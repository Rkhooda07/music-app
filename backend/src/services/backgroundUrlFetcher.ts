import logger from '../utils/logger';
import { resolveStreamDescriptor } from './streamService';
import { getTrendingVideoIds } from './youtubeDataApiService';

const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_BATCH_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class BackgroundUrlFetcher {
  private isRunning = false;

  async start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const trendingIds = await this.getTrendingSongIds();
      if (trendingIds.length === 0) {
        logger.info('BackgroundUrlFetcher: no trending songs available to warm');
        return;
      }

      logger.info(`BackgroundUrlFetcher: warming ${trendingIds.length} trending songs`);
      const batches = this.chunkArray(trendingIds, DEFAULT_BATCH_SIZE);

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (videoId) => {
            try {
              await resolveStreamDescriptor(videoId, 'warm');
            } catch (error) {
              logger.warn(`BackgroundUrlFetcher failed to warm ${videoId}: ${error instanceof Error ? error.message : 'unknown error'}`);
            }
          }),
        );
        await sleep(DEFAULT_BATCH_DELAY_MS);
      }
    } catch (error) {
      logger.warn(`BackgroundUrlFetcher start failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async getTrendingSongIds(): Promise<string[]> {
    try {
      return await getTrendingVideoIds(20);
    } catch (error) {
      logger.warn(`BackgroundUrlFetcher could not fetch trending songs: ${error instanceof Error ? error.message : 'unknown error'}`);
      return [];
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

export default new BackgroundUrlFetcher();
