import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../store/player.store';
import { Play, Pause } from 'lucide-react-native';
import { theme } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigation/types';

export function MiniPlayer() {
  const { currentTrack, isPlaying, pause, resume, positionMillis, durationMillis } = usePlayerStore();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  if (!currentTrack) return null;

  const progress = durationMillis > 0 ? (positionMillis / durationMillis) : 0;

  const togglePlay = () => {
    if (isPlaying) pause();
    else resume();
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Player')}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
        <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
          {isPlaying ? (
            <Pause color={theme.colors.text} size={24} fill={theme.colors.text} />
          ) : (
            <Play color={theme.colors.text} size={24} fill={theme.colors.text} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50, // above tab bar (we can customize exact height later, usually 49-60px for tabs plus safe area)
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  info: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  title: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  artist: {
    ...theme.typography.caption,
    color: theme.colors.primaryLight,
  },
  playButton: {
    padding: theme.spacing.sm,
  },
  progressBarBg: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
});
