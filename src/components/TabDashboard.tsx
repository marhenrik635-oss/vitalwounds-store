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
              className="w-full rounded-lg bg-vw-accent/60 hover:bg-vw-accent transition-all duration-200"
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
  const [topProducts, setTopProducts] = useState<{ name: string; sold: number; imageUrl?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const perPage = 4;

  useEffect(() => {
    fetch('/api/xoftware/top-products')
      .then(r => r.json())
      .then(d => {
        if (d && d.data) {
          setTopProducts(d.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const totalPages = Math.ceil(topProducts.length / perPage);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const visibleProducts = topProducts.slice(currentPage * perPage, (currentPage + 1) * perPage);
  const maxSold = Math.max(...topProducts.map(p => p.sold), 1);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-24 h-3 rounded skeleton" />
            <div className="flex-1 h-5 rounded-full skeleton" />
            <div className="w-8 h-3 rounded skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (!topProducts.length) {
    return <p className="text-xs text-vw-muted text-center py-6">{t("analytics.no.data")}</p>;
  }

  return (
    <div className="space-y-2">
      {visibleProducts.map((p, i) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-vw-muted w-4 shrink-0 text-right">
            {currentPage * perPage + i + 1}
          </span>
          <span className="text-[10px] text-vw-text w-24 truncate shrink-0">{p.name}</span>
          <div className="flex-1 h-5 rounded-full bg-vw-bg overflow-hidden border border-vw-border/60 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-vw-accent/40 to-vw-accent transition-all duration-700"
              style={{ width: `${(p.sold / maxSold) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-vw-muted w-10 text-right">{p.sold.toLocaleString('id-ID')}</span>
        </div>
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="text-[9px] px-2 py-1 rounded-lg bg-vw-bg border border-vw-border/60 text-vw-muted disabled:opacity-30 hover:bg-vw-accent/10 transition-all cursor-pointer disabled:cursor-default"
          >
            ←
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`text-[9px] w-5 h-5 rounded-full font-bold transition-all cursor-pointer ${
                i === currentPage
                  ? 'bg-vw-accent text-white'
                  : 'bg-vw-bg border border-vw-border/60 text-vw-muted hover:bg-vw-accent/10'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="text-[9px] px-2 py-1 rounded-lg bg-vw-bg border border-vw-border/60 text-vw-muted disabled:opacity-30 hover:bg-vw-accent/10 transition-all cursor-pointer disabled:cursor-default"
          >
            →
          </button>
        </div>
      )}
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
        { label: t("analytics.total.order"), value: orders.length },
        { label: t("analytics.total.spent"), value: fmt(totalSpent) },
        { label: t("analytics.avg.order"), value: fmt(avgOrder) },
      ].map((s) => (
        <div key={s.label} className="text-center p-3 rounded-xl bg-vw-bg border border-vw-border/60">
          <p className="text-[9px] text-vw-muted font-bold">{s.label}</p>
          <p className="text-sm font-bold mt-1 text-vw-text">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl bg-vw-surface p-4">
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
    { icon: Wallet, label: t("stats.balance"), value: fmt(userProfile.balance), tab: "deposit" },
    { icon: ShoppingBag, label: t("stats.purchases"), value: `${successOrdersCount} ${t("dashboard.transaksi")}`, tab: "riwayat-order" },
    { icon: TrendingUp, label: t("stats.deposit.total"), value: fmt(totalDeposited), tab: "riwayat-deposit" },
    { icon: Gem, label: t("stats.member.level"), value: `${t("stats.level")} ${userProfile.tier}`, tab: "profile" },
  ];

  const services = [
    { icon: Gem, label: t("dashboard.app.premium"), desc: "Netflix, Spotify, Canva Pro", tab: "layanan/app-premium" },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Announcement */}
      <div className="rounded-2xl bg-vw-surface p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-vw-accent/10 flex items-center justify-center shrink-0">
            <BellRing size={16} className="text-vw-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-vw-text">{t("dashboard.announcement.title")}</p>
            <p className="text-xs text-vw-muted mt-1 leading-relaxed">{t("dashboard.announcement.desc")}</p>
          </div>
          <Sparkles size={14} className="hidden sm:block shrink-0 text-vw-accent/20" />
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
              className="group relative rounded-2xl bg-vw-surface p-5 text-left transition-all duration-200 hover:bg-vw-bg active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-vw-accent/10 flex items-center justify-center">
                  <s.icon size={16} className="text-vw-accent" />
                </div>
                <ArrowRight size={13} className="text-vw-muted/40 ml-auto group-hover:text-vw-muted group-hover:translate-x-0.5 transition-all duration-200" />
              </div>
              <p className="text-[10px] text-vw-muted font-bold mb-1">{s.label}</p>
              <p className="text-lg font-bold text-vw-text tracking-tight">{s.value}</p>
            </button>
          ))
        )}
      </div>

      <WelcomeBanner />

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[ { Icon: BarChart3, t: "analytics.spending.title", C: SpendingChart }, { Icon: PieChart, t: "analytics.favorites.title", C: FavoriteProductsChart }, { Icon: DollarSign, t: "analytics.balance.title", C: BalanceHistoryChart } ].map((c, i) => (
          <div key={i} className="rounded-2xl bg-vw-surface p-5">
            <div className="flex items-center gap-2 mb-5">
              <c.Icon size={16} className="text-vw-accent" />
              <span className="text-xs font-bold text-vw-muted">{t(c.t)}</span>
            </div>
            <c.C orders={orders} deposits={deposits} t={t} />
          </div>
        ))}
      </div>

      {/* Services + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-vw-surface p-5">
          <p className="text-xs font-bold text-vw-muted mb-1">{t("dashboard.pilih.layanan")}</p>
          <p className="text-sm text-vw-muted mb-5 leading-relaxed">{t("dashboard.pilih.layanan.desc")}</p>
          <div className="space-y-2.5">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.tab}
                  onClick={() => onTabChange(s.tab)}
                  className="group w-full flex items-center justify-between p-4 rounded-2xl bg-vw-bg transition-all duration-200 hover:bg-vw-accent/5 active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-vw-accent/10 flex items-center justify-center">
                      <Icon size={18} className="text-vw-accent" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-vw-text">{s.label}</p>
                      <p className="text-xs text-vw-muted mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-vw-muted/40 group-hover:text-vw-muted group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-vw-surface p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold text-vw-muted mb-0.5">{t("dashboard.riwayat")}</p>
              <p className="text-sm text-vw-muted">{t("dashboard.recent.orders")}</p>
            </div>
            <button onClick={() => onTabChange("riwayat-order")}
              className="text-xs font-bold text-vw-accent hover:text-vw-accent-hover flex items-center gap-1 transition-colors cursor-pointer">
              {t("dashboard.lihat.semua")} <ArrowRight size={13} />
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-vw-bg">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    o.status === "Success" ? "bg-emerald-500/10 text-emerald-400" :
                    o.status === "Processing" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {o.status === "Success" ? <CheckCircle2 size={16} /> :
                     o.status === "Processing" ? <Clock size={16} /> : <ShoppingBag size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-vw-text truncate">{o.productName}</p>
                    <p className="text-xs text-vw-muted mt-0.5">{o.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                    o.status === "Success" ? "bg-emerald-500/10 text-emerald-400" :
                    o.status === "Processing" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                  }`}>{o.status === "Success" ? t("dashboard.sukses") : o.status === "Processing" ? t("dashboard.proses") : t("riwayat-order.gagal")}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-vw-muted">
              <ShoppingBag size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold text-vw-text">{t("dashboard.no.orders")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
