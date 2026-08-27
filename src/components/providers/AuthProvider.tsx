import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { Profile } from '@/types';

interface AuthContextType {
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setLoading, setInitialized, signOut: storeSignOut } = useAuthStore();

  // Fetch profile from profiles table
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  // Initialize auth state from Supabase
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);

      // Get initial session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
        setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
        });
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [fetchProfile, setUser, setSession, setLoading, setInitialized]);

  // Listen for auth changes
  useEffect(() => {
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
        setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth, fetchProfile, setUser, setSession]);

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        });

        if (error) {
          return { error };
        }

        // Profile row is created automatically by the handle_new_user() trigger
        return { error: null };
      } catch (error) {
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error };
      } catch (error) {
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      storeSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, storeSignOut]);

  const refreshSession = useCallback(async () => {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Session refresh error:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ signUp, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export store selectors for direct access
export function useAuthUser() {
  return useAuthStore(state => state.user);
}

export function useAuthSession() {
  return useAuthStore(state => state.session);
}

export function useAuthLoading() {
  return useAuthStore(state => state.loading);
}

export function useAuthInitialized() {
  return useAuthStore(state => state.initialized);
}
