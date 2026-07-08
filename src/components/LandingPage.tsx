import { useState, useEffect, useRef } from "react"
import { ArrowRight, Check, Zap, Smartphone, Banknote, Wallet, Store, ChevronRight, HeadphonesIcon, Globe, MessageSquare, Plus, Minus, Film, Music, Youtube, Palette, BrainCircuit, Video, Sparkles } from "lucide-react"
import { BRAND_LOGOS } from "./BRAND_LOGOS"
import { useT } from "../i18n/LanguageContext"
import type { TranslationKey } from "../i18n/translations"
import { motion } from "framer-motion"

interface LPProps {
  navigateTo: (view: "landing" | "auth" | "dashboard-panel", tabId?: string) => void
  isLoggedIn: boolean
}

const ThreeDBackground = () => (
  <model-viewer
    src="/logo.glb"
    alt="Vitalwounds Logo"
    auto-rotate
    camera-controls
    rotation-per-second="6deg"
    environment-image="neutral"
    shadow-intensity="0"
    interaction-prompt="none"
    autoplay
    disable-zoom
    disable-pan
    style={{
      position: 'fixed',
      top: '5%',
      right: '-10%',
      width: '60vw',
      height: '60vh',
      zIndex: -1,
      pointerEvents: 'none',
      opacity: 0.12,
    }}
  />
)

function formatNum(n: number): string {
  return n >= 1000000
    ? (n / 1000000 % 1 === 0 ? Math.floor(n / 1000000).toLocaleString("id-ID") : (n / 1000000).toFixed(1).replace(".", ",")) + "Jt"
    : n.toLocaleString("id-ID");
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return
    const end = value
    const duration = 1500
    const startTime = performance.now()
    const updateCount = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeProgress * end))
      if (progress < 1) requestAnimationFrame(updateCount)
    }
    requestAnimationFrame(updateCount)
  }, [value, isInView])

  return (
    <span ref={ref} className="tabular-nums font-bold tracking-tight">
      {formatNum(count)}{suffix}
    </span>
  )
}

function Reveal({ children, className = "", delay = 0, y = 20 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setShow(true))
          obs.disconnect()
        }
      },
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : y }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage({ navigateTo, isLoggedIn }: LPProps) {
  const t = useT()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const PAYMENT_METHODS = [
    { icon: Smartphone, key: "QRIS", label: "GoPay, DANA, OVO, ShopeePay" },
    { icon: Banknote, key: "Transfer Bank", label: "BCA, Mandiri, BNI, BRI" },
    { icon: Wallet, key: "E-Wallet", label: "GoPay, DANA, OVO, LinkAja" },
    { icon: Store, key: "Retail", label: "Indomaret, Alfamart" },
  ]

  const STATS = [
    { value: 43, suffix: "+", label: "landing.hero.stat1" as TranslationKey },
    { value: 2000, suffix: "+", label: "landing.hero.stat2" as TranslationKey },
    { value: 2000000, suffix: "+", label: "landing.hero.stat3" as TranslationKey },
  ]

  const STEPS = [
    { step: "01", title: "landing.step1.title", desc: "landing.step1.desc" },
    { step: "02", title: "landing.step2.title", desc: "landing.step2.desc" },
    { step: "03", title: "landing.step3.title", desc: "landing.step3.desc" },
  ] as const

  const APP_CARDS = [
    { icon: Film, name: "Netflix Premium", desc: "Akses 4K UHD, semua konten, shared screen, garansi 30 hari.", price: "Rp 30.000", badge: "Best Seller" },
    { icon: Music, name: "Spotify Premium", desc: "Bebas iklan, download offline, kualitas audio tinggi.", price: "Rp 15.000", badge: "Terlaris" },
    { icon: Youtube, name: "YouTube Premium", desc: "Tanpa iklan, putar background, YouTube Music included.", price: "Rp 12.000", badge: "" },
    { icon: Palette, name: "Canva Pro", desc: "Akses lifetime, template premium, 1TB cloud storage.", price: "Rp 25.000", badge: "Hemat" },
    { icon: BrainCircuit, name: "ChatGPT Plus", desc: "GPT-4o, DALL-E 3, custom GPTs, tanpa batas chat.", price: "Rp 49.000", badge: "" },
    { icon: Video, name: "CapCut Pro", desc: "Bebas watermark, semua efek pro, ekspor maksimal.", price: "Rp 18.000", badge: "" },
  ]

  const FAQS = [
    { q: "Bagaimana cara deposit?", a: "Login ke dashboard, pilih menu Deposit, masukkan jumlah (min Rp 10.000), lalu lakukan pembayaran melalui QRIS, Transfer Bank, atau Retail. Saldo masuk instan." },
    { q: "Apa saja aplikasi premium yang tersedia?", a: "Netflix 4K UHD, Spotify Premium, YouTube Premium, Canva Pro, ChatGPT Plus, CapCut Pro, dan 20+ aplikasi lainnya dalam satu platform." },
    { q: "Berapa lama proses aktivasi?", a: "Aktivasi instan dalam 1-5 menit setelah pembayaran diverifikasi. Kredensial dikirim langsung ke email." },
    { q: "Apakah ada garansi?", a: "Ya, setiap pembelian dilindungi garansi 100% uang kembali. Jika layanan bermasalah, hubungi tim support kami." }
  ]

  return (
    <div className="min-h-[100dvh] bg-vw-bg text-vw-text antialiased selection:bg-vw-text selection:text-vw-surface overflow-x-hidden relative">
      <ThreeDBackground />
      <div className="grain-overlay" aria-hidden="true" />
      <a href="#content" className="skip-link">Langsung ke konten utama</a>

      {/* ====== HEADER ====== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-vw-bg/85 backdrop-blur-md border-b border-vw-border" : "bg-transparent border-transparent"}`}>
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }) }}
            className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-vw-text flex items-center justify-center rounded-sm transition-transform duration-300 group-hover:scale-95">
              <span className="text-vw-surface font-bold text-xs tracking-tighter">VW</span>
            </div>
            <span className="text-sm font-bold tracking-tight uppercase">Vitalwounds</span>
          </a>

          <nav className="hidden md:flex items-center gap-10">
            {["Layanan", "Testimoni", "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-xs font-semibold tracking-wide uppercase text-vw-muted hover:text-vw-text transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
            className="px-5 py-2.5 bg-vw-text text-vw-surface text-xs font-bold uppercase tracking-wider hover:bg-vw-accent transition-colors duration-300">
            {isLoggedIn ? t("nav.dashboard") : t("auth.login")}
          </button>
        </div>
      </header>

      <main id="content">
        {/* ====== HERO (EXTREME ASYMMETRIC TYPOGRAPHY) ====== */}
        <section className="relative min-h-[95dvh] flex items-center px-6 pt-24 pb-16">
          <div className="max-w-[1440px] mx-auto w-full">
            <div className="grid lg:grid-cols-12 gap-12 items-end">
              <div className="lg:col-span-8 space-y-6">
                <div className="inline-flex items-center gap-3 px-3 py-1.5 border border-vw-border bg-vw-surface/40 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 bg-vw-accent rounded-full animate-pulse-soft" />
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-vw-muted">
                    {t("landing.hero.badge")}
                  </span>
                </div>

                <h1 className="text-[3.5rem] sm:text-[5.5rem] lg:text-[7.5rem] font-black tracking-[-0.05em] leading-[0.88] text-vw-text">
                  {t("landing.hero.h1")}
                  <br />
                  <span className="text-vw-accent italic pr-3 font-semibold">
                    {t("landing.hero.h1.premium")}
                  </span>
                  {t("landing.hero.h1.suffix")}
                </h1>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <p className="text-base sm:text-lg text-vw-muted leading-relaxed font-medium">
                  {t("landing.hero.desc")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                    className="group bg-vw-text text-vw-surface px-8 py-4.5 text-xs font-bold uppercase tracking-widest flex items-center justify-between gap-4 hover:bg-vw-accent transition-all duration-300">
                    <span>{t("landing.hero.cta")}</span>
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-2" />
                  </button>
                  <a href="#layanan" className="inline-flex items-center justify-center px-8 py-4.5 border border-vw-border text-xs font-bold uppercase tracking-widest text-vw-text hover:border-vw-text transition-colors">
                    {t("landing.hero.lihat")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== LOGO WALL ====== */}
        <section className="border-y border-vw-border bg-vw-surface py-8 overflow-hidden">
          <div className="flex gap-16 items-center animate-marquee whitespace-nowrap">
            {[...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, i) => (
              <div key={i} className="flex items-center gap-3 shrink-0 opacity-40 hover:opacity-100 transition-opacity duration-300">
                <img src={brand.src} alt={brand.name} className="w-6 h-6 object-contain filter invert" />
                <span className="text-xs font-bold tracking-widest uppercase text-vw-text">{brand.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ====== DYNAMIC STATS ====== */}
        <section className="border-b border-vw-border py-16 px-6">
          <div className="max-w-[1440px] mx-auto grid md:grid-cols-3 gap-12">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 100} className="border-l border-vw-border pl-6">
                <div className="text-5xl font-black tracking-tight text-vw-text mb-2">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-vw-muted">
                  {t(s.label)}
                </span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ====== APP PREMIUM SERVICES (ASYNCHRONOUS SCROLL TRACK) ====== */}
        <section id="layanan" className="py-24 sm:py-32 overflow-hidden px-6">
          <div className="max-w-[1440px] mx-auto">
            <Reveal className="mb-16">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter text-vw-text mb-4">
                {t("landing.services.title")}
              </h2>
            </Reveal>

            {/* Asymmetric layout: Side-scrollable list */}
            <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 -mx-6 px-6 scrollbar-none">
              {APP_CARDS.map((app, i) => {
                const Icon = app.icon
                return (
                  <Reveal key={app.name} delay={i * 100} className="snap-start shrink-0 w-[290px] sm:w-[340px] border border-vw-border bg-vw-surface p-8 rounded-2xl flex flex-col justify-between hover:border-vw-accent transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-10 h-10 bg-vw-bg border border-vw-border flex items-center justify-center rounded-xl">
                          <Icon size={18} className="text-vw-accent" />
                        </div>
                        {app.badge && (
                          <span className="px-3 py-1 rounded-full bg-vw-accent/10 text-vw-accent text-[9px] font-bold tracking-wide">{app.badge}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold tracking-tight text-vw-text mb-2">{app.name}</h3>
                      <p className="text-sm text-vw-muted leading-relaxed mb-8">{app.desc}</p>
                    </div>

                    <div className="pt-6 border-t border-vw-border/50 flex items-center justify-between">
                      <span className="text-xl font-bold text-vw-text">{app.price}</span>
                      <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                        className="text-xs font-bold uppercase tracking-widest text-vw-accent flex items-center gap-1">
                        Beli <ChevronRight size={12} />
                      </button>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* ====== TYPOGRAPHIC STEPS ====== */}
        <section className="py-24 sm:py-32 border-t border-vw-border bg-vw-text text-vw-surface">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20">
              <Reveal>
                <h2 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.95] sticky top-32">
                  {t("landing.steps.title")}
                </h2>
              </Reveal>

              <div className="space-y-16">
                {STEPS.map((item, i) => (
                  <Reveal key={item.step} delay={i * 100}>
                    <div className="group relative border-l border-vw-surface/20 pl-8 pb-8 transition-colors hover:border-vw-surface">
                      <div className="absolute top-0 left-0 w-1.5 h-8 bg-vw-surface -translate-x-[0.5px] scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300" />
                      <span className="text-6xl sm:text-7xl font-bold tracking-tighter text-vw-surface/10 mb-6 block leading-none select-none">
                        {item.step}
                      </span>
                      <h3 className="text-2xl font-bold mb-4 tracking-tight">
                        {t(item.title)}
                      </h3>
                      <p className="text-base text-vw-surface/60 leading-relaxed font-medium max-w-md">
                        {t(item.desc)}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ====== PAYMENT METHODS ====== */}
        <section className="py-24 border-y border-vw-border bg-vw-bg px-6">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid lg:grid-cols-3 gap-16 items-center">
              <Reveal className="lg:col-span-1">
                <h2 className="text-3xl font-bold tracking-tight mb-4 text-vw-text">
                  {t("landing.payment.title")}
                </h2>
                <p className="text-sm text-vw-muted leading-relaxed font-medium">
                  {t("landing.payment.desc")}
                </p>
              </Reveal>
              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((pm, i) => {
                  const Icon = pm.icon
                  return (
                    <Reveal key={pm.key} delay={i * 100} className="border border-vw-border p-6 bg-vw-surface flex items-center gap-5 group hover:border-vw-text transition-colors">
                      <div className="w-12 h-12 bg-vw-bg flex items-center justify-center shrink-0 border border-vw-border">
                        <Icon size={20} className="text-vw-text group-hover:text-vw-accent transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold tracking-tight mb-1 text-vw-text">{pm.key}</h4>
                        <p className="text-[11px] text-vw-muted font-medium">{pm.label}</p>
                      </div>
                    </Reveal>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ====== FAQ (ACCORDION) ====== */}
        <section id="faq" className="py-24 sm:py-32 bg-vw-surface">
          <div className="max-w-[1000px] mx-auto px-6">
            <Reveal className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4 text-vw-text">
                {t("landing.faq.title")}
              </h2>
              <p className="text-base text-vw-muted font-medium">
                {t("landing.faq.desc")}
              </p>
            </Reveal>

            <div className="border-t border-vw-border">
              {FAQS.map((faq, i) => (
                <Reveal key={faq.q} delay={i * 50}>
                  <div className="border-b border-vw-border">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full py-8 flex items-center justify-between text-left group">
                      <span className="text-lg sm:text-xl font-bold tracking-tight text-vw-text group-hover:text-vw-accent pr-8">
                        {faq.q}
                      </span>
                      <div className="shrink-0 w-8 h-8 rounded-full border border-vw-border flex items-center justify-center transition-transform duration-300 group-hover:bg-vw-text group-hover:text-vw-surface group-hover:border-transparent"
                           style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)' }}>
                        {openFaq === i ? <Minus size={14} /> : <Plus size={14} />}
                      </div>
                    </button>
                    <div className="overflow-hidden transition-all duration-300"
                         style={{ maxHeight: openFaq === i ? '300px' : '0', opacity: openFaq === i ? 1 : 0 }}>
                      <div className="pb-8 text-base text-vw-muted leading-relaxed font-medium max-w-2xl">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ====== FINAL CTA ====== */}
        <section className="py-24 sm:py-32 bg-vw-text text-vw-surface text-center px-6 relative overflow-hidden">
          <Reveal className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-[0.9] mb-8">
              {t("landing.cta.title")}
            </h2>
            <p className="text-lg text-vw-surface/75 font-medium mb-12 max-w-xl mx-auto">
              {t("landing.cta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => navigateTo("auth", "dashboard")}
                className="px-10 py-5 bg-vw-surface text-vw-text font-bold uppercase tracking-widest text-sm hover:bg-vw-accent hover:text-white transition-all duration-300">
                {t("landing.cta.register")}
              </button>
              <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                className="px-10 py-5 bg-transparent border border-vw-surface/20 text-vw-surface font-bold uppercase tracking-widest text-sm hover:border-vw-surface transition-colors duration-300">
                {t("landing.cta.login")}
              </button>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="bg-vw-text text-vw-surface pt-24 pb-12 px-6 border-t border-vw-surface/10">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid lg:grid-cols-4 gap-12 lg:gap-8 mb-24">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-vw-accent flex items-center justify-center rounded-sm">
                  <span className="text-vw-surface font-bold text-xs tracking-tighter">VW</span>
                </div>
                <span className="text-lg font-bold tracking-tight uppercase">Vitalwounds</span>
              </div>
              <p className="text-sm text-vw-surface/50 font-medium leading-relaxed max-w-sm">
                {t("landing.footer.desc")}
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-vw-surface/30 mb-6">Layanan</h4>
              <ul className="space-y-4">
                {["Netflix Premium", "Spotify Premium", "Canva Pro", "ChatGPT Plus"].map(l => (
                  <li key={l}><a href="#layanan" className="text-sm font-medium text-vw-surface/70 hover:text-vw-surface transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-vw-surface/30 mb-6">Kontak</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <HeadphonesIcon size={14} className="text-vw-surface/50" />
                  <span className="text-sm font-medium text-vw-surface/70">+62 812-3456-7890 (WA)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe size={14} className="text-vw-surface/50" />
                  <span className="text-sm font-medium text-vw-surface/70">@VitalwoundsStore_Bot</span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageSquare size={14} className="text-vw-surface/50" />
                  <span className="text-sm font-medium text-vw-surface/70">support@vitalwounds-store.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-vw-surface/10 flex flex-col sm:flex-row justify-between items-center gap-6">
            <span className="text-[10px] uppercase font-bold tracking-widest text-vw-surface/30">
              &copy; 2026 Vitalwounds Store. All rights reserved.
            </span>
            <div className="flex gap-8">
              <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-vw-surface/50 hover:text-vw-surface transition-colors">Privasi</a>
              <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-vw-surface/50 hover:text-vw-surface transition-colors">Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
