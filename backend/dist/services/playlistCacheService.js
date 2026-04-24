"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachePlaylistTrack = exports.cachePlaylistTracks = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const streamService_1 = require("./streamService");
const cacheService_1 = require("./cacheService");
const PLAYLIST_CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const getPlaylistCacheKey = (playlistId) => `playlist:${playlistId}:cached`;
const markPlaylistCached = async (playlistId) => {
    if (!cacheService_1.isRedisEnabled || !cacheService_1.redisClient) {
        return;
    }
    try {
        await cacheService_1.redisClient.setex(getPlaylistCacheKey(playlistId), PLAYLIST_CACHE_TTL_SECONDS, '1');
    }
    catch (error) {
        logger_1.default.warn(`Failed to persist playlist cache marker for ${playlistId}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
};
const cachePlaylistTracks = async (playlistId, videoIds) => {
    const sanitizedIds = Array.from(new Set(videoIds.filter(Boolean)));
    if (sanitizedIds.length === 0) {
        return;
    }
    try {
        await (0, streamService_1.resolveMultipleStreamDescriptors)(sanitizedIds);
        await markPlaylistCached(playlistId);
    }
    catch (error) {
        logger_1.default.warn(`Playlist caching failed for ${playlistId}: ${error instanceof Error ? error.message : 'unknown error'}`);
        throw error;
    }
};
exports.cachePlaylistTracks = cachePlaylistTracks;
const cachePlaylistTrack = async (playlistId, videoId) => {
    if (!videoId || typeof videoId !== 'string') {
        throw new Error('A valid video ID is required to cache a playlist track');
    }
    try {
        await (0, streamService_1.resolveStreamDescriptor)(videoId, 'warm');
        await markPlaylistCached(playlistId);
    }
    catch (error) {
        logger_1.default.warn(`Failed to cache playlist track ${videoId} for ${playlistId}: ${error instanceof Error ? error.message : 'unknown error'}`);
        throw error;
    }
};
exports.cachePlaylistTrack = cachePlaylistTrack;
