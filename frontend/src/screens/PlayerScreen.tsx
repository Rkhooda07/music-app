import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { mockPlayerTrack, playerPalette } from '../constants/mockPlayer';
import { RootStackParamList } from '../navigation/types';

const PlayerScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isPlaying, setIsPlaying] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;
  const artworkFloat = useRef(new Animated.Value(0)).current;
  const wheelScale = useRef(new Animated.Value(0.92)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const dismissPlayer = () => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(dragY, {
        toValue: 420,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
      dragY.setValue(0);
      fade.setValue(1);
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
          stiffness: 180,
          mass: 0.9,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          mass: 0.9,
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={playerPalette.screen} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fade,
            transform: [
              { translateY: Animated.add(lift, dragY) },
            ],
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

          <Text style={styles.albumLabel}>{mockPlayerTrack.album}</Text>

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
          <Image source={mockPlayerTrack.artwork} style={styles.artwork} />
        </Animated.View>

        <View style={styles.textBlock}>
          <Text style={styles.trackTitle}>{mockPlayerTrack.title}</Text>
          <Text style={styles.trackArtist}>{mockPlayerTrack.artist}</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${mockPlayerTrack.progress * 100}%` }]} />
            <View style={[styles.progressThumb, { left: `${mockPlayerTrack.progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{mockPlayerTrack.elapsedLabel}</Text>
            <Text style={styles.timeText}>{mockPlayerTrack.durationLabel}</Text>
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
            <TouchableOpacity activeOpacity={0.82} style={[styles.controlButton, styles.topControl]}>
              <Shuffle size={20} color={playerPalette.textMuted} strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.82} style={[styles.controlButton, styles.leftControl]}>
              <SkipBack size={20} color={playerPalette.textMuted} fill={playerPalette.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.82} style={[styles.controlButton, styles.rightControl]}>
              <SkipForward size={20} color={playerPalette.textMuted} fill={playerPalette.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.controlButton, styles.bottomControl]}
              onPress={() => setIsPlaying((value) => !value)}
            >
              {isPlaying ? (
                <Pause size={24} color={playerPalette.textMuted} strokeWidth={2.2} />
              ) : (
                <Play size={24} color={playerPalette.textMuted} fill={playerPalette.textMuted} strokeWidth={2.2} />
              )}
            </TouchableOpacity>

            <View style={styles.controlWheelCenter} />
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
    color: playerPalette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.9,
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
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(192, 180, 160, 0.54)',
    overflow: 'visible',
    justifyContent: 'center',
  },
  progressFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#9f917a',
  },
  progressThumb: {
    position: 'absolute',
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
  controlWheelCenter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: playerPalette.screen,
    borderWidth: 1,
    borderColor: 'rgba(223, 211, 190, 0.95)',
    shadowColor: playerPalette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  controlButton: {
    position: 'absolute',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
