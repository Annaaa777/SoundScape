export default {
  expo: {
    name: "VibeNav",
    slug: "vibenav",
    owner: "annaaa777", 
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",

    scheme: "vibenav", 

    splash: {
      resizeMode: "contain",
      backgroundColor: "#1DB954",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourname.vibenav",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "We need your location to navigate you to your destination",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "We need your location to navigate you to your destination",
      },
    },

    android: {
      package: "com.yourname.vibenav",
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
    },

    web: {
      favicon: "./assets/favicon.png",
    },

    plugins: [],
  },
};