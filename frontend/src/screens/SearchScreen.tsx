import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Search, X, Trash2, Clock } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { searchMusic } from '../api/music';
import { useSearchStore } from '../store/search.store';
import { usePlayerStore } from '../store/player.store';
import { MusicTrack } from '../types/music';
import { theme } from '../theme';
import { MiniPlayer } from '../components/MiniPlayer';
import { BottomNavBar } from '../components/BottomNavBar';

const SearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const loadingTrackId = usePlayerStore((s) => s.loadingTrackId);
  const clearPlayerError = usePlayerStore((s) => s.clearError);

  const { searchHistory, addSearchQuery, removeSearchQuery, clearSearchHistory } = useSearchStore();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-focus input and show keyboard
    const timeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeout);
  }, [fadeAnim]);

  // Debounce search query
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const searchResults = useQuery({
    queryKey: ['music-search', debouncedQuery],
    queryFn: ({ signal }) => searchMusic(debouncedQuery, signal),
    enabled: debouncedQuery.length > 0,
    retry: 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const topTracks = useMemo(() => {
    return searchResults.data || [];
  }, [searchResults.data]);

  const handleTrackPress = async (track: MusicTrack) => {
    clearPlayerError();
    addSearchQuery(debouncedQuery);
    await playTrack(track, topTracks);
  };

  const handleHistoryPress = (query: string) => {
    setSearchQuery(query);
    setDebouncedQuery(query);
    searchInputRef.current?.blur();
  };

  const handleClearInput = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    searchInputRef.current?.focus();
  };

  const isLoading = searchResults.isLoading && debouncedQuery.length > 0;
  const hasResults = topTracks.length > 0 && debouncedQuery.length > 0;
  const showHistory = !debouncedQuery && searchHistory.length > 0;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => {
              Keyboard.dismiss();
              navigation.goBack();
            }}
          >
            <ChevronLeft size={24} color="#b4a48f" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Search size={18} color="#b7a691" strokeWidth={2} />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search songs, artists..."
              placeholderTextColor="#c9bcaa"
              style={styles.searchInput}
              selectionColor="#b69772"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              keyboardType="default"
              returnKeyLabel="Search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClearInput}
                style={styles.clearButton}
              >
                <X size={18} color="#b7a691" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Search History Section */}
          {showHistory && (
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <View style={styles.historyTitleRow}>
                  <Clock size={16} color="#b7a691" strokeWidth={2} />
                  <Text style={styles.historyTitle}>Recent Searches</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={clearSearchHistory}
                  style={styles.clearHistoryButton}
                >
                  <Trash2 size={14} color="#b7a691" strokeWidth={2} />
                  <Text style={styles.clearHistoryText}>Clear</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.historyList}>
                {searchHistory.map((query, index) => (
                  <View key={index} style={styles.historyItemWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      style={styles.historyItem}
                      onPress={() => handleHistoryPress(query)}
                    >
                      <View style={styles.historyItemContent}>
                        <Clock size={14} color="#d4a574" strokeWidth={2} />
                        <Text style={styles.historyItemText}>{query}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => removeSearchQuery(query)}
                      >
                        <X size={16} color="#b7a691" strokeWidth={2} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#d4a574" />
              <Text style={styles.loadingText}>Searching for "{debouncedQuery}"...</Text>
            </View>
          )}

          {/* Search Results */}
          {hasResults && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>
                {topTracks.length} result{topTracks.length !== 1 ? 's' : ''} for "{debouncedQuery}"
              </Text>

              <View style={styles.resultsList}>
                {topTracks.map((track) => (
                  <TouchableOpacity
                    key={track.id}
                    activeOpacity={0.7}
                    style={[
                      styles.trackItem,
                      currentTrack?.id === track.id && styles.trackItemActive,
                    ]}
                    onPress={() => handleTrackPress(track)}
                  >
                    <View style={styles.trackInfo}>
                      <Text
                        style={[
                          styles.trackTitle,
                          currentTrack?.id === track.id && styles.trackTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {track.artist}
                      </Text>
                    </View>
                    {loadingTrackId === track.id && (
                      <ActivityIndicator size="small" color="#d4a574" />
                    )}
                    {currentTrack?.id === track.id && !loadingTrackId && (
                      <View style={styles.playingIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* No Results State */}
          {debouncedQuery.length > 0 && !isLoading && topTracks.length === 0 && (
            <View style={styles.emptyState}>
              <Search size={48} color="#b7a691" strokeWidth={1.5} />
              <Text style={styles.emptyStateTitle}>No results found</Text>
              <Text style={styles.emptyStateText}>
                Try searching for a different song, artist, or keyword
              </Text>
            </View>
          )}

          {/* Empty Search State */}
          {!debouncedQuery && searchHistory.length === 0 && (
            <View style={styles.emptyState}>
              <Search size={48} color="#b7a691" strokeWidth={1.5} />
              <Text style={styles.emptyStateTitle}>Start searching</Text>
              <Text style={styles.emptyStateText}>
                Find your favorite songs and artists to get started
              </Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>

      {/* Mini Player */}
      <MiniPlayer />

      {/* Bottom Nav Bar */}
      <BottomNavBar />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4eee3',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 164, 143, 0.3)',
  },
  backButton: {
    padding: theme.spacing.s,
    marginRight: theme.spacing.s,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcf9f1',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(220, 208, 189, 0.5)',
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.s,
    marginRight: theme.spacing.s,
    paddingVertical: theme.spacing.m,
    color: '#3a3530',
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.l,
  },
  bottomPadding: {
    height: 16,
  },

  // History Section
  historySection: {
    marginBottom: theme.spacing.xl,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b4a48f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(180, 164, 143, 0.15)',
  },
  clearHistoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b4a48f',
  },
  historyList: {
    gap: theme.spacing.s,
  },
  historyItemWrapper: {
    marginBottom: theme.spacing.s,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    backgroundColor: '#fcf9f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 208, 189, 0.5)',
  },
  historyItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  historyItemText: {
    fontSize: 15,
    color: '#3a3530',
    fontWeight: '500',
  },

  // Results Section
  resultsSection: {
    marginBottom: theme.spacing.xl,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b4a48f',
    marginBottom: theme.spacing.m,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultsList: {
    gap: theme.spacing.s,
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    backgroundColor: '#fcf9f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 208, 189, 0.5)',
  },
  trackItemActive: {
    borderColor: '#d4a574',
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
  },
  trackInfo: {
    flex: 1,
    marginRight: theme.spacing.m,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3a3530',
    marginBottom: theme.spacing.xs,
  },
  trackTitleActive: {
    color: '#8f7d68',
  },
  trackArtist: {
    fontSize: 13,
    color: '#b7a691',
    fontWeight: '400',
  },
  playingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4a574',
  },

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    fontSize: 14,
    color: '#b7a691',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3a3530',
    marginTop: theme.spacing.l,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#b7a691',
    textAlign: 'center',
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    fontWeight: '400',
  },
});

export default SearchScreen;
