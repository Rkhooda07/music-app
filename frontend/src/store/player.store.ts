import { create } from "zustand";
import { Audio, AVPlaybackStatus } from "expo-av";

export type Track = {
  id: string,
  title: string,
  artist: string,
  album: string,
  duration: number, // in seconds
  uri: string,
  thumbnail?: string
};

type PlayerState = {
  sound: Audio.Sound | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMillis: number;
  durationMillis: number;
  queue: Track[];
  currentIndex: number;
  
  playTrack: (track: Track, tracks?: Track[]) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setPlaybackStatus: (status: AVPlaybackStatus) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  sound: null,
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  positionMillis: 0,
  durationMillis: 0,
  queue: [],
  currentIndex: -1,

  setPlaybackStatus: (status) => {
    if (status.isLoaded) {
      const currentTrack = get().currentTrack;
      set({
        isPlaying: status.isPlaying,
        positionMillis: status.positionMillis,
        durationMillis: status.durationMillis || (currentTrack ? currentTrack.duration * 1000 : 0),
        isLoading: status.isBuffering,
      });

      // Handle track completion
      if (status.didJustFinish) {
         get().nextTrack();
      }
    } else {
      if (status.error) {
        console.error(`Audio Error: ${status.error}`);
      }
    }
  },

  playTrack: async (track, tracks) => {
    const { sound: currentSound } = get();
    
    // 1. Prevent concurrent loading
    if (get().isLoading && get().currentTrack?.id === track.id) return;

    try {
      set({ isLoading: true, isPlaying: false });

      // 2. Strict Unload
      if (currentSound) {
        await currentSound.setOnPlaybackStatusUpdate(null);
        await currentSound.unloadAsync();
      }

      // 3. Audio Session Setup
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: 1, // InterruptionModeIOS.DoNotMix
        interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
      });

      // 4. Update Queue Info
      if (tracks) {
        const idx = tracks.findIndex(t => t.id === track.id);
        set({ queue: tracks, currentIndex: idx });
      }

      // 5. Load and Play
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { 
          shouldPlay: true, 
          progressUpdateIntervalMillis: 100, 
          androidImplementation: 'MediaPlayer' // for stability with redirects
        },
        get().setPlaybackStatus
      );

      set({
        sound,
        currentTrack: track,
        isPlaying: true,
        isLoading: false,
        positionMillis: 0,
        durationMillis: track.duration * 1000,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error("Failed to play track:", error);
    }
  },

  nextTrack: async () => {
    const { queue, currentIndex } = get();
    if (queue.length > 0 && currentIndex < queue.length - 1) {
      await get().playTrack(queue[currentIndex + 1]);
    }
  },

  prevTrack: async () => {
    const { queue, currentIndex, positionMillis } = get();
    // Spotify behavior: if after 3s, restart current track.
    if (positionMillis > 3000) {
        await get().seek(0);
        return;
    }

    if (queue.length > 0 && currentIndex > 0) {
      await get().playTrack(queue[currentIndex - 1]);
    }
  },

  pause: async () => {
    const { sound } = get();
    if (sound) {
      await sound.pauseAsync();
    }
  },

  resume: async () => {
    const { sound } = get();
    if (sound) {
      await sound.playAsync();
    }
  },

  seek: async (position) => {
    const { sound } = get();
    if (sound) {
      await sound.setPositionAsync(position);
    }
  },
}));
