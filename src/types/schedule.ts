export interface Schedule {
  bedtime: string; // HH:mm format
  wakeTime: string; // HH:mm format
  warningTime: number; // minutes before wake time
  isNightLight: boolean;
  nightLightColor: string; // hex color code
  napDuration: number; // in minutes
}

export interface ScheduleContextType {
  schedules: Schedule[];
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  activeSchedule: Schedule | null;
  setActiveSchedule: (id: string | null) => void;
} 