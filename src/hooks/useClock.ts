import { useState, useEffect } from 'react';
import { format, parse, isWithinInterval, addMinutes } from 'date-fns';
import { Schedule } from '../types/schedule';

export const useClock = (schedule: Schedule | null) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<'sleep' | 'warning' | 'wake' | 'off'>('off');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!schedule) {
      setStatus('off');
      return;
    }

    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm');
    const bedtime = parse(schedule.bedtime, 'HH:mm', now);
    const wakeTime = parse(schedule.wakeTime, 'HH:mm', now);
    const warningTime = addMinutes(wakeTime, -schedule.warningTime);

    // Handle overnight schedules
    if (wakeTime < bedtime) {
      wakeTime.setDate(wakeTime.getDate() + 1);
      warningTime.setDate(warningTime.getDate() + 1);
    }

    if (isWithinInterval(now, { start: warningTime, end: wakeTime })) {
      setStatus('warning');
    } else if (isWithinInterval(now, { start: wakeTime, end: addMinutes(wakeTime, 1) })) {
      setStatus('wake');
    } else if (isWithinInterval(now, { start: bedtime, end: warningTime })) {
      setStatus('sleep');
    } else {
      setStatus('off');
    }
  }, [schedule, currentTime]);

  return {
    currentTime,
    status,
    formattedTime: format(currentTime, 'HH:mm:ss'),
  };
}; 