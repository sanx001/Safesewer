import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, seg, smooth } from '../state/scrollStore'
import { TUNNEL } from './Tunnel'
import { useTelemetry } from '../state/TelemetryProvider'

/**
 * Procedural sewer maintenance worker: helmet + headlamp, hi-vis vest,
 * gloves, boots, handheld gas detector. Walks in, kneels to clean, and is
 * visibly protected by the monitoring system when hazards rise.
 */
export function Worker() {
  const root = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const beacon = useRef<THREE.Mesh>(null)
  const beaconLight = useRef<THREE.PointLight>(null)
  const detectorLed = useRef<THREE.Mesh>(null)
  const headlamp = useRef<THREE.SpotLight>(null)
  const lampTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(1.5, TUNNEL.floorY + 0.8, -60)
    return o
  }, [])
  const { status } = useTelemetry()

  const suit = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3d4854', roughness: 0.8 }),
    [],
  )
  const vest = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c96a1e', roughness: 0.7 }),
    [],
  )
  const stripe = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d8dee4',
        roughness: 0.25,
        metalness: 0.4,
        emissive: '#9fb2c4',
        emissiveIntensity: 0.35,
      }),
    [],
  )
  const skin = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8a6b52', roughness: 0.7 }),
    [],
  )
  const rubber = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1d2126', roughness: 0.6 }),
    [],
  )

  useFrame((state) => {
    const p = scrollState.progress
    const t = state.clock.elapsedTime
    const g = root.current
    if (!g) return
    g.visible = p > 0.3 && p < 0.99
    if (!g.visible) return

    const walk = smooth(seg(p, 0.36, 0.46)) // 0→1 walking deeper
    const kneel = smooth(seg(p, 0.47, 0.52)) * (1 - smooth(seg(p, 0.6, 0.66)))
    const walking = walk > 0.01 && walk < 0.99

    // position: enters from shaft side, advances toward hazard zone
    g.position.set(1.5, TUNNEL.floorY, -33 - walk * 12)
    g.rotation.y = 0 // facing -Z (deeper)

    // walk cycle
    const phase = walk * 26
    const swing = walking ? Math.sin(phase) : 0
    const bobAmp = walking ? 0.045 : 0.012
    g.position.y = TUNNEL.floorY + Math.abs(Math.sin(phase)) * bobAmp - kneel * 0.52

    if (legL.current) legL.current.rotation.x = swing * 0.55 + kneel * -1.5
    if (legR.current) legR.current.rotation.x = -swing * 0.55 + kneel * 0.25
    if (armL.current) armL.current.rotation.x = -swing * 0.4 + kneel * -0.9
    if (armR.current) {
      // right arm holds detector while walking; scrubs while kneeling
      const scrub = kneel * Math.sin(t * 6) * 0.35
      armR.current.rotation.x = swing * 0.4 - 0.5 - kneel * 0.5 + scrub
      armR.current.rotation.z = kneel * 0.3
    }
    if (torso.current) {
      torso.current.rotation.x = kneel * 0.5 + (walking ? 0.06 : 0)
      // subtle breathing
      torso.current.scale.y = 1 + Math.sin(t * 1.4) * 0.008
    }

    // headlamp follows gaze
    if (headlamp.current) {
      lampTarget.position.set(1.5, TUNNEL.floorY + 0.7 - kneel * 0.4, g.position.z - 12)
      headlamp.current.intensity = 26
    }

    // protection beacon: pulses calmly cyan when SAFE, urgent red otherwise
    const danger = status !== 'SAFE'
    const blink = danger ? (Math.sin(t * 10) > 0 ? 1 : 0.15) : 0.7 + Math.sin(t * 2) * 0.2
    if (beacon.current) {
      const m = beacon.current.material as THREE.MeshBasicMaterial
      m.color.set(danger ? '#ef4444' : '#22d3ee')
      m.opacity = blink
    }
    if (beaconLight.current) {
      beaconLight.current.color.set(danger ? '#ef4444' : '#22d3ee')
      beaconLight.current.intensity = blink * (danger ? 8 : 2)
    }
    if (detectorLed.current) {
      const m = detectorLed.current.material as THREE.MeshBasicMaterial
      m.color.set(danger ? '#ef4444' : '#34d399')
    }
  })

  return (
    <group ref={root} position={[1.5, TUNNEL.floorY, -33]}>
      {/* torso group (breathes, leans) */}
      <group ref={torso} position={[0, 1.05, 0]}>
        <mesh position={[0, 0.15, 0]} material={vest}>
          <capsuleGeometry args={[0.21, 0.42, 6, 14]} />
        </mesh>
        {/* reflective stripes */}
        {[0.05, 0.28].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={stripe}>
            <torusGeometry args={[0.225, 0.018, 6, 20]} />
          </mesh>
        ))}
        {/* head + helmet */}
        <group position={[0, 0.62, 0]}>
          <mesh material={skin}>
            <sphereGeometry args={[0.13, 16, 16]} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.155, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#e8b93b" roughness={0.35} />
          </mesh>
          {/* helmet brim */}
          <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.15, 0.02, 6, 20]} />
            <meshStandardMaterial color="#d9a92e" roughness={0.4} />
          </mesh>
          {/* headlamp */}
          <mesh position={[0, 0.06, -0.15]}>
            <boxGeometry args={[0.07, 0.05, 0.05]} />
            <meshBasicMaterial color="#fff2cf" toneMapped={false} />
          </mesh>
          <primitive object={lampTarget} />
          <spotLight
            ref={headlamp}
            position={[0, 0.06, -0.18]}
            angle={0.42}
            penumbra={0.6}
            distance={20}
            intensity={26}
            color="#fff0cf"
            target={lampTarget}
          />
        </group>

        {/* left arm */}
        <group ref={armL} position={[-0.27, 0.42, 0]}>
          <mesh position={[0, -0.2, 0]} material={suit}>
            <capsuleGeometry args={[0.055, 0.3, 4, 10]} />
          </mesh>
          <mesh position={[0, -0.46, 0]} material={rubber}>
            <sphereGeometry args={[0.06, 10, 10]} />
          </mesh>
        </group>
        {/* right arm + detector */}
        <group ref={armR} position={[0.27, 0.42, 0]}>
          <mesh position={[0, -0.2, 0]} material={suit}>
            <capsuleGeometry args={[0.055, 0.3, 4, 10]} />
          </mesh>
          <mesh position={[0, -0.46, 0]} material={rubber}>
            <sphereGeometry args={[0.06, 10, 10]} />
          </mesh>
          {/* handheld gas detector */}
          <group position={[0, -0.5, -0.08]}>
            <mesh>
              <boxGeometry args={[0.08, 0.13, 0.035]} />
              <meshStandardMaterial color="#232a31" roughness={0.4} />
            </mesh>
            <mesh ref={detectorLed} position={[0, 0.05, -0.02]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshBasicMaterial color="#34d399" toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* protection beacon above helmet */}
        <mesh ref={beacon} position={[0, 0.92, 0]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color="#22d3ee" transparent toneMapped={false} />
        </mesh>
        <pointLight ref={beaconLight} position={[0, 0.92, 0]} intensity={2} distance={5} />
        {/* soft work-light so the figure reads in the dark bore */}
        <pointLight position={[0.4, 0.6, 0.6]} intensity={3.5} distance={6} decay={2} color="#cfe0ea" />
      </group>

      {/* legs */}
      <group ref={legL} position={[-0.11, 0.98, 0]}>
        <mesh position={[0, -0.3, 0]} material={suit}>
          <capsuleGeometry args={[0.07, 0.45, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.82, -0.03]} material={rubber}>
          <boxGeometry args={[0.13, 0.1, 0.26]} />
        </mesh>
      </group>
      <group ref={legR} position={[0.11, 0.98, 0]}>
        <mesh position={[0, -0.3, 0]} material={suit}>
          <capsuleGeometry args={[0.07, 0.45, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.82, -0.03]} material={rubber}>
          <boxGeometry args={[0.13, 0.1, 0.26]} />
        </mesh>
      </group>
    </group>
  )
}
