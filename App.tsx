import React, { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SettingsProvider } from './src/context/SettingsContext';
import { Clock } from './src/components/Clock';
import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function App() {
  // Allow all orientations for iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      ScreenOrientation.unlockAsync();
    }
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SettingsProvider>
        <StatusBar hidden />
        <Clock />
      </SettingsProvider>
    </SafeAreaProvider>
  );
} 