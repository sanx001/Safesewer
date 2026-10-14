import { useEffect, useState } from 'react'

export interface QualityTier {
  isMobile: boolean
  dpr: [number, number]
  particles: number
  shadows: boolean
  shadowMapSize: number
  reducedMotion: boolean
}

export function useResponsive3D(): QualityTier {
  const [tier, setTier] = useState<QualityTier>(() => compute())

  useEffect(() => {
    const onResize = () => setTier(compute())
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', onResize)
    window.addEventListener('resize', onResize)
    return () => {
      mq.removeEventListener('change', onResize)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return tier
}

function compute(): QualityTier {
  const w = window.innerWidth
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobile = w < 768 || /Mobi|Android/i.test(navigator.userAgent)
  return {
    isMobile: mobile,
    dpr: mobile ? [1, 1.5] : [1, 2],
    particles: reduced ? 200 : mobile ? 600 : 2200,
    shadows: !mobile,
    shadowMapSize: mobile ? 512 : 1024,
    reducedMotion: reduced,
  }
}
