// components/MusicPlayer.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MusicPlayer({
  currentTrack,
  isPlaying,
  onNext,
  onPrevious,
  onPlayPause,
}) {
  if (!currentTrack) return null;

  return (
    <View style={styles.container}>
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {currentTrack.name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onPrevious} style={styles.controlButton}>
          <Text style={styles.controlIcon}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext} style={styles.controlButton}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1DB954',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  trackInfo: {
    marginBottom: 8,
  },
  trackName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  artistName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    marginHorizontal: 15,
  },
  controlIcon: {
    fontSize: 24,
    color: '#fff',
  },
  playButton: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: '#fff',
  },
});