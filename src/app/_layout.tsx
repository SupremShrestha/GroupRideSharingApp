import React from 'react';
import { Slot } from 'expo-router';
import { Providers } from '@/components/providers/Providers';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Providers>
        <Slot />
      </Providers>
    </GestureHandlerRootView>
  );
}
