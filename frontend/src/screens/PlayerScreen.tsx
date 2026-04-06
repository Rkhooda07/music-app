import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from "../store/player.store";
import { theme } from "../utils/theme";
import { Play, Pause, SkipBack, SkipForward, ChevronDown } from "lucide-react-native";
import Slider from '@react-native-community/slider';
import { formatTime } from "../utils/time";

export default function PlayerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { 
    currentTrack, 
    isPlaying, 
    isLoading,
    pause, 
    resume, 
    positionMillis, 
    durationMillis, 
    seek,
    nextTrack,
    prevTrack
  } = usePlayerStore();

  // Local state for the slider to prevent 'jumping' while dragging
  const [sliderValue, setSliderValue] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  // Sync slider once per second or when position changes, ONLY if not sliding
  useEffect(() => {
    if (!isSliding) {
      setSliderValue(positionMillis);
    }
  }, [positionMillis, isSliding]);

  if (!currentTrack) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <ChevronDown color={theme.colors.text} size={32} />
        </TouchableOpacity>
        <Text style={styles.emptyText}>Nothing is playing</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <ChevronDown color={theme.colors.text} size={32} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.artContainer}>
        <View style={styles.artWrapper}>
          {currentTrack.thumbnail ? (
            <Image source={{ uri: currentTrack.thumbnail }} style={styles.artwork} />
          ) : (
            <View style={styles.artPlaceholder}>
              <Text style={styles.artText}>{currentTrack.title.substring(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={durationMillis || 100}
          value={sliderValue}
          onValueChange={(val) => {
            setIsSliding(true);
            setSliderValue(val);
          }}
          onSlidingComplete={async (val) => {
            await seek(val);
            setIsSliding(false);
          }}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.surface}
          thumbTintColor={theme.colors.primaryLight}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(sliderValue)}</Text>
          <Text style={styles.timeText}>{formatTime(durationMillis || 0)}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={() => prevTrack()} style={styles.controlBtn}>
          <SkipBack color={theme.colors.text} size={32} fill={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => isPlaying ? pause() : resume()} 
          style={styles.playBtn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.background} size="large" />
          ) : isPlaying ? (
            <Pause color={theme.colors.background} size={40} fill={theme.colors.background} />
          ) : (
            <Play color={theme.colors.background} size={40} fill={theme.colors.background} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => nextTrack()} style={styles.controlBtn}>
          <SkipForward color={theme.colors.text} size={32} fill={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
         <Text style={styles.footerText}>Streaming from Global Cloud</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  artContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  artwork: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  artPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    opacity: 0.3,
  },
  infoContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 6,
  },
  artist: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 30,
  },
  slider: {
    width: '110%',
    alignSelf: 'center',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 40,
  },
  controlBtn: {
    padding: 10,
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.5,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: '50%',
    fontSize: 18,
  }
});