import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Profile } from '../../types';

interface AuthState {
  user: Profile | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  setUser: (user: Profile | null) => void;
  setSession: (session: AuthState['session']) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => void;
  updateProfile: (updates: Partial<Profile>) => void;
}

// Platform-aware storage adapter: SecureStore on native, localStorage on web
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(name);
      }
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,

      setUser: user => set({ user }),
      setSession: session => set({ session }),
      setLoading: loading => set({ loading }),
      setInitialized: initialized => set({ initialized }),

      signOut: () => set({ user: null, session: null }),

      updateProfile: updates => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: state => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);
