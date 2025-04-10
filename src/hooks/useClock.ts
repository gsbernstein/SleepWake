import { useState, useEffect } from 'react';
import { format, parse, isWithinInterval, addMinutes } from 'date-fns';
import { Schedule } from '../types/schedule';

export const useClock = (schedule: Schedule) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<'sleep' | 'warning' | 'wake' | 'off'>('off');
  const [isNapActive, setIsNapActive] = useState(false);
  const [napEndTime, setNapEndTime] = useState<Date | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Handle normal sleep/wake schedule
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

    // Check if we're in nap mode
    if (isNapActive && napEndTime) {
      const warningTimeForNap = addMinutes(napEndTime, -schedule.warningTime);
      
      if (isWithinInterval(now, { start: warningTimeForNap, end: napEndTime })) {
        setStatus('warning');
      } else if (now >= napEndTime) {
        setStatus('wake');
        // Auto-disable nap mode 1 minute after wake time
        if (now >= addMinutes(napEndTime, 1)) {
          setIsNapActive(false);
          setNapEndTime(null);
        }
      } else {
        setStatus('sleep');
      }
      return;
    }

    // Regular schedule logic
    if (isWithinInterval(now, { start: warningTime, end: wakeTime })) {
      setStatus('warning');
    } else if (isWithinInterval(now, { start: wakeTime, end: addMinutes(wakeTime, 1) })) {
      setStatus('wake');
    } else if (isWithinInterval(now, { start: bedtime, end: warningTime })) {
      setStatus('sleep');
    } else {
      setStatus('off');
    }
  }, [schedule, currentTime, isNapActive, napEndTime]);

  // Function to start a nap with the configured duration
  const startNap = () => {
    if (schedule.napDuration > 0) {
      const endTime = addMinutes(new Date(), schedule.napDuration);
      setNapEndTime(endTime);
      setIsNapActive(true);
      setStatus('sleep');
    }
  };

  // Function to cancel a nap
  const cancelNap = () => {
    setIsNapActive(false);
    setNapEndTime(null);
  };

  return {
    currentTime,
    status,
    formattedTime: format(currentTime, 'HH:mm:ss'),
    isNapActive,
    startNap,
    cancelNap,
  };
}; 