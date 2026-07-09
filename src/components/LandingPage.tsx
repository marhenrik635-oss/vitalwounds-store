import { useState, useEffect, useRef } from "react"
import { ArrowRight, Plus, Minus, Smartphone, Banknote, Wallet, Store, Film, Music, Youtube, Palette, BrainCircuit, Video, HeadphonesIcon, Globe, MessageSquare, ChevronRight } from "lucide-react"
import { useT } from "../i18n/LanguageContext"
import type { TranslationKey } from "../i18n/translations"

interface LPProps {
  navigateTo: (view: "landing" | "auth" | "dashboard-panel", tabId?: string) => void
  isLoggedIn: boolean
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
        if (entry.isIntersecting) { setIsInView(true); observer.unobserve(el) }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return
    const end = value, duration = 1500, start = performance.now()
    const update = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end))
      if (p < 1) requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  }, [value, isInView])

  return <span ref={ref} className="tabular-nums">{count}{suffix}</span>
}

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { requestAnimationFrame(() => setShow(true)); obs.disconnect() }
    }, { threshold: 0.05 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (prefersReduced) return <div className={className}>{children}</div>

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
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

  const WHY_US_KEYS = [
    { title: "landing.why1.title" as TranslationKey, desc: "landing.why1.desc" as TranslationKey },
    { title: "landing.why2.title" as TranslationKey, desc: "landing.why2.desc" as TranslationKey },
    { title: "landing.why3.title" as TranslationKey, desc: "landing.why3.desc" as TranslationKey },
    { title: "landing.why4.title" as TranslationKey, desc: "landing.why4.desc" as TranslationKey },
  ]

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-[#FAFAFA] antialiased overflow-x-hidden">
      <a href="#content" className="fixed -top-full left-0 z-[9999] px-4 py-2 bg-[#FAFAFA] text-[#0A0A0A] text-xs font-semibold rounded-br-lg transition-all focus:top-0">Langsung ke konten utama</a>

      {/* ====== HEADER ====== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-white/[0.06]" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }) }}
            className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#FAFAFA] flex items-center justify-center rounded-sm">
              <span className="text-[#0A0A0A] font-bold text-[10px]">VW</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Vitalwounds</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {["Layanan", "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm text-[#737373] hover:text-[#FAFAFA] transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
            className="px-4 py-2 bg-[#FAFAFA] text-[#0A0A0A] text-sm font-medium rounded-lg hover:bg-[#E5E5E5] active:scale-[0.97] transition-all">
            {isLoggedIn ? t("nav.dashboard") : t("auth.login")}
          </button>
        </div>
      </header>

      <main id="content">
        {/* ====== HERO ====== */}
        <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-[#737373] mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                {t("landing.hero.badge")}
              </div>

              <h1 className="text-[2.5rem] sm:text-[4rem] lg:text-[5rem] font-bold tracking-[-0.04em] leading-[1.05] text-balance mb-6">
                {t("landing.hero.h1")}{" "}
                <span className="text-[#3B82F6]">{t("landing.hero.h1.premium")}</span>{" "}
                {t("landing.hero.h1.suffix")}
              </h1>

              <p className="text-lg text-[#737373] max-w-xl mx-auto leading-relaxed mb-10 text-balance">
                {t("landing.hero.desc")}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                  className="px-6 py-3 bg-[#FAFAFA] text-[#0A0A0A] text-sm font-medium rounded-lg hover:bg-[#E5E5E5] active:scale-[0.97] transition-all inline-flex items-center gap-2">
                  {t("landing.hero.cta")} <ArrowRight size={14} />
                </button>
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                  className="px-6 py-3 border border-white/[0.12] text-sm font-medium rounded-lg hover:bg-white/[0.04] active:scale-[0.97] transition-all text-[#737373] hover:text-[#FAFAFA]">
                  {t("landing.hero.lihat")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====== BRANDS ====== */}
        <section className="py-12 border-y border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-xs text-[#525252] text-center mb-6 uppercase tracking-widest font-medium">{t("landing.brand.title")}</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 opacity-40">
              {APP_CARDS.slice(0, 6).map((app) => <app.icon key={app.name} size={20} className="text-[#737373]" />)}
            </div>
          </div>
        </section>

        {/* ====== STATS ====== */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
            {STATS.map((s, i) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#FAFAFA] mb-2">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm text-[#737373] font-medium">{t(s.label)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ====== SERVICES ====== */}
        <section id="layanan" className="py-20 sm:py-28 px-6 bg-white/[0.02] border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.services.title")}</h2>
              <p className="text-[#737373] max-w-xl mx-auto">{t("landing.services.desc")}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {APP_CARDS.map((app, i) => {
                const Icon = app.icon
                return (
                  <FadeIn key={app.name} delay={i * 80}>
                    <div className="group border border-white/[0.06] rounded-xl p-6 hover:border-white/[0.12] transition-all bg-white/[0.02] hover:bg-white/[0.04]">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                          <Icon size={16} className="text-[#3B82F6]" />
                        </div>
                        {app.badge && (
                          <span className="text-[11px] text-[#3B82F6] font-medium">{app.badge}</span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold tracking-tight mb-1.5">{app.name}</h3>
                      <p className="text-sm text-[#737373] leading-relaxed mb-6">{app.desc}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                        <span className="text-lg font-semibold">{app.price}</span>
                        <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                          className="text-sm text-[#3B82F6] hover:text-[#60A5FA] active:scale-[0.97] transition-all inline-flex items-center gap-1 font-medium">
                          Beli <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* ====== STEPS ====== */}
        <section className="py-20 sm:py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.steps.title")}</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-12 sm:gap-8">
              {STEPS.map((item, i) => (
                <FadeIn key={item.step} delay={i * 100}>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-5">
                      <span className="text-sm font-semibold text-[#737373]">{item.step}</span>
                    </div>
                    <h3 className="text-base font-semibold tracking-tight mb-2">{t(item.title)}</h3>
                    <p className="text-sm text-[#737373] leading-relaxed">{t(item.desc)}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ====== WHY US ====== */}
        <section className="py-20 sm:py-28 px-6 bg-white/[0.02] border-y border-white/[0.06]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.why.title")}</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {WHY_US_KEYS.map((w, i) => (
                <FadeIn key={w.title} delay={i * 80} className="border border-white/[0.06] rounded-xl p-6 hover:border-white/[0.12] transition-colors">
                  <span className="text-2xl font-bold text-white/[0.08] block mb-4">0{i+1}</span>
                  <h3 className="text-base font-semibold tracking-tight mb-2">{t(w.title)}</h3>
                  <p className="text-sm text-[#737373] leading-relaxed">{t(w.desc)}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ====== PAYMENT ====== */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.payment.title")}</h2>
              <p className="text-[#737373] max-w-xl mx-auto">{t("landing.payment.desc")}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {PAYMENT_METHODS.map((pm, i) => {
                const Icon = pm.icon
                return (
                  <FadeIn key={pm.key} delay={i * 80} className="border border-white/[0.06] rounded-xl p-5 flex flex-col items-center text-center hover:border-white/[0.12] transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center mb-3">
                      <Icon size={18} className="text-[#737373]" />
                    </div>
                    <h4 className="text-sm font-semibold mb-1">{pm.key}</h4>
                    <p className="text-xs text-[#737373]">{pm.label}</p>
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* ====== FAQ ====== */}
        <section id="faq" className="py-20 sm:py-28 px-6 bg-white/[0.02] border-y border-white/[0.06]">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.faq.title")}</h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={faq.q} className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors">
                    <span className="text-sm font-medium pr-4">{faq.q}</span>
                    <div className={`w-6 h-6 rounded-full border border-white/[0.08] flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}>
                      {openFaq === i ? <Minus size={12} className="text-[#737373]" /> : <Plus size={12} className="text-[#737373]" />}
                    </div>
                  </button>
                  <div className={`transition-all duration-300 ease-out overflow-hidden ${openFaq === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-6 pb-4 text-sm text-[#737373] leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== CTA ====== */}
        <section className="py-24 sm:py-32 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{t("landing.cta.title")}</h2>
            <p className="text-lg text-[#737373] mb-10 max-w-md mx-auto">{t("landing.cta.desc")}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => navigateTo("auth", "dashboard")}
                className="px-6 py-3 bg-[#FAFAFA] text-[#0A0A0A] text-sm font-medium rounded-lg hover:bg-[#E5E5E5] active:scale-[0.97] transition-all">
                {t("landing.cta.register")}
              </button>
              <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                className="px-6 py-3 border border-white/[0.12] text-sm font-medium rounded-lg hover:bg-white/[0.04] active:scale-[0.97] transition-all text-[#737373] hover:text-[#FAFAFA]">
                {t("landing.cta.login")}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-white/[0.06] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-[#FAFAFA] flex items-center justify-center rounded-sm">
                  <span className="text-[#0A0A0A] font-bold text-[10px]">VW</span>
                </div>
                <span className="text-sm font-semibold tracking-tight">Vitalwounds</span>
              </div>
              <p className="text-sm text-[#737373] leading-relaxed max-w-xs">{t("landing.footer.desc")}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#525252] uppercase tracking-wider mb-4">{t("landing.footer.layanan")}</h4>
              <ul className="space-y-3">
                {["Netflix Premium", "Spotify Premium", "Canva Pro", "ChatGPT Plus"].map(l => (
                  <li key={l}><a href="#layanan" className="text-sm text-[#737373] hover:text-[#FAFAFA] transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#525252] uppercase tracking-wider mb-4">{t("landing.footer.kontak")}</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm text-[#737373]">
                  <HeadphonesIcon size={14} />+62 812-3456-7890
                </li>
                <li className="flex items-center gap-2.5 text-sm text-[#737373]">
                  <Globe size={14} />@VitalwoundsStore_Bot
                </li>
                <li className="flex items-center gap-2.5 text-sm text-[#737373]">
                  <MessageSquare size={14} />support@vitalwounds-store.com
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-[#525252]">&copy; 2026 Vitalwounds Store. {t("landing.footer.copyright")}</span>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-[#525252] hover:text-[#737373] transition-colors">{t("landing.footer.privacy")}</a>
              <a href="#" className="text-xs text-[#525252] hover:text-[#737373] transition-colors">{t("landing.footer.terms")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
