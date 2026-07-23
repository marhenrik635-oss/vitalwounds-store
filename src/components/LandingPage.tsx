import { useState, useEffect } from "react"
import { ArrowRight, Plus, Smartphone, Banknote, Wallet, Store, Film, Music, Youtube, Palette, BrainCircuit, Video, HeadphonesIcon, MessageSquare, Star, MessageCircle, ShoppingCart, Zap, Timer } from "lucide-react"
import { useT } from "../i18n/LanguageContext"
import OceanBg from "./OceanBg"
import type { TranslationKey } from "../i18n/translations"
import { motion, useReducedMotion } from "framer-motion"
import CountUp from "./CountUp"

// Import Shadcn UI Components
import { Button } from "../../components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../../components/ui/accordion"

interface LPProps {
  navigateTo: (view: "landing" | "auth" | "dashboard-panel", tabId?: string) => void
  isLoggedIn: boolean
}

export default function LandingPage({ navigateTo, isLoggedIn }: LPProps) {
  const t = useT()
  const scrolled = false // simplified scrolled state check logic for compile safety
  const reduceMotion = useReducedMotion()

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

  const TESTIMONIALS = [
    { name: "Andi Pratama", role: "Pengguna Setia", text: "Baru 5 menit setelah bayar, akun Netflix langsung aktif. Recommended banget!", rating: 5 },
    { name: "Siti Rahmawati", role: "Mahasiswa", text: "Canva Pro-nya works 100%. Desain tugas jadi lebih cepet beres. Makasih Vitalwounds!", rating: 5 },
    { name: "Dimas Ardiansyah", role: "Content Creator", text: "Udah order berkali-kali, gapernah zonk. CapCut Pro buat konten TikTok jadi makin gacor.", rating: 5 },
    { name: "Rina Marlina", role: "Ibu Rumah Tangga", text: "Spotify Premium buat anak-anak belajar online. Murah meriah, recomended buat emak-emak.", rating: 5 },
    { name: "Fajar Nugroho", role: "Freelancer", text: "ChatGPT Plus ngebantu banget buat riset artikel. Udah langganan 3 bulan, no drama.", rating: 5 },
    { name: "Dewi Sartika", role: "Guru", text: "YouTube Premium buat nonton video pembelajaran tanpa iklan. Anak didik senang, saya pun senang.", rating: 4 },
  ]

  const FLASH_SALE = [
    { name: "Netflix Premium", icon: Film, price: "Rp 25.000", original: "Rp 30.000", stock: 12 },
    { name: "Spotify Premium", icon: Music, price: "Rp 10.000", original: "Rp 15.000", stock: 8 },
    { name: "ChatGPT Plus", icon: BrainCircuit, price: "Rp 42.000", original: "Rp 49.000", stock: 5 },
  ]

  const [liveViewers] = useState(() => Math.floor(Math.random() * 20) + 8)

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
    <div className="min-h-[100dvh] text-vw-text antialiased overflow-x-hidden relative selection:bg-vw-accent/30 pb-16 sm:pb-0">
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

          <Button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")} variant="default" size="default" className="bg-vw-accent hover:bg-vw-accent-hover text-white rounded-xl">
            {isLoggedIn ? t("nav.dashboard") : t("auth.login")}
          </Button>
        </div>
      </header>

      <main id="content">
        {/* ====== HERO ====== */}
        <section className="relative pt-24 pt-28 md:pt-32 pb-20 px-6 min-h-[90dvh] flex items-center">
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
                  <Button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")} variant="default" className="bg-vw-accent hover:bg-vw-accent-hover text-white py-6 px-8 rounded-xl flex items-center justify-center gap-2">
                    {t("landing.hero.cta")} <ArrowRight size={16} />
                  </Button>
                  <Button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")} variant="outline" className="border border-vw-border hover:border-vw-text-muted hover:bg-vw-surface py-6 px-8 rounded-xl text-vw-text-muted hover:text-vw-text">
                    {t("landing.hero.lihat")}
                  </Button>
                </div>
              </motion.div>

              <motion.div 
                {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] } })}
                className="lg:col-span-5 flex justify-center lg:justify-end"
              >
                <Card className="w-full max-w-sm bg-vw-surface rounded-2xl p-8 border border-vw-border">
                  <CardHeader className="p-0 mb-4">
                    <CardDescription className="text-xs text-vw-text-muted font-bold">Mulai dari</CardDescription>
                    <CardTitle className="text-4xl sm:text-5xl font-bold tracking-tight text-vw-text">
                      Rp 800<span className="text-sm font-normal text-vw-text-muted">/unit</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-8 space-y-4">
                    {["Netflix 4K UHD", "Spotify Premium", "YouTube Premium", "Canva Pro"].map((item) => (
                      <div key={item} className="flex items-center gap-3.5 text-sm text-vw-text-muted font-medium">
                        <div className="w-2 h-2 rounded-full bg-vw-accent" />
                        {item}
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="p-0 flex flex-col mt-8">
                    <Button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")} className="w-full py-6 bg-vw-accent hover:bg-vw-accent-hover text-white rounded-xl">
                      Mulai Belanja
                    </Button>
                    <div className="w-full mt-5 pt-4 border-t border-vw-border/60 flex items-center justify-between text-[10px] text-vw-muted">
                      <span className="flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {liveViewers} orang sedang lihat
                      </span>
                      <span className="flex items-center gap-1 font-medium text-amber-600/80">
                        <Timer size={10} />
                        Stok terbatas
                      </span>
                    </div>
                  </CardFooter>
                </Card>
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

        {/* ====== TESTIMONIALS ====== */}
        <section className="py-24 sm:py-28 px-6 border-t border-vw-border overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <motion.div {...animProps()}>
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-xs font-semibold text-vw-muted ml-2">4.8 dari 2.000+ ulasan</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">Apa kata mereka?</h2>
              </motion.div>
            </div>

            <div className="relative">
              <div className="flex gap-5 animate-marquee mb-5 w-max">
                {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                  <Card key={i} className="w-72 sm:w-80 shrink-0 bg-vw-surface rounded-2xl p-6 border border-vw-border flex flex-col justify-between">
                    <CardHeader className="p-0 mb-3">
                      <div className="flex items-center gap-1">
                        {Array.from({length: 5}, (_, j) => (
                          <Star key={j} size={12} className={j < t.rating ? "text-amber-400 fill-amber-400" : "text-vw-border/60"} />
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 text-sm text-vw-text leading-relaxed mb-4">
                      "{t.text}"
                    </CardContent>
                    <CardFooter className="p-0 flex items-center gap-2.5 pt-3 border-t border-vw-border/50">
                      <div className="w-8 h-8 rounded-full bg-vw-accent/10 flex items-center justify-center text-[11px] font-bold text-vw-accent shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-vw-text">{t.name}</p>
                        <p className="text-[10px] text-vw-muted">{t.role}</p>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ====== FLASH SALE ====== */}
        <section className="py-16 sm:py-20 px-6 border-t border-vw-border bg-gradient-to-r from-amber-50/60 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
              <motion.div {...animProps()}>
                <div className="flex items-center gap-2.5 mb-2">
                  <Zap size={16} className="text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.15em]">Flash Sale</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance">Harga spesial hari ini</h2>
              </motion.div>
              <motion.div {...animProps(100)}>
                <span className="flex items-center gap-1.5 text-xs text-vw-muted font-medium bg-vw-surface px-4 py-2 rounded-full border border-vw-border">
                  <Timer size={12} className="text-amber-500" />
                  Promo berlaku 08:00 - 23:59 WIB
                </span>
              </motion.div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {FLASH_SALE.map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.div key={item.name} {...animProps(i * 80)}>
                    <Card className="relative bg-vw-surface rounded-2xl p-6 border border-vw-border hover:border-amber-300/50 transition-all duration-300 group flex flex-col justify-between">
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        HEMAT {Math.round((1 - parseInt(item.price.replace(/\D/g,'')) / parseInt(item.original.replace(/\D/g,''))) * 100)}%
                      </div>
                      <CardHeader className="p-0 flex flex-row items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                          <Icon size={18} className="text-amber-600" />
                        </div>
                        <CardTitle className="text-base font-semibold text-vw-text">{item.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-vw-text">{item.price}</span>
                          <span className="text-sm text-vw-muted line-through">{item.original}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="p-0 flex items-center justify-between">
                        <span className="text-[10px] text-vw-muted">
                          Sisa <span className="font-bold text-amber-600">{item.stock}</span> slot
                        </span>
                        <Button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")} className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg">
                          Pesan
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )
              })}
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
                      <Card className="bg-vw-surface rounded-2xl p-6 sm:p-8 border border-vw-border hover:border-vw-accent/30 transition-all duration-300">
                        <CardHeader className="p-0 mb-4">
                          <div className="w-11 h-11 rounded-xl bg-vw-accent/[0.08] flex items-center justify-center transition-all">
                            <Icon size={20} className="text-vw-accent" />
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 flex sm:flex-row flex-col sm:items-center gap-4 sm:gap-6">
                          <div className="flex-1 space-y-1.5">
                            <CardTitle className="text-lg font-semibold text-vw-text">{app.name}</CardTitle>
                            <CardDescription className="text-sm text-vw-text-muted leading-relaxed max-w-prose">{app.desc}</CardDescription>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-vw-border/60">
                            <span className="text-lg font-bold text-vw-text">{app.price}</span>
                            <Button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")} className="text-xs px-4 py-2 bg-vw-accent/[0.08] hover:bg-vw-accent text-vw-accent hover:text-white rounded-lg">
                              Pesan
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 space-y-6">
                <p className="text-xs text-vw-accent font-bold mb-4">Work & Creation</p>

                {/* Canva Pro featured */}
                <motion.div {...animProps(150)}>
                  <Card className="bg-vw-accent/[0.03] rounded-2xl p-6 sm:p-8 border border-vw-accent/[0.12] hover:border-vw-accent/40 transition-all duration-300">
                    <CardHeader className="p-0 flex justify-between items-start mb-5">
                      <div className="w-11 h-11 rounded-xl bg-vw-accent/[0.1] flex items-center justify-center transition-all">
                        <Palette size={20} className="text-vw-accent" />
                      </div>
                      <span className="text-[10px] font-bold text-vw-accent bg-vw-accent/[0.1] px-3 py-1 rounded-full">POPULAR</span>
                    </CardHeader>
                    <CardContent className="p-0">
                      <CardTitle className="text-xl font-semibold mb-2 text-vw-text">Canva Pro</CardTitle>
                      <CardDescription className="text-sm text-vw-text-muted leading-relaxed mb-8 max-w-prose">Akses lifetime, template premium, 1TB cloud storage untuk kebutuhan desain profesional tanpa batas.</CardDescription>
                    </CardContent>
                    <CardFooter className="p-0 flex items-center justify-between pt-6 border-t border-vw-accent/[0.12]">
                      <div>
                        <span className="text-[10px] text-vw-text-muted block mb-0.5">Harga Spesial</span>
                        <span className="text-xl font-bold text-vw-text">Rp 25.000</span>
                      </div>
                      <Button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")} className="text-sm bg-vw-accent hover:bg-vw-accent-hover text-white px-5 py-6 rounded-xl">
                        Pesan Sekarang
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>

                {/* ChatGPT & CapCut */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {APP_CARDS.slice(4, 6).map((app, i) => {
                    const Icon = app.icon
                    return (
                      <motion.div key={app.name} {...animProps(200 + i * 100)} className="h-full">
                        <Card className="bg-vw-surface rounded-2xl p-6 border border-vw-border hover:border-vw-accent/30 transition-all duration-300 flex flex-col h-full justify-between">
                          <CardHeader className="p-0 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-vw-accent/[0.06] flex items-center justify-center transition-all">
                              <Icon size={18} className="text-vw-accent" />
                            </div>
                            <CardTitle className="text-base font-semibold mb-1 text-vw-text">{app.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <CardDescription className="text-xs text-vw-text-muted leading-relaxed mb-6 max-w-prose">{app.desc}</CardDescription>
                          </CardContent>
                          <CardFooter className="p-0 flex items-center justify-between pt-4 border-t border-vw-border/60 mt-auto">
                            <span className="text-base font-bold text-vw-text">{app.price}</span>
                            <Button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")} variant="link" className="text-xs font-semibold text-vw-accent hover:text-vw-text p-0 h-auto">
                              Pesan
                            </Button>
                          </CardFooter>
                        </Card>
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
                    <Card className={`p-6 rounded-2xl transition-colors border ${w.accent ? "bg-vw-accent/[0.04] border-vw-accent/[0.15]" : "bg-vw-surface border-vw-border"}`}>
                      <CardHeader className="p-0 mb-2">
                        <CardTitle className="text-base font-semibold text-vw-text">{t(w.title as TranslationKey)}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <CardDescription className="text-sm text-vw-text-muted leading-relaxed max-w-prose">{t(w.desc as TranslationKey)}</CardDescription>
                      </CardContent>
                    </Card>
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
                      <Card className="flex items-center gap-4 bg-vw-surface border border-vw-border rounded-2xl px-5 py-3">
                        <pm.icon size={18} className="text-vw-accent shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-vw-text">{pm.name}</div>
                          <div className="text-[11px] font-medium text-vw-text-muted">{pm.desc}</div>
                        </div>
                      </Card>
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

            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={faq.q} value={`item-${i}`} className="border-b border-vw-border/60 py-2">
                  <AccordionTrigger className="hover:no-underline hover:opacity-80">
                    <h3 className="text-base sm:text-lg font-semibold pr-4 text-vw-text">{faq.q}</h3>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-vw-text-muted leading-relaxed max-w-prose">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ====== CTA ====== */}
        <section className="py-28 sm:py-36 px-6 text-center border-t border-vw-border">
          <div className="max-w-xl mx-auto">
            <motion.div {...animProps()}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance">{t("landing.cta.title")}</h2>
              <p className="text-sm sm:text-base text-vw-text-muted mb-8 max-w-sm mx-auto">{t("landing.cta.desc")}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button onClick={() => navigateTo("auth", "dashboard")} className="px-6 py-6 bg-vw-accent hover:bg-vw-accent-hover text-white rounded-xl">
                  {t("landing.cta.register")}
                </Button>
                <Button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")} variant="outline" className="px-6 py-6 border border-vw-border hover:border-vw-text-muted hover:bg-vw-surface rounded-xl text-vw-text-muted hover:text-vw-text">
                  {t("landing.cta.login")}
                </Button>
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
                <li className="flex items-center gap-2.5 text-sm text-vw-text-muted"><HeadphonesIcon size={14} className="text-vw-accent" />088983082523</li>
                <li className="flex items-center gap-2.5 text-sm text-vw-text-muted"><MessageSquare size={14} className="text-vw-accent" />vitalwoundsstore@gmail.com</li>
                <li><a href="https://discord.gg/G4qbWnrxxk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-vw-text-muted hover:text-[#5865F2] transition-colors"><svg viewBox="0 0 127.14 96.36" width="14" height="14" className="text-[#5865F2] shrink-0" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>Join Our Store</a></li>
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

      {/* ====== WhatsApp Floating Button ====== */}
      <a
        href="https://wa.me/6288983082523?text=Halo%20Vitalwounds%20Store%2C%20saya%20mau%20tanya%20produk"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="Hubungi via WhatsApp"
      >
        <MessageCircle size={26} />
      </a>

      {/* ====== Sticky Mobile CTA ====== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-vw-surface/95 backdrop-blur-md border-t border-vw-border p-3 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-vw-muted font-medium">Mulai dari</p>
            <p className="text-base font-bold text-vw-text">Rp 800<span className="text-xs font-normal text-vw-muted">/unit</span></p>
          </div>
          <Button
            onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
            className="flex items-center gap-2 px-6 py-6 bg-vw-accent hover:bg-vw-accent-hover text-white rounded-xl shadow-btn"
          >
            <ShoppingCart size={15} />
            Mulai Belanja
          </Button>
        </div>
      </div>
    </div>
  )
}
