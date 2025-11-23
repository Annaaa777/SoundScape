// components/NavigationInstructions.js
// Navigation instructions with Fish Audio TTS

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { speakWithFishAudio, stopSpeech } from '../services/fishAudio';

export default function NavigationInstructions({ instruction, isMuted, onToggleMute }) {
  // Speak instruction when it changes
  useEffect(() => {
    if (instruction && instruction.text && !isMuted) {
      speakInstruction(instruction);
    }

    // Cleanup: stop speaking when component unmounts or instruction changes
    return () => {
      stopSpeech();
    };
  }, [instruction?.text, isMuted]);

  if (!instruction) return null;

  const speakInstruction = async (instruction) => {
    // Stop any current speech
    await stopSpeech();

    // Build the speech text
    let speechText = '';
    
    // Add distance if it's more than 50 meters
    if (instruction.distance > 50) {
      const distanceText = formatDistanceForSpeech(instruction.distance);
      speechText = `In ${distanceText}, ${instruction.text}`;
    } else {
      speechText = instruction.text;
    }

    // Speak with Fish Audio
    await speakWithFishAudio(speechText);
  };

  return (
    <View style={styles.container}>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>{getArrowIcon(instruction.type, instruction.modifier)}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.distance}>{formatDistance(instruction.distance)}</Text>
        <Text style={styles.instruction} numberOfLines={2}>
          {instruction.text}
        </Text>
      </View>
      
      {/* Mute/Unmute button */}
      <TouchableOpacity 
        style={styles.muteButton} 
        onPress={onToggleMute}
      >
        <Text style={styles.muteIcon}>{isMuted ? '🔇' : '🔊'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function getArrowIcon(type, modifier) {
  if (type === 'turn' || type === 'new name') {
    if (modifier?.includes('left')) return '⬅️';
    if (modifier?.includes('right')) return '➡️';
    if (modifier?.includes('straight')) return '⬆️';
    if (modifier?.includes('slight left')) return '↖️';
    if (modifier?.includes('slight right')) return '↗️';
    if (modifier?.includes('sharp left')) return '↙️';
    if (modifier?.includes('sharp right')) return '↘️';
  }
  
  if (type === 'depart') return '🚗';
  if (type === 'arrive') return '🏁';
  if (type === 'merge') return '↗️';
  if (type === 'on ramp') return '↗️';
  if (type === 'off ramp') return '↘️';
  if (type === 'fork') {
    if (modifier?.includes('left')) return '↖️';
    if (modifier?.includes('right')) return '↗️';
  }
  if (type === 'roundabout' || type === 'rotary') return '🔄';
  if (type === 'continue') return '⬆️';
  
  return '⬆️';
}

function formatDistance(meters) {
  if (!meters && meters !== 0) return '';
  
  if (meters < 100) {
    return `${Math.round(meters)}m`;
  } else if (meters < 1000) {
    return `${Math.round(meters / 10) * 10}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

function formatDistanceForSpeech(meters) {
  if (meters < 100) {
    return `${Math.round(meters)} meters`;
  } else if (meters < 1000) {
    const rounded = Math.round(meters / 10) * 10;
    return `${rounded} meters`;
  } else {
    const km = (meters / 1000).toFixed(1);
    return `${km} kilometers`;
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#1DB954',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  arrow: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  distance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  instruction: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  muteButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 17.5,
    marginLeft: 8,
  },
  muteIcon: {
    fontSize: 18,
  },
});