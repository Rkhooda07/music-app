"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmTopSearchResults = exports.resolveStreamDescriptor = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const ytDlpService_1 = require("./ytDlpService");
const streamCache = new Map();
const playQueue = [];
const warmQueue = [];
const MAX_CONCURRENT_EXTRACTIONS = 1;
const STREAM_EXPIRY_SKEW_MS = 15_000;
let activeExtractions = 0;
const isFreshDescriptor = (entry) => {
    return Boolean(entry?.url && entry?.expiresAt && entry.expiresAt - STREAM_EXPIRY_SKEW_MS > Date.now());
};
const storeResolvedDescriptor = (videoId, descriptor) => {
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
    (0, ytDlpService_1.getAudioStreamDescriptor)(nextJob.videoId)
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
const resolveStreamDescriptor = async (videoId, priority = 'play') => {
    const cached = streamCache.get(videoId);
    if (isFreshDescriptor(cached)) {
        return cached;
    }
    if (cached?.pendingPromise) {
        return cached.pendingPromise;
    }
    const pendingPromise = new Promise((resolve, reject) => {
        const job = { videoId, priority, resolve, reject };
        if (priority === 'play') {
            playQueue.push(job);
        }
        else {
            warmQueue.push(job);
        }
        runNextQueuedExtraction();
    });
    streamCache.set(videoId, { ...cached, pendingPromise });
    try {
        return await pendingPromise;
    }
    catch (error) {
        throw error;
    }
};
exports.resolveStreamDescriptor = resolveStreamDescriptor;
const warmTopSearchResults = (tracks, limit = 3) => {
    tracks.slice(0, limit).forEach((track) => {
        (0, exports.resolveStreamDescriptor)(track.id, 'warm')
            .then(() => {
            logger_1.default.info(`Pre-warmed track: ${track.id}`);
        })
            .catch((error) => {
            logger_1.default.warn(`Pre-warm failed for ${track.id}: ${error instanceof Error ? error.message : 'unknown error'}`);
        });
    });
};
exports.warmTopSearchResults = warmTopSearchResults;
