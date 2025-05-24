import { addMinutes } from "date-fns";
import { Settings } from "types/settings";
import { nextOccurrence } from "./NextOccurrence";
import { State } from "hooks/useClock"

// only for initial state; does not account for nap
export function initialState(now: Date, settings: Settings): {currentState: State, nextEvent: State, nextEventTime: Date} {
    const bedtimeTime = nextOccurrence(now, settings.bedtime);
    const wakeTime = nextOccurrence(now, settings.wakeTime);
    
    const idleTime = addMinutes(wakeTime, settings.okToWakeDuration);
    
    let times: {event: State, time: Date}[] = [
      { event: 'sleep', time: bedtimeTime },
      { event: 'okToWake', time: wakeTime },
      { event: 'idle', time: idleTime }
    ]
    
    if (settings.quietTime > 0) {
      const quietTimeTime = addMinutes(wakeTime, -settings.quietTime);    
      times.push({ event: 'quietTime', time: quietTimeTime })
    }
    
    const sortedTimes = times.sort((a, b) => a.time.getTime() - b.time.getTime())
    
    const nextEventIndex = sortedTimes.findIndex(time => time.time > now)
    const currentEventIndex = nextEventIndex - 1 // negative is intentional
    
    const nextEventInfo = sortedTimes[nextEventIndex]
    const currentState = sortedTimes.at(currentEventIndex)!.event

    return {
      currentState: currentState,
      nextEvent: nextEventInfo.event,
      nextEventTime: nextEventInfo.time
    }
}