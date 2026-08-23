import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthUser } from '@/components/providers/AuthProvider';

interface RideParticipantRow {
  rides: {
    id: string;
    name: string;
    status: string;
    started_at: string | null;
    groups: { name: string };
  };
}

interface RideWithGroup {
  id: string;
  name: string;
  status: string;
  started_at: string | null;
  group_name: string;
}

export default function RidesScreen() {
  const user = useAuthUser();

  const {
    data: rides,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['rides', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RideWithGroup[]> => {
      const { data, error } = await supabase
        .from('ride_participants')
        .select('rides(id, name, status, started_at, groups(name))')
        .eq('user_id', user!.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return ((data ?? []) as RideParticipantRow[]).map(row => ({
        id: row.rides.id,
        name: row.rides.name,
        status: row.rides.status,
        started_at: row.rides.started_at,
        group_name: row.rides.groups.name,
      }));
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={rides}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Rides</Text>
            <Text style={styles.subtitle}>Your ride history</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/(app)/ride/${item.id}`} asChild>
            <Pressable>
              <Card style={styles.rideCard} padding="md">
                <View style={styles.rideRow}>
                  <Text style={styles.rideName}>{item.name}</Text>
                  {item.status === 'active' && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rideMeta}>{item.group_name}</Text>
              </Card>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Card style={styles.emptyCard} padding="lg">
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🚲</Text>
                <Text style={styles.emptyTitle}>No rides yet</Text>
                <Text style={styles.emptyText}>
                  Start a ride from one of your groups to track your location with friends
                </Text>
              </View>
            </Card>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F2F2F7', flex: 1 },
  content: { padding: 24, paddingBottom: 100 },
  emptyCard: { backgroundColor: '#fff' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyState: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#8E8E93', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  header: { marginBottom: 24 },
  liveBadge: {
    backgroundColor: '#FFEBEB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveBadgeText: { color: '#FF3B30', fontSize: 11, fontWeight: '700' },
  rideCard: { backgroundColor: '#fff', marginBottom: 12 },
  rideMeta: { color: '#8E8E93', fontSize: 13, marginTop: 4 },
  rideName: { color: '#1C1C1E', fontSize: 17, fontWeight: '600' },
  rideRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  subtitle: { color: '#8E8E93', fontSize: 16, marginTop: 4 },
  title: { color: '#1C1C1E', fontSize: 32, fontWeight: '700' },
});
