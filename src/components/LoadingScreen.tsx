import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [done, setDone] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setDone(true), 1400)
    const t2 = setTimeout(() => setHidden(true), 2100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (hidden) return null
  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050810] transition-opacity duration-700 ${done ? 'opacity-0' : 'opacity-100'}`}
      role="status"
      aria-label="Loading SafeSewer+"
    >
      <div className="font-mono text-xs tracking-[0.4em] text-cyan-300/80 uppercase">
        Initialising telemetry
      </div>
      <div className="mt-6 h-px w-48 overflow-hidden bg-white/10">
        <div className="h-full w-full origin-left animate-[loadbar_1.3s_ease-out_forwards] bg-cyan-300" />
      </div>
      <div className="mt-4 font-mono text-[10px] tracking-[0.3em] text-slate-500">
        MQ-4 · MQ-7 · MQ-135 · DHT11 · ESP32
      </div>
      <style>{`@keyframes loadbar { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
    </div>
  )
}
