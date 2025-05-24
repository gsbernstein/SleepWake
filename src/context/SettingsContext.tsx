import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings } from '../types/settings';

// Default night light color
const DEFAULT_NIGHT_LIGHT_COLOR = '#953553'; // red-purple

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
  isNightLight: boolean;
  nightLightColor: string;
  setIsNightLight: (value: boolean) => void;
  setNightLightColor: (color: string) => void;
}

const defaultSettings: Settings = {
  bedtime: '20:00',
  wakeTime: '07:00',
  quietTimeDuration: 15,
  napDuration: 180, // 3 hours in minutes
  okToWakeDuration: 30,
  nightLight: true,
  nightLightColor: DEFAULT_NIGHT_LIGHT_COLOR,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isNightLight, setIsNightLight] = useState(false);
  const [nightLightColor, setNightLightColor] = useState(DEFAULT_NIGHT_LIGHT_COLOR);

  // Load settings and settings from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load settings
        const savedSettings = await AsyncStorage.getItem('settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          
          // Handle migrating from old format that included night light settings
          const { isNightLight: oldIsNightLight, nightLightColor: oldNightLightColor, ...rest } = parsedSettings;
          
          // Update settings without night light settings
          setSettings(rest);
          
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

  // Save settings to AsyncStorage
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    saveSettings();
  }, [settings]);

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

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(current => ({ ...current, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setIsNightLight(false);
    setNightLightColor(DEFAULT_NIGHT_LIGHT_COLOR);
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      resetSettings,
      isNightLight,
      nightLightColor,
      setIsNightLight,
      setNightLightColor
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 