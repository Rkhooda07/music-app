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
const buildSharedArgs = () => {
    return [
        '--no-warnings',
        '--no-check-certificates',
        '--no-cache-dir',
        ...buildCookieArgs(),
    ];
};
const buildExtractorArgs = (playerClients) => {
    if (!playerClients) {
        return [];
    }
    return ['--extractor-args', `youtube:player_client=${playerClients}`];
};
const formatYtDlpError = (stderr) => {
    if (stderr.includes('Sign in to confirm you’re not a bot') || stderr.includes("Sign in to confirm you're not a bot")) {
        return 'YouTube blocked extraction. Add YT_DLP_COOKIES_FROM_BROWSER or YT_DLP_COOKIES_FILE to backend/.env so yt-dlp can use an authenticated session.';
    }
    if (stderr.includes('Requested format is not available')) {
        return 'This track does not expose the preferred audio format. The backend has been updated to fall back automatically after restart.';
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
const runYtDlpJson = (args) => {
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
            try {
                resolve({
                    parsed: JSON.parse(output),
                    stderr: errorOutput,
                });
            }
            catch {
                reject(new Error('Failed to parse audio descriptor'));
            }
        });
    });
};
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
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const sharedArgs = buildSharedArgs();
        const attempts = [
            {
                name: 'ios-mweb-info',
                args: [
                    '--dump-single-json',
                    '--skip-download',
                    ...buildExtractorArgs('ios,mweb'),
                    watchUrl,
                    ...sharedArgs,
                ],
            },
            {
                name: 'ios-web-info',
                args: [
                    '--dump-single-json',
                    '--skip-download',
                    ...buildExtractorArgs('ios,web'),
                    watchUrl,
                    ...sharedArgs,
                ],
            },
            {
                name: 'ios-mweb-bestaudio',
                args: [
                    '--dump-single-json',
                    '--skip-download',
                    '-f', 'bestaudio/best',
                    ...buildExtractorArgs('ios,mweb'),
                    watchUrl,
                    ...sharedArgs,
                ],
            },
            {
                name: 'ios-web-bestaudio',
                args: [
                    '--dump-single-json',
                    '--skip-download',
                    '-f', 'bestaudio/best',
                    ...buildExtractorArgs('ios,web'),
                    watchUrl,
                    ...sharedArgs,
                ],
            },
            {
                name: 'default-best-with-audio',
                args: [
                    '--dump-single-json',
                    '--skip-download',
                    '-f', 'best*[acodec!=none]/best',
                    watchUrl,
                    ...sharedArgs,
                ],
            },
            {
                name: 'default-client-info',
                args: [
                    '--dump-single-json',
                    '--skip-download',
                    watchUrl,
                    ...sharedArgs,
                ],
            },
        ];
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
