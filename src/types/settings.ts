export interface Settings {
  bedtime: string; // HH:mm format
  wakeTime: string; // HH:mm format
  quietTime: number; // minutes before wake time
  napDuration: number; // in minutes
  okToWakeDuration: number; // in minutes
  nightLight: boolean;
  nightLightColor: string;
}

export interface SettingsContextType {
  updateSettings: (settings: Partial<Settings>) => void;
}