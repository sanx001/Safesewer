import { Atmosphere } from './Atmosphere'
import { Surface } from './Surface'
import { Shaft } from './Shaft'
import { Tunnel } from './Tunnel'
import { Worker } from './Worker'
import { Sensors } from './Sensors'
import { Esp32 } from './Esp32'
import { Fan, FanStream } from './Fan'
import { HazardField } from './HazardField'
import { DataVoid } from './DataVoid'
import { CameraRig } from './CameraRig'
import { useResponsive3D } from '../hooks/useResponsive3D'

/** The complete connected world — one continuous set for one continuous shot. */
export function World() {
  const q = useResponsive3D()
  return (
    <>
      <CameraRig />
      <Atmosphere />
      <Surface />
      <Shaft />
      <Tunnel />
      <Worker />
      <Sensors />
      <Esp32 />
      <Fan />
      <FanStream />
      <HazardField count={Math.floor(q.particles * 0.35)} />
      <DataVoid count={q.particles} />
    </>
  )
}
