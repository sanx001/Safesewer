// Telemetry services. Demo mode and real mode expose the SAME interface so the
// UI never cares where readings come from. To go live, implement RealTelemetryService
// against the deployed backend (ESP32 → Wi-Fi → Backend/API → WebSocket → React).

import type { Readings } from '../data/hardware'
import { getMode, type HazardMode } from '../data/simulation'

export type TelemetryListener = (r: Readings) => void

export interface TelemetryService {
  readonly mode: 'demo' | 'real'
  start(): void
  stop(): void
  onReading(fn: TelemetryListener): () => void
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Demo mode: stochastic generator that drifts toward the active hazard profile. */
export class DemoTelemetryService implements TelemetryService {
  readonly mode = 'demo' as const
  private listeners = new Set<TelemetryListener>()
  private timer: ReturnType<typeof setInterval> | null = null
  private current: Readings = {
    methane: 620,
    co: 470,
    airQuality: 690,
    temperature: 24,
    humidity: 68,
  }
  private hazardMode: HazardMode = 'safe'
  /** 0..1 — how strongly the hazard expresses itself (fan can pull it back down) */
  hazardLevel = 0
  /** true while the ventilation purge is actively reducing hazardLevel */
  purging = false

  setHazardMode(m: HazardMode) {
    this.hazardMode = m
  }

  start() {
    if (this.timer) return
    let last = performance.now()
    this.timer = setInterval(() => {
      const now = performance.now()
      const dt = clamp((now - last) / 1000, 0.05, 2)
      last = now
      const spec = getMode(this.hazardMode)
      const isHazard = this.hazardMode !== 'safe'

      // Hazard builds up when a hazard mode is selected; once it crosses the
      // trip point the fan purges and pulls it back down (cause → effect).
      if (isHazard && !this.purging) {
        this.hazardLevel = clamp(this.hazardLevel + dt * 0.16, 0, 1)
        if (this.hazardLevel >= 0.95) this.purging = true
      } else if (this.purging) {
        this.hazardLevel = clamp(this.hazardLevel - dt * 0.07, 0.22, 1)
        if (this.hazardLevel <= 0.24) this.purging = false
      } else {
        this.hazardLevel = clamp(this.hazardLevel - dt * 0.12, 0, 1)
      }

      const h = isHazard ? this.hazardLevel : this.hazardLevel * 0.3
      const mix = (safe: number, target: number) => safe + (target - safe) * h
      const noise = (a: number) => (Math.random() - 0.5) * a

      const safe = getMode('safe').targets
      this.current = {
        methane: clamp(mix(safe.methane, spec.targets.methane) + noise(70), 0, 4095),
        co: clamp(mix(safe.co, spec.targets.co) + noise(55), 0, 4095),
        airQuality: clamp(mix(safe.airQuality, spec.targets.airQuality) + noise(60), 0, 4095),
        temperature: clamp(mix(safe.temperature, spec.targets.temperature) + noise(0.6), -10, 80),
        humidity: clamp(mix(safe.humidity, spec.targets.humidity) + noise(1.4), 5, 100),
      }
      this.listeners.forEach((fn) => fn(this.current))
    }, 700)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  onReading(fn: TelemetryListener) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

/**
 * Real mode: drop-in replacement. Point VITE_TELEMETRY_WS_URL at the backend
 * WebSocket that relays ESP32 packets:
 *   {"methane":1234,"co":560,"airQuality":700,"temperature":26.5,"humidity":70}
 * The UI consumes it identically to demo data — no component changes needed.
 */
export class RealTelemetryService implements TelemetryService {
  readonly mode = 'real' as const

  private listeners = new Set<TelemetryListener>()
  private timer: ReturnType<typeof setInterval> | null = null
  private url: string

  constructor(url?: string) {
    this.url =
      url ??
      (import.meta.env.VITE_API_URL as string) ??
      'http://10.248.210.231:5000'
  }

  async fetchReading() {
    try {
      const response = await fetch(`${this.url}/api/sensor-data`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const reading: Readings = {
        methane: Number(data.methane ?? 0),
        co: Number(data.co ?? 0),
        airQuality: Number(data.airQuality ?? 0),
        temperature: Number(data.temperature ?? 0),
        humidity: Number(data.humidity ?? 0),
      }

      this.listeners.forEach((fn) => fn(reading))

    } catch (error) {
      console.error('SafeSewer telemetry error:', error)
    }
  }

  start() {
    if (this.timer) return

    // Fetch immediately
    this.fetchReading()

    // Update every 2.5 seconds
    this.timer = setInterval(() => {
      this.fetchReading()
    }, 2500)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  onReading(fn: TelemetryListener) {
    this.listeners.add(fn)

    return () => {
      this.listeners.delete(fn)
    }
  }
}