
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export function LoadingSpinner({ fullscreen = false, message = 'Loading...' }) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size="large" color="#6C63FF" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  message: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
  },
});