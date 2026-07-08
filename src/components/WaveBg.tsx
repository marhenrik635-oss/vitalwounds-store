import { useEffect, useRef } from "react"

export default function WaveBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let w: number, h: number
    let animId: number
    let t = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + "px"
      canvas.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      t += 0.003
      ctx.clearRect(0, 0, w, h)

      // 3 wave layers — soft blues (increased opacity)
      const waves = [
        { color: "rgba(0,102,204,0.15)", amp: 24, freq: 0.008, speed: 0.25, yOff: 0.65 },
        { color: "rgba(0,119,221,0.12)", amp: 30, freq: 0.012, speed: 0.4, yOff: 0.58 },
        { color: "rgba(0,90,180,0.10)", amp: 18, freq: 0.006, speed: 0.2, yOff: 0.72 },
      ]

      for (const wv of waves) {
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w; x += 2) {
          const y = h * wv.yOff + Math.sin(x * wv.freq + t * wv.speed) * wv.amp
            + Math.sin(x * wv.freq * 1.7 + t * wv.speed * 1.3) * wv.amp * 0.4
          ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        ctx.fillStyle = wv.color
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    animId = requestAnimationFrame(draw)
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}
