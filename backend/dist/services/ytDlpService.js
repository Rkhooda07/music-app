"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAudioStreamUrl = exports.getAudioStreamDescriptor = exports.searchYouTube = exports.listFormats = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
// Path to the downloaded yt-dlp binary in the backend root
const ytDlpPath = path_1.default.resolve(__dirname, '../../yt-dlp');
const buildCookieArgs = () => {
    const cookiesFile = process.env.YT_DLP_COOKIES_FILE?.trim();
    if (cookiesFile) {
        return ['--cookies', cookiesFile];
    }
    const cookiesFromBrowser = process.env.YT_DLP_COOKIES_FROM_BROWSER?.trim();
    if (cookiesFromBrowser) {
        return ['--cookies-from-browser', cookiesFromBrowser];
    }
    return [];
};
const buildSharedArgs = ({ includeCookies = true } = {}) => {
    return [
        '--no-warnings',
        '--no-check-certificates',
        '--no-cache-dir',
        '--js-runtimes',
        'node',
        ...(includeCookies ? buildCookieArgs() : []),
    ];
};
const buildExtractorArgs = (playerClients) => {
    if (!playerClients) {
        return [];
    }
    return ['--extractor-args', `youtube:player_client=${playerClients}`];
};
const formatYtDlpError = (stderr) => {
    if (stderr.includes('This video is DRM protected') || stderr.includes('DRM protected')) {
        return 'This YouTube video is DRM protected, so the current backend cannot stream it.';
    }
    if (stderr.includes('PO Token')) {
        return 'YouTube now requires a PO token for this video/client combination. The current backend cannot extract a playable stream without it.';
    }
    if (stderr.includes('Too Many Requests') || stderr.includes('HTTP Error 429')) {
        return 'YouTube rate-limited extraction from this IP/session. Retry later or use a different authenticated session.';
    }
    if (stderr.includes('Sign in to confirm you’re not a bot') || stderr.includes("Sign in to confirm you're not a bot")) {
        return 'YouTube blocked extraction. Add YT_DLP_COOKIES_FROM_BROWSER or YT_DLP_COOKIES_FILE to backend/.env so yt-dlp can use an authenticated session.';
    }
    if (stderr.includes('Signature solving failed') || stderr.includes('n challenge solving failed')) {
        return 'yt-dlp could not solve YouTube’s current signature challenge for this video, so no playable stream URL was exposed.';
    }
    if (stderr.includes('Requested format is not available')) {
        return 'yt-dlp could not find a playable audio format for this video with the current fallback sequence.';
    }
    return 'Failed to extract audio URL';
};
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
const isUsableFormat = (format) => {
    if (!format.url) {
        return false;
    }
    if (format.ext === 'mhtml') {
        return false;
    }
    return format.acodec !== 'none' || format.vcodec !== 'none';
};
const compareByAudioBitrate = (left, right) => {
    const leftAbr = left.abr ?? 0;
    const rightAbr = right.abr ?? 0;
    if (leftAbr !== rightAbr) {
        return rightAbr - leftAbr;
    }
    const leftTbr = left.tbr ?? 0;
    const rightTbr = right.tbr ?? 0;
    if (leftTbr !== rightTbr) {
        return rightTbr - leftTbr;
    }
    const leftPreference = left.preference ?? left.quality ?? 0;
    const rightPreference = right.preference ?? right.quality ?? 0;
    if (leftPreference !== rightPreference) {
        return rightPreference - leftPreference;
    }
    const leftSize = left.filesize ?? left.filesize_approx ?? 0;
    const rightSize = right.filesize ?? right.filesize_approx ?? 0;
    return rightSize - leftSize;
};
const compareCombinedFormats = (left, right) => {
    const audioComparison = compareByAudioBitrate(left, right);
    if (audioComparison !== 0) {
        return audioComparison;
    }
    return (right.height ?? 0) - (left.height ?? 0);
};
const selectPreferredFormat = (formats = []) => {
    const usableFormats = formats.filter(isUsableFormat);
    if (!usableFormats.length) {
        return undefined;
    }
    const audioOnlyFormats = usableFormats.filter((format) => format.acodec !== 'none' && format.vcodec === 'none');
    if (audioOnlyFormats.length) {
        return [...audioOnlyFormats].sort(compareByAudioBitrate)[0];
    }
    const combinedFormats = usableFormats.filter((format) => format.acodec !== 'none');
    if (combinedFormats.length) {
        return [...combinedFormats].sort(compareCombinedFormats)[0];
    }
    return usableFormats[0];
};
const summarizeFormats = (formats = []) => {
    return formats
        .filter((format) => format.format_id)
        .slice(0, 8)
        .map((format) => `${format.format_id}:${format.ext || 'unknown'}:${format.acodec || 'na'}/${format.vcodec || 'na'}:${format.abr ?? format.tbr ?? 'na'}`)
        .join(', ');
};
const buildExtractionAttempts = (videoId) => {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const sharedWithCookies = buildSharedArgs({ includeCookies: true });
    const sharedWithoutCookies = buildSharedArgs({ includeCookies: false });
    return [
        {
            name: 'default-bestaudio-with-cookies',
            args: [
                '--dump-json',
                '--skip-download',
                '-f', 'bestaudio',
                ...sharedWithCookies,
                watchUrl,
            ],
        },
        {
            name: 'default-best-with-audio-with-cookies',
            args: [
                '--dump-json',
                '--skip-download',
                '-f', 'best*[acodec!=none]/best',
                ...sharedWithCookies,
                watchUrl,
            ],
        },
        {
            name: 'default-info-with-cookies',
            args: [
                '--dump-json',
                '--skip-download',
                ...sharedWithCookies,
                watchUrl,
            ],
        },
        {
            name: 'ios-bestaudio-no-cookies',
            args: [
                '--dump-json',
                '--skip-download',
                '-f', 'bestaudio',
                ...buildExtractorArgs('ios'),
                ...sharedWithoutCookies,
                watchUrl,
            ],
        },
        {
            name: 'mweb-bestaudio-no-cookies',
            args: [
                '--dump-json',
                '--skip-download',
                '-f', 'bestaudio',
                ...buildExtractorArgs('mweb'),
                ...sharedWithoutCookies,
                watchUrl,
            ],
        },
        {
            name: 'default-bestaudio-no-cookies',
            args: [
                '--dump-json',
                '--skip-download',
                '-f', 'bestaudio',
                ...sharedWithoutCookies,
                watchUrl,
            ],
        },
    ];
};
const extractStreamDescriptor = (parsed) => {
    const preferredFormat = selectPreferredFormat(parsed.requested_formats) ||
        selectPreferredFormat(parsed.requested_downloads) ||
        selectPreferredFormat(parsed.formats);
    const streamUrl = preferredFormat?.url || parsed.url;
    if (!streamUrl) {
        return null;
    }
    return {
        url: streamUrl,
        httpHeaders: preferredFormat?.http_headers || parsed.http_headers || {},
        expiresAt: parseExpiryFromStreamUrl(streamUrl),
    };
};
const runYtDlpText = (args) => {
    return new Promise((resolve, reject) => {
        const ytDlp = (0, child_process_1.spawn)(ytDlpPath, args);
        let output = '';
        let errorOutput = '';
        ytDlp.stdout.on('data', (data) => { output += data.toString(); });
        ytDlp.stderr.on('data', (data) => { errorOutput += data.toString(); });
        ytDlp.on('close', (code) => {
            if (code !== 0 || !output) {
                return reject(new Error(errorOutput || 'yt-dlp exited without output'));
            }
            resolve({
                stdout: output,
                stderr: errorOutput,
            });
        });
    });
};
const runYtDlpJson = async (args) => {
    const { stdout, stderr } = await runYtDlpText(args);
    try {
        return {
            parsed: JSON.parse(stdout),
            stderr,
        };
    }
    catch {
        throw new Error('Failed to parse audio descriptor');
    }
};
const listFormats = async (videoId) => {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const attempts = [
        [
            '--list-formats',
            ...buildSharedArgs({ includeCookies: true }),
            watchUrl,
        ],
        [
            '--list-formats',
            ...buildSharedArgs({ includeCookies: false }),
            watchUrl,
        ],
    ];
    let lastError = 'Failed to list formats';
    for (const args of attempts) {
        try {
            const { stdout } = await runYtDlpText(args);
            return stdout;
        }
        catch (error) {
            lastError = error instanceof Error ? error.message : 'Failed to list formats';
        }
    }
    throw new Error(lastError);
};
exports.listFormats = listFormats;
const searchYouTube = (query) => {
    return new Promise((resolve, reject) => {
        logger_1.default.info(`Searching YouTube for: ${query}`);
        const ytDlp = (0, child_process_1.spawn)(ytDlpPath, [
            `ytsearch10:${query}`,
            '--dump-json',
            '--no-playlist',
            '--ignore-errors',
            '--flat-playlist',
            ...buildSharedArgs(),
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
        const attempts = buildExtractionAttempts(videoId);
        (async () => {
            let lastError = 'Failed to extract audio URL';
            for (const attempt of attempts) {
                try {
                    const { parsed } = await runYtDlpJson(attempt.args);
                    const availableFormats = summarizeFormats(parsed.formats);
                    const descriptor = extractStreamDescriptor(parsed);
                    if (!descriptor) {
                        lastError = 'Failed to extract audio URL';
                        logger_1.default.warn(`yt-dlp extract returned no usable stream for ${videoId} using ${attempt.name}${availableFormats ? `; formats=${availableFormats}` : ''}`);
                        continue;
                    }
                    if (attempt.name !== attempts[0]?.name) {
                        logger_1.default.warn(`Recovered stream extraction for ${videoId} using fallback ${attempt.name}`);
                    }
                    resolve(descriptor);
                    return;
                }
                catch (error) {
                    lastError = error instanceof Error ? error.message : 'Failed to extract audio URL';
                    logger_1.default.warn(`yt-dlp extract attempt failed for ${videoId} using ${attempt.name}: ${lastError}`);
                }
            }
            logger_1.default.error(`yt-dlp extract error: ${lastError}`);
            reject(new Error(formatYtDlpError(lastError)));
        })().catch((error) => {
            reject(error);
        });
    });
};
exports.getAudioStreamDescriptor = getAudioStreamDescriptor;
const getAudioStreamUrl = async (videoId) => {
    const descriptor = await (0, exports.getAudioStreamDescriptor)(videoId);
    return descriptor.url;
};
exports.getAudioStreamUrl = getAudioStreamUrl;
