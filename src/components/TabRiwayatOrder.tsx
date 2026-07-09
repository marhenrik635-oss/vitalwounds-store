import React, { useState } from "react";
import { ShoppingBag, Search, Eye, EyeOff, Copy, Check, Download } from "lucide-react";
import { Order } from "../types";
import { useT } from "../i18n/LanguageContext";
import { exportToCsv } from "../utils/exportCsv";

interface TabRiwayatOrderProps { orders: Order[]; }

const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function TabRiwayatOrder({ orders }: TabRiwayatOrderProps) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = orders.filter(o => {
    if (filter !== "ALL" && o.serviceType !== filter) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.productName.toLowerCase().includes(search.toLowerCase()) && !o.target.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleExport = () => {
    exportToCsv(
      filtered,
      [
        { key: "id", label: t("riwayat-order.id") },
        { key: "date", label: t("riwayat-order.tanggal") },
        { key: "productName", label: t("riwayat-order.produk") },
        { key: "target", label: t("riwayat-order.target") },
        { key: "price", label: t("riwayat-order.harga") },
        { key: "status", label: t("riwayat-order.status") },
      ],
      `orders_${filter.toLowerCase().replace(/\s+/g, "-")}`
    );
  };

  return (
    <div className="pb-12">
      <div className="rounded-3xl border border-vw-border/80 bg-vw-surface p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-vw-border/80">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-vw-text">
              <ShoppingBag size={20} className="text-vw-accent" /> {t("riwayat-order.title")}
            </h2>
            <p className="font-display text-sm text-vw-text-muted mt-1 leading-relaxed">{t("riwayat-order.desc")}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleExport}
              className="px-4 py-2 rounded-full font-display text-xs font-bold btn-ghost flex items-center gap-1.5">
              <Download size={12} /> {t("riwayat-order.export")}
            </button>
            {["ALL","App Premium","Suntik Sosmed","Nokos"].map(tl => (
              <button key={tl} onClick={() => setFilter(tl)}
                className={`px-4 py-2 rounded-full font-display text-xs font-bold transition-all duration-150 ${filter === tl ? "btn-primary" : "btn-ghost"}`}>
                {tl === "ALL" ? t("riwayat-order.semua") : tl}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-vw-text-muted" />
          <input type="text" placeholder={t("riwayat-order.cari")} value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-11 py-2.5 font-display text-sm" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto table-wrap rounded-xl border border-vw-border/80">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {[t("riwayat-order.id"),t("riwayat-order.tanggal"),t("riwayat-order.produk"),t("riwayat-order.target"),t("riwayat-order.harga"),t("riwayat-order.status"),""].map(h => (
                  <th key={h} className="font-display text-xs font-bold uppercase tracking-wide text-vw-text-muted px-4 py-3 bg-vw-bg/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((o) => (
                <React.Fragment key={o.id}>
                  <tr className="border-b border-vw-border/40 last:border-b-0 hover:bg-vw-bg/30">
                    <td className="font-display font-semibold text-vw-text px-4 py-4 whitespace-nowrap">{o.id}</td>
                    <td className="font-display font-mono text-xs text-vw-text-muted px-4 py-4 whitespace-nowrap">{o.date}</td>
                    <td className="px-4 py-4">
                      <p className="font-display font-bold text-vw-text">{o.productName}</p>
                      <p className="font-display text-xs text-vw-text-muted mt-0.5">{o.serviceType}</p>
                    </td>
                    <td className="font-display text-vw-text-muted max-w-[120px] truncate text-xs px-4 py-4" title={o.target}>{o.target}</td>
                    <td className="font-display font-bold text-vw-text px-4 py-4 whitespace-nowrap">{fmt(o.price)}</td>
                    <td className="px-4 py-4">
                      <span className={`badge font-display font-bold ${o.status === "Success" ? "badge-success" : o.status === "Processing" ? "badge-warning" : "badge-danger"}`}>
                        {o.status === "Success" ? t("riwayat-order.sukses") : o.status === "Processing" ? t("riwayat-order.proses") : t("riwayat-order.gagal")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {o.details ? (
                        <button onClick={() => setOpenId(openId === o.id ? null : o.id)}
                          className="p-2 rounded-lg border border-vw-border/60 text-vw-text-muted hover:text-vw-accent hover:border-vw-accent/50 cursor-pointer transition-colors">
                          {openId === o.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      ) : <span className="font-display text-xs text-vw-text-muted">-</span>}
                    </td>
                  </tr>
                  {openId === o.id && o.details && (
                    <tr>
                      <td colSpan={7} className="p-6 border-b border-vw-border/60 bg-vw-bg/20">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-xs text-vw-text-muted font-bold uppercase tracking-wider mb-3">📦 {t("riwayat-order.detail")}</p>
                            <div className="p-5 rounded-2xl font-mono text-sm whitespace-pre-wrap break-all border border-vw-border/80 bg-vw-surface text-vw-text">
                              {o.details}
                            </div>
                          </div>
                          <button onClick={() => { navigator.clipboard.writeText(o.details || ""); setCopied(o.id); setTimeout(() => setCopied(null), 1500); }}
                            className="btn-primary flex items-center gap-2 py-3 px-6 whitespace-nowrap shrink-0 cursor-pointer font-display text-xs font-bold">
                            {copied === o.id ? <><Check size={14} /> {t("riwayat-order.tersalin")}</> : <><Copy size={14} /> {t("riwayat-order.salin")}</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr><td colSpan={7} className="text-center py-20 text-vw-text-muted font-display text-sm">
                  <ShoppingBag size={44} className="mx-auto mb-4 opacity-30" />
                  <p className="font-display text-base font-bold">{t("riwayat-order.kosong")}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
