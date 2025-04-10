import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Dimensions } from 'react-native';
import { useClock } from '../hooks/useClock';
import { useSchedule } from '../context/ScheduleContext';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';

const isTablet = Dimensions.get('window').width >= 768;

const getBackgroundColor = (status: 'sleep' | 'warning' | 'wake' | 'off', isNightLight: boolean, nightLightColor?: string) => {
  if (isNightLight && nightLightColor) {
    return nightLightColor;
  }
  
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
          backgroundColor: getBackgroundColor(status, activeSchedule?.isNightLight || false, activeSchedule?.nightLightColor),
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
        style={[
          styles.settingsButton,
          isTablet && styles.settingsButtonTablet
        ]}
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
  settingsButtonTablet: {
    top: 20,
    bottom: 'auto',
    right: 20,
    left: 'auto',
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
}); 