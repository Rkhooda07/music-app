import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  Download,
  Heart,
  MoreVertical,
  Pause,
  Play,
  Search,
} from 'lucide-react-native';
import { API_BASE_URL, searchMusic } from '../api/music';
import { MiniPlayer } from '../components/MiniPlayer';
import { BottomNavBar } from '../components/BottomNavBar';
import { playerPalette, fallbackTracks } from '../constants/mockPlayer';
import { RootStackParamList } from '../navigation/types';
import { usePlayerStore } from '../store/player.store';
import { useUserStore } from '../store/user.store';
import { Feeling, MusicTrack } from '../types/music';

const suggestionMap: Record<Feeling, string> = {
  chill: 'lofi chill beats',
  rap: 'rap hits',
  hardcore: 'hardcore workout mix',
  love: 'romantic love songs',
  freestyle: 'top songs mix',
};

const genreHeroPalette: Record<Feeling, { base: string; glow: string; accent: string; label: string }> = {
  chill: {
    base: '#dbe8e4',
    glow: '#eef5f1',
    accent: '#b7cbc3',
    label: 'chill',
  },
  rap: {
    base: '#eadfd6',
    glow: '#f5eee8',
    accent: '#ceb7a6',
    label: 'rap',
  },
  hardcore: {
    base: '#e7ddcd',
    glow: '#f2ebe0',
    accent: '#cfb494',
    label: 'hardcore',
  },
  love: {
    base: '#efe0da',
    glow: '#f8eeea',
    accent: '#d5b2ac',
    label: 'love',
  },
  freestyle: {
    base: '#e7dfd1',
    glow: '#f3ede2',
    accent: '#cbbca4',
    label: 'freestyle',
  },
};

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const feeling = useUserStore((s) => s.feeling);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isReady, setIsReady] = useState(false); // Don't fetch on initial mount
  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const loadingTrackId = usePlayerStore((s) => s.loadingTrackId);
  const playerError = usePlayerStore((s) => s.error);
  const clearPlayerError = usePlayerStore((s) => s.clearError);

  // Allow initial render with fallback data, then enable fetching after a short delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const effectiveFeeling = feeling || 'freestyle';
  const activeQuery = debouncedQuery || suggestionMap[effectiveFeeling];
  const heroTitle =
    effectiveFeeling === 'freestyle'
      ? 'Freestyle mix for right now.'
      : `${effectiveFeeling.charAt(0).toUpperCase() + effectiveFeeling.slice(1)} mode, lined up.`;
  const heroSubtitle =
    debouncedQuery.length > 0
      ? `Showing songs for "${debouncedQuery}". Tap any result to start streaming instantly.`
      : `Pulling ${effectiveFeeling} suggestions from your backend so the app feels alive even before typed search.`;
  const heroPalette = genreHeroPalette[effectiveFeeling];

  const searchResults = useQuery({
    queryKey: ['music-search', activeQuery],
    queryFn: ({ signal }) => searchMusic(activeQuery, signal),
    enabled: isReady && activeQuery.length > 0, // Only fetch after component is ready
    retry: 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const topTracks = useMemo(() => {
    // Use fallback tracks if backend is unavailable
    if (searchResults.isError) {
      return fallbackTracks;
    }
    return searchResults.data || [];
  }, [searchResults.data, searchResults.isError]);

  const handleTrackPress = async (track: MusicTrack) => {
    clearPlayerError();
    await playTrack(track, topTracks);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.headerIconButton}
          onPress={() => navigation.navigate('Greeting')}
        >
          <ChevronLeft size={18} color="#b4a48f" />
        </TouchableOpacity>

        <View style={styles.headerSearchShell}>
          <Search size={16} color="#b7a691" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search songs"
            placeholderTextColor="#c9bcaa"
            style={styles.headerSearchInput}
            selectionColor="#b69772"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <View style={styles.headerIconButton}>
          <MoreVertical size={18} color="#b4a48f" />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroEyebrow}>{heroTitle}</Text>
          <View style={styles.heroRow}>
            <View style={styles.floatingAction}>
              <Heart size={16} color="#9d8f7c" fill="#9d8f7c" />
            </View>

            <View style={styles.featuredWrap}>
              <View style={[styles.featuredArtwork, { backgroundColor: heroPalette.base }]}>
                <View style={[styles.heroGlowLarge, { backgroundColor: heroPalette.glow }]} />
                <View style={[styles.heroGlowSmall, { backgroundColor: heroPalette.accent }]} />
                <View style={styles.heroGrid} />
                <Text style={styles.heroGenreLabel}>{heroPalette.label}</Text>
              </View>
            </View>

            <View style={styles.floatingAction}>
              <Download size={16} color="#9d8f7c" />
            </View>
          </View>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{debouncedQuery ? 'Results' : 'Playlist'}</Text>
            {searchResults.isFetching ? <ActivityIndicator color="#b69772" /> : null}
          </View>

          {searchResults.isError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Connection Issue</Text>
              <Text style={styles.emptyText}>
                Cannot reach backend server. Make sure:
              </Text>
              <Text style={styles.emptyText}>
                • Backend is running on port 3000{'\n'}
                • Your IP in .env matches your device network{'\n'}
                • Phone and backend are on same WiFi
              </Text>
              <Text style={[styles.endpointText, styles.endpointWarning]}>
                Configured: {API_BASE_URL}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => searchResults.refetch()}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!searchResults.isError && searchResults.data?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyText}>Try another song, artist, or mood phrase.</Text>
            </View>
          ) : null}

          <View style={styles.listWrap}>
            {searchResults.data?.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              const isPreparingThisTrack = loadingTrackId === track.id;

              return (
                <TouchableOpacity
                  key={track.id}
                  activeOpacity={0.9}
                  style={[styles.resultCard, isCurrent && styles.resultCardActive]}
                  onPress={() => handleTrackPress(track)}
                >
                  <Text style={[styles.trackNumber, isCurrent && styles.trackNumberActive]}>
                    {index + 1}
                  </Text>

                  <View style={styles.resultContent}>
                    <Text style={[styles.resultTitle, isCurrent && styles.resultTitleActive]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={[styles.resultArtist, isCurrent && styles.resultArtistActive]} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>

                  <View style={styles.resultActions}>
                    {isPreparingThisTrack ? (
                      <ActivityIndicator color="#b69772" size="small" />
                    ) : isCurrent ? (
                      isPlaying ? (
                        <Pause size={16} color="#8f7d68" fill="#8f7d68" />
                      ) : (
                        <Play size={16} color="#8f7d68" fill="#8f7d68" />
                      )
                    ) : (
                      <MoreVertical size={16} color="#c6b9a7" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {playerError ? (
            <View style={styles.errorStrip}>
              <Text style={styles.errorStripText}>{playerError}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <MiniPlayer />
      <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4eee3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3ecdf',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d7c7af',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  headerSearchShell: {
    flex: 1,
    height: 48,
    borderRadius: 20,
    backgroundColor: '#f7f0e3',
    borderWidth: 1,
    borderColor: 'rgba(187, 171, 145, 0.35)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#dac9b0',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  headerSearchInput: {
    flex: 1,
    color: '#756754',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 22,
    paddingHorizontal: 24,
  },
  heroEyebrow: {
    color: '#c4b5a0',
    fontSize: 11,
    letterSpacing: 2.1,
    textTransform: 'uppercase',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },
  heroRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f7f1e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4c3a7',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 7,
  },
  featuredWrap: {
    padding: 12,
    borderRadius: 28,
    backgroundColor: '#f0e6d8',
    shadowColor: '#d8c8b0',
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  featuredArtwork: {
    width: 116,
    height: 116,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    top: -18,
    right: -10,
    opacity: 0.9,
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    bottom: -6,
    left: -8,
    opacity: 0.72,
  },
  heroGrid: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'transparent',
  },
  heroGenreLabel: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    color: playerPalette.surfaceStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'lowercase',
  },
  heroSubtitle: {
    color: '#b7a895',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 280,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#b7a895',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  listWrap: {
    gap: 6,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultCardActive: {
    backgroundColor: '#efe4d2',
    shadowColor: '#ddceb7',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  trackNumber: {
    width: 30,
    color: '#d0c3b3',
    fontSize: 24,
    fontWeight: '300',
  },
  trackNumberActive: {
    color: '#c1ad92',
  },
  resultContent: {
    flex: 1,
    paddingLeft: 8,
  },
  resultTitle: {
    color: '#857664',
    fontSize: 16,
    fontWeight: '600',
  },
  resultTitleActive: {
    color: '#75624c',
    fontWeight: '700',
  },
  resultArtist: {
    color: '#cabdac',
    fontSize: 13,
    marginTop: 4,
  },
  resultArtistActive: {
    color: '#ae9d8a',
  },
  resultActions: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#f6efe3',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#786754',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    color: '#b9ab99',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  endpointText: {
    color: '#9d8667',
    fontSize: 12,
    marginTop: 8,
  },
  endpointWarning: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#8f826d',
    alignSelf: 'flex-start',
    shadowColor: '#756754',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fcf9f1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  errorStrip: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#efe1d2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorStripText: {
    color: '#8b6f53',
    fontSize: 13,
  },
});

export default HomeScreen;
