export function alignedInterval(callback: () => void, interval: number) {
  let goalTime = performance.now();
  let timeoutId: NodeJS.Timeout;
  let isActive = true;
  let weightedRecentDiscrepancy = 0;

  function tick() {
    if (!isActive) return;
    
    const now = performance.now();
    const discrepancy = now - goalTime;
    console.log('discrepancy', discrepancy)
    weightedRecentDiscrepancy = weightedRecentDiscrepancy * 0.9 + discrepancy * 0.1;
    console.log('weightedRecentDiscrepancy', weightedRecentDiscrepancy)
    
    goalTime = goalTime + interval;
    
    const delay = Math.max(1, goalTime - now - weightedRecentDiscrepancy); // Ensure delay is not negative
    console.log('delay', delay)
    
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