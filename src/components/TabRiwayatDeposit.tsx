import React, { useState } from "react";
import { History, Search, Copy, Check, Download } from "lucide-react";
import { Deposit } from "../types";
import { useT } from "../i18n/LanguageContext";
import { exportToCsv } from "../utils/exportCsv";

interface TabRiwayatDepositProps { deposits: Deposit[]; }

const formatRupiah = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

export default function TabRiwayatDeposit({ deposits }: TabRiwayatDepositProps) {
  const t = useT();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyInvoice = (invNo: string) => {
    navigator.clipboard.writeText(invNo);
    setCopiedId(invNo);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExport = () => {
    exportToCsv(
      filtered,
      [
        { key: "date", label: t("riwayat-deposit.tanggal") },
        { key: "invoiceNo", label: t("riwayat-deposit.invoice") },
        { key: "paymentMethod", label: t("riwayat-deposit.metode") },
        { key: "amount", label: t("riwayat-deposit.jumlah") },
        { key: "status", label: t("riwayat-deposit.status") },
      ],
      `deposits_${filterStatus.toLowerCase()}`
    );
  };

  const filtered = deposits.filter(d => {
    const ms = filterStatus === "ALL" || d.status === filterStatus;
    const ss = d.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || d.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    return ms && ss;
  });

  return (
    <div className="pb-12">
      <div className="rounded-2xl border border-vw-border/60 bg-vw-surface p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-vw-border">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-vw-text">
              <History size={18} className="text-vw-accent" /> {t("riwayat-deposit.title")}
            </h3>
            <p className="text-sm text-vw-muted">{t("riwayat-deposit.desc")}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={handleExport}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 btn-ghost !py-1.5 !px-3 flex items-center gap-1.5">
              <Download size={12} /> {t("riwayat-deposit.export")}
            </button>
            {["ALL","SUCCESS","PENDING","EXPIRED"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  filterStatus === s ? "btn-primary !py-1.5 !px-3" : "btn-ghost !py-1.5 !px-3"
                }`}>{s === "ALL" ? t("riwayat-deposit.semua") : s}</button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-4 top-3 text-vw-muted" />
          <input type="text" placeholder={t("riwayat-deposit.cari")} value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} className="input-field pl-10 py-2 text-sm" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto table-wrap">
          <table className="w-full text-sm">
            <thead><tr>{[t("riwayat-deposit.tanggal"),t("riwayat-deposit.invoice"),t("riwayat-deposit.metode"),t("riwayat-deposit.jumlah"),t("riwayat-deposit.status")].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(d => (
                <tr key={d.id} className="transition-colors">
                  <td className="text-xs text-vw-muted font-mono whitespace-nowrap">{d.date}</td>
                  <td className="font-medium text-vw-text whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{d.invoiceNo}</span>
                      <button onClick={() => handleCopyInvoice(d.invoiceNo)}
                        className="text-vw-muted hover:text-vw-accent cursor-pointer">
                        {copiedId === d.invoiceNo ? <Check size={12} className="text-vw-accent" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td className="text-vw-text">{d.paymentMethod}</td>
                  <td className="text-right font-bold text-vw-text whitespace-nowrap">{formatRupiah(d.amount)}</td>
                  <td className="text-center">
                    <span className={`badge ${d.status === "SUCCESS" ? "badge-success" : d.status === "PENDING" ? "badge-warning" : "badge-danger"}`}>{d.status}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-12 text-vw-muted">
                  <History size={32} className="mx-auto opacity-30 mb-3" />
                  <p className="text-sm font-medium">{t("riwayat-deposit.kosong")}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
