import { NativeModules, Platform } from 'react-native';
import { MusicTrack } from '../types/music';

const API_PATH = '/api/music';
const REQUEST_TIMEOUT = 8000; // 8 seconds
const MAX_RETRIES = 2;

/**
 * Get the dev server host from the Metro bundler
 */
const getDevServerHost = () => {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (!scriptURL) {
    return null;
  }

  try {
    return new URL(scriptURL).hostname;
  } catch {
    return null;
  }
};

/**
 * Ensure URL ends with the API path
 */
const withApiPath = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith(API_PATH) ? trimmed : `${trimmed}${API_PATH}`;
};

/**
 * Check if this is a local dev URL that needs rewriting
 */
const shouldSwapToDevHost = (value: string) => {
  try {
    const host = new URL(value).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2';
  } catch {
    return false;
  }
};

/**
 * Resolve the API base URL with proper configuration
 */
const resolveApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    const configuredUrl = withApiPath(process.env.EXPO_PUBLIC_API_URL);
    const devServerHost = getDevServerHost();

    if (devServerHost && shouldSwapToDevHost(configuredUrl)) {
      try {
        const rewrittenUrl = new URL(configuredUrl);
        rewrittenUrl.hostname = devServerHost;
        return withApiPath(rewrittenUrl.toString());
      } catch {
        return configuredUrl;
      }
    }

    return configuredUrl;
  }

  const devServerHost = getDevServerHost();
  if (devServerHost) {
    return `http://${devServerHost}:3000${API_PATH}`;
  }

  return (
    Platform.select({
      android: `http://10.0.2.2:3000${API_PATH}`,
      default: `http://localhost:3000${API_PATH}`,
    }) || `http://localhost:3000${API_PATH}`
  );
};

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Log API info for debugging
 */
const logApiInfo = () => {
  console.log('[API Config] Base URL:', API_BASE_URL);
  console.log('[API Config] Platform:', Platform.OS);
  console.log('[API Config] Dev Server Host:', getDevServerHost());
};

// Log once on app load
if (__DEV__) {
  logApiInfo();
}

/**
 * Fetch with timeout
 */
const fetchWithTimeout = (url: string, options?: RequestInit): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT),
    ),
  ]);
};

/**
 * Retry logic for failed requests
 */
const fetchWithRetry = async (
  url: string,
  options?: RequestInit,
  retries: number = MAX_RETRIES,
): Promise<Response> => {
  try {
    return await fetchWithTimeout(url, options);
  } catch (error) {
    if (retries > 0) {
      console.warn(`[API] Retry attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES}:`, url);
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

/**
 * Handle API response
 */
const handleResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API Error] Status ${response.status}:`, errorText);
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    console.error('[API Error] Failed to parse JSON response:', error);
    throw new Error('Invalid API response format');
  }
};

/**
 * Search for music tracks
 */
export const searchMusic = async (query: string, signal?: AbortSignal): Promise<MusicTrack[]> => {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }

  try {
    console.log(`[API] Searching for: "${query}"`);
    const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;
    const response = await fetchWithRetry(url, { signal });
    const payload = await handleResponse<{ data: MusicTrack[] }>(response);
    console.log(`[API] Found ${payload.data.length} results`);
    return payload.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Search Error]', errorMessage);
    throw new Error(`Failed to search music: ${errorMessage}`);
  }
};

/**
 * Get stream URL for a video
 */
export const getStreamUrl = async (videoId: string): Promise<string> => {
  if (!videoId || videoId.trim().length === 0) {
    throw new Error('Video ID cannot be empty');
  }

  try {
    console.log(`[API] Getting stream URL for: ${videoId}`);
    const url = `${API_BASE_URL}/url/${videoId}`;
    const response = await fetchWithRetry(url);
    const payload = await handleResponse<{ url: string }>(response);
    console.log('[API] Stream URL obtained');
    return payload.url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Stream Error]', errorMessage);
    throw new Error(`Failed to get stream URL: ${errorMessage}`);
  }
};

export { API_BASE_URL as default };
