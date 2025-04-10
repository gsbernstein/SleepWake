import { useState, useEffect } from 'react';
import { format, parse, isWithinInterval, addMinutes, differenceInMinutes } from 'date-fns';
import { Schedule } from '../types/schedule';

export const useClock = (schedule: Schedule) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<'sleep' | 'warning' | 'wake' | 'off'>('off');
  const [isNapActive, setIsNapActive] = useState(false);
  const [napEndTime, setNapEndTime] = useState<Date | null>(null);
  const [timeUntilNextEvent, setTimeUntilNextEvent] = useState<number>(0);
  const [nextEventType, setNextEventType] = useState<'sleep' | 'warning' | 'wake'>('sleep');

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

    // Calculate time until next event
    let nextTime: Date;
    let eventType: 'sleep' | 'warning' | 'wake';

    // Check if we're in nap mode
    if (isNapActive && napEndTime) {
      const warningTimeForNap = addMinutes(napEndTime, -schedule.warningTime);
      
      // Calculate time until nap ends or warning starts
      if (now < warningTimeForNap) {
        setTimeUntilNextEvent(differenceInMinutes(warningTimeForNap, now));
        setNextEventType('warning');
      } else if (now < napEndTime) {
        setTimeUntilNextEvent(differenceInMinutes(napEndTime, now));
        setNextEventType('wake');
      } else {
        setTimeUntilNextEvent(0);
      }
      
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

    // Regular schedule logic for status
    if (isWithinInterval(now, { start: warningTime, end: wakeTime })) {
      setStatus('warning');
    } else if (isWithinInterval(now, { start: wakeTime, end: addMinutes(wakeTime, 1) })) {
      setStatus('wake');
    } else if (isWithinInterval(now, { start: bedtime, end: warningTime })) {
      setStatus('sleep');
    } else {
      setStatus('off');
    }

    // Calculate time until next event, including warning time
    if (now < bedtime) {
      // Next event is bedtime
      nextTime = bedtime;
      eventType = 'sleep';
    } else if (now < warningTime) {
      // Next event is warning time
      nextTime = warningTime;
      eventType = 'warning';
    } else if (now < wakeTime) {
      // Next event is wake time
      nextTime = wakeTime;
      eventType = 'wake';
    } else {
      // Next event is tomorrow's bedtime
      nextTime = bedtime;
      nextTime.setDate(nextTime.getDate() + 1);
      eventType = 'sleep';
    }

    // Set countdown time
    setTimeUntilNextEvent(differenceInMinutes(nextTime, now));
    setNextEventType(eventType);
  }, [schedule, currentTime, isNapActive, napEndTime]);

  // Function to start a nap with the configured duration
  const startNap = () => {
    if (schedule.napDuration > 0) {
      const endTime = addMinutes(new Date(), schedule.napDuration);
      const warningTime = addMinutes(endTime, -schedule.warningTime);
      setNapEndTime(endTime);
      setIsNapActive(true);
      setStatus('sleep');
      
      // Set countdown to warning time first if it's more than the warning period
      if (schedule.napDuration > schedule.warningTime) {
        setTimeUntilNextEvent(schedule.napDuration - schedule.warningTime);
        setNextEventType('warning');
      } else {
        setTimeUntilNextEvent(schedule.napDuration);
        setNextEventType('wake');
      }
    }
  };

  // Function to cancel a nap
  const cancelNap = () => {
    setIsNapActive(false);
    setNapEndTime(null);
  };

  // Format the time as HH:MM for display
  const timeWithoutSeconds = format(currentTime, 'HH:mm');
  // Format with seconds for internal use
  const timeWithSeconds = format(currentTime, 'HH:mm:ss');

  return {
    currentTime,
    status,
    formattedTime: timeWithSeconds,
    displayTime: timeWithoutSeconds,
    isNapActive,
    startNap,
    cancelNap,
    timeUntilNextEvent,
    nextEventType
  };
}; 