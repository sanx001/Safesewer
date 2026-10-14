import { SENSORS, OUTPUTS, CONTROLLER, ADC_RANGE } from '../data/hardware'
import { useProgress, windowFade } from '../hooks/useProgress'

/** Technical specifications — cinematic mono ledger, not a plain table. */
export function Specs() {
  const p = useProgress()
  const o = windowFade(p, 0.946, 0.972, 0.006)
  if (o <= 0) return null

  const rows: { k: string; v: string; note?: string }[] = [
    { k: 'Controller', v: CONTROLLER, note: 'Dual-core Xtensa · Wi-Fi + BT' },
    { k: 'Sensors', v: SENSORS.map((s) => s.name).join(' · '), note: 'MQ-4 CH₄ · MQ-7 CO · MQ-135 AQ · DHT11 T/RH' },
    { k: 'GPIO map', v: '34 · 35 · 32 · 23 → IN', note: 'GPIO22 → relay out' },
    { k: 'Outputs', v: OUTPUTS.map((x) => x.name).join(' · ') },
    { k: 'Communication', v: 'Wi-Fi → Backend/API → WebSocket' },
    { k: 'ADC range', v: `${ADC_RANGE.min}–${ADC_RANGE.max}`, note: 'raw counts — reported as Raw ADC, not ppm' },
    { k: 'Thresholds', v: 'CH₄ 1800 · CO 1500 · AQ 1800 · T 45 °C', note: 'raw ADC / °C' },
    { k: 'Safety logic', v: 'Threshold-based, on-device', note: 'fan acts even if uplink drops' },
    { k: 'Monitoring', v: 'CH₄ · CO · AQ · Temp · Humidity' },
  ]

  return (
    <section
      className="fixed inset-0 z-30 flex items-center justify-center p-4 md:p-8"
      style={{ opacity: o }}
      aria-label="Technical specifications"
    >
      <div className="pointer-events-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[#1a2540] bg-[#050810]/88 backdrop-blur-md">
        <div className="border-b border-[#1a2540] px-5 py-4">
          <div className="font-mono text-[9px] tracking-[0.3em] text-cyan-300/80 uppercase">Engineering sheet</div>
          <h2 className="mt-1 text-lg font-semibold text-slate-100 md:text-xl">Technical specifications</h2>
        </div>
        <dl>
          {rows.map((r, i) => (
            <div
              key={r.k}
              className={`flex flex-col gap-1 px-5 py-3 md:flex-row md:items-baseline md:gap-6 ${i % 2 ? 'bg-white/[0.015]' : ''}`}
            >
              <dt className="w-32 shrink-0 font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">{r.k}</dt>
              <dd className="font-mono text-xs text-slate-200 md:text-sm">
                {r.v}
                {r.note && <span className="mt-0.5 block text-[10px] text-slate-500">{r.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-[#1a2540] px-5 py-3 font-mono text-[9px] leading-relaxed tracking-[0.1em] text-slate-600 uppercase">
          Raw ADC values are uncalibrated sensor counts — never ppm. Calibration is required before
          regulatory exposure reporting.
        </div>
      </div>
    </section>
  )
}
