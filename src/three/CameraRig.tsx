import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, smooth } from '../state/scrollStore'

interface Key {
  t: number
  pos: [number, number, number]
  look: [number, number, number]
  fov?: number
}

/**
 * Master cinematic camera path. One continuous shot:
 * street → manhole → shaft descent → tunnel → worker → sensors → ESP32 →
 * digital void → ventilation → return to surface.
 */
const KEYS: Key[] = [
  { t: 0.0, pos: [0, 2.1, 11.5], look: [0, 0.4, 0], fov: 55 },
  { t: 0.06, pos: [0, 1.85, 5.8], look: [0, 0.2, 0], fov: 55 },
  { t: 0.11, pos: [0, 1.6, 2.3], look: [0, 0.02, -0.3], fov: 58 },
  { t: 0.17, pos: [0.45, 1.9, 0.45], look: [0, -0.6, -0.3], fov: 62 },
  { t: 0.21, pos: [0.12, 0.9, 0.12], look: [0, -7, -0.2], fov: 66 },
  { t: 0.26, pos: [0, -5.5, 0.16], look: [0, -13, -0.5], fov: 66 },
  { t: 0.32, pos: [0, -15.5, 0.3], look: [0, -25, -5], fov: 62 },
  { t: 0.37, pos: [0, -22.6, -3.5], look: [0, -22.7, -22], fov: 60 },
  { t: 0.43, pos: [0.3, -22.4, -19], look: [1.1, -23.6, -36], fov: 58 },
  { t: 0.49, pos: [0.6, -22.55, -30], look: [1.6, -24, -48], fov: 58 },
  { t: 0.55, pos: [-0.5, -22.55, -53], look: [-2.6, -22.8, -70], fov: 56 },
  { t: 0.61, pos: [-1.1, -22.65, -65.5], look: [-2.6, -22.85, -70.2], fov: 52 },
  { t: 0.66, pos: [-1.5, -22.9, -89.5], look: [-2.3, -23.35, -95], fov: 54 },
  { t: 0.72, pos: [-0.9, -23.1, -92.6], look: [-2.35, -23.3, -95.3], fov: 48 },
  { t: 0.76, pos: [0, -22.3, -118], look: [0, -22, -165], fov: 58 },
  { t: 0.8, pos: [0, -20.2, -168], look: [0, -21.6, -212], fov: 60 },
  { t: 0.845, pos: [5, -18.4, -186], look: [-2, -21.4, -214], fov: 60 },
  { t: 0.865, pos: [1.5, -21, -150], look: [1.5, -22.2, -70], fov: 62 },
  { t: 0.9, pos: [0.7, -22.5, -74], look: [3.0, -22.5, -60], fov: 58 },
  { t: 0.925, pos: [0.3, -22.5, -66], look: [3.0, -22.5, -59.5], fov: 54 },
  { t: 0.95, pos: [0, -22.5, -42], look: [0, -22.3, -72], fov: 56 },
  { t: 0.968, pos: [0, -22.5, -7], look: [0, -16, 0], fov: 60 },
  { t: 0.985, pos: [0, -7, 0.2], look: [0, 3, 0.5], fov: 62 },
  { t: 1.0, pos: [0, 2.6, 6.4], look: [0, 0.7, 0], fov: 55 },
]

const tmpPos = new THREE.Vector3()
const tmpLook = new THREE.Vector3()
const posA = new THREE.Vector3()
const posB = new THREE.Vector3()
const lookA = new THREE.Vector3()
const lookB = new THREE.Vector3()

function sample(p: number, outPos: THREE.Vector3, outLook: THREE.Vector3): number {
  let i = 0
  while (i < KEYS.length - 2 && p > KEYS[i + 1].t) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const t = smooth(Math.min(1, Math.max(0, (p - a.t) / (b.t - a.t))))
  posA.set(...a.pos)
  posB.set(...b.pos)
  lookA.set(...a.look)
  lookB.set(...b.look)
  outPos.lerpVectors(posA, posB, t)
  outLook.lerpVectors(lookA, lookB, t)
  const fovA = a.fov ?? 55
  const fovB = b.fov ?? fovA
  return fovA + (fovB - fovA) * t
}

export function CameraRig() {
  const { camera } = useThree()
  const smoothLook = useRef(new THREE.Vector3(0, 0.4, 0))
  const smoothPos = useRef(new THREE.Vector3(0, 2.1, 11.5))
  const fovRef = useRef(55)
  const velSmooth = useRef(0)

  const parallax = useMemo(() => new THREE.Vector2(), [])

  useFrame((state, dt) => {
    const p = scrollState.progress
    const reduced = scrollState.reducedMotion
    const t = state.clock.elapsedTime

    const targetFov = sample(p, tmpPos, tmpLook)

    // frame-rate independent damping
    const k = 1 - Math.exp(-dt * (reduced ? 10 : 5.2))
    smoothPos.current.lerp(tmpPos, k)
    smoothLook.current.lerp(tmpLook, k)

    // breathing / head sway — suppressed for reduced motion
    const sway = reduced ? 0 : 1
    const breathe = Math.sin(t * 0.9) * 0.018 * sway
    const swayX = Math.sin(t * 0.55) * 0.012 * sway

    // pointer parallax (eased)
    parallax.x += (scrollState.pointerX - parallax.x) * Math.min(1, dt * 4)
    parallax.y += (scrollState.pointerY - parallax.y) * Math.min(1, dt * 4)

    // scroll velocity → subtle FOV kick + lateral drift
    const v = THREE.MathUtils.clamp(scrollState.velocity / 6000, -1, 1)
    velSmooth.current += (v - velSmooth.current) * Math.min(1, dt * 3)

    camera.position.set(
      smoothPos.current.x + parallax.x * 0.35 + swayX,
      smoothPos.current.y - parallax.y * 0.22 + breathe,
      smoothPos.current.z,
    )
    camera.lookAt(
      smoothLook.current.x + parallax.x * 0.9,
      smoothLook.current.y - parallax.y * 0.6 + breathe * 0.5,
      smoothLook.current.z,
    )

    const persp = camera as THREE.PerspectiveCamera
    const fov = targetFov + Math.abs(velSmooth.current) * 6
    if (Math.abs(fov - fovRef.current) > 0.01) {
      fovRef.current += (fov - fovRef.current) * Math.min(1, dt * 6)
      persp.fov = fovRef.current
      persp.updateProjectionMatrix()
    }
  })

  return null
}
