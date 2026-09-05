import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthUser } from '@/components/providers/AuthProvider';

interface Member {
  user_id: string;
  role: 'admin' | 'member';
  username: string;
}

interface MemberRow {
  user_id: string;
  role: 'admin' | 'member';
  profiles: { username: string };
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthUser();
  const queryClient = useQueryClient();

  const { data: group } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: activeRide, refetch: refetchActiveRide } = useQuery({
    queryKey: ['active-ride', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('id, name, destination_name')
        .eq('group_id', id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetchActiveRide();
    }, [refetchActiveRide])
  );

  const { data: members } = useQuery({
    queryKey: ['group-members', id],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, role, profiles(username)')
        .eq('group_id', id);
      if (error) throw error;
      return ((data ?? []) as unknown as MemberRow[]).map(row => ({
        user_id: row.user_id,
        role: row.role,
        username: row.profiles.username,
      }));
    },
  });

  const joinRide = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Missing user or group');
      const { data, error } = await supabase.rpc('start_or_join_ride', {
        _group_id: id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: ride => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['active-ride', id] });
      router.push(`/(app)/ride/${ride.id}`);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={members}
        keyExtractor={item => item.user_id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.groupName}>{group?.name}</Text>
              <Text style={styles.inviteCode}>Code: {group?.invite_code}</Text>
            </View>
            {activeRide ? (
              <>
                <View style={styles.activeRideBanner}>
                  <Text style={styles.activeRideText}>🔴 Ride in progress</Text>
                  {activeRide.destination_name && (
                    <Text style={styles.activeRideDestination}>
                      → {activeRide.destination_name}
                    </Text>
                  )}
                </View>
                <Button
                  title="Join Ride"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={joinRide.isPending}
                  disabled={joinRide.isPending}
                  onPress={() => joinRide.mutate()}
                  style={styles.startButton}
                />
              </>
            ) : (
              <Button
                title="Start Ride"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.push(`/(app)/groups/${id}/start-ride`)}
                style={styles.startButton}
              />
            )}
            <Text style={styles.sectionTitle}>Members</Text>
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.memberCard} padding="md">
            <View style={styles.memberRow}>
              <Text style={styles.memberName}>@{item.username}</Text>
              {item.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeRideBanner: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    marginBottom: 12,
    padding: 14,
  },
  activeRideDestination: { color: '#8E8E93', fontSize: 13, marginTop: 4 },
  activeRideText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },
  adminBadge: {
    backgroundColor: '#E8F2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminBadgeText: { color: '#007AFF', fontSize: 11, fontWeight: '600' },
  container: { backgroundColor: '#F2F2F7', flex: 1 },
  content: { padding: 24, paddingBottom: 100 },
  groupName: { color: '#1C1C1E', fontSize: 28, fontWeight: '700' },
  header: { marginBottom: 24 },
  inviteCode: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
  memberCard: { backgroundColor: '#fff', marginBottom: 8 },
  memberName: { color: '#1C1C1E', fontSize: 16, fontWeight: '500' },
  memberRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: '#1C1C1E', fontSize: 20, fontWeight: '600', marginBottom: 16 },
  startButton: { marginBottom: 32 },
});
