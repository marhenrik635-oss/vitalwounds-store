import { useState, useEffect } from "react"
import { ArrowRight, Plus, Smartphone, Banknote, Wallet, Store, Film, Music, Youtube, Palette, BrainCircuit, Video, HeadphonesIcon, Globe, MessageSquare } from "lucide-react"
import { useT } from "../i18n/LanguageContext"
import OceanBg from "./OceanBg"
import type { TranslationKey } from "../i18n/translations"
import { motion, useReducedMotion } from "framer-motion"
import CountUp from "./CountUp"

interface LPProps {
  navigateTo: (view: "landing" | "auth" | "dashboard-panel", tabId?: string) => void
  isLoggedIn: boolean
}

export default function LandingPage({ navigateTo, isLoggedIn }: LPProps) {
  const t = useT()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const reduceMotion = useReducedMotion()

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

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  }

  const animProps = (delay = 0) => {
    if (reduceMotion) return {}
    return {
      initial: "hidden",
      whileInView: "visible",
      viewport: { once: true, amount: 0.1 },
      variants: fadeInVariants,
      transition: { delay: delay / 1000 }
    }
  }

  return (
    <div className="min-h-[100dvh] text-vw-text antialiased overflow-x-hidden relative selection:bg-vw-accent/30">
      <OceanBg />
      <div className="grain-overlay" aria-hidden="true" />
      <a href="#content" className="fixed -top-full left-0 z-50 px-4 py-2 bg-vw-text text-vw-bg text-xs font-semibold rounded-br-lg transition-all focus:top-0">Skip to content</a>

      {/* ====== HEADER ====== */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? "bg-vw-bg/85 backdrop-blur-md border-b border-vw-border" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }) }}
            className="flex items-center gap-3 group">
            <img src="/logo.png" alt="Vitalwounds Store" className="w-8 h-8 rounded-lg group-hover:scale-[0.97] transition-transform object-contain bg-white" />
            <span className="font-semibold tracking-tight text-vw-text">Vitalwounds Store</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#layanan" className="text-sm font-medium text-vw-text-muted hover:text-vw-text transition-colors">Layanan</a>
            <a href="#faq" className="text-sm font-medium text-vw-text-muted hover:text-vw-text transition-colors">FAQ</a>
          </nav>

          <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
            className="px-5 py-2.5 bg-vw-accent hover:bg-vw-accent-hover text-white text-sm font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
            {isLoggedIn ? t("nav.dashboard") : t("auth.login")}
          </button>
        </div>
      </header>

      <main id="content">
        {/* ====== HERO ====== */}
        <section className="relative pt-24 sm:pt-28 md:pt-32 pb-20 px-6 min-h-[90dvh] flex items-center">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <motion.div 
                {...(reduceMotion ? {} : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } })}
                className="lg:col-span-7 space-y-8 max-w-xl"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[1.05] text-balance">
                  {t("landing.hero.h1")}{" "}
                  <span className="text-vw-accent">{t("landing.hero.h1.premium")}</span>{" "}
                  {t("landing.hero.h1.suffix")}
                </h1>

                <p className="text-base sm:text-lg text-vw-text-muted leading-relaxed max-w-md">
                  {t("landing.hero.desc")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                    className="px-6 py-3.5 bg-vw-accent hover:bg-vw-accent-hover text-white text-sm font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2">
                    {t("landing.hero.cta")} <ArrowRight size={16} />
                  </button>
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                    className="px-6 py-3.5 border border-vw-border hover:border-vw-text-muted hover:bg-vw-surface text-sm font-semibold rounded-xl active:scale-[0.98] transition-all text-vw-text-muted hover:text-vw-text">
                    {t("landing.hero.lihat")}
                  </button>
                </div>
              </motion.div>

              <motion.div 
                {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] } })}
                className="lg:col-span-5 flex justify-center lg:justify-end"
              >
                <div className="w-full max-w-sm bg-vw-surface rounded-2xl p-8 border border-vw-border">
                  <p className="text-xs text-vw-text-muted font-bold mb-4">Mulai dari</p>
                  <div className="text-4xl sm:text-5xl font-bold tracking-tight mb-2 text-vw-text">
                    Rp 8.000<span className="text-sm font-normal text-vw-text-muted">/unit</span>
                  </div>
                  <div className="mt-8 space-y-4">
                    {["Netflix 4K UHD", "Spotify Premium", "YouTube Premium", "Canva Pro"].map((item) => (
                      <div key={item} className="flex items-center gap-3.5 text-sm text-vw-text-muted font-medium">
                        <div className="w-2 h-2 rounded-full bg-vw-accent" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                    className="mt-8 w-full py-3.5 bg-vw-accent hover:bg-vw-accent-hover text-white text-sm font-semibold rounded-xl hover:scale-[1.01] active:scale-[0.98] transition-all">
                    Mulai Belanja
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ====== STATS ====== */}
        <section className="py-24 sm:py-28 px-6 border-t border-vw-border bg-vw-surface">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <motion.div {...animProps(0)}>
                <div className="text-4xl lg:text-5xl font-bold tracking-tight text-vw-accent">
                  <CountUp end={43} suffix="+" />
                </div>
                <p className="text-sm font-medium text-vw-text-muted mt-2">Total Produk</p>
              </motion.div>
              <motion.div {...animProps(100)}>
                <div className="text-4xl lg:text-5xl font-bold tracking-tight text-vw-accent">
                  <CountUp end={2000} suffix="+" />
                </div>
                <p className="text-sm font-medium text-vw-text-muted mt-2">User Aktif</p>
              </motion.div>
              <motion.div {...animProps(200)}>
                <div className="text-4xl lg:text-5xl font-bold tracking-tight text-vw-accent">
                  <CountUp end={2} suffix="Jt+" />
                </div>
                <p className="text-sm font-medium text-vw-text-muted mt-2">Transaksi Berhasil</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ====== SERVICES ====== */}
        <section id="layanan" className="py-24 sm:py-32 px-6 border-t border-vw-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 mb-20 items-end">
              <motion.div {...animProps()}>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">{t("landing.services.title")}</h2>
              </motion.div>
              <motion.div {...animProps(100)}>
                <p className="text-sm sm:text-base text-vw-text-muted leading-relaxed max-w-md lg:ml-auto">{t("landing.services.desc")}</p>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-6">
                <p className="text-xs text-vw-accent font-bold mb-4">Entertainment Essentials</p>
                {APP_CARDS.slice(0, 3).map((app, i) => {
                  const Icon = app.icon
                  return (
                    <motion.div key={app.name} {...animProps(i * 100)}>
                      <div className="bg-vw-surface rounded-2xl p-6 sm:p-8 border border-vw-border hover:border-vw-accent/30 transition-all duration-300">
                        <div className="w-11 h-11 rounded-xl bg-vw-accent/[0.08] flex items-center justify-center mb-4 transition-all">
                          <Icon size={20} className="text-vw-accent" />
                        </div>
                        <div className="flex sm:flex-row flex-col sm:items-center gap-4 sm:gap-6">
                          <div className="flex-1 space-y-1.5">
                            <h3 className="text-lg font-semibold text-vw-text">{app.name}</h3>
                            <p className="text-sm text-vw-text-muted leading-relaxed max-w-prose">{app.desc}</p>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-vw-border/60">
                            <span className="text-lg font-bold text-vw-text">{app.price}</span>
                            <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                              className="text-xs font-semibold px-4 py-2 bg-vw-accent/[0.08] hover:bg-vw-accent text-vw-accent hover:text-white rounded-lg transition-all">
                              Pesan
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 space-y-6">
                <p className="text-xs text-vw-accent font-bold mb-4">Work & Creation</p>

                {/* Canva Pro featured */}
                <motion.div {...animProps(150)}>
                  <div className="bg-vw-accent/[0.03] rounded-2xl p-6 sm:p-8 border border-vw-accent/[0.12] hover:border-vw-accent/40 transition-all duration-300">
                    <div className="flex justify-between items-start mb-5">
                      <div className="w-11 h-11 rounded-xl bg-vw-accent/[0.1] flex items-center justify-center transition-all">
                        <Palette size={20} className="text-vw-accent" />
                      </div>
                      <span className="text-[10px] font-bold text-vw-accent bg-vw-accent/[0.1] px-3 py-1 rounded-full">POPULAR</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-vw-text">Canva Pro</h3>
                    <p className="text-sm text-vw-text-muted leading-relaxed mb-8 max-w-prose">Akses lifetime, template premium, 1TB cloud storage untuk kebutuhan desain profesional tanpa batas.</p>
                    <div className="flex items-center justify-between pt-6 border-t border-vw-accent/[0.12]">
                      <div>
                        <span className="text-[10px] text-vw-text-muted block mb-0.5">Harga Spesial</span>
                        <span className="text-xl font-bold text-vw-text">Rp 25.000</span>
                      </div>
                      <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                        className="text-sm font-semibold bg-vw-accent hover:bg-vw-accent-hover text-white px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                        Pesan Sekarang
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* ChatGPT & CapCut */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {APP_CARDS.slice(4, 6).map((app, i) => {
                    const Icon = app.icon
                    return (
                      <motion.div key={app.name} {...animProps(200 + i * 100)} className="h-full">
                        <div className="bg-vw-surface rounded-2xl p-6 border border-vw-border hover:border-vw-accent/30 transition-all duration-300 flex flex-col h-full justify-between">
                          <div>
                            <div className="w-10 h-10 rounded-xl bg-vw-accent/[0.06] flex items-center justify-center mb-4 transition-all">
                              <Icon size={18} className="text-vw-accent" />
                            </div>
                            <h3 className="text-base font-semibold mb-1 text-vw-text">{app.name}</h3>
                            <p className="text-xs text-vw-text-muted leading-relaxed mb-6 max-w-prose">{app.desc}</p>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-vw-border/60 mt-auto">
                            <span className="text-base font-bold text-vw-text">{app.price}</span>
                            <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                              className="text-xs font-semibold text-vw-accent hover:text-vw-text transition-colors">
                              Pesan
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== HOW IT WORKS ====== */}
        <section className="py-24 sm:py-32 px-6 border-t border-vw-border bg-vw-surface">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <motion.div {...animProps()}>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">{t("landing.steps.title")}</h2>
              </motion.div>
            </div>
            <div className="grid sm:grid-cols-3 gap-12 relative">
              <div className="hidden sm:block absolute top-12 left-[16.66%] right-[16.66%] h-[1px] bg-vw-border" aria-hidden="true" />
              {[
                { icon: Smartphone, label: "Daftar Akun Gratis", desc: "Buat akun dalam 1 menit. Cukup masukkan email dan buat password." },
                { icon: Wallet, label: "Deposit Saldo", desc: "Isi saldo via QRIS, Virtual Account, E-Wallet, atau Indomaret. Instan." },
                { icon: ArrowRight, label: "Pesan & Nikmati", desc: "Pilih produk, masukkan target, sistem proses otomatis. Selesai." },
              ].map((item, i) => (
                <motion.div key={item.label} {...animProps(i * 120)}>
                  <div className="text-center sm:text-left relative">
                    <div className="w-14 h-14 rounded-2xl bg-vw-bg flex items-center justify-center mx-auto sm:mx-0 mb-6 border border-vw-border relative z-10 transition-all">
                      <item.icon size={22} className="text-vw-accent" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-vw-text">{item.label}</h3>
                    <p className="text-sm text-vw-text-muted leading-relaxed max-w-xs mx-auto sm:mx-0">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== WHY US ====== */}
        <section className="py-24 sm:py-32 px-6 border-t border-vw-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
              <div className="lg:col-span-5">
                <motion.div {...animProps()}>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance mb-6">{t("landing.why.title")}</h2>
                  <p className="text-sm sm:text-base text-vw-text-muted leading-relaxed max-w-prose">Platform yang dirancang untuk memberikan pengalaman terbaik dalam berbelanja layanan digital premium.</p>
                </motion.div>
              </div>
              <div className="lg:col-span-7 space-y-6">
                {[
                  { title: "landing.why1.title", desc: "landing.why1.desc", accent: true },
                  { title: "landing.why2.title", desc: "landing.why2.desc", accent: false },
                  { title: "landing.why3.title", desc: "landing.why3.desc", accent: false },
                  { title: "landing.why4.title", desc: "landing.why4.desc", accent: false },
                ].map((w, i) => (
                  <motion.div key={w.title} {...animProps(i * 80)}>
                    <div className={`p-6 rounded-2xl transition-colors border ${w.accent ? "bg-vw-accent/[0.04] border-vw-accent/[0.15]" : "bg-vw-surface border-vw-border"}`}>
                      <h3 className="text-base font-semibold mb-2 text-vw-text">{t(w.title as TranslationKey)}</h3>
                      <p className="text-sm text-vw-text-muted leading-relaxed max-w-prose">{t(w.desc as TranslationKey)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ====== PAYMENT ====== */}
        <section className="pb-24 sm:pb-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="border-t border-vw-border pt-16">
              <div className="grid lg:grid-cols-3 gap-8 items-start">
                <motion.div {...animProps()}>
                  <h3 className="text-lg font-semibold mb-2 text-vw-text">{t("landing.payment.title")}</h3>
                  <p className="text-sm text-vw-text-muted leading-relaxed max-w-prose">{t("landing.payment.desc")}</p>
                </motion.div>
                <div className="lg:col-span-2 flex flex-wrap gap-4">
                  {[
                    { icon: Smartphone, name: "QRIS", desc: "GoPay, DANA, OVO" },
                    { icon: Banknote, name: "Transfer Bank", desc: "BCA, Mandiri, BNI" },
                    { icon: Wallet, name: "E-Wallet", desc: "GoPay, DANA, OVO" },
                    { icon: Store, name: "Retail", desc: "Indomaret, Alfamart" },
                  ].map((pm, i) => (
                    <motion.div key={pm.name} {...animProps(i * 50)}>
                      <div className="flex items-center gap-4 bg-vw-surface border border-vw-border rounded-2xl px-5 py-3">
                        <pm.icon size={18} className="text-vw-accent shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-vw-text">{pm.name}</div>
                          <div className="text-[11px] font-medium text-vw-text-muted">{pm.desc}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== FAQ ====== */}
        <section id="faq" className="py-24 sm:py-32 px-6 border-t border-vw-border bg-vw-surface">
          <div className="max-w-2xl mx-auto">
            <div className="mb-16">
              <motion.div {...animProps()}>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">{t("landing.faq.title")}</h2>
              </motion.div>
            </div>

            <div className="divide-y divide-vw-border/60">
              {FAQS.map((faq, i) => (
                <div key={faq.q} className="py-2">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full py-4 flex items-center justify-between text-left hover:opacity-80 transition-opacity">
                    <h3 className="text-base sm:text-lg font-semibold pr-4 text-vw-text">{faq.q}</h3>
                    <div className={`w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}>
                      <Plus size={14} className="text-vw-accent" />
                    </div>
                  </button>
                  <div className={`transition-all duration-300 ease-out overflow-hidden ${openFaq === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="pb-4 pt-1 text-sm text-vw-text-muted leading-relaxed max-w-prose">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== CTA ====== */}
        <section className="py-28 sm:py-36 px-6 text-center border-t border-vw-border">
          <div className="max-w-xl mx-auto">
            <motion.div {...animProps()}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance">{t("landing.cta.title")}</h2>
              <p className="text-sm sm:text-base text-vw-text-muted mb-8 max-w-sm mx-auto">{t("landing.cta.desc")}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button onClick={() => navigateTo("auth", "dashboard")}
                  className="px-6 py-3 bg-vw-accent hover:bg-vw-accent-hover text-white text-sm font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {t("landing.cta.register")}
                </button>
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                  className="px-6 py-3 border border-vw-border hover:border-vw-text-muted hover:bg-vw-surface text-sm font-semibold rounded-xl active:scale-[0.98] transition-all text-vw-text-muted hover:text-vw-text">
                  {t("landing.cta.login")}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-vw-border py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Vitalwounds Store" className="w-8 h-8 rounded-lg object-contain bg-white" />
                <span className="font-semibold tracking-tight text-vw-text">Vitalwounds Store</span>
              </div>
              <p className="text-sm text-vw-text-muted leading-relaxed max-w-xs">{t("landing.footer.desc")}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-vw-text-muted mb-4">{t("landing.footer.layanan")}</p>
              <ul className="space-y-3">
                {["Netflix Premium", "Spotify Premium", "Canva Pro", "ChatGPT Plus"].map(l => (
                  <li key={l}><a href="#layanan" className="text-sm text-vw-text-muted hover:text-vw-text transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-vw-text-muted mb-4">{t("landing.footer.kontak")}</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm text-vw-text-muted"><HeadphonesIcon size={14} className="text-vw-accent" />+62 812-3456-7890</li>
                <li className="flex items-center gap-2.5 text-sm text-vw-text-muted"><Globe size={14} className="text-vw-accent" />@VitalwoundsStore_Bot</li>
                <li className="flex items-center gap-2.5 text-sm text-vw-text-muted"><MessageSquare size={14} className="text-vw-accent" />support@vitalwounds-store.com</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-vw-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-vw-text-muted">&copy; 2026 Vitalwounds Store. {t("landing.footer.copyright")}</span>
            <div className="flex gap-6">
              <span className="text-xs text-vw-text-muted">{t("landing.footer.privacy")}</span>
              <a href="/tos" target="_blank" rel="noopener noreferrer" className="text-xs text-vw-text-muted hover:text-vw-text transition-colors">{t("landing.footer.terms")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
