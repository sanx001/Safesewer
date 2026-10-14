import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollState, setProgress } from '../state/scrollStore'

gsap.registerPlugin(ScrollTrigger)

export const SCROLL_TRACK_VH = 1600 // 16 viewport-heights of cinematic travel

let lenisInstance: Lenis | null = null

export function getLenis() {
  return lenisInstance
}

/** Scroll to a journey position (0..1) smoothly */
export function scrollToProgress(p: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (lenisInstance) lenisInstance.scrollTo(p * max, { duration: 2.4 })
  else window.scrollTo({ top: p * max, behavior: 'smooth' })
}

/**
 * Boots Lenis smooth scrolling + GSAP ScrollTrigger and feeds the master
 * progress store that drives the 3D camera choreography.
 */
export function useScrollEngine() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollState.reducedMotion = reduced

    const lenis = new Lenis({
      duration: reduced ? 0.4 : 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })
    lenisInstance = lenis
    // debug/e2e hook
    ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis

    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const st = ScrollTrigger.create({
      trigger: '#scroll-track',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setProgress(self.progress)
        scrollState.velocity = self.getVelocity()
      },
    })

    // pointer parallax
    const onMove = (e: PointerEvent) => {
      scrollState.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      scrollState.pointerY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      st.kill()
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])
}
