import { useState, useEffect, useMemo } from "react";
import { Wallet, ShoppingBag, TrendingUp, Gem, BellRing, ArrowRight, Sparkles, Clock, CheckCircle2, BarChart3, PieChart, DollarSign } from "lucide-react";
import { UserProfile, Order, Deposit } from "../types";
import WelcomeBanner from "./WelcomeBanner";
import { useT } from "../i18n/LanguageContext";

interface TabDashboardProps {
  userProfile: UserProfile;
  orders: Order[];
  deposits: Deposit[];
  onTabChange: (tab: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

// --- Mini SVG Charts ---
function SpendingChart({ orders, t }: { orders: Order[]; t: (k: any) => string }) {
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    orders.forEach(o => {
      if (o.price && o.date) {
        const parts = o.date.split(/[\/\s-]/);
        if (parts.length >= 2) {
          const month = parts[1]?.padStart(2, "0") || "01";
          const year = parts[0]?.length === 4 ? parts[0] : (new Date().getFullYear().toString());
          const key = `${year}-${month}`;
          months[key] = (months[key] || 0) + o.price;
        }
      }
    });
    return Object.entries(months).sort().slice(-6);
  }, [orders]);

  const maxVal = Math.max(...monthlyData.map(([_, v]) => v), 1);

  if (!monthlyData.length) {
    return <p className="text-xs text-vw-muted text-center py-6">{t("analytics.no.data")}</p>;
  }

  return (
    <div className="flex items-end gap-2 h-24">
      {monthlyData.map(([key, val], i) => {
        const h = (val / maxVal) * 100;
        const monthName = new Date(key + "-01").toLocaleDateString("id-ID", { month: "short" });
        return (
          <div key={key} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[8px] text-vw-muted font-medium">{fmt(val)}</span>
            <div
              className="w-full rounded-lg bg-vw-accent/70 hover:bg-vw-accent transition-all duration-200"
              style={{ height: `${Math.max(h, 4)}%` }}
            />
            <span className="text-[9px] text-vw-muted font-medium">{monthName}</span>
          </div>
        );
      })}
    </div>
  );
}

function FavoriteProductsChart({ orders, t }: { orders: Order[]; t: (k: any) => string }) {
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      const name = o.productName || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [orders]);

  const maxCount = Math.max(...productCounts.map(([_, c]) => c), 1);

  if (!productCounts.length) {
    return <p className="text-xs text-vw-muted text-center py-6">{t("analytics.no.data")}</p>;
  }

  return (
    <div className="space-y-2">
      {productCounts.map(([name, count]) => (
        <div key={name} className="flex items-center gap-2">
          <span className="text-[10px] text-vw-text w-24 truncate shrink-0">{name}</span>
          <div className="flex-1 h-5 rounded-full bg-vw-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-vw-accent/60 to-vw-accent transition-all duration-500"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-vw-muted w-6 text-right">{count}x</span>
        </div>
      ))}
    </div>
  );
}

function BalanceHistoryChart({ deposits, orders, t }: { deposits: Deposit[]; orders: Order[]; t: (k: any) => string }) {
  const totalSpent = orders.reduce((s, o) => s + (o.price || 0), 0);
  const totalDeposited = deposits.filter(d => d.status === "SUCCESS").reduce((s, d) => s + d.amount, 0);
  const avgOrder = orders.length ? Math.round(totalSpent / orders.length) : 0;
  const thisMonthOrders = orders.filter(o => {
    if (!o.date) return false;
    const now = new Date();
    const parts = o.date.split(/[\/\s-]/);
    return parts[1] === String(now.getMonth() + 1).padStart(2, "0");
  }).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: t("analytics.total.order"), value: orders.length, color: "#3B82F6" },
        { label: t("analytics.total.spent"), value: fmt(totalSpent), color: "#8B5CF6" },
        { label: t("analytics.avg.order"), value: fmt(avgOrder), color: "#10B981" },
      ].map((s) => (
        <div key={s.label} className="text-center p-3 rounded-xl bg-vw-accent-subtle">
          <p className="text-[9px] text-vw-muted/70 font-medium uppercase tracking-[0.08em]">{s.label}</p>
          <p className="text-sm font-bold text-vw-text mt-1" style={{ color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-vw-border/60 bg-vw-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl skeleton" />
        <div className="w-4 h-4 skeleton" />
      </div>
      <div className="w-16 h-3 skeleton mb-2" />
      <div className="w-24 h-5 skeleton" />
    </div>
  );
}

export default function TabDashboard({ userProfile, orders, deposits, onTabChange }: TabDashboardProps) {
  const t = useT();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const totalDeposited = deposits.filter(d => d.status === "SUCCESS").reduce((s, d) => s + d.amount, 0);
  const successOrdersCount = orders.filter(o => o.status === "Success" || o.status === "Processing").length;

  const stats = [
    { icon: Wallet, label: t("stats.balance"), value: fmt(userProfile.balance), accent: "#2563EB", tab: "deposit" },
    { icon: ShoppingBag, label: t("stats.purchases"), value: `${successOrdersCount} ${t("dashboard.transaksi")}`, accent: "#059669", tab: "riwayat-order" },
    { icon: TrendingUp, label: t("stats.deposit.total"), value: fmt(totalDeposited), accent: "#D97706", tab: "riwayat-deposit" },
    { icon: Gem, label: t("stats.member.level"), value: `${t("stats.level")} ${userProfile.tier}`, accent: "#7C3AED", tab: "profile" },
  ];

  const services = [
    { icon: Gem, label: t("dashboard.app.premium"), desc: "Netflix, Spotify, Canva Pro", tab: "layanan/app-premium", color: "#2563EB", bg: "from-blue-500/20 to-blue-500/5" },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 stagger-enter">
      {/* Announcement */}
      <div className="relative overflow-hidden rounded-2xl border border-vw-border/60 bg-vw-surface p-4 sm:p-5 animate-fade-in-down">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-vw-accent-subtle flex items-center justify-center shrink-0">
            <BellRing size={17} className="text-vw-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-vw-text text-sm">{t("dashboard.announcement.title")}</h4>
            <p className="text-xs text-vw-muted/80 mt-1 leading-relaxed">{t("dashboard.announcement.desc")}</p>
          </div>
          <Sparkles size={14} className="hidden sm:block shrink-0 text-vw-accent/20 animate-float" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {!loaded ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          stats.map((s) => (
            <button 
              key={s.label}
              onClick={() => onTabChange(s.tab)} 
              className="relative group rounded-xl border border-vw-border/60 bg-vw-surface p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.accent}10` }}>
                  <s.icon size={16} style={{ color: s.accent }} />
                </div>
                <ArrowRight size={13} className="text-vw-muted/30 group-hover:text-vw-muted/60 group-hover:translate-x-0.5 transition-all duration-150" />
              </div>
              <p className="text-[10px] text-vw-muted/70 font-medium uppercase tracking-[0.08em] mb-1">{s.label}</p>
              <p className="text-lg font-bold text-vw-text tracking-tight">{s.value}</p>
            </button>
          ))
        )}
      </div>

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* ====== ANALYTICS GRID ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-vw-border/60 bg-vw-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={15} className="text-vw-accent" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-vw-accent">{t("analytics.spending.title")}</span>
          </div>
          <SpendingChart orders={orders} t={t} />
        </div>
        <div className="rounded-2xl border border-vw-border/60 bg-vw-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart size={15} className="text-vw-accent" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-vw-accent">{t("analytics.favorites.title")}</span>
          </div>
          <FavoriteProductsChart orders={orders} t={t} />
        </div>
        <div className="rounded-2xl border border-vw-border/60 bg-vw-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={15} className="text-vw-accent" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-vw-accent">{t("analytics.balance.title")}</span>
          </div>
          <BalanceHistoryChart deposits={deposits} orders={orders} t={t} />
        </div>
      </div>

      {/* Services + Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Services */}
        <div className="lg:col-span-2 rounded-2xl border border-vw-border/60 bg-vw-surface p-5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-vw-accent mb-1 inline-block">{t("dashboard.pilih.layanan")}</span>
          <p className="text-xs text-vw-muted/70 mb-5">{t("dashboard.pilih.layanan.desc")}</p>
          <div className="space-y-3">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <button 
                  key={s.tab}
                  onClick={() => onTabChange(s.tab)}
                  className="group w-full flex items-center justify-between p-4 rounded-xl border border-vw-border/50 bg-vw-surface/80 transition-all duration-200 hover:shadow-sm hover:border-vw-accent/15 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center`}>
                      <Icon size={17} className="text-vw-accent" style={{ color: s.color }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-vw-text">{s.label}</p>
                      <p className="text-[11px] text-vw-muted/70 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-vw-muted/30 group-hover:text-vw-muted/60 group-hover:translate-x-0.5 transition-all duration-150" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-3 rounded-2xl border border-vw-border/60 bg-vw-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-vw-accent mb-1 inline-block">{t("dashboard.riwayat")}</span>
              <p className="text-xs text-vw-muted/70">{t("dashboard.recent.orders")}</p>
            </div>
            <button onClick={() => onTabChange("riwayat-order")}
              className="text-[10px] font-semibold text-vw-accent hover:underline flex items-center gap-1">
              {t("dashboard.lihat.semua")} <ArrowRight size={11} />
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-vw-accent-subtle transition-colors duration-150">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    o.status === "Success" ? "bg-emerald-50 text-emerald-600" : 
                    o.status === "Processing" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                  }`}>
                    {o.status === "Success" ? <CheckCircle2 size={15} /> : 
                     o.status === "Processing" ? <Clock size={15} /> : <ShoppingBag size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-vw-text truncate">{o.productName}</p>
                    <p className="text-[10px] text-vw-muted">{o.date}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    o.status === "Success" ? "bg-emerald-50 text-emerald-700" : 
                    o.status === "Processing" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                  }`}>{o.status === "Success" ? t("dashboard.sukses") : o.status === "Processing" ? t("dashboard.proses") : t("dashboard.gagal")}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-vw-muted">
              <ShoppingBag size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">{t("dashboard.no.orders")}</p>
              <p className="text-[10px] text-vw-muted/70 mt-1">{t("dashboard.no.orders.desc")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
