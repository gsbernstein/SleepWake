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
  PanResponder,
  StatusBar,
  ScrollView
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  useSharedValue
} from 'react-native-reanimated';
import { useClock } from '../hooks/useClock';
import { useSchedule } from '../context/ScheduleContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse, differenceInMinutes, differenceInHours, addMinutes } from 'date-fns';
import { NativeDurationPicker } from './NativeDurationPicker';

const NIGHT_LIGHT_COLORS = [
  { name: 'Purple', value: '#8A2BE2' },
  { name: 'Blue', value: '#4169E1' },
  { name: 'Red', value: '#DC143C' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Pink', value: '#FF69B4' },
];

const STATUS_COLORS = {
  sleep: '#1a1a1a',
  quietTime: '#ffd700',
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
    nextEventType,
    currentTime
  } = useClock(schedule);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [showTimePicker, setShowTimePicker] = useState<'bedtime' | 'waketime' | null>(null);
  const [showQuietTimeDurationPicker, setShowQuietTimeDurationPicker] = useState(false);
  const [showNapDurationPicker, setShowNapDurationPicker] = useState(false);
  const [napHours, setNapHours] = useState('3');
  const [napMinutes, setNapMinutes] = useState('0');
  const [tempNapHours, setTempNapHours] = useState('3');
  const [tempNapMinutes, setTempNapMinutes] = useState('0');
  const [showSettings, setShowSettings] = useState(false);
  const slideAnim = useState(new RNAnimated.Value(height))[0];

  // Store background color in a shared value for smooth animations
  const backgroundColor = useSharedValue(STATUS_COLORS.off);

  // Calculate estimated nap end time
  const napEndTime = React.useMemo(() => {
    const hours = parseInt(napHours) || 0;
    const minutes = parseInt(napMinutes) || 0;
    const totalMinutes = (hours * 60) + minutes;
    
    if (totalMinutes === 0) return '';
    
    const endTime = addMinutes(new Date(), totalMinutes);
    return format(endTime, 'h:mm a'); // 12-hour format
  }, [napHours, napMinutes, currentTime]);

  // Format time to 12-hour format
  const format12Hour = (time: string) => {
    const date = parse(time, 'HH:mm', new Date());
    return format(date, 'h:mm a');
  };

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
    setTempNapHours(hours.toString());
    setTempNapMinutes(minutes.toString());
  }, []);

  // Update the background color based on status and night light settings
  useEffect(() => {
    const isNightTime = status === 'sleep';
    const shouldUseNightLight = schedule.isNightLight && (isNapActive || isNightTime);
    const targetColor = shouldUseNightLight ? schedule.nightLightColor : STATUS_COLORS[status];
    
    // Smoothly animate to the new color
    backgroundColor.value = targetColor;
  }, [status, isNapActive, schedule.isNightLight, schedule.nightLightColor]);

  // Create animated style with smooth transitions
  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(backgroundColor.value, {
        duration: 1000, // 1 second transition
      }),
    };
  });

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android' && event.type === 'set') {
      setShowTimePicker(null);
      
      if (selectedDate) {
        const timeString = format(selectedDate, 'HH:mm');
        if (showTimePicker === 'bedtime') {
          updateSchedule({ bedtime: timeString });
        } else if (showTimePicker === 'waketime') {
          updateSchedule({ wakeTime: timeString });
        }
      }
    } else if (Platform.OS === 'ios' && selectedDate) {
      const timeString = format(selectedDate, 'HH:mm');
      if (showTimePicker === 'bedtime') {
        updateSchedule({ bedtime: timeString });
      } else if (showTimePicker === 'waketime') {
        updateSchedule({ wakeTime: timeString });
      }
    }
  };

  const handleQuietTimeChange = (duration: { hours: number, minutes: number }) => {
    const totalMinutes = (duration.hours * 60) + duration.minutes;
    updateSchedule({ quietTime: totalMinutes });
  };

  const handleNapDurationChange = (duration: { hours: number, minutes: number }) => {
    setNapHours(duration.hours.toString());
    setNapMinutes(duration.minutes.toString());
    setTempNapHours(duration.hours.toString());
    setTempNapMinutes(duration.minutes.toString());
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
      case 'quietTime':
        eventText = 'quiet time';
        break;
      case 'wake':
        eventText = 'wake up';
        break;
    }
    
    return `${countdownText} until ${eventText}`;
  };

  // Format the main clock time in 12-hour format
  const displayTime12Hour = format(parse(displayTime, 'HH:mm', new Date()), 'h:mm a');

  // Format quiet time as hours and minutes
  const formatQuietTime = () => {
    const hours = Math.floor(schedule.quietTime / 60);
    const minutes = schedule.quietTime % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={styles.background}>
    <View style={styles.safeArea}>
      <StatusBar hidden />
      <Animated.View style={[styles.container, backgroundStyle, { width, height }]}>
        <Text style={[styles.time, isLandscape && styles.timeLandscape]}>{displayTime12Hour}</Text>
        {isNapActive && <Text style={[styles.napActiveText, isLandscape && styles.napActiveTextLandscape]}>NAP MODE</Text>}
        
        {timeUntilNextEvent > 0 && (
          <Text style={styles.countdownText}>{formatCountdown()}</Text>
        )}
        
        {!showSettings && (
          <TouchableOpacity 
            style={[styles.settingsButton, isLandscape && styles.settingsButtonLandscape]}
            onPress={showSettingsPanel}
          >
            <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
          </TouchableOpacity>
        )}
        
        {showSettings && (
          <RNAnimated.View 
            style={[
              styles.settingsContainer,
              isLandscape && styles.settingsContainerLandscape,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.dragHandle} {...panResponder.panHandlers} />
            
            <ScrollView 
              style={styles.settingsScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.settingsScrollContent}
            >
              <TouchableOpacity 
                style={styles.settingButton} 
                onPress={() => setShowTimePicker('bedtime')}
              >
                <Text style={styles.settingText}>
                  Sleep Time: {format12Hour(schedule.bedtime)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingButton} 
                onPress={() => setShowTimePicker('waketime')}
              >
                <Text style={styles.settingText}>
                  Wake Time: {format12Hour(schedule.wakeTime)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingButton} 
                onPress={() => setShowQuietTimeDurationPicker(true)}
              >
                <Text style={styles.settingText}>
                  Quiet Time: {formatQuietTime()}
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
                  {napEndTime ? (
                    <Text style={styles.napEndTimeText}>
                      Ends at: {napEndTime}
                    </Text>
                  ) : null}
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
            </ScrollView>
          </RNAnimated.View>
        )}
      </Animated.View>

      {/* iOS date picker modals and duration pickers */}
      {Platform.OS === 'ios' && (
        <>
          {showTimePicker && (
            <Modal
              animationType="slide"
              transparent={true}
              visible={!!showTimePicker}
              supportedOrientations={['portrait', 'landscape']}
              presentationStyle="overFullScreen"
            >
              <View style={styles.modalContainer}>
                <View style={[
                  styles.modalContent,
                  isLandscape && styles.modalContentLandscape
                ]}>
                  <Text style={styles.modalTitle}>
                    {showTimePicker === 'bedtime' ? 'Set Sleep Time' : 'Set Wake Time'}
                  </Text>
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={parse(
                        showTimePicker === 'bedtime' 
                          ? schedule.bedtime
                          : schedule.wakeTime,
                        'HH:mm',
                        new Date()
                      )}
                      mode="time"
                      is24Hour={false}
                      display="spinner"
                      onChange={handleTimeChange}
                      style={styles.datePicker}
                    />
                  </View>
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

          <NativeDurationPicker
            title="Set Quiet Time"
            visible={showQuietTimeDurationPicker}
            onClose={() => setShowQuietTimeDurationPicker(false)}
            value={{ 
              hours: Math.floor(schedule.quietTime / 60), 
              minutes: schedule.quietTime % 60 
            }}
            onChange={handleQuietTimeChange}
            showHours={false}
            maxMinutes={60}
            minuteStep={1}
          />

          <NativeDurationPicker
            title="Set Nap Duration"
            visible={showNapDurationPicker}
            onClose={() => setShowNapDurationPicker(false)}
            value={{ 
              hours: parseInt(tempNapHours) || 0, 
              minutes: parseInt(tempNapMinutes) || 0 
            }}
            onChange={handleNapDurationChange}
            maxHours={24}
            minuteStep={5}
          />
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
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Use native duration pickers for Android too */}
      {Platform.OS === 'android' && (
        <>
          <NativeDurationPicker
            title="Set Quiet Time"
            visible={showQuietTimeDurationPicker}
            onClose={() => setShowQuietTimeDurationPicker(false)}
            value={{ 
              hours: Math.floor(schedule.quietTime / 60), 
              minutes: schedule.quietTime % 60 
            }}
            onChange={handleQuietTimeChange}
            showHours={false}
            maxMinutes={60}
            minuteStep={1}
          />

          <NativeDurationPicker
            title="Set Nap Duration"
            visible={showNapDurationPicker}
            onClose={() => setShowNapDurationPicker(false)}
            value={{ 
              hours: parseInt(tempNapHours) || 0, 
              minutes: parseInt(tempNapMinutes) || 0 
            }}
            onChange={handleNapDurationChange}
            maxHours={5}
            minuteStep={5}
          />
        </>
      )}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
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
  timeLandscape: {
    fontSize: 72,
    marginBottom: 10,
  },
  napActiveText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  napActiveTextLandscape: {
    fontSize: 20,
    marginBottom: 5,
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
  settingsButtonLandscape: {
    bottom: 20,
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
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  settingsContainerLandscape: {
    left: Platform.OS === 'ios' ? '20%' : '10%',
    right: Platform.OS === 'ios' ? '20%' : '10%',
    maxHeight: '80%',
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
    maxHeight: '80%',
  },
  modalContentLandscape: {
    width: '60%',
    maxHeight: '90%',
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
  napEndTimeText: {
    color: '#f0f0f0',
    fontSize: 14,
    marginTop: 5,
  },
  settingsScrollView: {
    flexGrow: 0,
  },
  settingsScrollContent: {
    gap: 15,
  },
  datePickerContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
}); 