import logger from '../utils/logger';
import { resolveMultipleStreamDescriptors, resolveStreamDescriptor } from './streamService';
import { redisClient, isRedisEnabled } from './cacheService';

const PLAYLIST_CACHE_TTL_SECONDS = 60 * 60; // 1 hour

const getPlaylistCacheKey = (playlistId: string) => `playlist:${playlistId}:cached`;

const markPlaylistCached = async (playlistId: string): Promise<void> => {
  if (!isRedisEnabled || !redisClient) {
    return;
  }

  try {
    await redisClient.setex(getPlaylistCacheKey(playlistId), PLAYLIST_CACHE_TTL_SECONDS, '1');
  } catch (error) {
    logger.warn(
      `Failed to persist playlist cache marker for ${playlistId}: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    );
  }
};

export const cachePlaylistTracks = async (playlistId: string, videoIds: string[]): Promise<void> => {
  const sanitizedIds = Array.from(new Set(videoIds.filter(Boolean)));
  if (sanitizedIds.length === 0) {
    return;
  }

  try {
    await resolveMultipleStreamDescriptors(sanitizedIds);
    await markPlaylistCached(playlistId);
  } catch (error) {
    logger.warn(
      `Playlist caching failed for ${playlistId}: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
    throw error;
  }
};

export const cachePlaylistTrack = async (playlistId: string, videoId: string): Promise<void> => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('A valid video ID is required to cache a playlist track');
  }

  try {
    await resolveStreamDescriptor(videoId, 'warm');
    await markPlaylistCached(playlistId);
  } catch (error) {
    logger.warn(
      `Failed to cache playlist track ${videoId} for ${playlistId}: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    );
    throw error;
  }
};
