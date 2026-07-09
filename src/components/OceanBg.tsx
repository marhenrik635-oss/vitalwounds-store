import { useTheme } from "../contexts/ThemeContext"

// Pre-generated star positions (stable across renders)
const STARS = Array.from({ length: 30 }, (_, i) => ({
  top: Math.random() * 48 + "%",
  left: Math.random() * 100 + "%",
  size: Math.random() * 2 + 1,
  delay: Math.random() * 4 + "s",
  duration: (Math.random() * 2 + 2) + "s",
  opacity: Math.random() * 0.5 + 0.3,
}))

export default function OceanBg() {
  const { theme } = useTheme()
  const isLight = theme === "light"

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">

      {/* SKY */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${
        isLight
          ? "bg-gradient-to-b from-sky-300 via-sky-200 to-cyan-100"
          : "bg-gradient-to-b from-[#070B24] via-[#0F1B4D] to-[#0D47A1]"
      }`} />

      {/* SUN (light mode) */}
      {isLight && (
        <div className="absolute top-[5%] right-[10%]">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-orange-400
            shadow-[0_0_80px_rgba(251,191,36,0.5),0_0_160px_rgba(251,191,36,0.2)]
            animate-float" />
        </div>
      )}

      {/* MOON + STARS (dark mode) */}
      {!isLight && (
        <>
          <div className="absolute top-[5%] right-[10%]">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full
              bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300
              shadow-[0_0_60px_rgba(200,210,230,0.15),0_0_120px_rgba(200,210,230,0.05)]
              relative" />
            {/* Crescent shadow overlay */}
            <div className="absolute -top-0.5 -right-0.5 w-[82%] h-[82%] rounded-full
              bg-[#0F1B4D] shadow-[-4px_0_8px_rgba(15,27,77,0.5)]" />
          </div>

          {STARS.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: s.top,
                left: s.left,
                width: s.size + "px",
                height: s.size + "px",
                opacity: s.opacity,
                animation: `twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* HORIZON GLOW */}
      <div className={`absolute top-[42%] left-0 right-0 h-[16%] transition-colors duration-1000 ${
        isLight
          ? "bg-gradient-to-b from-transparent via-sky-100/60 to-transparent"
          : "bg-gradient-to-b from-transparent via-blue-900/30 to-transparent"
      }`} />

      {/* OCEAN BODY */}
      <div className={`absolute bottom-0 left-0 right-0 h-[48%] transition-colors duration-1000 ${
        isLight
          ? "bg-gradient-to-t from-blue-700 via-blue-400 to-cyan-300/50"
          : "bg-gradient-to-t from-[#020614] via-[#0A1E42] to-[#0D47A1]/30"
      }`} />

      {/* LIGHT REFLECTION ON WATER (light mode) */}
      {isLight && (
        <div className="absolute top-[60%] right-[18%] w-40 h-1 bg-amber-200/30 rounded-full blur-md
          animate-[pulse-soft_3s_ease-in-out_infinite]" />
      )}

      {/* WAVES - 3 SVG layers with gentle bobbing */}
      <div className="absolute bottom-0 left-0 right-0 h-[38%]">
        <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <filter id="foam"><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>

          {/* Layer 1 - back wave */}
          <path
            className={`transition-colors duration-1000 ${isLight ? "fill-cyan-300/45" : "fill-blue-800/35"}`}
            d="M0,180 C240,220 480,140 720,190 C960,240 1200,150 1440,200 L1440,400 L0,400 Z"
          >
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-4; 0,0" dur="6s" repeatCount="indefinite" />
          </path>

          {/* Layer 2 - mid wave */}
          <path
            className={`transition-colors duration-1000 ${isLight ? "fill-blue-400/55" : "fill-blue-900/45"}`}
            d="M0,230 C320,280 640,190 960,240 C1280,290 1440,220 1440,220 L1440,400 L0,400 Z"
          >
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,3; 0,0" dur="4.5s" repeatCount="indefinite" />
          </path>

          {/* Layer 3 - front wave */}
          <path
            className={`transition-colors duration-1000 ${isLight ? "fill-blue-600/65" : "fill-blue-950/55"}`}
            d="M0,280 C180,250 540,320 900,270 C1260,220 1440,280 1440,280 L1440,400 L0,400 Z"
          >
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-3; 0,0" dur="3.5s" repeatCount="indefinite" />
          </path>

          {/* Foam/whitecap highlights */}
          <path
            className={`transition-colors duration-1000 ${isLight ? "fill-white/15" : "fill-white/5"}`}
            d="M0,182 C240,222 480,142 720,192 C960,242 1200,152 1440,202 L1440,206 C1200,156 960,246 720,196 C480,146 240,226 0,186 Z"
            filter="url(#foam)"
          >
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-4; 0,0" dur="6s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>

    </div>
  )
}
