// screens/HomeScreen.js

// Home screen:
// - Lets user connect Spotify and load their library
// - Lets user pick destination + mood (via voice or manual selection)
// - Has a Demo Mode toggle
// - Starts NavigationScreen with all required params

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import {
  useSpotifyAuth,
  getUserProfile,
  loadAllUserMusic,
  storeToken,
  getStoredToken,
  clearToken,
  exchangeCodeForToken,
} from '../services/spotify';

import { AuthContext } from '../context/AuthContext';
import DestinationSearch from '../components/DestinationSearch';
import MoodSelector from '../components/MoodSelector';
import VoiceMoodSelector from '../components/VoiceMoodSelector';
4
const UNION_SOUTH = {
  name: "Union South",
  coordinates: {
    lat: 43.0715,
    lng: -89.4075,
  }
};

export default function HomeScreen({ navigation }) {
  const [destination, setDestination] = useState(null);
  const [mood, setMood] = useState('happy');
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [userTracks, setUserTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  const { request, response, promptAsync } = useSpotifyAuth();
  const { logout } = useContext(AuthContext);

  // Load stored token on mount
  useEffect(() => {
    loadStoredToken();
  }, []);

  // Handle Spotify auth response
  useEffect(() => {
    if (response?.type === 'success') {
      console.log('✅ Spotify auth successful');

      if (response.params.code) {
        console.log('📝 Got authorization code, exchanging for token...');
        exchangeCodeForAccessToken(response.params.code);
      } else if (response.params.access_token) {
        console.log('✅ Got access token directly');
        handleSpotifySuccess(response.params.access_token);
      } else {
        console.error('❌ No code or token in response:', response.params);
        Alert.alert('Authentication Failed', 'Could not get authorization from Spotify');
      }
    } else if (response?.type === 'error') {
      console.error('❌ Spotify auth error:', response.error);
      Alert.alert('Authentication Failed', response.error?.message || 'Could not connect to Spotify');
    }
  }, [response]);

  const exchangeCodeForAccessToken = async (code) => {
    try {
      setLoading(true);
      setLoadingMessage('Connecting to Spotify...');

      const tokenData = await exchangeCodeForToken(code);
      if (tokenData.access_token) {
        await handleSpotifySuccess(tokenData.access_token);
      } else {
        throw new Error('No access token received');
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('❌ Error exchanging code:', error);
      Alert.alert('Connection Failed', 'Could not complete Spotify authentication');
    }
  };

  const loadStoredToken = async () => {
    try {
      const token = await getStoredToken();
      if (token) {
        console.log('✅ Found stored token');
        setSpotifyToken(token);
        loadUserMusic(token);
      } else {
        console.log('ℹ️ No stored token found');
      }
    } catch (error) {
      console.error('Error loading stored token:', error);
    }
  };

  const handleSpotifySuccess = async (token) => {
    try {
      setSpotifyToken(token);
      await storeToken(token);
      await loadUserMusic(token);
    } catch (error) {
      console.error('Error handling Spotify success:', error);
      Alert.alert('Error', 'Could not load your music library');
    }
  };

  const loadUserMusic = async (token) => {
    try {
      setLoading(true);
      setLoadingMessage('Loading your music library...');

      const profile = await getUserProfile(token);
      console.log('Logged in as:', profile.display_name);

      const allTracks = await loadAllUserMusic(token);
      setUserTracks(allTracks);

      setLoading(false);

      Alert.alert('Success!', `Loaded ${allTracks.length} songs from your Spotify library!`);
    } catch (error) {
      setLoading(false);
      console.error('Error loading user music:', error);

      if (error.message.includes('401')) {
        Alert.alert('Session Expired', 'Please reconnect your Spotify account.', [
          { text: 'OK', onPress: handleDisconnect },
        ]);
      } else {
        Alert.alert('Could Not Load Library', 'Using a sample library for demo.');
        setUserTracks(getSampleTracks());
      }
    }
  };

  const handleConnectSpotify = async () => {
    try {
      if (!request) {
        Alert.alert('Error', 'Please wait a moment and try again');
        return;
      }
      await promptAsync();
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      Alert.alert('Error', 'Could not connect to Spotify');
    }
  };

  const handleDisconnect = async () => {
    await clearToken();
    setSpotifyToken(null);
    setUserTracks([]);
    Alert.alert('Disconnected', 'Spotify has been disconnected');
  };

  const handleVoiceMoodDetected = (detectedMood) => {
    setMood(detectedMood);
    console.log(`✅ Mood set to: ${detectedMood}`);
  };

  const handleStartTrip = () => {
    if (!destination) {
      Alert.alert('Missing Info', 'Please select a destination');
      return;
    }

    const tracksToUse = userTracks.length > 0 ? userTracks : getSampleTracks();

    navigation.navigate('Navigation', {
      destination,
      mood,
      userTracks: tracksToUse,
      spotifyToken,
      demoMode,
    });
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const getSampleTracks = () => {
    return [
      { id: '1', name: 'Blinding Lights', artist: 'The Weeknd', mood: 'energetic' },
      { id: '2', name: 'Levitating', artist: 'Dua Lipa', mood: 'happy' },
      { id: '3', name: 'Good 4 U', artist: 'Olivia Rodrigo', mood: 'energetic' },
      { id: '4', name: 'Heat Waves', artist: 'Glass Animals', mood: 'chill' },
      { id: '5', name: 'Stay', artist: 'The Kid LAROI', mood: 'chill' },
      { id: '6', name: 'Industry Baby', artist: 'Lil Nas X', mood: 'energetic' },
      { id: '7', name: 'Circles', artist: 'Post Malone', mood: 'chill' },
      { id: '8', name: 'Sunflower', artist: 'Post Malone', mood: 'happy' },
      { id: '9', name: 'Someone You Loved', artist: 'Lewis Capaldi', mood: 'sad' },
      { id: '10', name: 'Perfect', artist: 'Ed Sheeran', mood: 'romantic' },
      { id: '11', name: 'Anti-Hero', artist: 'Taylor Swift', mood: 'energetic' },
      { id: '12', name: 'As It Was', artist: 'Harry Styles', mood: 'chill' },
    ];
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>🎵 Soundscape</Text>
        <Text style={styles.subtitle}>Your music meets your journey</Text>
        
        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* SPOTIFY CONNECT */}
      <View style={styles.spotifyContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        ) : spotifyToken ? (
          <View style={styles.connectedContainer}>
            <Text style={styles.connectedText}>✓ Spotify Connected</Text>
            <Text style={styles.trackCount}>{userTracks.length} songs loaded</Text>

            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.spotifyButton}
            onPress={handleConnectSpotify}
            disabled={!request}
          >
            <Text style={styles.spotifyButtonText}>
              {!request ? 'Loading...' : 'Connect Spotify'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DEMO MODE */}
      <View style={styles.demoContainer}>
        <TouchableOpacity
          style={[styles.demoToggle, demoMode && styles.demoEnabled]}
          onPress={() => {
            const newValue = !demoMode;
            setDemoMode(newValue);

            if (newValue) {
              setDestination(UNION_SOUTH);
              Alert.alert(
                "Demo Mode Enabled",
                "Destination set to Union South automatically."
              );
            } else {
              setDestination(null);
            }
          }}
        >
          <Text style={styles.demoToggleText}>
            {demoMode
              ? 'Demo Mode: ON (West Towne → Union South)'
              : 'Demo Mode: OFF'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.demoHint}>
          In Demo Mode, we simulate a drive from West Towne Mall to Union South with
          changing traffic and weather.
        </Text>
      </View>

      {/* DESTINATION SEARCH */}
      <DestinationSearch onSelect={setDestination} />

      {destination && (
        <View style={styles.selectedDestination}>
          <Text style={styles.selectedLabel}>📍 Selected:</Text>
          <Text style={styles.selectedText}>{destination.name}</Text>
        </View>
      )}

      {/* VOICE MOOD SELECTOR */}
      <VoiceMoodSelector onMoodDetected={handleVoiceMoodDetected} />

      {/* OR TEXT */}
      <Text style={styles.orText}>OR</Text>

      {/* MOOD SELECTOR */}
      <MoodSelector selectedMood={mood} onSelect={setMood} />

      {/* START TRIP */}
      <TouchableOpacity
        style={[styles.startButton, !destination && styles.startButtonDisabled]}
        onPress={handleStartTrip}
        disabled={!destination}
      >
        <Text style={styles.startButtonText}>
          {!destination ? 'Select Destination First' : '🚗 Start Trip'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        💡 AI-powered playlist with voice commands, mood detection, and navigation
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },

  header: {
    padding: 40,
    paddingTop: 60,
    backgroundColor: '#1DB954',
    alignItems: 'center',
  },
  title: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#fff', 
    marginTop: 8, 
    opacity: 0.9 
  },
  logoutButton: {
    position: 'absolute',
    top: 55,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  spotifyContainer: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  loadingContainer: { 
    alignItems: 'center', 
    padding: 20 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 14, 
    color: '#666' 
  },

  spotifyButton: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  spotifyButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

  connectedContainer: { 
    alignItems: 'center' 
  },
  connectedText: { 
    fontSize: 16, 
    color: '#1DB954', 
    fontWeight: 'bold' 
  },
  trackCount: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 5 
  },

  disconnectButton: { 
    marginTop: 10, 
    padding: 10 
  },
  disconnectButtonText: { 
    color: '#ff4444', 
    fontSize: 14 
  },

  demoContainer: { 
    marginHorizontal: 20, 
    marginTop: 15, 
    marginBottom: 5 
  },
  demoToggle: {
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  demoEnabled: { 
    backgroundColor: '#1DB954' 
  },
  demoToggleText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  demoHint: { 
    marginTop: 8, 
    fontSize: 12, 
    color: '#777' 
  },

  selectedDestination: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
  },
  selectedLabel: { 
    fontSize: 14, 
    color: '#666' 
  },
  selectedText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginTop: 5 
  },

  orText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 10,
  },

  startButton: {
    backgroundColor: '#1DB954',
    padding: 18,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  startButtonDisabled: { 
    backgroundColor: '#ccc' 
  },
  startButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },

  note: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
});
