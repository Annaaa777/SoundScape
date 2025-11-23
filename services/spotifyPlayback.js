// services/spotifyPlayback.js
// Handles audio preview playback + verifying demo tracks

import { Audio } from 'expo-av';

// In-memory reference to the currently playing sound
let currentSound = null;

// Simple in-memory cache for validated demo tracks
let cachedVerifiedDemoTracks = null;

/**
 * 🎵 Demo tracks fallback library
 * These are only used when the user's Spotify library has
 * too few playable preview tracks.
 *
 * NOTE: You can customize / replace these as needed.
 */
const DEMO_TRACKS = [
  // You can keep using your own demo songs here,
  // just make sure each has: id, name, artist, preview_url, uri (optional)
  {
    id: 'demo1',
    name: 'Demo Song 1',
    artist: 'Demo Artist',
    preview_url: 'https://p.scdn.co/mp3-preview/...',
    uri: 'spotify:track:...',
  },
  {
    id: 'demo2',
    name: 'Demo Song 2',
    artist: 'Demo Artist',
    preview_url: 'https://p.scdn.co/mp3-preview/...',
    uri: 'spotify:track:...',
  },
  // ...add more
];

/**
 * ✅ Verify which demo tracks have working preview URLs.
 * - Tries to load each preview using expo-av
 * - If load succeeds, we keep the track
 * - If it fails, we silently skip it
 * - Result is cached so it's only done once per app run
 */
export const getVerifiedDemoTracks = async () => {
  // If we've already validated them once, reuse
  if (cachedVerifiedDemoTracks) {
    return cachedVerifiedDemoTracks;
  }

  const validTracks = [];

  for (const track of DEMO_TRACKS) {
    if (!track.preview_url) continue;

    try {
      // Configure audio mode (once per validation call)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Try to load the preview without playing
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.preview_url },
        { shouldPlay: false }
      );

      // If we got here, the preview URL is valid
      await sound.unloadAsync();
      validTracks.push(track);
    } catch (error) {
      // If load failed, skip this track silently
      console.log('Skipping invalid demo preview for:', track.name);
    }
  }

  cachedVerifiedDemoTracks = validTracks;
  return validTracks;
};

/**
 * ▶️ Play a single 30s preview from a URL
 */
export const playTrackPreview = async (previewUrl) => {
  try {
    // Stop previous sound if playing
    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    if (!previewUrl) {
      console.log('⚠️ No preview URL available');
      return { success: false, error: 'No preview available' };
    }

    console.log('🎵 Playing preview:', previewUrl);

    // Configure audio mode to work even in silent mode on iOS
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    // Create and play sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: previewUrl },
      { shouldPlay: true, volume: 1.0 }
    );

    currentSound = sound;

    // Listen for automatic end of preview
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        console.log('🎵 Preview ended');
      }
    });

    return { success: true, sound };
  } catch (error) {
    console.error('Error playing preview:', error);
    return { success: false, error: error.message };
  }
};

export const pausePlayback = async () => {
  try {
    if (currentSound) {
      await currentSound.pauseAsync();
      return { success: true };
    }
  } catch (error) {
    console.error('Error pausing:', error);
  }
  return { success: false };
};

export const resumePlayback = async () => {
  try {
    if (currentSound) {
      await currentSound.playAsync();
      return { success: true };
    }
  } catch (error) {
    console.error('Error resuming:', error);
  }
  return { success: false };
};

export const stopPlayback = async () => {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
      return { success: true };
    }
  } catch (error) {
    console.error('Error stopping:', error);
  }
  return { success: false };
};

// Included for compatibility, not needed for preview playback
export const setSpotifyToken = () => {};
