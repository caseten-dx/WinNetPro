import type { Clock } from '../application/ports.js';

export const systemClock: Clock = {
  now: () => new Date(),
};

export function fixedClock(iso: string): Clock {
  const d = new Date(iso);
  return { now: () => d };
}
