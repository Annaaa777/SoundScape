// components/VoiceMoodSelector.js
// Voice-based mood selection with Fish Audio - Completely hands-free and silent!

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { recordAndTranscribe, extractMood } from '../services/speechToText';

export default function VoiceMoodSelector({ onMoodDetected }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceInput = async () => {
    try {
      Alert.alert(
        'Ready to Record',
        'Say something like "I\'m feeling happy" or "I want energetic music"\n\nRecording starts in 1 second...',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Start',
            onPress: async () => {
              try {
                setIsRecording(true);
                
                // Wait 1 second
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Record and transcribe with Fish Audio
                const transcription = await recordAndTranscribe();
                
                setIsRecording(false);
                setIsProcessing(true);

                // Extract mood
                const detectedMood = extractMood(transcription);

                setIsProcessing(false);

                if (detectedMood) {
                  // ✅ COMPLETELY SILENT - Just set it!
                  console.log(`🎵 Mood automatically set to: ${detectedMood}`);
                  console.log(`📝 You said: "${transcription}"`);
                  onMoodDetected(detectedMood);
                  // No alert - user sees mood selector update visually
                } else {
                  // Failed to detect - offer to try again
                  Alert.alert(
                    'Could Not Detect Mood',
                    `You said: "${transcription}"\n\nTry saying: "I'm feeling happy", "I want energetic music", "I'm calm", etc.`,
                    [
                      {
                        text: 'Try Again',
                        onPress: handleVoiceInput,
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                    ]
                  );
                }
              } catch (error) {
                setIsRecording(false);
                setIsProcessing(false);
                console.error('Voice input error:', error);
                Alert.alert('Error', error.message || 'Could not process voice input');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Voice input error:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.voiceButton, (isRecording || isProcessing) && styles.voiceButtonActive]}
        onPress={handleVoiceInput}
        disabled={isRecording || isProcessing}
      >
        {isRecording ? (
          <>
            <Text style={styles.voiceIcon}>🎙️</Text>
            <Text style={styles.voiceText}>Recording... (3s)</Text>
          </>
        ) : isProcessing ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.voiceText}>  Processing...</Text>
          </>
        ) : (
          <>
            <Text style={styles.voiceIcon}>🎤</Text>
            <Text style={styles.voiceText}>Speak Your Mood</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        🐟 Powered by Fish Audio • Try: "I'm feeling happy", "I want energetic music"
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  voiceButton: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  voiceButtonActive: {
    backgroundColor: '#ff4444',
  },
  voiceIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  voiceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    marginHorizontal: 20,
  },
});