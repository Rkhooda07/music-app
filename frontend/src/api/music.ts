import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import { MusicTrack } from '../types/music';

const API_PATH = '/api/music';
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 2;

/**
 * Checks if a hostname is a local or private network address
 */
const isLocalOrPrivateHost = (hostname: string) => {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '10.0.2.2' || // Android Emulator loopback
    // Private IP ranges
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    hostname.endsWith('.local')
  );
};

/**
 * Get the dev server host from the Metro bundler
 * This is the most reliable way to find the IP of the machine running the backend
 */
const getDevServerHost = () => {
  // 1. Try scriptURL (works on both iOS and Android)
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    try {
      const url = new URL(scriptURL);
      if (url.hostname && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        return url.hostname;
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }

  // 2. Try Expo Constants (legacy and modern fields)
  const manifestWithDebuggerHost = Constants.manifest as { debuggerHost?: string } | undefined;
  const debuggerHost =
    Constants.expoConfig?.hostUri?.split(':')[0] ||
    manifestWithDebuggerHost?.debuggerHost?.split(':')[0] ||
    (Constants.manifest2 as any)?.debuggerHost?.split(':')[0] ||
    Constants.expoGo?.debuggerHost?.split(':')[0];

  if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
    return debuggerHost;
  }

  return null;
};

/**
 * Ensure URL ends with the API path
 */
const withApiPath = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith(API_PATH) ? trimmed : `${trimmed}${API_PATH}`;
};

/**
 * Resolve the API base URL with proper configuration
 */
const resolveApiBaseUrl = () => {
  const devServerHost = getDevServerHost();
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // If we have a configured URL in .env
  if (envUrl) {
    const configuredUrl = withApiPath(envUrl);
    
    try {
      const parsedConfig = new URL(configuredUrl);
      const configHostname = parsedConfig.hostname;

      // If the configured host is local/private AND we found a different dev server host,
      // we should prefer the dev server host because it's the current active IP.
      if (devServerHost && isLocalOrPrivateHost(configHostname) && configHostname !== devServerHost) {
        parsedConfig.hostname = devServerHost;
        const finalUrl = withApiPath(parsedConfig.toString());
        
        if (__DEV__) {
          console.log(`[API Config] 🔄 Auto-detected machine IP change: Swapping ${configHostname} -> ${devServerHost}`);
        }
        return finalUrl;
      }
    } catch (e) {
      // If .env URL is invalid, fallback
    }

    return configuredUrl;
  }

  // Fallback 1: Use detected dev server host
  if (devServerHost) {
    if (__DEV__) {
      console.log(`[API Config] 📡 Using detected dev server host: ${devServerHost}`);
    }
    return `http://${devServerHost}:3000${API_PATH}`;
  }

  // Fallback 2: Platform defaults
  const fallback = Platform.select({
    android: `http://10.0.2.2:3000${API_PATH}`,
    default: `http://localhost:3000${API_PATH}`,
  }) || `http://localhost:3000${API_PATH}`;

  if (__DEV__) {
    console.warn(`[API Config] ⚠️ No host detected, using fallback: ${fallback}`);
  }
  return fallback;
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
export const getStreamUrl = async (
  videoId: string,
  quality: 'best' | 'low' = 'best',
): Promise<string> => {
  if (!videoId || videoId.trim().length === 0) {
    throw new Error('Video ID cannot be empty');
  }

  try {
    console.log(`[API] Getting stream URL for: ${videoId} (${quality})`);
    const params = new URLSearchParams();
    if (quality === 'low') {
      params.set('quality', 'low');
    }

    const url = `${API_BASE_URL}/url/${videoId}${params.toString() ? `?${params.toString()}` : ''}`;
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
