import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../state/scrollStore'
import { rustedMetalTexture, labelTexture, dotSprite } from './textures'
// dotSprite used by FanStream below
import { useTelemetry } from '../state/TelemetryProvider'

export const FAN_POS = new THREE.Vector3(3.0, -22.4, -60)

/**
 * Wall-mounted exhaust fan driven by relay GPIO22. Blades spin up when the
 * safety logic trips; airflow particles sweep contaminants toward the shaft.
 */
export function Fan() {
  const { fanOn } = useTelemetry()
  const blades = useRef<THREE.Group>(null)
  const speed = useRef(0)
  const rust = useMemo(() => rustedMetalTexture(256, 1), [])
  const grillTex = useMemo(
    () => labelTexture(['EXHAUST', 'RELAY · GPIO22'], { bg: '#14100a', accent: '#fbbf24' }),
    [],
  )

  useFrame((_, dt) => {
    speed.current += ((fanOn ? 14 : 0) - speed.current) * Math.min(1, dt * (fanOn ? 0.9 : 1.6))
    if (blades.current) blades.current.rotation.x += speed.current * dt
  })

  const visible = scrollState.progress > 0.3 && scrollState.progress < 0.995

  return (
    <group visible={visible} position={FAN_POS.toArray()} rotation={[0, -Math.PI / 2, 0]}>
      {/* housing */}
      <mesh>
        <cylinderGeometry args={[0.72, 0.72, 0.28, 32, 1, true]} />
        <meshStandardMaterial map={rust} color="#5b5751" metalness={0.8} roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.13]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.72, 32]} />
        <meshStandardMaterial color="#26292d" roughness={0.7} />
      </mesh>
      {/* blades */}
      <group ref={blades} position={[0, 0, 0.05]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]}>
            <boxGeometry args={[0.16, 0.58, 0.02]} />
            <meshStandardMaterial color="#3d434a" metalness={0.85} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
          <meshStandardMaterial color="#565c63" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
      {/* safety grille */}
      {[0.3, 0.5, 0.68].map((r) => (
        <mesh key={r} position={[0, 0, 0.16]}>
          <torusGeometry args={[r, 0.012, 6, 32]} />
          <meshStandardMaterial color="#43484e" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, -1.0, 0]}>
        <planeGeometry args={[0.9, 0.4]} />
        <meshStandardMaterial map={grillTex} />
      </mesh>
      {/* accent light so the unit reads in the dark bore */}
      <pointLight position={[-0.6, 0.3, 0.6]} intensity={4} distance={7} decay={2} color="#cfe0ea" />
    </group>
  )
}

/** Separate airflow particle field (needs to live outside the rotated group). */
export function FanStream() {
  const { fanOn } = useTelemetry()
  const stream = useRef<THREE.Points>(null)
  const sprite = useMemo(() => dotSprite(), [])
  const COUNT = 90
  const seeds = useMemo(() => {
    const s = new Float32Array(COUNT * 2)
    for (let i = 0; i < COUNT; i++) {
      s[i * 2] = Math.random()
      s[i * 2 + 1] = Math.random() * Math.PI * 2
    }
    return s
  }, [])
  const positions = useMemo(() => new Float32Array(COUNT * 3), [])
  const intensity = useRef(0)

  useFrame((state, dt) => {
    intensity.current += ((fanOn ? 1 : 0) - intensity.current) * Math.min(1, dt * 1.2)
    const s = stream.current
    if (!s) return
    s.visible = intensity.current > 0.05
    if (!s.visible) return
    const t = state.clock.elapsedTime
    const arr = (s.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      const phase = (seeds[i * 2] + t * 0.09) % 1
      const ang = seeds[i * 2 + 1] + t * 2.2
      const r = 0.5 - phase * 0.3
      arr[i * 3] = FAN_POS.x - 0.3 - phase * 1.2 + Math.cos(ang) * r * 0.35
      arr[i * 3 + 1] = FAN_POS.y + Math.sin(ang) * r
      arr[i * 3 + 2] = FAN_POS.z + phase * 26
    }
    s.geometry.attributes.position.needsUpdate = true
    ;(s.material as THREE.PointsMaterial).opacity = intensity.current * 0.5
  })

  return (
    <points ref={stream} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        color="#9fd8e8"
        size={0.14}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
