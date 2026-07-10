import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Wallet, ShoppingBag, TrendingUp,
  Settings, Shield, Search, X, Check, AlertTriangle,
  DollarSign, UserX, Star, Clock, RefreshCw,
  Activity, Percent, Tag, Crown, Filter
} from "lucide-react";
import { UserProfile } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

type AdminTabId = "overview" | "users" | "deposits" | "orders" | "reports" | "prices" | "settings";

interface TabAdminProps {
  userProfile: UserProfile;
}

const API = {
  headers: () => ({ Authorization: `Bearer ${localStorage.getItem("vw_current_user") || ""}`, "Content-Type": "application/json" }),
  async get(url: string) { const r = await fetch(url, { headers: this.headers() }); return r.json(); },
  async post(url: string, body: any) { const r = await fetch(url, { method: "POST", headers: this.headers(), body: JSON.stringify(body) }); return r.json(); },
  async del(url: string) { const r = await fetch(url, { method: "DELETE", headers: this.headers() }); return r.json(); },
};

const roleBadge = (role: string) => {
  const styles: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700 border-purple-200",
    admin: "bg-indigo-100 text-indigo-700 border-indigo-200",
    reseller: "bg-blue-100 text-blue-700 border-blue-200",
    member: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return styles[role] || styles.member;
};

const tierBadge = (tier: string) => {
  const styles: Record<string, string> = {
    VIP: "bg-amber-100 text-amber-700",
    Reseller: "bg-blue-100 text-blue-700",
    Regular: "bg-gray-100 text-gray-600",
  };
  return styles[tier] || styles.Regular;
};

const statusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "success" || s === "paid") return "bg-emerald-100 text-emerald-700";
  if (s === "pending" || s === "processing") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

const formatDate = (ts: number) => {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("id-ID");
};

export default function TabAdmin({ userProfile }: TabAdminProps) {
  const [adminTab, setAdminTab] = useState<AdminTabId>("overview");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editBalance, setEditBalance] = useState(0);
  const [editTier, setEditTier] = useState("Regular");
  const [editRole, setEditRole] = useState("member");
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Product price editing
  const [editingPrice, setEditingPrice] = useState<{ code: string; name: string; price: number; minPrice: number; originalPrice: number } | null>(null);
  const [newPriceVal, setNewPriceVal] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [orderStats, setOrderStats] = useState<any>(null);
  const [lineChartMode, setLineChartMode] = useState<"count" | "revenue">("count");

  const showMsg = (type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, u, d, o, os] = await Promise.all([
        API.get("/api/admin/stats"), API.get("/api/admin/users"), API.get("/api/admin/deposits"),
        API.get("/api/admin/orders"), API.get("/api/admin/orders/stats"),
      ]);
      setStats(s);
      setIsOwner(s.isOwner || false);
      setUsers(u.users || []);
      setDeposits(d.deposits || []);
      setOrders(o.orders || []);
      setOrderStats(os);
    } catch (e) { console.error("Admin load error:", e); }
    setLoading(false);
  };

  const loadProducts = async () => {
    const res = await API.get("/api/admin/products");
    setProducts(res.data || []);
  };

  useEffect(() => { setTimeout(() => loadData(), 200); }, []);

  // Auto-load products when prices tab is selected
  useEffect(() => {
    if (adminTab === "prices" && products.length === 0) {
      loadProducts();
    }
  }, [adminTab]);

  const handleUpdateBalance = async (userId: string, amount: number, action: "set" | "add" | "deduct") => {
    const res = await API.post(`/api/admin/users/${userId}/balance`, { amount, action });
    if (res.error) showMsg("error", res.error);
    else { showMsg("success", "Saldo diperbarui!"); loadData(); }
    setSelectedUser(null);
  };

  const handleUpdateTier = async (userId: string, tier: string) => {
    const res = await API.post(`/api/admin/users/${userId}/tier`, { tier });
    if (res.error) showMsg("error", res.error);
    else { showMsg("success", "Tier diperbarui!"); loadData(); }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    const res = await API.post(`/api/admin/users/${userId}/role`, { role });
    if (res.error) showMsg("error", res.error);
    else { showMsg("success", `Role diubah ke ${role}!`); loadData(); }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Hapus user "${username}"? Aksi ini tidak bisa dibatalkan.`)) return;
    const res = await API.del(`/api/admin/users/${userId}`);
    if (res.error) showMsg("error", res.error);
    else { showMsg("success", "User dihapus!"); loadData(); }
  };

  const handleConfirmDeposit = async (depId: string) => {
    const res = await API.post(`/api/admin/deposits/${depId}/confirm`, {});
    if (res.error) showMsg("error", res.error);
    else { showMsg("success", "Deposit dikonfirmasi!"); loadData(); }
  };

  const handleSavePrice = async () => {
    if (!editingPrice) return;
    if (newPriceVal < 0) { showMsg("error", "Harga tidak valid"); return; }
    if (!isOwner && newPriceVal < editingPrice.minPrice) {
      showMsg("error", `Harga minimal ${fmt(editingPrice.minPrice)} (70% dari harga asli)`);
      return;
    }
    const res = await API.post(`/api/admin/products/${editingPrice.code}/price`, { price: newPriceVal });
    if (res.error) showMsg("error", res.error);
    else { showMsg("success", `Harga ${editingPrice.name} diubah ke ${fmt(newPriceVal)}`); loadProducts(); }
    setEditingPrice(null);
  };

  const adminTabs: { id: AdminTabId; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "deposits", label: "Deposits", icon: Wallet },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "reports", label: "Laporan", icon: TrendingUp },
    { id: "prices", label: "Harga Produk", icon: Tag },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const statCards = stats ? [
    { label: "Total Users", value: stats.totalUsers || 0, icon: Users, color: "#3B82F6" },
    { label: "Total Revenue", value: fmt(stats.totalRevenue || 0), icon: DollarSign, color: "#10B981" },
    { label: "Total Orders", value: stats.totalOrders || 0, icon: ShoppingBag, color: "#8B5CF6" },
    { label: "Order Value", value: fmt(stats.totalOrderValue || 0), icon: TrendingUp, color: "#F59E0B" },
    { label: "Pending Deposit", value: stats.pendingDeposits || 0, icon: Clock, color: "#EF4444" },
    { label: "Open Tickets", value: stats.openTickets || 0, icon: Activity, color: "#EC4899" },
  ] : [];

  const filteredUsers = users.filter((u: any) =>
    (u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter((p: any) =>
    (p.name || "").toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.code || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Notification */}
      {actionMsg && (
        <div className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm ${
          actionMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {actionMsg.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {actionMsg.text}
        </div>
      )}

      {/* Role Indicator */}
      <div className="flex items-center gap-2 mb-2">
        {isOwner ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-100 text-purple-700 text-[10px] font-bold">
            <Crown size={12} /> OWNER
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-bold">
            <Shield size={12} /> ADMIN
          </span>
        )}
        <span className="text-[10px] text-vw-muted">{userProfile.username}</span>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-vw-border">
        {adminTabs.map(t => (
          <button key={t.id} onClick={() => setAdminTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              adminTab === t.id ? "bg-vw-accent text-white shadow-sm" : "bg-white border border-vw-border text-vw-muted hover:text-vw-text hover:bg-vw-surface"
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
        <button onClick={loadData} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-vw-border text-vw-muted hover:text-vw-text cursor-pointer">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading && !stats ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white border border-vw-border rounded-xl p-4 h-24 animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ===== OVERVIEW ===== */}
          {adminTab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {statCards.map((s, i) => (
                  <div key={s.label} className="bg-white border border-vw-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <s.icon size={18} style={{ color: s.color }} />
                      <span className="text-[10px] font-semibold text-vw-muted uppercase">{s.label}</span>
                    </div>
                    <p className="text-xl font-bold text-vw-text">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white border border-vw-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-vw-text mb-3 flex items-center gap-2">
                    <Users size={16} className="text-vw-accent" /> User Terbaru
                  </h3>
                  <div className="space-y-2">
                    {(stats?.recentUsers || []).map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xs font-semibold text-vw-text">{u.username}</p>
                            <p className="text-[10px] text-vw-muted">{u.email}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleBadge(u.role || "member")}`}>
                            {u.role || "member"}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-vw-accent">{fmt(u.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-vw-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-vw-text mb-3 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-vw-accent" /> Order Terbaru
                  </h3>
                  <div className="space-y-2">
                    {(stats?.recentOrders || []).slice(0, 5).map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-vw-text truncate">{o.productName || "-"}</p>
                          <p className="text-[10px] text-vw-muted">{o.username} — {fmt(o.price)}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusBadge(o.status)}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly Revenue Chart (simple bars) */}
              {stats?.weeklyRevenue?.length > 0 && (
                <div className="bg-white border border-vw-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-vw-text mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-vw-accent" /> Revenue 7 Hari Terakhir
                  </h3>
                  <div className="flex items-end gap-3 h-24">
                    {(stats.weeklyRevenue || []).map((d: any, i: number) => {
                      const max = Math.max(...(stats.weeklyRevenue || []).map((x: any) => x.total || 0), 1);
                      const h = Math.max(8, ((d.total || 0) / max) * 100);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] font-semibold text-vw-text">{fmt(d.total || 0)}</span>
                          <div className="w-full bg-vw-accent/20 rounded-t-md" style={{ height: `${h}%`, minHeight: 8 }} />
                          <span className="text-[8px] text-vw-muted">{d.day?.slice(-2) || ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== USERS ===== */}
          {adminTab === "users" && (
            <div className="bg-white border border-vw-border rounded-xl">
              <div className="p-4 border-b border-vw-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-vw-text flex items-center gap-2"><Users size={16} className="text-vw-accent" /> Manajemen User ({users.length})</h3>
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-vw-muted" />
                  <input type="text" placeholder="Cari user..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-vw-border rounded-lg text-xs focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-semibold text-vw-muted">User</th>
                      <th className="text-left p-3 font-semibold text-vw-muted">Email</th>
                      <th className="text-right p-3 font-semibold text-vw-muted">Balance</th>
                      <th className="text-center p-3 font-semibold text-vw-muted">Tier</th>
                      <th className="text-center p-3 font-semibold text-vw-muted">Role</th>
                      <th className="text-center p-3 font-semibold text-vw-muted">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u: any) => (
                      <tr key={u.id} className="border-t border-vw-border hover:bg-gray-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-vw-text">{u.username}</span>
                            {(u.role === "owner" || u.role === "admin") && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleBadge(u.role)}`}>
                                {u.role === "owner" ? <><Crown size={9} className="inline" /> OWNER</> : "ADMIN"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-vw-muted">{u.email || "-"}</td>
                        <td className="p-3 text-right font-bold text-vw-text">{fmt(u.balance)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${tierBadge(u.tier || "Regular")}`}>
                            {u.tier || "Regular"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${roleBadge(u.role || "member")}`}>
                            {u.role || "member"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setSelectedUser(u); setEditBalance(u.balance); setEditTier(u.tier || "Regular"); setEditRole(u.role || "member"); }}
                              className="p-1.5 rounded-lg text-vw-info hover:bg-blue-50 cursor-pointer" title="Edit">
                              <Settings size={14} />
                            </button>
                            {u.role !== "owner" && u.role !== "admin" && (
                              <button onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer" title="Hapus">
                                <UserX size={14} />
                              </button>
                            )}
                            {u.role === "admin" && isOwner && (
                              <button onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer" title="Hapus">
                                <UserX size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
                  <div className="bg-white rounded-xl border border-vw-border p-6 w-full max-w-md shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-vw-text flex items-center gap-2">
                        Edit User
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleBadge(selectedUser.role || "member")}`}>
                          {selectedUser.role || "member"}
                        </span>
                      </h3>
                      <button onClick={() => setSelectedUser(null)} className="text-vw-muted hover:text-vw-text cursor-pointer"><X size={18} /></button>
                    </div>
                    <div className="space-y-4">
                      {/* Balance */}
                      <div>
                        <label className="text-[10px] font-semibold text-vw-muted uppercase tracking-wider">Set Balance ({fmt(selectedUser.balance)})</label>
                        <div className="flex gap-2 mt-1">
                          <input type="number" value={editBalance} onChange={e => setEditBalance(Number(e.target.value))}
                            className="flex-1 px-3 py-2 border border-vw-border rounded-lg text-xs focus:outline-none focus:border-vw-accent" />
                          <button onClick={() => handleUpdateBalance(selectedUser.id, editBalance, "set")}
                            className="px-3 py-2 bg-vw-accent text-white text-xs font-bold rounded-lg hover:bg-vw-accent-hover cursor-pointer">Set</button>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleUpdateBalance(selectedUser.id, Math.abs(editBalance || 0), "add")}
                            className="flex-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 cursor-pointer">+ Tambah</button>
                          <button onClick={() => handleUpdateBalance(selectedUser.id, Math.abs(editBalance || 0), "deduct")}
                            className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 cursor-pointer">- Kurangi</button>
                        </div>
                      </div>

                      {/* Tier */}
                      <div>
                        <label className="text-[10px] font-semibold text-vw-muted uppercase tracking-wider">Tier</label>
                        <div className="flex gap-2 mt-1">
                          {["Regular", "Reseller", "VIP"].map(t => (
                            <button key={t} onClick={() => setEditTier(t)}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                editTier === t ? "bg-vw-accent text-white" : "bg-gray-100 text-vw-muted border border-vw-border hover:text-vw-text"
                              }`}>{t}</button>
                          ))}
                        </div>
                        <button onClick={() => handleUpdateTier(selectedUser.id, editTier)}
                          className="mt-2 w-full px-3 py-2 bg-vw-text text-white text-xs font-bold rounded-lg hover:bg-gray-800 cursor-pointer">Update Tier</button>
                      </div>

                      {/* Role */}
                      <div>
                        <label className="text-[10px] font-semibold text-vw-muted uppercase tracking-wider">Role</label>
                        <div className="flex gap-2 mt-1">
                          {(["member", "reseller", "admin", "owner"] as const).map(r => {
                            // Only owner can promote to admin/owner
                            if ((r === "admin" || r === "owner") && !isOwner) return null;
                            // Can't demote owner
                            if (selectedUser.role === "owner" && r !== "owner") return null;
                            return (
                              <button key={r} onClick={() => setEditRole(r)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  editRole === r ? "bg-vw-accent text-white" : "bg-gray-100 text-vw-muted border border-vw-border hover:text-vw-text"
                                }`}>{r}</button>
                            );
                          })}
                        </div>
                        <button onClick={() => handleUpdateRole(selectedUser.id, editRole)}
                          className="mt-2 w-full px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 cursor-pointer">Update Role</button>
                      </div>

                      {/* Info */}
                      <div className="p-3 rounded-lg bg-gray-50 text-xs text-vw-muted space-y-1">
                        <p>ID: {selectedUser.id}</p>
                        <p>Email: {selectedUser.email || "-"}</p>
                        <p>Phone: {selectedUser.phone || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== DEPOSITS ===== */}
          {adminTab === "deposits" && (
            <div className="bg-white border border-vw-border rounded-xl">
              <div className="p-4 border-b border-vw-border">
                <h3 className="text-sm font-bold text-vw-text flex items-center gap-2">
                  <Wallet size={16} className="text-vw-accent" /> Manajemen Deposit ({deposits.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-semibold text-vw-muted">ID</th>
                      <th className="text-left p-3 font-semibold text-vw-muted">User</th>
                      <th className="text-right p-3 font-semibold text-vw-muted">Amount</th>
                      <th className="text-center p-3 font-semibold text-vw-muted">Status</th>
                      <th className="text-left p-3 font-semibold text-vw-muted">Date</th>
                      <th className="text-center p-3 font-semibold text-vw-muted">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-xs text-vw-muted">Belum ada data deposit</td></tr>
                    ) : (
                      deposits.map((d: any) => (
                        <tr key={d.id} className="border-t border-vw-border hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-vw-text">{d.id}</td>
                          <td className="p-3 text-vw-text">{d.username}</td>
                          <td className="p-3 text-right font-bold text-vw-text">{fmt(d.amount)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadge(d.status)}`}>{d.status}</span>
                          </td>
                          <td className="p-3 text-vw-muted text-[10px]">{formatDate(d.createdAt)}</td>
                          <td className="p-3 text-center">
                            {(d.status === "pending" || d.status === "Pending") && (
                              <button onClick={() => handleConfirmDeposit(d.id)}
                                className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 cursor-pointer">Konfirmasi</button>
                            )}
                            {(d.status !== "pending" && d.status !== "Pending") && <span className="text-[10px] text-vw-muted">-</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== ORDERS ===== */}
          {adminTab === "orders" && (
            <div className="bg-white border border-vw-border rounded-xl">
              <div className="p-4 border-b border-vw-border">
                <h3 className="text-sm font-bold text-vw-text flex items-center gap-2">
                  <ShoppingBag size={16} className="text-vw-accent" /> Semua Pesanan ({orders.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-semibold text-vw-muted">ID</th>
                      <th className="text-left p-3 font-semibold text-vw-muted">User</th>
                      <th className="text-left p-3 font-semibold text-vw-muted">Produk</th>
                      <th className="text-left p-3 font-semibold text-vw-muted">Target</th>
                      <th className="text-right p-3 font-semibold text-vw-muted">Harga</th>
                      <th className="text-center p-3 font-semibold text-vw-muted">Status</th>
                      <th className="text-left p-3 font-semibold text-vw-muted">Tgl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={7} className="p-6 text-center text-xs text-vw-muted">Belum ada data pesanan</td></tr>
                    ) : (
                      orders.map((o: any) => (
                        <tr key={o.id} className="border-t border-vw-border hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-vw-text">{o.id}</td>
                          <td className="p-3 text-vw-text">{o.username}</td>
                          <td className="p-3 font-medium text-vw-text max-w-[200px] truncate" title={o.productName}>{o.productName}</td>
                          <td className="p-3 text-vw-muted max-w-[120px] truncate">{o.target}</td>
                          <td className="p-3 text-right font-bold text-vw-text">{fmt(o.price)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadge(o.status)}`}>{o.status}</span>
                          </td>
                          <td className="p-3 text-vw-muted text-[10px]">{o.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== LAPORAN ===== */}
          {adminTab === "reports" && !orderStats && (
            <div className="text-center py-10 text-vw-muted text-sm">Memuat data laporan...</div>
          )}
          {adminTab === "reports" && orderStats && (
            <div className="space-y-5">
              {/* Line Chart: Tren Order Harian */}
              {orderStats.daily && orderStats.daily.length > 0 && (() => {
                const daily = orderStats.daily;
                const maxVal = Math.max(...daily.map((d: any) => d[lineChartMode]), 1);
                const W = 700, H = 220, pad = { top: 20, right: 20, bottom: 36, left: 50 };
                const chartW = W - pad.left - pad.right;
                const chartH = H - pad.top - pad.bottom;
                const stepX = chartW / (daily.length - 1 || 1);
                
                // Build polyline points
                const pts = daily.map((d: any, i: number) => {
                  const x = pad.left + i * stepX;
                  const y = pad.top + chartH - (d[chartMode] / maxVal) * chartH;
                  return `${x},${y}`;
                });
                const polylinePts = pts.join(' ');
                // Area fill points
                const areaPts = `${pad.left},${pad.top + chartH} ${pts.join(' ')} ${pad.left + (daily.length - 1) * stepX},${pad.top + chartH}`;
                
                // Y-axis labels
                const yLabels = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];
                // X-axis labels (show every ~5th day)
                const labelEvery = Math.max(1, Math.floor(daily.length / 6));
                
                return (
                  <div className="bg-white border border-vw-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-vw-text flex items-center gap-2">
                        <TrendingUp size={16} className="text-vw-accent" /> Tren Pesanan 30 Hari
                      </h3>
                      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button onClick={() => setLineChartMode("count")}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            lineChartMode === "count" ? "bg-white text-vw-text shadow-sm" : "text-vw-muted hover:text-vw-text"
                          }`}>Jumlah</button>
                        <button onClick={() => setLineChartMode("revenue")}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            lineChartMode === "revenue" ? "bg-white text-vw-text shadow-sm" : "text-vw-muted hover:text-vw-text"
                          }`}>Revenue</button>
                      </div>
                    </div>
                    <div className="w-full overflow-x-auto">
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]" style={{ maxHeight: 240 }}>
                        {/* Y-axis grid lines */}
                        {yLabels.map((val, i) => {
                          const y = pad.top + chartH - (val / maxVal) * chartH;
                          return (
                            <g key={i}>
                              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                              <text x={pad.left - 8} y={y + 3} textAnchor="end" fill="#9ca3af" fontSize="9">
                                {chartMode === "revenue" ? fmt(val) : val}
                              </text>
                            </g>
                          );
                        })}
                        {/* X-axis labels */}
                        {daily.map((d: any, i: number) => {
                          if (i % labelEvery !== 0 && i !== daily.length - 1) return null;
                          const x = pad.left + i * stepX;
                          return (
                            <text key={i} x={x} y={H - 4} textAnchor="middle" fill="#9ca3af" fontSize="8">
                              {d.day.slice(5)}
                            </text>
                          );
                        })}
                        {/* Area fill */}
                        <polygon points={areaPts} fill={chartMode === "revenue" ? "url(#revGrad)" : "url(#countGrad)"} opacity="0.25" />
                        {/* Line */}
                        <polyline points={polylinePts} fill="none" stroke={chartMode === "revenue" ? "#2563eb" : "#10B981"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                        {/* Data dots */}
                        {daily.map((d: any, i: number) => {
                          const x = pad.left + i * stepX;
                          const y = pad.top + chartH - (d[chartMode] / maxVal) * chartH;
                          const isHighlight = d[chartMode] > 0 && (i === 0 || i === daily.length - 1 || d[chartMode] === maxVal);
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r={isHighlight ? 3.5 : 2} fill={chartMode === "revenue" ? "#2563eb" : "#10B981"} stroke="#fff" strokeWidth="1.5" />
                            </g>
                          );
                        })}
                        {/* Hover tooltip area (invisible) */}
                        {daily.map((d: any, i: number) => {
                          const x = pad.left + i * stepX;
                          const y = pad.top + chartH - (d[chartMode] / maxVal) * chartH;
                          return (
                            <g key={`t-${i}`}>
                              <title>{d.day}: {chartMode === "revenue" ? fmt(d[chartMode]) : `${d[chartMode]} order`}</title>
                              <rect x={x - stepX/2} y={pad.top} width={stepX} height={chartH} fill="transparent" />
                            </g>
                          );
                        })}
                        {/* Gradients */}
                        <defs>
                          <linearGradient id="countGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-vw-muted">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded bg-emerald-500" /> Jumlah Order</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded bg-blue-500" /> Revenue</span>
                      <span className="ml-auto font-semibold text-vw-text">
                        {chartMode === "revenue"
                          ? `Total: ${fmt(daily.reduce((s: number, d: any) => s + (d.revenue || 0), 0))}`
                          : `Total: ${daily.reduce((s: number, d: any) => s + (d.count || 0), 0)} order`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Chart: Status Order */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Donut Chart */}
                <div className="bg-white border border-vw-border rounded-xl p-5">
                  <h3 className="text-sm font-bold text-vw-text mb-4 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-vw-accent" /> Status Pesanan
                  </h3>
                  {(() => {
                    const total = orderStats.totalOrders || 1;
                    const success = orderStats.success?.count || 0;
                    const processing = orderStats.processing?.count || 0;
                    const failed = orderStats.failed?.count || 0;
                    const sPct = (success / total) * 100;
                    const pPct = (processing / total) * 100;
                    const fPct = (failed / total) * 100;
                    const donutGrad = `conic-gradient(#10B981 0% ${sPct}%, #F59E0B ${sPct}% ${sPct + pPct}%, #EF4444 ${sPct + pPct}% 100%)`;
                    return (
                      <div className="flex items-center gap-8">
                        <div className="relative shrink-0">
                          <div className="w-36 h-36 rounded-full" style={{ background: donutGrad }}>
                            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-vw-text">{total}</p>
                                <p className="text-[9px] text-vw-muted font-semibold">Total</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          {[
                            { label: "Berhasil", count: success, pct: sPct, bg: "bg-emerald-50", dot: "bg-emerald-500", text: "text-emerald-700" },
                            { label: "Pending", count: processing, pct: pPct, bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-700" },
                            { label: "Gagal", count: failed, pct: fPct, bg: "bg-red-50", dot: "bg-red-500", text: "text-red-700" },
                          ].map(item => (
                            <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-lg ${item.bg}`}>
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                                <span className="text-xs font-semibold text-vw-text">{item.label}</span>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-bold ${item.text}`}>{item.count}</p>
                                <p className={`text-[10px] ${item.text.replace('700','500')}`}>{item.pct.toFixed(1)}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Revenue by Status */}
                <div className="bg-white border border-vw-border rounded-xl p-5">
                  <h3 className="text-sm font-bold text-vw-text mb-4 flex items-center gap-2">
                    <DollarSign size={16} className="text-vw-accent" /> Revenue per Status
                  </h3>
                  <div className="space-y-5">
                    {(() => {
                      const total = orderStats.totalRevenue || 1;
                      const items = [
                        { label: "Berhasil", value: orderStats.success?.revenue || 0, color: "bg-emerald-500", bg: "bg-emerald-100", text: "text-emerald-700" },
                        { label: "Pending", value: orderStats.processing?.revenue || 0, color: "bg-amber-500", bg: "bg-amber-100", text: "text-amber-700" },
                        { label: "Gagal", value: orderStats.failed?.revenue || 0, color: "bg-red-500", bg: "bg-red-100", text: "text-red-700" },
                      ];
                      return items.map((item) => {
                        const pct = total > 0 ? (item.value / total) * 100 : 0;
                        return (
                          <div key={item.label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-vw-text">{item.label}</span>
                              <span className={`text-xs font-bold ${item.text}`}>{fmt(item.value)}</span>
                            </div>
                            <div className={`w-full h-3 rounded-full ${item.bg} overflow-hidden`}>
                              <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[9px] text-vw-muted mt-0.5 block">{pct.toFixed(1)}% dari total</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Total Revenue", value: fmt(orderStats.totalRevenue || 0), color: "" },
                  { label: "Revenue Berhasil", value: fmt(orderStats.success?.revenue || 0), color: "text-emerald-600" },
                  { label: "Revenue Pending", value: fmt(orderStats.processing?.revenue || 0), color: "text-amber-600" },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-vw-border rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-vw-muted uppercase mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color || "text-vw-text"}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Mutasi QRIS */}
              <div className="bg-white border border-vw-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-vw-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-vw-text flex items-center gap-2">
                    <Wallet size={16} className="text-vw-accent" /> Mutasi QRIS ({deposits.length})
                  </h3>
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="text-vw-muted">
                      Total: <span className="font-bold text-vw-text">{fmt(deposits.reduce((s: number, d: any) => s + (d.amount || 0), 0))}</span>
                    </span>
                    <span className="text-emerald-600 font-semibold">
                      Sukses: {fmt(deposits.filter((d: any) => d.status === 'success').reduce((s: number, d: any) => s + (d.amount || 0), 0))}
                    </span>
                    <span className="text-amber-600 font-semibold">
                      Pending: {deposits.filter((d: any) => d.status === 'pending').length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-semibold text-vw-muted">ID</th>
                        <th className="text-left p-3 font-semibold text-vw-muted">User</th>
                        <th className="text-right p-3 font-semibold text-vw-muted">Jumlah</th>
                        <th className="text-center p-3 font-semibold text-vw-muted">Status</th>
                        <th className="text-left p-3 font-semibold text-vw-muted">Tanggal</th>
                        <th className="text-left p-3 font-semibold text-vw-muted">Tx ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-xs text-vw-muted">Belum ada mutasi QRIS</td></tr>
                      ) : (
                        deposits.slice(0, 50).map((d: any) => (
                          <tr key={d.id} className="border-t border-vw-border hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 font-semibold text-vw-text">{d.id}</td>
                            <td className="p-3 text-vw-text">{d.username}</td>
                            <td className="p-3 text-right font-bold text-vw-text">{fmt(d.amount)}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadge(d.status)}`}>{d.status}</span>
                            </td>
                            <td className="p-3 text-vw-muted text-[10px]">{formatDate(d.createdAt)}</td>
                            <td className="p-3 text-[9px] font-mono text-vw-muted max-w-[100px] truncate" title={d.transactionId}>{d.transactionId || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== HARGA PRODUK ===== */}
          {adminTab === "prices" && (
            <div className="bg-white border border-vw-border rounded-xl">
              <div className="p-4 border-b border-vw-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-vw-text flex items-center gap-2">
                  <Tag size={16} className="text-vw-accent" /> Atur Harga Produk (min 70%)
                  {!isOwner && <span className="text-[9px] font-normal text-vw-muted ml-2">— Admin: minimal 70%</span>}
                </h3>
                <div className="flex items-center gap-2">
                  {isOwner && <span className="text-[9px] text-purple-600 font-semibold flex items-center gap-1"><Crown size={10} /> Full akses</span>}
                  <div className="relative w-full sm:w-56">
                    <Search size={14} className="absolute left-3 top-2.5 text-vw-muted" />
                    <input type="text" placeholder="Cari produk..." value={productSearch} onChange={e => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-vw-border rounded-lg text-xs focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent" />
                  </div>
                  <button onClick={loadProducts} className="p-2 rounded-lg bg-vw-accent/10 text-vw-accent hover:bg-vw-accent/20 cursor-pointer">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              {products.length === 0 && (
                <div className="p-6 text-center">
                  <button onClick={loadProducts} className="px-4 py-2 bg-vw-accent text-white text-xs font-bold rounded-lg hover:bg-vw-accent-hover cursor-pointer">
                    Muat Data Produk
                  </button>
                </div>
              )}
              {products.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-semibold text-vw-muted">Produk</th>
                        <th className="text-right p-3 font-semibold text-vw-muted">Harga Asli</th>
                        <th className="text-right p-3 font-semibold text-vw-muted">Harga Saat Ini</th>
                        <th className="text-right p-3 font-semibold text-vw-muted">Min (70%)</th>
                        <th className="text-center p-3 font-semibold text-vw-muted">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p: any) => {
                        const isModified = p.current_price !== p.original_price && p.current_price > 0;
                        return (
                          <tr key={p.id} className="border-t border-vw-border hover:bg-gray-50/50">
                            <td className="p-3 font-medium text-vw-text max-w-[250px] truncate" title={p.name}>{p.name}</td>
                            <td className="p-3 text-right text-vw-muted">{fmt(p.original_price)}</td>
                            <td className="p-3 text-right">
                              <span className={`font-bold ${isModified ? "text-vw-accent" : "text-vw-text"}`}>
                                {p.current_price > 0 ? fmt(p.current_price) : fmt(p.original_price)}
                              </span>
                              {isModified && <span className="ml-1 text-[9px] text-vw-accent">*</span>}
                            </td>
                            <td className="p-3 text-right text-vw-muted">{fmt(p.min_price)}</td>
                            <td className="p-3 text-center">
                              <button onClick={() => {
                                setEditingPrice({
                                  code: p.code,
                                  name: p.name,
                                  price: p.current_price > 0 ? p.current_price : p.original_price,
                                  minPrice: p.min_price,
                                  originalPrice: p.original_price
                                });
                                setNewPriceVal(p.current_price > 0 ? p.current_price : p.original_price);
                              }}
                                className="px-3 py-1.5 bg-vw-accent/10 text-vw-accent text-[10px] font-bold rounded-lg hover:bg-vw-accent/20 cursor-pointer">
                                Ubah Harga
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {editingPrice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
                  <div className="bg-white rounded-xl border border-vw-border p-6 w-full max-w-sm shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-vw-text">Edit Harga</h3>
                      <button onClick={() => setEditingPrice(null)} className="text-vw-muted hover:text-vw-text cursor-pointer"><X size={18} /></button>
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-medium text-vw-text truncate">{editingPrice.name}</p>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-vw-muted">Harga Asli</span><span className="font-bold">{fmt(editingPrice.originalPrice)}</span></div>
                        <div className="flex justify-between"><span className="text-vw-muted">Harga Minimal (70%)</span><span className="font-bold text-vw-accent">{fmt(editingPrice.minPrice)}</span></div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-vw-muted uppercase tracking-wider">Harga Baru</label>
                        <input type="number" value={newPriceVal} onChange={e => setNewPriceVal(Number(e.target.value))}
                          min={isOwner ? 0 : editingPrice.minPrice}
                          className="w-full px-3 py-2 border border-vw-border rounded-lg text-sm focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent mt-1" />
                      </div>
                      {!isOwner && newPriceVal < editingPrice.minPrice && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-[11px] text-red-600 flex items-start gap-1.5">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          Harga tidak boleh di bawah {fmt(editingPrice.minPrice)} (min 70%)
                        </div>
                      )}
                      {isOwner && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-[11px] text-purple-600 flex items-start gap-1.5">
                          <Crown size={13} className="shrink-0 mt-0.5" />
                          Owner: bisa set harga berapa pun
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => setEditingPrice(null)}
                          className="flex-1 px-3 py-2 border border-vw-border text-xs font-bold rounded-lg text-vw-muted hover:text-vw-text cursor-pointer">Batal</button>
                        <button onClick={handleSavePrice}
                          className="flex-1 px-3 py-2 bg-vw-accent text-white text-xs font-bold rounded-lg hover:bg-vw-accent-hover cursor-pointer">Simpan</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {adminTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-vw-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-vw-text mb-3 flex items-center gap-2">
                  <Shield size={16} className="text-vw-accent" /> Admin Info
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-vw-accent/10 flex items-center justify-center text-vw-accent font-bold text-sm">
                      {userProfile.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-vw-text">{userProfile.username}</p>
                      <p className="text-xs text-vw-muted">{userProfile.email}</p>
                    </div>
                    <span className={`ml-auto px-2 py-1 rounded-full text-[9px] font-bold border ${isOwner ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-indigo-100 text-indigo-700 border-indigo-200"}`}>
                      {isOwner ? "OWNER" : "ADMIN"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 text-xs text-vw-muted space-y-1">
                    <p className="flex justify-between"><span>Role</span><span className="font-bold text-vw-text">{isOwner ? "Owner" : "Admin"}</span></p>
                    <p className="flex justify-between"><span>Tier</span><span className="font-bold text-vw-text">{userProfile.tier}</span></p>
                    <p className="flex justify-between"><span>Balance</span><span className="font-bold text-vw-text">{fmt(userProfile.balance)}</span></p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-vw-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-vw-text mb-3 flex items-center gap-2"><Activity size={16} className="text-vw-accent" /> System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-xs text-vw-muted">Backend API</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Online</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-xs text-vw-muted">Database</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-xs text-vw-muted">Total Users</span>
                    <span className="text-xs font-bold text-vw-text">{stats?.totalUsers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-xs text-vw-muted">Role Anda</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${isOwner ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-indigo-100 text-indigo-700 border-indigo-200"}`}>
                      {isOwner ? "OWNER" : "ADMIN"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
