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
    <div className="max-w-7xl mx-auto">
      <div className="rounded-2xl border border-vw-border/60 bg-vw-surface p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-vw-border">
          <div>
            <h2 className="text-lg font-bold text-vw-text">{t("riwayat-order.title")}</h2>
            <p className="text-sm text-vw-muted">{t("riwayat-order.desc")}</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={handleExport}
              className="px-3 py-1.5 rounded-lg text-xs font-medium btn-ghost !py-1.5 !px-3 flex items-center gap-1.5">
              <Download size={12} /> {t("riwayat-order.export")}
            </button>
            {["ALL","App Premium","Suntik Sosmed","Nokos"].map(tl => (
              <button key={tl} onClick={() => setFilter(tl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${filter === tl ? "btn-primary !py-1.5 !px-3" : "btn-ghost !py-1.5 !px-3"}`}>
                {tl === "ALL" ? t("riwayat-order.semua") : tl}
              </button>
            ))}
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-vw-muted" />
          <input type="text" placeholder={t("riwayat-order.cari")} value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-11" />
        </div>

        <div className="overflow-x-auto table-wrap">
          <table className="w-full text-sm">
            <thead><tr>{[t("riwayat-order.id"),t("riwayat-order.tanggal"),t("riwayat-order.produk"),t("riwayat-order.target"),t("riwayat-order.harga"),t("riwayat-order.status"),""].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((o) => (
                <React.Fragment key={o.id}>
                  <tr>
                    <td className="font-semibold text-vw-text whitespace-nowrap">{o.id}</td>
                    <td className="font-mono text-xs text-vw-muted whitespace-nowrap">{o.date}</td>
                    <td>
                      <p className="font-medium text-vw-text">{o.productName}</p>
                      <p className="text-xs text-vw-muted">{o.serviceType}</p>
                    </td>
                    <td className="text-vw-muted max-w-[120px] truncate text-xs" title={o.target}>{o.target}</td>
                    <td className="font-semibold text-vw-text whitespace-nowrap">{fmt(o.price)}</td>
                    <td>
                      <span className={`badge ${o.status === "Success" ? "badge-success" : o.status === "Processing" ? "badge-warning" : "badge-danger"}`}>
                        {o.status === "Success" ? t("riwayat-order.sukses") : o.status === "Processing" ? t("riwayat-order.proses") : t("riwayat-order.gagal")}
                      </span>
                    </td>
                    <td>
                      {o.details ? (
                        <button onClick={() => setOpenId(openId === o.id ? null : o.id)}
                          className="p-2 rounded-lg transition-all duration-150 border border-vw-border text-vw-muted hover:bg-gray-50 cursor-pointer">
                          {openId === o.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      ) : <span className="text-xs text-vw-muted">-</span>}
                    </td>
                  </tr>
                  {openId === o.id && o.details && (
                    <tr>
                      <td colSpan={7} className="p-4 bg-vw-accent-subtle">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="caption mb-2">📦 {t("riwayat-order.detail")}</p>
                            <div className="p-4 rounded-xl font-mono text-sm whitespace-pre-wrap break-all bg-vw-surface border border-vw-border text-vw-text">
                              {o.details}
                            </div>
                          </div>
                          <button onClick={() => { navigator.clipboard.writeText(o.details || ""); setCopied(o.id); setTimeout(() => setCopied(null), 1500); }}
                            className="btn-primary flex items-center gap-2 py-2.5 whitespace-nowrap shrink-0 cursor-pointer text-xs">
                            {copied === o.id ? <><Check size={14} /> {t("riwayat-order.tersalin")}</> : <><Copy size={14} /> {t("riwayat-order.salin")}</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr><td colSpan={7} className="text-center py-12 text-vw-muted">
                  <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">{t("riwayat-order.kosong")}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
