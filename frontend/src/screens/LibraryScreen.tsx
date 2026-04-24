import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
import { MiniPlayer } from '../components/MiniPlayer';
import { BottomNavBar } from '../components/BottomNavBar';
import { RootStackParamList } from '../navigation/types';
import { usePlaylistStore } from '../store/playlist.store';

const LibraryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const playlists = usePlaylistStore((state) => state.playlists);
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const [modalVisible, setModalVisible] = useState(false);
  const [playlistName, setPlaylistName] = useState('');

  const handleCreatePlaylist = () => {
    setModalVisible(true);
  };

  const handleCreateConfirm = () => {
    const title = playlistName.trim() || `Playlist ${playlists.length + 1}`;
    const id = createPlaylist(title);
    setPlaylistName('');
    setModalVisible(false);
    navigation.navigate('PlaylistDetail', { playlistId: id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>Create and manage your playlists.</Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={handleCreatePlaylist}
        >
          <Plus size={16} color="#4f3e2c" />
          <Text style={styles.createButtonText}>Create playlist</Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New playlist</Text>
              <Text style={styles.modalText}>Give your playlist a name and start building it.</Text>
              <View style={styles.coverPreview}>
                <View style={styles.coverPlaceholder}>
                  <Text style={styles.coverPlaceholderText}>Cover</Text>
                </View>
              </View>
              <TextInput
                value={playlistName}
                onChangeText={setPlaylistName}
                placeholder="Playlist name"
                placeholderTextColor="#b7a691"
                style={styles.modalInput}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setPlaylistName('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={handleCreateConfirm}
                >
                  <Text style={styles.modalConfirmText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {playlists.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No playlists yet</Text>
            <Text style={styles.emptyText}>
              Create your first playlist and add songs from the search section.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('PlaylistDetail', { playlistId: playlist.id })}
              >
                {playlist.coverUri ? (
                  <View style={styles.cardArtwork}>
                    <Image source={{ uri: playlist.coverUri }} style={styles.coverImage} />
                  </View>
                ) : (
                  <View style={styles.cardArtwork}>
                    <View style={styles.cardCoverPlaceholder}>
                      <Text style={styles.cardCoverText}>Cover</Text>
                    </View>
                  </View>
                )}
                <Text style={styles.cardTitle}>{playlist.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {playlist.tracks.length} song{playlist.tracks.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 180,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3f3527',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8b7f6e',
    lineHeight: 22,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf5ec',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(187, 171, 145, 0.3)',
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#d1bfaa',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  createButtonText: {
    marginLeft: 10,
    color: '#4f3e2c',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
  },
  emptyTitle: {
    fontSize: 20,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  playlistCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 22,
    backgroundColor: '#faf5ec',
    borderWidth: 1,
    borderColor: 'rgba(187, 171, 145, 0.2)',
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#d1bfaa',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 16,
  },
  cardArtwork: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#e7dccf',
    marginBottom: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardCoverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  cardCoverText: {
    color: '#85715f',
    fontSize: 14,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4b3d31',
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#a58f7a',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 16, 0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fbf6ef',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(179, 158, 127, 0.16)',
    shadowColor: '#c5b49d',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3f3527',
    marginBottom: 10,
  },
  modalText: {
    color: '#7e6f59',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  coverPreview: {
    height: 160,
    borderRadius: 24,
    backgroundColor: '#e7dccf',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  coverPlaceholderText: {
    color: '#8b7f6e',
    fontSize: 16,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: '#fffdf7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(180, 164, 143, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#3f3527',
    marginBottom: 20,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f1e8dc',
    marginRight: 12,
  },
  modalConfirmButton: {
    backgroundColor: '#d4a574',
  },
  modalCancelText: {
    color: '#7f705c',
    fontWeight: '700',
    fontSize: 15,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default LibraryScreen;
