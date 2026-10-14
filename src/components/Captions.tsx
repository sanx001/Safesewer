import { PhaseOverlay, Kicker, Caption } from './PhaseOverlay'

/** Hero + every cinematic caption beat along the journey. */
export function Captions() {
  return (
    <>
      {/* HERO — street level */}
      <PhaseOverlay range={[0.0, 0.075]} feather={0.02}>
        <div className="text-center">
          <div className="mb-5 font-mono text-[10px] tracking-[0.5em] text-slate-400 uppercase md:text-xs">
            Safety begins below
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-50 md:text-8xl">
            SafeSewer<span className="text-cyan-300">+</span>
          </h1>
          <p className="mt-5 font-mono text-xs tracking-[0.18em] text-slate-400 uppercase md:text-sm">
            IoT-Based Hazardous Gas &amp; Environmental Safety Monitoring
          </p>
          <a
  href="#testing"
  onClick={(e) => {
    e.preventDefault()
    import('../hooks/useScrollEngine').then((m) => m.scrollToProgress(0.81))
  }}
  className="pointer-events-auto mt-8 inline-flex items-center gap-3 border border-cyan-300/40 bg-cyan-300/5 px-8 py-3.5 font-mono text-xs tracking-[0.25em] text-cyan-200 uppercase transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-300/15 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)] focus-visible:outline-2 focus-visible:outline-cyan-300"
>
  <span>Start Live Testing</span>
  <span className="text-cyan-300 transition-transform duration-300">→</span>
</a>
          <div className="mx-auto mt-14 flex w-fit flex-col items-center gap-2 text-slate-500">
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase">Scroll to descend</span>
            <span className="block h-10 w-px animate-pulse bg-gradient-to-b from-cyan-300 to-transparent" />
          </div>
        </div>
      </PhaseOverlay>

      {/* approach */}
      <PhaseOverlay range={[0.085, 0.125]} align="left">
        <div>
          <Kicker>Access Point 07</Kicker>
          <Caption title="Every shift starts at the cover." sub="Beneath this street: a confined space where methane, carbon monoxide and stale air accumulate unseen." />
        </div>
      </PhaseOverlay>

      {/* manhole opening */}
      <PhaseOverlay range={[0.145, 0.2]} align="right">
        <div>
          <Kicker>Opening</Kicker>
          <Caption title="What you can't see can hurt you." sub="Sewer atmospheres can turn lethal within minutes. SafeSewer+ watches before anyone climbs down." />
        </div>
      </PhaseOverlay>

      {/* descent */}
      <PhaseOverlay range={[0.24, 0.32]} align="left">
        <div>
          <Kicker>Descent — 24 m</Kicker>
          <Caption title="Down the shaft." sub="Concrete, rust, moisture. The deeper you go, the less you can trust your senses." />
        </div>
      </PhaseOverlay>

      {/* worker */}
      <PhaseOverlay range={[0.38, 0.46]} align="right">
        <div>
          <Kicker>Maintenance Crew</Kicker>
          <Caption title="The worker is never alone down here." sub="Cleaning operations stir trapped gases. Node 07 tracks every breath of the environment around them." />
        </div>
      </PhaseOverlay>

      {/* hazard detection */}
      <PhaseOverlay range={[0.48, 0.545]} align="left">
        <div>
          <Kicker>Hazard Detected</Kicker>
          <Caption title="Invisible, until it isn't." sub="Raw ADC channels climb past threshold — amber for methane, red for CO, haze for degraded air." />
        </div>
      </PhaseOverlay>

      {/* sensors */}
      <PhaseOverlay range={[0.555, 0.615]} align="right">
        <div>
          <Kicker>Sensor Array</Kicker>
          <Caption title="Four channels. One wall. Constant vigil." sub="MQ-4 methane · MQ-7 carbon monoxide · MQ-135 air quality · DHT11 temperature &amp; humidity" />
        </div>
      </PhaseOverlay>

      {/* ESP32 */}
      <PhaseOverlay range={[0.63, 0.715]} align="left">
        <div>
          <Kicker>Edge Controller</Kicker>
          <Caption title="ESP32-WROOM-32 decides in milliseconds." sub="GPIO 34 · 35 · 32 · 23 sample the array. GPIO 22 drives the relay. No cloud round-trip needed to save a life." />
        </div>
      </PhaseOverlay>

      {/* data transformation */}
      <PhaseOverlay range={[0.725, 0.775]} align="center">
        <div className="text-center">
          <div className="mb-3 font-mono text-[10px] tracking-[0.35em] text-cyan-300/80 uppercase">Signal → Data</div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-100 md:text-5xl">
            The tunnel becomes information.
          </h2>
        </div>
      </PhaseOverlay>

      {/* ventilation */}
      <PhaseOverlay range={[0.865, 0.915]} align="right" className="!items-start !justify-end pt-24 md:pt-28">
        <div>
          <Kicker>Automatic Ventilation</Kicker>
          <Caption title="Detect → decide → purge." sub="Threshold breached. Relay GPIO22 energises. The fan spins up and the tunnel breathes again — before thresholds are crossed twice." />
        </div>
      </PhaseOverlay>

      {/* FINAL */}
      <PhaseOverlay range={[0.975, 1.0]} feather={0.012}>
        <div className="text-center">
          <div className="mb-5 font-mono text-[10px] tracking-[0.5em] text-slate-400 uppercase md:text-xs">
            Safe below. Safe above.
          </div>
          <h2 className="text-5xl font-semibold tracking-tight text-slate-50 md:text-8xl">
            SafeSewer<span className="text-cyan-300">+</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md font-mono text-xs leading-relaxed tracking-[0.12em] text-slate-400 uppercase md:text-sm">
            Intelligent monitoring for safer underground workspaces
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              import('../hooks/useScrollEngine').then((m) => m.scrollToProgress(0.81))
            }}
            className="pointer-events-auto mt-12 inline-block border border-cyan-300/40 bg-cyan-300/5 px-10 py-4 font-mono text-xs tracking-[0.3em] text-cyan-200 uppercase transition-all hover:border-cyan-300 hover:bg-cyan-300/15 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)] focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            Explore the system
          </a>
        </div>
      </PhaseOverlay>
    </>
  )
}
