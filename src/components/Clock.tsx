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
import { format, parse, differenceInMinutes, differenceInHours, addMinutes } from 'date-fns';
import { DurationPicker } from './DurationPicker';

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
    nextEventType,
    currentTime
  } = useClock(schedule);
  const { width, height } = useWindowDimensions();
  const [showTimePicker, setShowTimePicker] = useState<'bedtime' | 'waketime' | null>(null);
  const [showWarningDurationPicker, setShowWarningDurationPicker] = useState(false);
  const [showNapDurationPicker, setShowNapDurationPicker] = useState(false);
  const [napHours, setNapHours] = useState('0');
  const [napMinutes, setNapMinutes] = useState('0');
  const [tempNapHours, setTempNapHours] = useState('0');
  const [tempNapMinutes, setTempNapMinutes] = useState('0');
  const [showSettings, setShowSettings] = useState(false);
  const slideAnim = useState(new RNAnimated.Value(height))[0];

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

  const backgroundStyle = useAnimatedStyle(() => {
    const shouldUseNightLight = schedule.isNightLight && 
      (isNapActive || status === 'sleep');
      
    const targetColor = shouldUseNightLight && schedule.nightLightColor
      ? schedule.nightLightColor
      : STATUS_COLORS[status];

    return {
      backgroundColor: targetColor,
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

  const handleWarningTimeChange = (duration: { hours: number, minutes: number }) => {
    const totalMinutes = (duration.hours * 60) + duration.minutes;
    updateSchedule({ warningTime: totalMinutes });
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
      case 'warning':
        eventText = 'warning window';
        break;
      case 'wake':
        eventText = 'wake up';
        break;
    }
    
    return `${countdownText} until ${eventText}`;
  };

  // Format the main clock time in 12-hour format
  const displayTime12Hour = format(parse(displayTime, 'HH:mm', new Date()), 'h:mm a');

  // Format warning time as hours and minutes
  const formatWarningTime = () => {
    const hours = Math.floor(schedule.warningTime / 60);
    const minutes = schedule.warningTime % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden />
      <Animated.View style={[styles.container, backgroundStyle, { width, height }]}>
        <Text style={styles.time}>{displayTime12Hour}</Text>
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
              onPress={() => setShowWarningDurationPicker(true)}
            >
              <Text style={styles.settingText}>
                Warning: {formatWarningTime()}
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
                    is24Hour={false}
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

          {/* Custom Duration Pickers */}
          <DurationPicker
            title="Set Warning Time"
            visible={showWarningDurationPicker}
            onClose={() => setShowWarningDurationPicker(false)}
            value={{ 
              hours: Math.floor(schedule.warningTime / 60), 
              minutes: schedule.warningTime % 60 
            }}
            onChange={handleWarningTimeChange}
            showHours={false}
            maxMinutes={60}
            minuteStep={1}
          />

          <DurationPicker
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

      {/* Use custom duration pickers for Android too */}
      {Platform.OS === 'android' && (
        <>
          <DurationPicker
            title="Set Warning Time"
            visible={showWarningDurationPicker}
            onClose={() => setShowWarningDurationPicker(false)}
            value={{ 
              hours: Math.floor(schedule.warningTime / 60), 
              minutes: schedule.warningTime % 60 
            }}
            onChange={handleWarningTimeChange}
            showHours={false}
            maxMinutes={60}
            minuteStep={1}
          />

          <DurationPicker
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
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
    paddingBottom: Platform.OS === 'ios' ? 50 : 30, // Extra padding at bottom to avoid home indicator
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
  napEndTimeText: {
    color: '#f0f0f0',
    fontSize: 14,
    marginTop: 5,
  },
}); 