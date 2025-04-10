import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Switch, Platform, TextInput, Modal } from 'react-native';
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
  const { displayTime, status, isNapActive, startNap, cancelNap } = useClock(schedule);
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
    if (Platform.OS === 'android') {
      setShowTimePicker(null);
      setShowWarningPicker(false);
    }
    
    if (selectedDate) {
      const timeString = format(selectedDate, 'HH:mm');
      if (showTimePicker === 'bedtime') {
        updateSchedule({ bedtime: timeString });
      } else if (showTimePicker === 'waketime') {
        updateSchedule({ wakeTime: timeString });
      }
    }
    
    if (Platform.OS === 'ios') {
      setShowTimePicker(null);
    }
  };

  const handleWarningTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowWarningPicker(false);
    }
    
    if (selectedDate) {
      const minutes = selectedDate.getMinutes();
      updateSchedule({ warningTime: minutes });
    }
    
    if (Platform.OS === 'ios') {
      setShowWarningPicker(false);
    }
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
      <Text style={styles.time}>{displayTime}</Text>
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
          <View style={styles.nightLightControls}>
            <TouchableOpacity 
              style={[styles.colorPreview, { backgroundColor: schedule.nightLightColor }]}
              onPress={cycleNightLightColor}
            />
            <Switch
              value={schedule.isNightLight}
              onValueChange={toggleNightLight}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={schedule.isNightLight ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
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
              placeholderTextColor="#ccc"
            />
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
      </View>

      {/* iOS date picker modal */}
      {Platform.OS === 'ios' && (
        <>
          {showTimePicker && (
            <Modal
              animationType="slide"
              transparent={true}
              visible={!!showTimePicker}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {showTimePicker === 'bedtime' ? 'Set Sleep Time' : 'Set Wake Time'}
                  </Text>
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
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowTimePicker(null)}
                  >
                    <Text style={styles.modalButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {showWarningPicker && (
            <Modal
              animationType="slide"
              transparent={true}
              visible={showWarningPicker}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Set Warning Time</Text>
                  <DateTimePicker
                    value={new Date(0, 0, 0, 0, schedule.warningTime)}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleWarningTimeChange}
                  />
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowWarningPicker(false)}
                  >
                    <Text style={styles.modalButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </>
      )}

      {/* Android date pickers */}
      {Platform.OS === 'android' && showTimePicker && (
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
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {Platform.OS === 'android' && showWarningPicker && (
        <DateTimePicker
          value={new Date(0, 0, 0, 0, schedule.warningTime)}
          mode="time"
          is24Hour={true}
          display="default"
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
    fontSize: 96,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 20,
    gap: 15,
  },
  settingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
  },
  nightLightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  napSettings: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#4169E1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 