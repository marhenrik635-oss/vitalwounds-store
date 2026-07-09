import React, { useState } from "react";
import { Wallet, Check, QrCode, Loader2, AlertTriangle, Info } from "lucide-react";
import { UserProfile, Deposit } from "../types";
import { useT } from "../i18n/LanguageContext";

interface TabDepositProps {
  userProfile: UserProfile;
  onAddDeposit: (deposit: Deposit) => void;
  onUpdateBalance: (amount: number) => void;
}

const presets = [10000, 20000, 50000, 100000, 200000, 500000];

const formatRupiah = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

export default function TabDeposit({ userProfile, onAddDeposit, onUpdateBalance }: TabDepositProps) {
  const t = useT();
  const [amount, setAmount] = useState<number>(50000);
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setQrImageUrl("");
    if (amount < 10000) { setError("Minimal deposit Rp 10.000"); return; }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/xoftware/deposit-qris", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), payment_method: "QRIS", user_id: userProfile.username }),
      });
      const data = await res.json();
      if (res.ok && (data.status || data.qr_string)) {
        const qrString = data.qr_string || data.target || "";
        if (qrString) {
          setQrImageUrl(qrString.startsWith("http") ? qrString : "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent(qrString) + "&size=300x300");
        }
        const txId = data.txId || data.transaction_id || data.id || ("TXN" + Date.now());
        const invNo = "INV/" + new Date().getFullYear() + String(new Date().getMonth()+1).padStart(2,"0") + String(new Date().getDate()).padStart(2,"0") + "/" + Math.floor(100+Math.random()*900);
        setActiveInvoice({ invoiceNo: invNo, amount, paymentMethod: "QRIS", date: new Date().toLocaleString("id-ID"), transactionId: txId });
      } else {
        setError(data.error || data.message || "Gagal membuat permintaan deposit.");
      }
    } catch (err: any) {
      setError(err.message || "Koneksi ke server gagal.");
    } finally { setIsProcessing(false); }
  };

  const handleCheckPayment = async () => {
    if (!activeInvoice) return;
    setIsChecking(true); setError(null);
    try {
      const res = await fetch("/api/xoftware/deposit-status?transactionId=" + activeInvoice.transactionId);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.detail || `Server error (${res.status})`);
      }
      const data = await res.json();
      const statusFromData = (data.data && data.data.status) ? data.data.status : (data.status || "");
      const statusLower = statusFromData.toLowerCase();
      if (statusLower === "success" || statusLower === "paid") {
        onUpdateBalance(activeInvoice.amount);
        onAddDeposit({ id: "DEP-" + Math.floor(100+Math.random()*905), invoiceNo: activeInvoice.invoiceNo, amount: activeInvoice.amount, paymentMethod: "QRIS", status: "SUCCESS", date: new Date().toISOString().replace("T"," ").substring(0,19) });
        alert("Pembayaran Berhasil! Saldo Anda telah bertambah.");
        setActiveInvoice(null); setQrImageUrl("");
      } else if (data.source === "local") {
        setError("Status dari database lokal: " + statusFromData + ". Jika sudah bayar, hubungi admin untuk konfirmasi manual.");
      } else {
        setError("Pembayaran belum masuk. Silakan scan QRIS terlebih dahulu, atau tunggu beberapa saat lalu cek lagi.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal memeriksa status. Coba lagi nanti.");
    }
    finally { setIsChecking(false); }
  };

  return (
    <div className="pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-vw-surface p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-vw-border/60">
              <Wallet size={18} className="text-vw-accent" />
              <h2 className="text-lg font-bold text-vw-text">Request Pengisian Saldo</h2>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateDeposit} className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-vw-muted block mb-3">Jumlah Deposit (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-sm font-bold text-vw-muted">IDR</span>
                  <input type="number" value={amount || ""} onChange={e => setAmount(Number(e.target.value))}
                    placeholder="Min Rp 10.000" required min={10000} className="input-field pl-16 py-3.5 text-base font-bold" />
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold text-vw-muted block mb-3">Atau pilih nominal instan:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {presets.map(val => (
                    <button key={val} type="button"
                      onClick={() => setAmount(val)}
                      className={"py-3 rounded-xl text-sm font-bold transition-all duration-150 " + (amount === val ? "btn-primary" : "btn-ghost")}>
                      {val/1000}k
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-vw-border/60 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-vw-accent/10 shrink-0">
                  <QrCode size={18} className="text-vw-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold text-vw-text mb-0.5">QRIS (Semua E-Wallet & M-Banking)</p>
                  <p className="text-xs text-vw-muted leading-relaxed">Scan QRIS dengan DANA, OVO, GoPay, ShopeePay, M-Banking, dll</p>
                </div>
              </div>

              <button type="submit" disabled={isProcessing}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-sm cursor-pointer disabled:opacity-50">
                {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Membuat Tagihan...</>
                  : <><Wallet size={16} /> Buat Request Deposit</>}
              </button>
            </form>
          </div>
        </div>

        {/* Invoice Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-vw-surface p-6 h-full flex flex-col justify-between">
            {activeInvoice ? (
              <div className="space-y-5">
                <div className="pb-4 border-b border-vw-border/60">
                  <span className="text-xs text-vw-muted font-bold">Rincian Tagihan</span>
                  <p className="text-base font-bold text-vw-text mt-2 break-all font-mono">{activeInvoice.invoiceNo}</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-6 rounded-2xl bg-vw-bg">
                  {qrImageUrl ? (
                    <div className="p-4 bg-white rounded-2xl border border-vw-border/40">
                      <img src={qrImageUrl} alt="QRIS" className="w-48 h-48 mx-auto" />
                      <p className="text-[10px] text-zinc-500 font-semibold mt-3 text-center">Scan QRIS di atas menggunakan e-Wallet atau M-Banking favorit Anda</p>
                    </div>
                  ) : (
                    <div className="p-4 w-full text-sm space-y-2 text-center">
                      <p className="font-bold text-vw-text">Menunggu QRIS...</p>
                      <p className="text-xs text-vw-muted">QR Code akan muncul setelah request dibuat.</p>
                    </div>
                  )}
                </div>
                <div className="py-4 space-y-3 text-sm border-y border-vw-border/60">
                  {[{l:"Jumlah",v:formatRupiah(activeInvoice.amount)},{l:"Metode",v:"QRIS"},{l:"Waktu",v:activeInvoice.date}].map((r,i)=>(
                    <div key={i} className="flex justify-between"><span className="text-vw-muted font-medium">{r.l}</span><span className="font-bold text-vw-text">{r.v}</span></div>
                  ))}
                </div>
                <button onClick={handleCheckPayment} disabled={isChecking}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3.5 text-sm cursor-pointer disabled:opacity-50">
                  {isChecking ? <><Loader2 size={16} className="animate-spin" /> Memeriksa...</>
                    : <><Check size={16} /> Cek Status Pembayaran</>}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                <Info size={40} className="text-vw-muted opacity-30 mb-4" />
                <p className="text-lg font-bold text-vw-text">Menunggu Request</p>
                <p className="text-sm text-vw-muted mt-2 max-w-xs leading-relaxed">Pilih jumlah deposit di sebelah kiri untuk membuat tagihan baru.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
