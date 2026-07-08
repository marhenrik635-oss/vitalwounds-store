import { useState, useEffect } from "react";
import { User, Mail, Phone, Save, CheckCircle, Sparkles } from "lucide-react";
import { UserProfile } from "../types";
import { useT } from "../i18n/LanguageContext";

interface TabProfileProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile> & { password?: string }) => void;
}

export default function TabProfile({ userProfile, onUpdateProfile }: TabProfileProps) {
  const t = useT();
  const [username, setUsername] = useState(userProfile?.username || "");
  const [email, setEmail] = useState(userProfile?.email || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || "");
      setEmail(userProfile.email || "");
      setPhone(userProfile.phone || "");
    }
  }, [userProfile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      alert("Password tidak cocok!");
      return;
    }
    onUpdateProfile({ username, email, phone, ...(password && { password }) });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Avatar Card */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-vw-border/60 bg-white p-6 h-full">
            <div className="flex flex-col items-center justify-center py-12 h-full">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-vw-accent/10 to-vw-accent/20 flex items-center justify-center mb-5">
                <User size={44} className="text-vw-accent/60" />
              </div>
              <h3 className="text-lg font-bold text-vw-text tracking-tight">{userProfile?.username || "Belum diisi"}</h3>
              <p className="text-xs text-vw-muted/70 mt-1">{userProfile?.email || userProfile?.phone || "-"}</p>
              <div className="mt-5 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-vw-accent/8 text-vw-accent text-[10px] font-semibold">
                <Sparkles size={11} />
                {userProfile?.tier || "Regular"}
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-vw-border/60 bg-white p-6">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-vw-border/50">
              <User size={16} className="text-vw-accent" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-vw-muted/70">Informasi Pribadi</span>
            </div>

            {isSaved && (
              <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                <CheckCircle size={15} /> Profil berhasil diperbarui!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-semibold uppercase tracking-[0.12em] text-vw-muted/70 block mb-1.5">Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-vw-border/60 bg-white text-sm text-vw-text placeholder-vw-muted/50 focus:outline-none focus:border-vw-accent/40 focus:ring-2 focus:ring-vw-accent/8" 
                    placeholder="Username" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase tracking-[0.12em] text-vw-muted/70 block mb-1.5">Telepon</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-vw-border/60 bg-white text-sm text-vw-text placeholder-vw-muted/50 focus:outline-none focus:border-vw-accent/40 focus:ring-2 focus:ring-vw-accent/8" 
                    placeholder="08xxxxxxxxxx" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-semibold uppercase tracking-[0.12em] text-vw-muted/70 block mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-vw-border/60 bg-white text-sm text-vw-text placeholder-vw-muted/50 focus:outline-none focus:border-vw-accent/40 focus:ring-2 focus:ring-vw-accent/8" 
                    placeholder="email@anda.com" />
                </div>
              </div>

              <div className="pt-5 border-t border-vw-border/50">
                <h4 className="text-[9px] font-semibold uppercase tracking-[0.12em] text-vw-muted/70 mb-4">Ubah Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-semibold uppercase tracking-[0.12em] text-vw-muted/70 block mb-1.5">Password Baru</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-vw-border/60 bg-white text-sm focus:outline-none focus:border-vw-accent/40 focus:ring-2 focus:ring-vw-accent/8" 
                      placeholder="Min 6 karakter" />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold uppercase tracking-[0.12em] text-vw-muted/70 block mb-1.5">Konfirmasi Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-vw-border/60 bg-white text-sm focus:outline-none focus:border-vw-accent/40 focus:ring-2 focus:ring-vw-accent/8" 
                      placeholder="Ulangi password" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vw-accent text-white text-xs font-semibold cursor-pointer hover:bg-vw-accent-hover transition-colors">
                  <Save size={14} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
