import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthUser } from '@/components/providers/AuthProvider';

export default function CreateGroupScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createGroup = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not signed in');

      const { data, error } = await supabase.rpc('create_group_with_admin', {
        _name: name.trim(),
      });

      if (error) throw error;
      return data;
    },
    onSuccess: group => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      Alert.alert('Group Created!', `Invite code: ${group.invite_code}`, [
        { text: 'OK', onPress: () => router.replace('/(app)/groups') },
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = () => {
    setError(null);
    if (name.trim().length < 3) {
      setError('Group name must be at least 3 characters');
      return;
    }
    createGroup.mutate();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Card padding="lg">
          <Input
            label="Group Name"
            placeholder="Weekend Warriors"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title="Create Group"
            fullWidth
            size="lg"
            loading={createGroup.isPending}
            disabled={createGroup.isPending}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F2F2F7', flex: 1 },
  content: { padding: 24 },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    marginTop: 16,
    padding: 12,
  },
  errorText: { color: '#FF3B30', fontSize: 14, textAlign: 'center' },
  submitButton: { marginTop: 24 },
});
