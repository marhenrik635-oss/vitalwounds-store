import { useState, useEffect, useRef } from "react"
import { ArrowRight, Plus, Smartphone, Banknote, Wallet, Store, Film, Music, Youtube, Palette, BrainCircuit, Video, HeadphonesIcon, Globe, MessageSquare, Check } from "lucide-react"
import { useT } from "../i18n/LanguageContext"
import type { TranslationKey } from "../i18n/translations"

interface LPProps {
  navigateTo: (view: "landing" | "auth" | "dashboard-panel", tabId?: string) => void
  isLoggedIn: boolean
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
    <div className="min-h-[100dvh] bg-vw-bg text-vw-text antialiased overflow-x-hidden relative">
      <div className="grain-overlay" aria-hidden="true" />
      <div className="fixed inset-0 bg-gradient-to-b from-vw-accent/[0.03] via-transparent to-transparent pointer-events-none" aria-hidden="true" />
      <a href="#content" className="fixed -top-full left-0 z-50 px-4 py-2 bg-vw-text text-vw-bg text-xs font-semibold rounded-br-lg transition-all focus:top-0">Langsung ke konten utama</a>

      {/* ====== HEADER ====== */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? "bg-vw-bg/80 backdrop-blur-xl border-b border-vw-border" : "bg-transparent border-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }) }}
            className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-vw-text flex items-center justify-center rounded-sm group-hover:scale-95 transition-transform">
              <span className="text-vw-bg font-bold text-[10px]">VW</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Vitalwounds</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#layanan" className="text-sm text-vw-muted hover:text-vw-text transition-colors">Layanan</a>
            <a href="#faq" className="text-sm text-vw-muted hover:text-vw-text transition-colors">FAQ</a>
          </nav>

          <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
            className="px-4 py-2 bg-vw-text text-vw-bg text-sm font-medium rounded-lg hover:opacity-90 active:scale-[0.97] transition-all">
            {isLoggedIn ? t("nav.dashboard") : t("auth.login")}
          </button>
        </div>
      </header>

      <main id="content">
        {/* ====== HERO ====== */}
        <section className="relative pt-36 pb-28 sm:pt-44 sm:pb-36 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-[2.8rem] sm:text-[4.5rem] lg:text-[5.5rem] font-bold tracking-[-0.03em] leading-[1.05] text-balance mb-6">
                {t("landing.hero.h1")}{" "}
                <span className="text-vw-accent">{t("landing.hero.h1.premium")}</span>{" "}
                {t("landing.hero.h1.suffix")}
              </h1>

              <p className="text-base sm:text-lg text-vw-muted max-w-2xl mx-auto leading-relaxed mb-10 text-balance">
                {t("landing.hero.desc")}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                  className="px-6 py-3 bg-vw-accent text-white text-sm font-medium rounded-lg hover:brightness-110 active:scale-[0.97] transition-all inline-flex items-center gap-2">
                  {t("landing.hero.cta")} <ArrowRight size={14} />
                </button>
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                  className="px-6 py-3 border border-vw-border text-sm font-medium rounded-lg hover:bg-vw-surface active:scale-[0.97] transition-all text-vw-muted hover:text-vw-text">
                  {t("landing.hero.lihat")}
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-14">
                {["Netflix 4K", "Spotify Premium", "YouTube Premium", "Canva Pro", "ChatGPT Plus"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 text-xs text-vw-muted">
                    <Check size={12} className="text-vw-accent" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ====== SERVICES ====== */}
        <section id="layanan" className="py-24 sm:py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-vw-accent/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="max-w-6xl mx-auto relative">
            <FadeIn className="mb-16 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.services.title")}</h2>
              <p className="text-base text-vw-muted leading-relaxed">{t("landing.services.desc")}</p>
            </FadeIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {APP_CARDS.slice(0, 3).map((app, i) => {
                const Icon = app.icon
                return (
                  <FadeIn key={app.name} delay={i * 100}>
                    <div className="bg-vw-surface rounded-2xl p-7 hover:bg-vw-surface/80 transition-all duration-500 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-11 h-11 rounded-xl bg-vw-accent/[0.1] flex items-center justify-center">
                          <Icon size={20} className="text-vw-accent" />
                        </div>
                        {app.badge && (
                          <span className="px-2.5 py-1 rounded-md bg-vw-accent/[0.1] text-vw-accent text-[10px] font-semibold">{app.badge}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold tracking-tight mb-2">{app.name}</h3>
                      <p className="text-sm text-vw-muted leading-relaxed mb-8 flex-1">{app.desc}</p>
                      <div className="flex items-center justify-between pt-5 border-t border-vw-border">
                        <span className="text-xl font-bold">{app.price}<span className="text-xs font-normal text-vw-muted"> /bln</span></span>
                        <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                          className="text-sm font-medium text-vw-accent hover:text-vw-text transition-colors">
                          Pesan
                        </button>
                      </div>
                    </div>
                  </FadeIn>
                )
              })}
            </div>

            <div className="grid sm:grid-cols-3 gap-5 mt-5">
              {APP_CARDS.slice(3, 5).map((app, i) => {
                const Icon = app.icon
                return (
                  <FadeIn key={app.name} delay={(i + 3) * 100}>
                    <div className="bg-vw-surface rounded-2xl p-7 hover:bg-vw-surface/80 transition-all duration-500 h-full flex flex-col">
                      <div className="w-11 h-11 rounded-xl bg-vw-accent/[0.1] flex items-center justify-center mb-6">
                        <Icon size={20} className="text-vw-accent" />
                      </div>
                      <h3 className="text-lg font-semibold tracking-tight mb-2">{app.name}</h3>
                      <p className="text-sm text-vw-muted leading-relaxed mb-8 flex-1">{app.desc}</p>
                      <div className="flex items-center justify-between pt-5 border-t border-vw-border">
                        <span className="text-xl font-bold">{app.price}</span>
                        <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                          className="text-sm font-medium text-vw-accent hover:text-vw-text transition-colors">
                          Pesan
                        </button>
                      </div>
                    </div>
                  </FadeIn>
                )
              })}
              <FadeIn delay={500}>
                <div className="bg-gradient-to-br from-vw-accent/[0.08] to-vw-accent/[0.02] rounded-2xl p-7 border border-vw-accent/[0.08] h-full flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-vw-accent/[0.15] flex items-center justify-center mb-6">
                      <Video size={20} className="text-vw-accent" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight mb-2">CapCut Pro</h3>
                    <p className="text-sm text-vw-muted leading-relaxed mb-6">Bebas watermark, semua efek pro, ekspor maksimal.</p>
                  </div>
                  <div className="flex items-center justify-between pt-5 border-t border-vw-accent/[0.1]">
                    <span className="text-xl font-bold">Rp 18.000</span>
                    <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                      className="text-sm font-medium text-vw-accent hover:text-white transition-colors bg-vw-accent/[0.1] hover:bg-vw-accent px-3 py-1.5 rounded-lg">
                      Pesan
                    </button>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ====== STEPS ====== */}
        <section className="py-24 sm:py-32 px-6 border-t border-vw-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <FadeIn className="max-w-md">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.steps.title")}</h2>
                <p className="text-base text-vw-muted leading-relaxed">{t("landing.steps.desc")}</p>
              </FadeIn>
              <div className="space-y-8">
                {[
                  { icon: Smartphone, title: "landing.step1.title", desc: "landing.step1.desc" },
                  { icon: Wallet, title: "landing.step2.title", desc: "landing.step2.desc" },
                  { icon: Check, title: "landing.step3.title", desc: "landing.step3.desc" },
                ].map((item, i) => (
                  <FadeIn key={item.title} delay={i * 120}>
                    <div className="flex gap-5 items-start group">
                      <div className="w-10 h-10 rounded-xl bg-vw-surface flex items-center justify-center shrink-0 group-hover:bg-vw-accent/[0.1] transition-colors">
                        <item.icon size={18} className="text-vw-muted group-hover:text-vw-accent transition-colors" />
                      </div>
                      <div className="pt-1">
                        <h3 className="font-semibold mb-1.5">{t(item.title)}</h3>
                        <p className="text-sm text-vw-muted leading-relaxed max-w-sm">{t(item.desc)}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ====== WHY US + PAYMENT ====== */}
        <section className="py-24 sm:py-32 px-6 border-t border-vw-border bg-vw-surface">
          <div className="max-w-6xl mx-auto">
            <FadeIn className="mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.why.title")}</h2>
            </FadeIn>

            <div className="grid sm:grid-cols-2 gap-6 mb-20">
              {WHY_US_KEYS.slice(0, 2).map((w, i) => (
                <FadeIn key={w.title} delay={i * 100}>
                  <div className="bg-vw-bg rounded-2xl p-8 h-full">
                    <h3 className="text-lg font-semibold tracking-tight mb-3">{t(w.title)}</h3>
                    <p className="text-sm text-vw-muted leading-relaxed">{t(w.desc)}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {WHY_US_KEYS.slice(2, 4).map((w, i) => (
                <FadeIn key={w.title} delay={(i + 2) * 100}>
                  <div className="bg-vw-bg rounded-2xl p-8 h-full">
                    <h3 className="text-lg font-semibold tracking-tight mb-3">{t(w.title)}</h3>
                    <p className="text-sm text-vw-muted leading-relaxed">{t(w.desc)}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={400} className="mt-20">
              <div className="border-t border-vw-border pt-12">
                <h3 className="text-lg font-semibold tracking-tight mb-2">{t("landing.payment.title")}</h3>
                <p className="text-sm text-vw-muted mb-8 max-w-lg">{t("landing.payment.desc")}</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Smartphone, name: "QRIS" },
                    { icon: Banknote, name: "Transfer" },
                    { icon: Wallet, name: "E-Wallet" },
                    { icon: Store, name: "Retail" },
                  ].map((pm) => (
                    <div key={pm.name} className="flex items-center gap-2.5 bg-vw-bg rounded-xl px-4 py-2.5 border border-vw-border">
                      <pm.icon size={15} className="text-vw-muted" />
                      <span className="text-sm font-medium">{pm.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ====== FAQ ====== */}
        <section id="faq" className="py-24 sm:py-32 px-6">
          <div className="max-w-2xl mx-auto">
            <FadeIn className="mb-16 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.faq.title")}</h2>
            </FadeIn>

            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={faq.q} className="bg-vw-surface rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-vw-bg transition-colors">
                    <span className="text-sm font-medium pr-4">{faq.q}</span>
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}>
                      <Plus size={13} className="text-vw-muted" />
                    </div>
                  </button>
                  <div className={`transition-all duration-300 ease-out overflow-hidden ${openFaq === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-6 pb-5 text-sm text-vw-muted leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== CTA ====== */}
        <section className="py-28 sm:py-36 px-6 text-center relative overflow-hidden border-t border-vw-border">
          <div className="absolute inset-0 bg-gradient-to-t from-vw-accent/[0.03] to-transparent pointer-events-none" />
          <div className="max-w-2xl mx-auto relative">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.cta.title")}</h2>
            <p className="text-base text-vw-muted mb-10 max-w-md mx-auto">{t("landing.cta.desc")}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => navigateTo("auth", "dashboard")}
                className="px-6 py-3 bg-vw-accent text-white text-sm font-medium rounded-lg hover:brightness-110 active:scale-[0.97] transition-all">
                {t("landing.cta.register")}
              </button>
              <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                className="px-6 py-3 border border-vw-border text-sm font-medium rounded-lg hover:bg-vw-surface active:scale-[0.97] transition-all text-vw-muted hover:text-vw-text">
                {t("landing.cta.login")}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-vw-border py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-vw-text flex items-center justify-center rounded-sm">
                  <span className="text-vw-bg font-bold text-[10px]">VW</span>
                </div>
                <span className="text-sm font-semibold tracking-tight">Vitalwounds</span>
              </div>
              <p className="text-sm text-vw-muted leading-relaxed max-w-xs">{t("landing.footer.desc")}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-vw-muted uppercase tracking-wider mb-4">{t("landing.footer.layanan")}</h4>
              <ul className="space-y-3">
                {["Netflix Premium", "Spotify Premium", "Canva Pro", "ChatGPT Plus"].map(l => (
                  <li key={l}><a href="#layanan" className="text-sm text-vw-muted hover:text-vw-text transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-vw-muted uppercase tracking-wider mb-4">{t("landing.footer.kontak")}</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm text-vw-muted">
                  <HeadphonesIcon size={14} />+62 812-3456-7890
                </li>
                <li className="flex items-center gap-2.5 text-sm text-vw-muted">
                  <Globe size={14} />@VitalwoundsStore_Bot
                </li>
                <li className="flex items-center gap-2.5 text-sm text-vw-muted">
                  <MessageSquare size={14} />support@vitalwounds-store.com
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-vw-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-vw-muted">&copy; 2026 Vitalwounds Store. {t("landing.footer.copyright")}</span>
            <div className="flex gap-6">
              <span className="text-xs text-vw-muted">{t("landing.footer.privacy")}</span>
              <span className="text-xs text-vw-muted">{t("landing.footer.terms")}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
