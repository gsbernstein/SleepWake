import { useState, useEffect } from 'react';
import { format, parse, isWithinInterval, addMinutes, differenceInMinutes } from 'date-fns';
import { Schedule } from '../types/schedule';

export const useClock = (schedule: Schedule) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<'sleep' | 'quietTime' | 'wake' | 'off'>('off');
  const [isNapActive, setIsNapActive] = useState(false);
  const [napEndTime, setNapEndTime] = useState<Date | null>(null);
  const [timeUntilNextEvent, setTimeUntilNextEvent] = useState<number>(0);
  const [nextEventType, setNextEventType] = useState<'sleep' | 'quietTime' | 'wake'>('sleep');

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
    const quietTimeMinutes = schedule.quietTime || 15;
    const quietTime = addMinutes(wakeTime, -quietTimeMinutes);

    // Handle overnight schedules
    if (wakeTime < bedtime) {
      wakeTime.setDate(wakeTime.getDate() + 1);
      quietTime.setDate(quietTime.getDate() + 1);
    }

    // Calculate time until next event
    let nextTime: Date;
    let eventType: 'sleep' | 'quietTime' | 'wake';

    // Check if we're in nap mode
    if (isNapActive && napEndTime) {
      const quietTimeForNap = addMinutes(napEndTime, -quietTimeMinutes);
      
      // Calculate time until nap ends or quiet time starts
      if (now < quietTimeForNap) {
        setTimeUntilNextEvent(differenceInMinutes(quietTimeForNap, now));
        setNextEventType('quietTime');
      } else if (now < napEndTime) {
        setTimeUntilNextEvent(differenceInMinutes(napEndTime, now));
        setNextEventType('wake');
      } else {
        setTimeUntilNextEvent(0);
      }
      
      if (isWithinInterval(now, { start: quietTimeForNap, end: napEndTime })) {
        setStatus('quietTime');
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
    if (isWithinInterval(now, { start: quietTime, end: wakeTime })) {
      setStatus('quietTime');
    } else if (isWithinInterval(now, { start: wakeTime, end: addMinutes(wakeTime, 1) })) {
      setStatus('wake');
    } else if (isWithinInterval(now, { start: bedtime, end: quietTime })) {
      setStatus('sleep');
    } else {
      setStatus('off');
    }

    // Calculate time until next event, including quiet time
    if (now < bedtime) {
      // Next event is bedtime
      nextTime = bedtime;
      eventType = 'sleep';
    } else if (now < quietTime) {
      // Next event is quiet time
      nextTime = quietTime;
      eventType = 'quietTime';
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
      const quietTimeMinutes = schedule.quietTime || 15;
      const quietTime = addMinutes(endTime, -quietTimeMinutes);
      setNapEndTime(endTime);
      setIsNapActive(true);
      setStatus('sleep');
      
      // Set countdown to quiet time first if it's more than the quiet time period
      if (schedule.napDuration > quietTimeMinutes) {
        setTimeUntilNextEvent(schedule.napDuration - quietTimeMinutes);
        setNextEventType('quietTime');
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
  
  // Format with 12-hour time for display
  const timeWith12Hour = format(currentTime, 'h:mm');
  
  return {
    currentTime,
    status,
    formattedTime: timeWithoutSeconds,
    displayTime: timeWithoutSeconds,  // Keep this for code compatibility
    isNapActive,
    startNap,
    cancelNap,
    timeUntilNextEvent,
    nextEventType
  };
}; 