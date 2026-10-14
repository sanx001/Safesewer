import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, seg } from '../state/scrollStore'
import { labelTexture, dotSprite } from './textures'
import { useTelemetry } from '../state/TelemetryProvider'
import { getMode } from '../data/simulation'

const VOID_CENTER_Z = -200

/**
 * The dissolve: the physical sewer gives way to a digital command space —
 * grid floor, data streams along glowing conduits, holographic panels for
 * each pipeline stage, and a storm of telemetry particles.
 */
export function DataVoid({ count }: { count: number }) {
  const { hazardMode, status } = useTelemetry()
  const field = useRef<THREE.Points>(null)
  const panels = useRef<(THREE.Group | null)[]>([])
  const accentLight = useRef<THREE.PointLight>(null)
  const sprite = useMemo(() => dotSprite(), [])

  const stages = useMemo(
    () => ['SENSORS', 'ESP32', 'WI-FI', 'BACKEND', 'WEBSOCKET', 'DASHBOARD'],
    [],
  )

  const stageTex = useMemo(
    () => stages.map((s, i) => labelTexture([`0${i + 1}`, s], { bg: '#050a12', accent: '#22d3ee', fg: '#7d93ab' })),
    [stages],
  )

  // telemetry particle storm
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = -26 + Math.random() * 18
      positions[i * 3 + 2] = VOID_CENTER_Z + (Math.random() - 0.5) * 110
      seeds[i * 2] = Math.random() * Math.PI * 2
      seeds[i * 2 + 1] = 0.3 + Math.random() * 0.7
    }
    return { positions, seeds }
  }, [count])

  // conduits: glowing curves with travelling packets between stage panels
  const conduits = useMemo(() => {
    const list: { curve: THREE.CatmullRomCurve3; tube: THREE.TubeGeometry }[] = []
    for (let i = 0; i < stages.length - 1; i++) {
      const a = panelPos(i)
      const b = panelPos(i + 1)
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 2.5, 0))
      const curve = new THREE.CatmullRomCurve3([a, mid, b])
      list.push({ curve, tube: new THREE.TubeGeometry(curve, 40, 0.02, 6) })
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function panelPos(i: number): THREE.Vector3 {
    const ang = (i / stages.length) * Math.PI * 2 + Math.PI / 6
    return new THREE.Vector3(Math.cos(ang) * 10, -20.5, VOID_CENTER_Z + Math.sin(ang) * 10)
  }

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const p = scrollState.progress
    const active = seg(p, 0.72, 0.8) * (1 - seg(p, 0.87, 0.9))
    const spec = getMode(hazardMode)
    const cam = state.camera.position

    if (field.current) {
      field.current.visible = active > 0.02
      if (field.current.visible) {
        const arr = (field.current.geometry.attributes.position as THREE.BufferAttribute)
          .array as Float32Array
        for (let i = 0; i < count; i++) {
          const s = seeds[i * 2 + 1]
          arr[i * 3] += Math.sin(t * 0.4 * s + seeds[i * 2]) * 0.01
          arr[i * 3 + 1] += Math.cos(t * 0.3 * s + seeds[i * 2]) * 0.008
        }
        field.current.geometry.attributes.position.needsUpdate = true
        ;(field.current.material as THREE.PointsMaterial).opacity = active * 0.55
      }
    }

    panels.current.forEach((g, i) => {
      if (!g) return
      g.visible = active > 0.02
      g.position.y = -20.5 + Math.sin(t * 0.7 + i) * 0.25
      g.lookAt(cam) // billboard toward the travelling camera
      g.scale.setScalar(Math.max(0.001, active))
    })

    if (accentLight.current) {
      const danger = status !== 'SAFE'
      accentLight.current.intensity = active * 14
      accentLight.current.color.set(danger ? spec.envColor : '#22d3ee')
      accentLight.current.color.lerp(new THREE.Color('#22d3ee'), 0.4)
    }
    void dt
  })

  return (
    <group>
      {/* grid floor */}
      <gridHelper
        args={[140, 70, '#1d5a7d', '#0d2a40']}
        position={[0, -26, VOID_CENTER_Z]}
      />
      <gridHelper
        args={[140, 70, '#164a6a', '#0a2033']}
        position={[0, -12, VOID_CENTER_Z]}
        rotation={[Math.PI, 0, 0]}
      />
      {/* central data spire */}
      <mesh position={[0, -19, VOID_CENTER_Z]}>
        <cylinderGeometry args={[0.06, 0.4, 14, 8, 1, true]} />
        <meshBasicMaterial color="#2b9dc4" transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -18, VOID_CENTER_Z]} intensity={10} distance={40} decay={1.8} color="#1d7a9e" />

      {/* stage holo panels */}
      {stages.map((s, i) => (
        <group key={s} ref={(g) => (panels.current[i] = g)} position={panelPos(i).toArray()}>
          <mesh>
            <planeGeometry args={[5.2, 2.6]} />
            <meshBasicMaterial
              map={stageTex[i]}
              transparent
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 0, -0.06]}>
            <planeGeometry args={[5.6, 3.0]} />
            <meshBasicMaterial color="#0d3050" transparent opacity={0.55} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* conduits + packets */}
      {conduits.map((c, i) => (
        <group key={i}>
          <mesh geometry={c.tube}>
            <meshBasicMaterial color="#134a63" transparent opacity={0.6} toneMapped={false} />
          </mesh>
          <ConduitPackets curve={c.curve} sprite={sprite} />
        </group>
      ))}

      {/* telemetry storm */}
      <points ref={field} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={sprite}
          color="#2b7fa8"
          size={0.12}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      <pointLight ref={accentLight} position={[0, -18, VOID_CENTER_Z]} intensity={0} distance={60} decay={1.6} />
    </group>
  )
}

function ConduitPackets({
  curve,
  sprite,
  count = 12,
}: {
  curve: THREE.CatmullRomCurve3
  sprite: THREE.Texture
  count?: number
}) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => new Float32Array(count * 3), [count])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const p = scrollState.progress
    const active = p > 0.7 && p < 0.9
    if (!ref.current) return
    ref.current.visible = active
    if (!active) return
    const t = state.clock.elapsedTime
    const arr = (ref.current.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array
    for (let i = 0; i < count; i++) {
      const u = (t * 0.35 + i / count) % 1
      curve.getPointAt(u, tmp)
      arr[i * 3] = tmp.x
      arr[i * 3 + 1] = tmp.y
      arr[i * 3 + 2] = tmp.z
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        color="#4fd8ff"
        size={0.22}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
