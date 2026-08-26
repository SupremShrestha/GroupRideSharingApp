import React from 'react';
import { Stack } from 'expo-router';

export default function RideDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ title: 'Chat' }} />
    </Stack>
  );
}
