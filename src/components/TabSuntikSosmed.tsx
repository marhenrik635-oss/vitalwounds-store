import { useState, useEffect } from "react";
import { Share2, Instagram, Youtube, ShoppingBag, Check, Heart, Sparkles, Loader2 } from "lucide-react";
import { UserProfile, SmmService, Order } from "../types";

interface TabSuntikSosmedProps {
  userProfile: UserProfile;
  services: SmmService[];
  onDeductBalance: (amount: number) => void;
  onAddOrder: (order: Order) => void;
  onTabChange: (tab: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n).replace(/\u00A0/g, " ");

export default function TabSuntikSosmed({ userProfile, services, onDeductBalance, onAddOrder, onTabChange }: TabSuntikSosmedProps) {
  const [platform, setPlatform] = useState("Instagram");
  const [serviceId, setServiceId] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [qty, setQty] = useState(1000);
  const [ordering, setOrdering] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const filtered = services.filter(s => s.platform === platform);
  const selSvc = services.find(s => s.id === serviceId) || filtered[0];

  useEffect(() => { if (filtered.length > 0) setServiceId(filtered[0].id); }, [platform]);
  const totalPrice = selSvc ? Math.round((selSvc.pricePer1000 * qty) / 1000 * (userProfile.tier === "VIP" ? 0.92 : userProfile.tier === "Reseller" ? 0.95 : 1)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selSvc || !targetLink.trim() || qty < selSvc.minOrder || qty > selSvc.maxOrder) { alert("Periksa input Anda."); return; }
    if (userProfile.balance < totalPrice) { alert("Saldo tidak cukup."); return; }
    setOrdering(true);
    setTimeout(() => {
      setOrdering(false);
      const startCount = Math.floor(100 + Math.random() * 5000);
      const oid = `ORD-${Math.floor(100 + Math.random() * 900)}`;
      onAddOrder({ id: oid, serviceType: "Suntik Sosmed", productName: `${platform} - ${selSvc.name}`, target: targetLink, quantity: qty, price: totalPrice, status: "Processing", date: new Date().toISOString().replace("T"," ").substring(0,19), details: `Platform: ${platform} | ${selSvc.name} | Start: ${startCount.toLocaleString()} | Target: ${(startCount+qty).toLocaleString()}` });
      onDeductBalance(totalPrice);
      setReceipt({ orderId: oid, serviceName: selSvc.name, platform, target: targetLink, qty, price: totalPrice, startCount });
      setTargetLink("");
    }, 1500);
  };

  const platforms = [
    { name: "Instagram", icon: Instagram },
    { name: "TikTok", icon: Heart },
    { name: "YouTube", icon: Youtube },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-vw-border/60 bg-white p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-vw-border">
              <Share2 size={18} className="text-vw-accent" />
              <span className="caption">Suntik Sosmed (SMM Panel)</span>
            </div>
            <div className="space-y-2 mb-5">
              <span className="caption">Pilih Platform</span>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map(p => {
                  const I = p.icon;
                  const a = platform === p.name;
                  return (
                    <button key={p.name} type="button" onClick={() => setPlatform(p.name)}
                      className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 ${a ? "btn-primary" : "btn-ghost"}`}>
                      <I size={16} />{p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label className="caption block mb-2">Layanan</label>
                <select value={serviceId} onChange={e => setServiceId(e.target.value)} className="input-field text-sm">
                  {filtered.map(s => <option key={s.id} value={s.id}>[{s.id}] {s.name} ({fmt(s.pricePer1000)}/1k)</option>)}
                </select>
              </div>
              <div><label className="caption block mb-2">Target Link</label>
                <input type="text" required value={targetLink} onChange={e => setTargetLink(e.target.value)}
                  placeholder={platform === "Instagram" ? "https://instagram.com/username" : "https://tiktok.com/@username"}
                  className="input-field font-mono" />
                <p className="text-xs text-vw-muted mt-1">*Akun harus <strong className="text-vw-accent">PUBLIK</strong></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="caption block mb-2">Jumlah</label>
                  <input type="number" required value={qty || ""} onChange={e => setQty(Number(e.target.value))}
                    min={selSvc ? selSvc.minOrder : 10} max={selSvc ? selSvc.maxOrder : 100000} className="input-field font-bold" />
                  {selSvc && <p className="text-xs text-vw-muted mt-1">Min: {selSvc.minOrder.toLocaleString()} — Max: {selSvc.maxOrder.toLocaleString()}</p>}
                </div>
                <div><label className="caption block mb-2">Total</label>
                  <div className="rounded-xl border border-vw-border/60 bg-white p-4">
                    <p className="text-2xl font-bold text-vw-text">{fmt(totalPrice)}</p>
                    {userProfile.tier === "VIP" && <p className="text-xs text-vw-accent mt-1">★ Diskon VIP 8% Aktif</p>}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={ordering}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 cursor-pointer disabled:opacity-50 text-sm">
                {ordering ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : <><ShoppingBag size={16} /> Kirim Booster SMM</>}
              </button>
            </form>
          </div>
        </div>
        <div className="lg:col-span-2">
          {receipt ? (
            <div className="rounded-2xl border border-vw-border/60 bg-white p-6 text-center space-y-5">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto bg-emerald-100">
                <Check size={28} className="text-emerald-600" />
              </div>
              <div><h3 className="text-lg font-bold text-vw-text">Order Terkirim!</h3><span className="badge badge-success mt-2 inline-block">{receipt.orderId}</span></div>
              <p className="text-sm text-vw-muted">Proses booster dimulai dalam 5-30 menit.</p>
              <div className="p-4 rounded-xl border border-vw-border bg-gray-50/30">
                {[{l:"Platform",v:receipt.platform},{l:"Layanan",v:receipt.serviceName},{l:"Jumlah",v:receipt.qty.toLocaleString()},{l:"Total",v:fmt(receipt.price)}].map(r => (
                  <div key={r.l} className="flex justify-between py-1 text-sm"><span className="text-vw-muted">{r.l}</span><span className="font-medium text-vw-text">{r.v}</span></div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onTabChange("riwayat-order")} className="btn-primary flex-1 py-2.5 cursor-pointer text-xs">Pantau</button>
                <button onClick={() => setReceipt(null)} className="btn-ghost flex-1 py-2.5 cursor-pointer text-xs">OK</button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-vw-border/60 bg-white p-6">
              <div className="flex items-center gap-2 mb-5"><Sparkles size={18} className="text-vw-accent" /><span className="caption">Info & Garansi</span></div>
              <div className="space-y-4 text-sm text-vw-muted">
                {["Tanpa Password — 100% aman", "Garansi Refill 30 hari", "Akun harus PUBLIK"].map((t, i) => (
                  <div key={i} className="flex gap-3"><span className="text-vw-accent">✔</span><span>{t}</span></div>
                ))}
              </div>
              <div className="mt-5 p-4 rounded-xl border border-vw-border bg-gray-50/30">
                <p className="caption mb-1">💡 Reseller API</p>
                <p className="text-sm text-vw-muted">Integrasi API untuk order booster otomatis dari panel Anda.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
