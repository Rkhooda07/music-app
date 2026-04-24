import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { create } from 'zustand';
import { API_BASE_URL, getStreamUrl } from '../api/music';
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
  prefetchedSound: Audio.Sound | null;
  prefetchedTrackId: string | null;
  nextSongUrl: string | null;
  error: string | null;
  isSeeking: boolean;
  playTrack: (track: MusicTrack, queue?: MusicTrack[]) => Promise<void>;
  togglePlayback: () => Promise<void>;
  seekTo: (value: number) => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  prefetchNextSong: () => Promise<void>;
  preloadNextSongs: () => Promise<void>;
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

const unloadPrefetchedSound = async (sound: Audio.Sound | null) => {
  if (!sound) {
    return;
  }

  try {
    sound.setOnPlaybackStatusUpdate(null);
    await sound.unloadAsync();
  } catch {
    // Ignore unload errors for stale prefetch instances.
  }
};

const buildStreamUri = (trackId: string) => `${API_BASE_URL}/stream/${trackId}`;

const resolveCurrentTrackIndex = (
  queue: MusicTrack[],
  currentIndex: number,
  currentTrack: MusicTrack | null,
) => {
  if (currentIndex >= 0 && currentIndex < queue.length) {
    return currentIndex;
  }

  if (currentTrack) {
    const fallbackIndex = queue.findIndex((item) => item.id === currentTrack.id);
    if (fallbackIndex >= 0) {
      return fallbackIndex;
    }
  }

  return queue.length > 0 ? 0 : -1;
};

const prefetchTrack = async (track: MusicTrack | null, set: any, get: any) => {
  if (!track) {
    return;
  }

  const state = get();
  if (state.prefetchedTrackId === track.id) {
    return;
  }

  await unloadPrefetchedSound(state.prefetchedSound);

  try {
    const streamUrl = buildStreamUri(track.id);
    const { sound } = await Audio.Sound.createAsync(
      { uri: streamUrl },
      { shouldPlay: false, progressUpdateIntervalMillis: 400 },
    );

    set({
      prefetchedSound: sound,
      prefetchedTrackId: track.id,
      nextSongUrl: streamUrl,
    });
  } catch {
    // Prefetch failures should not interrupt the player.
  }
};

const warmNextSongUrls = async (tracks: MusicTrack[]) => {
  const nextTracks = tracks.filter((track) => track?.id);
  if (nextTracks.length === 0) {
    return;
  }

  await Promise.all(
    nextTracks.map(async (track) => {
      try {
        await getStreamUrl(track.id);
      } catch {
        // Allow failures silently.
      }
    }),
  );
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
  prefetchedSound: null,
  prefetchedTrackId: null,
  nextSongUrl: null,
  error: null,
  isSeeking: false,
  clearError: () => set({ error: null }),
  prefetchNextSong: async () => {
    const state = get();
    const nextTrack = state.queue[state.currentIndex + 1] || state.queue[0] || null;
    if (!nextTrack) {
      return;
    }

    await prefetchTrack(nextTrack, set, get);
    const upcomingTracks = state.queue.slice(state.currentIndex + 2, state.currentIndex + 4);
    await warmNextSongUrls(upcomingTracks);
  },
  preloadNextSongs: async () => {
    const state = get();
    const upcomingTracks = state.queue.slice(state.currentIndex + 1, state.currentIndex + 4);
    if (upcomingTracks.length === 0) {
      return;
    }

    await prefetchTrack(upcomingTracks[0], set, get);
    await warmNextSongUrls(upcomingTracks.slice(1));
  },
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

        void get().preloadNextSongs();
        return;
      }

      const preloadedSound = state.prefetchedTrackId === track.id ? state.prefetchedSound : null;
      const streamUrl = buildStreamUri(track.id);

      if (playbackRequest !== latestPlaybackRequest) {
        return;
      }

      await unloadCurrentSound(existingSound);

      let sound: Audio.Sound;
      let status: any;

      if (preloadedSound) {
        sound = preloadedSound;
        status = await sound.getStatusAsync();
      } else {
        const created = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 400 },
        );
        sound = created.sound;
        status = created.status;
      }

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
          progress: get().isSeeking ? get().progress : playbackStatus.positionMillis / 1000,
          duration: (playbackStatus.durationMillis ?? 0) / 1000 || track.duration || 0,
          isLoading: false,
          isBuffering: playbackStatus.isBuffering,
          loadingTrackId: null,
        });

        if (playbackStatus.didJustFinish) {
          void get().skipNext();
        }
      });

      if (preloadedSound) {
        await sound.playAsync();
      }

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
        prefetchedSound: null,
        prefetchedTrackId: null,
        nextSongUrl: null,
      });

      void get().preloadNextSongs();
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
    const { sound, isPlaying, isLoading } = get();
    if (!sound || isLoading) {
      return;
    }

    try {
      if (isPlaying) {
        set({ isPlaying: false });
        await sound.pauseAsync();
        return;
      }

      set({ isPlaying: true });
      await sound.playAsync();
    } catch (error) {
      set({
        isPlaying,
        error: error instanceof Error ? error.message : 'Unable to update playback',
      });
    }
  },
  seekTo: async (value) => {
    const { sound } = get();
    if (!sound) {
      return;
    }

    set({ progress: value, isSeeking: true });

    try {
      await sound.setPositionAsync(value * 1000);
    } finally {
      set({ isSeeking: false });
    }
  },
  skipNext: async () => {
    const { queue, currentIndex, playTrack, currentTrack, isLoading } = get();
    if (queue.length === 0 || isLoading) {
      return;
    }

    const normalizedIndex = resolveCurrentTrackIndex(queue, currentIndex, currentTrack);
    const nextIndex = normalizedIndex >= queue.length - 1 ? 0 : normalizedIndex + 1;
    await playTrack(queue[nextIndex], queue);
  },
  skipPrevious: async () => {
    const { queue, currentIndex, progress, seekTo, playTrack, currentTrack, isLoading } = get();
    if (queue.length === 0 || isLoading) {
      return;
    }

    if (progress > 4) {
      await seekTo(0);
      return;
    }

    const normalizedIndex = resolveCurrentTrackIndex(queue, currentIndex, currentTrack);
    const nextIndex = normalizedIndex <= 0 ? queue.length - 1 : normalizedIndex - 1;
    await playTrack(queue[nextIndex], queue);
  },
}));
