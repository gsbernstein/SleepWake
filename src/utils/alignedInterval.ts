export function alignedInterval(callback: () => void, interval: number) {
  let goalTime = performance.now();
  let timeoutId: NodeJS.Timeout;
  let isActive = true;
  let weightedRecentDiscrepancy = 0;

  function tick() {
    if (!isActive) return;
    
    const now = performance.now();
    const discrepancy = now - goalTime;
    weightedRecentDiscrepancy = weightedRecentDiscrepancy * 0.9 + discrepancy * 0.1;
    
    goalTime = goalTime + interval;
    
    const delay = Math.max(1, goalTime - now - weightedRecentDiscrepancy); // Ensure delay is not negative
    
    callback();

    timeoutId = setTimeout(tick, delay);
  }

  timeoutId = setTimeout(tick, interval); // Initial kick-off
  
  // Return a function that can clear the interval
  return () => {
    isActive = false;
    clearTimeout(timeoutId);
  };
}