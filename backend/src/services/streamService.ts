import logger from '../utils/logger';
import { MusicSearchResult, StreamDescriptor } from './musicTypes';
import { getAudioStreamDescriptor } from './ytDlpService';
import { getCachedStreamDescriptor, setCachedStreamDescriptor, isRedisEnabled } from './cacheService';

type StreamPriority = 'play' | 'warm';

interface CacheEntry extends Partial<StreamDescriptor> {
  pendingPromise?: Promise<StreamDescriptor>;
}

interface QueueJob {
  videoId: string;
  priority: StreamPriority;
  resolve: (descriptor: StreamDescriptor) => void;
  reject: (error: unknown) => void;
}

const streamCache = new Map<string, CacheEntry>();
const playQueue: QueueJob[] = [];
const warmQueue: QueueJob[] = [];
const MAX_CONCURRENT_EXTRACTIONS = 1;
const STREAM_EXPIRY_SKEW_MS = 15_000;
let activeExtractions = 0;

const isFreshDescriptor = (entry?: Partial<StreamDescriptor>): entry is StreamDescriptor => {
  return Boolean(entry?.url && entry?.expiresAt && entry.expiresAt - STREAM_EXPIRY_SKEW_MS > Date.now());
};

const STREAM_DESCRIPTOR_TTL_SECONDS = 3600;
const REFRESH_WINDOW_MS = 60 * 60 * 1000;

const storeResolvedDescriptor = (videoId: string, descriptor: StreamDescriptor) => {
  streamCache.set(videoId, descriptor);
  return descriptor;
};

const retrieveDescriptorFromRedis = async (videoId: string): Promise<StreamDescriptor | null> => {
  if (!isRedisEnabled) {
    return null;
  }

  try {
    const cached = await getCachedStreamDescriptor(videoId);
    return cached && isFreshDescriptor(cached) ? cached : null;
  } catch (error) {
    logger.warn(`Redis read failed for ${videoId}: ${error instanceof Error ? error.message : 'unknown error'}`);
    return null;
  }
};

const cacheDescriptorToRedis = async (videoId: string, descriptor: StreamDescriptor) => {
  if (!isRedisEnabled) {
    return;
  }

  try {
    await setCachedStreamDescriptor(videoId, descriptor, STREAM_DESCRIPTOR_TTL_SECONDS);
  } catch (error) {
    logger.warn(`Redis write failed for ${videoId}: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
};

const runNextQueuedExtraction = () => {
  if (activeExtractions >= MAX_CONCURRENT_EXTRACTIONS) {
    return;
  }

  const nextJob = playQueue.shift() || warmQueue.shift();
  if (!nextJob) {
    return;
  }

  activeExtractions += 1;

  (async () => {
    try {
      const redisDescriptor = await retrieveDescriptorFromRedis(nextJob.videoId);
      if (redisDescriptor) {
        storeResolvedDescriptor(nextJob.videoId, redisDescriptor);
        nextJob.resolve(redisDescriptor);
        return;
      }

      const descriptor = await getAudioStreamDescriptor(nextJob.videoId);
      await cacheDescriptorToRedis(nextJob.videoId, descriptor);
      storeResolvedDescriptor(nextJob.videoId, descriptor);
      nextJob.resolve(descriptor);
    } catch (error) {
      streamCache.delete(nextJob.videoId);
      nextJob.reject(error);
    } finally {
      activeExtractions -= 1;
      runNextQueuedExtraction();
    }
  })();
};

export const resolveStreamDescriptor = async (
  videoId: string,
  priority: StreamPriority = 'play',
): Promise<StreamDescriptor> => {
  const cached = streamCache.get(videoId);
  if (isFreshDescriptor(cached)) {
    return cached;
  }

  if (cached?.pendingPromise) {
    return cached.pendingPromise;
  }

  const pendingPromise = new Promise<StreamDescriptor>((resolve, reject) => {
    const job: QueueJob = { videoId, priority, resolve, reject };
    if (priority === 'play') {
      playQueue.push(job);
    } else {
      warmQueue.push(job);
    }

    runNextQueuedExtraction();
  });

  streamCache.set(videoId, { ...cached, pendingPromise });

  try {
    return await pendingPromise;
  } catch (error) {
    throw error;
  }
};

export const resolveMultipleStreamDescriptors = async (videoIds: string[]): Promise<StreamDescriptor[]> => {
  const uniqueIds = Array.from(new Set(videoIds.filter(Boolean)));
  return Promise.all(uniqueIds.map((videoId) => resolveStreamDescriptor(videoId, 'warm')));
};

export const refreshSoonExpiringStreamCache = async (): Promise<void> => {
  const now = Date.now();
  const retryJobs = Array.from(streamCache.entries())
    .filter(([, entry]) => isFreshDescriptor(entry) && entry.expiresAt - now < REFRESH_WINDOW_MS)
    .map(([videoId]) => resolveStreamDescriptor(videoId, 'warm'));

  await Promise.allSettled(retryJobs);
};

export const warmTopSearchResults = (tracks: MusicSearchResult[], limit = 3) => {
  tracks.slice(0, limit).forEach((track) => {
    resolveStreamDescriptor(track.id, 'warm')
      .then(() => {
        logger.info(`Pre-warmed track: ${track.id}`);
      })
      .catch((error) => {
        logger.warn(`Pre-warm failed for ${track.id}: ${error instanceof Error ? error.message : 'unknown error'}`);
      });
  });
};
