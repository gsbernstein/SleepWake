export interface Schedule {
  bedtime: string; // HH:mm format
  wakeTime: string; // HH:mm format
  quietTime: number; // minutes before wake time
  napDuration: number; // in minutes
}

export interface ScheduleContextType {
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void;
} 