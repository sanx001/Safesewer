import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../state/scrollStore'
import { dotSprite } from './textures'

interface DriftProps {
  count: number
  box: [number, number, number] // width, height, depth extents
  center: [number, number, number]
  color: string
  size: number
  opacity: number
  speed?: number
  range?: [number, number] // progress visibility window
}

/** Generic drifting particle field (dust / moisture / atmosphere). */
export function DriftParticles({
  count,
  box,
  center,
  color,
  size,
  opacity,
  speed = 1,
  range = [0, 1],
}: DriftProps) {
  const ref = useRef<THREE.Points>(null)
  const sprite = useMemo(() => dotSprite(), [])

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = center[0] + (Math.random() - 0.5) * box[0]
      positions[i * 3 + 1] = center[1] + (Math.random() - 0.5) * box[1]
      positions[i * 3 + 2] = center[2] + (Math.random() - 0.5) * box[2]
      seeds[i * 3] = Math.random() * Math.PI * 2
      seeds[i * 3 + 1] = 0.3 + Math.random() * 0.7
      seeds[i * 3 + 2] = Math.random() * Math.PI * 2
    }
    return { positions, seeds }
  }, [count, box, center])

  useFrame((state) => {
    const p = scrollState.progress
    if (!ref.current) return
    const vis = p >= range[0] && p <= range[1]
    ref.current.visible = vis
    if (!vis) return
    const t = state.clock.elapsedTime * speed
    const arr = (ref.current.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array
    for (let i = 0; i < count; i++) {
      const s = seeds[i * 3 + 1]
      arr[i * 3] += Math.sin(t * s + seeds[i * 3]) * 0.0022
      arr[i * 3 + 1] += Math.cos(t * 0.7 * s + seeds[i * 3 + 2]) * 0.0016 - 0.0006 * s
      arr[i * 3 + 2] += Math.cos(t * 0.5 * s + seeds[i * 3]) * 0.002
      // wrap inside box
      if (arr[i * 3 + 1] < center[1] - box[1] / 2) arr[i * 3 + 1] = center[1] + box[1] / 2
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
        color={color}
        size={size}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

/** Falling water drips inside the shaft / tunnel ceiling. */
export function Drips({ count = 40, x = 0, z = 0, topY = 0, height = 24, spread = 1.6 }) {
  const ref = useRef<THREE.Points>(null)
  const sprite = useMemo(() => dotSprite(), [])
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = x + (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = topY - Math.random() * height
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * spread
      seeds[i] = 6 + Math.random() * 6
    }
    return { positions, seeds }
  }, [count, x, z, topY, height, spread])

  useFrame((_, dt) => {
    if (!ref.current) return
    const p = scrollState.progress
    const vis = p > 0.18 && p < 0.42
    ref.current.visible = vis
    if (!vis) return
    const arr = (ref.current.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= seeds[i] * dt
      if (arr[i * 3 + 1] < topY - height) arr[i * 3 + 1] = topY
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
        color="#9fc7dd"
        size={0.05}
        transparent
        opacity={0.55}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
