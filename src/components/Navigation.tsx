import { useState } from 'react'
import { useProgress } from '../hooks/useProgress'
import { scrollToProgress } from '../hooks/useScrollEngine'
import { useTelemetry } from '../state/TelemetryProvider'
import { Menu, X, Activity } from 'lucide-react'

const SECTIONS: { label: string; at: number }[] = [
  { label: 'Overview', at: 0.0 },
  { label: 'Safety', at: 0.4 },
  { label: 'Sensors', at: 0.56 },
  { label: 'ESP32', at: 0.68 },
  { label: 'Data Flow', at: 0.77 },
  { label: 'Monitoring', at: 0.81 },
  { label: 'Simulation', at: 0.89 },
  { label: 'Architecture', at: 0.935 },
  { label: 'Specifications', at: 0.957 },
]

const statusColor = { SAFE: '#34d399', WARNING: '#fbbf24', DANGER: '#ef4444' } as const

export function Navigation() {
  const p = useProgress()
  const { status } = useTelemetry()
  const [open, setOpen] = useState(false)

  const go = (at: number) => {
    scrollToProgress(at + 0.004)
    setOpen(false)
  }

  return (
    <>
      {/* scroll progress hairline */}
      <div className="fixed top-0 left-0 z-50 h-[2px] w-full bg-white/5" aria-hidden="true">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-amber-300 transition-[width] duration-150"
          style={{ width: `${p * 100}%` }}
        />
      </div>

      <header className="fixed top-0 left-0 z-40 w-full">
        <nav
          className="flex items-center justify-between px-5 py-4 md:px-10"
          aria-label="Journey navigation"
        >
          <button
            onClick={() => go(0)}
            className="group flex items-center gap-2.5 font-mono text-sm tracking-[0.2em] text-slate-200"
          >
            <span
              className="inline-block h-2 w-2 rounded-full transition-colors"
              style={{ backgroundColor: statusColor[status], boxShadow: `0 0 10px ${statusColor[status]}` }}
            />
            SAFESEWER<span className="text-cyan-300">+</span>
          </button>

          <div className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => go(s.at)}
                className="rounded px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-slate-400 uppercase transition-colors hover:bg-white/5 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-slate-500 md:flex">
              <Activity size={12} className="text-cyan-400" />
              {Math.round(p * 100)}%
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded text-slate-300 hover:bg-white/5 lg:hidden"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Toggle navigation menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="border-t border-white/5 bg-[#050810]/95 px-5 py-4 backdrop-blur-md lg:hidden">
            <div className="grid grid-cols-2 gap-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => go(s.at)}
                  className="rounded px-3 py-3 text-left font-mono text-xs tracking-[0.14em] text-slate-300 uppercase hover:bg-white/5 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-cyan-300"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
