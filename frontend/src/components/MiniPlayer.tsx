import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart, Pause } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { mockPlayerTrack, playerPalette } from '../constants/mockPlayer';

export const MiniPlayer = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [opacity, translateY]);

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
        <Image source={mockPlayerTrack.artwork} style={styles.albumArt} />

        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={1}>
            {mockPlayerTrack.title}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity activeOpacity={0.85} style={styles.iconWrap}>
            <Heart color={playerPalette.textMuted} size={17} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} style={styles.iconWrap}>
            <Pause color={playerPalette.text} size={18} strokeWidth={2.2} />
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 2,
  },
  iconWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
