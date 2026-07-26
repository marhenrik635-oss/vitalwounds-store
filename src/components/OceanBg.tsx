import { useTheme } from "../contexts/ThemeContext"

export default function OceanBg() {
  const { theme } = useTheme()
  const isLight = theme === "light"

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Clean gradient background — no decorative waves, stars, or sun/moon */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${
        isLight
          ? "bg-gradient-to-b from-sky-50 via-white to-sky-50/60"
          : "bg-gradient-to-b from-[#0A0A0F] via-[#0E1420] to-[#121825]"
      }`} />

      {/* Subtle vignette overlay */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${
        isLight
          ? "bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(0,0,0,0.02)_100%)]"
          : "bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(0,0,0,0.3)_100%)]"
      }`} />
    </div>
  )
}
