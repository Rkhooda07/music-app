import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from "../utils/theme";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Connect backend to search global tracks.</Text>
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
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  }
});