import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../state/scrollStore'
import { concreteTexture, rustedMetalTexture, labelTexture } from './textures'
import { DriftParticles } from './Particles'
import { useTelemetry } from '../state/TelemetryProvider'
import { getMode } from '../data/simulation'

export const TUNNEL = {
  centerY: -22.5,
  radius: 3.4,
  floorY: -25.2, // walkway height
  waterY: -25.85,
  zStart: 2,
  zEnd: -136,
}

/**
 * The main sewer: concrete bore, walkways, water channel, side pipes, cable
 * bundles, industrial lamps, signage, steam and floating particulate.
 */
export function Tunnel() {
  const concrete = useMemo(() => concreteTexture(512, 10, [104, 105, 100]), [])
  const rust = useMemo(() => rustedMetalTexture(512, 3), [])
  const { hazardMode, hazardLevel, status } = useTelemetry()

  const waterMat = useRef<THREE.MeshStandardMaterial>(null)
  const lampMats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const hazardLight = useRef<THREE.PointLight>(null)

  const signGas = useMemo(
    () => labelTexture(['GAS MONITOR', 'ACTIVE'], { bg: '#081410', accent: '#34d399', fg: '#b9c8c0' }),
    [],
  )
  const signExit = useMemo(
    () => labelTexture(['EXIT', '← SHAFT 07'], { bg: '#101408', accent: '#fbbf24', fg: '#cfc9ae' }),
    [],
  )

  const len = TUNNEL.zStart - TUNNEL.zEnd
  const zMid = (TUNNEL.zStart + TUNNEL.zEnd) / 2

  // industrial lamp positions along the bore
  const lampZ = useMemo(() => [-12, -32, -52, -72, -92, -112], [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const p = scrollState.progress
    const inTunnel = p > 0.3 && p < 0.99
    // water shimmer
    if (waterMat.current) {
      waterMat.current.envMapIntensity = 0.6 + Math.sin(t * 1.3) * 0.15
      if (waterMat.current.map) waterMat.current.map.offset.y = t * 0.02
    }
    // lamp flicker (one faulty fitting)
    lampMats.current.forEach((m, i) => {
      if (!m) return
      const flicker = i === 2 ? (Math.sin(t * 23) > 0.86 ? 0.25 : 1) : 1
      const spec = getMode(hazardMode)
      const hazardTint = inTunnel && status !== 'SAFE' ? hazardLevel : 0
      m.color.set('#cfe3ee').lerp(new THREE.Color(spec.envColor), hazardTint * 0.85)
      m.opacity = flicker
    })
    // roaming hazard light follows the camera z inside tunnel
    if (hazardLight.current) {
      const targetI = inTunnel && status !== 'SAFE' ? hazardLevel * 14 : 0
      hazardLight.current.intensity += (targetI - hazardLight.current.intensity) * Math.min(1, dt * 3)
      hazardLight.current.color.set(getMode(hazardMode).envColor)
      hazardLight.current.position.z = THREE.MathUtils.clamp(
        // roughly track camera z from scroll
        THREE.MathUtils.lerp(-10, -120, THREE.MathUtils.clamp((p - 0.35) / 0.6, 0, 1)),
        -120,
        -8,
      )
    }
  })

  const visible = scrollState.progress > 0.28 && scrollState.progress < 0.995

  return (
    <group visible={visible}>
      {/* bore */}
      <mesh position={[0, TUNNEL.centerY, zMid]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[TUNNEL.radius, TUNNEL.radius, len, 32, 24, true]} />
        <meshStandardMaterial map={concrete} color="#6e726e" roughness={0.95} side={THREE.BackSide} />
      </mesh>

      {/* end cap far down the bore (dark) */}
      <mesh position={[0, TUNNEL.centerY, TUNNEL.zEnd]} rotation={[0, 0, 0]}>
        <circleGeometry args={[TUNNEL.radius, 32]} />
        <meshBasicMaterial color="#010203" />
      </mesh>

      {/* walkways */}
      {[-1.9, 1.9].map((x) => (
        <mesh key={x} position={[x, TUNNEL.floorY - 0.15, zMid]}>
          <boxGeometry args={[2.6, 0.3, len]} />
          <meshStandardMaterial map={concrete} color="#5f6360" roughness={0.9} />
        </mesh>
      ))}

      {/* water channel */}
      <mesh position={[0, TUNNEL.waterY, zMid]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, len]} />
        <meshStandardMaterial
          ref={waterMat}
          color="#0d141c"
          roughness={0.08}
          metalness={0.85}
          map={concrete}
        />
      </mesh>

      {/* side pipes */}
      {[
        { x: -2.95, y: -21.2, r: 0.16 },
        { x: -3.05, y: -22.0, r: 0.1 },
        { x: 2.95, y: -20.9, r: 0.2 },
      ].map((s, i) => (
        <mesh key={i} position={[s.x, s.y, zMid]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[s.r, s.r, len, 12]} />
          <meshStandardMaterial
            map={rust}
            color={i === 1 ? '#4a4640' : '#6a6055'}
            metalness={0.75}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* cable bundle on right wall */}
      {[-0.06, 0.04, 0.13].map((dy, i) => (
        <mesh key={i} position={[3.18, -21.6 + dy, zMid]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, len, 8]} />
          <meshStandardMaterial color={i === 1 ? '#274058' : '#191c1f'} roughness={0.7} />
        </mesh>
      ))}

      {/* lamp fixtures + emissive strips */}
      {lampZ.map((z, i) => (
        <group key={z} position={[0, TUNNEL.centerY + 3.1, z]}>
          <mesh>
            <boxGeometry args={[0.5, 0.08, 0.18]} />
            <meshStandardMaterial color="#33383d" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[0.42, 0.03, 0.12]} />
            <meshBasicMaterial
              ref={(m) => (lampMats.current[i] = m)}
              color="#cfe3ee"
              transparent
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[0, -0.4, 0]}
            intensity={11}
            distance={19}
            decay={2}
            color="#bfd6e4"
          />
        </group>
      ))}

      {/* hazard tint light that follows the journey */}
      <pointLight ref={hazardLight} position={[0, -21.5, -50]} intensity={0} distance={26} decay={2} />

      {/* warning signs */}
      <mesh position={[-3.15, -21.9, -40]} rotation={[0, Math.PI / 2.4, 0]}>
        <planeGeometry args={[1.1, 0.55]} />
        <meshStandardMaterial map={signGas} roughness={0.7} />
      </mesh>
      <mesh position={[3.15, -21.9, -20]} rotation={[0, -Math.PI / 2.4, 0]}>
        <planeGeometry args={[1.1, 0.55]} />
        <meshStandardMaterial map={signExit} roughness={0.7} />
      </mesh>

      {/* maintenance props */}
      <mesh position={[-2.2, TUNNEL.floorY + 0.35, -34]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="#4a4234" roughness={0.85} />
      </mesh>
      <mesh position={[-2.0, TUNNEL.floorY + 0.45, -35]}>
        <cylinderGeometry args={[0.3, 0.3, 0.9, 14]} />
        <meshStandardMaterial map={rust} color="#5c4a34" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* atmosphere */}
      <DriftParticles
        count={420}
        box={[5, 4.5, 120]}
        center={[0, -22.6, -66]}
        color="#7d8fa0"
        size={0.045}
        opacity={0.3}
        speed={0.5}
        range={[0.3, 0.99]}
      />
    </group>
  )
}
