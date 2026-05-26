'use client'

import { useEffect, useRef } from 'react'

interface Node {
  x: number; y: number
  vx: number; vy: number
  r: number; opacity: number
}

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0
    let animId = 0
    const nodes: Node[] = []
    const mouse = { x: -999, y: -999 }

    function resize() {
      W = canvas!.width = window.innerWidth
      H = canvas!.height = window.innerHeight
    }

    function createNodes(n: number) {
      nodes.length = 0
      for (let i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: Math.random() * 2.5 + 1.5,
          opacity: Math.random() * 0.6 + 0.2,
        })
      }
    }

    function hexPath(cx: number, cy: number, r: number) {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        i === 0
          ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
          : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      }
      ctx.closePath()
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // grid dots
      ctx.fillStyle = 'rgba(16,185,129,.035)'
      for (let x = 0; x < W; x += 50) {
        for (let y = 0; y < H; y += 50) {
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // connections between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 160) {
            ctx.strokeStyle = `rgba(16,185,129,${(1 - dist / 160) * 0.3})`
            ctx.lineWidth = 0.7
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }

        // mouse → node lines
        const mdx = nodes[i].x - mouse.x
        const mdy = nodes[i].y - mouse.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        if (md < 200) {
          ctx.strokeStyle = `rgba(110,231,183,${(1 - md / 200) * 0.45})`
          ctx.lineWidth = 0.9
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.stroke()
        }
      }

      // nodes (glow + dot)
      for (const n of nodes) {
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4)
        grd.addColorStop(0, `rgba(16,185,129,${n.opacity * 0.35})`)
        grd.addColorStop(1, 'rgba(16,185,129,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(16,185,129,${n.opacity})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()

        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      }

      // large decorative hexagon outlines
      ctx.strokeStyle = 'rgba(16,185,129,.03)'
      ctx.lineWidth = 1
      hexPath(W * 0.82, H * 0.28, 170)
      ctx.stroke()
      hexPath(W * 0.12, H * 0.72, 90)
      ctx.stroke()
      hexPath(W * 0.5, H * 0.5, 260)
      ctx.stroke()

      animId = requestAnimationFrame(draw)
    }

    function onMouseMove(e: MouseEvent) { mouse.x = e.clientX; mouse.y = e.clientY }
    function onMouseLeave() { mouse.x = -999; mouse.y = -999 }
    function onResize() { resize(); createNodes(70) }

    resize()
    createNodes(70)
    draw()

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
