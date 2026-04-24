import { create } from 'zustand';
import { MusicTrack } from '../types/music';

export interface Playlist {
  id: string;
  title: string;
  tracks: MusicTrack[];
  coverUri?: string;
}

interface PlaylistState {
  playlists: Playlist[];
  createPlaylist: (title?: string, coverUri?: string) => string;
  addTrackToPlaylist: (playlistId: string, track: MusicTrack) => void;
  setPlaylistCover: (playlistId: string, coverUri: string) => void;
  deletePlaylist: (playlistId: string) => void;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  createPlaylist: (title = 'New playlist', coverUri) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      playlists: [...state.playlists, { id, title, tracks: [], coverUri }],
    }));
    return id;
  },
  addTrackToPlaylist: (playlistId, track) => {
    set((state) => ({
      playlists: state.playlists.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist;
        }

        if (playlist.tracks.some((item) => item.id === track.id)) {
          return playlist;
        }

        return {
          ...playlist,
          tracks: [...playlist.tracks, track],
        };
      }),
    }));
  },
  setPlaylistCover: (playlistId, coverUri) => {
    set((state) => ({
      playlists: state.playlists.map((playlist) =>
        playlist.id === playlistId ? { ...playlist, coverUri } : playlist,
      ),
    }));
  },
  deletePlaylist: (playlistId) => {
    set((state) => ({
      playlists: state.playlists.filter((playlist) => playlist.id !== playlistId),
    }));
  },
  getPlaylistById: (playlistId) => {
    const state = get();
    return state.playlists.find((playlist) => playlist.id === playlistId);
  },
}));
