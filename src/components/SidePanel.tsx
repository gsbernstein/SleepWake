import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { ScheduleScreen } from '../screens/ScheduleScreen';

interface SidePanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isVisible, onClose }) => {
  const screenWidth = Dimensions.get('window').width;
  const panelWidth = screenWidth > 768 ? 400 : screenWidth * 0.8;
  
  const translateX = useSharedValue(isVisible ? 0 : -panelWidth);
  
  React.useEffect(() => {
    translateX.value = withTiming(isVisible ? 0 : -panelWidth, {
      duration: 300,
    });
  }, [isVisible, panelWidth]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { width: panelWidth },
        animatedStyle
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Manage Schedules</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <ScheduleScreen />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
}); 