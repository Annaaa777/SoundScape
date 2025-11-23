// utils/constants.js

export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
export const OPENWEATHER_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;
export const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;
export const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
export const SPOTIFY_CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;
export const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
export const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;
export const FISH_AUDIO_API_KEY = process.env.EXPO_PUBLIC_FISH_AUDIO_API_KEY;

export const MOOD_OPTIONS = [
  { label: 'Energetic', value: 'energetic', emoji: '⚡' },
  { label: 'Chill', value: 'chill', emoji: '😌' },
  { label: 'Happy', value: 'happy', emoji: '😊' },
  { label: 'Focus', value: 'focus', emoji: '🎯' },
  { label: 'Sad', value: 'sad', emoji: '😢' },
];

export const SPOTIFY_REDIRECT_URI = 'exp://localhost:19000';
