import React from 'react';
import { Stack } from 'expo-router';

export default function GroupDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="start-ride" options={{ title: 'Choose Destination' }} />
    </Stack>
  );
}
