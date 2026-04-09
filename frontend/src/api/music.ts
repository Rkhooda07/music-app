import { Platform } from 'react-native';
import { MusicTrack } from '../types/music';

const resolveApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return (
    Platform.select({
      android: 'http://10.0.2.2:3000/api/music',
      default: 'http://localhost:3000/api/music',
    }) || 'http://localhost:3000/api/music'
  );
};

const API_BASE_URL = resolveApiBaseUrl();

const handleResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const searchMusic = async (query: string): Promise<MusicTrack[]> => {
  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
  const payload = await handleResponse<{ data: MusicTrack[] }>(response);
  return payload.data;
};

export const getStreamUrl = async (videoId: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/url/${videoId}`);
  const payload = await handleResponse<{ url: string }>(response);
  return payload.url;
};

export { API_BASE_URL };
