import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Screen Not Found</Text>
      <Text style={styles.message}>The screen you&apos;re looking for doesn&apos;t exist.</Text>
      <Link href="/" asChild>
        <Button title="Go Home" variant="primary" size="lg" style={styles.button} />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 200,
  },
  code: {
    color: '#E5E5EA',
    fontSize: 96,
    fontWeight: '700',
    marginBottom: 8,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: '#8E8E93',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  title: {
    color: '#1C1C1E',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
});
