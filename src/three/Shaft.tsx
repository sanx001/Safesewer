import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../state/scrollStore'
import { concreteTexture, rustedMetalTexture } from './textures'
import { Drips, DriftParticles } from './Particles'

/**
 * Vertical concrete access shaft: damp walls, ladder, cables, pipes,
 * dripping water. The camera falls through it during 20–35%.
 */
export function Shaft() {
  const concrete = useMemo(() => concreteTexture(512, 4, [96, 97, 94]), [])
  const rust = useMemo(() => rustedMetalTexture(512, 2), [])
  const mossMat = useRef<THREE.MeshStandardMaterial>(null)

  const wallGeo = useMemo(() => new THREE.CylinderGeometry(1.15, 1.25, 24.5, 28, 8, true), [])

  // ladder rungs
  const rungs = useMemo(() => Array.from({ length: 22 }, (_, i) => -0.6 - i * 1.05), [])

  // cable curves hugging the wall
  const cables = useMemo(() => {
    const mk = (angle: number, sag: number) => {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 10; i++) {
        const y = 0.3 - i * 2.35
        const a = angle + Math.sin(i * 1.7) * 0.06
        pts.push(
          new THREE.Vector3(Math.cos(a) * 1.05, y, Math.sin(a) * 1.05 + Math.sin(i) * sag * 0.02),
        )
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.02, 6)
    }
    return [mk(2.2, 1), mk(2.45, -1), mk(-0.6, 1)]
  }, [])

  useFrame((state) => {
    if (mossMat.current) {
      mossMat.current.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 0.4) * 0.05
    }
  })

  const visible = scrollState.progress < 0.45 || scrollState.progress > 0.955

  return (
    <group visible={visible}>
      {/* shaft wall */}
      <mesh geometry={wallGeo} position={[0, -11.9, 0]}>
        <meshStandardMaterial
          map={concrete}
          color="#6f7370"
          roughness={0.95}
          side={THREE.BackSide}
        />
      </mesh>

      {/* damp / moss patches near the bottom */}
      <mesh position={[0, -20.5, 0]}>
        <cylinderGeometry args={[1.22, 1.28, 7, 28, 1, true]} />
        <meshStandardMaterial
          ref={mossMat}
          color="#2d3d2a"
          roughness={1}
          transparent
          opacity={0.5}
          side={THREE.BackSide}
        />
      </mesh>

      {/* metal ladder */}
      <group position={[0.88, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, -11.8, 0]}>
            <boxGeometry args={[0.05, 23.6, 0.05]} />
            <meshStandardMaterial map={rust} color="#7a6a52" metalness={0.8} roughness={0.45} />
          </mesh>
        ))}
        {rungs.map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.41, 8]} />
            <meshStandardMaterial map={rust} color="#857257" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* wall pipe */}
      <mesh position={[-0.85, -11.9, 0.4]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 24.4, 12]} />
        <meshStandardMaterial map={rust} color="#6a6156" metalness={0.75} roughness={0.55} />
      </mesh>
      <mesh position={[-0.9, -11.9, -0.35]}>
        <cylinderGeometry args={[0.05, 0.05, 24.4, 10]} />
        <meshStandardMaterial color="#3c4045" metalness={0.7} roughness={0.5} />
      </mesh>

      {/* cable bundles */}
      {cables.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color={i === 2 ? '#274058' : '#1c1f22'} roughness={0.7} />
        </mesh>
      ))}

      {/* bracket rings around the shaft */}
      {[-3, -9, -15, -21].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.18, 0.045, 8, 40]} />
          <meshStandardMaterial map={rust} color="#57534b" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}

      {/* service glow markers so the descent reads depth */}
      {[-4, -10, -16, -22].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.19, 0.012, 6, 40]} />
            <meshBasicMaterial color="#1d4a5c" toneMapped={false} transparent opacity={0.8} />
          </mesh>
          <pointLight position={[0, y + 0.4, 0]} intensity={2.2} distance={7} decay={2} color="#2b6a80" />
        </group>
      ))}

      {/* work light at shaft base */}
      <pointLight position={[0, -23, 0]} intensity={7} distance={12} decay={2} color="#9fd8e8" />

      <Drips count={46} topY={-1} height={23} spread={1.9} />
      <DriftParticles
        count={90}
        box={[2, 22, 2]}
        center={[0, -12, 0]}
        color="#8fa3b8"
        size={0.035}
        opacity={0.4}
        speed={0.5}
        range={[0.16, 0.42]}
      />
    </group>
  )
}
