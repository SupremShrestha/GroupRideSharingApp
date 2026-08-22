import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useAuthUser } from '@/components/providers/AuthProvider';
import { Card, Button } from '@/components/ui';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const user = useAuthUser();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.username || 'Rider'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <Link
              href="/(app)/groups/create"
              as={Button}
              title="Create Group"
              variant="primary"
              size="md"
              fullWidth
            />
            <Link
              href="/(app)/groups/join"
              as={Button}
              title="Join Group"
              variant="outline"
              size="md"
              fullWidth
            />
            <Link
              href="/(app)/rides/create"
              as={Button}
              title="Start Ride"
              variant="secondary"
              size="md"
              fullWidth
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Groups</Text>
          <Card style={styles.emptyCard} padding="lg">
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>Create or join a group to start riding together</Text>
              <Link
                href="/(app)/groups/create"
                as={Button}
                title="Create Your First Group"
                variant="primary"
                size="md"
                style={styles.emptyButton}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Rides</Text>
          <Card style={styles.emptyCard} padding="lg">
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚲</Text>
              <Text style={styles.emptyTitle}>No rides yet</Text>
              <Text style={styles.emptyText}>Start a ride to track your location with friends</Text>
              <Link
                href="/(app)/rides/create"
                as={Button}
                title="Start a Ride"
                variant="primary"
                size="md"
                style={styles.emptyButton}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    gap: 12,
  },
  container: {
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
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
  greeting: {
    color: '#1C1C1E',
    fontSize: 28,
    fontWeight: '600',
  },
  header: {
    marginBottom: 32,
  },
  name: {
    color: '#007AFF',
    fontSize: 28,
    fontWeight: '700',
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
});
