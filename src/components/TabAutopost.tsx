import { useState, useEffect } from "react";
import {
  Star, Sparkles, Zap, Crown, Gem, Timer, Infinity,
  Wallet, ShieldCheck, Loader2, Check, AlertCircle,
  ArrowRight, Ban, Lock, ExternalLink, CalendarClock,
  CheckCircle2,
} from "lucide-react";

/**
 * TabAutopost — LANDING PAGE Autopost (vitalwounds.my.id/layanan/autopost)
 * =========================================================================
 * Desain original (commit 95a09bc + 0c71c2e, sky-blue premium, anti-AI-slop).
 *
 * Aturan akses:
 *  - Pricing & info SELALU terlihat (tanpa login — bukan login wall).
 *  - Belum login  → tombol "Masuk untuk berlangganan".
 *  - Login, belum beli → pilih paket, bayar dari SALDO DEPOSIT.
 *  - Login, sudah beli → lihat tanggal kadaluarsa + tombol buka dashboard.
 *  - AKSES SSO KE DASHBOARD HANYA untuk yang SUDAH berlangganan
 *    (server /api/autopost/sso menolak user tanpa subscription).
 *  - Dashboard misi lengkap ada di autopost.vitalwounds.my.id.
 */

// ─── Pricing Plans (original) ───────────────────────────────────────
const PLANS = [
  { key: '1month',  label: '1 Bulan',     price: 10000, originalPrice: null,     duration: '30 Hari',     icon: 'star',    color: 'from-blue-500 to-blue-600',     badge: null,      servers: 'Unlimited server' },
  { key: '3months', label: '3 Bulan',     price: 25000, originalPrice: 30000,    duration: '90 Hari',     icon: 'sparkles', color: 'from-sky-500 to-sky-600', badge: 'Populer',    servers: 'Unlimited server' },
  { key: '6months', label: '6 Bulan',     price: 45000, originalPrice: 54000,    duration: '180 Hari',    icon: 'zap',     color: 'from-violet-500 to-violet-600', badge: 'Irit',       servers: 'Unlimited server' },
  { key: '1year',   label: '1 Tahun',     price: 90000, originalPrice: 120000,   duration: '365 Hari',    icon: 'crown',   color: 'from-amber-500 to-amber-600', badge: 'Best Value', servers: 'Unlimited server' },
  { key: 'lifetime',label: 'Seumur Hidup', price: 100000, originalPrice: 200000,  duration: 'Selamanya',   icon: 'gem',     color: 'from-rose-500 to-purple-600', badge: 'Diskon 50%', servers: 'Unlimited server' },
];

function formatPrice(price: number) {
  return "Rp " + price.toLocaleString("id-ID");
}

function formatDate(ts: number | null | undefined) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Berapa bulan lagi subscription aktif — hitung SELISIH BULAN KALENDER (bukan
// 30 hari), jadi paket 1 Tahun = "12 bulan lagi", bukan 13.
function monthsRemaining(endDate: number | null | undefined) {
  if (!endDate) return null; // lifetime / tanpa batas
  const now = new Date();
  const end = new Date(endDate);
  if (end.getTime() <= now.getTime()) return 0;
  let months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  // Ada sisa hari di bulan berjalan → tetap minimal tampil 1 (jangan 0).
  return Math.max(1, months);
}

function getPlanIcon(icon: string) {
  switch (icon) {
    case 'star': return <Star size={18} />;
    case 'sparkles': return <Sparkles size={18} />;
    case 'zap': return <Zap size={18} />;
    case 'crown': return <Crown size={18} />;
    case 'gem': return <Gem size={18} />;
    default: return <Sparkles size={18} />;
  }
}

function getDurationIcon(plan: string) {
  if (plan === 'lifetime') return <Infinity size={14} />;
  return <Timer size={14} />;
}

interface SubInfo {
  id?: number;
  plan?: string;
  planLabel?: string;
  startDate?: number;
  endDate?: number | null;
  status?: string;
  authorized?: boolean;
  hasValidSubscription?: boolean;
}

type PageState = "loading" | "anon" | "no_subscription" | "active" | "error";

export default function TabAutopost() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [subscription, setSubscription] = useState<SubInfo | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseOk, setPurchaseOk] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    // Tampilkan pesan kalau datang dari redirect SSO yang ditolak
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "no_subscription") {
      setUrlError("Kamu perlu berlangganan dulu sebelum bisa membuka dashboard Autopost.");
    }
    checkSubscription();
  }, []);

  async function checkSubscription() {
    setPageState("loading");
    try {
      const res = await fetch("/api/autopost/subscription", { credentials: "same-origin" });
      if (res.status === 401) { setPageState("anon"); return; }
      if (!res.ok) { setPageState("error"); return; }
      const data = await res.json();
      setSubscription(data.subscription || null);
      setUserBalance(data.balance || 0);
      setUserEmail(data.email || "");
      const active = data.hasValidSubscription || data.subscription?.status === "active";
      setPageState(active ? "active" : "no_subscription");
    } catch {
      setPageState("error");
    }
  }

  async function handlePurchase(planKey: string) {
    setPurchasing(planKey);
    setPurchaseError(null);
    setPurchaseOk(null);
    try {
      const res = await fetch("/api/autopost/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.shortfall) {
          setPurchaseError(`Saldo tidak mencukupi. Butuh ${formatPrice(data.required)}, saldo ${formatPrice(data.balance)}.`);
        } else {
          setPurchaseError(data.error || "Gagal melakukan pembelian");
        }
        return;
      }
      setPurchaseOk(`Paket berhasil diaktifkan! Saldo tersisa: ${formatPrice(data.balance ?? userBalance)}`);
      // Langsung kasih akses dashboard (SSO) setelah bayar sukses
      setTimeout(() => { window.location.href = "/api/autopost/sso"; }, 1200);
    } catch (err: any) {
      setPurchaseError("Terjadi kesalahan: " + err.message);
    } finally {
      setPurchasing(null);
    }
  }

  // ═══ RENDER: LOADING ═══
  if (pageState === "loading") {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="max-w-md mx-auto py-20 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-vw-accent mb-4" />
          <p className="text-sm text-vw-muted">Memeriksa status langganan...</p>
        </div>
      </div>
    );
  }

  // ═══ RENDER: ERROR ═══
  if (pageState === "error") {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="max-w-md mx-auto py-20 text-center">
          <AlertCircle size={32} className="mx-auto text-red-500 mb-4" />
          <p className="text-sm text-red-600">Gagal memeriksa status. Muat ulang halaman atau coba lagi nanti.</p>
        </div>
      </div>
    );
  }

  // ═══ RENDER: SUDAH AKTIF — status + akses dashboard ═══
  if (pageState === "active") {
    const monthsLeft = monthsRemaining(subscription?.endDate);
    return (
      <div className="p-4 lg:p-6 animate-fade-in">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-vw-accent/10 border border-vw-accent/20 flex items-center justify-center mx-auto mb-4">
              <Zap size={26} className="text-vw-accent" />
            </div>
            <h2 className="text-lg font-bold text-vw-text tracking-tight">Autopost</h2>
            <p className="text-sm text-vw-muted mt-1">
              Dashboard Autopost kamu siap digunakan.
            </p>
          </div>

          <div className="bg-vw-surface border border-vw-border rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <h3 className="font-bold text-sm text-vw-text">Langganan Aktif</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Status</p>
                <p className="text-emerald-700 font-bold text-sm mt-1">Aktif ✅</p>
              </div>
              <div className="p-3 rounded-lg bg-vw-border/30">
                <p className="text-[10px] text-vw-muted font-semibold uppercase tracking-wider flex items-center gap-1">
                  <CalendarClock size={10} /> Sisa Masa Aktif
                </p>
                <p className="text-vw-text font-semibold text-sm mt-1">
                  {monthsLeft === null ? "Seumur Hidup" : `${monthsLeft} bulan lagi`}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-vw-border/30">
                <p className="text-[10px] text-vw-muted font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Wallet size={10} /> Saldo
                </p>
                <p className="text-vw-text font-semibold text-sm mt-1">{formatPrice(userBalance)}</p>
              </div>
            </div>
            <p className="text-[11px] text-vw-muted/80 mb-3">
              Aktif sampai <span className="font-semibold text-vw-text">{formatDate(subscription?.endDate)}</span>
            </p>
            <a href="/api/autopost/sso"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-vw-accent text-white text-sm font-semibold hover:bg-vw-accent-hover transition-all cursor-pointer shadow-btn">
              <ShieldCheck size={16} />
              Buka Dashboard Autopost <ArrowRight size={14} />
            </a>
            <p className="text-[11px] text-vw-muted/70 text-center mt-3">
              Sesi login dibawa otomatis — tidak perlu masuk lagi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══ RENDER: BELUM LOGIN — pricing tetap terlihat (bukan login wall) ═══
  if (pageState === "anon") {
    return (
      <div className="p-4 lg:p-6 animate-fade-in">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-vw-accent/10 border border-vw-accent/20 flex items-center justify-center mx-auto mb-4">
              <Zap size={26} className="text-vw-accent" />
            </div>
            <h2 className="text-lg font-bold text-vw-text tracking-tight">Autopost</h2>
            <p className="text-sm text-vw-muted max-w-md mx-auto mt-1">
              Aktifkan fitur Autopost untuk menjadwalkan dan mengotomatiskan postingan di Discord server kamu.
            </p>
          </div>

          {/* Login CTA */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-vw-surface border border-vw-border rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-vw-accent/10 flex items-center justify-center">
                  <Lock size={18} className="text-vw-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-vw-muted/70">Berlangganan</p>
                  <p className="text-sm font-bold text-vw-text">Masuk untuk membeli paket Autopost</p>
                </div>
              </div>
              <a href="/api/auth/login?redirect=%2Flayanan%2Fautopost"
                className="px-4 py-2 rounded-lg bg-vw-accent text-white text-[11px] font-semibold hover:bg-vw-accent-hover transition-all cursor-pointer whitespace-nowrap">
                Masuk
              </a>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PLANS.map((plan) => (
              <PricingCard key={plan.key} plan={plan} purchasing={null} onBuy={() => {}} disabled />
            ))}
          </div>

          <p className="text-center text-[10px] text-vw-muted/40 mt-8 max-w-md mx-auto">
            Pembayaran dipotong dari saldo Vitalwounds kamu. Masuk untuk melihat saldo & berlangganan.
          </p>
        </div>
      </div>
    );
  }

  // ═══ RENDER: BELUM BERLANGGANAN — pilih paket + bayar saldo ═══
  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-vw-accent/10 border border-vw-accent/20 flex items-center justify-center mx-auto mb-4">
            <Zap size={26} className="text-vw-accent" />
          </div>
          <h2 className="text-lg font-bold text-vw-text tracking-tight">Autopost</h2>
          <p className="text-sm text-vw-muted max-w-md mx-auto mt-1">
            Aktifkan fitur Autopost untuk menjadwalkan dan mengotomatiskan postingan di Discord server kamu.
          </p>
        </div>

        {urlError && (
          <div className="max-w-4xl mx-auto mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{urlError}</span>
          </div>
        )}

        {/* Balance */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-vw-surface border border-vw-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-vw-accent/10 flex items-center justify-center">
                <Wallet size={18} className="text-vw-accent" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-vw-muted/70">Saldo Kamu</p>
                <p className="text-sm font-bold text-vw-text">{formatPrice(userBalance)}</p>
              </div>
            </div>
            <a href="/deposit"
              className="px-3 py-1.5 rounded-lg bg-vw-accent text-white text-[11px] font-semibold hover:bg-vw-accent-hover transition-all cursor-pointer">
              + Isi Saldo
            </a>
          </div>
          {purchaseError && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle size={14} /> {purchaseError}
            </div>
          )}
          {purchaseOk && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <Check size={14} /> {purchaseOk}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.key}
              plan={plan}
              purchasing={purchasing}
              onBuy={() => handlePurchase(plan.key)}
              disabled={false}
              balance={userBalance}
            />
          ))}
        </div>

        <p className="text-center text-[10px] text-vw-muted/40 mt-8 max-w-md mx-auto">
          Pembayaran dipotong dari saldo Vitalwounds kamu. Pastikan saldo mencukupi sebelum membeli paket.
        </p>
      </div>
    </div>
  );
}

// ─── Pricing Card (dipakai anon & no_subscription) ──────────────────
function PricingCard({
  plan, purchasing, onBuy, disabled, balance,
}: {
  plan: typeof PLANS[number];
  purchasing: string | null;
  onBuy: () => void;
  disabled: boolean;
  balance?: number;
}) {
  const busy = purchasing === plan.key;
  const afford = typeof balance === "number" ? balance >= plan.price : true;
  return (
    <div
      className={`relative bg-vw-surface border rounded-xl p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        plan.badge === 'Populer'
          ? 'border-vw-accent/30 ring-1 ring-vw-accent/20 shadow-md'
          : 'border-vw-border hover:border-vw-accent/20'
      }`}
    >
      {plan.badge && (
        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r ${plan.color} shadow-sm`}>
          {plan.badge}
        </div>
      )}
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-3 shadow-sm`}>
        {getPlanIcon(plan.icon)}
      </div>
      <h3 className="font-bold text-sm text-vw-text mb-1">{plan.label}</h3>
      <div className="flex items-center gap-1 text-[10px] text-vw-muted/60 mb-3">
        {getDurationIcon(plan.key)}
        <span>{plan.duration}</span>
      </div>
      <div className="mb-4">
        <p className="text-xl font-bold text-vw-text tracking-tight">{formatPrice(plan.price)}</p>
        {plan.originalPrice && (
          <p className="text-[10px] text-vw-muted/50 line-through mt-0.5">{formatPrice(plan.originalPrice)}</p>
        )}
      </div>
      <div className="space-y-1.5 mb-5 flex-1">
        {[
          'Akses penuh Autopost',
          plan.servers,
          'Support prioritas',
          plan.key !== '1month' && plan.key !== '3months' ? 'Konfigurasi custom' : null,
          plan.key === 'lifetime' ? 'Semua update gratis' : null,
        ].filter(Boolean).map((feat, fi) => (
          <div key={fi} className="flex items-start gap-1.5">
            <Check size={11} className="text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-[10.5px] text-vw-muted/80">{feat}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onBuy}
        disabled={disabled || busy || (typeof balance === "number" && !afford)}
        className={`w-full py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 active:scale-[0.97] bg-gradient-to-r ${plan.color}`}
      >
        {busy ? (
          <span className="flex items-center justify-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Memproses...
          </span>
        ) : disabled ? (
          <span className="flex items-center justify-center gap-1.5">Masuk untuk beli <ArrowRight size={12} /></span>
        ) : afford ? (
          <span className="flex items-center justify-center gap-1.5">Aktifkan <ArrowRight size={12} /></span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">Saldo Kurang <ArrowRight size={12} /></span>
        )}
      </button>
    </div>
  );
}
