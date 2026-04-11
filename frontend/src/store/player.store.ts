import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { create } from 'zustand';
import { API_BASE_URL } from '../api/music';
import { MusicTrack } from '../types/music';

interface PlayerState {
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  loadingTrackId: string | null;
  progress: number;
  duration: number;
  sound: Audio.Sound | null;
  error: string | null;
  playTrack: (track: MusicTrack, queue?: MusicTrack[]) => Promise<void>;
  togglePlayback: () => Promise<void>;
  seekTo: (value: number) => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  clearError: () => void;
}

let audioConfigured = false;
let latestPlaybackRequest = 0;

const ensureAudioMode = async () => {
  if (audioConfigured) {
    return;
  }

  await Audio.setAudioModeAsync({
    staysActiveInBackground: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  });

  audioConfigured = true;
};

const unloadCurrentSound = async (sound: Audio.Sound | null) => {
  if (!sound) {
    return;
  }

  try {
    sound.setOnPlaybackStatusUpdate(null);
    await sound.unloadAsync();
  } catch {
    // Ignore unload errors for stale sound instances.
  }
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isLoading: false,
  isBuffering: false,
  loadingTrackId: null,
  progress: 0,
  duration: 0,
  sound: null,
  error: null,
  clearError: () => set({ error: null }),
  playTrack: async (track, queue) => {
    const playbackRequest = ++latestPlaybackRequest;
    const state = get();
    const existingSound = state.sound;
    const isSameTrack = state.currentTrack?.id === track.id && !!existingSound;

    set({ isLoading: true, isBuffering: false, loadingTrackId: track.id, error: null });

    try {
      await ensureAudioMode();

      if (isSameTrack && existingSound) {
        await existingSound.setPositionAsync(0);
        await existingSound.playAsync();

        const nextQueue = queue && queue.length > 0 ? queue : state.queue.length > 0 ? state.queue : [track];
        const nextIndex = nextQueue.findIndex((item) => item.id === track.id);

        set({
          queue: nextQueue,
          currentIndex: nextIndex >= 0 ? nextIndex : 0,
          isPlaying: true,
          progress: 0,
          duration: state.duration || track.duration || 0,
          isLoading: false,
          isBuffering: false,
          loadingTrackId: null,
        });
        return;
      }

      const streamUrl = `${API_BASE_URL}/stream/${track.id}`;

      if (playbackRequest !== latestPlaybackRequest) {
        return;
      }

      await unloadCurrentSound(existingSound);

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 400 },
      );

      if (playbackRequest !== latestPlaybackRequest) {
        await unloadCurrentSound(sound);
        return;
      }

      sound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackRequest !== latestPlaybackRequest) {
          return;
        }

        if (!playbackStatus.isLoaded) {
          if (playbackStatus.error) {
            set({
              error: playbackStatus.error,
              isLoading: false,
              isBuffering: false,
              isPlaying: false,
              loadingTrackId: null,
            });
          }
          return;
        }

        set({
          isPlaying: playbackStatus.isPlaying,
          progress: playbackStatus.positionMillis / 1000,
          duration: (playbackStatus.durationMillis ?? 0) / 1000 || track.duration || 0,
          isLoading: false,
          isBuffering: playbackStatus.isBuffering,
          loadingTrackId: null,
        });

        if (playbackStatus.didJustFinish) {
          void get().skipNext();
        }
      });

      const nextQueue = queue && queue.length > 0 ? queue : get().queue.length > 0 ? get().queue : [track];
      const nextIndex = nextQueue.findIndex((item) => item.id === track.id);

      set({
        sound,
        currentTrack: track,
        queue: nextQueue,
        currentIndex: nextIndex >= 0 ? nextIndex : 0,
        isPlaying: status.isLoaded ? status.isPlaying : true,
        progress: 0,
        duration: track.duration || (status.isLoaded ? (status.durationMillis ?? 0) / 1000 : 0),
        isLoading: false,
        isBuffering: status.isLoaded ? status.isBuffering : false,
        loadingTrackId: null,
      });
    } catch (error) {
      if (playbackRequest !== latestPlaybackRequest) {
        return;
      }

      set({
        isLoading: false,
        isBuffering: false,
        isPlaying: false,
        loadingTrackId: null,
        error: error instanceof Error ? error.message : 'Unable to play track',
      });
    }
  },
  togglePlayback: async () => {
    const { sound, isPlaying } = get();
    if (!sound) {
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
      return;
    }

    await sound.playAsync();
  },
  seekTo: async (value) => {
    const { sound } = get();
    if (!sound) {
      return;
    }

    await sound.setPositionAsync(value * 1000);
    set({ progress: value });
  },
  skipNext: async () => {
    const { queue, currentIndex, playTrack, currentTrack } = get();
    if (queue.length === 0) {
      return;
    }

    const fallbackIndex = currentIndex >= 0 ? currentIndex : (currentTrack ? queue.findIndex((item) => item.id === currentTrack.id) : 0);
    const nextIndex = fallbackIndex >= queue.length - 1 ? 0 : fallbackIndex + 1;
    await playTrack(queue[nextIndex], queue);
  },
  skipPrevious: async () => {
    const { queue, currentIndex, progress, seekTo, playTrack, currentTrack } = get();
    if (queue.length === 0) {
      return;
    }

    if (progress > 4) {
      await seekTo(0);
      return;
    }

    const fallbackIndex = currentIndex >= 0 ? currentIndex : (currentTrack ? queue.findIndex((item) => item.id === currentTrack.id) : 0);
    const nextIndex = fallbackIndex <= 0 ? queue.length - 1 : fallbackIndex - 1;
    await playTrack(queue[nextIndex], queue);
  },
}));
