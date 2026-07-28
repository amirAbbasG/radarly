'use client'

import { useEffect, useRef } from 'react'

type Blip = {
  angle: number
  radius: number
  born: number
  life: number
  size: number
}

/**
 * A live radar sweep rendered on a 2D canvas.
 * Sweep line rotates; blips light up as the sweep passes over them,
 * then fade — evoking "signals being discovered".
 */
export function RadarCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let size = 0
    let cx = 0
    let cy = 0
    let R = 0

    // We use fixed brand-ish colors that read well on both themes.
    const isDark = () => document.documentElement.classList.contains('dark')

    const blips: Blip[] = Array.from({ length: 10 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.35 + Math.random() * 0.55,
      born: 0,
      life: 0,
      size: 2 + Math.random() * 3,
    }))

    function resize() {
      const parent = canvas.parentElement
      const box = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect()
      size = Math.min(box.width, box.height)
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cx = size / 2
      cy = size / 2
      R = size / 2 - 6
    }

    let sweep = -Math.PI / 2
    const speed = reduced ? 0 : 0.72
    let pointerX = 0
    let pointerY = 0
    let pointerTargetX = 0
    let pointerTargetY = 0
    let pointerActive = false
    let burst = 0

    function handlePointerMove(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      pointerTargetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1))
      pointerTargetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1))
      pointerActive = true
    }

    function handlePointerLeave() {
      pointerTargetX = 0
      pointerTargetY = 0
      pointerActive = false
    }

    function handlePointerDown() {
      if (!reduced) burst = 1
    }

    let last = performance.now()
    const SIN45 = Math.sin(Math.PI / 4)

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      sweep += speed * dt
      if (sweep > Math.PI * 2) sweep -= Math.PI * 2
      pointerX += (pointerTargetX - pointerX) * Math.min(1, dt * 5)
      pointerY += (pointerTargetY - pointerY) * Math.min(1, dt * 5)
      burst = Math.max(0, burst - dt * 0.72)

      const dark = isDark()
      const grid = dark ? 'rgba(120,170,255,0.14)' : 'rgba(40,90,200,0.16)'
      const gridStrong = dark ? 'rgba(120,170,255,0.22)' : 'rgba(40,90,200,0.24)'
      const green = dark ? 'rgba(52,211,153,' : 'rgba(16,150,100,'
      const blue = dark ? 'rgba(96,165,250,' : 'rgba(40,90,200,'

      ctx.clearRect(0, 0, size, size)
      ctx.save()
      const depthX = reduced ? 0 : pointerX * 7
      const depthY = reduced ? 0 : pointerY * 7
      ctx.translate(depthX, depthY)

      // rings
      ctx.lineWidth = 1
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath()
        ctx.strokeStyle = r === 4 ? gridStrong : grid
        ctx.arc(cx, cy, (R * r) / 4, 0, Math.PI * 2)
        ctx.stroke()
      }
      // cross lines
      ctx.strokeStyle = grid
      ctx.beginPath()
      ctx.moveTo(cx - R, cy)
      ctx.lineTo(cx + R, cy)
      ctx.moveTo(cx, cy - R)
      ctx.lineTo(cx, cy + R)
      // diagonals
      const d = R * SIN45
      ctx.moveTo(cx - d, cy - d)
      ctx.lineTo(cx + d, cy + d)
      ctx.moveTo(cx - d, cy + d)
      ctx.lineTo(cx + d, cy - d)
      ctx.stroke()

      // cursor focus reticle
      if (pointerActive && !reduced) {
        const fx = cx + pointerX * R * 0.54
        const fy = cy + pointerY * R * 0.54
        ctx.beginPath()
        ctx.strokeStyle = `${blue}0.28)`
        ctx.lineWidth = 1
        ctx.arc(fx, fy, 11 + Math.sin(now / 380) * 2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.fillStyle = `${blue}0.65)`
        ctx.arc(fx, fy, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // sweep gradient wedge
      if (!reduced) {
        const wedge = 0.7
        const steps = 26
        for (let i = 0; i < steps; i++) {
          const a0 = sweep - (wedge * i) / steps
          const a1 = sweep - (wedge * (i + 1)) / steps
          const alpha = (1 - i / steps) * 0.16
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.arc(cx, cy, R, a1, a0)
          ctx.closePath()
          ctx.fillStyle = `${green}${alpha})`
          ctx.fill()
        }
        // leading edge line
        ctx.beginPath()
        ctx.strokeStyle = `${green}0.85)`
        ctx.lineWidth = 1.5
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R)
        ctx.stroke()
      }

      // blips
      for (const b of blips) {
        const bx = cx + Math.cos(b.angle) * b.radius * R
        const by = cy + Math.sin(b.angle) * b.radius * R

        // detect sweep passing
        let diff = sweep - b.angle
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        if (!reduced && Math.abs(diff) < 0.06 && now - b.born > 900) {
          b.born = now
          b.life = 1
        }
        if (reduced) b.life = 0.7

        if (b.life > 0) {
          const t = reduced ? 1 : (now - b.born) / 1600
          const fade = reduced ? 0.7 : Math.max(0, 1 - t)
          if (!reduced && t >= 1) {
            b.life = 0
            continue
          }
          // glow
          ctx.beginPath()
          ctx.fillStyle = `${green}${0.25 * fade})`
          ctx.arc(bx, by, b.size + 6 * (1 - fade * 0.3), 0, Math.PI * 2)
          ctx.fill()
          // core
          ctx.beginPath()
          ctx.fillStyle = `${green}${fade})`
          ctx.arc(bx, by, b.size, 0, Math.PI * 2)
          ctx.fill()
          // ping ring
          if (!reduced) {
            ctx.beginPath()
            ctx.strokeStyle = `${green}${0.5 * fade})`
            ctx.lineWidth = 1
            ctx.arc(bx, by, b.size + 14 * t, 0, Math.PI * 2)
            ctx.stroke()
          }
        }
      }

      // interaction pulse
      if (burst > 0) {
        ctx.beginPath()
        ctx.strokeStyle = `${blue}${burst * 0.5})`
        ctx.lineWidth = 1.25
        ctx.arc(cx, cy, R * (1 - burst * 0.82), 0, Math.PI * 2)
        ctx.stroke()
      }

      // center dot
      ctx.beginPath()
      ctx.fillStyle = `${blue}0.9)`
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.strokeStyle = `${blue}${0.22 + Math.sin(now / 420) * 0.08})`
      ctx.arc(cx, cy, 8 + Math.sin(now / 420) * 1.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      raf = requestAnimationFrame(frame)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerleave', handlePointerLeave)
    canvas.addEventListener('pointerdown', handlePointerDown)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      canvas.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" style={{ touchAction: 'none' }} />
}
