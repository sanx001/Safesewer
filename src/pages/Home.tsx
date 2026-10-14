import { SceneCanvas } from '../three/SceneCanvas'
import { TelemetryProvider } from '../state/TelemetryProvider'
import { useScrollEngine, SCROLL_TRACK_VH } from '../hooks/useScrollEngine'
import { Navigation } from '../components/Navigation'
import { LoadingScreen } from '../components/LoadingScreen'
import { Captions } from '../components/Captions'
import { CommandCenter } from '../components/CommandCenter'
import { SimulationPanel } from '../components/SimulationPanel'
import { Architecture } from '../components/Architecture'
import { Specs } from '../components/Specs'
import { HudChip } from '../components/HudChip'
import { CustomCursor } from '../components/CustomCursor'

export default function Home() {
  useScrollEngine()

  return (
    <TelemetryProvider>
      {/* a11y: screen-reader summary of the cinematic journey */}
      <div className="sr-only" role="doc-subtitle">
        SafeSewer+ is an IoT hazardous-gas monitoring system. This page is a scroll-driven 3D
        journey: street surface, manhole opening, shaft descent, sewer tunnel, worker safety,
        sensor array (MQ-4 methane, MQ-7 carbon monoxide, MQ-135 air quality, DHT11 climate),
        ESP32-WROOM-32 controller, data pipeline, live command center, hazard simulation,
        automatic ventilation, system architecture and specifications.
      </div>

      <LoadingScreen />
      <SceneCanvas />
      <CustomCursor />
      <Navigation />
      <HudChip />
      <Captions />
      <CommandCenter />
      <SimulationPanel />
      <Architecture />
      <Specs />

      {/* invisible scroll track — the journey's timeline */}
      <div id="scroll-track" style={{ height: `${SCROLL_TRACK_VH}vh` }} aria-hidden="true" />
    </TelemetryProvider>
  )
}
