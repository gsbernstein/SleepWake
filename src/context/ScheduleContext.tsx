import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Schedule, ScheduleContextType } from '../types/schedule';

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const storedSchedules = await AsyncStorage.getItem('schedules');
      if (storedSchedules) {
        const parsedSchedules = JSON.parse(storedSchedules);
        setSchedules(parsedSchedules);
        const active = parsedSchedules.find((s: Schedule) => s.isActive);
        if (active) {
          setActiveSchedule(active);
        }
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const saveSchedules = async (newSchedules: Schedule[]) => {
    try {
      await AsyncStorage.setItem('schedules', JSON.stringify(newSchedules));
    } catch (error) {
      console.error('Error saving schedules:', error);
    }
  };

  const addSchedule = (schedule: Omit<Schedule, 'id'>) => {
    const newSchedule = {
      ...schedule,
      id: Date.now().toString(),
    };
    const newSchedules = [...schedules, newSchedule];
    setSchedules(newSchedules);
    saveSchedules(newSchedules);
  };

  const updateSchedule = (id: string, updatedSchedule: Partial<Schedule>) => {
    const newSchedules = schedules.map(schedule =>
      schedule.id === id ? { ...schedule, ...updatedSchedule } : schedule
    );
    setSchedules(newSchedules);
    saveSchedules(newSchedules);
    
    if (activeSchedule?.id === id) {
      setActiveSchedule({ ...activeSchedule, ...updatedSchedule });
    }
  };

  const deleteSchedule = (id: string) => {
    const newSchedules = schedules.filter(schedule => schedule.id !== id);
    setSchedules(newSchedules);
    saveSchedules(newSchedules);
    
    if (activeSchedule?.id === id) {
      setActiveSchedule(null);
    }
  };

  const setActiveScheduleById = (id: string | null) => {
    if (id === null) {
      setActiveSchedule(null);
      return;
    }
    
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      setActiveSchedule(schedule);
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        activeSchedule,
        setActiveSchedule: setActiveScheduleById,
      }}
    >
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