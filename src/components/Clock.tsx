import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useClock } from '../hooks/useClock';
import { useSchedule } from '../context/ScheduleContext';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';

const getBackgroundColor = (status: 'sleep' | 'warning' | 'wake' | 'off') => {
  switch (status) {
    case 'sleep':
      return '#1a1a1a';
    case 'warning':
      return '#ffd700';
    case 'wake':
      return '#00ff00';
    case 'off':
    default:
      return '#000000';
  }
};

export const Clock: React.FC = () => {
  const { activeSchedule } = useSchedule();
  const { formattedTime, status } = useClock(activeSchedule);
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(status),
          width,
          height,
        },
      ]}
    >
      <Text style={styles.time}>{formattedTime}</Text>
      {activeSchedule && (
        <Text style={styles.scheduleName}>{activeSchedule.name}</Text>
      )}
      
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Schedules')}
      >
        <Text style={styles.settingsButtonText}>Manage Schedules</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  time: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scheduleName: {
    fontSize: 24,
    color: '#ffffff',
    marginTop: 20,
  },
  settingsButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
}); 