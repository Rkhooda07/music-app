import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { House, Music2, Pause, Play, Search } from 'lucide-react-native';
import { API_BASE_URL, searchMusic } from '../api/music';
import { MiniPlayer } from '../components/MiniPlayer';
import { theme } from '../theme';
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

const formatDuration = (seconds?: number | null) => {
  if (!seconds) {
    return '--:--';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const HomeScreen = () => {
  const feeling = useUserStore((s) => s.feeling);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoadingPlayer = usePlayerStore((s) => s.isLoading);
  const loadingTrackId = usePlayerStore((s) => s.loadingTrackId);
  const playerError = usePlayerStore((s) => s.error);
  const clearPlayerError = usePlayerStore((s) => s.clearError);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const effectiveFeeling = feeling || 'freestyle';
  const activeQuery = debouncedQuery || suggestionMap[effectiveFeeling];
  const heroTitle = effectiveFeeling === 'freestyle' ? 'Freestyle mix for right now.' : `${effectiveFeeling.charAt(0).toUpperCase() + effectiveFeeling.slice(1)} mode, lined up.`;
  const heroSubtitle =
    debouncedQuery.length > 0
      ? `Showing songs for "${debouncedQuery}". Tap any result to start streaming instantly.`
      : `Pulling ${effectiveFeeling} suggestions from your backend so the app feels alive even before typed search.`;

  const searchResults = useQuery({
    queryKey: ['music-search', activeQuery],
    queryFn: ({ signal }) => searchMusic(activeQuery, signal),
    enabled: activeQuery.length > 0,
    retry: 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const featuredTrack = searchResults.data?.[0] || null;
  const topTracks = useMemo(() => searchResults.data || [], [searchResults.data]);

  const handleTrackPress = async (track: MusicTrack) => {
    clearPlayerError();
    await playTrack(track, topTracks);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.navbar}>
          <View style={styles.homeIconWrap}>
            <House size={22} color={theme.colors.text} strokeWidth={2.4} />
          </View>
          <View style={styles.searchWrap}>
            <Search size={18} color={theme.colors.textSecondary} strokeWidth={2.2} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search songs, artists, moods"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.searchInput}
              selectionColor={theme.colors.primaryLight}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.feelingPill}>
            <Text style={styles.feelingPillText}>Feeling {effectiveFeeling}</Text>
          </View>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>

          {featuredTrack && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.featuredTrack}
              onPress={() => handleTrackPress(featuredTrack)}
            >
              {featuredTrack.thumbnail ? (
                <Image source={{ uri: featuredTrack.thumbnail }} style={styles.featuredArtwork} />
              ) : (
                <View style={[styles.featuredArtwork, styles.featuredArtworkFallback]}>
                  <Music2 size={28} color={theme.colors.textSecondary} />
                </View>
              )}
              <View style={styles.featuredCopy}>
                <Text style={styles.featuredEyebrow}>Featured Pick</Text>
                <Text style={styles.featuredTitle} numberOfLines={1}>{featuredTrack.title}</Text>
                <Text style={styles.featuredArtist} numberOfLines={1}>{featuredTrack.artist}</Text>
              </View>
              <View style={styles.featuredAction}>
                <Play size={18} color={theme.colors.background} fill={theme.colors.background} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{debouncedQuery ? 'Search Results' : 'Suggestions For You'}</Text>
          {searchResults.isFetching && <ActivityIndicator color={theme.colors.primaryLight} />}
        </View>

        {searchResults.isError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Couldn’t load songs</Text>
            <Text style={styles.emptyText}>
              Make sure the backend is running and reachable at:
            </Text>
            <Text style={styles.endpointText}>
              {API_BASE_URL}
            </Text>
          </View>
        ) : null}

        {!searchResults.isError && searchResults.data?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>Try another title, artist, or mood phrase.</Text>
          </View>
        ) : null}

        {searchResults.data?.map((track) => {
          const isCurrent = currentTrack?.id === track.id;
          const isPreparingThisTrack = loadingTrackId === track.id;

          return (
            <TouchableOpacity
              key={track.id}
              activeOpacity={0.92}
              style={[styles.resultCard, isCurrent && styles.resultCardActive]}
              onPress={() => handleTrackPress(track)}
            >
              {track.thumbnail ? (
                <Image source={{ uri: track.thumbnail }} style={styles.resultArtwork} />
              ) : (
                <View style={[styles.resultArtwork, styles.resultArtworkFallback]}>
                  <Music2 size={22} color={theme.colors.textSecondary} />
                </View>
              )}

              <View style={styles.resultContent}>
                <Text style={styles.resultTitle} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.resultArtist} numberOfLines={1}>{track.artist}</Text>
                <Text style={styles.resultMeta}>
                  {formatDuration(track.duration)} {track.viewCount ? `• ${Math.round(track.viewCount / 1000)}K plays` : ''}
                </Text>
              </View>

              <View style={styles.resultActions}>
                {isPreparingThisTrack ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator color={theme.colors.primaryLight} size="small" />
                    <Text style={styles.loadingText}>Loading</Text>
                  </View>
                ) : (
                  <View style={[styles.playButton, isCurrent && styles.playButtonActive]}>
                    {isCurrent && isPlaying ? (
                      <Pause
                        size={16}
                        color={theme.colors.background}
                        fill={theme.colors.background}
                      />
                    ) : (
                      <Play
                        size={16}
                        color={isCurrent ? theme.colors.background : theme.colors.text}
                        fill={isCurrent ? theme.colors.background : theme.colors.text}
                      />
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {playerError ? (
          <View style={styles.errorStrip}>
            <Text style={styles.errorStripText}>{playerError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <MiniPlayer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  content: {
    padding: 24,
    paddingBottom: 156,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  feelingPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(129, 140, 248, 0.14)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 18,
  },
  feelingPillText: {
    color: theme.colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  heroSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  featuredTrack: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredArtwork: {
    width: 68,
    height: 68,
    borderRadius: 20,
  },
  featuredArtworkFallback: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCopy: {
    flex: 1,
    marginLeft: 14,
  },
  featuredEyebrow: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  featuredTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  featuredArtist: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  featuredAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultCardActive: {
    borderColor: 'rgba(129, 140, 248, 0.4)',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  resultArtwork: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  resultArtworkFallback: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },
  resultTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  resultArtist: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  resultMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  resultActions: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  endpointText: {
    color: theme.colors.primaryLight,
    fontSize: 13,
    marginTop: 10,
    fontWeight: '700',
  },
  errorStrip: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.28)',
  },
  errorStripText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default HomeScreen;
