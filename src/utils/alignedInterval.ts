export function alignedInterval(callback: () => void, interval: number) {
  let startTime = performance.now();

  function tick() {
    const now = performance.now();
    const elapsed = now - startTime;
    const delay = Math.max(0, interval - elapsed); // Ensure delay is not negative

    startTime = now; // Reset startTime
    callback();

    setTimeout(tick, delay);
  }

  setTimeout(tick, interval); // Initial kick-off
}