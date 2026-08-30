import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface GeocodeResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

export default function StartRideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);

  const isQueryTooShort = query.trim().length < 3;
  const displayResults = isQueryTooShort ? [] : results;

  useEffect(() => {
    if (isQueryTooShort) {
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${token}&limit=6`;
        const res = await fetch(url);
        const json = await res.json();
        setResults(json.features ?? []);
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, isQueryTooShort]);

  const startRide = useMutation({
    mutationFn: async (destination: GeocodeResult | null) => {
      if (!id) throw new Error('Missing group');

      const { data, error } = await supabase.rpc('start_or_join_ride', {
        _group_id: id,
        _destination_name: destination?.place_name ?? null,
        _destination_lat: destination?.center[1] ?? null,
        _destination_lng: destination?.center[0] ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: ride => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['active-ride', id] });
      router.replace(`/(app)/ride/${ride.id}`);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.label}>Where are you riding to?</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search a destination"
          autoFocus
        />

        <FlatList
          data={displayResults}
          keyExtractor={item => item.id}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <Pressable
              style={styles.resultRow}
              onPress={() => startRide.mutate(item)}
              disabled={startRide.isPending}
            >
              <Text style={styles.resultText}>{item.place_name}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            !isQueryTooShort && !searching ? (
              <Text style={styles.emptyText}>No results found</Text>
            ) : null
          }
        />

        <Pressable
          style={styles.skipButton}
          onPress={() => startRide.mutate(null)}
          disabled={startRide.isPending}
        >
          <Text style={styles.skipButtonText}>Start without a destination</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F2F2F7', flex: 1 },
  content: { flex: 1, padding: 24 },
  emptyText: { color: '#8E8E93', fontSize: 14, marginTop: 16, textAlign: 'center' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: { color: '#1C1C1E', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  resultRow: {
    backgroundColor: '#fff',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultText: { color: '#1C1C1E', fontSize: 15 },
  resultsList: { borderRadius: 12, flexGrow: 0, overflow: 'hidden' },
  skipButton: { alignItems: 'center', marginTop: 24, paddingVertical: 14 },
  skipButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
});
