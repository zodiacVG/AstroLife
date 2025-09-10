import React, { useEffect, useRef } from 'react'

type CraftMode = 'ellipse' | 'escape' | 'lissajous' | 'precess'
type Craft = {
  name: string
  a: number
  b: number
  speed: number
  phase: number
  color: string
  mode?: CraftMode
  burstEvery?: number
  burstDuration?: number
  burstGain?: number
  burstTail?: number        // seconds for fading drift after burst
  burstReturn?: number      // seconds for smooth re-entry back to base
  lx?: number
  ly?: number
  precession?: number
}
type Planet = { name: string; a: number; b: number; size: number; color: string; speed: number; phase: number }

const planets: Planet[] = [
  { name: 'Mercury', a: 60,  b: 34,  size: 3.0, color: '#BFBFBF', speed: 0.90, phase: 0.2 },
  { name: 'Venus',   a: 90,  b: 50,  size: 3.6, color: '#E8C37B', speed: 0.75, phase: 0.9 },
  { name: 'Earth',   a: 120, b: 66,  size: 3.8, color: '#78B7FF', speed: 0.60, phase: 1.6 },
  { name: 'Mars',    a: 150, b: 82,  size: 3.2, color: '#FF8A65', speed: 0.50, phase: 2.2 },
  { name: 'Jupiter', a: 190, b: 104, size: 6.4, color: '#FFD2A8', speed: 0.30, phase: 0.3 },
  { name: 'Saturn',  a: 230, b: 126, size: 5.8, color: '#F4DCAD', speed: 0.26, phase: 1.1 },
  { name: 'Uranus',  a: 265, b: 145, size: 4.8, color: '#B7E6E6', speed: 0.20, phase: 2.0 },
  { name: 'Neptune', a: 300, b: 164, size: 4.6, color: '#8FB0FF', speed: 0.18, phase: 0.5 },
]

const crafts: Craft[] = [
  { name: 'Voyager 1',   a: 330, b: 180, speed: 0.060, phase: 0.0, color: 'rgba(51,255,51,0.95)', mode: 'escape',  burstEvery: 14, burstDuration: 3.0, burstGain: 0.45, burstTail: 2.5, burstReturn: 2.5 },
  { name: 'Voyager 2',   a: 310, b: 170, speed: 0.055, phase: 2.6, color: 'rgba(51,255,51,0.90)', mode: 'escape',  burstEvery: 16, burstDuration: 3.2, burstGain: 0.40, burstTail: 2.5, burstReturn: 2.5 },
  { name: 'Pioneer 10',  a: 350, b: 195, speed: 0.050, phase: 0.3, color: 'rgba(51,255,51,0.80)', mode: 'escape',  burstEvery: 18, burstDuration: 3.5, burstGain: 0.50, burstTail: 3.0, burstReturn: 2.8 },
  { name: 'New Horizons',a: 360, b: 200, speed: 0.055, phase: 2.2, color: 'rgba(51,255,51,0.88)', mode: 'escape',  burstEvery: 20, burstDuration: 3.0, burstGain: 0.55, burstTail: 3.0, burstReturn: 3.0 },
  { name: 'Hubble',      a: 135, b: 74,  speed: 0.100, phase: 0.8, color: 'rgba(51,255,51,0.85)', mode: 'precess', precession: 0.004 },
  { name: 'Cassini',     a: 220, b: 120, speed: 0.070, phase: 2.1, color: 'rgba(51,255,51,0.90)', mode: 'precess', precession: 0.002 },
  { name: 'Tianwen-1',   a: 170, b: 95,  speed: 0.065, phase: 0.6, color: 'rgba(51,255,51,0.90)', mode: 'ellipse' },
  { name: 'Shenzhou',    a: 200, b: 110, speed: 0.060, phase: 1.6, color: 'rgba(51,255,51,0.90)', mode: 'ellipse' },
  { name: 'Apollo 11',   a: 150, b: 82,  speed: 0.090, phase: 1.2, color: 'rgba(51,255,51,0.85)', mode: 'ellipse' },
  { name: 'Gaia',        a: 240, b: 135, speed: 0.075, phase: 1.9, color: 'rgba(51,255,51,0.85)', mode: 'ellipse' },
  { name: 'JWST',        a: 260, b: 150, speed: 0.065, phase: 2.9, color: 'rgba(51,255,51,0.95)', mode: 'lissajous', lx: 10, ly: 6 },
]

const SolarSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
  const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let running = true

    const resize = () => {
      const parent = canvas.parentElement!
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = parent.clientWidth * dpr
      canvas.height = parent.clientHeight * dpr
      canvas.style.width = parent.clientWidth + 'px'
      canvas.style.height = parent.clientHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const center = () => ({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 })

    const draw = () => {
      if (!running) return
      const { x: cx, y: cy } = center()

      // clear
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

      // subtle starfield (stable pseudo-random)
      const rand = (n:number)=>{ const x=Math.sin(n*999)*10000; return x-Math.floor(x) }
      for (let i = 0; i < 80; i++) {
        const sx = rand(i) * canvas.clientWidth
        const sy = rand(i+101) * canvas.clientHeight
        const col = i%7===0 ? 'rgba(255,176,0,0.08)' : i%5===0 ? 'rgba(120,200,255,0.06)' : 'rgba(51,255,51,0.05)'
        ctx.fillStyle = col
        ctx.fillRect(sx, sy, 1, 1)
      }

      // sun
      ctx.fillStyle = '#FFB000'
      ctx.shadowColor = '#FFB000'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // compute scale to fit all rings in box
      const maxA = Math.max(...planets.map(p=>p.a), ...crafts.map(c=>c.a))
      const baseR = Math.min(canvas.clientWidth, canvas.clientHeight)/2 - 12
      const S = Math.max(0.6, Math.min(1.0, baseR / maxA))

      // orbits + crafts
      ctx.save()
      ctx.translate(cx, cy)
      // extremely slow cinematic drift
      const globalAngle = performance.now() / 1000 * 0.01
      ctx.rotate(globalAngle)

      // planet orbits (emphasized, slightly inflated spacing)
      ctx.lineWidth = 1.1
      ctx.strokeStyle = 'rgba(51,255,51,0.28)'
      planets.forEach((p, idx) => {
        // add tiny inflation factor to avoid visually dense rings
        const spread = 1 + idx * 0.02 // 2% more radius per ring
        ctx.beginPath()
        for (let a=0; a<=Math.PI*2+0.08; a+=0.08){
          const x = Math.cos(a) * p.a * spread * S
          const y = Math.sin(a) * p.b * spread * S
          if (a===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
        }
        ctx.stroke()
      })

      // planets
      planets.forEach((p, idx) => {
        const time = performance.now()/1000
        const ang = (time * p.speed + p.phase) % (Math.PI*2)
        const spread = 1 + idx * 0.02
        const x = Math.cos(ang) * p.a * spread * S
        const y = Math.sin(ang) * p.b * spread * S
        const depth = (y + p.b*S) / (2*p.b*S)
        const r = p.size * (1 + 0.5*(1-depth))
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
      })

      // spacecraft rings + dots + labels
      const SHOW_CRAFT_RINGS = false // weaken spacecraft rings (or hide)
      crafts.forEach(c=>{
        if (SHOW_CRAFT_RINGS){
          ctx.strokeStyle = 'rgba(51,255,51,0.12)'
          ctx.setLineDash([4,4])
          ctx.beginPath(); ctx.ellipse(0,0,c.a*S,c.b*S,0,0,Math.PI*2); ctx.stroke()
          ctx.setLineDash([])
        }

        const time = performance.now()/1000
        const baseAng = (time * c.speed + c.phase) % (Math.PI*2)
        let x = Math.cos(baseAng) * c.a * S
        let y = Math.sin(baseAng) * c.b * S
        let fadeAlpha = 1
        // precession
        if (c.mode === 'precess' && c.precession){
          const rot = c.precession * time
          const cosP = Math.cos(rot), sinP = Math.sin(rot)
          const rx = x * cosP - y * sinP
          const ry = x * sinP + y * cosP
          x = rx; y = ry
        }
        // lissajous wobble
        if (c.mode === 'lissajous'){
          const lx = c.lx || 8, ly = c.ly || 5
          x += lx * Math.sin(time * 0.8 + c.phase)
          y += ly * Math.sin(time * 1.1)
        }
        // escape bursts with smooth tail and re-entry (no snapping)
        if (c.mode === 'escape'){
          const every = c.burstEvery || 14
          const dur = c.burstDuration || 3
          const gain = c.burstGain || 0.4
          const tail = c.burstTail ?? 2.5
          const ret = c.burstReturn ?? 2.5
          const cycle = every + dur + tail + ret
          const tt = time % cycle
          let m = 1
          let fade = 1
          if (tt <= every){
            // idle
            m = 1; fade = 1
          } else if (tt <= every + dur){
            // outward burst (ease-out)
            const p = (tt - every) / dur
            const k = 1 - Math.pow(1 - p, 3)
            m = 1 + gain * k
            fade = 1
          } else if (tt <= every + dur + tail){
            // drifting farther and fading
            const p = (tt - (every + dur)) / tail
            m = 1 + gain * (1 + 0.6 * p)
            fade = 1 - 0.9 * p
          } else {
            // smooth re-entry back to base (ease-in-out)
            const p = (tt - (every + dur + tail)) / ret
            const k = 0.5 - 0.5 * Math.cos(Math.min(1, p) * Math.PI)
            m = 1 + gain * (0.6 * (1 - k))
            fade = 0.1 + 0.9 * k
          }
          x *= m; y *= m
          // store fade factor to apply after depth-based alpha calc
          fadeAlpha = Math.max(0, Math.min(1, fade))
        }
        const depth = (y + c.b*S) / (2*c.b*S)
        const size = 2 + 3*(1-depth)
        const alphaBase = 0.5 + 0.5*(1-depth)
        const alpha = Math.max(0, Math.min(1, alphaBase * fadeAlpha))
        ctx.fillStyle = c.color.replace('0.95', String(alpha))
        ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI*2); ctx.fill()

        ctx.font = '12px Noto Sans SC, system-ui'
        if (alpha < 0.15) return // hide labels when fully faded
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        const label = ` ${c.name} `
        const tw = ctx.measureText(label).width
        ctx.fillRect(x + size + 6, y - 8, tw, 16)
        ctx.strokeStyle = 'rgba(51,255,51,0.35)'
        ctx.strokeRect(x + size + 6, y - 8, tw, 16)
        ctx.fillStyle = 'rgba(51,255,51,0.92)'
        ctx.fillText(label, x + size + 6, y + 4)
      })

      ctx.restore()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="ao-solar" aria-hidden />
}

export default SolarSystem
