import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { THRESHOLDS, type Readings, type SafetyStatus } from '../data/hardware'
import { getMode, type HazardMode } from '../data/simulation'
import {
  DemoTelemetryService,
  RealTelemetryService,
  type TelemetryService,
} from '../services/telemetry'

export interface TimelineEvent {
  id: number
  time: string
  kind: 'info' | 'warning' | 'danger' | 'fan' | 'system'
  message: string
}

interface TelemetryState {
  serviceMode: 'demo' | 'real'
  readings: Readings
  history: Readings[]
  status: SafetyStatus
  fanOn: boolean
  purging: boolean
  hazardLevel: number
  hazardMode: HazardMode
  setHazardMode: (m: HazardMode) => void
  events: TimelineEvent[]
}

const Ctx = createContext<TelemetryState | null>(null)

let eventId = 0
const stamp = () =>
  new Date().toLocaleTimeString('en-GB', { hour12: false })

function mkEvent(kind: TimelineEvent['kind'], message: string): TimelineEvent {
  return { id: ++eventId, time: stamp(), kind, message }
}

function computeStatus(r: Readings): SafetyStatus {
  const breaches = [
    r.methane > THRESHOLDS.methane,
    r.co > THRESHOLDS.co,
    r.airQuality > THRESHOLDS.airQuality,
    r.temperature > THRESHOLDS.temperature,
  ].filter(Boolean).length
  if (breaches >= 2) return 'DANGER'
  if (breaches === 1) return 'WARNING'
  return 'SAFE'
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const serviceRef = useRef<TelemetryService | null>(null)
  if (!serviceRef.current) {
    const url = import.meta.env.VITE_API_URL as string | undefined
serviceRef.current = new RealTelemetryService(url)
  }
  const service = serviceRef.current
  const demo = service instanceof DemoTelemetryService ? service : null

  const [readings, setReadings] = useState<Readings>({
    methane: 620,
    co: 470,
    airQuality: 690,
    temperature: 24,
    humidity: 68,
  })
  const [history, setHistory] = useState<Readings[]>([])
  const [hazardMode, setHazardModeState] = useState<HazardMode>('safe')
  const [hazardLevel, setHazardLevel] = useState(0)
  const [purging, setPurging] = useState(false)
  const [events, setEvents] = useState<TimelineEvent[]>([
    mkEvent('system', 'SafeSewer+ telemetry link established'),
    mkEvent('info', 'Baseline calibration snapshot recorded (raw ADC)'),
  ])
  const prevStatus = useRef<SafetyStatus>('SAFE')
  const prevFan = useRef(false)
  const prevMode = useRef<HazardMode>('safe')

  const status = computeStatus(readings)
  const spec = getMode(hazardMode)
  const fanOn = demo ? demo.hazardLevel > 0.4 && spec.fanOn : status !== 'SAFE'

  useEffect(() => {
    service.start()
    const off = service.onReading((r) => {
      setReadings(r)
      setHistory((h) => [...h.slice(-59), r])
      if (demo) {
        setHazardLevel(demo.hazardLevel)
        setPurging(demo.purging)
      }
    })
    return () => {
      off()
      service.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // log transitions
  useEffect(() => {
    if (status !== prevStatus.current) {
      if (status === 'WARNING')
        setEvents((e) => [mkEvent('warning', 'Threshold breach detected — WARNING state'), ...e].slice(0, 40))
      else if (status === 'DANGER')
        setEvents((e) => [mkEvent('danger', 'Multiple thresholds breached — DANGER state'), ...e].slice(0, 40))
      else
        setEvents((e) => [mkEvent('info', 'All channels nominal — SAFE state restored'), ...e].slice(0, 40))
      prevStatus.current = status
    }
  }, [status])

  useEffect(() => {
    if (fanOn !== prevFan.current) {
      setEvents((e) =>
        [
          mkEvent('fan', fanOn ? 'Relay GPIO22 energised — exhaust fan ON' : 'Relay GPIO22 released — exhaust fan OFF'),
          ...e,
        ].slice(0, 40),
      )
      prevFan.current = fanOn
    }
  }, [fanOn])

  const setHazardMode = (m: HazardMode) => {
    setHazardModeState(m)
    demo?.setHazardMode(m)
    if (m !== prevMode.current) {
      setEvents((e) => [mkEvent('info', `Simulation profile → ${getMode(m).label}`), ...e].slice(0, 40))
      prevMode.current = m
    }
  }

  const value = useMemo<TelemetryState>(
    () => ({
      serviceMode: service.mode,
      readings,
      history,
      status,
      fanOn,
      purging,
      hazardLevel,
      hazardMode,
      setHazardMode,
      events,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readings, history, status, fanOn, purging, hazardLevel, hazardMode, events],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTelemetry(): TelemetryState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTelemetry outside provider')
  return v
}
