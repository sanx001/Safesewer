import type { Readings, SafetyStatus } from './hardware'

export type HazardMode =
  | 'safe'
  | 'methane'
  | 'co'
  | 'airQuality'
  | 'temperature'
  | 'multiple'

export interface HazardModeSpec {
  id: HazardMode
  label: string
  short: string
  status: SafetyStatus
  fanOn: boolean
  envColor: string
  description: string
  /** steady-state targets the demo generator drifts toward */
  targets: Readings
}

export const HAZARD_MODES: HazardModeSpec[] = [
  {
    id: 'safe',
    label: 'Safe Conditions',
    short: 'Safe',
    status: 'SAFE',
    fanOn: false,
    envColor: '#22d3ee',
    description: 'All channels below threshold. Ventilation idle.',
    targets: { methane: 620, co: 470, airQuality: 690, temperature: 24, humidity: 68 },
  },
  {
    id: 'methane',
    label: 'Methane Warning',
    short: 'CH₄',
    status: 'WARNING',
    fanOn: true,
    envColor: '#fbbf24',
    description: 'CH₄ raw ADC climbs past 1800. Relay GPIO22 energises the exhaust fan.',
    targets: { methane: 2350, co: 520, airQuality: 760, temperature: 26, humidity: 70 },
  },
  {
    id: 'co',
    label: 'CO Warning',
    short: 'CO',
    status: 'WARNING',
    fanOn: true,
    envColor: '#f87171',
    description: 'CO raw ADC climbs past 1500. Worker is alerted immediately.',
    targets: { methane: 700, co: 1980, airQuality: 820, temperature: 26, humidity: 69 },
  },
  {
    id: 'airQuality',
    label: 'Air Quality Warning',
    short: 'AQ',
    status: 'WARNING',
    fanOn: true,
    envColor: '#a3b8cc',
    description: 'MQ-135 raw ADC past 1800 — stale, contaminated air mass in the tunnel.',
    targets: { methane: 720, co: 560, airQuality: 2280, temperature: 27, humidity: 78 },
  },
  {
    id: 'temperature',
    label: 'High Temperature',
    short: 'TEMP',
    status: 'WARNING',
    fanOn: true,
    envColor: '#fb923c',
    description: 'DHT11 reads above 45 °C — heat stress risk for the crew.',
    targets: { methane: 680, co: 510, airQuality: 740, temperature: 49, humidity: 41 },
  },
  {
    id: 'multiple',
    label: 'Multiple Hazards',
    short: 'MULTI',
    status: 'DANGER',
    fanOn: true,
    envColor: '#ef4444',
    description:
      'Several channels breach simultaneously. DANGER state, fan at full duty, evacuation alert.',
    targets: { methane: 2600, co: 2200, airQuality: 2500, temperature: 50, humidity: 55 },
  },
]

export const getMode = (id: HazardMode): HazardModeSpec =>
  HAZARD_MODES.find((m) => m.id === id) ?? HAZARD_MODES[0]
