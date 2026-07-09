import { useState, useEffect, useRef } from "react"
import { ArrowRight, Plus, Smartphone, Banknote, Wallet, Store, Film, Music, Youtube, Palette, BrainCircuit, Video, HeadphonesIcon, Globe, MessageSquare } from "lucide-react"
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
    { icon: Film, name: "Netflix Premium", desc: "4K UHD, semua konten, shared screen, garansi 30 hari.", price: "Rp 30.000" },
    { icon: Music, name: "Spotify Premium", desc: "Bebas iklan, download offline, kualitas audio tinggi.", price: "Rp 15.000" },
    { icon: Youtube, name: "YouTube Premium", desc: "Tanpa iklan, putar background, YouTube Music included.", price: "Rp 12.000" },
    { icon: Palette, name: "Canva Pro", desc: "Akses lifetime, template premium, 1TB cloud storage.", price: "Rp 25.000" },
    { icon: BrainCircuit, name: "ChatGPT Plus", desc: "GPT-4o, DALL-E 3, custom GPTs, tanpa batas chat.", price: "Rp 49.000" },
    { icon: Video, name: "CapCut Pro", desc: "Bebas watermark, semua efek pro, ekspor maksimal.", price: "Rp 18.000" },
  ]

  const FAQS = [
    { q: "Bagaimana cara deposit?", a: "Login ke dashboard, pilih menu Deposit, masukkan jumlah (min Rp 10.000), lalu lakukan pembayaran melalui QRIS, Transfer Bank, atau Retail. Saldo masuk instan." },
    { q: "Apa saja aplikasi premium yang tersedia?", a: "Netflix 4K UHD, Spotify Premium, YouTube Premium, Canva Pro, ChatGPT Plus, CapCut Pro, dan 20+ aplikasi lainnya dalam satu platform." },
    { q: "Berapa lama proses aktivasi?", a: "Aktivasi instan dalam 1-5 menit setelah pembayaran diverifikasi. Kredensial dikirim langsung ke email." },
    { q: "Apakah ada garansi?", a: "Ya, setiap pembelian dilindungi garansi 100% uang kembali. Jika layanan bermasalah, hubungi tim support kami." }
  ]

  return (
    <div className="min-h-[100dvh] bg-vw-bg text-vw-text antialiased overflow-x-hidden relative">
      <div className="grain-overlay" aria-hidden="true" />
      <a href="#content" className="fixed -top-full left-0 z-50 px-4 py-2 bg-vw-text text-vw-bg text-xs font-semibold rounded-br-lg transition-all focus:top-0">Langsung ke konten utama</a>

      {/* ====== HEADER ====== */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? "bg-vw-bg/80 backdrop-blur-xl border-b border-vw-border" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-14 md:h-16 flex items-center justify-between">
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
            className="px-4 py-2 bg-vw-accent text-white text-sm font-medium rounded-lg hover:brightness-110 active:scale-[0.97] transition-all">
            {isLoggedIn ? t("nav.dashboard") : t("auth.login")}
          </button>
        </div>
      </header>

      <main id="content">
        {/* ====== HERO - Asymmetric Split ====== */}
        <section className="relative pt-16 sm:pt-20 md:pt-24 px-6 min-h-[90dvh] flex items-center">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-7 space-y-6 max-w-xl">
                <h1 className="font-display text-[2.5rem] sm:text-[4rem] lg:text-[5rem] font-bold tracking-[-0.04em] leading-[1] text-balance">
                  {t("landing.hero.h1")}{" "}
                  <span className="text-vw-accent">{t("landing.hero.h1.premium")}</span>{" "}
                  {t("landing.hero.h1.suffix")}
                </h1>

                <p className="text-base sm:text-lg text-vw-text-muted leading-relaxed max-w-lg">
                  {t("landing.hero.desc")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                    className="px-6 py-3 bg-vw-accent text-white text-sm font-medium rounded-lg hover:brightness-110 active:scale-[0.97] transition-all inline-flex items-center gap-2 w-fit">
                    {t("landing.hero.cta")} <ArrowRight size={14} />
                  </button>
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                    className="px-6 py-3 border border-vw-border text-sm font-medium rounded-lg hover:bg-vw-surface active:scale-[0.97] transition-all text-vw-muted hover:text-vw-text w-fit">
                    {t("landing.hero.lihat")}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="w-full max-w-sm bg-vw-surface rounded-3xl p-6 sm:p-8 border border-vw-border">
                  <div className="text-xs text-vw-muted font-medium mb-4 uppercase tracking-wider">Mulai dari</div>
                  <div className="text-4xl sm:text-5xl font-bold tracking-tight mb-1">
                    Rp 8.000<span className="text-sm font-normal text-vw-muted">/unit</span>
                  </div>
                  <div className="mt-6 space-y-3">
                    {["Netflix 4K UHD", "Spotify Premium", "YouTube Premium", "Canva Pro"].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-vw-muted">
                        <div className="w-1.5 h-1.5 rounded-full bg-vw-accent" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                    className="mt-6 w-full py-2.5 bg-vw-accent text-white text-sm font-medium rounded-lg hover:brightness-110 active:scale-[0.97] transition-all">
                    Mulai Belanja
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== SERVICES - Asymmetric Layout ====== */}
        <section id="layanan" className="py-24 sm:py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mb-20 items-end">
              <FadeIn>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">{t("landing.services.title")}</h2>
              </FadeIn>
              <FadeIn delay={150}>
                <p className="text-base text-vw-text-muted leading-relaxed max-w-md lg:ml-auto">{t("landing.services.desc")}</p>
              </FadeIn>
            </div>

            {/* Asymmetric Grid Layout to break generic 3-column AI Slop */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Premium Streaming (Netflix, Spotify, YT) - Stacked with offset */}
              <div className="lg:col-span-6 space-y-6">
                <div className="text-xs uppercase tracking-wider text-vw-accent font-semibold mb-2">Entertainment Essentials</div>
                {APP_CARDS.slice(0, 3).map((app, i) => {
                  const Icon = app.icon
                  return (
                    <FadeIn key={app.name} delay={i * 100}>
                      <div className="bg-vw-surface rounded-2xl p-8 hover:bg-vw-surface/80 border border-vw-border hover:border-vw-accent/30 transition-all duration-300 flex flex-col sm:flex-row gap-6 items-start sm:items-center group">
                        <div className="w-12 h-12 rounded-xl bg-vw-accent/[0.1] flex items-center justify-center shrink-0 group-hover:bg-vw-accent/[0.15] transition-colors">
                          <Icon size={20} className="text-vw-accent" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="text-lg font-semibold text-vw-text">{app.name}</h3>
                          <p className="text-sm text-vw-text-muted leading-relaxed">{app.desc}</p>
                        </div>
                        <div className="w-full sm:w-auto pt-4 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-vw-border flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                          <span className="text-lg font-bold text-vw-text">{app.price}</span>
                          <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                            className="text-xs font-semibold px-4 py-2 bg-vw-accent/[0.1] text-vw-accent rounded-lg hover:bg-vw-accent hover:text-white transition-all">
                            Pesan
                          </button>
                        </div>
                      </div>
                    </FadeIn>
                  )
                })}
              </div>

              {/* Right Column: Creativity & Productivity (Canva, ChatGPT, CapCut) - Multi-size offset cards */}
              <div className="lg:col-span-6 lg:mt-12 space-y-6">
                <div className="text-xs uppercase tracking-wider text-vw-accent font-semibold mb-2">Work & Creation</div>
                
                {/* Canva Pro - Asymmetric Featured Card */}
                <FadeIn delay={200}>
                  <div className="bg-vw-accent/[0.04] rounded-2xl p-8 border border-vw-accent/[0.12] hover:border-vw-accent/40 transition-all duration-300 flex flex-col group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-xl bg-vw-accent/[0.15] flex items-center justify-center">
                        <Palette size={20} className="text-vw-accent" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-vw-accent bg-vw-accent/[0.1] px-2.5 py-1 rounded-full">POPULAR</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-vw-text">Canva Pro</h3>
                    <p className="text-sm text-vw-text-muted leading-relaxed mb-8">Akses lifetime, template premium, 1TB cloud storage untuk kebutuhan desain profesional tanpa batas.</p>
                    <div className="flex items-center justify-between pt-6 border-t border-vw-accent/[0.15]">
                      <div>
                        <span className="text-xs text-vw-muted block">Harga Spesial</span>
                        <span className="text-xl font-bold text-vw-text">Rp 25.000</span>
                      </div>
                      <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                        className="text-sm font-semibold bg-vw-accent text-white px-5 py-2.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                        Pesan Sekarang
                      </button>
                    </div>
                  </div>
                </FadeIn>

                {/* ChatGPT & CapCut - Side by side or stacked elegantly */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {APP_CARDS.slice(4, 6).map((app, i) => {
                    const Icon = app.icon
                    return (
                      <FadeIn key={app.name} delay={300 + i * 100}>
                        <div className="bg-vw-surface rounded-2xl p-6 border border-vw-border hover:border-vw-accent/30 transition-all duration-300 flex flex-col h-full justify-between group">
                          <div>
                            <div className="w-10 h-10 rounded-xl bg-vw-accent/[0.08] flex items-center justify-center mb-4 group-hover:bg-vw-accent/[0.12] transition-colors">
                              <Icon size={18} className="text-vw-accent" />
                            </div>
                            <h3 className="text-base font-semibold mb-1 text-vw-text">{app.name}</h3>
                            <p className="text-xs text-vw-text-muted leading-relaxed mb-6">{app.desc}</p>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-vw-border mt-auto">
                            <span className="text-base font-bold text-vw-text">{app.price}</span>
                            <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                              className="text-xs font-semibold text-vw-accent hover:text-vw-text transition-colors">
                              Pesan
                            </button>
                          </div>
                        </div>
                      </FadeIn>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== HOW IT WORKS - Full width flow ====== */}
        <section className="py-24 sm:py-32 px-6 border-t border-vw-border bg-vw-surface">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <FadeIn>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance">{t("landing.steps.title")}</h2>
              </FadeIn>
            </div>
            <div className="grid sm:grid-cols-3 gap-8 sm:gap-12 relative">
              <div className="hidden sm:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-vw-border" aria-hidden="true" />
              {[
                { icon: Smartphone, label: "Daftar Akun Gratis", desc: "Buat akun dalam 1 menit. Cukup masukkan email dan buat password." },
                { icon: Wallet, label: "Deposit Saldo", desc: "Isi saldo via QRIS, Virtual Account, E-Wallet, atau Indomaret. Instan." },
                { icon: ArrowRight, label: "Pesan & Nikmati", desc: "Pilih produk, masukkan target, sistem proses otomatis. Selesai." },
              ].map((item, i) => (
                <FadeIn key={item.label} delay={i * 120}>
                  <div className="text-center sm:text-left relative">
                    <div className="w-14 h-14 rounded-2xl bg-vw-bg flex items-center justify-center mx-auto sm:mx-0 mb-6 border border-vw-border relative z-10">
                      <item.icon size={22} className="text-vw-accent" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{item.label}</h3>
                    <p className="text-sm text-vw-muted leading-relaxed max-w-xs mx-auto sm:mx-0">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ====== WHY US - Left heading + right columns ====== */}
        <section className="py-24 sm:py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
              <div className="lg:col-span-5">
                <FadeIn>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance mb-6">{t("landing.why.title")}</h2>
                  <p className="text-sm text-vw-muted leading-relaxed">Platform yang dirancang untuk memberikan pengalaman terbaik dalam berbelanja layanan digital premium.</p>
                </FadeIn>
              </div>
              <div className="lg:col-span-7 space-y-6">
                {[
                  { title: "landing.why1.title", desc: "landing.why1.desc", accent: true },
                  { title: "landing.why2.title", desc: "landing.why2.desc", accent: false },
                  { title: "landing.why3.title", desc: "landing.why3.desc", accent: false },
                  { title: "landing.why4.title", desc: "landing.why4.desc", accent: false },
                ].map((w, i) => (
                  <FadeIn key={w.title} delay={i * 80}>
                    <div className={`p-5 rounded-xl transition-colors ${w.accent ? "bg-vw-accent/[0.06] border border-vw-accent/[0.08]" : "bg-vw-surface"}`}>
                      <h3 className="text-sm font-semibold mb-1.5">{t(w.title as TranslationKey)}</h3>
                      <p className="text-sm text-vw-muted leading-relaxed">{t(w.desc as TranslationKey)}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ====== PAYMENT - Simple row ====== */}
        <section className="pb-24 sm:pb-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="border-t border-vw-border pt-12">
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                <div>
                  <h3 className="text-lg font-semibold mb-1.5">{t("landing.payment.title")}</h3>
                  <p className="text-sm text-vw-muted leading-relaxed">{t("landing.payment.desc")}</p>
                </div>
                <div className="lg:col-span-2 flex flex-wrap gap-3">
                  {[
                    { icon: Smartphone, name: "QRIS", desc: "GoPay, DANA, OVO" },
                    { icon: Banknote, name: "Transfer Bank", desc: "BCA, Mandiri, BNI" },
                    { icon: Wallet, name: "E-Wallet", desc: "GoPay, DANA, OVO" },
                    { icon: Store, name: "Retail", desc: "Indomaret, Alfamart" },
                  ].map((pm) => (
                    <div key={pm.name} className="flex items-center gap-3 bg-vw-surface border border-vw-border rounded-xl px-4 py-3">
                      <pm.icon size={16} className="text-vw-accent shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{pm.name}</div>
                        <div className="text-[11px] text-vw-muted">{pm.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== FAQ ====== */}
        <section id="faq" className="py-24 sm:py-32 px-6 border-t border-vw-border bg-vw-surface">
          <div className="max-w-2xl mx-auto">
            <FadeIn className="mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance">{t("landing.faq.title")}</h2>
            </FadeIn>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={faq.q} className="bg-vw-bg rounded-xl overflow-hidden border border-vw-border">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-vw-surface transition-colors">
                    <h3 className="text-sm font-medium pr-4">{faq.q}</h3>
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}>
                      <Plus size={13} className="text-vw-muted" />
                    </div>
                  </button>
                  <div className={`transition-all duration-300 ease-out overflow-hidden ${openFaq === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-5 pb-5 text-sm text-vw-muted leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== CTA ====== */}
        <section className="py-28 sm:py-36 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4 text-balance">{t("landing.cta.title")}</h2>
              <p className="text-sm text-vw-muted mb-8 max-w-sm mx-auto">{t("landing.cta.desc")}</p>
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
            </FadeIn>
          </div>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-vw-border py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
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
              <h3 className="text-xs font-semibold text-vw-muted mb-4">{t("landing.footer.layanan")}</h3>
              <ul className="space-y-3">
                {["Netflix Premium", "Spotify Premium", "Canva Pro", "ChatGPT Plus"].map(l => (
                  <li key={l}><a href="#layanan" className="text-sm text-vw-muted hover:text-vw-text transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-vw-muted mb-4">{t("landing.footer.kontak")}</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm text-vw-muted"><HeadphonesIcon size={14} />+62 812-3456-7890</li>
                <li className="flex items-center gap-2.5 text-sm text-vw-muted"><Globe size={14} />@VitalwoundsStore_Bot</li>
                <li className="flex items-center gap-2.5 text-sm text-vw-muted"><MessageSquare size={14} />support@vitalwounds-store.com</li>
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
