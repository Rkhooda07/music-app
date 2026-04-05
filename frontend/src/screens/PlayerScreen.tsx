import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from "../store/player.store";
import { useLibraryStore } from "../store/library.store";
import { theme } from "../utils/theme";
import { Play, Pause, SkipBack, SkipForward, ChevronDown } from "lucide-react-native";
import Slider from '@react-native-community/slider';
import { formatTime } from "../utils/time";

export default function PlayerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, pause, resume, positionMillis, durationMillis, seek, playTrack } = usePlayerStore();
  const tracks = useLibraryStore(s => s.tracks);

  if (!currentTrack) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <ChevronDown color={theme.colors.text} size={32} />
        </TouchableOpacity>
        <Text style={styles.emptyText}>No track playing</Text>
      </View>
    );
  }

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  const skipNext = () => {
    const idx = tracks.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1 && idx < tracks.length - 1) {
      playTrack(tracks[idx + 1]);
    }
  };

  const skipPrev = () => {
    const idx = tracks.findIndex(t => t.id === currentTrack.id);
    if (idx > 0) {
      playTrack(tracks[idx - 1]);
    } else {
      seek(0);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <ChevronDown color={theme.colors.text} size={32} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.artContainer}>
        {/* Placeholder for album art */}
        <View style={styles.artPlaceholder}>
          <Text style={styles.artText}>{currentTrack.title.substring(0, 1).toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist} • {currentTrack.album}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={durationMillis}
          value={positionMillis}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primaryLight}
          onSlidingComplete={(val) => seek(val)}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
          <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={skipPrev} style={styles.controlBtn}>
          <SkipBack color={theme.colors.text} size={36} fill={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn}>
          {isPlaying ? (
            <Pause color={theme.colors.background} size={40} fill={theme.colors.background} />
          ) : (
            <Play color={theme.colors.background} size={40} fill={theme.colors.background} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={skipNext} style={styles.controlBtn}>
          <SkipForward color={theme.colors.text} size={36} fill={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  artContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  artPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  artText: {
    fontSize: 90,
    fontWeight: 'bold',
    color: theme.colors.border,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    marginBottom: 8,
    textAlign: 'center',
  },
  artist: {
    ...theme.typography.h3,
    color: theme.colors.primaryLight,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: theme.spacing.xl,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  timeText: {
    ...theme.typography.caption,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  controlBtn: {
    padding: theme.spacing.sm,
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
  }
});