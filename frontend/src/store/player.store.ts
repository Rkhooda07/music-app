import { create } from 'zustand';

export const MOCK_TRACK = {
  id: 'midnight-drive',
  title: 'Midnight Drive',
  artist: 'Neon Harbor',
  duration: 214,
  artwork: require('../../assets/splash-icon.png'),
} as const;

interface PlayerState {
  currentTrack: typeof MOCK_TRACK;
  isPlaying: boolean;
  progress: number;
  togglePlayback: () => void;
  seekTo: (value: number) => void;
  skipNext: () => void;
  skipPrevious: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: MOCK_TRACK,
  isPlaying: true,
  progress: 68,
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  seekTo: (value) => set({ progress: value }),
  skipNext: () => set({ progress: 0, isPlaying: true }),
  skipPrevious: () => set({ progress: 18, isPlaying: true }),
}));
