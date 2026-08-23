export default {
  expo: {
    name: 'ride-map-app',
    slug: 'ride-map-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'ridemapapp',
    ios: {
      supportsTablet: true,
    },
    android: {
      package: 'com.suprim26.ridemapapp',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      '@rnmapbox/maps',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to use your location to show it on the ride map.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '385b3107-d643-4f06-9ac5-f54dfc15ce58',
      },
    },
  },
};
