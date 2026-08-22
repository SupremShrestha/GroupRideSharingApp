import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button, Input, Card } from '@/components/ui';
import { useAuth, useAuthLoading } from '@/components/providers/AuthProvider';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const loading = useAuthLoading();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message);
    } else {
      router.replace('/(app)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your rides</Text>
        </View>

        <Card style={styles.formCard} padding="lg">
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={error}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            style={styles.passwordInput}
            error={error}
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title="Sign In"
            fullWidth
            size="lg"
            loading={loading}
            disabled={loading}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </Card>

        <View style={styles.footer}>
          <Text>Don&apos;t have an account?</Text>
          <Link href="/(auth)/signup" style={styles.link}>
            <Text style={styles.linkText}>Sign Up</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    marginTop: 16,
    padding: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  formCard: {
    alignSelf: 'center',
    maxWidth: 400,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  link: {
    padding: 0,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordInput: {
    marginTop: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  submitButton: {
    marginTop: 24,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 16,
  },
  title: {
    color: '#1C1C1E',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
});
