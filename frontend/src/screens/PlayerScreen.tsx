import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronDown,
  MoreVertical,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Shuffle,
} from 'lucide-react-native';
import { fallbackArtwork, playerPalette } from '../constants/mockPlayer';
import { RootStackParamList } from '../navigation/types';
import { usePlayerStore } from '../store/player.store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getArtworkSource = (thumbnail?: string) =>
  thumbnail ? { uri: thumbnail } : fallbackArtwork;

const PlayerScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const sound = usePlayerStore((s) => s.sound);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const queue = usePlayerStore((s) => s.queue);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const skipPrevious = usePlayerStore((s) => s.skipPrevious);
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;
  const artworkFloat = useRef(new Animated.Value(0)).current;
  const wheelScale = useRef(new Animated.Value(0.92)).current;
  const dragY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);

  const dismissPlayer = () => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(dragY, {
        toValue: SCREEN_HEIGHT + 100,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        dragY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 1.15) {
          dismissPlayer();
          return;
        }

        Animated.spring(dragY, {
          toValue: 0,
          damping: 18,
          stiffness: 200,
          mass: 0.85,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          damping: 18,
          stiffness: 200,
          mass: 0.85,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(lift, {
        toValue: 0,
        damping: 18,
        stiffness: 160,
        mass: 0.94,
        useNativeDriver: true,
      }),
      Animated.spring(wheelScale, {
        toValue: 1,
        damping: 15,
        stiffness: 140,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(dragY, {
        toValue: 0,
        damping: 20,
        stiffness: 120,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(artworkFloat, {
          toValue: -8,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(artworkFloat, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [artworkFloat, fade, lift, wheelScale]);

  useEffect(() => {
    if (!currentTrack) {
      navigation.goBack();
    }
  }, [currentTrack, navigation]);

  if (!currentTrack) {
    return null;
  }

  const safeDuration = duration > 0 ? duration : currentTrack.duration || 0;
  const progressRatio = safeDuration > 0 ? clamp(progress / safeDuration, 0, 1) : 0;
  const progressThumbOffset = progressTrackWidth > 0
    ? clamp(progressRatio * progressTrackWidth, 11, Math.max(progressTrackWidth - 11, 11))
    : 11;
  const isStartingPlayback = isLoading && !sound;
  const hasQueue = queue.length > 1;
  const artistLabel = currentTrack.artist || 'Unknown artist';
  const headerLabel = artistLabel.toUpperCase();
  const canSkipPrevious = hasQueue || progress > 4;
  const canSkipNext = hasQueue;

  const handleSeek = async (event: GestureResponderEvent) => {
    if (!safeDuration || progressTrackWidth <= 0) {
      return;
    }

    const nextRatio = clamp(event.nativeEvent.locationX / progressTrackWidth, 0, 1);
    await seekTo(nextRatio * safeDuration);
  };

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setProgressTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fade,
            transform: [{ translateY: Animated.add(lift, dragY) }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.headerButton}
            onPress={dismissPlayer}
          >
            <ChevronDown size={19} color={playerPalette.textMuted} strokeWidth={2.3} />
          </TouchableOpacity>

          <Text style={styles.albumLabel} numberOfLines={1}>
            {headerLabel}
          </Text>

          <TouchableOpacity activeOpacity={0.85} style={styles.headerButton}>
            <MoreVertical size={18} color={playerPalette.textMuted} strokeWidth={2.1} />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.artworkShell,
            {
              transform: [{ translateY: artworkFloat }],
            },
          ]}
        >
          <Image source={getArtworkSource(currentTrack.thumbnail)} style={styles.artwork} />
        </Animated.View>

        <View style={styles.textBlock}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {artistLabel}
          </Text>
        </View>

        <View style={styles.progressSection}>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.progressTrack}
            onLayout={handleTrackLayout}
            onPress={(event) => {
              void handleSeek(event);
            }}
          >
            <View style={styles.progressTrackBase} />
            <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
            <View style={[styles.progressThumb, { left: progressThumbOffset }]} />
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(progress)}</Text>
            <Text style={styles.timeText}>{formatTime(safeDuration)}</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.controlWheelWrap,
            {
              transform: [{ scale: wheelScale }],
            },
          ]}
        >
          <View style={styles.controlWheelShadow} />
          <View style={styles.controlWheel}>
            <View style={styles.centerWheel} />
            <TouchableOpacity activeOpacity={0.82} style={[styles.controlButton, styles.topControl]}>
              <Shuffle size={20} color={playerPalette.textMuted} strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              style={[
                styles.controlButton,
                styles.leftControl,
                (!canSkipPrevious || isStartingPlayback) && styles.controlButtonDisabled,
              ]}
              onPress={() => {
                void skipPrevious();
              }}
              disabled={!canSkipPrevious || isStartingPlayback}
            >
              <SkipBack size={20} color={playerPalette.textMuted} fill={playerPalette.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              style={[
                styles.controlButton,
                styles.rightControl,
                (!canSkipNext || isStartingPlayback) && styles.controlButtonDisabled,
              ]}
              onPress={() => {
                void skipNext();
              }}
              disabled={!canSkipNext || isStartingPlayback}
            >
              <SkipForward size={20} color={playerPalette.textMuted} fill={playerPalette.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.controlButton,
                styles.bottomControl,
                isStartingPlayback && styles.controlButtonDisabled,
              ]}
              onPress={() => {
                void togglePlayback();
              }}
              disabled={isStartingPlayback}
            >
              {isStartingPlayback ? (
                <ActivityIndicator color={playerPalette.textMuted} size="small" />
              ) : isPlaying ? (
                <Pause size={24} color={playerPalette.textMuted} strokeWidth={2.2} />
              ) : (
                <Play size={24} color={playerPalette.textMuted} fill={playerPalette.textMuted} strokeWidth={2.2} />
              )}
            </TouchableOpacity>


          </View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    backgroundColor: playerPalette.screen,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumLabel: {
    flex: 1,
    marginHorizontal: 12,
    color: playerPalette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.9,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  artworkShell: {
    marginTop: 18,
    alignSelf: 'center',
    padding: 10,
    borderRadius: 28,
    backgroundColor: playerPalette.surface,
    shadowColor: playerPalette.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 22,
    elevation: 12,
  },
  artwork: {
    width: 248,
    height: 248,
    borderRadius: 24,
    backgroundColor: 'rgba(216, 204, 184, 0.22)',
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 34,
  },
  trackTitle: {
    color: playerPalette.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  trackArtist: {
    color: playerPalette.textMuted,
    fontSize: 14,
    marginTop: 7,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 34,
    paddingHorizontal: 2,
  },
  progressTrack: {
    height: 24,
    justifyContent: 'center',
    overflow: 'visible',
  },
  progressTrackBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(192, 180, 160, 0.54)',
  },
  progressFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#9f917a',
  },
  progressThumb: {
    position: 'absolute',
    top: 1,
    marginLeft: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: 'rgba(214, 202, 182, 0.92)',
    shadowColor: playerPalette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 5,
  },
  timeRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    color: playerPalette.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  controlWheelWrap: {
    alignSelf: 'center',
    marginTop: 42,
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlWheelShadow: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(216, 204, 184, 0.34)',
    shadowColor: playerPalette.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 12,
  },
  controlWheel: {
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: playerPalette.surfaceStrong,
    borderWidth: 1,
    borderColor: 'rgba(224, 212, 194, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWheel: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#e8dfceff',
    borderWidth: 1,
    borderColor: 'rgba(224, 212, 194, 0.96)',
  },

  controlButton: {
    position: 'absolute',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.55,
  },
  topControl: {
    top: 5,
    left: '50%',
    marginLeft: -26,
  },
  leftControl: {
    left: 5,
    top: '50%',
    marginTop: -26,
  },
  rightControl: {
    right: 5,
    top: '50%',
    marginTop: -26,
  },
  bottomControl: {
    bottom: 5,
    left: '50%',
    marginLeft: -26,
  },
});

export default PlayerScreen;
