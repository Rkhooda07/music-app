import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image, Keyboard } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from "../utils/theme";
import { Search as SearchIcon, Play, X } from "lucide-react-native";
import axios from "axios";
import { usePlayerStore } from "../store/player.store";

const BACKEND_URL = "http://192.168.0.107:3000";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const playTrack = usePlayerStore(state => state.playTrack);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-search as the user types (Spotify style)
  useEffect(() => {
    if (query.trim().length > 2) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        handleSearch();
      }, 600); // 600ms debounce
    } else if (query.trim().length === 0) {
      setResults([]);
    }
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/music/search?q=${encodeURIComponent(query)}`);
      setResults(response.data.data || []);
    } catch (err: any) {
      // Only show error if we don't have existing results
      if (results.length === 0) {
        setError("Network error. Check if backend is running.");
      }
      console.log("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: any) => {
    Keyboard.dismiss();
    
    // Map current result to Player's Track type
    const currentTrackData = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: "Global Stream",
      duration: track.duration,
      uri: `${BACKEND_URL}/api/music/stream/${track.id}`,
      thumbnail: track.thumbnail
    };

    // Map all results so the queue is populated
    const queue = results.map(item => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: "Global Stream",
      duration: item.duration,
      uri: `${BACKEND_URL}/api/music/stream/${item.id}`,
      thumbnail: item.thumbnail
    }));
    
    playTrack(currentTrackData, queue);
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isThisPlaying = currentTrack?.id === item.id && isPlaying;

    return (
      <TouchableOpacity 
        style={[styles.trackCard, isThisPlaying && styles.activeTrackCard]} 
        onPress={() => handlePlay(item)}
        activeOpacity={0.7}
      >
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
          {isThisPlaying && (
            <View style={styles.playingOverlay}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
        </View>
        
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isThisPlaying && { color: theme.colors.primaryLight }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
          {item.viewCount > 0 && (
            <Text style={styles.viewLabel}>{formatViews(item.viewCount)} views</Text>
          )}
        </View>

        <View style={styles.playButtonIcon}>
          <Play 
            color={isThisPlaying ? theme.colors.primary : theme.colors.textSecondary} 
            size={20} 
            fill={isThisPlaying ? theme.colors.primary : "transparent"} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <SearchIcon color={theme.colors.textSecondary} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Songs, artists, or podcasts"
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X color={theme.colors.textSecondary} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {loading && results.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Searching global library...</Text>
          </View>
        ) : error && results.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleSearch}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : results.length === 0 && !loading ? (
          <View style={styles.centerBox}>
             <SearchIcon color={theme.colors.surface} size={80} style={{ marginBottom: 20 }} />
             <Text style={styles.emptyText}>Start typing to find music</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h1,
    fontSize: 28,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 18,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: 15,
    fontSize: 14,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
  },
  retryText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: 4,
  },
  activeTrackCard: {
    // Subtle highlight for currently playing
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  trackTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  viewLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    opacity: 0.7,
  },
  playButtonIcon: {
    marginLeft: 10,
  }
});