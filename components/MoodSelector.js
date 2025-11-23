// components/MoodSelector.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MOOD_OPTIONS } from '../utils/constants';

export default function MoodSelector({ selectedMood, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
      <View style={styles.moodGrid}>
        {MOOD_OPTIONS.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            style={[
              styles.moodButton,
              selectedMood === mood.value && styles.moodButtonSelected,
            ]}
            onPress={() => onSelect(mood.value)}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={styles.moodLabel}>{mood.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: '30%',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  moodButtonSelected: {
    backgroundColor: '#1DB954',
  },
  emoji: {
    fontSize: 30,
    marginBottom: 5,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});