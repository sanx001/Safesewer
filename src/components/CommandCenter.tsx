import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { Fan, ShieldCheck, ShieldAlert, OctagonAlert, Radio } from 'lucide-react'
import { useTelemetry } from '../state/TelemetryProvider'
import { THRESHOLDS, ADC_RANGE } from '../data/hardware'
import { useProgress, windowFade } from '../hooks/useProgress'

const COLORS = {
  safe: '#34d399',
  warn: '#fbbf24',
  danger: '#ef4444',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  red: '#f87171',
  slate: '#8fa3b8',
}

function statusMeta(status: string) {
  if (status === 'DANGER') return { c: COLORS.danger, Icon: OctagonAlert }
  if (status === 'WARNING') return { c: COLORS.warn, Icon: ShieldAlert }
  return { c: COLORS.safe, Icon: ShieldCheck }
}

/** Radial gauge with threshold tick. */
function Gauge({
  label,
  gpio,
  value,
  max,
  threshold,
  unit,
  color,
  decimals = 0,
}: {
  label: string
  gpio: string
  value: number
  max: number
  threshold?: number
  unit: string
  color: string
  decimals?: number
}) {
  const frac = Math.min(1, Math.max(0, value / max))
  const R = 34
  const CIRC = Math.PI * R // half circle
  const breached = threshold !== undefined && value > threshold
  return (
    <div className="flex flex-col items-center border border-[#1a2540] bg-[#0c1220]/70 p-3">
      <div className="flex w-full items-center justify-between font-mono text-[9px] tracking-[0.18em] text-slate-500 uppercase">
        <span>{label}</span>
        <span className="text-slate-600">{gpio}</span>
      </div>
      <svg viewBox="0 0 80 48" className="mt-1 w-full max-w-[130px]" role="img" aria-label={`${label} ${value.toFixed(decimals)} ${unit}`}>
        <path d={`M 6 44 A ${R} ${R} 0 0 1 74 44`} fill="none" stroke="#1a2540" strokeWidth="5" />
        <path
          d={`M 6 44 A ${R} ${R} 0 0 1 74 44`}
          fill="none"
          stroke={breached ? COLORS.danger : color}
          strokeWidth="5"
          strokeDasharray={`${frac * CIRC} ${CIRC}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s' }}
        />
        {threshold !== undefined && (
          <ThresholdTick frac={threshold / max} />
        )}
        <text x="40" y="40" textAnchor="middle" fill={breached ? COLORS.danger : '#e2e8f0'} fontSize="13" fontFamily="JetBrains Mono, monospace" fontWeight="600">
          {value.toFixed(decimals)}
        </text>
      </svg>
      <div className="font-mono text-[9px] tracking-[0.18em] text-slate-500 uppercase">{unit}</div>
      {threshold !== undefined && (
        <div className={`mt-0.5 font-mono text-[8px] tracking-[0.14em] uppercase ${breached ? 'text-red-400' : 'text-slate-600'}`}>
          thr {threshold}
        </div>
      )}
    </div>
  )
}

function ThresholdTick({ frac }: { frac: number }) {
  const ang = Math.PI * (1 - frac)
  const x1 = 40 + Math.cos(ang) * 27
  const y1 = 44 - Math.sin(ang) * 27
  const x2 = 40 + Math.cos(ang) * 38
  const y2 = 44 - Math.sin(ang) * 38
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="1.5" />
}

/** Ventilation cause→effect chain */
function VentChain() {
  const { status, fanOn, purging, hazardLevel } = useTelemetry()
  const steps = [
    { label: 'DETECT', on: status !== 'SAFE' },
    { label: 'DECIDE', on: status !== 'SAFE' },
    { label: 'RELAY 22', on: fanOn },
    { label: 'FAN', on: fanOn },
    { label: 'PURGE', on: purging },
  ]
  return (
    <div className="flex items-center gap-1" role="list" aria-label="Ventilation sequence">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1" role="listitem">
          <div
            className={`border px-2 py-1 font-mono text-[9px] tracking-[0.14em] transition-all duration-500 ${
              s.on
                ? 'border-cyan-300/60 bg-cyan-300/10 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.25)]'
                : 'border-[#1a2540] text-slate-600'
            }`}
          >
            {s.label}
          </div>
          {i < steps.length - 1 && <div className={`h-px w-2 ${s.on ? 'bg-cyan-400/60' : 'bg-[#1a2540]'}`} />}
        </div>
      ))}
      <div className="ml-2 font-mono text-[9px] text-slate-500">{Math.round(hazardLevel * 100)}%</div>
    </div>
  )
}

export function CommandCenter() {
  const p = useProgress()
  const o = windowFade(p, 0.772, 0.862, 0.012)
  const { readings, history, status, fanOn, purging, events, serviceMode } = useTelemetry()
  const { c, Icon } = statusMeta(status)

  const chartData = useMemo(
    () =>
      history.map((h, i) => ({
        i,
        ch4: Math.round(h.methane),
        co: Math.round(h.co),
        aq: Math.round(h.airQuality),
        temp: Math.round(h.temperature * 10) / 10,
        rh: Math.round(h.humidity),
      })),
    [history],
  )

  if (o <= 0) return null

  return (
    <section
      className="fixed inset-0 z-30 flex items-center justify-center p-3 md:p-8"
      style={{ opacity: o }}
      aria-label="Live command center"
    >
      <div className="pointer-events-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto border border-[#1a2540] bg-[#050810]/85 backdrop-blur-md">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a2540] px-4 py-3 md:px-6">
          <div>
            <div className="font-mono text-[9px] tracking-[0.3em] text-cyan-300/80 uppercase">Node 07 — Live Command Center</div>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-100 md:text-xl">Environmental Safety Telemetry</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase">
              <Radio size={11} className="text-cyan-400" /> {serviceMode === 'demo' ? 'Simulated feed' : 'Live feed'}
            </span>
            <div
              className="flex items-center gap-2 border px-3 py-1.5 font-mono text-xs tracking-[0.25em]"
              style={{ borderColor: `${c}55`, color: c, backgroundColor: `${c}11`, boxShadow: `0 0 18px ${c}22` }}
              role="status"
            >
              <Icon size={14} />
              {status}
            </div>
          </div>
        </div>

        {/* gauges */}
        <div className="grid grid-cols-2 gap-2 px-4 pt-4 md:grid-cols-5 md:px-6">
          <Gauge label="CH₄ MQ-4" gpio="GPIO34" value={readings.methane} max={ADC_RANGE.max} threshold={THRESHOLDS.methane} unit="Raw ADC" color={COLORS.amber} />
          <Gauge label="CO MQ-7" gpio="GPIO35" value={readings.co} max={ADC_RANGE.max} threshold={THRESHOLDS.co} unit="Raw ADC" color={COLORS.red} />
          <Gauge label="AQ MQ-135" gpio="GPIO32" value={readings.airQuality} max={ADC_RANGE.max} threshold={THRESHOLDS.airQuality} unit="Raw ADC" color={COLORS.slate} />
          <Gauge label="Temp DHT11" gpio="GPIO23" value={readings.temperature} max={60} threshold={THRESHOLDS.temperature} unit="°C" color="#fb923c" decimals={1} />
          <Gauge label="Humidity" gpio="GPIO23" value={readings.humidity} max={100} unit="%RH" color={COLORS.cyan} decimals={0} />
        </div>

        {/* charts */}
        <div className="grid gap-2 px-4 pt-2 md:grid-cols-2 md:px-6">
          <div className="border border-[#1a2540] bg-[#0c1220]/70 p-3">
            <div className="mb-1 font-mono text-[9px] tracking-[0.18em] text-slate-500 uppercase">Gas channels — Raw ADC (0–4095)</div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <XAxis dataKey="i" hide />
                  <YAxis domain={[0, 3000]} tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }} stroke="#1a2540" />
                  <Tooltip
                    contentStyle={{ background: '#0c1220', border: '1px solid #1a2540', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                    labelStyle={{ display: 'none' }}
                  />
                  <ReferenceLine y={1800} stroke="#fbbf2455" strokeDasharray="4 3" />
                  <ReferenceLine y={1800} stroke="#f8717155" strokeDasharray="4 3" />
                  <Area type="monotone" dataKey="ch4" stroke={COLORS.amber} fill={`${COLORS.amber}18`} strokeWidth={1.5} isAnimationActive={false} name="CH₄" />
                  <Area type="monotone" dataKey="co" stroke={COLORS.red} fill={`${COLORS.red}14`} strokeWidth={1.5} isAnimationActive={false} name="CO" />
                  <Area type="monotone" dataKey="aq" stroke={COLORS.slate} fill={`${COLORS.slate}10`} strokeWidth={1.2} isAnimationActive={false} name="AQ" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex gap-4 font-mono text-[9px] text-slate-500">
              <span className="text-amber-300">— CH₄</span>
              <span className="text-red-300">— CO</span>
              <span className="text-slate-300">— AQ</span>
              <span className="ml-auto">raw ADC · uncalibrated</span>
            </div>
          </div>
          <div className="border border-[#1a2540] bg-[#0c1220]/70 p-3">
            <div className="mb-1 font-mono text-[9px] tracking-[0.18em] text-slate-500 uppercase">Climate — °C / %RH</div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <XAxis dataKey="i" hide />
                  <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }} stroke="#1a2540" />
                  <Tooltip
                    contentStyle={{ background: '#0c1220', border: '1px solid #1a2540', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                    labelStyle={{ display: 'none' }}
                  />
                  <ReferenceLine y={45} stroke="#fb923c55" strokeDasharray="4 3" />
                  <Line type="monotone" dataKey="temp" stroke="#fb923c" strokeWidth={1.5} dot={false} isAnimationActive={false} name="°C" />
                  <Line type="monotone" dataKey="rh" stroke={COLORS.cyan} strokeWidth={1.2} dot={false} isAnimationActive={false} name="%RH" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex gap-4 font-mono text-[9px] text-slate-500">
              <span className="text-orange-300">— Temp °C</span>
              <span className="text-cyan-300">— Humidity %RH</span>
              <span className="ml-auto">thr 45 °C</span>
            </div>
          </div>
        </div>

        {/* fan + ventilation chain + events */}
        <div className="grid gap-2 px-4 py-4 md:grid-cols-2 md:px-6">
          <div className="border border-[#1a2540] bg-[#0c1220]/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-[0.18em] text-slate-500 uppercase">Ventilation control</span>
              <span className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] ${fanOn ? 'text-cyan-300' : 'text-slate-600'}`}>
                <Fan size={12} className={fanOn ? 'animate-spin' : ''} style={{ animationDuration: '0.6s' }} />
                FAN {fanOn ? 'ON' : 'OFF'} {purging ? '· PURGING' : ''}
              </span>
            </div>
            <VentChain />
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-slate-500">
                ESP32 → Wi-Fi → Backend/API → REST → React. Threshold logic runs on-device;
  the fan acts even if the link drops.
            </p>
          </div>
          <div className="border border-[#1a2540] bg-[#0c1220]/70 p-3">
            <div className="mb-2 font-mono text-[9px] tracking-[0.18em] text-slate-500 uppercase">Event timeline</div>
            <ol className="max-h-28 space-y-1 overflow-y-auto pr-1" aria-live="polite">
              {events.slice(0, 12).map((e) => (
                <li key={e.id} className="flex items-baseline gap-2 font-mono text-[10px]">
                  <span className="shrink-0 text-slate-600">{e.time}</span>
                  <span
                    className={
                      e.kind === 'danger'
                        ? 'text-red-400'
                        : e.kind === 'warning'
                          ? 'text-amber-300'
                          : e.kind === 'fan'
                            ? 'text-cyan-300'
                            : 'text-slate-400'
                    }
                  >
                    {e.message}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
