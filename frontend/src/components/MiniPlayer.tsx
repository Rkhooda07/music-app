import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../theme';
import { Play, SkipForward, Music2 } from 'lucide-react-native';

export const MiniPlayer = () => {
  // Placeholder for current track info
  const currentTrack = {
    title: 'No track playing',
    artist: 'Select a song',
  };

  return (
    <View style={styles.container}>
      <View style={styles.trackInfo}>
        <View style={styles.albumArt}>
          <Music2 color={theme.colors.textSecondary} size={20} />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <Play color={theme.colors.text} size={24} fill={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <SkipForward color={theme.colors.text} size={24} fill={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    backgroundColor: 'rgba(28, 28, 34, 0.98)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  artist: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    marginLeft: 16,
  },
});
