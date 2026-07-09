import { useState, useEffect } from "react"
import { ArrowRight, Film, Music, Youtube, Palette, BrainCircuit, Video, Smartphone, Wallet, Store } from "lucide-react"
import { useT } from "../i18n/LanguageContext"
import { motion } from "framer-motion"

export default function LandingPage({ navigateTo, isLoggedIn }: { navigateTo: any, isLoggedIn: boolean }) {
  const t = useT()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const APP_CARDS = [
    { icon: Film, name: "Netflix Premium", desc: "4K UHD, semua konten, shared screen, garansi 30 hari.", price: "Rp 30.000" },
    { icon: Music, name: "Spotify Premium", desc: "Bebas iklan, download offline, kualitas audio tinggi.", price: "Rp 15.000" },
    { icon: Youtube, name: "YouTube Premium", desc: "Tanpa iklan, putar background, YouTube Music included.", price: "Rp 12.000" },
    { icon: Palette, name: "Canva Pro", desc: "Akses lifetime, template premium, 1TB cloud storage.", price: "Rp 25.000" },
    { icon: BrainCircuit, name: "ChatGPT Plus", desc: "GPT-4o, DALL-E 3, custom GPTs, tanpa batas chat.", price: "Rp 49.000" },
    { icon: Video, name: "CapCut Pro", desc: "Bebas watermark, semua efek pro, ekspor maksimal.", price: "Rp 18.000" },
  ]

  return (
    <div className="min-h-[100dvh] bg-vw-bg text-vw-text antialiased overflow-x-hidden selection:bg-vw-accent/30">
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[0.95] mb-8 text-balance">
              {t("landing.hero.h1")} <span className="text-vw-accent">{t("landing.hero.h1.premium")}</span>
            </h1>
            <p className="text-lg md:text-xl text-vw-text-muted leading-relaxed max-w-lg mb-10">{t("landing.hero.desc")}</p>
            <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
              className="px-8 py-4 bg-vw-accent hover:bg-vw-accent-hover text-white font-semibold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3">
              {t("landing.hero.cta")} <ArrowRight size={18} />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-vw-accent to-vw-accent-hover rounded-[2rem] blur opacity-20" />
            <div className="relative bg-vw-surface p-10 rounded-[2rem] border border-vw-border">
              <div className="font-display text-xs font-bold uppercase tracking-widest text-vw-text-muted mb-4">Start your journey</div>
              <div className="font-display text-6xl font-bold mb-12">Rp 8.000<span className="text-2xl text-vw-text-muted font-normal">/unit</span></div>
              <div className="space-y-6">
                {["Netflix 4K UHD", "Spotify Premium", "YouTube Premium", "Canva Pro"].map(i => (
                  <div key={i} className="flex items-center gap-4 text-vw-text-muted font-medium">
                    <div className="w-2 h-2 rounded-full bg-vw-accent shadow-[0_0_8px_rgba(59,130,246,0.5)]" />{i}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Asymmetric */}
      <section id="layanan" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-20">{t("landing.services.title")}</h2>
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              {APP_CARDS.slice(0, 3).map((app, i) => (
                <motion.div key={app.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-vw-surface rounded-3xl p-8 border border-vw-border flex items-center gap-6 group hover:border-vw-accent/30 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-vw-bg flex items-center justify-center border border-vw-border group-hover:border-vw-accent/20 transition-colors">
                    <app.icon size={28} className="text-vw-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-semibold mb-2">{app.name}</h3>
                    <p className="text-sm text-vw-text-muted leading-relaxed max-w-prose">{app.desc}</p>
                  </div>
                  <div className="font-bold text-xl">{app.price}</div>
                </motion.div>
              ))}
            </div>
            <div className="lg:col-span-5 grid gap-8">
               {APP_CARDS.slice(3, 6).map((app, i) => (
                <motion.div key={app.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }} className="bg-vw-surface rounded-3xl p-8 border border-vw-border flex flex-col justify-between group hover:border-vw-accent/30 transition-all">
                  <app.icon size={28} className="text-vw-accent mb-6" />
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-2">{app.name}</h3>
                    <p className="text-sm text-vw-text-muted leading-relaxed mb-6">{app.desc}</p>
                    <div className="font-bold text-xl">{app.price}</div>
                  </div>
                </motion.div>
               ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
