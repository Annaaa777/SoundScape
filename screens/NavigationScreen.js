// screens/NavigationScreen.js
//
// This screen:
// - Shows an interactive map with turn-by-turn navigation
// - Displays current location, destination, route
// - Shows navigation instructions (compact, below map)
// - Shows music player (compact, at bottom)
// - Initializes trip: route + weather + traffic
// - Calls AI to build context-aware playlist
// - Logs user feedback for personalization
// - In DEMO MODE: replays mock route with changing conditions

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';

import MusicPlayer from '../components/MusicPlayer';
import NavigationInstructions from '../components/NavigationInstructions';
import { getRoute, analyzeTraffic, calculateDistance } from '../services/mapbox';
import { getWeather } from '../services/weather';
import { generatePlaylistPrompt } from '../services/ai';
import { logTrackAction, logTripRating, getPreferenceSummary } from '../services/feedback';
import { AuthContext } from '../context/AuthContext';
import { MOCK_ROUTE } from '../services/mockRoute';

export default function NavigationScreen({ route, navigation }) {
  const { destination, mood, userTracks, demoMode } = route.params;

  // Auth context for user-specific feedback
  const { user } = useContext(AuthContext);

  // Trip state
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);

  // Navigation state
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToNextStep, setDistanceToNextStep] = useState(null);

  // Music state
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Internal vibe (might differ from initial mood)
  const [currentVibe, setCurrentVibe] = useState(mood);

  const [loading, setLoading] = useState(true);

  let locationSubscription = null;

  useEffect(() => {
    // Enable audio playback for Fish Audio TTS
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  
    initializeTrip();
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  /**
   * Main trip initialization
   */
  const initializeTrip = async () => {
    try {
      // DEMO MODE: use mock route
      if (demoMode) {
        console.log('🚗 DEMO MODE ENABLED — using mock route');

        const start = MOCK_ROUTE[0];

        // 1. Set starting location
        setCurrentLocation({ lat: start.lat, lng: start.lng });

        // 2. Create fake route data
        setRouteData({
          duration: 1200,
          distance: 8000,
          geometry: {
            coordinates: MOCK_ROUTE.map(p => [p.lng, p.lat]),
          },
        });

        // 3. Set initial weather and traffic
        setWeatherData(start.weather);
        setTrafficData({ level: start.traffic });

        // 4. Mock navigation steps for demo
        setNavigationSteps([
          { 
            distance: 500, 
            text: 'Head west on Mineral Point Rd', 
            type: 'depart', 
            modifier: 'straight', 
            location: [-89.5040, 43.0592] 
          },
          { 
            distance: 800, 
            text: 'Continue on Mineral Point Rd', 
            type: 'continue', 
            modifier: 'straight', 
            location: [-89.4932, 43.0605] 
          },
          { 
            distance: 300, 
            text: 'Turn right onto Whitney Way', 
            type: 'turn', 
            modifier: 'right', 
            location: [-89.4811, 43.0624] 
          },
          { 
            distance: 600, 
            text: 'Turn left onto University Ave', 
            type: 'turn', 
            modifier: 'left', 
            location: [-89.4687, 43.0660] 
          },
          { 
            distance: 400, 
            text: 'Continue onto Regent St', 
            type: 'new name', 
            modifier: 'straight', 
            location: [-89.4588, 43.0692] 
          },
          { 
            distance: 200, 
            text: 'Turn slight right to stay on Regent St', 
            type: 'turn', 
            modifier: 'slight right', 
            location: [-89.4237, 43.0708] 
          },
          { 
            distance: 100, 
            text: 'Arrive at Union South', 
            type: 'arrive', 
            modifier: 'straight', 
            location: [-89.4075, 43.0715] 
          },
        ]);
        setCurrentStepIndex(0);

        // 5. Choose initial vibe
        const initialVibe = chooseInitialVibe(mood, start.weather, { level: start.traffic });
        setCurrentVibe(initialVibe);

        // 6. Get user preferences
        const username = user?.username;
        const preferencesText = await getPreferenceSummary(username);

        // 7. Generate AI playlist
        const playlistResult = await generatePlaylistPrompt({
          mood: initialVibe,
          weather: start.weather,
          traffic: { level: start.traffic },
          duration: 1200,
          userTracks: userTracks || [],
          preferencesText,
        });

        setPlaylist(playlistResult.tracks);
        setCurrentTrackIndex(0);
        setIsPlaying(true);
        setLoading(false);
        return;
      }

      // LIVE MODE: real GPS navigation

      // 1. Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        setLoading(false);
        return;
      }

      // 2. Get current location
      const location = await Location.getCurrentPositionAsync({});
      const origin = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setCurrentLocation(origin);

      // 3. Get route with turn-by-turn steps
      const routeInfo = await getRoute(origin, destination.coordinates);
      setRouteData(routeInfo);

      // 4. Set navigation steps
      if (routeInfo.steps && routeInfo.steps.length > 0) {
        setNavigationSteps(routeInfo.steps);
        setCurrentStepIndex(0);
        console.log(`🧭 Navigation ready with ${routeInfo.steps.length} steps`);
      }

      // 5. Start location tracking
      startLocationTracking();

      // 6. Get weather
      const weather = await getWeather(
        destination.coordinates.lat,
        destination.coordinates.lng
      );
      setWeatherData(weather);

      // 7. Analyze traffic
      const traffic = analyzeTraffic(routeInfo.congestion);
      setTrafficData(traffic);

      // 8. Choose vibe
      const initialVibe = chooseInitialVibe(mood, weather, traffic);
      setCurrentVibe(initialVibe);

      // 9. Get preferences
      const username = user?.username;
      const preferencesText = await getPreferenceSummary(username);

      // 10. Generate playlist
      const playlistResult = await generatePlaylistPrompt({
        mood: initialVibe,
        weather,
        traffic,
        duration: routeInfo.duration,
        userTracks: userTracks || [],
        preferencesText,
      });

      setPlaylist(playlistResult.tracks);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing trip:', error);
      Alert.alert('Error', error.message || 'Failed to initialize trip');
      setLoading(false);
    }
  };

  /**
   * Start continuous location tracking (live mode only)
   */
  const startLocationTracking = async () => {
    try {
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (location) => {
          const newLocation = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          setCurrentLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Error tracking location:', error);
    }
  };

  /**
   * Track navigation progress and advance steps
   */
  useEffect(() => {
    if (!currentLocation || !navigationSteps.length || demoMode) return;

    const currentStep = navigationSteps[currentStepIndex];
    if (!currentStep || !currentStep.location) return;

    // Calculate distance to next maneuver point
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      currentStep.location[1], // lat
      currentStep.location[0]  // lng
    );

    setDistanceToNextStep(distance);

    // If close to maneuver (within 20 meters), advance to next step
    if (distance < 20 && currentStepIndex < navigationSteps.length - 1) {
      console.log(`✅ Completed step ${currentStepIndex + 1}/${navigationSteps.length}`);
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentLocation, navigationSteps, currentStepIndex, demoMode]);

  /**
   * DEMO MODE: Simulation loop
   */
  useEffect(() => {
    if (!demoMode) return;

    console.log('▶ Starting demo simulation loop…');
    let index = 0;

    const interval = setInterval(async () => {
      index++;

      if (index >= MOCK_ROUTE.length) {
        clearInterval(interval);
        console.log('🏁 Demo route finished');
        return;
      }

      const point = MOCK_ROUTE[index];

      // Move location
      setCurrentLocation({ lat: point.lat, lng: point.lng });

      // Update traffic and weather
      setTrafficData({ level: point.traffic });
      setWeatherData(point.weather);

      // Advance navigation step (every 2 waypoints)
      if (navigationSteps.length > 0 && currentStepIndex < navigationSteps.length - 1) {
        if (index % 2 === 0) {
          setCurrentStepIndex(prev => Math.min(prev + 1, navigationSteps.length - 1));
        }
      }

      // Update playlist with AI
      const username = user?.username;
      const preferencesText = await getPreferenceSummary(username);

      try {
        const playlistResult = await generatePlaylistPrompt({
          mood: currentVibe,
          weather: point.weather,
          traffic: { level: point.traffic },
          duration: 1200,
          userTracks: userTracks || [],
          preferencesText,
        });

        setPlaylist(playlistResult.tracks);
        setCurrentTrackIndex(0);

        console.log(
          `📍 Step ${index}/${MOCK_ROUTE.length - 1} – Traffic: ${point.traffic}, Weather: ${point.weather.condition}`
        );
      } catch (err) {
        console.error('Error updating playlist in demo:', err.message);
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [demoMode, currentVibe, user, userTracks]);

  /**
   * Choose initial vibe based on context
   */
  const chooseInitialVibe = (userMood, weather, traffic) => {
    const condition = weather?.condition;
    const level = traffic?.level;

    let vibe = userMood;

    if (condition === 'Rain' || condition === 'Drizzle') {
      vibe = 'calm';
    } else if (level === 'heavy' || level === 'severe') {
      vibe = 'focus';
    } else if ((level === 'light' || level === 'smooth') && condition === 'Clear') {
      vibe = 'hype';
    }

    return vibe;
  };

  /**
   * Music controls
   */
  const handleNext = () => {
    const currentTrack = playlist[currentTrackIndex];
    const username = user?.username;

    // Log skip feedback
    logTrackAction(username, {
      track: currentTrack,
      action: 'skipped',
      mood,
      vibe: currentVibe,
      weather: weatherData,
      traffic: trafficData,
    });

    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  /**
   * End trip with feedback
   */
  const handleEndTrip = () => {
    const username = user?.username;

    Alert.alert(
      'End Trip',
      'How was your experience?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Great!',
          onPress: () => {
            logTripRating(username, {
              rating: 'great',
              mood,
              vibe: currentVibe,
              weather: weatherData,
              traffic: trafficData,
            });
            Alert.alert('Thank you!', "We'll use this to improve your future trips");
            navigation.navigate('Home');
          },
        },
        {
          text: 'Could be better',
          onPress: () => {
            logTripRating(username, {
              rating: 'meh',
              mood,
              vibe: currentVibe,
              weather: weatherData,
              traffic: trafficData,
            });
            Alert.alert('Thanks for feedback', "We'll work on improving");
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Preparing your journey...</Text>
        <Text style={styles.loadingSubtext}>Creating context-aware playlist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top info panel */}
      <View style={styles.infoContainer}>
        <Text style={styles.destinationText}>To: {destination.name}</Text>
        
        {routeData && (
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              🕐 {Math.round(routeData.duration / 60)} min
            </Text>
            <Text style={styles.routeText}>
              📍 {(routeData.distance / 1000).toFixed(1)} km
            </Text>
          </View>
        )}

        {weatherData && (
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherText}>
              🌡️ {weatherData.temperature}°C - {weatherData.description}
            </Text>
          </View>
        )}

        {trafficData && (
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherText}>
              🚗 Traffic: {trafficData.level}
            </Text>
          </View>
        )}

      </View>

      {/* Interactive map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: currentLocation?.lat || destination.coordinates.lat,
            longitude: currentLocation?.lng || destination.coordinates.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={!demoMode}
          showsMyLocationButton={!demoMode}
          showsCompass={true}
          showsTraffic={true}
          followsUserLocation={!demoMode}
        >
          {/* Current location marker */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
              }}
              title={demoMode ? 'Demo Car' : 'Your Location'}
              description={demoMode ? 'Simulated position' : 'You are here'}
              pinColor={demoMode ? '#FF9500' : 'blue'}
            />
          )}

          {/* Destination marker */}
          <Marker
            coordinate={{
              latitude: destination.coordinates.lat,
              longitude: destination.coordinates.lng,
            }}
            title="Destination"
            description={destination.name}
            pinColor="#1DB954"
          />

          {/* Route line */}
          {routeData?.geometry && (
            <Polyline
              coordinates={routeData.geometry.coordinates.map(coord => ({
                latitude: coord[1],
                longitude: coord[0],
              }))}
              strokeColor="#1DB954"
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>

      {/* Turn-by-turn navigation instructions (below map) */}
      {navigationSteps.length > 0 && currentStepIndex < navigationSteps.length && (
        <NavigationInstructions
          instruction={{
            ...navigationSteps[currentStepIndex],
            distance: distanceToNextStep || navigationSteps[currentStepIndex].distance,
          }}
        />
      )}

      {/* Music player (at bottom, compact) */}
      {playlist.length > 0 && currentTrackIndex < playlist.length && (
        <MusicPlayer
          currentTrack={playlist[currentTrackIndex]}
          isPlaying={isPlaying}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onPlayPause={handlePlayPause}
        />
      )}

      {/* End trip button */}
      <TouchableOpacity style={styles.endButton} onPress={handleEndTrip}>
        <Text style={styles.endButtonText}>End Trip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  infoContainer: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f8f8',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  destinationText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  routeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  weatherInfo: {
    marginTop: 10,
  },
  weatherText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1DB954',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  map: {
    flex: 1,
  },
  endButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});