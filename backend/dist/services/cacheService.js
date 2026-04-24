"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCachedStreamDescriptor = exports.getCachedStreamDescriptor = exports.isRedisEnabled = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redisUrl = process.env.REDIS_URL?.trim();
exports.redisClient = redisUrl ? new ioredis_1.default(redisUrl) : null;
exports.isRedisEnabled = Boolean(exports.redisClient);
const getCachedStreamDescriptor = async (videoId) => {
    if (!exports.redisClient) {
        return null;
    }
    const cached = await exports.redisClient.get(`stream:${videoId}`);
    if (!cached) {
        return null;
    }
    try {
        return JSON.parse(cached);
    }
    catch {
        return null;
    }
};
exports.getCachedStreamDescriptor = getCachedStreamDescriptor;
const setCachedStreamDescriptor = async (videoId, descriptor, ttlSeconds) => {
    if (!exports.redisClient) {
        return;
    }
    await exports.redisClient.setex(`stream:${videoId}`, ttlSeconds, JSON.stringify(descriptor));
};
exports.setCachedStreamDescriptor = setCachedStreamDescriptor;
