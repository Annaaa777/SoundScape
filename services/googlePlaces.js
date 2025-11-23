// services/googlePlaces.js

import axios from 'axios';
import { GOOGLE_PLACES_KEY } from '../utils/constants';

// Search for places using Google Places API
export const searchGooglePlaces = async (query, userLocation = null) => {
  try {
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    
    const params = {
      query: query,
      key: GOOGLE_PLACES_KEY,
    };

    // Add location bias if available
    if (userLocation) {
      params.location = `${userLocation.lat},${userLocation.lng}`;
      params.radius = 50000; // 50km radius
    }

    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', response.data.status);
      return [];
    }

    return response.data.results.map((place) => ({
      name: place.name,
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      type: place.types?.[0],
      rating: place.rating,
      placeId: place.place_id,
    }));
  } catch (error) {
    console.error('Error searching Google Places:', error);
    throw error;
  }
};

// Autocomplete search (better for real-time search)
export const autocompleteGooglePlaces = async (input, userLocation = null) => {
  try {
    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    
    const params = {
      input: input,
      key: GOOGLE_PLACES_KEY,
    };

    if (userLocation) {
      params.location = `${userLocation.lat},${userLocation.lng}`;
      params.radius = 50000;
    }

    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      return [];
    }

    // Get place details for each result
    const detailsPromises = response.data.predictions.slice(0, 5).map(prediction =>
      getPlaceDetails(prediction.place_id)
    );

    const details = await Promise.all(detailsPromises);
    
    return details.filter(d => d !== null);
  } catch (error) {
    console.error('Error with autocomplete:', error);
    throw error;
  }
};

// Get detailed info about a specific place
export const getPlaceDetails = async (placeId) => {
  try {
    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    
    const response = await axios.get(url, {
      params: {
        place_id: placeId,
        key: GOOGLE_PLACES_KEY,
        fields: 'name,formatted_address,geometry,rating,types',
      },
    });

    if (response.data.status !== 'OK') {
      return null;
    }

    const place = response.data.result;
    
    return {
      name: place.name,
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      type: place.types?.[0],
      rating: place.rating,
      placeId: placeId,
    };
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
};