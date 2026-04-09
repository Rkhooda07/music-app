import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useUserStore } from '../store/user.store';
import { House, Music2, Search } from 'lucide-react-native';

const HomeScreen = () => {
  const feeling = useUserStore(s => s.feeling);
  const [searchQuery, setSearchQuery] = useState('');
  const feelingLabel = feeling ? feeling.charAt(0).toUpperCase() + feeling.slice(1) : 'Your';

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
              placeholder="Search songs"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.searchInput}
              selectionColor={theme.colors.primaryLight}
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.placeholderCard}>
          {feeling && (
            <View style={styles.feelingPill}>
              <Text style={styles.feelingPillText}>Feeling {feeling}</Text>
            </View>
          )}
          <Music2 size={48} color={theme.colors.primaryLight} />
          <Text style={styles.placeholderText}>{feelingLabel} soundtrack starts here.</Text>
          <Text style={styles.placeholderSubText}>
            Search tracks above or jump into playlists tuned to your current mood.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <View style={[styles.cardRow, { height: 160 }]}>
             <View style={styles.miniCard} />
             <View style={styles.miniCard} />
             <View style={styles.miniCard} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>For You</Text>
          <View style={[styles.cardRow, { height: 160 }]}>
             <View style={styles.miniCard} />
             <View style={styles.miniCard} />
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  placeholderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  feelingPill: {
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
  placeholderText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  placeholderSubText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  miniCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  }
});

export default HomeScreen;
