import { useState } from "react";
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";
import api from "../api.js";

export default function LockScreen({ onAuthed }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Tampilkan pesan kalau datang dari redirect SSO yang gagal (?sso_error=...)
  const ssoError = new URLSearchParams(window.location.search).get("sso_error");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth", { pin });
      onAuthed();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* ambient */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-vw-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-vw-accent text-white flex items-center justify-center mx-auto mb-4 shadow-btn">
            <span className="text-2xl font-extrabold">⚡</span>
          </div>
          <h1 className="text-xl font-bold text-vw-text tracking-tight">Vitalwounds Autopost</h1>
          <p className="text-sm text-vw-muted mt-1">Masukkan PIN untuk mengakses dashboard</p>
        </div>

        <form onSubmit={submit} className="bg-vw-surface border border-vw-border rounded-2xl p-6 shadow-elevated animate-fade-in-scale">
          {(ssoError || error) && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {ssoError || error}
            </p>
          )}
          <label className="flex items-center gap-2 text-xs font-semibold text-vw-text mb-2">
            <KeyRound size={14} className="text-vw-accent" /> PIN Akses
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••••"
            autoFocus
            className="input-field mb-4 tracking-[0.3em]"
          />
          <button type="submit" disabled={loading || !pin}
            className="btn-primary w-full disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-[10px] text-vw-muted/60 mt-6">
          Project privat — PIN diatur lewat env <code className="bg-vw-border/50 px-1 rounded">AUTOPOST_PIN</code>
        </p>
      </div>
    </div>
  );
}
