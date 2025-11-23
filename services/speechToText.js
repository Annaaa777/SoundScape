// services/speechToText.js
// Speech-to-text using Fish Audio ASR (Automatic Speech Recognition)

import { Audio } from 'expo-av';
import { FISH_AUDIO_API_KEY } from '../utils/constants';

/**
 * Record audio and transcribe using Fish Audio ASR
 * @returns {string} Transcribed text
 */
export const recordAndTranscribe = async () => {
  let recording = null;

  try {
    console.log('🎤 Requesting microphone permission...');
    
    // Request permission
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Microphone permission denied');
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    console.log('🎙️ Starting recording...');

    // Start recording
    recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();

    // Record for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🛑 Stopping recording...');
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    console.log('📁 Recording saved at:', uri);

    // Transcribe with Fish Audio ASR
    const transcription = await transcribeWithFishAudio(uri);
    
    return transcription;

  } catch (error) {
    console.error('❌ Recording error:', error);
    throw error;
  }
};

/**
 * Transcribe audio file using Fish Audio ASR
 */
const transcribeWithFishAudio = async (audioUri) => {
  try {
    console.log('🐟 Transcribing with Fish Audio ASR...');

    if (!FISH_AUDIO_API_KEY) {
      throw new Error('Fish Audio API key not configured');
    }

    // Create form data for Fish Audio
    const formData = new FormData();
    
    // Append audio file
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });

    // Optional: language code
    formData.append('language', 'en');

    console.log('📡 Sending to Fish Audio ASR...');

    // Call Fish Audio ASR API
    const response = await fetch('https://api.fish.audio/v1/asr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        // Don't set Content-Type - FormData sets it automatically
      },
      body: formData,
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fish Audio ASR error:', errorText);
      throw new Error(`Fish Audio ASR failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Transcription result:', result);

    // Fish Audio ASR returns { text: "transcribed text" }
    const transcription = result.text || result.transcript || '';

    if (!transcription) {
      throw new Error('No transcription returned');
    }

    console.log('✅ Transcription:', transcription);
    return transcription;

  } catch (error) {
    console.error('❌ Fish Audio ASR error:', error);
    throw error;
  }
};

/**
 * Extract mood from transcribed text
 * @param {string} text - Transcribed speech
 * @returns {string|null} Detected mood
 */
export const extractMood = (text) => {
  const lowerText = text.toLowerCase();

  // Mood keywords mapping
  const moodKeywords = {
    energetic: ['energetic', 'energy', 'hype', 'pumped', 'excited', 'hyped', 'pump'],
    chill: ['chill', 'calm', 'relax', 'relaxed', 'peaceful', 'mellow', 'easy'],
    happy: ['happy', 'good', 'great', 'joyful', 'cheerful', 'positive', 'joy'],
    focus: ['focus', 'focused', 'concentrate', 'work', 'productive', 'concentration'],
    sad: ['sad', 'down', 'blue', 'melancholy', 'depressed', 'low', 'unhappy'],
  };

  // Check each mood's keywords
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        console.log(`✅ Detected mood: ${mood} (matched: ${keyword})`);
        return mood;
      }
    }
  }

  console.log('⚠️ No mood detected in:', text);
  return null;
};