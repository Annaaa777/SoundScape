// services/weather.js

import axios from 'axios';
import { OPENWEATHER_KEY } from '../utils/constants';

export const getWeather = async (lat, lng) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather`;
    
    const response = await axios.get(url, {
      params: {
        lat: lat,
        lon: lng,
        appid: OPENWEATHER_KEY,
        units: 'metric', // Celsius
      }
    });

    const data = response.data;
    
    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main, // "Clear", "Rain", "Clouds", etc.
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

// Convert weather condition to mood category
export const weatherToMood = (condition) => {
  const weatherMoodMap = {
    'Clear': 'upbeat',
    'Clouds': 'calm',
    'Rain': 'melancholic',
    'Drizzle': 'cozy',
    'Thunderstorm': 'intense',
    'Snow': 'peaceful',
    'Mist': 'dreamy',
    'Fog': 'dreamy',
  };

  return weatherMoodMap[condition] || 'neutral';
};