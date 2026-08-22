import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple SF Symbols replacement using text/icons
// In production, you'd use @expo/vector-icons or react-native-vector-icons
interface TabBarIconProps {
  name: string;
  focused: boolean;
  color: string;
  size: number;
}

const iconMap: Record<string, { filled: string; outline: string }> = {
  house: { filled: '⌂', outline: '⌂' },
  'person.3': { filled: '👥', outline: '👥' },
  bicycle: { filled: '🚲', outline: '🚲' },
  person: { filled: '👤', outline: '👤' },
};

export const TabBarIcon = ({ name, focused, color, size }: TabBarIconProps) => {
  const baseName = name.replace('.fill', '');
  const icons = iconMap[baseName] || { filled: '●', outline: '○' };
  const icon = focused ? icons.filled : icons.outline;

  return (
    <View style={styles.container}>
      <Text style={[styles.icon, { color, fontSize: size }]}>{icon}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  icon: {
    fontWeight: 'normal',
  },
});
