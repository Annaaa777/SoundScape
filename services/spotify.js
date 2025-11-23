// services/spotify.js - Enhanced Spotify Integration

import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const scopes = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
];

export const useSpotifyAuth = () => {
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: false,
  });

  console.log('🔴🔴🔴 ADD THIS EXACT URI TO SPOTIFY DASHBOARD:');
  console.log(redirectUri);
  console.log('🔴🔴🔴');

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: scopes,
      usePKCE: false,
      redirectUri: redirectUri,
    },
    discovery
  );

  return { request, response, promptAsync, redirectUri };
};

// Get user profile
export const getUserProfile = async (accessToken) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Get user's saved tracks (likes) - MULTIPLE PAGES
export const getUserSavedTracks = async (accessToken, limit = 50) => {
  try {
    let allTracks = [];
    let offset = 0;
    const batchSize = 50; // Max allowed by Spotify
    
    console.log('📀 Fetching saved tracks...');

    // Get up to 200 saved tracks (4 pages)
    while (offset < limit && offset < 200) {
      const response = await fetch(
        `https://api.spotify.com/v1/me/tracks?limit=${batchSize}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch saved tracks at offset ${offset}`);
        break;
      }

      const data = await response.json();
      
      if (data.items.length === 0) {
        break; // No more tracks
      }

      const tracks = data.items.map((item) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists[0]?.name || 'Unknown Artist',
        album: item.track.album?.name || 'Unknown Album',
        uri: item.track.uri,
        preview_url: item.track.preview_url,
        image: item.track.album?.images?.[0]?.url,
        popularity: item.track.popularity,
        duration_ms: item.track.duration_ms,
      }));

      allTracks = allTracks.concat(tracks);
      console.log(`  ✓ Loaded ${allTracks.length} saved tracks...`);
      
      offset += batchSize;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Total saved tracks: ${allTracks.length}`);
    return allTracks;
  } catch (error) {
    console.error('Error fetching saved tracks:', error);
    throw error;
  }
};

// Get user's top tracks - MULTIPLE TIME RANGES
export const getUserTopTracks = async (accessToken) => {
  try {
    let allTopTracks = [];
    
    // Fetch from multiple time ranges for variety
    const timeRanges = ['short_term', 'medium_term', 'long_term'];
    
    console.log('🎵 Fetching top tracks...');

    for (const timeRange of timeRanges) {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          const tracks = data.items.map((track) => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0]?.name || 'Unknown Artist',
            album: track.album?.name || 'Unknown Album',
            uri: track.uri,
            preview_url: track.preview_url,
            image: track.album?.images?.[0]?.url,
            popularity: track.popularity,
            duration_ms: track.duration_ms,
            time_range: timeRange,
          }));

          allTopTracks = allTopTracks.concat(tracks);
          console.log(`  ✓ Loaded ${tracks.length} ${timeRange} tracks`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to fetch ${timeRange} tracks:`, error);
      }
    }

    console.log(`✅ Total top tracks: ${allTopTracks.length}`);
    return allTopTracks;
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    throw error;
  }
};

// Get user's playlists
export const getUserPlaylists = async (accessToken) => {
  try {
    const response = await fetch(
      'https://api.spotify.com/v1/me/playlists?limit=50',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.items.length} playlists`);
    return data.items;
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
};

// Get tracks from a specific playlist
export const getPlaylistTracks = async (accessToken, playlistId, limit = 100) => {
  try {
    let allTracks = [];
    let offset = 0;
    const batchSize = 100;

    while (offset < limit) {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${batchSize}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) break;

      const data = await response.json();
      
      if (data.items.length === 0) break;

      const tracks = data.items
        .filter(item => item.track) // Filter out null tracks
        .map((item) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          album: item.track.album?.name || 'Unknown Album',
          uri: item.track.uri,
          preview_url: item.track.preview_url,
          image: item.track.album?.images?.[0]?.url,
          popularity: item.track.popularity,
          duration_ms: item.track.duration_ms,
        }));

      allTracks = allTracks.concat(tracks);
      offset += batchSize;
      
      if (data.items.length < batchSize) break; // Last page
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allTracks;
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    return [];
  }
};

// MASTER FUNCTION: Load ALL user music
export const loadAllUserMusic = async (accessToken) => {
  try {
    console.log('🎵 Loading ALL your music from Spotify...\n');
    
    let allTracks = [];
    const trackIds = new Set(); // Prevent duplicates

    // 1. Get saved tracks (liked songs)
    try {
      const savedTracks = await getUserSavedTracks(accessToken, 200);
      savedTracks.forEach(track => {
        if (!trackIds.has(track.id)) {
          trackIds.add(track.id);
          allTracks.push({ ...track, source: 'saved' });
        }
      });
    } catch (error) {
      console.warn('⚠️ Could not load saved tracks:', error.message);
    }

    // 2. Get top tracks from all time ranges
    try {
      const topTracks = await getUserTopTracks(accessToken);
      topTracks.forEach(track => {
        if (!trackIds.has(track.id)) {
          trackIds.add(track.id);
          allTracks.push({ ...track, source: 'top' });
        }
      });
    } catch (error) {
      console.warn('⚠️ Could not load top tracks:', error.message);
    }

    // 3. Get tracks from user's playlists (first 3 playlists, 50 tracks each)
    try {
      const playlists = await getUserPlaylists(accessToken);
      
      for (let i = 0; i < Math.min(3, playlists.length); i++) {
        const playlist = playlists[i];
        console.log(`📋 Loading from playlist: ${playlist.name}`);
        
        const playlistTracks = await getPlaylistTracks(accessToken, playlist.id, 50);
        
        playlistTracks.forEach(track => {
          if (!trackIds.has(track.id)) {
            trackIds.add(track.id);
            allTracks.push({ ...track, source: 'playlist', playlist_name: playlist.name });
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Could not load playlist tracks:', error.message);
    }

    console.log('\n🎉 LOADING COMPLETE!');
    console.log(`✅ Total unique tracks loaded: ${allTracks.length}`);
    console.log(`   - From saved tracks: ${allTracks.filter(t => t.source === 'saved').length}`);
    console.log(`   - From top tracks: ${allTracks.filter(t => t.source === 'top').length}`);
    console.log(`   - From playlists: ${allTracks.filter(t => t.source === 'playlist').length}`);

    return allTracks;
  } catch (error) {
    console.error('Error loading all user music:', error);
    throw error;
  }
};

export const storeToken = async (token) => {
    try {
      if (!token) {
        console.error('❌ Cannot store undefined token');
        return;
      }
      console.log('💾 Storing token...');
      await AsyncStorage.setItem('spotifyToken', token);
      console.log('✅ Token stored successfully');
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  };
  
  // Get stored token
  export const getStoredToken = async () => {
    try {
      const token = await AsyncStorage.getItem('spotifyToken');
      return token;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  };
  
  // Clear token
  export const clearToken = async () => {
    try {
      await AsyncStorage.removeItem('spotifyToken');
      console.log('✅ Token cleared');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  };

  export const exchangeCodeForToken = async (code) => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: false,
      });
  
      console.log('🔄 Exchanging code for token...');
      console.log('   Redirect URI:', redirectUri);
  
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
        }).toString(),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', response.status, errorText);
        throw new Error(`Token exchange failed: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('✅ Token exchange successful');
      
      return data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  };