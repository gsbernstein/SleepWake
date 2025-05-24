import { useState, useEffect } from 'react';
import { format, isWithinInterval, addMinutes } from 'date-fns';
import { Settings } from '../types/settings';
import { nextOccurrence } from 'utils/NextOccurrence';
import { nextEvent } from 'utils/NextEvent';

export type State = 'sleep' | 'quietTime' | 'okToWake' | 'idle'; // applies to both nap and regular sleep/wake

export const useClock = (settings: Settings) => {
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNapActive, setIsNapActive] = useState(false);
  const [napEndTime, setNapEndTime] = useState<Date | null>(null);
  
  const { currentState: initialState, nextEvent: initialNextEvent, nextEventTime: initialNextEventTime } = initialState(new Date(), settings);
  const [state, setState] = useState<State>(initialState);
  const [nextEvent, setNextEvent] = useState<State>(initialNextEvent);
  const [nextEventTime, setNextEventTime] = useState<Date | null>(initialNextEventTime);

  // Update the current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Handle normal sleep/wake schedule
    const now = new Date();
    const bedtime = nextOccurrence(now, settings.bedtime);
    const wakeTime = nextOccurrence(now, settings.wakeTime);
    
    // TODO: cache upcoming events
    
    const quietTimeMinutes = settings.quietTime;
    const quietTimeTime = addMinutes(wakeTime, -quietTimeMinutes);

    // Calculate time until next event
    let nextTime: Date;
    let nextEvent: EventType;

    // Check if we're in nap mode
    if (isNapActive && napEndTime) {
      const quietTimeForNap = addMinutes(napEndTime, -quietTimeMinutes);
      
      // Calculate time until nap ends or quiet time starts
      if (now < quietTimeForNap) {
        nextTime = quietTimeForNap;
        nextEvent = 'quietTime';
      } else if (now < napEndTime) {
        nextTime = napEndTime;
        nextEvent = 'okToWake';
      } else {
      
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
    setNextEventType(nextEventType);
  }, [settings, currentTime, isNapActive, napEndTime]);

  // Function to start a nap with the configured duration
  const startNap = () => {
    if (isNapActive) { throw Error('nap already active') }
    if (status !== 'idle') { throw Error('already asleep') }
    
    const now = new Date()
    const napEndTime = addMinutes(now, settings.napDuration);
    
    if (nextEventTime && napEndTime > nextEventTime) {
      throw Error('nap would overlap bedtime')
    } 
    
    setIsNapActive(true)
    setNapEndTime(napEndTime)
    setNextEventTime(addMinutes());
    setNextEventType('quietTime')
  };

  // Function to cancel a nap
  const cancelNap = () => {
    if (!isNapActive) { throw Error('nap not currently enabled') }
    setIsNapActive(false);
    setNapEndTime(null);
    setNextEventTime(null);
    setNextEventType(null);
  };

  // Format the time as HH:MM for display
  const displayTime = format(currentTime, 'HH:mm');
  
  return {
    currentTime,
    state,
    displayTime,
    isNapActive,
    startNap,
    cancelNap,
    nextEventTime,
    nextEvent
  };
}; 