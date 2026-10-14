import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../state/scrollStore'
import { dotSprite } from './textures'
import { useTelemetry } from '../state/TelemetryProvider'
import type { HazardMode } from '../data/simulation'
import { FAN_POS } from './Fan'

const ZONE = { x: 0.6, y: -23, z: -55, w: 5, h: 4, d: 26 }

const MODE_COLORS: Record<HazardMode, string[]> = {
  safe: ['#3d5a66'],
  methane: ['#fbbf24', '#f59e0b', '#d97706'],
  co: ['#f87171', '#ef4444', '#b91c1c'],
  airQuality: ['#a3b8cc', '#8fa3b8', '#6b8299'],
  temperature: ['#fb923c', '#f97316', '#ea580c'],
  multiple: ['#fbbf24', '#f87171', '#a3b8cc', '#fb923c'],
}

/**
 * Subtle cinematic hazard visualisation: coloured gas volumes and heat
 * shimmer that build with the simulated readings and are physically pulled
 * toward the exhaust fan during a purge.
 */
export function HazardField({ count }: { count: number }) {
  const { hazardMode, hazardLevel, fanOn, purging, status } = useTelemetry()
  const ref = useRef<THREE.Points>(null)
  const sprite = useMemo(() => dotSprite(), [])

  const { positions, colors, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = ZONE.x + (Math.random() - 0.5) * ZONE.w
      positions[i * 3 + 1] = ZONE.y + (Math.random() - 0.5) * ZONE.h
      positions[i * 3 + 2] = ZONE.z + (Math.random() - 0.5) * ZONE.d
      seeds[i * 2] = Math.random() * Math.PI * 2
      seeds[i * 2 + 1] = 0.4 + Math.random() * 0.6
    }
    return { positions, colors, seeds }
  }, [count])

  const tmpColor = useMemo(() => new THREE.Color(), [])

  useFrame((state, dt) => {
    const pts = ref.current
    if (!pts) return
    const p = scrollState.progress
    const inRange = p > 0.34 && p < 0.99
    pts.visible = inRange
    if (!inRange) return

    const t = state.clock.elapsedTime
    const palette = MODE_COLORS[hazardMode]
    const lvl = hazardLevel
    const arr = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array
    const colArr = (pts.geometry.attributes.color as THREE.BufferAttribute).array as Float32Array

    // recolour lazily to match the active hazard mix
    for (let i = 0; i < count; i++) {
      tmpColor.set(palette[i % palette.length])
      colArr[i * 3] = tmpColor.r
      colArr[i * 3 + 1] = tmpColor.g
      colArr[i * 3 + 2] = tmpColor.b

      const s = seeds[i * 2 + 1]
      if (fanOn && purging) {
        // ventilation: particles stream toward the fan and thin out
        const dx = FAN_POS.x - arr[i * 3]
        const dy = FAN_POS.y - arr[i * 3 + 1]
        const dz = FAN_POS.z - arr[i * 3 + 2]
        const dist = Math.max(0.4, Math.hypot(dx, dy, dz))
        const pull = (dt * 7) / dist
        arr[i * 3] += dx * pull
        arr[i * 3 + 1] += dy * pull
        arr[i * 3 + 2] += dz * pull
        if (dist < 0.8) {
          // respawn at far end of the zone
          arr[i * 3] = ZONE.x + (Math.random() - 0.5) * ZONE.w
          arr[i * 3 + 1] = ZONE.y + (Math.random() - 0.5) * ZONE.h
          arr[i * 3 + 2] = ZONE.z - ZONE.d / 2 + Math.random() * 4
        }
      } else {
        arr[i * 3] += Math.sin(t * s + seeds[i * 2]) * 0.004
        arr[i * 3 + 1] += Math.cos(t * 0.6 * s + seeds[i * 2]) * 0.003 + (hazardMode === 'temperature' ? 0.004 * lvl : 0)
        arr[i * 3 + 2] += Math.sin(t * 0.4 * s) * 0.003
      }
    }
    pts.geometry.attributes.position.needsUpdate = true
    pts.geometry.attributes.color.needsUpdate = true

    const m = pts.material as THREE.PointsMaterial
    const targetOpacity = status === 'SAFE' && hazardMode === 'safe' ? lvl * 0.12 : 0.08 + lvl * 0.5
    m.opacity += (targetOpacity - m.opacity) * Math.min(1, dt * 3)
    m.size = hazardMode === 'temperature' ? 0.1 : 0.16
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        vertexColors
        size={0.16}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
