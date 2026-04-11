import logger from '../utils/logger';
import { MusicSearchResult, StreamDescriptor } from './musicTypes';
import { getAudioStreamDescriptor } from './ytDlpService';

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

const storeResolvedDescriptor = (videoId: string, descriptor: StreamDescriptor) => {
  streamCache.set(videoId, descriptor);
  return descriptor;
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

  getAudioStreamDescriptor(nextJob.videoId)
    .then((descriptor) => {
      storeResolvedDescriptor(nextJob.videoId, descriptor);
      nextJob.resolve(descriptor);
    })
    .catch((error) => {
      streamCache.delete(nextJob.videoId);
      nextJob.reject(error);
    })
    .finally(() => {
      activeExtractions -= 1;
      runNextQueuedExtraction();
    });
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
