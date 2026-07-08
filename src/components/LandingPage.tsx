import { useState, useEffect, useRef } from "react"
import { ArrowRight, Check, Zap, Smartphone, Banknote, Wallet, Store, ChevronRight, HeadphonesIcon, Globe, MessageSquare, Plus, Minus } from "lucide-react"
import { BRAND_LOGOS } from "./BRAND_LOGOS"
import { useT } from "../i18n/LanguageContext"
import type { TranslationKey } from "../i18n/translations"

interface LPProps {
  navigateTo: (view: "landing" | "auth" | "dashboard-panel", tabId?: string) => void
  isLoggedIn: boolean
}

// Minimalist 3D Background with model-viewer
const ThreeDBackground = () => (
  <model-viewer
    src="/logo.glb"
    alt="Vitalwounds Logo"
    auto-rotate
    camera-controls
    rotation-per-second="10deg"
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
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      pointerEvents: 'none',
      opacity: 0.15
    }}
  />
)

function formatNum(n: number): string {
  return n >= 1000000
    ? (n / 1000000 % 1 === 0 ? Math.floor(n / 1000000).toLocaleString("id-ID") : (n / 1000000).toFixed(1).replace(".", ",")) + "Jt"
    : n.toLocaleString("id-ID");
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          setCount(0)
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const end = value
    const duration = 2000
    const startTime = performance.now()
    const updateCount = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3) // cubic ease out
      setCount(Math.floor(easeProgress * end))
      if (progress < 1) requestAnimationFrame(updateCount)
    }
    requestAnimationFrame(updateCount)
  }, [value, visible])

  return (
    <span ref={ref} className="tabular-nums font-bold tracking-tight">
      {formatNum(count)}{suffix}
    </span>
  )
}

function Reveal({ children, className = "", delay = 0, y = 30 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setShow(true))
          obs.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-[1200ms] ease-out`}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : `translateY(${y}px)`,
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
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

          <div className="hidden md:flex items-center gap-10">
            {["Layanan", "Testimoni", "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-xs font-semibold tracking-wide uppercase text-vw-muted hover:text-vw-text transition-colors">
                {item}
              </a>
            ))}
          </div>

          <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
            className="px-5 py-2.5 bg-vw-text text-vw-surface text-xs font-bold uppercase tracking-wider hover:bg-vw-accent transition-colors duration-300">
            {isLoggedIn ? t("nav.dashboard") : t("auth.login")}
          </button>
        </div>
      </header>

      <main id="content">
        {/* ====== HERO ====== */}
        <section className="relative min-h-[95dvh] flex items-center pt-24 pb-20 px-6">
          <div className="max-w-[1440px] mx-auto w-full">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 lg:gap-8 items-end">

              <div className="animate-fade-in-up">
                <div className="inline-flex mb-8 items-center gap-3 px-4 py-2 border border-vw-border bg-vw-surface/50 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-vw-accent rounded-full animate-pulse-soft" />
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-vw-muted">
                    {t("landing.hero.badge")}
                  </span>
                </div>

                <h1 className="text-[3.5rem] sm:text-[5rem] lg:text-[6.5rem] font-bold tracking-tighter leading-[0.9] text-vw-text mb-8 text-balance">
                  {t("landing.hero.h1")}
                  <br />
                  <span className="text-vw-accent italic font-medium pr-2">
                    {t("landing.hero.h1.premium")}
                  </span>
                  {t("landing.hero.h1.suffix")}
                </h1>

                <div className="flex flex-col sm:flex-row gap-6 sm:items-center mt-12 max-w-2xl">
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                    className="group bg-vw-text text-vw-surface px-8 py-5 text-sm font-bold uppercase tracking-widest flex items-center justify-between gap-6 hover:bg-vw-accent transition-all duration-300">
                    <span>{t("landing.hero.cta")}</span>
                    <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-2" />
                  </button>
                  <p className="text-sm md:text-base text-vw-muted leading-relaxed font-medium">
                    {t("landing.hero.desc")}
                  </p>
                </div>
              </div>

              <div className="relative animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <div className="border border-vw-text p-8 bg-vw-surface relative before:absolute before:-inset-2 before:border before:border-vw-border before:-z-10">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-vw-muted mb-8 pb-4 border-b border-vw-border">
                    Featured Services
                  </h3>
                  <ul className="space-y-5">
                    {[
                      t("landing.hero.check1"),
                      t("landing.hero.check2"),
                      t("landing.hero.check3"),
                      t("landing.hero.check4"),
                      t("landing.hero.check5")
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <Check size={16} className="text-vw-accent shrink-0 mt-0.5" />
                        <span className="text-sm font-medium text-vw-text">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10 pt-6 border-t border-vw-border flex items-baseline justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-vw-muted">{t("landing.hero.mulai")}</span>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold tracking-tighter">Rp 8.000</span>
                      <span className="text-xs font-medium text-vw-muted mb-1">{t("landing.hero.unit")}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ====== LOGO STRIP ====== */}
        <section className="border-y border-vw-border bg-vw-text py-8 overflow-hidden">
          <div className="flex gap-16 items-center animate-marquee whitespace-nowrap">
            {[...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, i) => (
              <div key={i} className="flex items-center gap-3 shrink-0 opacity-50 hover:opacity-100 transition-opacity duration-300 mix-blend-screen">
                <img src={brand.src} alt={brand.name} className="w-8 h-8 object-contain filter invert" />
                <span className="text-sm font-bold tracking-widest uppercase text-vw-surface">{brand.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ====== BENTO GRID / SERVICES ====== */}
        <section id="layanan" className="py-24 sm:py-32 px-6">
          <div className="max-w-[1440px] mx-auto">
            <Reveal>
              <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter max-w-2xl leading-none">
                  {t("landing.services.title")}
                </h2>
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                  className="text-xs font-bold uppercase tracking-[0.15em] border-b-2 border-vw-text pb-1 hover:text-vw-accent hover:border-vw-accent transition-colors self-start md:self-auto">
                  {t("landing.services.lihat")}
                </button>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              {/* Massive Hero Bento */}
              <Reveal className="md:col-span-2 md:row-span-2 relative group overflow-hidden border border-vw-border bg-vw-surface p-10 flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-vw-accent/5 to-transparent pointer-events-none" />
                <div className="relative z-10 max-w-xl">
                  <span className="inline-block px-3 py-1 bg-vw-text text-vw-surface text-[10px] font-bold uppercase tracking-widest mb-6">Premium</span>
                  <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-[1.1]">
                    {t("landing.services.card.title")}
                  </h3>
                  <p className="text-base text-vw-muted leading-relaxed">
                    {t("landing.services.card.desc")}
                  </p>
                </div>
                <div className="relative z-10 flex items-end justify-between mt-auto">
                  <div className="flex -space-x-4">
                    {BRAND_LOGOS.slice(0,4).map((logo, i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-vw-surface bg-vw-bg flex items-center justify-center p-2.5">
                        <img src={logo.src} alt={logo.name} className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                    className="w-14 h-14 bg-vw-text rounded-full flex items-center justify-center text-vw-surface group-hover:scale-110 group-hover:bg-vw-accent transition-all duration-300">
                    <ArrowRight size={20} className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                  </button>
                </div>
              </Reveal>

              {/* Stats Bento 1 */}
              <Reveal delay={100} className="border border-vw-border bg-vw-text p-10 flex flex-col justify-center text-vw-surface">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-vw-surface/50 mb-4">{t(STATS[0].label)}</span>
                <div className="text-6xl font-bold tracking-tighter">
                  <AnimatedCounter value={STATS[0].value} suffix={STATS[0].suffix} />
                </div>
              </Reveal>

              {/* Stats Bento 2 */}
              <Reveal delay={200} className="border border-vw-border bg-vw-surface p-10 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-vw-muted mb-4">{t(STATS[2].label)}</span>
                <div className="text-6xl font-bold tracking-tighter text-vw-text">
                  <AnimatedCounter value={STATS[2].value} suffix={STATS[2].suffix} />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ====== TYPOGRAPHIC PROCESS (STEPS) ====== */}
        <section className="py-24 sm:py-32 border-t border-vw-border bg-vw-text text-vw-surface">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20">
              <Reveal>
                <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter leading-none sticky top-32">
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

        {/* ====== WHY CHOOSE US (ASYMMETRIC) ====== */}
        <section className="py-24 sm:py-32 bg-vw-surface">
          <div className="max-w-[1440px] mx-auto px-6">
            <Reveal>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter max-w-2xl leading-[1.1] mb-20 text-balance">
                {t("landing.why.title")}
              </h2>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {[
                { title: "landing.why1.title", desc: "landing.why1.desc" },
                { title: "landing.why2.title", desc: "landing.why2.desc" },
                { title: "landing.why3.title", desc: "landing.why3.desc" },
                { title: "landing.why4.title", desc: "landing.why4.desc" }
              ].map((w, i) => (
                <Reveal key={w.title} delay={i * 100} y={20}>
                  <div className={`pt-6 border-t ${i % 2 === 0 ? 'border-vw-text' : 'border-vw-border'}`}>
                    <span className="text-xs font-bold font-mono text-vw-muted block mb-6">0{i+1}</span>
                    <h3 className="text-lg font-bold tracking-tight mb-3 text-balance">
                      {t(w.title as TranslationKey)}
                    </h3>
                    <p className="text-sm text-vw-muted leading-relaxed font-medium">
                      {t(w.desc as TranslationKey)}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ====== PAYMENT METHODS ====== */}
        <section className="py-24 border-y border-vw-border bg-vw-bg">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-16 items-center">
              <Reveal className="lg:col-span-1">
                <h2 className="text-3xl font-bold tracking-tight mb-4">
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
                      <div className="w-12 h-12 bg-vw-bg flex items-center justify-center shrink-0">
                        <Icon size={20} className="text-vw-text group-hover:text-vw-accent transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold tracking-tight mb-1">{pm.key}</h4>
                        <p className="text-[11px] text-vw-muted font-medium">{pm.label}</p>
                      </div>
                    </Reveal>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ====== FAQ (MINIMAL ACCORDION) ====== */}
        <section id="faq" className="py-24 sm:py-32 bg-vw-surface">
          <div className="max-w-[1000px] mx-auto px-6">
            <Reveal className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">
                {t("landing.faq.title")}
              </h2>
              <p className="text-base text-vw-muted font-medium">
                {t("landing.faq.desc")}
              </p>
            </Reveal>

            <div className="border-t border-vw-border">
              {[
                { q: "Bagaimana cara deposit?", a: "Login ke dashboard, pilih menu Deposit, masukkan jumlah (min Rp 10.000), lalu lakukan pembayaran melalui QRIS, Transfer Bank, atau Retail. Saldo masuk instan." },
                { q: "Apa saja aplikasi premium yang tersedia?", a: "Netflix 4K UHD, Spotify Premium, YouTube Premium, Canva Pro, ChatGPT Plus, CapCut Pro, dan 20+ aplikasi lainnya dalam satu platform." },
                { q: "Berapa lama proses aktivasi?", a: "Aktivasi instan dalam 1-5 menit setelah pembayaran diverifikasi. Kredensial dikirim langsung ke email." },
                { q: "Apakah ada garansi?", a: "Ya, setiap pembelian dilindungi garansi 100% uang kembali. Jika layanan bermasalah, hubungi tim support kami." }
              ].map((faq, i) => (
                <Reveal key={i} delay={i * 50}>
                  <div className="border-b border-vw-border">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full py-8 flex items-center justify-between text-left group">
                      <span className="text-lg sm:text-xl font-bold tracking-tight text-vw-text group-hover:text-vw-accent transition-colors pr-8">
                        {faq.q}
                      </span>
                      <div className="shrink-0 w-8 h-8 rounded-full border border-vw-border flex items-center justify-center transition-transform duration-300 group-hover:bg-vw-text group-hover:text-vw-surface group-hover:border-transparent"
                           style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)' }}>
                        {openFaq === i ? <Minus size={14} /> : <Plus size={14} />}
                      </div>
                    </button>
                    <div className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
        <section className="py-24 sm:py-32 bg-vw-bg border-t border-vw-border text-center px-6">
          <Reveal className="max-w-3xl mx-auto">
            <h2 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-[0.9] mb-8">
              {t("landing.cta.title")}
            </h2>
            <p className="text-lg text-vw-muted font-medium mb-12 max-w-xl mx-auto">
              {t("landing.cta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => navigateTo("auth", "dashboard")}
                className="px-10 py-5 bg-vw-text text-vw-surface font-bold uppercase tracking-widest text-sm hover:bg-vw-accent transition-colors duration-300">
                {t("landing.cta.register")}
              </button>
              <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                className="px-10 py-5 bg-transparent border border-vw-border text-vw-text font-bold uppercase tracking-widest text-sm hover:border-vw-text transition-colors duration-300">
                {t("landing.cta.login")}
              </button>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ====== MINIMAL FOOTER ====== */}
      <footer className="bg-vw-text text-vw-surface pt-20 pb-10 px-6">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid lg:grid-cols-4 gap-12 lg:gap-8 mb-24">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-vw-surface flex items-center justify-center rounded-sm">
                  <span className="text-vw-text font-bold text-xs tracking-tighter">VW</span>
                </div>
                <span className="text-lg font-bold tracking-tight uppercase">Vitalwounds</span>
              </div>
              <p className="text-sm text-vw-surface/50 font-medium max-w-sm leading-relaxed">
                {t("landing.footer.desc")}
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-vw-surface/30 mb-6">{t("landing.footer.layanan")}</h4>
              <ul className="space-y-4">
                {["Netflix Premium", "Spotify Premium", "Canva Pro", "ChatGPT Plus"].map(l => (
                  <li key={l}><a href="#layanan" className="text-sm font-medium text-vw-surface/70 hover:text-vw-surface transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-vw-surface/30 mb-6">{t("landing.footer.kontak")}</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <HeadphonesIcon size={14} className="text-vw-surface/50" />
                  <span className="text-sm font-medium text-vw-surface/70">+62 812-3456-7890</span>
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
              &copy; 2026 Vitalwounds Store. {t("landing.footer.copyright")}
            </span>
            <div className="flex gap-8">
              <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-vw-surface/50 hover:text-vw-surface transition-colors">{t("landing.footer.privacy")}</a>
              <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-vw-surface/50 hover:text-vw-surface transition-colors">{t("landing.footer.terms")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
