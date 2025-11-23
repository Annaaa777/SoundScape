// components/DestinationSearch.js

import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { autocompleteGooglePlaces } from '../services/googlePlaces';
import { geocodeAddress } from '../services/mapbox'; // Fallback

export default function DestinationSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      console.log('📍 User location:', location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleSearch = async (text) => {
    setQuery(text);
    
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Try Google Places first
      const googlePlaces = await autocompleteGooglePlaces(text, userLocation);
      
      if (googlePlaces && googlePlaces.length > 0) {
        setResults(googlePlaces);
      } else {
        // Fallback to Mapbox
        const mapboxPlaces = await geocodeAddress(text, userLocation);
        setResults(mapboxPlaces);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Try Mapbox as fallback
      try {
        const mapboxPlaces = await geocodeAddress(text, userLocation);
        setResults(mapboxPlaces);
      } catch (fallbackError) {
        console.error('Fallback search error:', fallbackError);
      }
    }
    setLoading(false);
  };

  const handleSelectPlace = (place) => {
    setQuery(place.name);
    setResults([]);
    
    // Convert to standard format
    const formattedPlace = {
      name: place.address || place.name,
      coordinates: {
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
      },
    };
    
    onSelect(formattedPlace);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Where to? (e.g., Union South, Starbucks)"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator style={styles.loader} size="small" color="#1DB954" />}
      </View>
      
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, index) => index.toString()}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelectPlace(item)}
            >
              <Text style={styles.resultIcon}>📍</Text>
              <View style={styles.resultTextContainer}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultAddress} numberOfLines={1}>
                  {item.address}
                </Text>
                {item.rating && (
                  <Text style={styles.resultRating}>⭐ {item.rating}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loader: {
    position: 'absolute',
    right: 15,
  },
  resultsList: {
    maxHeight: 300,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  resultRating: {
    fontSize: 12,
    color: '#1DB954',
    marginTop: 2,
  },
});
