import React, { useEffect, useRef } from 'react'

type Planet = {
  name: string
  color: string
  orbitA: number // semi-major axis px
  orbitB: number // semi-minor axis px
  size: number // radius px
  speed: number // radians per second
  phase: number
}

// Scaled solar system (not to real scale; aesthetic and performance balanced)
const planets: Planet[] = [
  { name: 'Mercury', color: 'rgba(180,180,180,0.9)', orbitA: 70,  orbitB: 38, size: 2.5, speed: 1.20, phase: 0.0 },
  { name: 'Venus',   color: 'rgba(255,220,120,0.9)', orbitA: 105, orbitB: 58, size: 3.0, speed: 0.95, phase: 0.9 },
  { name: 'Earth',   color: 'rgba(120,200,255,0.95)', orbitA: 140, orbitB: 78, size: 3.2, speed: 0.80, phase: 1.6 },
  { name: 'Mars',    color: 'rgba(255,120,90,0.95)',  orbitA: 175, orbitB: 98, size: 2.8, speed: 0.65, phase: 2.2 },
  { name: 'Jupiter', color: 'rgba(255,210,170,0.95)', orbitA: 230, orbitB: 128, size: 6.0, speed: 0.35, phase: 0.3 },
  { name: 'Saturn',  color: 'rgba(240,220,170,0.95)', orbitA: 290, orbitB: 160, size: 5.0, speed: 0.30, phase: 1.1 },
  { name: 'Uranus',  color: 'rgba(180,230,230,0.95)', orbitA: 340, orbitB: 188, size: 4.2, speed: 0.22, phase: 2.0 },
  { name: 'Neptune', color: 'rgba(140,180,255,0.95)', orbitA: 390, orbitB: 215, size: 4.0, speed: 0.18, phase: 0.5 },
]

// A few iconic spacecraft
const crafts = [
  { name: 'Voyager 1', a: 460, b: 255, speed: 0.12, phase: 2.2, color: 'rgba(51,255,51,0.95)' },
  { name: 'Hubble',     a: 150, b: 85,  speed: 0.90, phase: 0.8, color: 'rgba(51,255,51,0.85)' },
  { name: 'Tianwen-1',  a: 200, b: 112, speed: 0.55, phase: 1.7, color: 'rgba(51,255,51,0.9)' },
]

const CosmicBackground: React.FC = () => {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let followIndex = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = '100vw'
      canvas.style.height = '100vh'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let cameraAngle = 0
    let cameraZoom = 1
    let lastSwitch = performance.now()

    const draw = () => {
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      const cx = W / 2
      const cy = H / 2
      const t = performance.now() / 1000

      // auto follow a craft every 6 seconds on mobile-like narrow screens
      if (performance.now() - lastSwitch > 6000) {
        followIndex = (followIndex + 1) % crafts.length
        lastSwitch = performance.now()
      }

      cameraAngle += 0.005
      cameraZoom = 1 + 0.05 * Math.sin(t * 0.5)

      ctx.clearRect(0, 0, W, H)

      // starfield
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = 'rgba(51,255,51,0.06)'
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
      }

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(cameraZoom, cameraZoom)
      ctx.rotate(cameraAngle)

      // sun
      ctx.fillStyle = '#FFB000'
      ctx.shadowColor = '#FFB000'
      ctx.shadowBlur = 14
      ctx.beginPath()
      ctx.arc(0, 0, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // orbits
      ctx.strokeStyle = 'rgba(51,255,51,0.18)'
      planets.forEach(p => {
        ctx.beginPath()
        for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
          const x = Math.cos(a) * p.orbitA
          const y = Math.sin(a) * p.orbitB
          if (a === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      })

      // planets
      planets.forEach(p => {
        const ang = t * p.speed + p.phase
        const x = Math.cos(ang) * p.orbitA
        const y = Math.sin(ang) * p.orbitB
        const depth = (y + p.orbitB) / (2 * p.orbitB)
        const r = p.size * (1 + 0.6 * (1 - depth))
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      })

      // spacecraft trails + dots
      crafts.forEach((c, i) => {
        const ang = t * c.speed + c.phase
        const x = Math.cos(ang) * c.a
        const y = Math.sin(ang) * c.b
        const depth = (y + c.b) / (2 * c.b)
        const alpha = 0.5 + 0.5 * (1 - depth)

        // highlight followed craft
        const followed = i === followIndex
        if (followed) {
          ctx.save()
          ctx.strokeStyle = 'rgba(255,176,0,0.35)'
          ctx.beginPath()
          ctx.ellipse(0, 0, c.a + 4, c.b + 4, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }

        // trail segment
        ctx.strokeStyle = `rgba(51,255,51,${0.25 * alpha})`
        ctx.beginPath()
        ctx.arc(0, 0, Math.hypot(x, y), ang - 0.5, ang)
        ctx.stroke()

        // dot
        ctx.fillStyle = c.color
        ctx.beginPath()
        ctx.arc(x, y, 2.5 + (followed ? 2 : 0), 0, Math.PI * 2)
        ctx.fill()

        // label
        ctx.font = '12px Noto Sans SC, system-ui'
        const label = ` ${c.name} `
        const tw = ctx.measureText(label).width
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(x + 10, y - 8, tw, 16)
        ctx.strokeStyle = 'rgba(51,255,51,0.35)'
        ctx.strokeRect(x + 10, y - 8, tw, 16)
        ctx.fillStyle = 'rgba(51,255,51,0.95)'
        ctx.fillText(label, x + 10, y + 4)
      })

      ctx.restore()

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="ao-cosmic-bg" aria-hidden />
}

export default CosmicBackground

