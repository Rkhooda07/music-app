import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Music2, Pause, Play, SkipBack, SkipForward } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { usePlayerStore } from '../store/player.store';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PlayerScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const skipPrevious = usePlayerStore((s) => s.skipPrevious);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPlaying || !currentTrack) {
      rotation.stopAnimation();
      return;
    }

    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    rotation.setValue(0);
    animation.start();

    return () => animation.stop();
  }, [isPlaying, currentTrack, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <ChevronDown size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!currentTrack ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyDisc}>
            <Music2 size={40} color={theme.colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Pick a song first</Text>
          <Text style={styles.emptyText}>Search on the home screen and start any track to open the full player.</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.trackTitle}>{currentTrack.title}</Text>
          <Text style={styles.trackArtist}>{currentTrack.artist}</Text>

          <View style={styles.discShell}>
            <Animated.View style={[styles.disc, { transform: [{ rotate: spin }] }]}>
              {currentTrack.thumbnail ? (
                <Image source={{ uri: currentTrack.thumbnail }} style={styles.artwork} />
              ) : (
                <View style={[styles.artwork, styles.artworkFallback]}>
                  <Music2 size={52} color={theme.colors.textSecondary} />
                </View>
              )}
              <View style={styles.discCenterOuter}>
                <View style={styles.discCenterInner} />
              </View>
            </Animated.View>
          </View>

          <View style={styles.progressSection}>
            <Slider
              minimumValue={0}
              maximumValue={Math.max(duration, currentTrack.duration || 0, 1)}
              value={progress}
              onSlidingComplete={(value) => {
                void seekTo(value);
              }}
              minimumTrackTintColor={theme.colors.primaryLight}
              maximumTrackTintColor="rgba(255,255,255,0.14)"
              thumbTintColor={theme.colors.text}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(progress)}</Text>
              <Text style={styles.timeText}>{formatTime(Math.max(duration, currentTrack.duration || 0))}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.secondaryControl} activeOpacity={0.82} onPress={() => void skipPrevious()}>
              <SkipBack size={26} color={theme.colors.text} fill={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryControl} activeOpacity={0.9} onPress={() => void togglePlayback()}>
              {isPlaying ? (
                <Pause size={30} color={theme.colors.background} fill={theme.colors.background} />
              ) : (
                <Play size={30} color={theme.colors.background} fill={theme.colors.background} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryControl} activeOpacity={0.82} onPress={() => void skipNext()}>
              <SkipForward size={26} color={theme.colors.text} fill={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0E',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -120,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(129, 140, 248, 0.18)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: -100,
    right: -30,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(251, 146, 60, 0.14)',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 42,
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyDisc: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 10,
    borderColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
  },
  trackTitle: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  trackArtist: {
    color: theme.colors.textSecondary,
    fontSize: 17,
    textAlign: 'center',
    marginTop: 10,
  },
  discShell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
  },
  disc: {
    width: 286,
    height: 286,
    borderRadius: 143,
    backgroundColor: '#151720',
    borderWidth: 12,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.4,
    shadowRadius: 34,
    elevation: 18,
  },
  artwork: {
    width: 192,
    height: 192,
    borderRadius: 96,
  },
  artworkFallback: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discCenterOuter: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#11131A',
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discCenterInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  progressSection: {
    marginTop: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    marginTop: 10,
  },
  secondaryControl: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryControl: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primaryLight,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 22,
    elevation: 14,
  },
});

export default PlayerScreen;
