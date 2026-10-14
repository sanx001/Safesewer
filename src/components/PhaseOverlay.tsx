import type { ReactNode } from 'react'
import { useProgress, windowFade } from '../hooks/useProgress'

interface Props {
  range: [number, number]
  feather?: number
  children: ReactNode
  className?: string
  interactive?: boolean
  align?: 'left' | 'center' | 'right'
}

/**
 * A cinematic caption layer bound to a segment of the journey. Fades and
 * drifts with scroll; renders nothing outside its window.
 */
export function PhaseOverlay({
  range,
  feather = 0.014,
  children,
  className = '',
  interactive = false,
  align = 'center',
}: Props) {
  const p = useProgress()
  const o = windowFade(p, range[0], range[1], feather)
  if (o <= 0) return null
  const drift = (1 - o) * 26
  return (
    <div
      className={`fixed inset-0 z-20 flex ${alignClass(align)} ${interactive ? '' : 'pointer-events-none'} ${className}`}
      style={{ opacity: o, transform: `translateY(${drift}px)` }}
      aria-hidden={o < 0.35}
    >
      {children}
    </div>
  )
}

function alignClass(a: 'left' | 'center' | 'right') {
  switch (a) {
    case 'left':
      return 'items-end justify-start p-6 pb-24 md:p-14 md:pb-24'
    case 'right':
      return 'items-end justify-end p-6 pb-24 md:p-14 md:pb-24'
    default:
      return 'items-center justify-center p-6'
  }
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-cyan-300/80 uppercase md:text-xs">
      <span className="inline-block h-px w-8 bg-cyan-300/50" />
      {children}
    </div>
  )
}

export function Caption({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-100 md:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-3 font-mono text-xs leading-relaxed text-slate-400 md:text-sm">{sub}</p>}
    </div>
  )
}
