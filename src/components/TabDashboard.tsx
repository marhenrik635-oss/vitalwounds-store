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

function SpendingChart({ orders, t }: { orders: Order[]; t: (k: any) => string }) {
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    orders.forEach(o => {
      if (o.price && o.date) {
        const parts = o.date.split(/[\\/\\s-]/);
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
    return <p className="font-display text-xs text-vw-text-muted text-center py-6">{t("analytics.no.data")}</p>;
  }

  return (
    <div className="flex items-end gap-2 h-24">
      {monthlyData.map(([key, val], i) => {
        const h = (val / maxVal) * 100;
        const monthName = new Date(key + "-01").toLocaleDateString("id-ID", { month: "short" });
        return (
          <div key={key} className="flex-1 flex flex-col items-center gap-1">
            <span className="font-display text-[8px] text-vw-text-muted font-medium">{fmt(val)}</span>
            <div
              className="w-full rounded-lg bg-vw-accent/70 hover:bg-vw-accent transition-all duration-200"
              style={{ height: `${Math.max(h, 4)}%` }}
            />
            <span className="font-display text-[9px] text-vw-text-muted font-medium">{monthName}</span>
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
    return <p className="font-display text-xs text-vw-text-muted text-center py-6">{t("analytics.no.data")}</p>;
  }

  return (
    <div className="space-y-2">
      {productCounts.map(([name, count]) => (
        <div key={name} className="flex items-center gap-2">
          <span className="font-display text-[10px] text-vw-text w-24 truncate shrink-0">{name}</span>
          <div className="flex-1 h-5 rounded-full bg-vw-surface overflow-hidden border border-vw-border/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-vw-accent/60 to-vw-accent transition-all duration-500"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </div>
          <span className="font-display text-[10px] font-semibold text-vw-text-muted w-6 text-right">{count}x</span>
        </div>
      ))}
    </div>
  );
}

function BalanceHistoryChart({ deposits, orders, t }: { deposits: Deposit[]; orders: Order[]; t: (k: any) => string }) {
  const totalSpent = orders.reduce((s, o) => s + (o.price || 0), 0);
  const totalDeposited = deposits.filter(d => d.status === "SUCCESS").reduce((s, d) => s + d.amount, 0);
  const avgOrder = orders.length ? Math.round(totalSpent / orders.length) : 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: t("analytics.total.order"), value: orders.length, color: "#3B82F6" },
        { label: t("analytics.total.spent"), value: fmt(totalSpent), color: "#8B5CF6" },
        { label: t("analytics.avg.order"), value: fmt(avgOrder), color: "#10B981" },
      ].map((s) => (
        <div key={s.label} className="text-center p-3 rounded-xl bg-vw-surface border border-vw-border/80">
          <p className="font-display text-[9px] text-vw-text-muted font-bold uppercase tracking-[0.08em]">{s.label}</p>
          <p className="font-display text-sm font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-vw-border/80 bg-vw-surface p-4">
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12 stagger-enter">
      {/* Announcement */}
      <section className="relative overflow-hidden rounded-3xl border border-vw-border/80 bg-vw-surface p-6 animate-fade-in-down">
        <h3 className="font-display text-base font-bold text-vw-text mb-4">Promosi Spesial</h3>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-vw-accent/[0.08] flex items-center justify-center shrink-0 border border-vw-accent/15">
            <BellRing size={18} className="text-vw-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-semibold text-vw-text text-sm">{t("dashboard.announcement.title")}</h4>
            <p className="font-display text-xs text-vw-text-muted mt-1 leading-relaxed">{t("dashboard.announcement.desc")}</p>
          </div>
          <Sparkles size={16} className="hidden sm:block shrink-0 text-vw-accent/20 animate-float" />
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="group relative rounded-3xl border border-vw-border/80 bg-vw-surface p-6 text-left transition-all duration-300 hover:border-vw-border-medium hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-vw-border/50" style={{ background: `${s.accent}08` }}>
                  <s.icon size={18} style={{ color: s.accent }} />
                </div>
                <ArrowRight size={14} className="text-vw-text-muted/40 group-hover:text-vw-text group-hover:translate-x-0.5 transition-all duration-200" />
              </div>
              <p className="font-display text-[10px] text-vw-text-muted font-bold uppercase tracking-[0.1em] mb-1.5">{s.label}</p>
              <p className="font-display text-xl font-bold text-vw-text tracking-tight">{s.value}</p>
            </button>
          ))
        )}
      </div>

      <WelcomeBanner />

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[ { Icon: BarChart3, t: "analytics.spending.title", C: SpendingChart }, { Icon: PieChart, t: "analytics.favorites.title", C: FavoriteProductsChart }, { Icon: DollarSign, t: "analytics.balance.title", C: BalanceHistoryChart } ].map((c, i) => (
          <div key={i} className="rounded-3xl border border-vw-border/80 bg-vw-surface p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <c.Icon size={18} className="text-vw-accent" />
              <span className="font-display text-xs font-bold uppercase tracking-[0.15em] text-vw-text-muted">{t(c.t)}</span>
            </div>
            <c.C orders={orders} deposits={deposits} t={t} />
          </div>
        ))}
      </div>

      {/* Services + Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-vw-border/80 bg-vw-surface p-6">
          <span className="font-display text-xs font-bold uppercase tracking-[0.15em] text-vw-accent mb-2 inline-block">{t("dashboard.pilih.layanan")}</span>
          <p className="font-display text-sm text-vw-text-muted mb-6 leading-relaxed">{t("dashboard.pilih.layanan.desc")}</p>
          <div className="space-y-3">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <button 
                  key={s.tab}
                  onClick={() => onTabChange(s.tab)}
                  className="group w-full flex items-center justify-between p-5 rounded-2xl border border-vw-border/60 bg-vw-bg/30 transition-all duration-300 hover:border-vw-accent/30 hover:shadow-sm hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.bg} flex items-center justify-center border border-white/5`}>
                      <Icon size={20} className="text-vw-accent" style={{ color: s.color }} />
                    </div>
                    <div className="text-left">
                      <p className="font-display text-sm font-bold text-vw-text">{s.label}</p>
                      <p className="font-display text-xs text-vw-text-muted mt-1">{s.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-vw-text-muted group-hover:text-vw-accent group-hover:translate-x-0.5 transition-all duration-200" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 rounded-3xl border border-vw-border/80 bg-vw-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="font-display text-xs font-bold uppercase tracking-[0.15em] text-vw-accent mb-1 inline-block">{t("dashboard.riwayat")}</span>
              <p className="font-display text-sm text-vw-text-muted">{t("dashboard.recent.orders")}</p>
            </div>
            <button onClick={() => onTabChange("riwayat-order")}
              className="font-display text-xs font-bold text-vw-accent hover:text-white flex items-center gap-1.5 transition-colors">
              {t("dashboard.lihat.semua")} <ArrowRight size={14} />
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-4 p-4 rounded-2xl bg-vw-bg/30 border border-vw-border/40 hover:border-vw-border transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${
                    o.status === "Success" ? "bg-emerald-500/10 text-emerald-500" : 
                    o.status === "Processing" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {o.status === "Success" ? <CheckCircle2 size={18} /> : 
                     o.status === "Processing" ? <Clock size={18} /> : <ShoppingBag size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-vw-text truncate">{o.productName}</p>
                    <p className="font-display text-xs text-vw-text-muted mt-0.5">{o.date}</p>
                  </div>
                  <span className={`font-display text-[10px] font-bold px-3 py-1 rounded-full ${
                    o.status === "Success" ? "bg-emerald-500/10 text-emerald-400" : 
                    o.status === "Processing" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                  }`}>{o.status === "Success" ? t("dashboard.sukses") : o.status === "Processing" ? t("dashboard.proses") : t("riwayat-order.gagal")}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-vw-text-muted">
              <ShoppingBag size={40} className="mx-auto mb-4 opacity-20" />
              <p className="font-display text-sm font-bold text-vw-text">{t("dashboard.no.orders")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
