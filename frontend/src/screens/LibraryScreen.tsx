import React, { useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, TextInput } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLibraryStore } from "../store/library.store";
import { TrackItem } from "../components/TrackItem";
import { theme } from "../utils/theme";
import { Search } from "lucide-react-native";

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const tracks = useLibraryStore((s) => s.tracks);
  const [query, setQuery] = useState("");

  const filteredTracks = useMemo(() => {
    if (!query) return tracks;
    const lowerQ = query.toLowerCase();
    return tracks.filter(t => 
      t.title.toLowerCase().includes(lowerQ) || 
      t.artist.toLowerCase().includes(lowerQ)
    );
  }, [query, tracks]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search color={theme.colors.textSecondary} size={20} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Find in library..."
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filteredTracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TrackItem track={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tracks found.</Text>
          </View>
        }
      />
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
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 100, // Space for mini player
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  }
});