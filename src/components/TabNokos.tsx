import React, { useState, useEffect } from "react";
import { PhoneCall, Search, ShoppingCart, Check, Loader2, Clock, MessageSquare } from "lucide-react";
import { UserProfile, NokosService, Order } from "../types";

interface TabNokosProps {
  userProfile: UserProfile;
  services: NokosService[];
  onDeductBalance: (amount: number) => void;
  onAddOrder: (order: Order) => void;
  onTabChange: (tab: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n).replace(/\u00A0/g, " ");

export default function TabNokos({ userProfile, services, onDeductBalance, onAddOrder }: TabNokosProps) {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [count, setCount] = useState(120);
  const [otp, setOtp] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.country.toLowerCase().includes(search.toLowerCase()));

  const handleRent = (svc: NokosService) => {
    if (userProfile.balance < svc.price) { alert("Saldo tidak cukup."); return; }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      let phone = "+62 8" + Math.floor(110000000 + Math.random() * 880000000);
      if (svc.country.includes("USA")) phone = "+1 (202) 555-0" + Math.floor(100 + Math.random() * 899);
      else if (svc.country.includes("Russia")) phone = "+7 9" + Math.floor(100000000 + Math.random() * 899000000);
      const inv = `ORD-${Math.floor(100 + Math.random() * 900)}`;
      setActive({ invoiceNo: inv, serviceName: svc.name, country: svc.country, price: svc.price, phoneNum: phone });
      onDeductBalance(svc.price);
      setCount(120); setOtp(null);
      setLogs(["[SYSTEM] Virtual Port Opened.", `[SYSTEM] Assigned: ${phone}`, "[SYSTEM] Listening for OTP..."]);
    }, 1200);
  };

  useEffect(() => {
    if (!active || otp) return;
    const i = setInterval(() => setCount(p => { if (p <= 1) { clearInterval(i); setLogs(l => [...l, "[SYSTEM] Timeout."]); return 0; } return p - 1; }), 1000);
    return () => clearInterval(i);
  }, [active, otp]);

  useEffect(() => {
    if (!active || otp) return;
    const t = setTimeout(() => {
      const pin = Math.floor(100000 + Math.random() * 899999);
      setOtp(String(pin));
      setLogs(l => [...l, `[SMS] From: ${active.serviceName.toUpperCase()}`, `[SMS] Kode OTP: ${pin}`, "[SYSTEM] OTP Extracted!"]);
      onAddOrder({ id: active.invoiceNo, serviceType: "Nokos", productName: `${active.serviceName} (${active.country})`, target: active.phoneNum, quantity: 1, price: active.price, status: "Success", date: new Date().toISOString().replace("T"," ").substring(0,19), details: `OTP: ${pin} | No: ${active.phoneNum}` });
    }, 6000);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-vw-border/60 bg-white p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3"><PhoneCall size={18} className="text-vw-accent" /><span className="caption">Sewa Nomor Virtual OTP</span></div>
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vw-muted" />
                <input type="text" placeholder="Cari aplikasi atau negara..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 py-2" />
              </div>
            </div>
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead><tr>{["Layanan","Negara","Harga","Stok",""].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((s, i) => (
                    <tr key={s.id}>
                      <td className="font-semibold text-vw-text">{s.name}</td>
                      <td className="text-vw-muted">{s.country}</td>
                      <td className="font-semibold">{fmt(s.price)}</td>
                      <td className="text-vw-muted">{s.availableQty} pcs</td>
                      <td>
                        <button onClick={() => handleRent(s)} disabled={processing || (active !== null && !otp)}
                          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
                          {processing ? <Loader2 size={12} className="animate-spin" /> : <ShoppingCart size={12} />} Sewa
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="text-center py-12 text-vw-muted">
                      <PhoneCall size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">Tidak ada nomor tersedia</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {active ? (
            <div className="rounded-2xl border border-vw-border/60 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-vw-accent" />
                  <span className="caption">Virtual Terminal</span>
                </div>
                {otp ? <span className="badge badge-success text-xs">OTP DITERIMA</span>
                  : <div className="flex items-center gap-1 text-sm font-mono"><Clock size={14} /> 0{Math.floor(count / 60)}:{String(count % 60).padStart(2,"0")}</div>}
              </div>
              <div className="p-4 rounded-xl border border-vw-border bg-gray-50/30">
                <p className="caption mb-1">Nomor Aktif</p>
                <p className="text-lg font-bold font-mono text-vw-accent">{active.phoneNum}</p>
                <div className="flex gap-4 mt-2 text-xs text-vw-muted">
                  <span>Aplikasi: <strong className="text-vw-text">{active.serviceName}</strong></span>
                  <span>Negara: <strong className="text-vw-text">{active.country}</strong></span>
                </div>
              </div>
              <div className="p-4 rounded-xl font-mono text-xs leading-relaxed h-48 overflow-y-auto bg-gray-50 border border-vw-border">
                <p className="text-vw-muted mb-2">sms_receiver_daemon.sh:</p>
                {logs.map((l, i) => {
                  let c = "text-vw-muted";
                  if (l.startsWith("[SYSTEM]")) c = "text-vw-info";
                  if (l.startsWith("[SMS]")) c = "text-vw-text";
                  if (l.includes("OTP Extracted")) c = "text-vw-accent font-bold";
                  return <p key={i} className={c}>{l}</p>;
                })}
              </div>
              {otp ? (
                <button onClick={() => setActive(null)} className="btn-ghost w-full py-2.5 cursor-pointer text-sm">Sewa Nomor Baru</button>
              ) : (
                <div className="text-center text-sm text-vw-muted">
                  <span className="inline-block w-2 h-2 bg-vw-accent rounded-full mr-2" />
                  Menunggu SMS OTP...
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-vw-border/60 bg-white p-6 h-full flex flex-col items-center justify-center min-h-[300px] text-center">
              <MessageSquare size={40} className="text-vw-muted opacity-30 mb-4" />
              <p className="text-base font-medium text-vw-muted">Terminal SMS Kosong</p>
              <p className="text-sm text-vw-muted mt-1">Sewa nomor di samping untuk memulai.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
