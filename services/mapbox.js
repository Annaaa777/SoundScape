// services/mapbox.js
// Handles all Mapbox API interactions: routing, geocoding, traffic analysis

import { MAPBOX_TOKEN } from '../utils/constants';

/**
 * Get route between origin and destination with turn-by-turn steps
 * @param {object} origin - { lat, lng }
 * @param {object} destination - { lat, lng }
 * @returns {object} Route data with geometry, distance, duration, congestion, and steps
 */
export const getRoute = async (origin, destination) => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=false&geometries=geojson&language=en&overview=full&steps=true&access_token=${MAPBOX_TOKEN}&annotations=congestion`;

    console.log('📍 Fetching route from Mapbox...');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    
    // Extract turn-by-turn steps
    const steps = [];
    route.legs.forEach((leg) => {
      leg.steps.forEach((step) => {
        steps.push({
          distance: step.distance, // meters to this step
          duration: step.duration, // seconds
          text: step.maneuver.instruction, // "Turn left onto Main St"
          type: step.maneuver.type, // "turn", "depart", "arrive"
          modifier: step.maneuver.modifier, // "left", "right", "straight"
          location: step.maneuver.location, // [lng, lat] of maneuver point
        });
      });
    });

    console.log(`✅ Route found: ${(route.distance / 1000).toFixed(1)}km, ${Math.round(route.duration / 60)}min`);
    console.log(`📍 ${steps.length} navigation steps extracted`);

    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: route.geometry, // GeoJSON LineString
      congestion: route.legs[0]?.annotation?.congestion || [],
      steps, // turn-by-turn navigation steps
    };
  } catch (error) {
    console.error('Error fetching route:', error);
    throw error;
  }
};

/**
 * Geocode a place name to coordinates
 * @param {string} query - Place name to search for
 * @returns {Array} Array of place results with coordinates
 */
export const geocodePlace = async (query) => {
  try {
    if (!query || query.trim().length < 3) {
      return [];
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=place,address,poi`;

    console.log('🔍 Geocoding:', query);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    const places = data.features.map((feature) => ({
      id: feature.id,
      name: feature.place_name,
      coordinates: {
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
      },
      type: feature.place_type[0],
    }));

    console.log(`✅ Found ${places.length} places`);
    return places;
  } catch (error) {
    console.error('Error geocoding place:', error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to place name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Place name
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox Reverse Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }

    return 'Unknown location';
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return 'Unknown location';
  }
};

/**
 * Analyze traffic congestion from route annotation
 * @param {Array} congestionData - Array of congestion levels from Mapbox
 * @returns {object} Traffic analysis with level and percentage
 */
export const analyzeTraffic = (congestionData) => {
  if (!congestionData || congestionData.length === 0) {
    return {
      level: 'unknown',
      heavy: 0,
      moderate: 0,
      low: 0,
      description: 'Traffic data unavailable',
    };
  }

  let heavy = 0;
  let moderate = 0;
  let low = 0;
  let severe = 0;

  congestionData.forEach((level) => {
    if (level === 'severe') severe++;
    else if (level === 'heavy') heavy++;
    else if (level === 'moderate') moderate++;
    else low++;
  });

  const total = congestionData.length;
  const heavyPercent = ((heavy + severe) / total) * 100;
  const moderatePercent = (moderate / total) * 100;

  let level;
  let description;

  if (severe > total * 0.3) {
    level = 'severe';
    description = 'Severe traffic congestion';
  } else if (heavyPercent > 40) {
    level = 'heavy';
    description = 'Heavy traffic expected';
  } else if (moderatePercent > 30 || heavyPercent > 20) {
    level = 'moderate';
    description = 'Moderate traffic';
  } else if (low > total * 0.7) {
    level = 'light';
    description = 'Light traffic';
  } else {
    level = 'smooth';
    description = 'Traffic is smooth';
  }

  console.log(
    `🚗 Traffic analysis: ${level} (${heavyPercent.toFixed(0)}% heavy, ${moderatePercent.toFixed(0)}% moderate)`
  );

  return {
    level,
    heavy: heavyPercent,
    moderate: moderatePercent,
    low: ((low / total) * 100),
    description,
  };
};

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
  if (meters < 100) {
    return `${Math.round(meters)}m`;
  } else if (meters < 1000) {
    return `${Math.round(meters / 10) * 10}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

/**
 * Format duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  const minutes = Math.round(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }
};

/**
 * Get estimated time of arrival
 * @param {number} durationSeconds - Route duration in seconds
 * @returns {string} Formatted ETA (e.g., "3:45 PM")
 */
export const getETA = (durationSeconds) => {
  const now = new Date();
  const eta = new Date(now.getTime() + durationSeconds * 1000);
  
  return eta.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};