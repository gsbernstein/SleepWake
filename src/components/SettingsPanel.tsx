import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Platform, 
  Animated,
  PanResponder,
  ScrollView,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { format, parse, addMinutes } from 'date-fns';
import { Picker } from '@react-native-picker/picker';
import { useSchedule } from '../context/ScheduleContext';

const NIGHT_LIGHT_COLORS = [
  { name: 'Purple', value: '#8A2BE2' },
  { name: 'Blue', value: '#4169E1' },
  { name: 'Red', value: '#DC143C' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Pink', value: '#FF69B4' },
];

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  isLandscape: boolean;
  height: number;
  isNapActive: boolean;
  startNap: () => void;
  cancelNap: () => void;
  currentTime: Date;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isVisible,
  onClose,
  isLandscape,
  height,
  isNapActive,
  startNap,
  cancelNap,
  currentTime
}) => {
  const { 
    schedule, 
    updateSchedule, 
    isNightLight, 
    nightLightColor, 
    setIsNightLight, 
    setNightLightColor 
  } = useSchedule();
  
  const [napHours, setNapHours] = useState('3');
  const [napMinutes, setNapMinutes] = useState('0');
  const slideAnim = useState(new Animated.Value(height))[0];
  const isInitialMount = useRef(true);
  
  // Track which picker is currently expanded
  const [expandedPicker, setExpandedPicker] = useState<
    'bedtime' | 'waketime' | 'quietTime' | 'napDuration' | null
  >(null);
  
  // Enable layout animations for smooth expanding/collapsing
  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);
  
  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [isVisible, height, slideAnim]);
  
  // Initialize napHours and napMinutes from schedule on mount and when schedule.napDuration changes
  useEffect(() => {
    // Only initialize on mount, ignore subsequent schedule.napDuration changes
    if (isInitialMount.current) {
      const hours = Math.floor(schedule.napDuration / 60);
      const minutes = schedule.napDuration % 60;
      setNapHours(hours.toString());
      setNapMinutes(minutes.toString());
      isInitialMount.current = false;
    }
  }, [schedule.napDuration]);
  
  // Update napDuration when hours or minutes change, but only if user is directly changing them
  const updateNapDuration = (hours: string, minutes: string) => {
    const hourValue = parseInt(hours) || 0;
    const minuteValue = parseInt(minutes) || 0;
    const totalMinutes = (hourValue * 60) + minuteValue;
    
    // Update local state
    setNapHours(hours);
    setNapMinutes(minutes);
    
    // Then update the schedule
    updateSchedule({ napDuration: totalMinutes });
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
        onClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true
        }).start();
      }
    }
  });
  
  // Toggle a picker's expanded state
  const togglePicker = (pickerName: 'bedtime' | 'waketime' | 'quietTime' | 'napDuration' | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPicker(expandedPicker === pickerName ? null : pickerName);
  };
  
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
  
  const toggleNightLight = () => {
    setIsNightLight(!isNightLight);
  };
  
  const cycleNightLightColor = () => {
    if (isNightLight) {
      const currentIndex = NIGHT_LIGHT_COLORS.findIndex(c => c.value === nightLightColor);
      const nextIndex = (currentIndex + 1) % NIGHT_LIGHT_COLORS.length;
      setNightLightColor(NIGHT_LIGHT_COLORS[nextIndex].value);
    }
  };
  
  const handleNapPress = () => {
    if (isNapActive) {
      cancelNap();
    } else {
      startNap();
      onClose();
    }
  };
  
  // Format quiet time as hours and minutes
  const formatQuietTime = () => {
    const hours = Math.floor(schedule.quietTime / 60);
    const minutes = schedule.quietTime % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  // Inline time picker component
  const renderInlineTimePicker = (type: 'bedtime' | 'waketime') => {
    const timeValue = parse(
      type === 'bedtime' ? schedule.bedtime : schedule.wakeTime,
      'HH:mm',
      new Date()
    );
    
    const hours = parseInt(format(timeValue, 'h'));
    const minutes = parseInt(format(timeValue, 'mm'));
    const period = format(timeValue, 'a');
    
    const handleHourChange = (value: string) => {
      const hourValue = parseInt(value);
      let newHour = hourValue;
      
      // Convert 12-hour format to 24-hour
      if (period === 'PM' && hourValue < 12) {
        newHour = hourValue + 12;
      } else if (period === 'AM' && hourValue === 12) {
        newHour = 0;
      }
      
      // Create a new date and set hours
      const newDate = new Date();
      newDate.setHours(newHour);
      newDate.setMinutes(minutes);
      
      const timeString = format(newDate, 'HH:mm');
      if (type === 'bedtime') {
        updateSchedule({ bedtime: timeString });
      } else {
        updateSchedule({ wakeTime: timeString });
      }
    };
    
    const handleMinuteChange = (value: string) => {
      const minuteValue = parseInt(value);
      
      // Get current hour in 24-hour format
      let hourValue = parseInt(format(timeValue, 'H'));
      
      // Create a new date and set minutes
      const newDate = new Date();
      newDate.setHours(hourValue);
      newDate.setMinutes(minuteValue);
      
      const timeString = format(newDate, 'HH:mm');
      if (type === 'bedtime') {
        updateSchedule({ bedtime: timeString });
      } else {
        updateSchedule({ wakeTime: timeString });
      }
    };
    
    const handlePeriodChange = (value: string) => {
      let hourValue = parseInt(format(timeValue, 'H'));
      let newHour = hourValue;
      
      // Handle AM/PM switch
      if (value === 'AM' && hourValue >= 12) {
        newHour = hourValue - 12;
      } else if (value === 'PM' && hourValue < 12) {
        newHour = hourValue + 12;
      }
      
      // Create a new date and set hours
      const newDate = new Date();
      newDate.setHours(newHour);
      newDate.setMinutes(minutes);
      
      const timeString = format(newDate, 'HH:mm');
      if (type === 'bedtime') {
        updateSchedule({ bedtime: timeString });
      } else {
        updateSchedule({ wakeTime: timeString });
      }
    };
    
    return (
      <View style={styles.inlinePickerContainer}>
        <View style={styles.inlinePickerRow}>
          <View style={styles.inlinePickerColumn}>
            <Text style={styles.inlinePickerLabel}>Hour</Text>
            <View style={styles.inlinePickerWrapper}>
              <Picker
                selectedValue={hours.toString()}
                onValueChange={handleHourChange}
                style={styles.inlinePicker}
                itemStyle={styles.inlinePickerItem}
              >
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                  <Picker.Item key={h} label={h.toString()} value={h.toString()} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.inlinePickerColumn}>
            <Text style={styles.inlinePickerLabel}>Minute</Text>
            <View style={styles.inlinePickerWrapper}>
              <Picker
                selectedValue={minutes.toString()}
                onValueChange={handleMinuteChange}
                style={styles.inlinePicker}
                itemStyle={styles.inlinePickerItem}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <Picker.Item 
                    key={i} 
                    label={i < 10 ? `0${i}` : i.toString()} 
                    value={i.toString()} 
                  />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.inlinePickerColumn}>
            <Text style={styles.inlinePickerLabel}>AM/PM</Text>
            <View style={styles.inlinePickerWrapper}>
              <Picker
                selectedValue={period}
                onValueChange={handlePeriodChange}
                style={styles.inlinePicker}
                itemStyle={styles.inlinePickerItem}
              >
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.inlinePickerDoneButton}
          onPress={() => togglePicker(null)}
        >
          <Text style={styles.inlinePickerDoneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Inline duration picker component
  const renderInlineDurationPicker = (type: 'quietTime' | 'napDuration') => {
    const isQuietTime = type === 'quietTime';
    const currentValue = isQuietTime 
      ? { 
          hours: Math.floor(schedule.quietTime / 60), 
          minutes: schedule.quietTime % 60 
        }
      : { 
          hours: parseInt(napHours) || 0, 
          minutes: parseInt(napMinutes) || 0 
        };
    
    const maxHours = isQuietTime ? 1 : 24;
    const minuteStep = isQuietTime ? 1 : 5;
    const showHours = !isQuietTime;
    
    const handleHourChange = (value: string) => {
      const hourValue = parseInt(value);
      if (isQuietTime) {
        const totalMinutes = (hourValue * 60) + currentValue.minutes;
        updateSchedule({ quietTime: totalMinutes });
      } else {
        updateNapDuration(value, napMinutes);
      }
    };
    
    const handleMinuteChange = (value: string) => {
      const minuteValue = parseInt(value);
      if (isQuietTime) {
        const totalMinutes = (currentValue.hours * 60) + minuteValue;
        updateSchedule({ quietTime: totalMinutes });
      } else {
        updateNapDuration(napHours, value);
      }
    };
    
    // Generate minute options with appropriate step
    const minuteOptions = [];
    for (let i = 0; i <= 59; i += minuteStep) {
      minuteOptions.push(i);
    }
    
    return (
      <View style={styles.inlinePickerContainer}>
        <View style={styles.inlinePickerRow}>
          {showHours && (
            <View style={styles.inlinePickerColumn}>
              <Text style={styles.inlinePickerLabel}>Hours</Text>
              <View style={styles.inlinePickerWrapper}>
                <Picker
                  selectedValue={currentValue.hours.toString()}
                  onValueChange={handleHourChange}
                  style={styles.inlinePicker}
                  itemStyle={styles.inlinePickerItem}
                >
                  {Array.from({ length: maxHours + 1 }, (_, i) => (
                    <Picker.Item key={i} label={i.toString()} value={i.toString()} />
                  ))}
                </Picker>
              </View>
            </View>
          )}
          
          <View style={styles.inlinePickerColumn}>
            <Text style={styles.inlinePickerLabel}>Minutes</Text>
            <View style={styles.inlinePickerWrapper}>
              <Picker
                selectedValue={currentValue.minutes.toString()}
                onValueChange={handleMinuteChange}
                style={styles.inlinePicker}
                itemStyle={styles.inlinePickerItem}
              >
                {minuteOptions.map(m => (
                  <Picker.Item 
                    key={m} 
                    label={m < 10 ? `0${m}` : m.toString()} 
                    value={m.toString()} 
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.inlinePickerDoneButton}
          onPress={() => togglePicker(null)}
        >
          <Text style={styles.inlinePickerDoneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Animated.View 
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
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.settingsScrollContent}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
      >
        <View>
          <TouchableOpacity 
            style={styles.settingButton} 
            onPress={() => togglePicker('bedtime')}
          >
            <Text style={styles.settingText}>
              Sleep Time: {format12Hour(schedule.bedtime)}
            </Text>
          </TouchableOpacity>
          {expandedPicker === 'bedtime' && renderInlineTimePicker('bedtime')}
        </View>

        <View>
          <TouchableOpacity 
            style={styles.settingButton} 
            onPress={() => togglePicker('waketime')}
          >
            <Text style={styles.settingText}>
              Wake Time: {format12Hour(schedule.wakeTime)}
            </Text>
          </TouchableOpacity>
          {expandedPicker === 'waketime' && renderInlineTimePicker('waketime')}
        </View>

        <View>
          <TouchableOpacity 
            style={styles.settingButton} 
            onPress={() => togglePicker('quietTime')}
          >
            <Text style={styles.settingText}>
              Quiet Time: {formatQuietTime()}
            </Text>
          </TouchableOpacity>
          {expandedPicker === 'quietTime' && renderInlineDurationPicker('quietTime')}
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Night Light</Text>
          <View style={styles.nightLightControls}>
            <TouchableOpacity 
              style={[styles.colorPreview, { backgroundColor: nightLightColor }]}
              onPress={cycleNightLightColor}
            />
            <Switch
              value={isNightLight}
              onValueChange={toggleNightLight}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isNightLight ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        <View style={styles.napSettings}>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => togglePicker('napDuration')}
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
          {expandedPicker === 'napDuration' && renderInlineDurationPicker('napDuration')}
          
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
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '90%',
    alignSelf: 'center',
    maxWidth: 500,
    marginHorizontal: 'auto',
  },
  settingsContainerLandscape: {
    left: Platform.OS === 'ios' ? '20%' : '10%',
    right: Platform.OS === 'ios' ? '20%' : '10%',
    maxHeight: '90%',
    maxWidth: 500,
    alignSelf: 'center',
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
  settingsScrollView: {
    flexGrow: 0,
    paddingBottom: 20,
  },
  settingsScrollContent: {
    gap: 15,
    paddingBottom: 20,
  },
  inlinePickerContainer: {
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    borderRadius: 10,
    padding: 15,
    paddingBottom: 20,
    marginTop: 1,
    marginBottom: 5,
  },
  inlinePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  inlinePickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  inlinePickerLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 5,
  },
  inlinePickerWrapper: {
    width: '90%',
    height: 180,
    overflow: 'hidden',
  },
  inlinePicker: {
    width: '100%',
    color: '#ffffff',
    height: 180,
  },
  inlinePickerItem: {
    color: '#ffffff',
    fontSize: 18,
  },
  inlinePickerDoneButton: {
    backgroundColor: '#4169E1',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 15,
  },
  inlinePickerDoneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  napEndTimeText: {
    color: '#f0f0f0',
    fontSize: 14,
    marginTop: 5,
  },
}); 