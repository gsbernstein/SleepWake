import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Switch, Platform, TextInput } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useClock } from '../hooks/useClock';
import { useSchedule } from '../context/ScheduleContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';

const NIGHT_LIGHT_COLORS = [
  { name: 'Purple', value: '#8A2BE2' },
  { name: 'Blue', value: '#4169E1' },
  { name: 'Green', value: '#32CD32' },
  { name: 'Red', value: '#DC143C' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Pink', value: '#FF69B4' },
];

const STATUS_COLORS = {
  sleep: '#1a1a1a',
  warning: '#ffd700',
  wake: '#00ff00',
  off: '#000000',
};

export const Clock: React.FC = () => {
  const { schedule, updateSchedule } = useSchedule();
  const { formattedTime, status, isNapActive, startNap, cancelNap } = useClock(schedule);
  const { width, height } = useWindowDimensions();
  const [showTimePicker, setShowTimePicker] = useState<'bedtime' | 'waketime' | null>(null);
  const [showWarningPicker, setShowWarningPicker] = useState(false);
  const [napDuration, setNapDuration] = useState(schedule.napDuration.toString());
  
  const backgroundStyle = useAnimatedStyle(() => {
    const targetColor = schedule.isNightLight && schedule.nightLightColor
      ? schedule.nightLightColor
      : STATUS_COLORS[status];

    return {
      backgroundColor: targetColor,
    };
  });

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const timeString = format(selectedDate, 'HH:mm');
      if (showTimePicker === 'bedtime') {
        updateSchedule({ bedtime: timeString });
      } else if (showTimePicker === 'waketime') {
        updateSchedule({ wakeTime: timeString });
      }
    }
    setShowTimePicker(null);
  };

  const handleWarningTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const minutes = selectedDate.getMinutes();
      updateSchedule({ warningTime: minutes });
    }
    setShowWarningPicker(false);
  };

  const toggleNightLight = () => {
    updateSchedule({ 
      isNightLight: !schedule.isNightLight,
      nightLightColor: schedule.nightLightColor || '#8A2BE2'
    });
  };

  const updateNapDuration = (value: string) => {
    setNapDuration(value);
    const duration = parseInt(value) || 0;
    updateSchedule({ napDuration: duration });
  };

  const cycleNightLightColor = () => {
    if (schedule.isNightLight) {
      const currentIndex = NIGHT_LIGHT_COLORS.findIndex(c => c.value === schedule.nightLightColor);
      const nextIndex = (currentIndex + 1) % NIGHT_LIGHT_COLORS.length;
      updateSchedule({ nightLightColor: NIGHT_LIGHT_COLORS[nextIndex].value });
    }
  };

  const handleNapPress = () => {
    if (isNapActive) {
      cancelNap();
    } else {
      startNap();
    }
  };

  return (
    <Animated.View style={[styles.container, backgroundStyle, { width, height }]}>
      <Text style={styles.time}>{formattedTime}</Text>
      {isNapActive && <Text style={styles.napActiveText}>NAP MODE</Text>}
      
      <View style={styles.settingsContainer}>
        <TouchableOpacity 
          style={styles.settingButton} 
          onPress={() => setShowTimePicker('bedtime')}
        >
          <Text style={styles.settingText}>
            Sleep Time: {schedule.bedtime}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingButton} 
          onPress={() => setShowTimePicker('waketime')}
        >
          <Text style={styles.settingText}>
            Wake Time: {schedule.wakeTime}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingButton} 
          onPress={() => setShowWarningPicker(true)}
        >
          <Text style={styles.settingText}>
            Warning: {schedule.warningTime} min
          </Text>
        </TouchableOpacity>

        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Night Light</Text>
          <Switch
            value={schedule.isNightLight}
            onValueChange={toggleNightLight}
          />
          {schedule.isNightLight && (
            <TouchableOpacity 
              style={[styles.colorPreview, { backgroundColor: schedule.nightLightColor }]}
              onPress={cycleNightLightColor}
            />
          )}
        </View>

        <View style={styles.napSettings}>
          <View style={styles.napDurationRow}>
            <Text style={styles.settingText}>Nap Duration (min)</Text>
            <TextInput
              style={styles.napInput}
              keyboardType="numeric"
              value={napDuration}
              onChangeText={updateNapDuration}
              maxLength={3}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.napButton, isNapActive && styles.cancelNapButton]} 
            onPress={handleNapPress}
          >
            <Text style={styles.napButtonText}>
              {isNapActive ? 'Cancel Nap' : 'Start Nap'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showTimePicker && Platform.OS === 'ios' && (
        <DateTimePicker
          value={parse(
            showTimePicker === 'bedtime' 
              ? schedule.bedtime
              : schedule.wakeTime,
            'HH:mm',
            new Date()
          )}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleTimeChange}
        />
      )}

      {showWarningPicker && Platform.OS === 'ios' && (
        <DateTimePicker
          value={new Date(0, 0, 0, 0, schedule.warningTime)}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleWarningTimeChange}
        />
      )}
    </Animated.View>
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
    marginBottom: 20,
  },
  napActiveText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
  },
  settingsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 20,
    gap: 15,
  },
  settingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 10,
  },
  napSettings: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  napDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  settingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  napInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: '#ffffff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 18,
    minWidth: 60,
    textAlign: 'center',
  },
  napButton: {
    backgroundColor: '#4169E1',
    padding: 15,
    alignItems: 'center',
  },
  cancelNapButton: {
    backgroundColor: '#DC143C',
  },
  napButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 