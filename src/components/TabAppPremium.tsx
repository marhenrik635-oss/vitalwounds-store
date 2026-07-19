import { useState, useEffect } from "react";
import { 
  Search, ShoppingCart, Check, X, ShieldAlert, Sparkles, Star, TrendingUp, Package
} from "lucide-react";
import { UserProfile, AppProduct, Order } from "../types";

interface TabAppPremiumProps {
  userProfile: UserProfile;
  products: AppProduct[]; 
  onDeductBalance: (amount: number) => void;
  onAddOrder: (order: Order) => void;
  onTabChange: (tab: string) => void;
}

export default function TabAppPremium({ 
  userProfile, products, onDeductBalance, onAddOrder, onTabChange
}: TabAppPremiumProps) {
  if (!userProfile) return null;
  const isReseller = userProfile.role === 'reseller';
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortByState] = useState<string>("a-z");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [targetEmail, setTargetEmail] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [boughtCredentials, setBoughtCredentials] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'desc' | 'snk'>('desc');
  const [snkContent, setSnkContent] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<any | null>(null);

  // Compute payPrice in render scope (NOT inside handler, so JSX can reference it)
  const payPrice = isReseller && selectedProduct?.reseller_price ? selectedProduct.reseller_price : (selectedVariation ? selectedVariation.price : selectedProduct?.price_min || 0);

  // Fetch with sort parameters
  useEffect(() => {
    setLoading(true);
    const [sortKey, order] = sortBy === "a-z" ? ["name", "asc"] :
                            sortBy === "harga-asc" ? ["price", "asc"] :
                            sortBy === "harga-desc" ? ["price", "desc"] :
                            sortBy === "stok-asc" ? ["stock", "asc"] :
                            ["stock", "desc"];
    
    const ep = isReseller ? `/api/xoftware/products/reseller?sortBy=${sortKey}&sortOrder=${order}` : `/api/xoftware/products?sortBy=${sortKey}&sortOrder=${order}`;
    fetch(ep)
      .then(res => res.json())
      .then(data => {
        setLiveProducts(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [sortBy]);

  const handleOpenPurchase = async (product: any) => {
    setLoading(true);
    setSnkContent(null);
    setActiveTab('desc');
    const detail = await fetch("/api/xoftware/product-detail/" + encodeURIComponent(product.id || product.code)).then(r => r.json());

    try {
      const snkRes = await fetch("/api/snk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id || product.code }) });
      const snkData = await snkRes.json();
      setSnkContent(snkData.snk || "Tidak ada syarat dan ketentuan.");
    } catch {
      setSnkContent(detail.snk || "Tidak ada syarat dan ketentuan.");
    }

    setLoading(false);
    setSelectedProduct({ ...product, ...detail });
    if (product.is_variation && product.variations && product.variations.length > 0) {
      setSelectedVariation(product.variations[0]);
    } else {
      setSelectedVariation(null);
    }
    setTargetEmail(userProfile.email);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
      .format(num)
      .replace(/\u00A0/g, " ");
  };

  const categories = ["ALL", "Streaming", "Music", "Productivity", "AI Tools", "Editing"];

  // Remove local sorting, as it's now handled by the backend
  const filteredProducts = liveProducts.filter((prod) => {
    const prodName = prod.name || "";
    const prodDesc = prod.description || "";
    const prodCat = prod.category || "Streaming";
    const matchesCat = selectedCategory === "ALL" || prodCat.toUpperCase() === selectedCategory.toUpperCase();
    const matchesSearch = prodName.toLowerCase().includes(searchTerm.toLowerCase()) || prodDesc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (userProfile.balance < payPrice) {
      alert("Saldo Anda tidak mencukupi. Silakan deposit terlebih dahulu!");
      return;
    }

    setIsProcessing(true);

    try {
      const bodyPayload = { 
        sender: userProfile.username, 
        code: selectedVariation ? selectedVariation.code : selectedProduct.code, 
        quantity: 1, 
        target: targetEmail
      };
      const res = await fetch("/api/xoftware/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyPayload) });
      const data = await res.json();
      
      setIsProcessing(false);

      if (data && (data.status || data.code === 200)) {
        const formattedCreds = data.data?.accounts 
          ? (Array.isArray(data.data.accounts)
              ? data.data.accounts.map((acc: any) => Object.entries(acc).map(([k, v]) => `${k}: ${v}`).join('\n')).join('\n\n')
              : JSON.stringify(data.data.accounts))
          : typeof data.message === 'string' ? data.message : "Pembelian sukses! Kredensial diproses.";
          
        setBoughtCredentials(formattedCreds);

        // Deduct balance locally to prevent double-spending
        onDeductBalance(payPrice);

        onAddOrder({
          id: `ORD-${data.data?.transaction_id || Math.floor(100 + Math.random() * 900)}`,
          serviceType: "App Premium",
          productName: selectedProduct.name + (selectedVariation ? ` (${selectedVariation.title})` : ""),
          target: targetEmail,
          quantity: 1,
          price: payPrice,
          status: "Success",
          date: new Date().toLocaleDateString("id-ID"),
          details: formattedCreds
        });
      } else {
        console.error('Purchase response data:', data);
        alert(data.error || data.message || "Pembelian gagal. Coba lagi nanti.");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Terjadi kesalahan saat memproses pembelian.");
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setBoughtCredentials(null);
    setTargetEmail(userProfile.email);
    setIsProcessing(false);
  };

  if (error) {
    return <div className="p-10 text-red-500 text-center">Terjadi kesalahan: {error} Silakan coba refresh halaman.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Search & Categories */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 sticky top-16 z-20 bg-vw-bg pt-4">
        <div className="relative w-full md:max-w-sm">
          <input type="text" placeholder="Cari layanan premium..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-vw-border bg-white text-vw-text placeholder-vw-muted focus:outline-none focus:ring-2 focus:ring-vw-accent focus:border-vw-accent transition-all shadow-sm" />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vw-muted" />
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-start gap-3 w-full md:w-auto">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === cat ? "bg-vw-accent text-white shadow-sm" : "bg-white border border-vw-border text-vw-muted hover:bg-zinc-50 hover:text-vw-text"}`}>
              {cat}
            </button>
          ))}
          <select value={sortBy} onChange={(e) => setSortByState(e.target.value)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-vw-border text-vw-text hover:bg-zinc-50 focus:outline-none cursor-pointer">
            <option value="a-z">A-Z</option>
            <option value="harga-asc">Harga Terendah &gt; Tertinggi</option>
            <option value="harga-desc">Harga Tertinggi &gt; Terendah</option>
            <option value="stok-desc">Stock Tersedia &gt; Terbatas</option>
            <option value="stok-asc">Stock Terbatas &gt; Tersedia</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 card-stagger">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-vw-border rounded-xl p-5 flex flex-col gap-4 text-left h-[320px] animate-pulse">
              <div className="w-full h-48 rounded-lg bg-zinc-200 mb-2"></div>
              <div className="h-5 bg-zinc-200 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
              <div className="h-8 bg-zinc-200 rounded-lg w-full mt-auto"></div>
            </div>
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((prod) => (
            <div key={prod.id || prod.code}
              className="group relative bg-white border border-vw-border rounded-xl p-5 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-vw-accent/5 hover:border-vw-accent/20">
              <div className="flex-1">
                {prod.imageUrl ? (
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-lg mb-4 bg-gradient-to-br from-vw-accent/5 to-vw-accent/10 flex items-center justify-center">
                    <Sparkles size={32} className="text-vw-accent/30" />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base text-vw-text leading-snug line-clamp-2">{prod.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-vw-muted">
                      <Package size={12} />
                      <span className={prod.stock > 10 ? 'text-emerald-600' : prod.stock > 0 ? 'text-amber-600' : 'text-red-500'}>
                        {prod.stock > 0 ? `Sisa ${prod.stock}` : 'Habis'}
                      </span>
                    </span>
                    {prod.sold > 0 && (
                      <span className="inline-flex items-center gap-1 text-vw-muted">
                        <TrendingUp size={12} />
                        {prod.sold} terjual
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-vw-muted leading-relaxed line-clamp-2">{prod.description}</p>
                  {/* Always show price range for products with variations */}
                  {prod.is_variation && prod.variations && prod.variations.length > 1 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold text-vw-accent tracking-tight">
                        {formatRupiah(prod.price_min)} - {formatRupiah(prod.price_max)}
                      </p>
                      {isReseller && prod.reseller_price && prod.reseller_discount_pct > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          -{prod.reseller_discount_pct}%
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vw-accent/10 text-vw-accent text-[10px] font-bold">
                        {prod.variations.length} variasi
                      </span>
                    </div>
                  ) : isReseller && prod.reseller_price ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold text-vw-accent tracking-tight">{formatRupiah(prod.reseller_price)}</p>
                      {prod.reseller_discount_pct > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          -{prod.reseller_discount_pct}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-vw-accent tracking-tight">{formatRupiah(prod.price_min)}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-vw-border/60">
                <button onClick={() => handleOpenPurchase(prod)}
                  className="group/btn w-full px-4 py-2.5 rounded-lg bg-vw-accent text-white text-xs font-semibold transition-all duration-200 hover:bg-vw-accent-hover active:scale-[0.98] flex items-center justify-center gap-2">
                  <span>Beli Sekarang</span>
                  <ShoppingCart size={14} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-vw-muted">
            <div className="flex flex-col items-center gap-3 py-6">
              <Package size={48} className="text-vw-muted/40" />
              <p className="text-vw-muted font-medium">
                {selectedCategory === "ALL" && searchTerm === "" ? "Tidak ada produk tersedia" : "Produk tidak ditemukan. Coba ubah kata kunci atau filter."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" onClick={handleCloseModal}>
          <div onClick={e => e.stopPropagation()}
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-xl relative border border-vw-border">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-vw-muted hover:text-vw-text transition-all cursor-pointer">
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-vw-muted">Produk Premium</span>
            </div>

            <h2 className="text-xl font-bold text-vw-text leading-tight mb-4">{selectedProduct.name}</h2>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (<Star key={s} size={14} className="fill-amber-400 text-amber-400" />))}
              </div>
              <span className="text-xs text-vw-muted">5.0</span>
              <span className="text-xs text-vw-muted">•</span>
              <span className="text-xs text-vw-muted">{selectedProduct.sold || 0} terjual</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-vw-accent-subtle rounded-xl mb-4">
              <div>
                <p className="text-xs text-vw-muted font-medium">{isReseller ? "Harga Khusus Reseller" : "Total Harga"}</p>
                {isReseller && payPrice < (selectedVariation ? selectedVariation.price : selectedProduct.price_min) ? (
                  <div>
                    <p className="text-xl font-bold text-vw-accent">{formatRupiah(payPrice)}</p>
                    <p className="text-[10px] text-vw-muted line-through">{formatRupiah(selectedVariation ? selectedVariation.price : selectedProduct.price_min)}</p>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-vw-accent">{formatRupiah(selectedVariation ? selectedVariation.price : selectedProduct.price_min)}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-vw-muted font-medium">Status Stok</p>
                {selectedProduct.stock <= 1 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <ShieldAlert size={14} /> {selectedProduct.stock === 0 ? 'Habis' : 'Terbatas'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <Check size={14} /> Tersedia
                  </span>
                )}
              </div>
            </div>

            {selectedProduct.is_variation && selectedProduct.variations && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-vw-text mb-2">Pilih Variasi:</label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.variations.map((v: any, idx: number) => (
                    <button key={idx} type="button" onClick={() => setSelectedVariation(v)}
                      className={`p-2 rounded-lg text-xs font-semibold border transition-all ${selectedVariation?.title === v.title ? "bg-vw-accent text-white border-vw-accent" : "bg-white border-vw-border text-vw-muted hover:border-vw-accent"}`}>
                      {v.title} - {formatRupiah(v.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmPurchase} className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button type="button" onClick={() => setActiveTab('desc')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'desc' ? 'bg-white text-vw-text shadow-sm' : 'text-vw-muted hover:text-vw-text'}`}>
                  Deskripsi
                </button>
                <button type="button" onClick={() => setActiveTab('snk')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'snk' ? 'bg-white text-vw-text shadow-sm' : 'text-vw-muted hover:text-vw-text'}`}>
                  Syarat & Ketentuan
                </button>
              </div>
              
              {activeTab === 'desc' && (
                <p className="text-sm text-vw-muted leading-relaxed">{selectedProduct.description}</p>
              )}
              {activeTab === 'snk' && (
                <div className="text-sm text-vw-muted leading-relaxed bg-gray-50 p-4 rounded-lg border border-vw-border max-h-32 overflow-y-auto">{snkContent}</div>
              )}

              <div className="pt-4 mt-2 border-t border-vw-border/60">
                <label htmlFor="targetEmail" className="block text-xs font-semibold text-vw-text mb-1.5">Email Penerima</label>
                <input id="targetEmail" type="email" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border border-vw-border bg-white text-vw-text text-sm placeholder-vw-muted/60 focus:outline-none focus:ring-2 focus:ring-vw-accent/20 focus:border-vw-accent transition-all"
                  placeholder="Masukkan email tujuan" />
              </div>

              {boughtCredentials ? (
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check size={16} className="text-emerald-600" />
                    <h3 className="font-bold text-sm text-emerald-800">Kredensial Anda:</h3>
                  </div>
                  <p className="text-sm text-emerald-700 break-all leading-relaxed font-mono text-xs bg-white/60 p-3 rounded-lg border border-emerald-100">{boughtCredentials}</p>
                </div>
              ) : (
                <button type="submit"
                  disabled={isProcessing || (selectedProduct.is_variation && !selectedVariation) || userProfile.balance < payPrice}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    isProcessing ? 'bg-vw-accent/60 text-white cursor-wait'
                      : (selectedProduct.is_variation && !selectedVariation) || userProfile.balance < payPrice
                        ? 'bg-gray-100 text-vw-muted cursor-not-allowed'
                        : 'bg-vw-accent text-white hover:bg-vw-accent-hover shadow-lg shadow-vw-accent/20'
                  }`}>
                  <span className="inline-flex items-center justify-center gap-2">
                    {isProcessing ? (
                      <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Memproses...</>
                    ) : (
                      <><ShoppingCart size={16} /> Beli {formatRupiah(payPrice)}</>
                    )}
                  </span>
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
