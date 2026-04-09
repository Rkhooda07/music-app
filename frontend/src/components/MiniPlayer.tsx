import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Pause, Play, SkipForward } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { usePlayerStore } from '../store/player.store';

export const MiniPlayer = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const skipNext = usePlayerStore((s) => s.skipNext);

  return (
    <TouchableOpacity
      activeOpacity={0.96}
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 10) + 8 }]}
      onPress={() => navigation.navigate('Player')}
    >
      <View style={styles.container}>
        <View style={styles.trackInfo}>
          <Image source={currentTrack.artwork} style={styles.albumArt} />
          <View style={styles.textContent}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.85}
            onPress={togglePlayback}
          >
            {isPlaying ? (
              <Pause color={theme.colors.text} size={22} fill={theme.colors.text} />
            ) : (
              <Play color={theme.colors.text} size={22} fill={theme.colors.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.85}
            onPress={skipNext}
          >
            <SkipForward color={theme.colors.text} size={22} fill={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
  },
  container: {
    minHeight: 82,
    backgroundColor: 'rgba(28, 28, 34, 0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 20,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  artist: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  controlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
