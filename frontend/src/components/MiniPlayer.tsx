import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { usePlayerStore } from '../store/player.store';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import { theme } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigation/types';

export function MiniPlayer() {
  const { currentTrack, isPlaying, isLoading, pause, resume, positionMillis, durationMillis, nextTrack } = usePlayerStore();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  if (!currentTrack) return null;

  const progress = durationMillis > 0 ? (positionMillis / durationMillis) : 0;

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Player')}
    >
      <View style={styles.content}>
        <Image source={{ uri: currentTrack.thumbnail }} style={styles.thumbnail} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => isPlaying ? pause() : resume()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.text} size="small" />
            ) : isPlaying ? (
              <Pause color={theme.colors.text} size={24} fill={theme.colors.text} />
            ) : (
              <Play color={theme.colors.text} size={24} fill={theme.colors.text} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => nextTrack()}>
            <SkipForward color={theme.colors.text} size={24} fill={theme.colors.text} />
          </TouchableOpacity>
        </View>
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
    bottom: 50, 
    left: 8,
    right: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  progressBarBg: {
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.text,
  },
});
