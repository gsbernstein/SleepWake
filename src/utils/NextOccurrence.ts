import { addDays, parse } from "date-fns";

export function nextOccurrence(now: Date, time: string) {
    const todayTime = parse(time, 'HH:mm', now);
    if (todayTime < now) {
      return addDays(todayTime, 1);
    } else {
      return todayTime;
    }
}