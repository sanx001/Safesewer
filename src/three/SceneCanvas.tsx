import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useResponsive3D } from '../hooks/useResponsive3D'

const World = lazy(() =>
  import('./World').then((m) => ({ default: m.World })),
)

/** Fixed full-viewport WebGL layer beneath every overlay. */
export function SceneCanvas() {
  const q = useResponsive3D()
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={q.dpr}
        shadows={q.shadows}
        gl={{
          antialias: !q.isMobile,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        camera={{ fov: 55, near: 0.05, far: 400, position: [0, 2.1, 11.5] }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </Canvas>
    </div>
  )
}
