import { useState, useEffect, useRef } from "react"
import { ArrowRight, Check, Zap, Smartphone, Banknote, Wallet, Store, ChevronRight, HeadphonesIcon, Globe, MessageSquare, Plus, Minus, Sparkles, Lightbulb } from "lucide-react"
import { BRAND_LOGOS } from "./BRAND_LOGOS"
import { useT } from "../i18n/LanguageContext"
import type { TranslationKey } from "../i18n/translations"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface LPProps {
  navigateTo: (view: "landing" | "auth" | "dashboard-panel", tabId?: string) => void
  isLoggedIn: boolean
}

// Minimalist 3D Background component
const ThreeDBackground = () => (
  <model-viewer
    src="/logo.glb"
    alt="Vitalwounds Logo"
    auto-rotate
    camera-controls
    rotation-per-second="8deg"
    environment-image="neutral"
    shadow-intensity="0"
    interaction-prompt="none"
    autoplay
    disable-zoom
    disable-pan
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      pointerEvents: 'none',
      opacity: 0.15,
      filter: 'drop-shadow(0 0 60px rgba(37, 99, 235, 0.2))',
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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.2 } // Trigger when 20% of the element is visible
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return
    const end = value
    const duration = 1800
    const startTime = performance.now()
    const updateCount = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3) // Cubic ease out
      setCount(Math.floor(easeProgress * end))
      if (progress < 1) requestAnimationFrame(updateCount)
    }
    requestAnimationFrame(updateCount)
  }, [value, isInView])

  return (
    <span ref={ref} className="tabular-nums font-bold tracking-tight text-vw-text">
      {formatNum(count)}{suffix}
    </span>
  )
}

function Reveal({ children, className = "", delay = 0, y = 30 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isShowing, setIsShowing] = useState(false)
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (prefersReducedMotion) {
      setIsShowing(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setIsShowing(true))
          observer.unobserve(element)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" } // Trigger slightly before element enters viewport
    )
    observer.observe(element)
    return () => observer.unobserve(element)
  }, [prefersReducedMotion])

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        y: prefersReducedMotion ? 0 : y,
      }}
      animate={{
        opacity: isShowing ? 1 : 0,
        y: isShowing ? 0 : y,
        transition: {
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1],
          delay: isShowing ? delay : 0,
        },
      }}
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

  const WHY_US_KEYS = [
    { title: "landing.why1.title" as TranslationKey, desc: "landing.why1.desc" as TranslationKey },
    { title: "landing.why2.title" as TranslationKey, desc: "landing.why2.desc" as TranslationKey },
    { title: "landing.why3.title" as TranslationKey, desc: "landing.why3.desc" as TranslationKey },
    { title: "landing.why4.title" as TranslationKey, desc: "landing.why4.desc" as TranslationKey },
  ]

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
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-vw-bg/80 backdrop-blur-md border-b border-vw-border" : "bg-transparent border-transparent"}`}>
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
        {/* ====== HERO ====== */}
        <section className="relative min-h-[90dvh] flex items-center px-6">
          <div className="max-w-[1440px] mx-auto w-full grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">

            <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-vw-surface/50 border border-vw-border/50 backdrop-blur-sm">
                <div className="w-2 h-2 bg-vw-accent rounded-full animate-pulse-soft" />
                <span className="uppercase tracking-[0.2em] text-vw-muted">
                  {t("landing.hero.badge")}
                </span>
              </div>

              <h1 className="text-[4.5rem] sm:text-[6rem] lg:text-[7rem] font-black tracking-[-0.04em] leading-[0.95] text-vw-text mb-8 text-balance">
                {t("landing.hero.h1")}
                <br />
                <span className="text-vw-accent italic pr-2">
                  {t("landing.hero.h1.premium")}
                </span>
                {t("landing.hero.h1.suffix")}
              </h1>

              <p className="text-lg text-vw-muted leading-relaxed max-w-xl mb-12">
                {t("landing.hero.desc")}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                  className="group bg-vw-text text-vw-surface px-10 py-5 text-sm font-bold uppercase tracking-widest flex items-center justify-between gap-6 hover:bg-vw-accent transition-all duration-300 shadow-xl shadow-vw-accent/30">
                  <span>{t("landing.hero.cta")}</span>
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-2" />
                </button>
                <a href="#layanan" className="text-lg font-semibold text-vw-text hover:text-vw-accent transition-colors">
                  {t("landing.hero.lihat")} <ChevronRight size={16} className="inline-block ml-1"/>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 flex items-center animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="w-full aspect-square border-4 border-vw-accent/50 p-6 bg-vw-surface/30 backdrop-blur-xl rounded-3xl flex flex-col justify-center items-center text-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-vw-accent/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center transition-all duration-500 group-hover:scale-105">
                  <div className="w-3/4 h-3/4 border-2 border-vw-accent/30 rounded-2xl flex items-center justify-center">
                    <div className="w-1/2 h-1/2 border-4 border-vw-accent/20 rounded-xl flex items-center justify-center">
                      <Sparkles size={48} className="text-vw-accent opacity-60" />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2 text-vw-text mt-[150px]">
                  {t("landing.hero.mulai")} Rp 8.000
                </h3>
                <p className="text-xs uppercase font-bold tracking-widest text-vw-muted">{t("landing.hero.unit")}</p>
              </div>
            </div>

          </div>
        </section>

        {/* ====== STATS STRIP — asymmetric, less literal numbers */}
        <section className="border-y border-vw-border py-16 sm:py-24 px-6">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-3 gap-16 items-center">
            <Reveal y={30} delay={0} className="lg:col-span-1">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-vw-text leading-tight max-w-lg">
                {t("landing.services.title")}
              </h2>
            </Reveal>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {STATS.map((s, i) => (
                <Reveal key={s.label} y={30} delay={i * 100} className="flex flex-col items-start">
                  <div className="flex items-baseline gap-2 mb-3">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                    <span className="text-lg font-black tracking-tight text-vw-accent">
                      {s.suffix}
                    </span>
                  </div>
                  <p className="text-xs uppercase font-bold tracking-[0.18em] text-vw-muted">
                    {t(s.label)}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ====== FEATURED SERVICES (BENTO STYLE) ====== */}
        <section id="layanan" className="py-24 sm:py-32 px-6">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 auto-rows-[300px] lg:auto-rows-[400px]">
              {/* Bento Item 1: Large, Typography Focused */}
              <Reveal delay={0} className="lg:col-span-2 lg:row-span-2 border border-vw-border p-10 bg-vw-surface flex flex-col justify-between overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-vw-accent/5 to-transparent pointer-events-none" />
                <span className="inline-block px-3 py-1 bg-vw-text text-vw-surface text-[10px] font-bold uppercase tracking-widest mb-6 relative z-10">Featured</span>
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 leading-[1.1] text-vw-text relative z-10">
                  {t("landing.services.card.title")}
                </h3>
                <p className="text-base text-vw-muted leading-relaxed max-w-xl relative z-10">
                  {t("landing.services.card.desc")}
                </p>
                <div className="relative z-10 mt-auto pt-8 border-t border-vw-border/60 flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {BRAND_LOGOS.slice(0, 4).map((logo, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-vw-surface border-2 border-vw-bg flex items-center justify-center p-2 transition-transform duration-300 hover:scale-110">
                        <img src={logo.src} alt={logo.name} className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                    className="w-12 h-12 bg-vw-text rounded-full flex items-center justify-center text-vw-surface hover:bg-vw-accent transition-colors duration-300">
                    <ArrowRight size={20} className="-rotate-45 transition-transform duration-300" />
                  </button>
                </div>
              </Reveal>

              {/* Bento Item 2: Smaller, Icon + Price */}
              <Reveal delay={100} className="border border-vw-border p-8 bg-vw-surface flex flex-col justify-center items-center text-center">
                <Lightbulb size={36} className="text-vw-accent mb-5" />
                <h3 className="text-xl font-bold tracking-tight mb-2 text-vw-text">{t("landing.hero.check1")}</h3>
                <p className="text-xs text-vw-muted mb-6">{t("landing.hero.check6")}</p>
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                  className="text-sm font-bold text-vw-accent hover:underline">Lihat Semua <ChevronRight size={12} className="inline-block"/> </button>
              </Reveal>

              {/* Bento Item 3: Small, Price Focused */}
              <Reveal delay={200} className="border border-vw-border bg-vw-accent p-8 flex flex-col justify-center items-center text-center text-vw-surface">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-vw-surface/70 mb-3">Mulai dari</span>
                <p className="text-4xl font-bold tracking-tight">Rp 8.000</p>
                <p className="text-xs font-medium">/unit</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ====== STEPS (TYPOGRAPHICALLY DRIVEN) ====== */}
        <section className="py-24 sm:py-32 border-t border-vw-border bg-vw-bg">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20">
              <Reveal>
                <h2 className="text-6xl sm:text-[7rem] font-black tracking-[-0.05em] leading-[0.9] text-vw-text sticky top-32">
                  {t("landing.steps.title")}
                </h2>
              </Reveal>
              <div className="space-y-16">
                {STEPS.map((item, i) => (
                  <Reveal key={item.step} delay={i * 100} y={40}>
                    <div className="group relative border-l-2 border-vw-accent/20 pl-8 transition-colors hover:border-vw-accent">
                      <div className="absolute top-0 left-0 w-3 h-12 bg-vw-accent -translate-x-[0.375rem] scale-y-0 origin-top transition-transform duration-500 group-hover:scale-y-100" />
                      <span className="text-7xl font-black tracking-tight text-vw-accent/10 mb-4 block leading-none select-none">
                        {item.step}
                      </span>
                      <h3 className="text-2xl font-bold tracking-tight mb-3 text-vw-text">
                        {t(item.title)}
                      </h3>
                      <p className="text-base text-vw-muted leading-relaxed font-medium max-w-md">
                        {t(item.desc)}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ====== WHY US (ASYMMETRIC LAYOUT VARIATIONS) ====== */}
        <section className="py-24 sm:py-32 bg-vw-surface border-t border-vw-border">
          <div className="max-w-[1440px] mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-vw-text mb-20 leading-none max-w-xl text-balance">
              {t("landing.why.title")}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {WHY_US_KEYS.map((w, i) => (
                <Reveal key={w.title} delay={i * 100} y={20} className="border border-vw-border p-8 flex flex-col justify-center hover:shadow-lg hover:-translate-y-1 transition-all">
                  <span className="text-xs font-bold font-mono text-vw-muted mb-6">0{i+1}</span>
                  <h3 className="text-lg font-bold tracking-tight mb-3 text-vw-text">{t(w.title)}</h3>
                  <p className="text-sm text-vw-muted leading-relaxed font-medium">{t(w.desc)}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ====== PAYMENT METHODS (CLEAN & INTERACTIVE) ====== */}
        <section className="py-24 border-y border-vw-border bg-vw-bg">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-16 items-center">
              <Reveal className="lg:col-span-1">
                <h2 className="text-3xl font-bold tracking-tight mb-4 text-vw-text">
                  {t("landing.payment.title")}
                </h2>
                <p className="text-lg text-vw-muted font-medium leading-relaxed max-w-lg">
                  {t("landing.payment.desc")}
                </p>
              </Reveal>
              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((pm, i) => {
                  const Icon = pm.icon
                  const iconBgColors = ["bg-emerald-50", "bg-blue-50", "bg-purple-50", "bg-amber-50"]
                  const iconTextColors = ["text-emerald-600", "text-blue-600", "text-purple-600", "text-amber-600"]
                  const iconBorderColors = ["border-emerald-200", "border-blue-200", "border-purple-200", "border-amber-200"]
                  return (
                    <Reveal key={pm.key} delay={i * 100} className={`border p-6 flex items-center gap-5 rounded-2xl transition-all duration-300 hover:border-vw-accent hover:shadow-lg ${i % 2 === 0 ? 'bg-vw-surface' : 'bg-vw-surface'}`}>
                      <div className={`w-12 h-12 rounded-xl ${iconBgColors[i]} flex items-center justify-center shrink-0 border ${iconBorderColors[i]}`}>
                        <Icon size={20} className={iconTextColors[i]} />
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

        {/* ====== FAQ (MINIMAL ACCORDION WITH INTERACTIVE PLUS/MINUS) ====== */}
        <section id="faq" className="py-24 sm:py-32 bg-vw-bg border-t border-vw-border">
          <div className="max-w-[1000px] mx-auto px-6">
            <h2 className="text-5xl font-black tracking-tight mb-12 text-vw-text text-center max-w-2xl mx-auto leading-[1.05]">
              {t("landing.faq.title")}
            </h2>
            <div className="border-t border-vw-border">
              {FAQS.map((faq, i) => (
                <Reveal key={faq.q} delay={i * 50} y={20}>
                  <div className="border-b border-vw-border">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full py-8 px-6 flex items-center justify-between text-left group transition-colors duration-150 hover:bg-vw-surface/50">
                      <span className="text-xl font-bold tracking-tight text-vw-text group-hover:text-vw-accent pr-8">
                        {t(faq.q as TranslationKey)}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-vw-border transition-all duration-300 group-hover:bg-vw-text group-hover:text-vw-surface ${openFaq === i ? "rotate-45 bg-vw-accent text-vw-surface" : "bg-vw-border text-vw-muted rotate-0"}`}>
                        {openFaq === i ? <Minus size={16} /> : <Plus size={16} />}
                      </div>
                    </button>
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{
                        opacity: openFaq === i ? 1 : 0,
                        height: openFaq === i ? 'auto' : 0,
                        marginTop: openFaq === i ? '1rem' : 0,
                        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: openFaq === i ? 0.1 : 0 }
                      }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8 pr-6 text-base text-vw-muted leading-relaxed font-medium max-w-2xl">
                        {t(faq.a as TranslationKey)}
                      </div>
                    </motion.div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ====== FINAL CTA (STRONG TYPOGRAPHY & ASYMMETRY) ====== */}
        <section className="py-24 sm:py-32 bg-gradient-to-br from-vw-text to-vw-text/90 text-white relative overflow-hidden px-6">
          <div className="max-w-[1000px] mx-auto relative z-10">
            <h2 className="text-[5rem] sm:text-[6rem] lg:text-[7rem] font-black tracking-[-0.06em] leading-[0.9] text-center mb-10 text-balance">
              {t("landing.cta.title")}
            </h2>
            <p className="text-lg text-white/70 font-medium mb-16 max-w-xl mx-auto text-center leading-relaxed">
              {t("landing.cta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button onClick={() => navigateTo("auth", "dashboard")}
                className="px-10 py-5 bg-vw-surface text-vw-text font-bold uppercase tracking-widest text-sm hover:bg-white transition-all duration-300 shadow-xl shadow-white/20">
                {t("landing.cta.register")}
              </button>
              <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                className="px-10 py-5 bg-transparent border border-white/30 text-white/80 font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-all duration-300">
                {t("landing.cta.login")}
              </button>
            </div>
          </div>
          <div className="absolute inset-0 -z-0 opacity-20 bg-grid-pattern"></div>
          <div className="absolute inset-0 -z-0 opacity-50 animate-shimmer bg-cover bg-center" style={{ backgroundImage: 'url("/assets/hero-pattern-dark.png")' }}></div>
        </section>

        {/* ====== MINIMAL FOOTER ====== */}
        <footer className="bg-vw-text text-vw-surface pt-24 pb-12 px-6">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-4 gap-12 lg:gap-8">
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
                {[ "Netflix Premium", "Spotify Premium", "Canva Pro", "ChatGPT Plus" ].map(l => (
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
        </footer>
      </main>
    </div>
  )
}
