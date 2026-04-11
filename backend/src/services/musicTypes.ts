export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number | null;
  thumbnail?: string;
  url?: string;
  viewCount?: number;
}

export interface StreamDescriptor {
  url: string;
  httpHeaders: Record<string, string>;
  expiresAt: number;
}
