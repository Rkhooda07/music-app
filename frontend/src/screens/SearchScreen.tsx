import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from "../utils/theme";
import { Search as SearchIcon, Play } from "lucide-react-native";
import axios from "axios";
import { usePlayerStore } from "../store/player.store";

// Automatically uses your machine's local IP address parsed from Expo for physical device testing
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

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError("");
    setResults([]);
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/music/search?q=${encodeURIComponent(query)}`);
      setResults(response.data.data || []);
    } catch (err: any) {
      console.log("Search error:", err);
      setError("Failed to search. Is your backend running on port 3000?");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: any) => {
    // Map remote youtube format back to player's LocalTrack format
    const streamUrl = `${BACKEND_URL}/api/music/stream/${track.id}`;
    
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: "YouTube Search",
      duration: track.duration,
      uri: streamUrl,
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.trackCard} 
      onPress={() => handlePlay(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity onPress={() => handlePlay(item)} style={styles.playButtonIcon}>
        <Play 
          color={currentTrack?.id === item.id && isPlaying ? theme.colors.primary : theme.colors.primaryLight} 
          size={24} 
          fill={currentTrack?.id === item.id && isPlaying ? theme.colors.primary : "transparent"} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Global Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <SearchIcon color={theme.colors.textSecondary} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search YouTube for songs, artists..."
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.centerBox} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : results.length === 0 ? (
          <Text style={styles.emptyText}>Find any song from the global library.</Text>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  searchBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.full,
  },
  searchBtnText: {
    color: theme.colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 100, // accommodate mini player
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.danger || 'red',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.border,
  },
  trackInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  trackTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackArtist: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  playButtonIcon: {
    padding: 10,
  }
});