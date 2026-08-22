import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: number;
}

const paddingMap = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24,
};

export const Card = ({ children, style, padding = 'md', elevation = 2 }: CardProps) => {
  return (
    <View
      style={[
        styles.card,
        { padding: paddingMap[padding], elevation, shadowOpacity: elevation * 0.1 },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
});
