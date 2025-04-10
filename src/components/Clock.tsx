import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useWindowDimensions, 
  TouchableOpacity, 
  Switch, 
  Platform, 
  Modal, 
  Animated as RNAnimated,
  SafeAreaView,
  PanResponder,
  StatusBar
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useClock } from '../hooks/useClock';
import { useSchedule } from '../context/ScheduleContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse, differenceInMinutes, differenceInHours } from 'date-fns';

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
  const { 
    displayTime, 
    status, 
    isNapActive, 
    startNap, 
    cancelNap, 
    timeUntilNextEvent,
    nextEventType
  } = useClock(schedule);
  const { width, height } = useWindowDimensions();
  const [showTimePicker, setShowTimePicker] = useState<'bedtime' | 'waketime' | null>(null);
  const [showWarningPicker, setShowWarningPicker] = useState(false);
  const [showNapDurationPicker, setShowNapDurationPicker] = useState(false);
  const [napHours, setNapHours] = useState('0');
  const [napMinutes, setNapMinutes] = useState('0');
  const [showSettings, setShowSettings] = useState(false);
  const slideAnim = useState(new RNAnimated.Value(height))[0];

  // Set up pan responder for swipe to dismiss settings
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 50) {
        hideSettings();
      } else {
        RNAnimated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true
        }).start();
      }
    }
  });

  // Update napDuration when hours or minutes change
  useEffect(() => {
    const hours = parseInt(napHours) || 0;
    const minutes = parseInt(napMinutes) || 0;
    const totalMinutes = (hours * 60) + minutes;
    updateSchedule({ napDuration: totalMinutes });
  }, [napHours, napMinutes]);

  // Initialize napHours and napMinutes from schedule
  useEffect(() => {
    const hours = Math.floor(schedule.napDuration / 60);
    const minutes = schedule.napDuration % 60;
    setNapHours(hours.toString());
    setNapMinutes(minutes.toString());
  }, []);

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

  const handleNapDurationChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowNapDurationPicker(false);
    }
    
    if (selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      setNapHours(hours.toString());
      setNapMinutes(minutes.toString());
    }
    
    if (Platform.OS === 'ios') {
      setShowNapDurationPicker(false);
    }
  };

  const toggleNightLight = () => {
    updateSchedule({ 
      isNightLight: !schedule.isNightLight,
      nightLightColor: schedule.nightLightColor || '#8A2BE2'
    });
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
      hideSettings();
    }
  };

  const showSettingsPanel = () => {
    setShowSettings(true);
    RNAnimated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true
    }).start();
  };

  const hideSettings = () => {
    RNAnimated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true
    }).start(() => setShowSettings(false));
  };

  // Format the countdown
  const formatCountdown = () => {
    if (!timeUntilNextEvent) return '';
    
    const hours = Math.floor(timeUntilNextEvent / 60);
    const minutes = timeUntilNextEvent % 60;
    
    let countdownText = '';
    if (hours > 0) {
      countdownText += `${hours}h `;
    }
    countdownText += `${minutes}m`;
    
    let eventText = '';
    switch (nextEventType) {
      case 'sleep':
        eventText = 'bedtime';
        break;
      case 'warning':
        eventText = 'warning window';
        break;
      case 'wake':
        eventText = 'wake up';
        break;
    }
    
    return `${countdownText} until ${eventText}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden />
      <Animated.View style={[styles.container, backgroundStyle, { width, height }]}>
        <Text style={styles.time}>{displayTime}</Text>
        {isNapActive && <Text style={styles.napActiveText}>NAP MODE</Text>}
        
        {timeUntilNextEvent > 0 && (
          <Text style={styles.countdownText}>{formatCountdown()}</Text>
        )}
        
        {!showSettings && (
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={showSettingsPanel}
          >
            <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
          </TouchableOpacity>
        )}
        
        {showSettings && (
          <RNAnimated.View 
            style={[
              styles.settingsContainer,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.dragHandle} />
            
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
              <TouchableOpacity 
                style={styles.settingButton}
                onPress={() => setShowNapDurationPicker(true)}
              >
                <Text style={styles.settingText}>
                  Nap Duration: {napHours}h {napMinutes}m
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.napButton, isNapActive && styles.cancelNapButton]} 
                onPress={handleNapPress}
              >
                <Text style={styles.napButtonText}>
                  {isNapActive ? 'Cancel Nap' : 'Start Nap'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={hideSettings}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </RNAnimated.View>
        )}
      </Animated.View>

      {/* iOS date picker modals */}
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

          {showNapDurationPicker && (
            <Modal
              animationType="slide"
              transparent={true}
              visible={showNapDurationPicker}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Set Nap Duration</Text>
                  <DateTimePicker
                    value={new Date(0, 0, 0, parseInt(napHours) || 0, parseInt(napMinutes) || 0)}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleNapDurationChange}
                  />
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowNapDurationPicker(false)}
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

      {Platform.OS === 'android' && showNapDurationPicker && (
        <DateTimePicker
          value={new Date(0, 0, 0, parseInt(napHours) || 0, parseInt(napMinutes) || 0)}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleNapDurationChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
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
    marginBottom: 10,
  },
  countdownText: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 10,
  },
  settingsButton: {
    position: 'absolute',
    bottom: 40,
    padding: 15,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  settingsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'stretch',
    gap: 15,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 15,
  },
  settingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 15,
    borderRadius: 10,
  },
  nightLightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  napSettings: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
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
  napButton: {
    backgroundColor: '#4169E1',
    padding: 15,
    alignItems: 'center',
    marginTop: 1,
  },
  cancelNapButton: {
    backgroundColor: '#DC143C',
  },
  napButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
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