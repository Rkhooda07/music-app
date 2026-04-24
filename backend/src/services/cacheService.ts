import Redis from 'ioredis';
import { StreamDescriptor } from './musicTypes';

const redisUrl = process.env.REDIS_URL?.trim();
export const redisClient = redisUrl ? new Redis(redisUrl) : null;
export const isRedisEnabled = Boolean(redisClient);

export const getCachedStreamDescriptor = async (videoId: string): Promise<StreamDescriptor | null> => {
  if (!redisClient) {
    return null;
  }

  const cached = await redisClient.get(`stream:${videoId}`);
  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(cached) as StreamDescriptor;
  } catch {
    return null;
  }
};

export const setCachedStreamDescriptor = async (
  videoId: string,
  descriptor: StreamDescriptor,
  ttlSeconds: number,
): Promise<void> => {
  if (!redisClient) {
    return;
  }

  await redisClient.setex(`stream:${videoId}`, ttlSeconds, JSON.stringify(descriptor));
};
