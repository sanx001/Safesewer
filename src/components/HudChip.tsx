import { useTelemetry } from '../state/TelemetryProvider'
import { useProgress, windowFade } from '../hooks/useProgress'

const statusColor = { SAFE: '#34d399', WARNING: '#fbbf24', DANGER: '#ef4444' } as const

/** Minimal always-on telemetry chip while travelling through the tunnel. */
export function HudChip() {
  const p = useProgress()
  const o = windowFade(p, 0.32, 0.772, 0.015)
  const { readings, status, fanOn } = useTelemetry()
  if (o <= 0) return null

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-20 font-mono text-[10px] leading-relaxed md:bottom-6 md:left-6"
      style={{ opacity: o }}
      aria-hidden="true"
    >
      <div className="border border-[#1a2540] bg-[#050810]/70 px-3 py-2 backdrop-blur-sm">
        <div className="mb-1 flex items-center gap-2 tracking-[0.2em] uppercase" style={{ color: statusColor[status] }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor[status], boxShadow: `0 0 8px ${statusColor[status]}` }} />
          {status} {fanOn ? '· FAN ON' : ''}
        </div>
        <div className="grid grid-cols-2 gap-x-4 text-slate-400">
          <span>CH₄ <b className="text-slate-200">{Math.round(readings.methane)}</b></span>
          <span>CO <b className="text-slate-200">{Math.round(readings.co)}</b></span>
          <span>AQ <b className="text-slate-200">{Math.round(readings.airQuality)}</b></span>
          <span>T <b className="text-slate-200">{readings.temperature.toFixed(1)}°</b></span>
        </div>
        <div className="mt-1 text-[8px] tracking-[0.2em] text-slate-600 uppercase">raw adc · node 07</div>
      </div>
    </div>
  )
}
