import { create } from "zustand";
import { Audio, AVPlaybackStatus } from "expo-av";
import { LocalTrack } from "../utils/scanLocalMusic";

type PlayerState = {
  sound: Audio.Sound | null;
  currentTrack: LocalTrack | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  
  playTrack: (track: LocalTrack) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setPlaybackStatus: (status: AVPlaybackStatus) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  sound: null,
  currentTrack: null,
  isPlaying: false,
  positionMillis: 0,
  durationMillis: 0,

  setPlaybackStatus: (status) => {
    if (status.isLoaded) {
      set({
        isPlaying: status.isPlaying,
        positionMillis: status.positionMillis,
        durationMillis: status.durationMillis || 0,
      });
      // Handle track end
      if (status.didJustFinish) {
         set({ isPlaying: false, positionMillis: 0 });
      }
    } else {
      if (status.error) {
        console.error(`Audio Error: ${status.error}`);
      }
    }
  },

  playTrack: async (track) => {
    try {
      const { sound: currentSound } = get();
      
      if (currentSound) {
        await currentSound.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true },
        get().setPlaybackStatus
      );

      set({
        sound,
        currentTrack: track,
        isPlaying: true,
        positionMillis: 0,
        durationMillis: track.duration * 1000,
      });
    } catch (error) {
      console.error("Failed to play track:", error);
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
