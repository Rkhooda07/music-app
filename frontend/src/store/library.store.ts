import { create } from "zustand";
import { LocalTrack } from "../utils/scanLocalMusic";

type LibraryState = {
  tracks: LocalTrack[],
  setTracks: (trakcs: LocalTrack[]) => void;
};

export const useLibraryStore = create<LibraryState>((set) => ({
  tracks: [],
  setTracks: (tracks) => set({ tracks })
}));