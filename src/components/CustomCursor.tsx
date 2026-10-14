import { useEffect, useRef } from 'react'

/** Cursor-following glow. Disabled on touch / coarse pointers. */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const el = ref.current
    if (!el) return
    let x = -100
    let y = -100
    let tx = x
    let ty = y
    let raf = 0
    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
    }
    const loop = () => {
      x += (tx - x) * 0.12
      y += (ty - y) * 0.12
      el.style.transform = `translate(${x - 150}px, ${y - 150}px)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-10 h-[300px] w-[300px] rounded-full opacity-60"
      style={{
        background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, rgba(34,211,238,0.02) 40%, transparent 70%)',
      }}
    />
  )
}
