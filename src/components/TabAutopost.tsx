import { useState, useEffect, useCallback } from "react";
import {
  Play, Pause, Trash2, Plus, Edit,
  Clock, MessageSquare, Hash, Link, Webhook,
  Zap, RefreshCw, AlertCircle, CheckCircle,
  XCircle, Loader2, FileText, Settings,
  Activity, Calendar, Search
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────

interface Mission {
  id: string;
  discord_id: string;
  name: string;
  channels: string;
  message: string;
  file_paths: string | null;
  file_names: string | null;
  status: "running" | "paused" | "error";
  interval_minutes: number;
  custom_intervals: string | null;
  created_at: number;
}

interface Webhook {
  id: number;
  name: string;
  url: string;
}

interface PostLog {
  id: number;
  mission_id: string;
  channel_id: string;
  status: string;
  details: string;
  timestamp: number;
}

// ─── Helpers ───────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function formatDate(ts: number) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}

function truncate(str: string, len: number) {
  return str.length > len ? str.substring(0, len) + "..." : str;
}

// ─── Main Component ────────────────────────────────────────────────

export default function TabAutopost() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "edit" | "webhooks" | "logs">("list");
  const [editMission, setEditMission] = useState<Mission | null>(null);
  const [showNewMission, setShowNewMission] = useState(false);
  const [missionStats, setMissionStats] = useState<Record<string, number>>({});
  const [selectedLogs, setSelectedLogs] = useState<PostLog[]>([]);
  const [showLogsFor, setShowLogsFor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ─── Form State ──────────────────────────────────────────────────
  const [formName, setFormName] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formInterval, setFormInterval] = useState("");
  const [formChannels, setFormChannels] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // ─── Webhook Form State ──────────────────────────────────────────
  const [whName, setWhName] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whSaving, setWhSaving] = useState(false);

  // ─── Data Loading ────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [missionsRes, webhooksRes] = await Promise.all([
        fetch("/api/autopost/missions").catch(() => null),
        fetch("/api/autopost/webhooks").catch(() => null),
      ]);

      if (missionsRes?.ok) {
        const m = await missionsRes.json();
        setMissions(Array.isArray(m) ? m : []);
      } else {
        setMissions([]);
      }

      if (webhooksRes?.ok) {
        const w = await webhooksRes.json();
        setWebhooks(Array.isArray(w) ? w : []);
      } else {
        setWebhooks([]);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Load stats for all missions
  useEffect(() => {
    if (missions.length === 0) return;
    const loadStats = async () => {
      const stats: Record<string, number> = {};
      for (const m of missions) {
        try {
          const res = await fetch("/api/autopost/mission/stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: m.id }),
          });
          if (res.ok) {
            const data = await res.json();
            stats[m.id] = data.totalPosts || 0;
          }
        } catch {}
      }
      setMissionStats(stats);
    };
    loadStats();
  }, [missions]);

  // ─── Mission CRUD ────────────────────────────────────────────────

  const handleCreate = () => {
    const id = generateId();
    setEditMission({
      id, discord_id: "", name: "Misi Baru",
      channels: "", message: "", file_paths: null,
      file_names: null, status: "paused",
      interval_minutes: 60, custom_intervals: null,
      created_at: Date.now(),
    });
    setFormName("Misi Baru");
    setFormMessage("");
    setFormInterval("60");
    setFormChannels("");
    setShowNewMission(true);
    setView("edit");
  };

  const handleEdit = (mission: Mission) => {
    setEditMission(mission);
    setFormName(mission.name);
    setFormMessage(mission.message || "");
    setFormInterval(String(mission.interval_minutes || ""));
    setFormChannels(mission.channels?.split(",").map(c => c.trim()).join("\n") || "");
    setShowNewMission(false);
    setView("edit");
  };

  const handleSave = async () => {
    if (!editMission) return;
    setFormSaving(true);
    try {
      const channels = formChannels
        .split("\n")
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const res = await fetch("/api/autopost/mission/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editMission.id,
          name: formName || "Untitled",
          message: formMessage,
          intervalMinutes: parseInt(formInterval, 10) || 0,
          channels,
          status: editMission.status,
        }),
      });

      if (res.ok) {
        await loadData();
        setView("list");
      } else {
        const data = await res.json();
        alert("Gagal menyimpan: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch("/api/autopost/mission/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        setMissions(prev => prev.map(m =>
          m.id === id ? { ...m, status: data.status } : m
        ));
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus misi ini?")) return;
    try {
      const res = await fetch(`/api/autopost/mission/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMissions(prev => prev.filter(m => m.id !== id));
        if (view === "edit" && editMission?.id === id) setView("list");
      }
    } catch {}
  };

  // ─── Webhook CRUD ────────────────────────────────────────────────

  const handleAddWebhook = async () => {
    if (!whName || !whUrl) return alert("Nama dan URL webhook wajib diisi");
    setWhSaving(true);
    try {
      const res = await fetch("/api/autopost/webhook/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: whName, url: whUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
        setWhName("");
        setWhUrl("");
      } else {
        const data = await res.json();
        alert("Gagal: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setWhSaving(false);
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    if (!confirm("Hapus webhook ini?")) return;
    try {
      const res = await fetch(`/api/autopost/webhook/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWebhooks(prev => prev.filter(w => w.id !== id));
      }
    } catch {}
  };

  // ─── Logs ────────────────────────────────────────────────────────

  const handleViewLogs = async (missionId: string) => {
    setShowLogsFor(missionId);
    setSelectedLogs([]);
    try {
      const res = await fetch(`/api/autopost/logs/${missionId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedLogs(Array.isArray(data) ? data : []);
      }
    } catch {}
    setView("logs");
  };

  // ─── Render ──────────────────────────────────────────────────────

  const filteredMissions = missions.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700"><Zap size={10} /> Aktif</span>;
      case "paused":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"><Pause size={10} /> Jeda</span>;
      case "error":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700"><AlertCircle size={10} /> Error</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  if (loading && missions.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-vw-text tracking-tight">Autopost</h2>
            <p className="text-xs text-vw-muted mt-0.5">Memuat data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-vw-surface border border-vw-border rounded-xl p-5 animate-pulse space-y-3">
              <div className="h-5 bg-vw-border rounded w-3/4" />
              <div className="h-4 bg-vw-border rounded w-1/2" />
              <div className="h-8 bg-vw-border rounded-lg w-full mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-red-700 mb-1">Gagal Memuat Data</h3>
          <p className="text-xs text-red-500">{error}</p>
          <button onClick={loadData}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-all cursor-pointer">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-vw-text tracking-tight flex items-center gap-2">
            <Activity size={18} className="text-vw-accent" />
            Autopost
          </h2>
          <p className="text-xs text-vw-muted mt-0.5">
            {view === "list" && `${missions.length} misi · ${webhooks.length} webhook`}
            {view === "edit" && "Konfigurasi misi"}
            {view === "webhooks" && "Kelola webhook Discord"}
            {view === "logs" && "Riwayat posting"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === "list" && (
            <>
              <button onClick={() => setView("webhooks")}
                className="px-3.5 py-2 rounded-lg border border-vw-border text-xs font-semibold text-vw-text hover:bg-vw-border/30 transition-all cursor-pointer flex items-center gap-1.5">
                <Webhook size={14} /> Webhook
              </button>
              <button onClick={handleCreate}
                className="px-3.5 py-2 rounded-lg bg-vw-accent text-white text-xs font-semibold hover:bg-vw-accent-hover transition-all cursor-pointer flex items-center gap-1.5 shadow-btn active:scale-[0.97]">
                <Plus size={14} /> Misi Baru
              </button>
              <button onClick={loadData}
                className="p-2 rounded-lg border border-vw-border text-vw-muted hover:bg-vw-border/30 transition-all cursor-pointer">
                <RefreshCw size={14} />
              </button>
            </>
          )}
          {(view === "edit" || view === "webhooks" || view === "logs") && (
            <button onClick={() => setView("list")}
              className="px-3.5 py-2 rounded-lg border border-vw-border text-xs font-semibold text-vw-text hover:bg-vw-border/30 transition-all cursor-pointer">
              ← Kembali
            </button>
          )}
        </div>
      </div>

      {/* ── VIEW: MISSION LIST ── */}
      {view === "list" && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-vw-surface border border-vw-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-vw-muted/70">Total Misi</p>
              <p className="text-2xl font-bold text-vw-text mt-1">{missions.length}</p>
            </div>
            <div className="bg-vw-surface border border-vw-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-vw-muted/70">Aktif</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{missions.filter(m => m.status === "running").length}</p>
            </div>
            <div className="bg-vw-surface border border-vw-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-vw-muted/70">Tertunda</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{missions.filter(m => m.status === "paused").length}</p>
            </div>
            <div className="bg-vw-surface border border-vw-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-vw-muted/70">Webhook</p>
              <p className="text-2xl font-bold text-vw-text mt-1">{webhooks.length}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xs">
            <input type="text" placeholder="Cari misi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-vw-border bg-vw-surface text-sm text-vw-text placeholder-vw-muted/60 focus:outline-none focus:ring-2 focus:ring-vw-accent/20 focus:border-vw-accent transition-all" />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vw-muted/50" />
          </div>

          {/* Mission Cards */}
          {filteredMissions.length === 0 ? (
            <div className="text-center py-12 bg-vw-surface border border-vw-border rounded-xl">
              <Zap size={32} className="mx-auto text-vw-muted/30 mb-3" />
              <h3 className="font-bold text-sm text-vw-text">Belum Ada Misi</h3>
              <p className="text-xs text-vw-muted mt-1">Buat misi autopost pertama kamu</p>
              <button onClick={handleCreate}
                className="mt-4 px-4 py-2 bg-vw-accent text-white text-xs font-semibold rounded-lg hover:bg-vw-accent-hover transition-all cursor-pointer shadow-btn active:scale-[0.97]">
                + Buat Misi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 card-stagger">
              {filteredMissions.map(mission => (
                <div key={mission.id}
                  className="group bg-vw-surface border border-vw-border rounded-xl p-5 hover:shadow-lg hover:shadow-vw-accent/5 hover:border-vw-accent/20 transition-all duration-200 hover:-translate-y-0.5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-sm text-vw-text leading-snug line-clamp-1 flex-1">{mission.name}</h3>
                    {statusBadge(mission.status)}
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-[11px] text-vw-muted">
                      <Clock size={12} />
                      <span>{mission.interval_minutes > 0 ? `Setiap ${mission.interval_minutes} menit` : "Manual"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-vw-muted">
                      <Hash size={12} />
                      <span>{mission.channels ? mission.channels.split(",").length : 0} channel</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-vw-muted">
                      <MessageSquare size={12} />
                      <span className="line-clamp-1">{truncate(mission.message || "(kosong)", 30)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-vw-muted">
                      <Activity size={12} />
                      <span>{missionStats[mission.id] || 0} posting</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-vw-muted/60">
                      <Calendar size={10} />
                      <span>{formatDate(mission.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-vw-border/50">
                    <button onClick={() => handleToggle(mission.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        mission.status === "running"
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}>
                      {mission.status === "running" ? <Pause size={12} /> : <Play size={12} />}
                      {mission.status === "running" ? "Jeda" : "Mulai"}
                    </button>
                    <button onClick={() => handleEdit(mission)}
                      className="flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-vw-accent/8 text-vw-accent hover:bg-vw-accent/15 transition-all cursor-pointer gap-1.5">
                      <Edit size={12} /> Edit
                    </button>
                    <button onClick={() => handleViewLogs(mission.id)}
                      className="flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-vw-border/30 text-vw-muted hover:bg-vw-border/50 transition-all cursor-pointer">
                      <FileText size={12} />
                    </button>
                    <button onClick={() => handleDelete(mission.id)}
                      className="flex items-center justify-center p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── VIEW: EDIT MISSION ── */}
      {view === "edit" && editMission && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-vw-surface border border-vw-border rounded-xl p-6 space-y-5">
            <h3 className="font-bold text-sm text-vw-text flex items-center gap-2">
              <Settings size={15} className="text-vw-accent" />
              {showNewMission ? "Buat Misi Baru" : "Edit Misi"}
            </h3>

            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-vw-text mb-1.5">Nama Misi</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-vw-border bg-vw-surface text-sm text-vw-text focus:outline-none focus:ring-2 focus:ring-vw-accent/20 focus:border-vw-accent transition-all"
                placeholder="Nama misi..." />
            </div>

            {/* Pesan */}
            <div>
              <label className="block text-xs font-semibold text-vw-text mb-1.5">Pesan</label>
              <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-vw-border bg-vw-surface text-sm text-vw-text focus:outline-none focus:ring-2 focus:ring-vw-accent/20 focus:border-vw-accent transition-all resize-y"
                placeholder="Pesan yang akan dikirim otomatis..." />
            </div>

            {/* Interval */}
            <div>
              <label className="block text-xs font-semibold text-vw-text mb-1.5">Interval (menit)</label>
              <input type="number" min="0" value={formInterval} onChange={e => setFormInterval(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-vw-border bg-vw-surface text-sm text-vw-text focus:outline-none focus:ring-2 focus:ring-vw-accent/20 focus:border-vw-accent transition-all"
                placeholder="60 = setiap 1 jam, 0 = manual" />
              <p className="text-[10px] text-vw-muted/60 mt-1">Kosongkan atau 0 untuk interval manual (hanya sekali kirim)</p>
            </div>

            {/* Channel IDs */}
            <div>
              <label className="block text-xs font-semibold text-vw-text mb-1.5">Channel IDs</label>
              <textarea value={formChannels} onChange={e => setFormChannels(e.target.value)} rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-vw-border bg-vw-surface text-sm text-vw-text focus:outline-none focus:ring-2 focus:ring-vw-accent/20 focus:border-vw-accent transition-all resize-y"
                placeholder="Masukkan ID channel Discord&#10;Pisahkan dengan baris baru&#10;atau gunakan wh:nama untuk webhook" />
              <p className="text-[10px] text-vw-muted/60 mt-1">
                Satu ID per baris. Untuk webhook: <code className="bg-vw-border/50 px-1 rounded">wh:nama_webhook</code>
              </p>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={formSaving}
                className="px-5 py-2.5 rounded-lg bg-vw-accent text-white text-xs font-semibold hover:bg-vw-accent-hover transition-all cursor-pointer disabled:opacity-50 shadow-btn active:scale-[0.97] flex items-center gap-2">
                {formSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {formSaving ? "Menyimpan..." : "Simpan Misi"}
              </button>
              <button onClick={() => setView("list")}
                className="px-5 py-2.5 rounded-lg border border-vw-border text-xs font-semibold text-vw-text hover:bg-vw-border/30 transition-all cursor-pointer">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW: WEBHOOKS ── */}
      {view === "webhooks" && (
        <div className="max-w-2xl space-y-6">
          {/* Add Webhook */}
          <div className="bg-vw-surface border border-vw-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-vw-text flex items-center gap-2">
              <Webhook size={15} className="text-vw-accent" />
              Tambah Webhook
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" value={whName} onChange={e => setWhName(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-vw-border bg-vw-surface text-sm text-vw-text focus:outline-none focus:ring-2 focus:ring-vw-accent/20 focus:border-vw-accent transition-all"
                placeholder="Nama (contoh: promo-channel)" />
              <input type="url" value={whUrl} onChange={e => setWhUrl(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-vw-border bg-vw-surface text-sm text-vw-text focus:outline-none focus:ring-2 focus:ring-vw-accent/20 focus:border-vw-accent transition-all"
                placeholder="https://discord.com/api/webhooks/..." />
            </div>
            <button onClick={handleAddWebhook} disabled={whSaving}
              className="px-4 py-2 rounded-lg bg-vw-accent text-white text-xs font-semibold hover:bg-vw-accent-hover transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-btn active:scale-[0.97]">
              {whSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {whSaving ? "Menyimpan..." : "Tambah Webhook"}
            </button>
          </div>

          {/* Webhook List */}
          <div className="bg-vw-surface border border-vw-border rounded-xl p-6">
            <h3 className="font-bold text-sm text-vw-text mb-4">Daftar Webhook ({webhooks.length})</h3>
            {webhooks.length === 0 ? (
              <p className="text-xs text-vw-muted text-center py-6">Belum ada webhook terdaftar</p>
            ) : (
              <div className="space-y-2">
                {webhooks.map(wh => (
                  <div key={wh.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-vw-border/60 hover:bg-vw-border/20 transition-all group/webhook">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-vw-accent/8 flex items-center justify-center shrink-0">
                        <Link size={14} className="text-vw-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-vw-text">{wh.name}</p>
                        <p className="text-[10px] text-vw-muted/70 truncate max-w-[300px]">{wh.url}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteWebhook(wh.id)}
                      className="p-1.5 rounded-lg text-red-400 opacity-0 group-hover/webhook:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW: LOGS ── */}
      {view === "logs" && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-vw-surface border border-vw-border rounded-xl p-6">
            <h3 className="font-bold text-sm text-vw-text mb-4 flex items-center gap-2">
              <FileText size={14} className="text-vw-accent" />
              Riwayat Posting
              {showLogsFor && <span className="text-[10px] text-vw-muted font-normal">— {showLogsFor}</span>}
            </h3>
            {selectedLogs.length === 0 ? (
              <p className="text-xs text-vw-muted text-center py-6">Belum ada riwayat posting</p>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {selectedLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-vw-border/20 transition-all text-xs">
                    {log.status === "success" ? (
                      <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    ) : log.status === "rate_limited" ? (
                      <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-vw-text">
                        {log.status === "success" ? "Berhasil" : log.status === "rate_limited" ? "Rate Limited" : "Gagal"}
                        <span className="text-vw-muted/60 ml-2 font-normal">• {log.channel_id}</span>
                      </p>
                      <p className="text-[10px] text-vw-muted/70 mt-0.5">{log.details}</p>
                      <p className="text-[9px] text-vw-muted/40 mt-0.5">{timeAgo(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
