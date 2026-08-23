import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthUser } from '@/components/providers/AuthProvider';

export default function JoinGroupScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const joinGroup = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not signed in');

      const { data, error } = await supabase.rpc('join_group_with_code', {
        _invite_code: code.trim(),
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error("You're already a member of this group");
        }
        if (error.message.includes('Invalid invite code')) {
          throw new Error('Invalid invite code');
        }
        throw error;
      }

      return data;
    },
    onSuccess: group => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      Alert.alert('Joined!', `You've joined ${group.name}`, [
        { text: 'OK', onPress: () => router.replace('/(app)/groups') },
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = () => {
    setError(null);
    if (code.trim().length !== 6) {
      setError('Invite code must be 6 characters');
      return;
    }
    joinGroup.mutate();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Card padding="lg">
          <Input
            label="Invite Code"
            placeholder="ABC123"
            value={code}
            onChangeText={text => setCode(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title="Join Group"
            fullWidth
            size="lg"
            loading={joinGroup.isPending}
            disabled={joinGroup.isPending}
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
