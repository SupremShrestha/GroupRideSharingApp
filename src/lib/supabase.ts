import { createClient } from '@supabase/supabase-js';
import 'react-native-get-random-values';
import { Platform } from 'react-native';

// Use expo-constants to access env vars at runtime
// These are injected at build time by Expo
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials not found. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

/**
 * Supabase client singleton
 * Uses AsyncStorage on native, localStorage on web for session persistence
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage on native platforms for persistence
    storage: Platform.OS === 'web' ? undefined : undefined, // Will be set by AuthProvider
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Realtime config
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Type-safe database access
export type Tables = {
  profiles: {
    Row: {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
      created_at: string;
    };
    Insert: {
      id: string;
      username: string;
      full_name?: string | null;
      avatar_url?: string | null;
      created_at?: string;
    };
    Update: {
      username?: string;
      full_name?: string | null;
      avatar_url?: string | null;
    };
  };
  groups: {
    Row: {
      id: string;
      name: string;
      invite_code: string;
      created_by: string;
      created_at: string;
    };
    Insert: {
      name: string;
      invite_code: string;
      created_by: string;
      created_at?: string;
    };
    Update: {
      name?: string;
      invite_code?: string;
    };
  };
  group_members: {
    Row: {
      id: string;
      group_id: string;
      user_id: string;
      role: 'admin' | 'member';
      joined_at: string;
    };
    Insert: {
      group_id: string;
      user_id: string;
      role?: 'admin' | 'member';
      joined_at?: string;
    };
    Update: {
      role?: 'admin' | 'member';
    };
  };
  rides: {
    Row: {
      id: string;
      group_id: string;
      name: string;
      status: 'pending' | 'active' | 'completed' | 'cancelled';
      started_by: string | null;
      started_at: string | null;
      ended_at: string | null;
      created_at: string;
    };
    Insert: {
      group_id: string;
      name: string;
      status?: 'pending' | 'active' | 'completed' | 'cancelled';
      started_by?: string | null;
      started_at?: string | null;
      ended_at?: string | null;
      created_at?: string;
    };
    Update: {
      name?: string;
      status?: 'pending' | 'active' | 'completed' | 'cancelled';
      started_by?: string | null;
      started_at?: string | null;
      ended_at?: string | null;
    };
  };
  ride_participants: {
    Row: {
      id: string;
      ride_id: string;
      user_id: string;
      joined_at: string;
      left_at: string | null;
    };
    Insert: {
      ride_id: string;
      user_id: string;
      joined_at?: string;
      left_at?: string | null;
    };
    Update: {
      left_at?: string | null;
    };
  };
  locations: {
    Row: {
      id: string;
      ride_id: string;
      user_id: string;
      latitude: number;
      longitude: number;
      accuracy: number | null;
      speed: number | null;
      heading: number | null;
      recorded_at: string;
    };
    Insert: {
      ride_id: string;
      user_id: string;
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      speed?: number | null;
      heading?: number | null;
      recorded_at?: string;
    };
    Update: Record<string, never>;
  };
  chat_messages: {
    Row: {
      id: string;
      ride_id: string;
      user_id: string;
      content: string;
      created_at: string;
    };
    Insert: {
      ride_id: string;
      user_id: string;
      content: string;
      created_at?: string;
    };
    Update: Record<string, never>;
  };
};

// Helper to get typed table access
export const db = supabase;
