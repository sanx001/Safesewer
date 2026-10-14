import { HAZARD_MODES } from '../data/simulation'
import { useTelemetry } from '../state/TelemetryProvider'
import { useProgress, windowFade } from '../hooks/useProgress'
import { FlaskConical } from 'lucide-react'

/**
 * Hazard simulation dock — visible from the command center onward.
 * Everything in the world responds: lighting, fog, particles, LEDs,
 * gauges, fan, alerts.
 */
export function SimulationPanel() {
  const p = useProgress()
  const o = windowFade(p, 0.85, 0.972, 0.01)
  const { hazardMode, setHazardMode, status } = useTelemetry()

  if (o <= 0) return null

  return (
    <div
      className="fixed bottom-4 left-1/2 z-30 w-[min(96vw,860px)] -translate-x-1/2 md:bottom-8"
      style={{ opacity: o }}
      role="group"
      aria-label="Hazard simulation controls"
    >
      <div className="pointer-events-auto border border-[#1a2540] bg-[#050810]/88 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-[#1a2540] px-4 py-2">
          <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.28em] text-cyan-300/80 uppercase">
            <FlaskConical size={11} /> Hazard simulation
          </span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase">
            system responds in real time
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-2 md:grid-cols-6">
          {HAZARD_MODES.map((m) => {
            const active = hazardMode === m.id
            return (
              <button
                key={m.id}
                onClick={() => setHazardMode(m.id)}
                aria-pressed={active}
                className={`min-h-[44px] border px-2 py-2.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-all focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                  active
                    ? 'border-current bg-white/5'
                    : 'border-[#1a2540] text-slate-500 hover:border-slate-500 hover:text-slate-300'
                }`}
                style={active ? { color: m.envColor, boxShadow: `0 0 16px ${m.envColor}33` } : undefined}
              >
                {m.short}
              </button>
            )
          })}
        </div>
        <div className="border-t border-[#1a2540] px-4 py-2 font-mono text-[10px] text-slate-500">
          <span className={status === 'SAFE' ? 'text-emerald-400' : status === 'WARNING' ? 'text-amber-300' : 'text-red-400'}>
            {status}
          </span>
          {' — '}
          {HAZARD_MODES.find((m) => m.id === hazardMode)?.description}
        </div>
      </div>
    </div>
  )
}
