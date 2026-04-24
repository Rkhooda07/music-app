"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingVideoIds = exports.searchYouTubeWithDataApi = exports.YouTubeDataApiError = void 0;
class YouTubeDataApiError extends Error {
    shouldFallbackToYtDlp;
    constructor(message, shouldFallbackToYtDlp) {
        super(message);
        this.shouldFallbackToYtDlp = shouldFallbackToYtDlp;
        this.name = 'YouTubeDataApiError';
    }
}
exports.YouTubeDataApiError = YouTubeDataApiError;
const YOUTUBE_SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/videos';
const FALLBACK_ERROR_REASONS = new Set([
    'accessNotConfigured',
    'dailyLimitExceeded',
    'keyExpired',
    'keyInvalid',
    'quotaExceeded',
]);
const parseDurationToSeconds = (duration) => {
    if (!duration) {
        return null;
    }
    const parts = duration.match(/^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
    if (!parts) {
        return null;
    }
    const hours = Number(parts[1] || 0);
    const minutes = Number(parts[2] || 0);
    const seconds = Number(parts[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
};
const getApiKey = () => {
    const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim();
    if (!apiKey) {
        throw new YouTubeDataApiError('YOUTUBE_DATA_API_KEY is not configured', true);
    }
    return apiKey;
};
const getThumbnailUrl = (thumbnails) => {
    return thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url;
};
const searchYouTubeWithDataApi = async (query) => {
    const apiKey = getApiKey();
    const searchParams = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        maxResults: '10',
        q: query,
        key: apiKey,
    });
    const searchResponse = await fetch(`${YOUTUBE_SEARCH_ENDPOINT}?${searchParams.toString()}`);
    const searchPayload = await searchResponse.json();
    if (!searchResponse.ok) {
        const reason = searchPayload.error?.errors?.[0]?.reason;
        const message = searchPayload.error?.errors?.[0]?.message || searchPayload.error?.message || 'YouTube Data API search failed';
        throw new YouTubeDataApiError(message, searchResponse.status === 400 || searchResponse.status === 401 || searchResponse.status === 403 || FALLBACK_ERROR_REASONS.has(reason || ''));
    }
    const videoIds = searchPayload.items
        ?.map((item) => item.id?.videoId)
        .filter((id) => Boolean(id)) || [];
    if (videoIds.length === 0) {
        return [];
    }
    const videosParams = new URLSearchParams({
        part: 'contentDetails,statistics',
        id: videoIds.join(','),
        key: apiKey,
    });
    const videosResponse = await fetch(`${YOUTUBE_VIDEOS_ENDPOINT}?${videosParams.toString()}`);
    const videosPayload = await videosResponse.json();
    if (!videosResponse.ok) {
        const reason = videosPayload.error?.errors?.[0]?.reason;
        const message = videosPayload.error?.errors?.[0]?.message || videosPayload.error?.message || 'YouTube Data API videos lookup failed';
        throw new YouTubeDataApiError(message, videosResponse.status === 400 || videosResponse.status === 401 || videosResponse.status === 403 || FALLBACK_ERROR_REASONS.has(reason || ''));
    }
    const metadataById = new Map((videosPayload.items || [])
        .filter((item) => Boolean(item.id))
        .map((item) => [
        item.id,
        {
            duration: parseDurationToSeconds(item.contentDetails?.duration),
            viewCount: Number(item.statistics?.viewCount || 0),
        },
    ]));
    return (searchPayload.items || [])
        .map((item) => {
        const videoId = item.id?.videoId;
        if (!videoId) {
            return null;
        }
        const metadata = metadataById.get(videoId);
        return {
            id: videoId,
            title: item.snippet?.title || 'Untitled',
            artist: item.snippet?.channelTitle || 'Unknown artist',
            duration: metadata?.duration ?? null,
            thumbnail: getThumbnailUrl(item.snippet?.thumbnails),
            url: `https://www.youtube.com/watch?v=${videoId}`,
            viewCount: metadata?.viewCount || 0,
        };
    })
        .filter((item) => Boolean(item))
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
};
exports.searchYouTubeWithDataApi = searchYouTubeWithDataApi;
const getTrendingVideoIds = async (maxResults = 20) => {
    const apiKey = getApiKey();
    const searchParams = new URLSearchParams({
        part: 'id',
        chart: 'mostPopular',
        regionCode: 'US',
        maxResults: String(maxResults),
        key: apiKey,
    });
    const response = await fetch(`${YOUTUBE_VIDEOS_ENDPOINT}?${searchParams.toString()}`);
    const payload = await response.json();
    if (!response.ok) {
        const reason = payload.error?.errors?.[0]?.reason;
        const message = payload.error?.errors?.[0]?.message || payload.error?.message || 'YouTube Data API trending lookup failed';
        throw new YouTubeDataApiError(message, response.status === 400 || response.status === 401 || response.status === 403 || FALLBACK_ERROR_REASONS.has(reason || ''));
    }
    return (payload.items || [])
        .map((item) => item.id)
        .filter((id) => Boolean(id));
};
exports.getTrendingVideoIds = getTrendingVideoIds;
