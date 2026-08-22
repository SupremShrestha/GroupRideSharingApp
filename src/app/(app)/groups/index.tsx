import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '@/components/ui';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthUser } from '@/components/providers/AuthProvider';

interface GroupWithRole {
  id: string;
  name: string;
  invite_code: string;
  role: 'admin' | 'member';
  member_count: number;
}

interface GroupMemberRow {
  role: 'admin' | 'member';
  groups: {
    id: string;
    name: string;
    invite_code: string;
    group_members: { count: number }[];
  };
}

export default function GroupsScreen() {
  const user = useAuthUser();

  const {
    data: groups,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['groups', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<GroupWithRole[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select('role, groups(id, name, invite_code, group_members(count))')
        .eq('user_id', user!.id);

      if (error) throw error;

      return ((data ?? []) as GroupMemberRow[]).map(row => ({
        id: row.groups.id,
        name: row.groups.name,
        invite_code: row.groups.invite_code,
        role: row.role,
        member_count: row.groups.group_members?.[0]?.count ?? 0,
      }));
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Groups</Text>
              <Text style={styles.subtitle}>Ride together with friends</Text>
            </View>

            <View style={styles.section}>
              <Link href="/(app)/groups/create" asChild>
                <Button title="Create New Group" variant="primary" size="lg" fullWidth />
              </Link>
              <View style={{ height: 12 }} />
              <Link href="/(app)/groups/join" asChild>
                <Button title="Join with Invite Code" variant="outline" size="lg" fullWidth />
              </Link>
            </View>

            <Text style={styles.sectionTitle}>Your Groups</Text>
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.groupCard} padding="md">
            <Link href={`/(app)/groups/${item.id}`} asChild>
              <View>
                <View style={styles.groupRow}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  {item.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.groupMeta}>
                  {item.member_count} {item.member_count === 1 ? 'member' : 'members'} · Code:{' '}
                  {item.invite_code}
                </Text>
              </View>
            </Link>
          </Card>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Card style={styles.emptyCard} padding="lg">
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>No groups yet</Text>
                <Text style={styles.emptyText}>
                  Create a group or join one with an invite code to start riding together
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
  adminBadge: {
    backgroundColor: '#E8F2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminBadgeText: { color: '#007AFF', fontSize: 11, fontWeight: '600' },
  container: { backgroundColor: '#F2F2F7', flex: 1 },
  content: { padding: 24, paddingBottom: 100 },
  emptyCard: { backgroundColor: '#fff' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyState: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#8E8E93', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  groupCard: { backgroundColor: '#fff', marginBottom: 12 },
  groupMeta: { color: '#8E8E93', fontSize: 13, marginTop: 4 },
  groupName: { color: '#1C1C1E', fontSize: 17, fontWeight: '600' },
  groupRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  header: { marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { color: '#1C1C1E', fontSize: 20, fontWeight: '600', marginBottom: 16 },
  subtitle: { color: '#8E8E93', fontSize: 16, marginTop: 4 },
  title: { color: '#1C1C1E', fontSize: 32, fontWeight: '700' },
});
