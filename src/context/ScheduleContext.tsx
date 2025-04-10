import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Schedule } from '../types/schedule';

interface ScheduleContextType {
  schedule: Schedule;
  updateSchedule: (updates: Partial<Schedule>) => void;
  resetSchedule: () => void;
}

const defaultSchedule: Schedule = {
  bedtime: '20:00',
  wakeTime: '07:00',
  warningTime: 15,
  isNightLight: false,
  nightLightColor: '#8A2BE2',
  napDuration: 0, // in minutes
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const savedSchedule = await AsyncStorage.getItem('schedule');
        if (savedSchedule) {
          setSchedule(JSON.parse(savedSchedule));
        }
      } catch (error) {
        console.error('Failed to load schedule:', error);
      }
    };

    loadSchedule();
  }, []);

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

  const updateSchedule = (updates: Partial<Schedule>) => {
    setSchedule(current => ({ ...current, ...updates }));
  };

  const resetSchedule = () => {
    setSchedule(defaultSchedule);
  };

  return (
    <ScheduleContext.Provider value={{ schedule, updateSchedule, resetSchedule }}>
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