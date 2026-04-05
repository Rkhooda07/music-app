import { create } from "zustand";
import { LocalTrack } from "../utils/scanLocalMusic";

type LibraryState = {
  tracks: LocalTrack[],
  setTracks: (tracks: LocalTrack[]) => void;
  addTrack: (track: LocalTrack) => void;
};

export const useLibraryStore = create<LibraryState>((set) => ({
  tracks: [],
  setTracks: (tracks) => set({ tracks }),
  addTrack: (track) => set((state) => {
    // Prevent duplicates
    if (state.tracks.some(t => t.uri === track.uri)) return state;
    return { tracks: [...state.tracks, track] };
  })
}));