import { useTheme } from "../contexts/ThemeContext"

export default function BgGradient() {
  const { theme } = useTheme()
  const isLight = theme === "light"

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className={`absolute inset-0 transition-colors duration-1000 ${
        isLight
          ? "bg-gradient-to-b from-emerald-50/60 via-vw-bg to-emerald-50/30"
          : "bg-gradient-to-b from-emerald-950/10 via-vw-bg to-emerald-950/5"
      }`} />
      <div className={`absolute inset-0 transition-colors duration-1000 ${
        isLight
          ? "bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(0,0,0,0.02)_100%)]"
          : "bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(0,0,0,0.3)_100%)]"
      }`} />
    </div>
  )
}
