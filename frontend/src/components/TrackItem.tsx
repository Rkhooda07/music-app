import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LocalTrack } from '../utils/scanLocalMusic';
import { theme } from '../utils/theme';
import { usePlayerStore } from '../store/player.store';
import { Play, Pause } from 'lucide-react-native';

export function TrackItem({ track }: { track: LocalTrack }) {
  const { playTrack, currentTrack, isPlaying, pause, resume } = usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;

  const handlePress = () => {
    if (isCurrent) {
      if (isPlaying) pause();
      else resume();
    } else {
      playTrack(track);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={[styles.artPlaceholder, isCurrent && styles.artPlaceholderActive]}>
        {isCurrent && isPlaying ? (
          <Pause color={theme.colors.background} size={20} fill={theme.colors.background} />
        ) : isCurrent ? (
          <Play color={theme.colors.background} size={20} fill={theme.colors.background} />
        ) : (
          <Text style={styles.artText}>{track.title.substring(0, 1).toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, isCurrent && styles.titleActive]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist} • {track.album}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  artPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  artPlaceholderActive: {
    backgroundColor: theme.colors.primary,
  },
  artText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  titleActive: {
    color: theme.colors.primaryLight,
  },
  artist: {
    ...theme.typography.caption,
  },
});
