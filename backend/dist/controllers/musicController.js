"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamAudio = exports.getStreamUrl = exports.searchMusic = void 0;
const ytDlpService_1 = require("../services/ytDlpService");
const logger_1 = __importDefault(require("../utils/logger"));
// In-memory caches
const searchQueryCache = new Map();
const streamCache = new Map();
const SEARCH_TTL = 24 * 60 * 60 * 1000; // 24 hours
const STREAM_TTL = 30 * 60 * 1000; // 30 minutes
const searchMusic = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        const query = q.trim().toLowerCase();
        // 1. Check Search Cache (Instant hit)
        const cachedSearch = searchQueryCache.get(query);
        if (cachedSearch && Date.now() - cachedSearch.timestamp < SEARCH_TTL) {
            logger_1.default.info(`Search cache hit: ${query}`);
            // Immediately return cached results
            res.json({ data: cachedSearch.data });
            // Still pre-warm top 3 results in the background in case streamCache expired
            preWarmTracks(cachedSearch.data.slice(0, 3));
            return;
        }
        // 2. Perform fresh search
        const results = await (0, ytDlpService_1.searchYouTube)(query);
        searchQueryCache.set(query, { data: results, timestamp: Date.now() });
        // Return to user immediately
        res.json({ data: results });
        // 3. BACKGROUND PRE-WARMING (The "Spotify" trick)
        // While the user is browsing results, we secretly fetch the stream URLs 
        // for the top 3 results so they are ready when the user clicks 'Play'.
        preWarmTracks(results.slice(0, 3));
    }
    catch (error) {
        next(error);
    }
};
exports.searchMusic = searchMusic;
/**
 * Background worker to pre-extract stream URLs
 */
const preWarmTracks = (tracks) => {
    tracks.forEach(track => {
        const videoId = track.id;
        if (!streamCache.has(videoId) || Date.now() - streamCache.get(videoId).timestamp > STREAM_TTL) {
            (0, ytDlpService_1.getAudioStreamUrl)(videoId)
                .then(url => {
                logger_1.default.info(`Pre-warmed track: ${videoId}`);
                streamCache.set(videoId, { url, timestamp: Date.now() });
            })
                .catch(() => { });
        }
    });
};
const getStreamUrl = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        if (!videoId || typeof videoId !== 'string') {
            return res.status(400).json({ error: 'Video ID is required' });
        }
        // Check Stream Cache
        const cached = streamCache.get(videoId);
        if (cached && Date.now() - cached.timestamp < STREAM_TTL) {
            return res.json({ url: cached.url });
        }
        const streamUrl = await (0, ytDlpService_1.getAudioStreamUrl)(videoId);
        streamCache.set(videoId, { url: streamUrl, timestamp: Date.now() });
        res.json({ url: streamUrl });
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
        let streamUrl;
        // Check Stream Cache
        const cached = streamCache.get(videoId);
        if (cached && Date.now() - cached.timestamp < STREAM_TTL) {
            streamUrl = cached.url;
        }
        else {
            logger_1.default.info(`Extracting audio for stream: ${videoId} (cache miss)`);
            streamUrl = await (0, ytDlpService_1.getAudioStreamUrl)(videoId);
            streamCache.set(videoId, { url: streamUrl, timestamp: Date.now() });
        }
        // Low-latency redirect
        res.redirect(streamUrl);
    }
    catch (error) {
        next(error);
    }
};
exports.streamAudio = streamAudio;
