import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Providers } from '@/components/providers/Providers';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthUser, useAuthInitialized } from '@/components/providers/AuthProvider';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthUser();
  const initialized = useAuthInitialized();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in, trying to access the app — send to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Logged in, sitting on an auth screen — send to the app
      router.replace('/(app)');
    }
  }, [user, initialized, segments, router]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Providers>
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </Providers>
    </GestureHandlerRootView>
  );
}
