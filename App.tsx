import React from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ScheduleProvider } from './src/context/ScheduleContext';
import { Clock } from './src/components/Clock';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ScheduleProvider>
        <StatusBar hidden />
        <Clock />

      </ScheduleProvider>
    </SafeAreaProvider>
  );
} 