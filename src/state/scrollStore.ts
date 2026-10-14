// Mutable scroll store — read inside useFrame without React re-renders.
// Written by GSAP ScrollTrigger (scrubbed against the Lenis-smoothed page scroll).

export const scrollState = {
  /** 0..1 master journey progress */
  progress: 0,
  /** px/s, smoothed */
  velocity: 0,
  /** active pointer parallax, -1..1 */
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
}

type Listener = (p: number) => void
const listeners = new Set<Listener>()
let lastNotified = -1

/** React-friendly subscription (throttled to ~progress deltas of 0.002) */
export function subscribeProgress(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setProgress(p: number) {
  scrollState.progress = p
  if (Math.abs(p - lastNotified) > 0.002 || p === 0 || p === 1) {
    lastNotified = p
    listeners.forEach((fn) => fn(p))
  }
}

export function getProgress(): number {
  return scrollState.progress
}

/** helper: remap progress p into [a,b] → 0..1 clamped */
export const seg = (p: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (p - a) / (b - a)))

export const smooth = (t: number) => t * t * (3 - 2 * t)
