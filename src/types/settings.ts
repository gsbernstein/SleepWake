export interface Settings {
  bedtime: string; // HH:mm format
  wakeTime: string; // HH:mm format
  quietTimeDuration: number; // minutes before wake time. Zero means off
  okToWakeDuration: number; // in minutes
  napDuration: number; // in minutes. > 0
  nightLight: boolean;
  nightLightColor: string;
  napWakeTime?: Date; // in case of interruption
}

export interface SettingsContextType {
  updateSettings: (settings: Partial<Settings>) => void;
}