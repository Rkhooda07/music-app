import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MiniPlayer } from '../components/MiniPlayer';
import { BottomNavBar } from '../components/BottomNavBar';

const playlists = [
  { title: 'Golden Hour', subtitle: '8 songs' },
  { title: 'Bedroom Beats', subtitle: '10 songs' },
  { title: 'Coffee House', subtitle: '12 songs' },
  { title: 'Sunday Vinyl', subtitle: '9 songs' },
  { title: 'Late Night', subtitle: '7 songs' },
  { title: 'Deep Focus', subtitle: '11 songs' },
];

const LibraryScreen = () => {
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
          <Text style={styles.subtitle}>Your playlists are ready to play.</Text>
        </View>

        <View style={styles.grid}>
          {playlists.map((playlist) => (
            <View key={playlist.title} style={styles.playlistCard}>
              <View style={styles.cardArtwork} />
              <Text style={styles.cardTitle}>{playlist.title}</Text>
              <Text style={styles.cardSubtitle}>{playlist.subtitle}</Text>
            </View>
          ))}
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
    padding: 24,
    paddingBottom: 180,
  },
  header: {
    marginBottom: 24,
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
});

export default LibraryScreen;
