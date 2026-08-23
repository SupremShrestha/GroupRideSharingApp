import React from 'react';
import { Stack } from 'expo-router';

export default function GroupsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ title: 'Create Group' }} />
      <Stack.Screen name="join" options={{ title: 'Join Group' }} />
      <Stack.Screen name="[id]" options={{ title: 'Group' }} />
    </Stack>
  );
}
