import { useState, useEffect } from 'react';
import { format, isWithinInterval, addMinutes } from 'date-fns';
import { Settings } from '../types/settings';
import { nextOccurrence } from 'utils/NextOccurrence';
import { getInitialState } from 'utils/GetInitialState';

export type State = 'sleep' | 'quietTime' | 'okToWake' | 'idle'; // applies to both nap and regular sleep/wake

export const useClock = (settings: Settings) => {
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNapActive, setIsNapActive] = useState(false);
  const [napEndTime, setNapEndTime] = useState<Date | null>(null);
  
  const { currentState: initialState, nextEvent: initialNextEvent, nextEventTime: initialNextEventTime } = getInitialState(new Date(), settings);
  const [state, setState] = useState<State>(initialState);
  const [nextEvent, setNextEvent] = useState<State>(initialNextEvent);
  const [nextEventTime, setNextEventTime] = useState<Date>(initialNextEventTime);

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
    
    if (now < nextEventTime) {
      // do nothing
      return;
    }
    
    setState(nextEvent);
    
    // Calculate time until next event
    let newNextEvent: State;
    
    switch(nextEvent) {
      case 'sleep':
        newNextEvent = settings.quietTimeDuration > 0 ? 'quietTime' : 'okToWake'
        break;
      case 'quietTime':
        newNextEvent = 'okToWake'
        break;
      case 'okToWake':
        newNextEvent = 'idle'
        break;
      case 'idle':
        newNextEvent = 'sleep';
        break;
    }
    
    setNextEvent(newNextEvent);
    
    let newNextEventTime: Date;
    const wakeTime = nextOccurrence(now, settings.wakeTime);
    switch(newNextEvent) {
      case 'quietTime':
        newNextEventTime = addMinutes(wakeTime, -settings.quietTimeDuration);
        break;
      case 'okToWake':
        newNextEventTime = wakeTime;
        break;
      case 'idle':
        newNextEventTime = addMinutes(wakeTime, settings.okToWakeDuration);
        break;
      case 'sleep':
        newNextEventTime = nextOccurrence(now, settings.bedtime);
        break;
    }
    setNextEventTime(newNextEventTime);
    
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
    setNextEventTime(addMinutes(now, settings.napDuration));
    setNextEvent('quietTime')
  };

  // Function to cancel a nap
  const cancelNap = () => {
    if (!isNapActive) { throw Error('nap not currently enabled') }
    setIsNapActive(false);
    setNapEndTime(null);
    setNextEventTime(nextOccurrence(new Date(), settings.bedtime));
    setNextEvent('sleep');
  };
  
  return {
    currentTime,
    state,
    isNapActive,
    startNap,
    cancelNap,
    nextEventTime,
    nextEvent
  };
}; 