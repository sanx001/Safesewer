import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, seg } from '../state/scrollStore'
import { SENSORS } from '../data/hardware'
import { labelTexture, dotSprite } from './textures'
import { useTelemetry } from '../state/TelemetryProvider'

export const SENSOR_POS = new THREE.Vector3(-2.95, -22.8, -70)
export const ESP32_POS = new THREE.Vector3(-2.9, -23.3, -95)

interface WireSpec {
  curve: THREE.CatmullRomCurve3
  tube: THREE.TubeGeometry
  color: string
}

/** One animated data packet stream travelling a wire curve. */
function WirePackets({ curve, color, count = 10, active }: { curve: THREE.CatmullRomCurve3; color: string; count?: number; active: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null)
  const sprite = useMemo(() => dotSprite(), [])
  const positions = useMemo(() => new Float32Array(count * 3), [count])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const boost = 0.6 + active.current * 1.8
    const arr = (ref.current.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array
    for (let i = 0; i < count; i++) {
      const u = (t * 0.22 * boost + i / count) % 1
      curve.getPointAt(u, tmp)
      arr[i * 3] = tmp.x
      arr[i * 3 + 1] = tmp.y
      arr[i * 3 + 2] = tmp.z
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    const m = ref.current.material as THREE.PointsMaterial
    m.opacity = 0.35 + active.current * 0.6
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        color={color}
        size={0.09}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

/**
 * Wall-mounted sensor cluster (MQ-4, MQ-7, MQ-135, DHT11) wired to the ESP32.
 * LEDs ignite as the camera approaches; packets stream faster under hazard.
 */
export function Sensors() {
  const { hazardLevel, readings } = useTelemetry()
  const activation = useRef(0)
  const leds = useRef<(THREE.Mesh | null)[]>([])
  const plateTex = useMemo(
    () => labelTexture(['SAFESEWER+ NODE 07', 'MQ-4 · MQ-7 · MQ-135 · DHT11'], { bg: '#0a0f14', accent: '#22d3ee' }),
    [],
  )

  const wires = useMemo<WireSpec[]>(() => {
    return SENSORS.map((s, i) => {
      const from = new THREE.Vector3(SENSOR_POS.x + 0.05, SENSOR_POS.y + 0.42 - i * 0.28, SENSOR_POS.z + 0.32)
      const to = new THREE.Vector3(ESP32_POS.x + 0.04, ESP32_POS.y + 0.3 - i * 0.12, ESP32_POS.z + 0.2)
      const mid1 = from.clone().add(new THREE.Vector3(0, -0.5 - i * 0.1, -6))
      const mid2 = to.clone().add(new THREE.Vector3(0.1, -0.3, 8))
      const curve = new THREE.CatmullRomCurve3([from, mid1, mid2, to])
      return { curve, tube: new THREE.TubeGeometry(curve, 48, 0.016, 6), color: s.hazardColor }
    })
  }, [])

  useFrame((state, dt) => {
    const p = scrollState.progress
    // camera inspects the cluster during 52–66%
    const near = seg(p, 0.5, 0.56) * (1 - seg(p, 0.66, 0.72))
    activation.current += (near - activation.current) * Math.min(1, dt * 4)
    const t = state.clock.elapsedTime
    leds.current.forEach((led, i) => {
      if (!led) return
      const m = led.material as THREE.MeshBasicMaterial
      const sensor = SENSORS[i]
      const breached =
        sensor.id === 'mq4'
          ? readings.methane > 1800
          : sensor.id === 'mq7'
            ? readings.co > 1500
            : sensor.id === 'mq135'
              ? readings.airQuality > 1800
              : readings.temperature > 45
      const pulse = breached ? (Math.sin(t * 9 + i) > 0 ? 1 : 0.2) : 0.55 + activation.current * 0.45
      m.color.set(breached ? '#ef4444' : sensor.hazardColor)
      m.opacity = pulse
    })
  })

  const visible = scrollState.progress > 0.3 && scrollState.progress < 0.99

  return (
    <group visible={visible}>
      {/* mounting plate */}
      <group position={SENSOR_POS.toArray()} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.3, 1.5, 0.06]} />
          <meshStandardMaterial color="#151a20" roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.62, 0.04]}>
          <planeGeometry args={[1.1, 0.28]} />
          <meshStandardMaterial map={plateTex} />
        </mesh>

        {SENSORS.map((s, i) => {
          const y = 0.42 - i * 0.28
          const isDht = s.id === 'dht11'
          return (
            <group key={s.id} position={[-0.28 + (i % 2) * 0.56, y - Math.floor(i / 2) * 0.0, 0.08]}>
              {/* PCB */}
              <mesh>
                <boxGeometry args={[0.3, 0.2, 0.025]} />
                <meshStandardMaterial color={isDht ? '#1e3a5c' : '#12331c'} roughness={0.55} />
              </mesh>
              {/* sensing element */}
              {isDht ? (
                <mesh position={[-0.07, 0, 0.035]}>
                  <boxGeometry args={[0.1, 0.13, 0.05]} />
                  <meshStandardMaterial color="#2456a0" roughness={0.6} />
                </mesh>
              ) : (
                <mesh position={[-0.06, 0, 0.05]}>
                  <cylinderGeometry args={[0.055, 0.06, 0.08, 16]} />
                  <meshStandardMaterial color="#b9bcc0" metalness={0.9} roughness={0.3} />
                </mesh>
              )}
              {/* status LED */}
              <mesh ref={(m) => (leds.current[i] = m)} position={[0.11, 0.05, 0.03]}>
                <sphereGeometry args={[0.016, 8, 8]} />
                <meshBasicMaterial color={s.hazardColor} transparent toneMapped={false} />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* wiring to ESP32 */}
      {wires.map((w, i) => (
        <group key={i}>
          <mesh geometry={w.tube}>
            <meshStandardMaterial color="#20262c" roughness={0.6} />
          </mesh>
          <WirePackets curve={w.curve} color={w.color} active={activation} />
        </group>
      ))}

      {/* local accent light at the cluster */}
      <pointLight
        position={[SENSOR_POS.x + 0.7, SENSOR_POS.y + 0.4, SENSOR_POS.z]}
        intensity={2 + hazardLevel * 6}
        distance={8}
        color="#22d3ee"
      />
    </group>
  )
}
