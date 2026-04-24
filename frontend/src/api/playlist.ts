import { API_BASE_URL } from './music';

const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 2;

const fetchWithTimeout = (url: string, options?: RequestInit): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT),
    ),
  ]);
};

const fetchWithRetry = async (url: string, options?: RequestInit, retries = MAX_RETRIES): Promise<Response> => {
  try {
    return await fetchWithTimeout(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

const handleResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return (await response.json()) as T;
};

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

export const cachePlaylist = async (playlistId: string, trackIds: string[]): Promise<void> => {
  if (!playlistId || trackIds.length === 0) {
    return;
  }

  const url = buildUrl(`/cache/playlist/${encodeURIComponent(playlistId)}`);
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackIds }),
  });

  await handleResponse<{ message: string }>(response);
};

export const cachePlaylistTrack = async (playlistId: string, trackId: string): Promise<void> => {
  if (!playlistId || !trackId) {
    return;
  }

  const url = buildUrl(`/cache/playlist/${encodeURIComponent(playlistId)}/track`);
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId }),
  });

  await handleResponse<{ message: string }>(response);
};
