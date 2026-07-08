import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Wallet, ShoppingBag, MessageSquare,
  TrendingUp, Settings, Shield, Search, X, Check, AlertTriangle,
  DollarSign, UserX, Star, Clock, RefreshCw, ChevronDown, ChevronUp,
  Activity
} from "lucide-react";
import { UserProfile } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

type AdminTabId = "overview" | "users" | "deposits" | "orders" | "reports" | "settings";

interface TabAdminProps {
  userProfile: UserProfile;
}

const API = {
  headers: () => ({ Authorization: `Bearer ${localStorage.getItem("vw_current_user") || ""}`, "Content-Type": "application/json" }),
  async get(url: string) { const r = await fetch(url, { headers: this.headers() }); return r.json(); },
  async post(url: string, body: any) { const r = await fetch(url, { method: "POST", headers: this.headers(), body: JSON.stringify(body) }); return r.json(); },
  async del(url: string) { const r = await fetch(url, { method: "DELETE", headers: this.headers() }); return r.json(); },
};

export default function TabAdmin({ userProfile }: TabAdminProps) {
  const [adminTab, setAdminTab] = useState<AdminTabId>("overview");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editBalance, setEditBalance] = useState(0);
  const [editTier, setEditTier] = useState("Regular");
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    console.log("Admin: Loading data...");
    try {
      const [s, u, d, o] = await Promise.all([
        API.get("/api/admin/stats"), API.get("/api/admin/users"), API.get("/api/admin/deposits"),
        API.get("/api/admin/orders"),
      ]);
      setStats(s); setUsers(u.users || []); setDeposits(d.deposits || []);
      setOrders(o.orders || []);
    } catch (e) { console.error("Admin load error:", e); }
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      loadData();
    }, 200);
  }, []);

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
    setSelectedUser(null);
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

  const handleReplyTicket = async (ticketId: string) => {
    if (!replyText.trim()) return;
    const res = await API.post(`/api/admin/tickets/${ticketId}/reply`, { message: replyText });
    if (res.error) showMsg("error", res.error);
    else { showMsg("success", "Balasan terkirim!"); loadData(); setReplyText(""); }
  };

  const adminTabs: { id: AdminTabId; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "deposits", label: "Deposits", icon: Wallet },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "reports", label: "Laporan", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const statCards = stats ? [
    { label: "Total Users", value: stats.totalUsers || 0, icon: Users, color: "#3B82F6" },
    { label: "Total Deposit", value: fmt(stats.totalRevenue || 0), icon: DollarSign, color: "#10B981" },
    { label: "Total Orders", value: stats.totalOrders || 0, icon: ShoppingBag, color: "#8B5CF6" },
    { label: "Order Value", value: fmt(stats.totalOrderValue || 0), icon: TrendingUp, color: "#F59E0B" },
    { label: "Pending Deposit", value: stats.pendingDeposits || 0, icon: Clock, color: "#EF4444" },
    { label: "Open Tickets", value: stats.openTickets || 0, icon: MessageSquare, color: "#EC4899" },
  ] : [];

  const filteredUsers = users.filter((u: any) =>
    (u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (ts: number) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleString("id-ID");
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Notification */}
      {actionMsg && (
        <div className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm ${
          actionMsg.type === "success" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {actionMsg.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {actionMsg.text}
        </div>
      )}

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
                        <div><p className="text-xs font-semibold text-vw-text">{u.username}</p><p className="text-[10px] text-vw-muted">{u.email}</p></div>
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
                          <p className="text-xs font-semibold text-vw-text truncate">{o.productName}</p>
                          <p className="text-[10px] text-vw-muted">{o.username} — {fmt(o.price)}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          o.status === "Success" ? "bg-blue-100 text-blue-700" : o.status === "Processing" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      <th className="text-left p-3 font-semibold text-vw-muted">Phone</th>
                      <th className="text-right p-3 font-semibold text-vw-muted">Balance</th>
                      <th className="text-center p-3 font-semibold text-vw-muted">Tier</th>
                      <th className="text-center p-3 font-semibold text-vw-muted">Role</th>
                      <th className="text-center p-3 font-semibold text-vw-muted">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u: any) => (
                      <tr key={u.id} className="border-t border-vw-border hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 font-semibold text-vw-text">{u.username}</td>
                        <td className="p-3 text-vw-muted">{u.email || "-"}</td>
                        <td className="p-3 text-vw-muted">{u.phone || "-"}</td>
                        <td className="p-3 text-right font-bold text-vw-text">{fmt(u.balance)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            u.tier === "VIP" ? "bg-amber-100 text-amber-700" : u.tier === "Reseller" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                          }`}>{u.tier || "Regular"}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                          }`}>{u.role || "member"}</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setSelectedUser(u); setEditBalance(u.balance); setEditTier(u.tier || "Regular"); }}
                              className="p-1.5 rounded-lg text-vw-info hover:bg-blue-50 cursor-pointer" title="Edit">
                              <Settings size={14} />
                            </button>
                            {u.role !== "admin" && (
                              <button onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1.5 rounded-lg text-vw-danger hover:bg-red-50 cursor-pointer" title="Hapus">
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
                  <div className="bg-white rounded-xl border border-vw-border p-6 w-full max-w-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-vw-text">Edit User: {selectedUser.username}</h3>
                      <button onClick={() => setSelectedUser(null)} className="text-vw-muted hover:text-vw-text cursor-pointer"><X size={18} /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-semibold text-vw-muted uppercase tracking-wider">Set Balance</label>
                        <div className="flex gap-2 mt-1">
                          <input type="number" value={editBalance} onChange={e => setEditBalance(Number(e.target.value))}
                            className="flex-1 px-3 py-2 border border-vw-border rounded-lg text-xs focus:outline-none focus:border-vw-accent" />
                          <button onClick={() => handleUpdateBalance(selectedUser.id, editBalance, "set")}
                            className="px-3 py-2 bg-vw-accent text-white text-xs font-bold rounded-lg hover:bg-vw-accent-hover cursor-pointer">Set</button>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleUpdateBalance(selectedUser.id, Math.abs(editBalance), "add")}
                            className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 cursor-pointer">+ Tambah</button>
                          <button onClick={() => handleUpdateBalance(selectedUser.id, Math.abs(editBalance), "deduct")}
                            className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 cursor-pointer">- Kurangi</button>
                        </div>
                      </div>
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
                          className="mt-2 w-full px-3 py-2 bg-vw-text text-white text-xs font-bold rounded-lg hover:bg-vw-accent cursor-pointer">Update Tier</button>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 text-xs text-vw-muted">
                        <p>ID: {selectedUser.id}</p>
                        <p>Email: {selectedUser.email || "-"}</p>
                        <p>Phone: {selectedUser.phone || "-"}</p>
                        <p>Balance: {fmt(selectedUser.balance)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
                    {deposits.map((d: any) => (
                      <tr key={d.id} className="border-t border-vw-border hover:bg-gray-50/50">
                        <td className="p-3 font-semibold text-vw-text">{d.id}</td>
                        <td className="p-3 text-vw-text">{d.username}</td>
                        <td className="p-3 text-right font-bold text-vw-text">{fmt(d.amount)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            d.status === "success" ? "bg-blue-100 text-blue-700" : d.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                          }`}>{d.status}</span>
                        </td>
                        <td className="p-3 text-vw-muted text-[10px]">{formatDate(d.createdAt)}</td>
                        <td className="p-3 text-center">
                          {d.status === "pending" && (
                            <button onClick={() => handleConfirmDeposit(d.id)}
                              className="px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 cursor-pointer">Konfirmasi</button>
                          )}
                          {d.status !== "pending" && <span className="text-[10px] text-vw-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                    {orders.map((o: any) => (
                      <tr key={o.id} className="border-t border-vw-border hover:bg-gray-50/50">
                        <td className="p-3 font-semibold text-vw-text">{o.id}</td>
                        <td className="p-3 text-vw-text">{o.username}</td>
                        <td className="p-3 font-medium text-vw-text max-w-[200px] truncate" title={o.productName}>{o.productName}</td>
                        <td className="p-3 text-vw-muted max-w-[120px] truncate">{o.target}</td>
                        <td className="p-3 text-right font-bold text-vw-text">{fmt(o.price)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            o.status === "Success" ? "bg-emerald-100 text-emerald-700" : o.status === "Processing" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                          }`}>{o.status}</span>
                        </td>
                        <td className="p-3 text-vw-muted text-[10px]">{o.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminTab === "reports" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-vw-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-vw-text mb-3 flex items-center gap-2"><DollarSign size={16} className="text-vw-accent" /> Ringkasan Keuangan</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50"><span className="text-xs text-vw-muted">Total Revenue</span><span className="text-sm font-bold text-vw-text">{fmt(stats?.totalRevenue || 0)}</span></div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50"><span className="text-xs text-vw-muted">Total Order Value</span><span className="text-sm font-bold text-vw-text">{fmt(stats?.totalOrderValue || 0)}</span></div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50"><span className="text-xs text-vw-muted">Pending Deposit</span><span className="text-sm font-bold text-amber-600">{stats?.pendingDeposits || 0}</span></div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50"><span className="text-xs text-vw-muted">Total Users</span><span className="text-sm font-bold text-vw-text">{stats?.totalUsers || 0}</span></div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50"><span className="text-xs text-vw-muted">Total Orders</span><span className="text-sm font-bold text-vw-text">{stats?.totalOrders || 0}</span></div>
                </div>
              </div>
              <div className="bg-white border border-vw-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-vw-text mb-3 flex items-center gap-2"><Star size={16} className="text-vw-accent" /> Top Products</h3>
                <p className="text-xs text-vw-muted mb-4">Produk dengan order terbanyak</p>
                <div className="space-y-2">
                  {[...new Map(orders.filter((o: any) => o.productName).map((o: any) => [o.productName, o])).values()].slice(0, 10).map((o: any) => (
                    <div key={o.productName} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <span className="text-xs text-vw-text truncate">{o.productName}</span>
                      <span className="text-[10px] text-vw-muted">{orders.filter((x: any) => x.productName === o.productName).length}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-vw-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-vw-text mb-3 flex items-center gap-2"><Shield size={16} className="text-vw-accent" /> Admin Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-vw-accent-light flex items-center justify-center text-vw-accent font-bold">{userProfile.username?.charAt(0)?.toUpperCase()}</div>
                    <div><p className="text-sm font-bold text-vw-text">{userProfile.username}</p><p className="text-xs text-vw-muted">{userProfile.email}</p></div>
                    <span className="ml-auto px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold">ADMIN</span>
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
                    <span className="text-xs text-vw-muted">Total Users</span>
                    <span className="text-xs font-bold text-vw-text">{stats?.totalUsers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-xs text-vw-muted">Database</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected</span>
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
