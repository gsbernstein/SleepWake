import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Schedule } from '../types/settings';

// Default night light color
const DEFAULT_NIGHT_LIGHT_COLOR = '#8A2BE2';

interface ScheduleContextType {
  schedule: Schedule;
  updateSchedule: (updates: Partial<Schedule>) => void;
  resetSchedule: () => void;
  isNightLight: boolean;
  nightLightColor: string;
  setIsNightLight: (value: boolean) => void;
  setNightLightColor: (color: string) => void;
}

const defaultSchedule: Schedule = {
  bedtime: '20:00',
  wakeTime: '07:00',
  quietTime: 15,
  napDuration: 180, // 3 hours in minutes
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [isNightLight, setIsNightLight] = useState(false);
  const [nightLightColor, setNightLightColor] = useState(DEFAULT_NIGHT_LIGHT_COLOR);

  // Load schedule and settings from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load schedule
        const savedSchedule = await AsyncStorage.getItem('schedule');
        if (savedSchedule) {
          const parsedSchedule = JSON.parse(savedSchedule);
          
          // Handle migrating from old format that included night light settings
          const { isNightLight: oldIsNightLight, nightLightColor: oldNightLightColor, ...rest } = parsedSchedule;
          
          // Update schedule without night light settings
          setSchedule(rest);
          
          // If we loaded from old format, also set the night light settings
          if (oldIsNightLight !== undefined) {
            setIsNightLight(oldIsNightLight);
          }
          
          if (oldNightLightColor) {
            setNightLightColor(oldNightLightColor);
          }
        }
        
        // Load night light settings
        const savedIsNightLight = await AsyncStorage.getItem('isNightLight');
        if (savedIsNightLight !== null) {
          setIsNightLight(JSON.parse(savedIsNightLight));
        }
        
        const savedNightLightColor = await AsyncStorage.getItem('nightLightColor');
        if (savedNightLightColor) {
          setNightLightColor(savedNightLightColor);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  // Save schedule to AsyncStorage
  useEffect(() => {
    const saveSchedule = async () => {
      try {
        await AsyncStorage.setItem('schedule', JSON.stringify(schedule));
      } catch (error) {
        console.error('Failed to save schedule:', error);
      }
    };

    saveSchedule();
  }, [schedule]);

  // Save night light settings to AsyncStorage
  useEffect(() => {
    const saveNightLightSettings = async () => {
      try {
        await AsyncStorage.setItem('isNightLight', JSON.stringify(isNightLight));
        await AsyncStorage.setItem('nightLightColor', nightLightColor);
      } catch (error) {
        console.error('Failed to save night light settings:', error);
      }
    };

    saveNightLightSettings();
  }, [isNightLight, nightLightColor]);

  const updateSchedule = (updates: Partial<Schedule>) => {
    setSchedule(current => ({ ...current, ...updates }));
  };

  const resetSchedule = () => {
    setSchedule(defaultSchedule);
    setIsNightLight(false);
    setNightLightColor(DEFAULT_NIGHT_LIGHT_COLOR);
  };

  return (
    <ScheduleContext.Provider value={{ 
      schedule, 
      updateSchedule, 
      resetSchedule,
      isNightLight,
      nightLightColor,
      setIsNightLight,
      setNightLightColor
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}; 