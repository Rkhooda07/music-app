import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../theme';
import { useUserStore } from '../store/user.store';
import { Music2 } from 'lucide-react-native';

const HomeScreen = () => {
  const feeling = useUserStore(s => s.feeling);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home</Text>
        {feeling && (
          <View style={styles.feelingBadge}>
            <Text style={styles.feelingLabel}>Feeling {feeling}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.placeholderCard}>
          <Music2 size={48} color={theme.colors.primaryLight} />
          <Text style={styles.placeholderText}>Your {feeling || 'music'} world is here.</Text>
          <Text style={styles.placeholderSubText}>Loading your recommendations...</Text>
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
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
  },
  feelingBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  feelingLabel: {
    color: theme.colors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  content: {
    padding: 24,
  },
  placeholderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  placeholderText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  placeholderSubText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
