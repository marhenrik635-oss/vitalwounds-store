import { useRef, useEffect } from "react"
import { useInView } from "framer-motion"
import { gsap } from "gsap"

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  threshold?: number
}

export default function CountUp({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  threshold = 0.5,
}: CountUpProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(nodeRef, { amount: threshold, once: true })

  useEffect(() => {
    if (!nodeRef.current || !inView) return

    const obj = { value: 0 }
    gsap.to(obj, {
      value: end,
      duration: duration,
      ease: "power1.out",
      onUpdate: () => {
        if (nodeRef.current) {
          nodeRef.current.textContent =
            prefix + obj.value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + suffix
        }
      },
    })
  }, [end, duration, prefix, suffix, decimals, inView])

  return <span ref={nodeRef}>{prefix + "0" + suffix}</span>
}