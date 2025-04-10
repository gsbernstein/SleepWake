import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ScheduleProvider } from './src/context/ScheduleContext';
import { Clock } from './src/components/Clock';

export default function App() {
  return (
    <SafeAreaProvider>
      <ScheduleProvider>
        <StatusBar hidden />
        <SafeAreaView style={{ flex: 1 }}>
          <Clock />
        </SafeAreaView>
      </ScheduleProvider>
    </SafeAreaProvider>
  );
} 