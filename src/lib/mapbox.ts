import { Platform } from 'react-native';
import MapboxMaps from '@rnmapbox/maps';

if (Platform.OS !== 'web') {
  MapboxMaps.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');
}

export const Mapbox = MapboxMaps;
