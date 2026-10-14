import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../state/scrollStore'
import { labelTexture, dotSprite } from './textures'
import { useTelemetry } from '../state/TelemetryProvider'
import { ESP32_POS } from './Sensors'

/**
 * ESP32-WROOM-32 dev board, wall-mounted on a junction box. GPIO silkscreen,
 * pin headers, USB port, pulsing status LED and an uplink particle stream.
 */
export function Esp32() {
  const { status, hazardLevel } = useTelemetry()
  const led = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.PointLight>(null)
  const uplink = useRef<THREE.Points>(null)

  const silk = useMemo(
    () =>
      labelTexture(
        ['ESP32-WROOM-32', '34·35·32·23 IN — 22 RELAY', 'SAFESEWER+ CTRL'],
        { w: 512, h: 256, bg: '#101827', accent: '#22d3ee', fg: '#8fa3bb', font: '600 38px "JetBrains Mono", monospace' },
      ),
    [],
  )
  const sprite = useMemo(() => dotSprite(), [])

  const pins = useMemo(() => Array.from({ length: 15 }, (_, i) => i), [])

  // uplink stream: board → up the shaft (Wi-Fi to backend)
  const uplinkCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        ESP32_POS.clone().add(new THREE.Vector3(0.1, 0.35, 0)),
        new THREE.Vector3(-2.4, -20, -60),
        new THREE.Vector3(-1, -12, -20),
        new THREE.Vector3(0, -2, -0.5),
        new THREE.Vector3(0, 3, 0.5),
      ]),
    [],
  )
  const uplinkCount = 26
  const uplinkPositions = useMemo(() => new Float32Array(uplinkCount * 3), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p = scrollState.progress
    // status LED: calm cyan blink → urgent red under hazard
    if (led.current) {
      const m = led.current.material as THREE.MeshBasicMaterial
      const danger = status !== 'SAFE'
      const blink = danger ? (Math.sin(t * 12) > 0 ? 1 : 0.1) : 0.4 + Math.sin(t * 2.4) * 0.35
      m.color.set(danger ? '#ef4444' : '#22d3ee')
      m.opacity = blink
    }
    if (glow.current) {
      glow.current.intensity = 2 + hazardLevel * 5 + Math.sin(t * 2.4) * 0.5
    }
    // uplink packets accelerate when a hazard is being reported
    if (uplink.current) {
      const active = p > 0.6 && p < 0.99
      uplink.current.visible = active
      if (active) {
        const speed = 0.1 + hazardLevel * 0.25
        const arr = (uplink.current.geometry.attributes.position as THREE.BufferAttribute)
          .array as Float32Array
        for (let i = 0; i < uplinkCount; i++) {
          const u = (t * speed + i / uplinkCount) % 1
          uplinkCurve.getPointAt(u, tmp)
          arr[i * 3] = tmp.x
          arr[i * 3 + 1] = tmp.y
          arr[i * 3 + 2] = tmp.z
        }
        uplink.current.geometry.attributes.position.needsUpdate = true
      }
    }
  })

  const visible = scrollState.progress > 0.3 && scrollState.progress < 0.995

  return (
    <group visible={visible}>
      {/* junction box + board, facing +X into the tunnel */}
      <group position={ESP32_POS.toArray()} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[0.85, 0.7, 0.12]} />
          <meshStandardMaterial color="#14181d" roughness={0.6} metalness={0.35} />
        </mesh>
        {/* PCB */}
        <mesh>
          <boxGeometry args={[0.56, 0.3, 0.02]} />
          <meshStandardMaterial color="#14213b" roughness={0.5} />
        </mesh>
        {/* silkscreen */}
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.5, 0.25]} />
          <meshStandardMaterial map={silk} transparent opacity={0.9} />
        </mesh>
        {/* module shield */}
        <mesh position={[-0.14, 0.05, 0.03]}>
          <boxGeometry args={[0.2, 0.16, 0.025]} />
          <meshStandardMaterial color="#aab2ba" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* USB port */}
        <mesh position={[0.26, -0.05, 0.03]}>
          <boxGeometry args={[0.08, 0.09, 0.04]} />
          <meshStandardMaterial color="#c3c9cf" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* pin headers */}
        {pins.map((i) => (
          <mesh key={`a${i}`} position={[-0.24 + i * 0.034, 0.165, 0.02]}>
            <boxGeometry args={[0.014, 0.03, 0.03]} />
            <meshStandardMaterial color="#d8b95c" metalness={0.85} roughness={0.3} />
          </mesh>
        ))}
        {pins.map((i) => (
          <mesh key={`b${i}`} position={[-0.24 + i * 0.034, -0.165, 0.02]}>
            <boxGeometry args={[0.014, 0.03, 0.03]} />
            <meshStandardMaterial color="#d8b95c" metalness={0.85} roughness={0.3} />
          </mesh>
        ))}
        {/* status LED */}
        <mesh ref={led} position={[0.1, 0.05, 0.035]}>
          <sphereGeometry args={[0.018, 10, 10]} />
          <meshBasicMaterial color="#22d3ee" transparent toneMapped={false} />
        </mesh>
      </group>

      <pointLight ref={glow} position={[ESP32_POS.x + 0.6, ESP32_POS.y + 0.2, ESP32_POS.z]} intensity={2} distance={7} color="#22d3ee" />

      {/* uplink packet stream */}
      <points ref={uplink} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[uplinkPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={sprite}
          color="#22d3ee"
          size={0.11}
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
