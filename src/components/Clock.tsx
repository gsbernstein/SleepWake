import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useWindowDimensions, 
  TouchableOpacity, 
  StatusBar
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  useSharedValue
} from 'react-native-reanimated';
import { useClock } from 'hooks/useClock';
import { useSettings } from 'context/SettingsContext';
import { differenceInMinutes, format, parse } from 'date-fns';
import { SettingsPanel } from './SettingsPanel';
import { State } from 'hooks/useClock';

const STATUS_COLORS: Record<State, string> = {
  sleep: '#000000', // can be overridden by night light
  quietTime: '#ffd700',
  okToWake: '#00ff00',
  idle: '#000000',
};

const nextEventDescripton: Record<State, string> = {
    sleep: 'bedtime',
    quietTime: 'quiet time',
    okToWake: 'wake up',
    idle: 'idle',
}

export const Clock: React.FC = () => {
  const { 
    isNightLight, 
    nightLightColor,
    settings
  } = useSettings();
  const { 
    currentTime,
    state,
    isNapActive, 
    startNap, 
    cancelNap, 
    nextEventTime,
    nextEvent,
  } = useClock(settings);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [showSettings, setShowSettings] = useState(false);

  // Store background color in a shared value for smooth animations
  const backgroundColor = useSharedValue(STATUS_COLORS.idle);

  // Update the background color based on status and night light settings
  useEffect(() => {
    const shouldUseNightLight = isNightLight && (state === 'sleep');
    const targetColor = shouldUseNightLight ? nightLightColor : STATUS_COLORS[state];
    
    // Smoothly animate to the new color
    backgroundColor.value = targetColor;
  }, [state, isNightLight, nightLightColor]);

  // Create animated style with smooth transitions
  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(backgroundColor.value, {
        duration: 1000, // 1 second transition
      }),
    };
  });

  const showSettingsPanel = () => {
    setShowSettings(true);
  };

  const hideSettings = () => {
    setShowSettings(false);
  };

  
  // Format the countdown
  const formatCountdown = () => {
    const timeUntilNextEvent = differenceInMinutes(nextEventTime, currentTime);
    
    const hours = Math.floor(timeUntilNextEvent / 60);
    const minutes = timeUntilNextEvent % 60;
    
    let countdownText = '';
    if (hours > 0) {
      countdownText += `${hours}h `;
    }
    countdownText += `${minutes}m`;
    
    return `${countdownText} until ${nextEventDescripton[nextEvent]}`;
  }

  // Format the time as HH:MM for display
  const displayTime = format(currentTime, 'h:mm a');
    
  return (
    <View style={styles.background}>
      <View style={styles.safeArea}>
        <StatusBar hidden />
        <Animated.View style={[styles.container, backgroundStyle, { width, height }]}>
          <Text style={[styles.time, isLandscape && styles.timeLandscape]}>{displayTime}</Text>
          
          <Text style={styles.countdownText}>{formatCountdown()}</Text>
          
          {!showSettings && (
            <TouchableOpacity 
              style={[styles.settingsButton, isLandscape && styles.settingsButtonLandscape]}
              onPress={showSettingsPanel}
            >
              <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
            </TouchableOpacity>
          )}
          
          <SettingsPanel
            isVisible={showSettings}
            onClose={hideSettings}
            isLandscape={isLandscape}
            height={height}
            isNapActive={isNapActive}
            startNap={startNap}
            cancelNap={cancelNap}
            currentTime={currentTime}
          />
        </Animated.View>
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
    textAlign: 'center',
  },
  timeLandscape: {
    fontSize: 72,
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
  settingsButtonLandscape: {
    bottom: 20,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 16,
  }
}); 