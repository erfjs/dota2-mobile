import { useEffect, useState } from "react";

const TICK_MS = 250;
const MAX_LIVE_DRIFT = 1.5;

/**
 * Smooth the GSI clock (~1 Hz) between packets.
 * Caps drift so a stalled connection cannot run the clock away.
 * When not live, freeze on the last known clock instead of inventing time.
 */
export function useLiveClock(options: {
  clockTime?: number;
  updatedAt?: number;
  live: boolean;
}): number | undefined {
  const { clockTime, updatedAt, live } = options;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  if (clockTime == null || Number.isNaN(clockTime)) return undefined;
  if (!live) return clockTime;

  const base = updatedAt != null ? updatedAt : now;
  const drift = Math.min(MAX_LIVE_DRIFT, Math.max(0, (now - base) / 1000));
  return clockTime + drift;
}
