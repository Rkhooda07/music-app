import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scanLocalMusic } from "../utils/scanLocalMusic";
import { useLibraryStore } from "../store/library.store";
import { theme } from "../utils/theme";
import { Play, FolderPlus } from "lucide-react-native";
import { usePlayerStore } from "../store/player.store";
import * as DocumentPicker from "expo-document-picker";

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { tracks, setTracks, addTrack } = useLibraryStore();
  const playTrack = usePlayerStore(s => s.playTrack);

  const handleScan = async () => {
    try {
      const scannedTracks = await scanLocalMusic();
      setTracks(scannedTracks);
    } catch (err) {
      console.log("SCAN ERROR: ", err);
      Alert.alert("Permission Error", "Expo Go blocks global media scanning on this Android version. Use the 'Import Files' button below to add songs manually!");
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: false,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          addTrack({
            id: asset.uri,
            uri: asset.uri,
            title: asset.name ? asset.name.replace(/\.[^/.]+$/, "") : "Unknown Track",
            artist: "Unknown Artist",
            album: "Imported Audio",
            duration: 0,
          });
        }
      }
    } catch (err) {
      console.log("Import error:", err);
    }
  };

  const playRandom = () => {
    if (tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[randomIndex]);
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Evening</Text>
        <Text style={styles.subtitle}>Welcome to Your Music</Text>
      </View>

      <View style={styles.statsCard}>
        <View>
          <Text style={styles.statsValue}>{tracks.length}</Text>
          <Text style={styles.statsLabel}>Local Tracks</Text>
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
          <Text style={styles.scanButtonText}>Auto-Scan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.playAllButton} onPress={playRandom} activeOpacity={0.8}>
          <Play color={theme.colors.background} size={24} fill={theme.colors.background} />
          <Text style={styles.playAllText}>Shuffle Play</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.importButton} onPress={handleImport} activeOpacity={0.8}>
          <FolderPlus color={theme.colors.text} size={20} />
          <Text style={styles.importText}>Import Files Manually</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <TouchableOpacity 
          style={styles.linkCard}
          onPress={() => navigation.navigate('Library')}
        >
          <Text style={styles.linkCardTitle}>Your Library</Text>
          <Text style={styles.linkCardDesc}>Browse all your local files</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    ...theme.typography.h1,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.primaryLight,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  statsValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  statsLabel: {
    ...theme.typography.caption,
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  scanButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  actions: {
    marginBottom: theme.spacing.xl,
  },
  playAllButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  playAllText: {
    color: theme.colors.background,
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: theme.spacing.sm,
  },
  importButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.sm,
  },
  importText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.md,
  },
  linkCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  linkCardTitle: {
    ...theme.typography.h3,
    marginBottom: 4,
  },
  linkCardDesc: {
    ...theme.typography.caption,
  }
});