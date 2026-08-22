import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Card, Button } from '@/components/ui';
import { Link } from 'expo-router';

export default function RidesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Rides</Text>
          <Text style={styles.subtitle}>Track and share your location</Text>
        </View>

        <View style={styles.section}>
          <Link
            href="/(app)/rides/create"
            as={Button}
            title="Start New Ride"
            variant="primary"
            size="lg"
            fullWidth
            style={styles.createButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Rides</Text>
          <Card style={styles.emptyCard} padding="lg">
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚲</Text>
              <Text style={styles.emptyTitle}>No active rides</Text>
              <Text style={styles.emptyText}>Start a new ride or join one from your groups</Text>
              <Link
                href="/(app)/rides/create"
                as={Button}
                title="Start Ride"
                variant="primary"
                size="md"
                style={styles.emptyButton}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride History</Text>
          <Card style={styles.emptyCard} padding="lg">
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyTitle}>No past rides</Text>
              <Text style={styles.emptyText}>Your completed rides will appear here</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  createButton: {
    marginBottom: 8,
  },
  emptyButton: {
    maxWidth: 280,
    width: '100%',
  },
  emptyCard: {
    backgroundColor: '#fff',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  header: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#1C1C1E',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 4,
  },
  title: {
    color: '#1C1C1E',
    fontSize: 32,
    fontWeight: '700',
  },
});
