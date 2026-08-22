import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Pressable,
  PressableProps,
} from 'react-native';
import { Card, Button } from '@/components/ui';
import { useAuthUser, useAuth } from '@/components/providers/AuthProvider';
import { Link } from 'expo-router';

export default function ProfileScreen() {
  const user = useAuthUser();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.username}>@{user?.username || 'rider'}</Text>
          <Text style={styles.email}>{user?.full_name || 'No name set'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.menuCard}>
            <Link href="/(app)/profile/edit" asChild>
              <MenuItem title="Edit Profile" icon="✏️" />
            </Link>
            <Link href="/(app)/profile/settings" asChild>
              <MenuItem title="Settings" icon="⚙️" />
            </Link>
            <Link href="/(app)/profile/notifications" asChild>
              <MenuItem title="Notifications" icon="🔔" />
            </Link>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Data</Text>
          <Card style={styles.menuCard}>
            <Link href="/(app)/profile/history" asChild>
              <MenuItem title="Ride History" icon="📜" />
            </Link>
            <Link href="/(app)/profile/stats" asChild>
              <MenuItem title="Statistics" icon="📊" />
            </Link>
            <Link href="/(app)/profile/export" asChild>
              <MenuItem title="Export Data" icon="📤" />
            </Link>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card style={styles.menuCard}>
            <Link href="/(app)/profile/help" asChild>
              <MenuItem title="Help & FAQ" icon="❓" />
            </Link>
            <Link href="/(app)/profile/feedback" asChild>
              <MenuItem title="Send Feedback" icon="💬" />
            </Link>
            <Link href="/(app)/profile/about" asChild>
              <MenuItem title="About" icon="ℹ️" />
            </Link>
          </Card>
        </View>

        <Button
          title="Sign Out"
          variant="danger"
          size="md"
          fullWidth
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

interface MenuItemProps extends PressableProps {
  title: string;
  icon: string;
}

const MenuItem = React.forwardRef<React.ElementRef<typeof Pressable>, MenuItemProps>(
  ({ title, icon, style, ...props }, ref) => (
    <Pressable ref={ref} style={[styles.menuItem, style]} {...props}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  )
);
MenuItem.displayName = 'MenuItem';

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    marginBottom: 16,
    width: 100,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  email: {
    color: '#8E8E93',
    fontSize: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
  },
  menuChevron: {
    color: '#C7C7CC',
    fontSize: 20,
    fontWeight: '300',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    textAlign: 'center',
    width: 28,
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuTitle: {
    color: '#1C1C1E',
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  signOutButton: {
    marginBottom: 24,
    marginTop: 16,
  },
  username: {
    color: '#1C1C1E',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
});
