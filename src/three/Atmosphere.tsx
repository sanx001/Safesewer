import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../state/scrollStore'
import { useTelemetry } from '../state/TelemetryProvider'
import { getMode } from '../data/simulation'

/**
 * Zone-based atmosphere: fog colour/density and base lighting follow the
 * camera along the journey, tinted by the live hazard simulation.
 */
export function Atmosphere() {
  const { scene } = useThree()
  const { hazardMode, hazardLevel, status } = useTelemetry()
  const fog = useMemo(() => new THREE.FogExp2('#05070c', 0.035), [])
  const hemi = useRef<THREE.HemisphereLight>(null)
  const hazardTint = useRef(new THREE.Color('#000000'))
  const current = useRef({ density: 0.035, base: new THREE.Color('#060a12') })

  // zone keyframes: t, fog color, density, hemi intensity
  const zones = useMemo(
    () => [
      { t: 0.0, c: new THREE.Color('#080d18'), d: 0.026, h: 0.6 }, // night street
      { t: 0.18, c: new THREE.Color('#04060a'), d: 0.045, h: 0.22 }, // at opening
      { t: 0.3, c: new THREE.Color('#04070a'), d: 0.06, h: 0.3 }, // deep shaft
      { t: 0.42, c: new THREE.Color('#04100d'), d: 0.032, h: 0.16 }, // tunnel
      { t: 0.62, c: new THREE.Color('#041014'), d: 0.03, h: 0.18 }, // sensors
      { t: 0.74, c: new THREE.Color('#050a16'), d: 0.02, h: 0.2 }, // dissolve
      { t: 0.84, c: new THREE.Color('#050810'), d: 0.012, h: 0.25 }, // data void
      { t: 0.92, c: new THREE.Color('#04100d'), d: 0.03, h: 0.16 }, // back in tunnel
      { t: 1.0, c: new THREE.Color('#080d18'), d: 0.026, h: 0.6 }, // surface
    ],
    [],
  )

  useFrame((_, dt) => {
    const p = scrollState.progress
    let i = 0
    while (i < zones.length - 2 && p > zones[i + 1].t) i++
    const a = zones[i]
    const b = zones[i + 1]
    const tt = THREE.MathUtils.smoothstep((p - a.t) / (b.t - a.t), 0, 1)

    const targetColor = a.c.clone().lerp(b.c, tt)
    let targetDensity = THREE.MathUtils.lerp(a.d, b.d, tt)
    const targetHemi = THREE.MathUtils.lerp(a.h, b.h, tt)

    // hazard tint — strongest in the tunnel zones
    const inTunnel = p > 0.33 && p < 0.97
    const spec = getMode(hazardMode)
    const tintStrength = inTunnel ? hazardLevel * 0.55 : hazardLevel * 0.1
    hazardTint.current.set(spec.envColor)
    if (status !== 'SAFE' && inTunnel) {
      targetColor.lerp(hazardTint.current, tintStrength * 0.28)
      targetDensity += hazardLevel * 0.008
    }

    const k = 1 - Math.exp(-dt * 3)
    current.current.base.lerp(targetColor, k)
    current.current.density = THREE.MathUtils.lerp(current.current.density, targetDensity, k)

    fog.color.copy(current.current.base)
    fog.density = current.current.density
    if (scene.fog !== fog) scene.fog = fog
    scene.background = current.current.base

    if (hemi.current) {
      hemi.current.intensity = THREE.MathUtils.lerp(hemi.current.intensity, targetHemi, k)
    }
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#24303f', '#05070a', 0.3]} />
      {/* faint cool moonlight on the surface */}
      <directionalLight position={[6, 14, 4]} intensity={0.25} color="#7f93b8" />
    </>
  )
}
