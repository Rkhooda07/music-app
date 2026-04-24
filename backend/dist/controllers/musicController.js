"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFormats = exports.cachePlaylistTrackHandler = exports.cachePlaylist = exports.streamAudio = exports.getStreamUrl = exports.searchMusic = void 0;
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const streamService_1 = require("../services/streamService");
const playlistCacheService_1 = require("../services/playlistCacheService");
const youtubeDataApiService_1 = require("../services/youtubeDataApiService");
const ytDlpService_1 = require("../services/ytDlpService");
const logger_1 = __importDefault(require("../utils/logger"));
const searchQueryCache = new Map();
const SEARCH_TTL = 24 * 60 * 60 * 1000; // 24 hours
const isFreshSearchEntry = (entry) => {
    return Boolean(entry?.data && entry.expiresAt && entry.expiresAt > Date.now());
};
const shouldFallbackToYtDlp = (error) => {
    return error instanceof youtubeDataApiService_1.YouTubeDataApiError && error.shouldFallbackToYtDlp;
};
const loadSearchResults = async (query) => {
    try {
        return await (0, youtubeDataApiService_1.searchYouTubeWithDataApi)(query);
    }
    catch (error) {
        if (!shouldFallbackToYtDlp(error)) {
            throw error;
        }
        const message = error instanceof Error ? error.message : 'unknown error';
        logger_1.default.warn(`Falling back to yt-dlp search for "${query}": ${message}`);
        return (0, ytDlpService_1.searchYouTube)(query);
    }
};
const searchMusic = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        const query = q.trim().toLowerCase();
        const cachedSearch = searchQueryCache.get(query);
        if (isFreshSearchEntry(cachedSearch)) {
            logger_1.default.info(`Search cache hit: ${query}`);
            res.json({ data: cachedSearch.data });
            (0, streamService_1.warmTopSearchResults)(cachedSearch.data);
            return;
        }
        const pendingPromise = cachedSearch?.pendingPromise || loadSearchResults(query);
        searchQueryCache.set(query, { ...cachedSearch, pendingPromise });
        const results = await pendingPromise;
        searchQueryCache.set(query, {
            data: results,
            expiresAt: Date.now() + SEARCH_TTL,
        });
        res.json({ data: results });
        (0, streamService_1.warmTopSearchResults)(results);
    }
    catch (error) {
        searchQueryCache.delete(String(req.query.q || '').trim().toLowerCase());
        next(error);
    }
};
exports.searchMusic = searchMusic;
const getStreamUrl = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        if (!videoId || typeof videoId !== 'string') {
            return res.status(400).json({ error: 'Video ID is required' });
        }
        const quality = req.query.quality === 'low' ? 'low' : 'best';
        const streamDescriptor = quality === 'low'
            ? await (0, ytDlpService_1.getAudioStreamDescriptor)(videoId, 'low')
            : await (0, streamService_1.resolveStreamDescriptor)(videoId, 'play');
        res.json({ url: streamDescriptor.url });
    }
    catch (error) {
        next(error);
    }
};
exports.getStreamUrl = getStreamUrl;
const streamAudio = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        if (!videoId || typeof videoId !== 'string') {
            return res.status(400).json({ error: 'Video ID is required' });
        }
        const quality = req.query.quality === 'low' ? 'low' : 'best';
        const streamDescriptor = quality === 'low'
            ? await (0, ytDlpService_1.getAudioStreamDescriptor)(videoId, 'low')
            : await (0, streamService_1.resolveStreamDescriptor)(videoId, 'play');
        const abortController = new AbortController();
        const forwardedHeaders = {
            ...streamDescriptor.httpHeaders,
        };
        const range = req.headers.range;
        const ifRange = req.headers['if-range'];
        if (typeof range === 'string') {
            forwardedHeaders.Range = range;
        }
        if (typeof ifRange === 'string') {
            forwardedHeaders['If-Range'] = ifRange;
        }
        const closeHandler = () => {
            abortController.abort();
        };
        req.on('close', closeHandler);
        try {
            const upstreamResponse = await fetch(streamDescriptor.url, {
                headers: forwardedHeaders,
                signal: abortController.signal,
            });
            const responseHeaders = [
                'accept-ranges',
                'cache-control',
                'content-length',
                'content-range',
                'content-type',
                'etag',
                'last-modified',
            ];
            responseHeaders.forEach((headerName) => {
                const headerValue = upstreamResponse.headers.get(headerName);
                if (headerValue) {
                    res.setHeader(headerName, headerValue);
                }
            });
            res.status(upstreamResponse.status);
            if (!upstreamResponse.body) {
                res.end();
                return;
            }
            const bodyStream = stream_1.Readable.fromWeb(upstreamResponse.body);
            try {
                await (0, promises_1.pipeline)(bodyStream, res);
            }
            catch (pipelineError) {
                if (pipelineError instanceof Error &&
                    (pipelineError.name === 'AbortError' || pipelineError.message.includes('Premature close'))) {
                    return;
                }
                if (res.headersSent || req.aborted || res.writableEnded) {
                    return;
                }
                throw pipelineError;
            }
        }
        finally {
            req.off('close', closeHandler);
        }
    }
    catch (error) {
        if (error instanceof Error &&
            (error.name === 'AbortError' || error.message.includes('Premature close'))) {
            return;
        }
        if (res.headersSent || req.aborted || res.writableEnded) {
            return;
        }
        next(error);
    }
};
exports.streamAudio = streamAudio;
const cachePlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { trackIds } = req.body;
        if (!playlistId || typeof playlistId !== 'string') {
            return res.status(400).json({ error: 'Playlist ID is required' });
        }
        if (!Array.isArray(trackIds) || trackIds.some((id) => typeof id !== 'string' || !id.trim())) {
            return res.status(400).json({ error: 'trackIds must be a non-empty array of strings' });
        }
        await (0, playlistCacheService_1.cachePlaylistTracks)(playlistId, trackIds);
        res.status(200).json({ message: 'Playlist tracks cached' });
    }
    catch (error) {
        next(error);
    }
};
exports.cachePlaylist = cachePlaylist;
const cachePlaylistTrackHandler = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { trackId } = req.body;
        if (!playlistId || typeof playlistId !== 'string') {
            return res.status(400).json({ error: 'Playlist ID is required' });
        }
        if (!trackId || typeof trackId !== 'string') {
            return res.status(400).json({ error: 'trackId is required' });
        }
        await (0, playlistCacheService_1.cachePlaylistTrack)(playlistId, trackId);
        res.status(200).json({ message: 'Track cached for playlist' });
    }
    catch (error) {
        next(error);
    }
};
exports.cachePlaylistTrackHandler = cachePlaylistTrackHandler;
const listFormats = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        if (!videoId || typeof videoId !== 'string') {
            return res.status(400).json({ error: 'Video ID is required' });
        }
        const formats = await (0, ytDlpService_1.listFormats)(videoId);
        res.type('text/plain').send(formats);
    }
    catch (error) {
        next(error);
    }
};
exports.listFormats = listFormats;
