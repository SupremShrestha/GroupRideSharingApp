import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useLocalSearchParams, Link } from 'expo-router';
import { Mapbox } from '@/lib/mapbox';
import { Button } from '@/components/ui';
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

const BROADCAST_INTERVAL_MS = 4000;
const STALE_THRESHOLD_MS = 20000;

export default function RideMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthUser();

  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [participants, setParticipants] = useState<Record<string, ParticipantLocation>>({});
  const [onlineCount, setOnlineCount] = useState(0);
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [startedBy, setStartedBy] = useState<string | null>(null);

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

  useEffect(() => {
    if (!id) return;
    supabase
      .from('rides')
      .select('status, started_by')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) return;
        setRideStatus(data.status);
        setStartedBy(data.started_by);
      });
  }, [id]);

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
          setRideStatus('completed');
        },
      },
    ]);
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;

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
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id, username: user.username });
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
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
          {startedBy === user?.id && rideStatus === 'active' && (
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
      </SafeAreaView>

      <View style={styles.overlay}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, isSharing && styles.statusDotActive]} />
          <Text style={styles.statusText}>
            {onlineCount} online · {Object.keys(participants).length} visible
          </Text>
        </View>

        {rideStatus === 'completed' ? (
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerText}>This ride has ended</Text>
          </View>
        ) : (
          <Button
            title={isSharing ? 'Stop Sharing' : 'Start Sharing Location'}
            variant={isSharing ? 'danger' : 'primary'}
            size="lg"
            fullWidth
            onPress={isSharing ? stopSharing : startSharing}
          />
        )}
      </View>
    </View>
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
  completedBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  completedBannerText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  container: { flex: 1 },
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
});
