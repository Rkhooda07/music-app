export type Feeling = 'chill' | 'rap' | 'hardcore' | 'love' | 'freestyle';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number | null;
  thumbnail?: string;
  url?: string;
  viewCount?: number;
}
