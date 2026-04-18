import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pause, Play } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fallbackArtwork, playerPalette } from '../constants/mockPlayer';
import { RootStackParamList } from '../navigation/types';
import { usePlayerStore } from '../store/player.store';

const getArtworkSource = (thumbnail?: string) =>
  thumbnail ? { uri: thumbnail } : fallbackArtwork;

export const MiniPlayer = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const sound = usePlayerStore((s) => s.sound);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentTrack) {
      return;
    }

    translateY.setValue(24);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
        mass: 0.95,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentTrack, opacity, translateY]);

  if (!currentTrack) {
    return null;
  }

  const isStartingPlayback = isLoading && !sound;
  const artistLabel = currentTrack.artist || 'Unknown artist';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 10) + 12,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.shadowLayer} />
      <TouchableOpacity
        activeOpacity={0.95}
        style={styles.container}
        onPress={() => navigation.navigate('Player')}
      >
        <Image source={getArtworkSource(currentTrack.thumbnail)} style={styles.albumArt} />

        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {artistLabel}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.iconWrap, isStartingPlayback && styles.iconWrapDisabled]}
            onPress={() => {
              void togglePlayback();
            }}
            disabled={isStartingPlayback}
          >
            {isStartingPlayback ? (
              <ActivityIndicator color={playerPalette.text} size="small" />
            ) : isPlaying ? (
              <Pause color={playerPalette.text} size={18} strokeWidth={2.2} />
            ) : (
              <Play color={playerPalette.text} size={18} fill={playerPalette.text} strokeWidth={2.2} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  shadowLayer: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 10,
    bottom: -8,
    borderRadius: 24,
    backgroundColor: 'rgba(216, 204, 184, 0.28)',
    shadowColor: playerPalette.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.42,
    shadowRadius: 22,
    elevation: 10,
  },
  container: {
    minHeight: 68,
    borderRadius: 20,
    backgroundColor: playerPalette.surfaceStrong,
    borderWidth: 1,
    borderColor: 'rgba(220, 208, 189, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  albumArt: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(216, 204, 184, 0.22)',
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 12,
  },
  title: {
    color: playerPalette.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  artist: {
    color: playerPalette.textMuted,
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  iconWrapDisabled: {
    opacity: 0.7,
  },
});
