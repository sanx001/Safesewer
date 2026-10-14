import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, seg, smooth } from '../state/scrollStore'
import { asphaltTexture, concreteTexture, rustedMetalTexture, labelTexture } from './textures'
import { DriftParticles } from './Particles'

/**
 * Street-level hero environment: wet asphalt, kerb, street lamp, industrial
 * silhouettes, and the manhole whose cover physically opens with scroll.
 */
export function Surface() {
  const coverGroup = useRef<THREE.Group>(null)
  const beam = useRef<THREE.Mesh>(null)
  const beamLight = useRef<THREE.SpotLight>(null)
  const lampGlow = useRef<THREE.Mesh>(null)

  const asphalt = useMemo(() => asphaltTexture(512, 8), [])
  const concrete = useMemo(() => concreteTexture(512, 3), [])
  const rust = useMemo(() => rustedMetalTexture(512, 1), [])
  const signTex = useMemo(
    () =>
      labelTexture(['CONFINED SPACE', 'PERMIT REQUIRED'], {
        w: 512,
        h: 256,
        bg: '#1c1a08',
        accent: '#fbbf24',
        fg: '#d6d3c0',
      }),
    [],
  )

  // manhole cover grip holes
  const coverGeo = useMemo(() => new THREE.CylinderGeometry(0.62, 0.62, 0.07, 48), [])
  const ringGeo = useMemo(() => new THREE.TorusGeometry(0.66, 0.07, 12, 48), [])
  const shaftTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(0, -20, 0)
    return o
  }, [])
  const lampTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(-2.6, 0, -1.8) // world ≈ (0.8, 0, 0.4) — pool lands beside the manhole
    return o
  }, [])

  useFrame((state) => {
    const p = scrollState.progress
    // cover opens during 10–20%, closes during 97.2–99.6%
    const open = smooth(seg(p, 0.1, 0.2)) * (1 - smooth(seg(p, 0.972, 0.998)))
    const g = coverGroup.current
    if (g) {
      const t = state.clock.elapsedTime
      // subtle vibration while in motion
      const moving = open > 0.02 && open < 0.98 ? 1 : 0
      const vib = moving * Math.sin(t * 60) * 0.006 * (1 - Math.abs(open - 0.5))
      // lift → tilt → slide aside, physically staged
      const lift = Math.min(1, open * 3) * 0.12
      const tilt = smooth(seg(open, 0.15, 0.6)) * 0.5
      const slide = smooth(seg(open, 0.45, 1)) * -1.7
      g.position.set(slide, 0.055 + lift + vib, 0)
      g.rotation.z = tilt * 0.35
      g.rotation.x = -tilt * 0.2
    }
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial
      m.opacity = open * 0.16
      beam.current.visible = open > 0.02
    }
    if (beamLight.current) {
      beamLight.current.intensity = open * 55
    }
  })

  return (
    <group>
      {/* wet asphalt road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          map={asphalt}
          roughness={0.5}
          metalness={0.3}
          color="#aab2bf"
        />
      </mesh>

      {/* kerb + sidewalk */}
      <mesh position={[-7.5, 0.11, 0]}>
        <boxGeometry args={[7, 0.26, 60]} />
        <meshStandardMaterial map={concrete} color="#7d7f80" roughness={0.9} />
      </mesh>

      {/* manhole rim */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={ringGeo} attach="geometry" />
        <meshStandardMaterial map={rust} color="#5a5650" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* darkness plug inside rim (the shaft hides it as you descend) */}
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* hinged cover — group pivots at rim edge */}
      <group position={[0.62, 0.055, 0]}>
        <group ref={coverGroup} position={[-0.62, 0, 0]}>
          <mesh geometry={coverGeo} castShadow>
            <meshStandardMaterial map={rust} color="#6b675f" roughness={0.5} metalness={0.85} />
          </mesh>
          {/* grip slots */}
          {[-0.28, 0.28].map((x) => (
            <mesh key={x} position={[x, 0.04, 0]}>
              <boxGeometry args={[0.07, 0.02, 0.22]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>

      {/* volumetric-looking light cone entering the opening */}
      <mesh ref={beam} position={[0, -3.4, 0]} visible={false}>
        <coneGeometry args={[1.5, 7, 32, 1, true]} />
        <meshBasicMaterial
          color="#ffd9a0"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <primitive object={shaftTarget} />
      <spotLight
        ref={beamLight}
        position={[0, 0.4, 0]}
        angle={0.5}
        penumbra={0.7}
        distance={26}
        color="#ffce8a"
        intensity={0}
        target={shaftTarget}
      />

      {/* street lamp */}
      <group position={[3.4, 0, 2.2]}>
        <mesh position={[0, 2.4, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.09, 4.8, 10]} />
          <meshStandardMaterial color="#3a3f45" roughness={0.5} metalness={0.8} />
        </mesh>
        <mesh position={[-0.5, 4.75, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.045, 0.045, 1.2, 8]} />
          <meshStandardMaterial color="#3a3f45" roughness={0.5} metalness={0.8} />
        </mesh>
        <mesh ref={lampGlow} position={[-1.02, 5.02, 0]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshBasicMaterial color="#ffd9a0" />
        </mesh>
        <primitive object={lampTarget} />
        <spotLight
          position={[-1.02, 5.0, 0]}
          angle={0.7}
          penumbra={0.85}
          intensity={260}
          distance={26}
          color="#ffc98a"
          castShadow
          shadow-mapSize={[512, 512]}
          target={lampTarget}
        />
        <pointLight position={[-1.02, 4.9, 0]} intensity={9} distance={9} color="#ffd9a0" />
      </group>

      {/* industrial backdrop silhouettes */}
      {[
        [-14, -16, 5, 9],
        [-9, -18, 4, 6],
        [10, -17, 6, 7],
        [15, -14, 4, 11],
        [-16, 8, 5, 7],
      ].map(([x, z, w, h], i) => (
        <mesh key={i} position={[x, h / 2, z]}>
          <boxGeometry args={[w, h, w]} />
          <meshStandardMaterial color="#0c0f14" roughness={0.95} />
        </mesh>
      ))}
      {/* distant window lights */}
      {Array.from({ length: 26 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 34,
            2 + Math.random() * 7,
            -13 - Math.random() * 8,
          ]}
        >
          <planeGeometry args={[0.16, 0.22]} />
          <meshBasicMaterial color={Math.random() > 0.4 ? '#c9a86a' : '#5d748c'} />
        </mesh>
      ))}

      {/* warning sign near manhole */}
      <group position={[1.6, 0, 1.4]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
          <meshStandardMaterial color="#494d52" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <planeGeometry args={[0.9, 0.45]} />
          <meshStandardMaterial map={signTex} roughness={0.7} />
        </mesh>
      </group>

      {/* soft fill so the manhole reads at eye level */}
      <pointLight position={[0, 3.2, 2.5]} intensity={16} distance={14} decay={2} color="#a9bfd8" />

      {/* puddle — subtle reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.2, 0.005, 3.2]}>
        <circleGeometry args={[1.1, 32]} />
        <meshStandardMaterial color="#10161f" roughness={0.05} metalness={0.9} />
      </mesh>

      {/* surface dust */}
      <DriftParticles
        count={140}
        box={[26, 6, 26]}
        center={[0, 2.5, 0]}
        color="#7d8ba0"
        size={0.05}
        opacity={0.35}
        speed={0.6}
        range={[0, 0.2]}
      />
    </group>
  )
}
