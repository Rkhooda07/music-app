"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAudioStreamUrl = exports.getAudioStreamDescriptor = exports.searchYouTube = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
// Path to the downloaded yt-dlp binary in the backend root
const ytDlpPath = path_1.default.resolve(__dirname, '../../yt-dlp');
const parseExpiryFromStreamUrl = (streamUrl) => {
    try {
        const url = new URL(streamUrl);
        const expireParam = url.searchParams.get('expire');
        if (expireParam) {
            const expiresAt = Number(expireParam) * 1000;
            if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
                return expiresAt;
            }
        }
    }
    catch {
        // Ignore URL parsing errors and use fallback TTL.
    }
    return Date.now() + (30 * 60 * 1000);
};
const searchYouTube = (query) => {
    return new Promise((resolve, reject) => {
        logger_1.default.info(`Searching YouTube for: ${query}`);
        // Fast flags for yt-dlp search
        const ytDlp = (0, child_process_1.spawn)(ytDlpPath, [
            `ytsearch10:${query}`,
            '--dump-json',
            '--no-playlist',
            '--ignore-errors',
            '--no-warnings',
            '--no-check-certificates',
            '--no-call-home',
            '--no-cache-dir',
            '--flat-playlist'
        ]);
        let output = '';
        let errorOutput = '';
        ytDlp.stdout.on('data', (data) => { output += data.toString(); });
        ytDlp.stderr.on('data', (data) => { errorOutput += data.toString(); });
        ytDlp.on('close', (code) => {
            if (code !== 0 && !output) {
                logger_1.default.error(`yt-dlp search error: ${errorOutput}`);
                return reject(new Error('Failed to search YouTube'));
            }
            const results = output
                .trim()
                .split('\n')
                .map((line) => {
                try {
                    return JSON.parse(line);
                }
                catch (e) {
                    return null;
                }
            })
                .filter(Boolean);
            // Sort by view_count in descending order
            results.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
            const formattedResults = results.map((v) => ({
                id: v.id,
                title: v.title,
                artist: v.uploader,
                duration: v.duration,
                thumbnail: v.thumbnail,
                url: v.webpage_url,
                viewCount: v.view_count || 0,
            }));
            resolve(formattedResults);
        });
    });
};
exports.searchYouTube = searchYouTube;
const getAudioStreamDescriptor = (videoId) => {
    return new Promise((resolve, reject) => {
        logger_1.default.info(`Extracting audio descriptor for video ID: ${videoId}`);
        const ytDlp = (0, child_process_1.spawn)(ytDlpPath, [
            '-f', 'bestaudio[ext=m4a]/bestaudio',
            '--dump-single-json',
            `https://www.youtube.com/watch?v=${videoId}`,
            '--no-warnings',
            '--no-check-certificates',
            '--no-call-home',
            '--no-cache-dir'
        ]);
        let output = '';
        let errorOutput = '';
        ytDlp.stdout.on('data', (data) => { output += data.toString(); });
        ytDlp.stderr.on('data', (data) => { errorOutput += data.toString(); });
        ytDlp.on('close', (code) => {
            if (code !== 0 || !output) {
                logger_1.default.error(`yt-dlp extract error: ${errorOutput}`);
                return reject(new Error('Failed to extract audio URL'));
            }
            try {
                const parsed = JSON.parse(output);
                const streamUrl = parsed.url ||
                    parsed.requested_formats?.[0]?.url ||
                    parsed.requested_downloads?.[0]?.url ||
                    parsed.formats?.find((format) => format.url && format.acodec !== 'none' && format.vcodec === 'none')?.url;
                if (!streamUrl) {
                    return reject(new Error('Failed to extract audio URL'));
                }
                resolve({
                    url: streamUrl,
                    httpHeaders: parsed.http_headers || {},
                    expiresAt: parseExpiryFromStreamUrl(streamUrl),
                });
            }
            catch {
                return reject(new Error('Failed to parse audio descriptor'));
            }
        });
    });
};
exports.getAudioStreamDescriptor = getAudioStreamDescriptor;
const getAudioStreamUrl = async (videoId) => {
    const descriptor = await (0, exports.getAudioStreamDescriptor)(videoId);
    return descriptor.url;
};
exports.getAudioStreamUrl = getAudioStreamUrl;
