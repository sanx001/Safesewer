// SafeSewer+ hardware configuration — single source of truth.
// Raw ADC values are NEVER labelled as ppm (sensors are uncalibrated).

export type SensorId = 'mq4' | 'mq7' | 'mq135' | 'dht11'

export interface SensorSpec {
  id: SensorId
  name: string
  gpio: string
  measures: string
  unit: string
  hazardColor: string
  /** raw ADC threshold (null for DHT11 which uses temperature) */
  thresholdAdc: number | null
  thresholdLabel: string
  safeBaseline: number
  warningLevel: number
  description: string
}

export const CONTROLLER = 'ESP32-WROOM-32'
export const ADC_RANGE = { min: 0, max: 4095 } as const

export const SENSORS: SensorSpec[] = [
  {
    id: 'mq4',
    name: 'MQ-4',
    gpio: 'GPIO34',
    measures: 'Methane (CH₄)',
    unit: 'Raw ADC',
    hazardColor: '#fbbf24',
    thresholdAdc: 1800,
    thresholdLabel: 'Raw ADC > 1800',
    safeBaseline: 620,
    warningLevel: 2050,
    description:
      'SnO₂ semiconductor gas sensor tuned for methane. Analog output sampled by the ESP32 ADC on GPIO34.',
  },
  {
    id: 'mq7',
    name: 'MQ-7',
    gpio: 'GPIO35',
    measures: 'Carbon Monoxide (CO)',
    unit: 'Raw ADC',
    hazardColor: '#f87171',
    thresholdAdc: 1800,
    thresholdLabel: 'Raw ADC > 1800',
    safeBaseline: 480,
    warningLevel: 1750,
    description:
      'Carbon-monoxide sensor with high/low heater cycling. Analog output sampled on GPIO35.',
  },
  {
    id: 'mq135',
    name: 'MQ-135',
    gpio: 'GPIO32',
    measures: 'Air Quality',
    unit: 'Raw ADC',
    hazardColor: '#a3b8cc',
    thresholdAdc: 1800,
    thresholdLabel: 'Raw ADC > 1800',
    safeBaseline: 700,
    warningLevel: 2000,
    description:
      'Broad-spectrum air-quality sensor (NH₃, benzene, smoke, CO₂). Analog output sampled on GPIO32.',
  },
  {
    id: 'dht11',
    name: 'DHT11',
    gpio: 'GPIO23',
    measures: 'Temperature / Humidity',
    unit: '°C / %RH',
    hazardColor: '#fb923c',
    thresholdAdc: null,
    thresholdLabel: 'Temp > 45 °C',
    safeBaseline: 24,
    warningLevel: 47,
    description:
      'Digital temperature & humidity sensor on a single-wire bus, read on GPIO23.',
  },
]

export const OUTPUTS = [
  {
    id: 'relay',
    name: 'Relay Module',
    gpio: 'GPIO22',
    drives: 'Exhaust Fan',
    description:
      'Single-channel relay driven by GPIO22. Energises the exhaust fan contactor when any threshold is breached.',
  },
  {
    id: 'fan',
    name: 'Exhaust Fan',
    gpio: 'via Relay',
    drives: 'Forced ventilation',
    description:
      'Inline duct fan that purges contaminated air from the tunnel when the safety logic trips.',
  },
]

export const PIPELINE = [
  'MQ-4 / MQ-7 / MQ-135 / DHT11',
  'ESP32-WROOM-32',
  'Wi-Fi',
  'Backend / API',
  'WebSocket',
  'React Dashboard',
]

export type SafetyStatus = 'SAFE' | 'WARNING' | 'DANGER'

export interface Readings {
  methane: number // raw ADC 0–4095
  co: number // raw ADC 0–4095
  airQuality: number // raw ADC 0–4095
  temperature: number // °C
  humidity: number // %RH
}

export const THRESHOLDS = {
  methane: 1800,
  co: 1800,
  airQuality: 1800,
  temperature: 45,
} as const