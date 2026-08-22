// Core domain types for the ride-map app

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  // Relations (populated via joins)
  creator?: Profile;
  members?: GroupMember[];
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  // Relations
  user?: Profile;
}

export interface Ride {
  id: string;
  group_id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  started_by: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  // Relations
  group?: Group;
  participants?: RideParticipant[];
  participant_count?: number;
}

export interface RideParticipant {
  id: string;
  ride_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  // Relations
  user?: Profile;
}

export interface Location {
  id: string;
  ride_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
  // Relations
  user?: Profile;
}

export interface ChatMessage {
  id: string;
  ride_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Relations
  user?: Profile;
}

// Realtime types
export interface PositionBroadcast {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface PresenceState {
  user_id: string;
  username: string;
  last_seen: number;
  is_online: boolean;
}

// Auth types
export interface AuthState {
  user: Profile | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
  loading: boolean;
}

// Map types
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface UserMarkerProps {
  user: Profile;
  coordinate: { latitude: number; longitude: number };
  isCurrentUser: boolean;
  isStale: boolean;
  onPress?: () => void;
}

// Ride summary for history
export interface RideSummary {
  ride: Ride;
  duration_seconds: number | null;
  participant_count: number;
  distance_meters: number | null;
  path_points: { latitude: number; longitude: number }[];
}
