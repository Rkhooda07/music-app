import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Edit3, Plus, Search, Trash2 } from 'lucide-react-native';
import { API_BASE_URL, searchMusic } from '../api/music';
import { MiniPlayer } from '../components/MiniPlayer';
import { BottomNavBar } from '../components/BottomNavBar';
import { RootStackParamList } from '../navigation/types';
import { usePlayerStore } from '../store/player.store';
import { usePlaylistStore } from '../store/playlist.store';
import { MusicTrack } from '../types/music';

type PlaylistDetailRouteProp = RouteProp<RootStackParamList, 'PlaylistDetail'>;

const PlaylistDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PlaylistDetailRouteProp>();
  const { playlistId } = route.params;
  const playlist = usePlaylistStore((state) => state.getPlaylistById(playlistId));
  const addTrackToPlaylist = usePlaylistStore((state) => state.addTrackToPlaylist);
  const setPlaylistCover = usePlaylistStore((state) => state.setPlaylistCover);
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const loadingTrackId = usePlayerStore((s) => s.loadingTrackId);
  const clearPlayerError = usePlayerStore((s) => s.clearError);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const searchResults = useQuery({
    queryKey: ['playlist-search', debouncedQuery],
    queryFn: ({ signal }) => searchMusic(debouncedQuery, signal),
    enabled: showSearch && debouncedQuery.length > 0,
    retry: 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const topTracks = useMemo(() => searchResults.data || [], [searchResults.data]);

  const handleAddSong = (track: MusicTrack) => {
    addTrackToPlaylist(playlistId, track);
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleTrackPress = async (track: MusicTrack) => {
    clearPlayerError();
    await playTrack(track, playlist?.tracks || [track]);
  };

  const askForGalleryPermission = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permission required',
        'Allow access to your photo library to choose a playlist cover.',
      );
      return false;
    }
    return true;
  };

  const handlePickCover = async () => {
    const granted = await askForGalleryPermission();
    if (!granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setPlaylistCover(playlistId, result.assets[0].uri);
    }
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete playlist',
      'This will remove the playlist and its saved cover. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlaylist(playlistId);
            navigation.navigate('Library');
          },
        },
      ],
    );
  };

  if (!playlist) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.centered}> 
          <Text style={styles.notFoundTitle}>Playlist not found</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.ctaButtonText}>Back to library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const playlistCount = playlist.tracks.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={18} color="#b4a48f" />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>{playlist.title}</Text>
          <Text style={styles.subtitle}>{playlistCount} song{playlistCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={styles.coverSection}>
        {playlist.coverUri ? (
          <Image source={{ uri: playlist.coverUri }} style={styles.coverArt} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverPlaceholderText}>Playlist cover</Text>
          </View>
        )}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.coverEditButton}
          onPress={handlePickCover}
        >
          <Edit3 size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.controlRow, styles.controlRowWide]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowSearch((current) => !current)}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#4f3e2c" />
          <Text style={styles.actionButtonText}>{showSearch ? 'Search songs' : 'Add songs'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeletePlaylist}
          activeOpacity={0.85}
        >
          <Trash2 size={16} color="#8f3d40" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {showSearch ? (
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrap}>
            <Search size={16} color="#b7a691" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search songs to add"
              placeholderTextColor="#c9bcaa"
              style={styles.searchInput}
              selectionColor="#b69772"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {debouncedQuery.length === 0 ? (
            <View style={styles.emptyState}> 
              <Text style={styles.emptyTitle}>Search for any song.</Text>
              <Text style={styles.emptyText}>Type a song, artist, or mood to add tracks to this playlist.</Text>
            </View>
          ) : searchResults.isFetching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#d4a574" />
              <Text style={styles.loadingText}>Looking for songs...</Text>
            </View>
          ) : topTracks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No songs found</Text>
              <Text style={styles.emptyText}>Try another search term.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.resultsList}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces
            >
              {topTracks.map((track) => {
                const alreadyAdded = playlist.tracks.some((item) => item.id === track.id);
                return (
                  <View key={track.id} style={styles.searchResultCard}>
                    <View style={styles.resultInfo}>
                      <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addButton, alreadyAdded && styles.addedButton]}
                      onPress={() => !alreadyAdded && handleAddSong(track)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.addButtonText, alreadyAdded && styles.addedButtonText]}>
                        {alreadyAdded ? 'Added' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : null}

      <ScrollView
        style={styles.playlistScroll}
        contentContainerStyle={styles.playlistContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {playlist.tracks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>This playlist is empty</Text>
            <Text style={styles.emptyText}>Tap Add songs to search and build your playlist.</Text>
          </View>
        ) : (
          playlist.tracks.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            const isPreparingThisTrack = loadingTrackId === track.id;

            return (
              <TouchableOpacity
                key={track.id}
                activeOpacity={0.9}
                style={[styles.trackRow, isCurrent && styles.trackRowActive]}
                onPress={() => handleTrackPress(track)}
              >
                <Text style={[styles.trackIndex, isCurrent && styles.trackIndexActive]}>{index + 1}</Text>
                <View style={styles.trackMeta}>
                  <Text style={[styles.trackName, isCurrent && styles.trackNameActive]} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackArtist}>{track.artist}</Text>
                </View>
                {isPreparingThisTrack ? (
                  <ActivityIndicator size="small" color="#d4a574" />
                ) : isCurrent ? (
                  <Text style={styles.playingIndicator}>Playing</Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  iconButton: {
    padding: 10,
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3f3527',
  },
  subtitle: {
    fontSize: 14,
    color: '#8b7f6e',
    marginTop: 4,
  },
  coverSection: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#e7dccf',
  },
  coverArt: {
    width: '100%',
    height: 180,
  },
  coverPlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f0e7',
  },
  coverPlaceholderText: {
    color: '#8b7f6e',
    fontSize: 15,
    fontWeight: '700',
  },
  coverEditButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#4f3e2c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  controlRow: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#faf5ec',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(187, 171, 145, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#d1bfaa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#4f3e2c',
    fontWeight: '700',
    fontSize: 14,
  },
  controlRowWide: {
    justifyContent: 'space-between',
  },
  deleteButton: {
    backgroundColor: '#f7e6e5',
    borderColor: '#e7b8b7',
  },
  deleteButtonText: {
    color: '#8f3d40',
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcf9f1',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(180, 164, 143, 0.3)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#3f3527',
    fontSize: 14,
  },
  resultsList: {
    maxHeight: 260,
    marginTop: 14,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#faf5ec',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(187, 171, 145, 0.25)',
  },
  resultInfo: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3f3527',
  },
  trackArtist: {
    marginTop: 4,
    fontSize: 13,
    color: '#8b7f6e',
  },
  addButton: {
    backgroundColor: '#d4a574',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addedButton: {
    backgroundColor: '#e7dfd1',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  addedButtonText: {
    color: '#8b7f6e',
  },
  playlistScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  playlistContent: {
    paddingBottom: 180,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 164, 143, 0.16)',
  },
  trackRowActive: {
    backgroundColor: 'rgba(212, 165, 116, 0.08)',
  },
  trackIndex: {
    width: 30,
    fontSize: 14,
    color: '#b7a691',
    fontWeight: '700',
  },
  trackIndexActive: {
    color: '#4f3e2c',
  },
  trackMeta: {
    flex: 1,
  },
  trackName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3f3527',
  },
  trackNameActive: {
    color: '#4f3e2c',
  },
  playingIndicator: {
    color: '#b69772',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3f3527',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8b7f6e',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 10,
    color: '#8b7f6e',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3f3527',
    marginBottom: 18,
  },
  ctaButton: {
    backgroundColor: '#d4a574',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default PlaylistDetailScreen;
