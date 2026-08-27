# 🚴 Ride Map — Live Group Ride Tracking

A React Native / Expo app for tracking a group ride in real time: see everyone's live location on a shared map, chat with the group, and manage rides within private groups.

Built as a personal portfolio project to explore realtime systems, mobile geolocation, and production-style app architecture end to end — from database design through a working native build on a real device.

## Features

- **Auth** — email/password signup and login via Supabase Auth, with an auto-provisioned profile row on signup (Postgres trigger)
- **Groups** — create a group (generates a shareable invite code) or join an existing one by code
- **Live ride tracking** — start a ride within a group; every participant's live GPS position is broadcast to the others in real time and rendered as a marker on a shared Mapbox map
- **Presence-aware sharing** — location sharing is opt-in per participant, with automatic stale-marker cleanup if someone disconnects without explicitly stopping
- **Real-time chat** — a chat thread scoped to each ride, backed by Postgres and Supabase Realtime, with persisted history
- **Ride lifecycle** — rides can be started, joined by group members, and ended by whoever started them

## Tech stack

| Layer | Choice |
|---|---|
| App framework | Expo (React Native, TypeScript), file-based routing via `expo-router` |
| Backend | Supabase — Postgres, Auth, Realtime (Broadcast + Presence + Postgres Changes) |
| Maps | Mapbox (`@rnmapbox/maps`) |
| Location | `expo-location` |
| State / data fetching | Zustand (auth store) + TanStack Query |
| Tooling | ESLint, Prettier, Husky + lint-staged pre-commit hooks |
| Build | EAS Build (custom development client — required since Mapbox's native module isn't supported in Expo Go) |

## Architecture notes

- **Auth**: a `handle_new_user()` Postgres trigger creates a `profiles` row automatically whenever `auth.users` gets a new row — avoids any client-side race between signup and profile creation.
- **Groups & rides**: creating a group and starting/joining a ride are both implemented as `security definer` Postgres RPC functions (`create_group_with_admin`, `join_group_with_code`, `start_or_join_ride`) rather than sequential client-side inserts — this avoids Row Level Security ordering issues where a client can't read back a row it just created before an associated membership row exists, and keeps each operation atomic.
- **Row Level Security**: every table has RLS enabled. Users can only see groups/rides/locations/chat scoped to groups they're actually a member of. A couple of policies that would otherwise self-reference their own table (and cause infinite recursion under Postgres RLS) are backed by `security definer` helper functions instead.
- **Realtime location**: each active participant runs a GPS watch locally and broadcasts their position on a fixed interval over a Supabase Realtime channel scoped to `ride:<ride_id>` — decoupled from movement, so a stationary participant doesn't go stale on other devices. Presence tracks who's currently connected; an explicit "stop sharing" broadcast (plus a 20s stale timeout as a fallback) removes a participant's marker for everyone else.
- **Chat**: messages are inserted directly into a `chat_messages` table and fanned out via Postgres Changes (`postgres_changes` realtime subscription), so history persists automatically and new devices joining a ride see prior messages without any extra sync logic.

## Local development

### Prerequisites

- Node.js + npm
- An Expo account (free)
- A Supabase project (free tier)
- A Mapbox account and access token

### Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MAPBOX_TOKEN=
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=
```

Run the SQL migrations in `supabase/` (or the SQL Editor in your Supabase dashboard) to set up the schema, RLS policies, and RPC functions.

### Running the app

⚠️ This project uses `@rnmapbox/maps`, a native module that **is not supported in Expo Go**. You need a custom development client build:

```bash
npx eas-cli build --profile development --platform android
```

Install the resulting `.apk` on your device, then:

```bash
npx expo start --dev-client
```

To test with another device on a different network, use tunnel mode:

```bash
npx expo start --dev-client --tunnel
```

## Known limitations

- No push notifications for ride invites or chat messages while the app is backgrounded
- No dedicated ride-history playback view for completed rides (past rides currently reopen the same live map view, correctly disabled for sharing)
- Realtime location accuracy depends on device GPS; no dead-reckoning or path smoothing
- iOS build config exists but hasn't been tested on a physical iOS device

## License

Personal portfolio project — not licensed for reuse.
