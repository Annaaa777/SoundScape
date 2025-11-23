// services/fishAudio.js
// Fish Audio TTS integration

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { FISH_AUDIO_API_KEY } from '../utils/constants';

let soundObject = null;

/**
 * Speak text using Fish Audio TTS
 */
export const speakWithFishAudio = async (text, options = {}) => {
  try {
    console.log('🐟 Fish Audio TTS:', text);

    // Stop any current playback
    await stopSpeech();

    // Check if API key exists
    if (!FISH_AUDIO_API_KEY) {
      console.log('⚠️ Fish Audio API key not configured, using fallback');
      return speakWithExpoSpeech(text);
    }

    console.log('📡 Calling Fish Audio API...');
    console.log('🔑 Using key:', FISH_AUDIO_API_KEY.substring(0, 8) + '...');

    // Fish Audio API call - WITHOUT reference_id (use default voice)
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        // ⭐ REMOVED reference_id - let Fish Audio use default voice
        format: 'mp3',
        mp3_bitrate: 128,
        latency: 'normal',
      }),
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Fish Audio API error ${response.status}:`, errorText);
      
      // Fallback to Expo Speech
      return speakWithExpoSpeech(text);
    }

    // Get audio data as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    console.log('📦 Audio received:', audioBuffer.byteLength, 'bytes');
    
    if (audioBuffer.byteLength === 0) {
      console.warn('⚠️ Empty audio response, using fallback');
      return speakWithExpoSpeech(text);
    }

    // Convert to base64
    const base64Audio = `data:audio/mpeg;base64,${arrayBufferToBase64(audioBuffer)}`;

    // Play audio with Expo AV
    soundObject = new Audio.Sound();
    
    await soundObject.loadAsync(
      { uri: base64Audio },
      { shouldPlay: true }
    );

    console.log('✅ Fish Audio playing!');

    // Log when playback finishes
    soundObject.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        console.log('🎵 Fish Audio finished');
      }
    });

  } catch (error) {
    console.error('❌ Fish Audio error:', error.message);
    console.error('Stack:', error.stack);
    // Fallback to Expo Speech
    speakWithExpoSpeech(text);
  }
};

/**
 * Fallback: Expo Speech (always works)
 */
const speakWithExpoSpeech = (text) => {
  console.log('🔊 Using Expo Speech fallback:', text);
  Speech.stop();
  Speech.speak(text, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.9,
  });
};

/**
 * Stop all speech (Fish Audio + Expo)
 */
export const stopSpeech = async () => {
  try {
    // Stop Fish Audio
    if (soundObject) {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null;
    }
    
    // Stop Expo Speech
    Speech.stop();
  } catch (error) {
    // Ignore cleanup errors
  }
};

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}