import { useSyncExternalStore } from 'react'
import { subscribeProgress, getProgress } from '../state/scrollStore'

/** React-side view of the master scroll progress (throttled by the store). */
export function useProgress(): number {
  return useSyncExternalStore(subscribeProgress, getProgress, () => 0)
}

/** fade window helper: 0 outside, smooth in/out inside [start,end] */
export function windowFade(p: number, start: number, end: number, feather = 0.012): number {
  if (p < start - feather || p > end + feather) return 0
  const fin = Math.min(1, (p - (start - feather)) / (feather * 2))
  const fout = Math.min(1, ((end + feather) - p) / (feather * 2))
  const inV = p < start ? fin : 1
  const outV = p > end ? fout : 1
  return Math.min(inV, outV)
}
