import { useState, useEffect, useRef } from "react"
import { ArrowRight, Check, Zap, Sparkles, Smartphone, Banknote, Wallet, Store, ChevronRight, HeadphonesIcon, Gift, Film, Music, Palette, Video, BrainCircuit, Youtube, Star, Shield, UserPlus, ShoppingCart, MessageSquare, Globe } from "lucide-react"
import { BRAND_LOGOS } from "./BRAND_LOGOS"

interface LPProps {
  navigateTo: (view: "landing" | "auth" | "dashboard-panel", tabId?: string) => void
  isLoggedIn: boolean
}

// 3D Background component (Using model-viewer for interaction)
const ThreeDBackground = () => {
  return (
    <model-viewer
      src="/logo.glb"
      alt="Vitalwounds Logo"
      auto-rotate
      camera-controls
      rotation-per-second="15deg"
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
        pointerEvents: 'none' // Biar tidak mengganggu klik di atasnya
      }}
    />
  )
}

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
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const end = value
    const duration = 1800
    const startTime = performance.now()
    const updateCount = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      setCount(Math.floor(easeProgress * end))
      if (progress < 1) requestAnimationFrame(updateCount)
    }
    requestAnimationFrame(updateCount)
  }, [value, visible])

  return (
    <span ref={ref}>
      {formatNum(count)}{suffix}
    </span>
  )
}

const FAQS = [
  { q: "Bagaimana cara deposit?", a: "Login ke dashboard, pilih menu Deposit, masukkan jumlah (min Rp 10.000), lalu lakukan pembayaran melalui QRIS (GoPay, DANA, OVO, ShopeePay, M-Banking), Transfer Bank, atau Indomaret/Alfamart. Saldo masuk otomatis dalam hitungan detik." },
  { q: "Apa saja aplikasi premium yang tersedia?", a: "Kami menyediakan berbagai aplikasi premium: Netflix 4K UHD, Spotify Premium, YouTube Premium, Canva Pro (lifetime), ChatGPT Plus, CapCut Pro, dan 20+ aplikasi premium lainnya. Semua dalam satu platform dengan harga terjangkau." },
  { q: "Berapa lama proses pengiriman akun?", a: "Proses aktivasi instan dalam 1-5 menit setelah pembayaran diverifikasi. Akun dan kredensial dikirim langsung ke email yang Anda daftarkan." },
  { q: "Apakah ada garansi?", a: "Ya, setiap pembelian dilindungi garansi 100% uang kembali. Jika layanan gagal atau tidak sesuai, silakan hubungi customer service kami via WhatsApp atau dashboard tiket." },
  { q: "Apakah bisa upgrade akun atau ganti aplikasi?", a: "Tentu. Jika Anda ingin upgrade ke paket yang lebih tinggi atau ganti aplikasi, silakan hubungi customer service kami. Kami akan bantu prosesnya dengan cepat." },
  { q: "Apakah data saya aman?", a: "Keamanan adalah prioritas utama kami. Seluruh transaksi menggunakan koneksi terenkripsi SSL. Data pribadi Anda tidak akan pernah dibagikan ke pihak ketiga. Server kami menggunakan proteksi firewall dan anti-DDoS." },
]

const TESTIMONIALS = [
  { name: "Rian Hidayat", role: "Reseller, Jakarta", review: "Proses pengiriman akun Spotify dan Netflix instan banget, sangat membantu bisnis reseller saya. Udah repeat order puluhan kali." },
  { name: "Siti Rahma", role: "Mahasiswa, Bandung", review: "Harga kompetitif dan proses cepat. Langganan Canva Pro langsung aktif. Recommended banget buat anak desain." },
  { name: "Rina Marlina", role: "Freelancer, Makassar", review: "Customer service responsif via WhatsApp. Ada kendala langsung dibantu. Pelayanan terbaik." },
  { name: "Andi Pratama", role: "Mahasiswa, Malang", review: "ChatGPT Plus langsung aktif dalam 2 menit. Makin produktif ngerjain tugas kuliah." },
  { name: "Dewi Sartika", role: "UMKM Owner, Bandung", review: "Canva Pro lifetime harganya murah banget. Udah bikin puluhan desain from scratch." },
  { name: "Fajar Nugroho", role: "Karyawan, Semarang", review: "Netflix 4K UHD quality mantap. Garansi full 30 hari, recommended store buat langganan." },
]

const WHY_US = [
  { icon: Zap, title: "Proses Instan Otomatis", desc: "Semua order diproses otomatis oleh sistem dalam hitungan detik. Tidak perlu verifikasi manual." },
  { icon: Shield, title: "Garansi 100% Uang Kembali", desc: "Setiap pembelian dilindungi garansi penuh. Gagal? Uang kembali full tanpa syarat ribet." },
  { icon: HeadphonesIcon, title: "Customer Service 24/7", desc: "Tim support siap membantu via WhatsApp, Telegram, dan tiket kapan pun Anda butuh bantuan." },
  { icon: Gift, title: "Harga Termurah & Promo", desc: "Harga lebih murah dari pasaran. Dapatkan diskon, cashback, dan promo spesial setiap minggu." },
]

const PAYMENT_METHODS = [
  { icon: Smartphone, name: "QRIS", desc: "GoPay, DANA, OVO, ShopeePay, M-Banking", badge: "Paling Cepat" },
  { icon: Banknote, name: "Transfer Bank", desc: "BCA, Mandiri, BNI, BRI", badge: "Semua Bank" },
  { icon: Wallet, name: "E-Wallet", desc: "GoPay, DANA, OVO, LinkAja, ShopeePay", badge: "No Admin" },
  { icon: Store, name: "Retail", desc: "Indomaret, Alfamart", badge: "Tunai" },
]

const APP_CARDS = [
  { icon: Film, name: "Netflix Premium", desc: "Akses 4K UHD, semua konten, shared screen, garansi 30 hari.", price: "Rp 30.000", badge: "Best Seller" },
  { icon: Music, name: "Spotify Premium", desc: "Bebas iklan, download offline, kualitas audio tinggi.", price: "Rp 15.000", badge: "Terlaris" },
  { icon: Youtube, name: "YouTube Premium", desc: "Tanpa iklan, putar background, YouTube Music included.", price: "Rp 12.000", badge: "" },
  { icon: Palette, name: "Canva Pro", desc: "Akses lifetime, template premium, 1TB cloud storage.", price: "Rp 25.000", badge: "Hemat" },
  { icon: BrainCircuit, name: "ChatGPT Plus", desc: "GPT-4o, DALL-E 3, custom GPTs, tanpa batas chat.", price: "Rp 49.000", badge: "" },
  { icon: Video, name: "CapCut Pro", desc: "Bebas watermark, semua efek pro, ekspor maksimal.", price: "Rp 18.000", badge: "" },
]

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Reduced motion check
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Small delay ensures opacity-0 is painted before animation starts
          requestAnimationFrame(() => { setShow(true) })
          obs.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${className} ${show ? "section-reveal" : "opacity-0 translate-y-9"}`}
      style={{ animationDelay: show ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  )
}

export default function LandingPage({ navigateTo, isLoggedIn }: LPProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-vw-bg text-vw-text antialiased overflow-x-hidden relative">
      <ThreeDBackground />
      <div className="grain-overlay" aria-hidden="true" />
      <a href="#main-content" className="skip-link">Langsung ke konten utama</a>

      {/* ====== NAV ====== */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 px-4">
        <nav className={`w-full max-w-6xl transition-all duration-500 ${scrolled ? "bg-vw-surface/90 backdrop-blur-xl border border-vw-border/60 shadow-card rounded-2xl" : "bg-transparent border-transparent"} h-14 flex items-center justify-between px-5`}>
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }) }}
            className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-xl bg-vw-accent flex items-center justify-center text-xs font-bold text-white group-hover:scale-110 transition-transform duration-300">VW</span>
            <span className="text-sm font-bold tracking-tight">Vitalwounds</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {["Layanan", "Testimoni", "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-xs font-medium text-vw-muted hover:text-vw-text transition-colors duration-200">{item}</a>
            ))}
          </div>
          <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-vw-text text-white hover:bg-vw-accent transition-all duration-200 active:scale-95">
            {isLoggedIn ? "Dashboard" : "Masuk"}
          </button>
        </nav>
      </header>

      {/* ====== HERO ====== */}
      <section id="main-content" className="min-h-[100dvh] flex flex-col justify-center px-5 pt-28 pb-16 relative">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="hero-enter hero-enter-d1 flex flex-wrap justify-center lg:justify-start items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-vw-surface/80 border border-vw-border text-vw-muted tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Instant Delivery &middot; Support 24/7
            </div>

            <h1 className="hero-enter hero-enter-d2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.05]">
              Pusat Layanan Digital<br className="hidden sm:block" />
              <span className="text-vw-accent">Premium</span> Terlengkap
            </h1>

            <p className="hero-enter hero-enter-d3 text-sm sm:text-base text-vw-muted leading-relaxed max-w-[55ch] mx-auto lg:mx-0">
              Pusat <strong>App Premium</strong> terlengkap: Netflix 4K, Spotify, YouTube, Canva Pro, ChatGPT Plus, CapCut Pro, dan 20+ aplikasi lainnya. Instan, garansi penuh.
            </p>

            <div className="hero-enter hero-enter-d4 flex flex-wrap justify-center lg:justify-start items-center gap-3 pt-2">
              <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                className="btn-primary px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 shadow-btn group">
                Mulai Belanja <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <a href="#layanan" className="btn-ghost px-6 py-3 text-sm font-semibold inline-flex items-center gap-2">
                <Zap size={16} /> Lihat Layanan
              </a>
            </div>
          </div>

          {/* Asymmetric right: premium pricing card with subtle float */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-gradient-to-br from-vw-accent/5 via-vw-surface to-vw-bg border border-vw-border p-8 shadow-card animate-float">
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <Sparkles size={12} className="text-white" />
              </div>
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-vw-muted">Mulai dari</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl sm:text-5xl font-bold text-vw-text tracking-tight">Rp 800</span>
                    <span className="text-sm text-vw-muted font-medium">/unit</span>
                  </div>
                </div>
                <div className="h-px bg-vw-border/60" />
                <ul className="space-y-3">
                  {[
                    "Netflix 4K UHD mulai Rp 30.000/bln",
                    "Spotify Premium mulai Rp 15.000/bln",
                    "YouTube Premium mulai Rp 12.000/bln",
                    "Canva Pro Lifetime hanya Rp 25.000",
                    "ChatGPT Plus mulai Rp 49.000",
                    "Proses instan & garansi penuh",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-vw-muted">
                      <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== STATS STRIP — fades in after hero via CSS ====== */}
      <section className="stats-enter border-t border-vw-border py-12 sm:py-16 bg-vw-surface/50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-3 gap-8 sm:gap-16 max-w-2xl mx-auto">
            {[
              { value: 43, suffix: "+", label: "Produk Premium" },
              { value: 2000, suffix: "+", label: "Pengguna Aktif" },
              { value: 2000000, suffix: "+", label: "Transaksi Sukses" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-vw-text tracking-tight">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-vw-muted mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== BRAND LOGOS — flowing strip, no cards ====== */}
      <section className="border-t border-vw-border overflow-hidden py-12">
        <div className="relative">
          <div className="flex gap-10 items-center animate-marquee">
            {[...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <img src={brand.src} alt={brand.name}
                  className="w-6 h-6 object-contain opacity-60" />
                <span className="text-xs font-medium text-vw-muted whitespace-nowrap">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="border-t border-vw-border py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">3 Langkah Mulai</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: UserPlus, num: "01", title: "Daftar Akun", desc: "Buat akun gratis dalam 1 menit. Cukup masukkan email dan buat password." },
              { icon: Wallet, num: "02", title: "Deposit Saldo", desc: "Isi saldo via QRIS, Virtual Account, E-Wallet, atau Indomaret/Alfamart. Instan." },
              { icon: ShoppingCart, num: "03", title: "Pesan Layanan", desc: "Pilih produk, masukkan target, sistem proses otomatis. Selesai." },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <Reveal key={item.num} delay={i * 150}>
                  <div className="relative text-center p-6 rounded-2xl bg-vw-surface/60 border border-vw-border/50 hover:border-vw-accent/15 hover:shadow-elevated hover:-translate-y-1 transition-all duration-400">
                    <div className="w-14 h-14 rounded-2xl bg-vw-accent/8 flex items-center justify-center mx-auto mb-4">
                      <Icon size={22} className="text-vw-accent" />
                    </div>
                    <span className="text-[10px] font-bold text-vw-accent/60 tracking-widest block mb-1">{item.num}</span>
                    <h3 className="font-bold text-sm text-vw-text mb-2">{item.title}</h3>
                    <p className="text-xs text-vw-muted leading-relaxed">{item.desc}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== APP PREMIUM SERVICES ====== */}
      <section id="layanan" className="border-t border-vw-border py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">App Premium & Akun Digital</h2>
            <p className="text-sm text-vw-muted mt-3 max-w-lg mx-auto leading-relaxed">
              Nikmati akses premium ke aplikasi favorit Anda dengan harga terjangkau.
            </p>
          </div>

          {/* Featured card — asymmetric layout */}
          <Reveal delay={0}>
          <div className="rounded-3xl border border-vw-border/70 bg-vw-surface overflow-hidden mb-6">
            <div className="grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-7 sm:p-9">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-vw-accent flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200/50">Mulai Rp 12.000</span>
                </div>
                <h3 className="text-lg font-bold text-vw-text mb-3">Semua Aplikasi Premium dalam Satu Platform</h3>
                <p className="text-sm text-vw-muted leading-relaxed mb-5 max-w-xl">
                  Netflix 4K UHD, Spotify Premium, YouTube Premium, Canva Pro Lifetime, ChatGPT Plus, CapCut Pro, dan 20+ aplikasi premium lainnya. Proses aktivasi instan, garansi penuh selama masa sewa.
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {["Netflix 4K UHD", "Spotify Premium", "YouTube Premium", "Canva Pro", "ChatGPT Plus", "CapCut Pro"].map(p => (
                    <div key={p} className="flex items-center gap-2 text-xs text-vw-muted">
                      <Check size={12} className="text-emerald-500 shrink-0" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 bg-gradient-to-br from-vw-accent/[0.04] to-vw-bg p-7 sm:p-9 flex flex-col justify-center items-center text-center border-t lg:border-t-0 lg:border-l border-vw-border/70">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-vw-muted mb-2">Mulai dari</span>
                <p className="text-4xl sm:text-5xl font-bold text-vw-accent tracking-tight">Rp 12.000</p>
                <p className="text-sm text-vw-muted mt-1 mb-5">per akun / bulan</p>
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                  className="px-6 py-2.5 rounded-xl bg-vw-accent text-white text-xs font-semibold hover:bg-vw-accent-hover transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]">
                  Lihat Semua Produk <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
          </Reveal>

          {/* App grid — 3 cols, varied visual weight */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {APP_CARDS.map((app, i) => {
              const Icon = app.icon
              const isWide = i === 0
              const ColorIcon = ({ className }: { className?: string }) => <Icon size={16} className={className || "text-white"} />
              return (
                <Reveal key={i} delay={i * 100} className={isWide ? "sm:col-span-2 lg:col-span-1" : ""}>
                <div className="rounded-2xl border border-vw-border/60 bg-vw-surface p-5 hover:border-vw-accent/15 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-400">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-vw-accent/10 flex items-center justify-center">
                      <ColorIcon className="text-vw-accent" />
                    </div>
                    {app.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-vw-accent/10 text-vw-accent text-[9px] font-bold">{app.badge}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-vw-text mb-1.5">{app.name}</h3>
                  <p className="text-xs text-vw-muted leading-relaxed mb-3">{app.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-vw-border/60">
                    <span className="text-base font-bold text-vw-accent">{app.price}</span>
                    <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "layanan/app-premium")}
                      className="text-[10px] font-semibold text-vw-accent hover:underline flex items-center gap-0.5">
                      Beli <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== WHY US — 2x2 bento with visual diversity ====== */}
      <Reveal>
      <section className="border-t border-vw-border py-16 sm:py-20 bg-gradient-to-b from-vw-surface/30 to-transparent">
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Kenapa Ribuan Pengguna Memilih Kami?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl">
            {WHY_US.map((item, i) => {
              const Icon = item.icon
              const bgColors = ["bg-vw-accent/5", "bg-emerald-50/50", "bg-vw-accent/5 border-vw-accent/10", "bg-vw-surface"]
              const borderColors = ["border-vw-border/60", "border-emerald-200/30", "border-vw-accent/10", "border-vw-border/60"]
              return (
                <div key={item.title} className={`rounded-2xl ${bgColors[i]} border ${borderColors[i]} p-6 transition-all duration-200 hover:shadow-elevated`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl ${i === 1 ? "bg-emerald-100" : "bg-vw-accent/10"} flex items-center justify-center shrink-0`}>
                      <Icon size={19} className={i === 1 ? "text-emerald-600" : "text-vw-accent"} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-vw-text mb-1.5">{item.title}</h3>
                      <p className="text-xs text-vw-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ====== PAYMENT METHODS — clean cards, no marquee ====== */}
      <Reveal>
      <section className="border-t border-vw-border py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Metode Pembayaran</h2>
            <p className="text-sm text-vw-muted mt-3 max-w-lg leading-relaxed">
              Deposit instan via berbagai metode favorit Anda. Saldo masuk otomatis dalam hitungan detik.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PAYMENT_METHODS.map((m, i) => {
              const Icon = m.icon
              const accentColors = ["text-emerald-600 bg-emerald-50 border-emerald-100", "text-blue-600 bg-blue-50 border-blue-100", "text-purple-600 bg-purple-50 border-purple-100", "text-amber-600 bg-amber-50 border-amber-100"]
              const colorClass = accentColors[i]
              return (
                <div key={i} className="rounded-2xl border border-vw-border/60 bg-vw-surface p-5 transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${colorClass.split(" ").slice(1).join(" ")} flex items-center justify-center`}>
                      <Icon size={18} className={colorClass.split(" ")[0]} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200/50">{m.badge}</span>
                  </div>
                  <h3 className="text-sm font-bold text-vw-text mb-1.5">{m.name}</h3>
                  <p className="text-xs text-vw-muted leading-relaxed">{m.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ====== TESTIMONIALS — horizontal scroll snap ====== */}
      <section id="testimoni" className="border-t border-vw-border py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Apa Kata Pelanggan Kami</h2>
            <p className="text-sm text-vw-muted mt-3">Lebih dari 2 juta transaksi sukses dan terus bertambah.</p>
          </div>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-5 px-5 scrollbar-none">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 120}>
              <div className="snap-start shrink-0 w-[280px] sm:w-[320px] rounded-2xl bg-vw-surface border border-vw-border/60 p-5 flex flex-col justify-between hover:border-vw-accent/15 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-400">
                <div>
                  <div className="flex gap-0.5 mb-3 text-amber-400">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={12} fill="currentColor" stroke="none" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-vw-muted leading-relaxed mb-4">{t.review}</p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-vw-border/60">
                  <div className="w-8 h-8 rounded-full bg-vw-accent/10 flex items-center justify-center text-[11px] font-bold text-vw-accent">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-vw-text">{t.name}</p>
                    <p className="text-[10px] text-vw-muted">{t.role}</p>
                  </div>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FAQ — full-width accordion ====== */}
      <Reveal>
      <section id="faq" className="border-t border-vw-border py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Punya Pertanyaan?</h2>
            <p className="text-sm text-vw-muted mt-3">Jawaban untuk pertanyaan yang paling sering diajukan.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-vw-border/60 bg-vw-surface overflow-hidden transition-all duration-200 hover:shadow-card">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors duration-150">
                  <span className="text-xs sm:text-sm font-semibold text-vw-text">{faq.q}</span>
                  <span className={`text-base font-medium ml-4 shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === i ? "rotate-45 bg-vw-accent/10 text-vw-accent" : "bg-vw-border/50 text-vw-muted"}`}>+</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-60" : "max-h-0"}`}>
                  <div className="px-5 pb-4 text-xs sm:text-sm text-vw-muted leading-relaxed">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ====== CTA — dark premium section ====== */}
      <Reveal>
      <section className="border-t border-vw-border">
        <div className="max-w-6xl mx-auto px-5 pb-10 pt-10">
          <div className="rounded-3xl bg-gradient-to-br from-vw-text via-vw-text/95 to-vw-accent/90 px-6 py-16 sm:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/[0.03] translate-x-1/3 -translate-y-1/3" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full bg-white/[0.02] -translate-x-1/4 translate-y-1/4" aria-hidden="true" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Siap Mulai Belanja?</h2>
              <p className="text-sm text-white/70 max-w-lg mx-auto mb-8 leading-relaxed">
                Buat akun gratis sekarang dan nikmati kemudahan berbelanja layanan digital premium secara instan.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => navigateTo("auth", "dashboard")}
                  className="px-7 py-3 text-sm font-bold rounded-xl bg-white text-vw-text hover:bg-vw-accent hover:text-white transition-all duration-200 inline-flex items-center gap-2 shadow-lg shadow-black/10 active:scale-95 group">
                  Daftar Gratis <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <button onClick={() => navigateTo(isLoggedIn ? "dashboard-panel" : "auth", "dashboard")}
                  className="px-7 py-3 text-sm font-semibold rounded-xl border border-white/20 text-white/80 hover:bg-white/10 transition-all duration-200 active:scale-95">
                  Login ke Akun
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-vw-border bg-vw-surface">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-xl bg-vw-accent flex items-center justify-center text-xs font-bold text-white">VW</span>
                <span className="text-sm font-bold tracking-tight">Vitalwounds</span>
              </div>
              <p className="text-xs text-vw-muted leading-relaxed max-w-xs">Penyedia layanan digital premium terpercaya di Indonesia. Proses instan, harga termurah, garansi penuh.</p>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.15em] font-bold text-vw-muted mb-4">Layanan</h4>
              <ul className="space-y-2.5">
                {[{ label: "Netflix Premium", href: "#layanan" }, { label: "Spotify Premium", href: "#layanan" }, { label: "Canva Pro", href: "#layanan" }, { label: "ChatGPT Plus", href: "#layanan" }].map(l => (
                  <li key={l.label}><a href={l.href} className="text-xs text-vw-muted hover:text-vw-text transition-colors duration-150">{l.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.15em] font-bold text-vw-muted mb-4">Perusahaan</h4>
              <ul className="space-y-2.5">
                {["Tentang", "Blog", "Karir", "Mitra"].map(l => (
                  <li key={l}><a href="#" className="text-xs text-vw-muted hover:text-vw-text transition-colors duration-150">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.15em] font-bold text-vw-muted mb-4">Kontak</h4>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2">
                  <HeadphonesIcon size={12} className="shrink-0 text-vw-muted mt-0.5" />
                  <span className="text-xs text-vw-muted">+62 812-3456-7890 (WA)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe size={12} className="shrink-0 text-vw-muted mt-0.5" />
                  <span className="text-xs text-vw-muted">@VitalwoundsStore_Bot</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare size={12} className="shrink-0 text-vw-muted mt-0.5" />
                  <span className="text-xs text-vw-muted">support@vitalwounds-store.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-vw-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] text-vw-muted">&copy; 2026 Vitalwounds Store</span>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[10px] text-vw-muted hover:text-vw-text transition-colors">Kebijakan Privasi</a>
              <span className="text-vw-muted/30">/</span>
              <a href="#" className="text-[10px] text-vw-muted hover:text-vw-text transition-colors">Syarat & Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
