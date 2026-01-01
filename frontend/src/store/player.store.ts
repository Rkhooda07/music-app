import { create } from "zustand";

export type Track = {
  title: string,
  channel: string,
};

// Shape of player state
type PlayerState = {
  currentTrack: Track | null,
  isPlaying: boolean,
  selectTrack: (track: Track) => void,
  stop: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,

  selectTrack: (track) =>
    set({
      currentTrack: track,
      isPlaying: true
    }),

    stop: () => 
      set({
        isPlaying: false,
      }),
}));