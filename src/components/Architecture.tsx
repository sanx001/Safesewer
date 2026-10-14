import { useState } from 'react'
import { SENSORS, OUTPUTS, CONTROLLER, THRESHOLDS } from '../data/hardware'
import { useTelemetry } from '../state/TelemetryProvider'
import { useProgress, windowFade } from '../hooks/useProgress'
import { Cpu, Wifi, Server, Zap, MonitorDot, X } from 'lucide-react'

interface NodeInfo {
  id: string
  name: string
  detail: string
  meta: string[]
  live?: string
  status?: string
}

function Connector() {
  return (
    <div className="relative mx-auto h-8 w-px bg-[#1a2540]" aria-hidden="true">
      <span className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)] motion-safe:animate-[packet_1.6s_linear_infinite]" />
      <style>{`@keyframes packet { 0% { top: 0; opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { top: calc(100% - 6px); opacity: 0 } }`}</style>
    </div>
  )
}

export function Architecture() {
  const p = useProgress()
  const o = windowFade(p, 0.912, 0.948, 0.008)
  const { readings, status, fanOn } = useTelemetry()
  const [sel, setSel] = useState<NodeInfo | null>(null)

  if (o <= 0) return null

  const sensorNodes: NodeInfo[] = SENSORS.map((s) => ({
    id: s.id,
    name: s.name,
    detail: s.description,
    meta: [`GPIO ${s.gpio.replace('GPIO', '')}`, s.measures, `Threshold: ${s.thresholdLabel}`],
    live:
      s.id === 'mq4'
        ? `${Math.round(readings.methane)} Raw ADC`
        : s.id === 'mq7'
          ? `${Math.round(readings.co)} Raw ADC`
          : s.id === 'mq135'
            ? `${Math.round(readings.airQuality)} Raw ADC`
            : `${readings.temperature.toFixed(1)} °C · ${Math.round(readings.humidity)} %RH`,
    status:
      s.id === 'dht11'
        ? readings.temperature > THRESHOLDS.temperature
          ? 'BREACH'
          : 'OK'
        : (s.id === 'mq4' ? readings.methane : s.id === 'mq7' ? readings.co : readings.airQuality) >
            (s.thresholdAdc ?? Infinity)
          ? 'BREACH'
          : 'OK',
  }))

  const chain: { icon: React.ReactNode; node: NodeInfo }[] = [
    {
      icon: <Cpu size={16} />,
      node: {
        id: 'esp32',
        name: CONTROLLER,
        detail: 'Edge controller. Samples four ADC/GPIO channels at 10 Hz, applies threshold logic on-device, drives the relay and streams telemetry upstream.',
        meta: ['ADC 0–4095', 'GPIO22 → Relay', 'Wi-Fi 2.4 GHz'],
        live: `Status word: ${status}`,
        status,
      },
    },
    {
      icon: <Wifi size={16} />,
      node: {
        id: 'wifi',
        name: 'Wi-Fi Uplink',
        detail: 'Telemetry packets leave the tunnel over site Wi-Fi. Safety logic never depends on this link.',
        meta: ['JSON packets', '1.4 s cadence (demo)'],
      },
    },
    {
      icon: <Server size={16} />,
      node: {
        id: 'backend',
        name: 'Backend / API',
        detail: 'Ingests packets, persists time-series, exposes REST + WebSocket. RealTelemetryService in this build is pre-wired for it.',
        meta: ['REST /api/v1', 'WS /telemetry'],
      },
    },
    {
      icon: <Zap size={16} />,
      node: {
        id: 'ws',
        name: 'WebSocket Stream',
        detail: 'Low-latency push channel. The dashboard renders every frame from this stream — or from the demo generator, interchangeably.',
        meta: ['< 100 ms hop', 'auto-reconnect'],
      },
    },
    {
      icon: <MonitorDot size={16} />,
      node: {
        id: 'dash',
        name: 'React Dashboard',
        detail: 'This command center. Gauges, charts, alerts and the ventilation chain — all driven by the TelemetryProvider contract.',
        meta: ['React + Recharts', 'Demo / real modes'],
        live: `Fan: ${fanOn ? 'ON' : 'OFF'}`,
      },
    },
  ]

  return (
    <section
      className="fixed inset-0 z-30 flex items-center justify-center p-3 md:p-8"
      style={{ opacity: o }}
      aria-label="System architecture"
    >
      <div className="pointer-events-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-[#1a2540] bg-[#050810]/88 p-4 backdrop-blur-md md:p-6">
        <div className="font-mono text-[9px] tracking-[0.3em] text-cyan-300/80 uppercase">System architecture</div>
        <h2 className="mt-1 mb-4 text-lg font-semibold text-slate-100 md:text-xl">Signal path, end to end</h2>

        {/* sensor row */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {sensorNodes.map((n) => (
            <ArchNode key={n.id} node={n} onSelect={() => setSel(n)} active={sel?.id === n.id} />
          ))}
        </div>
        <Connector />

        {/* vertical chain */}
        <div className="mx-auto flex w-full max-w-xs flex-col items-stretch">
          {chain.map((c, i) => (
            <div key={c.node.id}>
              <button
                onClick={() => setSel(c.node)}
                className={`flex min-h-[44px] w-full items-center gap-3 border px-4 py-2.5 text-left transition-all focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                  sel?.id === c.node.id
                    ? 'border-cyan-300/60 bg-cyan-300/10'
                    : 'border-[#1a2540] bg-[#0c1220]/70 hover:border-slate-500'
                }`}
              >
                <span className="text-cyan-300">{c.icon}</span>
                <span className="font-mono text-xs tracking-[0.12em] text-slate-200 uppercase">{c.node.name}</span>
              </button>
              {i < chain.length - 1 && <Connector />}
            </div>
          ))}
        </div>

        {/* outputs note */}
        <div className="mt-4 border-t border-[#1a2540] pt-3 font-mono text-[10px] leading-relaxed text-slate-500">
          Outputs: {OUTPUTS.map((x) => `${x.name} (${x.gpio})`).join(' · ')} — ventilation engages on any breach.
        </div>

        {/* detail drawer */}
        {sel && (
          <div className="mt-4 border border-cyan-300/30 bg-[#0c1220] p-4" role="dialog" aria-label={`${sel.name} details`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-sm tracking-[0.14em] text-cyan-200 uppercase">{sel.name}</div>
                <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-400">{sel.detail}</p>
              </div>
              <button
                onClick={() => setSel(null)}
                className="flex h-11 w-11 items-center justify-center text-slate-500 hover:text-slate-200"
                aria-label="Close details"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sel.meta.map((m) => (
                <span key={m} className="border border-[#1a2540] px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-slate-400 uppercase">
                  {m}
                </span>
              ))}
              {sel.live && (
                <span className="border border-cyan-300/40 px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-cyan-300 uppercase">
                  LIVE {sel.live}
                </span>
              )}
              {sel.status && (
                <span
                  className={`border px-2 py-1 font-mono text-[9px] tracking-[0.14em] uppercase ${
                    sel.status === 'OK' || sel.status === 'SAFE'
                      ? 'border-emerald-400/40 text-emerald-400'
                      : sel.status === 'WARNING' || sel.status === 'BREACH'
                        ? 'border-amber-300/40 text-amber-300'
                        : 'border-red-400/40 text-red-400'
                  }`}
                >
                  {sel.status}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ArchNode({ node, onSelect, active }: { node: NodeInfo; onSelect: () => void; active: boolean }) {
  const breach = node.status === 'BREACH'
  return (
    <button
      onClick={onSelect}
      className={`min-h-[44px] border p-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-cyan-300 ${
        active
          ? 'border-cyan-300/60 bg-cyan-300/10'
          : breach
            ? 'border-red-400/50 bg-red-400/5'
            : 'border-[#1a2540] bg-[#0c1220]/70 hover:border-slate-500'
      }`}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.14em] text-slate-100">{node.name}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${breach ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]' : 'bg-emerald-400'}`} />
      </div>
      <div className="mt-1 font-mono text-[9px] text-slate-500">{node.meta[0]}</div>
      <div className="mt-1 font-mono text-[10px] text-cyan-300/90">{node.live}</div>
    </button>
  )
}
