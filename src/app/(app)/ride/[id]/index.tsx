import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useLocalSearchParams, Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Mapbox } from '@/lib/mapbox';
import { Button, Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthUser } from '@/components/providers/AuthProvider';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ParticipantLocation {
  user_id: string;
  username: string;
  latitude: number;
  longitude: number;
  updated_at: number;
}

interface RideDetails {
  id: string;
  name: string;
  status: string;
  started_by: string | null;
  started_at: string | null;
  ended_at: string | null;
  group_name: string;
  destination_name: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
}

interface RideParticipantSummary {
  user_id: string;
  username: string;
  joined_at: string;
}

interface RideRow {
  id: string;
  name: string;
  status: string;
  started_by: string | null;
  started_at: string | null;
  ended_at: string | null;
  destination_name: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  groups: { name: string };
}

const BROADCAST_INTERVAL_MS = 4000;
const STALE_THRESHOLD_MS = 20000;

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// --- Summary view for completed rides ---

function RideSummaryScreen({ ride }: { ride: RideDetails }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [participants, setParticipants] = useState<RideParticipantSummary[]>([]);

  useEffect(() => {
    if (!id) return;

    interface ParticipantRow {
      user_id: string;
      joined_at: string;
      profiles: { username: string };
    }

    supabase
      .from('ride_participants')
      .select('user_id, joined_at, profiles(username)')
      .eq('ride_id', id)
      .then(({ data, error }) => {
        if (error) return;
        const rows = (data ?? []) as unknown as ParticipantRow[];
        setParticipants(
          rows.map(row => ({
            user_id: row.user_id,
            joined_at: row.joined_at,
            username: row.profiles?.username,
          }))
        );
      });
  }, [id]);

  return (
    <SafeAreaView style={styles.summaryContainer} edges={['bottom']}>
      <FlatList
        data={participants}
        keyExtractor={item => item.user_id}
        contentContainerStyle={styles.summaryContent}
        ListHeaderComponent={
          <>
            <View style={styles.summaryHeader}>
              <View style={styles.endedBadge}>
                <Text style={styles.endedBadgeText}>ENDED</Text>
              </View>
              <Text style={styles.summaryTitle}>{ride.name}</Text>
              <Text style={styles.summarySubtitle}>{ride.group_name}</Text>
            </View>

            <Card style={styles.statsCard} padding="lg">
              {ride.destination_name && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Destination</Text>
                  <Text style={styles.statValue}>{ride.destination_name}</Text>
                </View>
              )}
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Started</Text>
                <Text style={styles.statValue}>{formatDateTime(ride.started_at)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ended</Text>
                <Text style={styles.statValue}>{formatDateTime(ride.ended_at)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>
                  {formatDuration(ride.started_at, ride.ended_at)}
                </Text>
              </View>
            </Card>

            <Link href={`/(app)/ride/${id}/chat`} asChild>
              <Pressable style={styles.viewChatButton}>
                <Text style={styles.viewChatButtonText}>💬 View Chat History</Text>
              </Pressable>
            </Link>

            <Text style={styles.sectionTitle}>Participants</Text>
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.participantCard} padding="md">
            <Text style={styles.participantName}>@{item.username}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

// --- Live map view for active rides ---

function RideLiveMapScreen({ ride, onEnded }: { ride: RideDetails; onEnded: () => void }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthUser();

  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [participants, setParticipants] = useState<Record<string, ParticipantLocation>>({});
  const [onlineCount, setOnlineCount] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const latestPositionRef = useRef<Location.LocationObject | null>(null);
  const broadcastIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') {
        setErrorMsg('Location permission is required to share your position.');
      }
    })();
  }, []);

  const endRide = useCallback(async () => {
    if (!id) return;
    Alert.alert('End Ride', 'This will end the ride for everyone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Ride',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('rides')
            .update({ status: 'completed', ended_at: new Date().toISOString() })
            .eq('id', id);

          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          onEnded();
        },
      },
    ]);
  }, [id, onEnded]);

  useEffect(() => {
    if (!id || !user) return;

    let cancelled = false;

    const setup = async () => {
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (cancelled) return;

      const channel = supabase.channel(`ride:${id}`, {
        config: { presence: { key: user.id } },
      });

      channel.on('broadcast', { event: 'location' }, ({ payload }) => {
        const loc = payload as ParticipantLocation;
        if (loc.user_id === user.id) return;
        setParticipants(prev => ({ ...prev, [loc.user_id]: loc }));
      });

      channel.on('broadcast', { event: 'stop_sharing' }, ({ payload }) => {
        const { user_id } = payload as { user_id: string };
        if (user_id === user.id) return;
        setParticipants(prev => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
      });

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      });

      channel.subscribe(async status => {
        if (status === 'SUBSCRIBED' && !cancelled) {
          await channel.track({ user_id: user.id, username: user.username });
        }
      });

      channelRef.current = channel;
    };

    setup();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [id, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants(prev => {
        const now = Date.now();
        const next: Record<string, ParticipantLocation> = {};
        for (const [uid, loc] of Object.entries(prev)) {
          if (now - loc.updated_at < STALE_THRESHOLD_MS) {
            next[uid] = loc;
          }
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const startSharing = useCallback(async () => {
    if (!user || !id) return;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 0,
      },
      position => {
        latestPositionRef.current = position;
      }
    );

    locationSubscriptionRef.current = subscription;

    const broadcastInterval = setInterval(() => {
      const position = latestPositionRef.current;
      if (!position) return;

      const payload: ParticipantLocation = {
        user_id: user.id,
        username: user.username,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        updated_at: Date.now(),
      };

      channelRef.current?.send({
        type: 'broadcast',
        event: 'location',
        payload,
      });

      supabase
        .from('locations')
        .insert({
          ride_id: id,
          user_id: user.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
        })
        .then(({ error }) => {
          if (error) console.error('Error saving location:', error);
        });
    }, BROADCAST_INTERVAL_MS);

    broadcastIntervalRef.current = broadcastInterval;
    setIsSharing(true);
  }, [id, user]);

  const stopSharing = useCallback(() => {
    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;

    if (broadcastIntervalRef.current) {
      clearInterval(broadcastIntervalRef.current);
      broadcastIntervalRef.current = null;
    }

    setIsSharing(false);

    if (user) {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stop_sharing',
        payload: { user_id: user.id },
      });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      locationSubscriptionRef.current?.remove();
      if (broadcastIntervalRef.current) {
        clearInterval(broadcastIntervalRef.current);
      }
      if (isSharing && user) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'stop_sharing',
          payload: { user_id: user.id },
        });
      }
    };
  }, [isSharing, user]);

  if (permissionStatus === null) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (permissionStatus !== 'granted') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Street}>
        <Mapbox.Camera followUserLocation followZoomLevel={15} />
        <Mapbox.UserLocation visible showsUserHeadingIndicator />

        {ride.destination_lat != null && ride.destination_lng != null && (
          <Mapbox.PointAnnotation
            id="destination"
            coordinate={[ride.destination_lng, ride.destination_lat]}
          >
            <View style={styles.destinationMarker}>
              <Text style={styles.destinationMarkerText}>🏁</Text>
            </View>
          </Mapbox.PointAnnotation>
        )}

        {Object.values(participants).map(p => (
          <Mapbox.PointAnnotation
            key={p.user_id}
            id={p.user_id}
            coordinate={[p.longitude, p.latitude]}
          >
            <View style={styles.marker}>
              <Text style={styles.markerText}>{p.username?.charAt(0).toUpperCase()}</Text>
            </View>
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>

      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <View style={styles.topBarRow}>
          {ride.started_by === user?.id && (
            <Pressable style={styles.endButton} onPress={endRide}>
              <Text style={styles.endButtonText}>End Ride</Text>
            </Pressable>
          )}
          <Link href={`/(app)/ride/${id}/chat`} asChild>
            <Pressable style={styles.chatButton}>
              <Text style={styles.chatButtonText}>💬 Chat</Text>
            </Pressable>
          </Link>
        </View>
        {ride.destination_name && (
          <View style={styles.destinationPill}>
            <Text style={styles.destinationPillText}>🏁 {ride.destination_name}</Text>
          </View>
        )}
      </SafeAreaView>

      <View style={styles.overlay}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, isSharing && styles.statusDotActive]} />
          <Text style={styles.statusText}>
            {onlineCount} online · {Object.keys(participants).length} visible
          </Text>
        </View>

        <Button
          title={isSharing ? 'Stop Sharing' : 'Start Sharing Location'}
          variant={isSharing ? 'danger' : 'primary'}
          size="lg"
          fullWidth
          onPress={isSharing ? stopSharing : startSharing}
        />
      </View>
    </View>
  );
}

// --- Top-level: fetches ride status and branches ---

export default function RideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRide = useCallback(() => {
    if (!id) return;
    supabase
      .from('rides')
      .select(
        'id, name, status, started_by, started_at, ended_at, destination_name, destination_lat, destination_lng, groups(name)'
      )
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) return;
        const row = data as unknown as RideRow;
        setRide({
          id: row.id,
          name: row.name,
          status: row.status,
          started_by: row.started_by,
          started_at: row.started_at,
          ended_at: row.ended_at,
          group_name: row.groups?.name,
          destination_name: row.destination_name,
          destination_lat: row.destination_lat,
          destination_lng: row.destination_lng,
        });
      });
  }, [id]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  useFocusEffect(fetchRide);

  if (loading || !ride) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (ride.status === 'completed') {
    return <RideSummaryScreen ride={ride} />;
  }

  return (
    <RideLiveMapScreen
      ride={ride}
      onEnded={() => setRide(prev => (prev ? { ...prev, status: 'completed' } : prev))}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  chatButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    elevation: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  chatButtonText: { color: '#1C1C1E', fontSize: 15, fontWeight: '600' },
  container: { flex: 1 },
  destinationMarker: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#1C1C1E',
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  destinationMarkerText: { fontSize: 18 },
  destinationPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  destinationPillText: { color: '#1C1C1E', fontSize: 13, fontWeight: '600' },
  endButton: {
    backgroundColor: 'rgba(255,59,48,0.95)',
    borderRadius: 20,
    elevation: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  endButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  endedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  endedBadgeText: { color: '#8E8E93', fontSize: 11, fontWeight: '700' },
  errorText: { color: '#8E8E93', fontSize: 16, textAlign: 'center' },
  map: { flex: 1 },
  marker: {
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  markerText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  overlay: {
    bottom: 24,
    gap: 12,
    left: 16,
    position: 'absolute',
    right: 16,
  },
  participantCard: { backgroundColor: '#fff', marginBottom: 8 },
  participantName: { color: '#1C1C1E', fontSize: 16, fontWeight: '500' },
  sectionTitle: { color: '#1C1C1E', fontSize: 20, fontWeight: '600', marginBottom: 16 },
  statLabel: { color: '#8E8E93', fontSize: 14 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { color: '#1C1C1E', fontSize: 14, fontWeight: '600' },
  statsCard: { backgroundColor: '#fff', gap: 12, marginBottom: 16 },
  statusDot: {
    backgroundColor: '#8E8E93',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusDotActive: {
    backgroundColor: '#34C759',
  },
  statusPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: { color: '#1C1C1E', fontSize: 13, fontWeight: '500' },
  summaryContainer: { backgroundColor: '#F2F2F7', flex: 1 },
  summaryContent: { padding: 24, paddingBottom: 100 },
  summaryHeader: { marginBottom: 24 },
  summarySubtitle: { color: '#8E8E93', fontSize: 15, marginTop: 4 },
  summaryTitle: { color: '#1C1C1E', fontSize: 28, fontWeight: '700' },
  topBar: {
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  topBarRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  viewChatButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 32,
    paddingVertical: 14,
  },
  viewChatButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
});
