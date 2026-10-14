// Procedural canvas textures — no stock imagery anywhere in the build.
import * as THREE from 'three'

function makeCanvas(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return c
}

function noiseOn(
  ctx: CanvasRenderingContext2D,
  size: number,
  base: [number, number, number],
  variance: number,
  scale = 1,
) {
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < size * size; i++) {
    const v = (Math.random() - 0.5) * variance
    img.data[i * 4] = base[0] + v * scale
    img.data[i * 4 + 1] = base[1] + v * scale
    img.data[i * 4 + 2] = base[2] + v * scale
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
}

function toTexture(c: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** Rough gray concrete with stains and pores */
export function concreteTexture(size = 512, repeat = 1, tint: [number, number, number] = [118, 118, 116]) {
  const c = makeCanvas(size)
  const ctx = c.getContext('2d')!
  noiseOn(ctx, size, tint, 34)
  // blotches / damp stains
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 20 + Math.random() * 90
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const dark = Math.random() > 0.5
    g.addColorStop(0, dark ? 'rgba(30,32,30,0.22)' : 'rgba(160,160,155,0.12)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // hairline cracks
  ctx.strokeStyle = 'rgba(40,40,40,0.35)'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    let x = Math.random() * size
    let y = Math.random() * size
    ctx.moveTo(x, y)
    for (let j = 0; j < 6; j++) {
      x += (Math.random() - 0.5) * 80
      y += (Math.random() - 0.5) * 80
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  return toTexture(c, repeat)
}

/** Rust-streaked metal for pipes / covers */
export function rustedMetalTexture(size = 512, repeat = 1) {
  const c = makeCanvas(size)
  const ctx = c.getContext('2d')!
  noiseOn(ctx, size, [96, 92, 88], 22)
  // rust streaks running down
  for (let i = 0; i < 34; i++) {
    const x = Math.random() * size
    const w = 3 + Math.random() * 14
    const h = 40 + Math.random() * (size * 0.7)
    const y = Math.random() * size * 0.5
    const g = ctx.createLinearGradient(x, y, x, y + h)
    g.addColorStop(0, `rgba(${120 + Math.random() * 60},${55 + Math.random() * 25},20,${0.25 + Math.random() * 0.3})`)
    g.addColorStop(1, 'rgba(60,30,10,0)')
    ctx.fillStyle = g
    ctx.fillRect(x, y, w, h)
  }
  // scratches
  ctx.strokeStyle = 'rgba(180,180,175,0.15)'
  for (let i = 0; i < 20; i++) {
    ctx.beginPath()
    const y = Math.random() * size
    ctx.moveTo(Math.random() * size, y)
    ctx.lineTo(Math.random() * size, y + (Math.random() - 0.5) * 20)
    ctx.stroke()
  }
  return toTexture(c, repeat)
}

/** Wet asphalt / road surface */
export function asphaltTexture(size = 512, repeat = 1) {
  const c = makeCanvas(size)
  const ctx = c.getContext('2d')!
  noiseOn(ctx, size, [38, 39, 42], 18)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 8 + Math.random() * 60
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(70,74,80,0.25)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  return toTexture(c, repeat)
}

/** Label texture generator (for ESP32 GPIO labels, warning signs) */
export function labelTexture(
  lines: string[],
  opts: { w?: number; h?: number; bg?: string; fg?: string; accent?: string; font?: string } = {},
): THREE.CanvasTexture {
  const w = opts.w ?? 512
  const h = opts.h ?? 256
  const c = makeCanvas(1)
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = opts.bg ?? '#0a0f1a'
  ctx.fillRect(0, 0, w, h)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const font = opts.font ?? '600 44px "JetBrains Mono", monospace'
  lines.forEach((line, i) => {
    ctx.font = i === 0 ? font : '500 34px "JetBrains Mono", monospace'
    ctx.fillStyle = i === 0 ? (opts.accent ?? '#22d3ee') : (opts.fg ?? '#c7d2e0')
    ctx.fillText(line, w / 2, (h / (lines.length + 1)) * (i + 1))
  })
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** Radial soft dot sprite for particles */
export function dotSprite(): THREE.CanvasTexture {
  const c = makeCanvas(64)
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  return t
}
