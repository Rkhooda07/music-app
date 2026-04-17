import { NativeModules, Platform } from 'react-native';
import { MusicTrack } from '../types/music';

const API_PATH = '/api/music';

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

const withApiPath = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith(API_PATH) ? trimmed : `${trimmed}${API_PATH}`;
};

const shouldSwapToDevHost = (value: string) => {
  try {
    const host = new URL(value).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2';
  } catch {
    return false;
  }
};

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

const API_BASE_URL = resolveApiBaseUrl();

const handleResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const searchMusic = async (query: string, signal?: AbortSignal): Promise<MusicTrack[]> => {
  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, { signal });
  const payload = await handleResponse<{ data: MusicTrack[] }>(response);
  return payload.data;
};

export const getStreamUrl = async (videoId: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/url/${videoId}`);
  const payload = await handleResponse<{ url: string }>(response);
  return payload.url;
};

export { API_BASE_URL };
