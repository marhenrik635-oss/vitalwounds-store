import { Menu, Wallet, ChevronRight, LogOut, Moon, Sun, Globe } from "lucide-react";
import { UserProfile } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslate } from "../i18n/LanguageContext";

interface HeaderProps {
  userProfile: UserProfile;
  activeTab: string;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onTabChange: (tab: string) => void;
}

const getTitle = (tab: string, t: any): string => ({
  dashboard: t("dashboard.title"),
  profile: t("nav.profile"),
  deposit: t("nav.deposit"),
  "riwayat-deposit": t("nav.riwayat-deposit"),
  "riwayat-order": t("nav.riwayat-order"),
  "layanan/app-premium": t("nav.app-premium"),
  contact: t("nav.contact"),
  admin: t("nav.admin"),
})[tab] || "Store";

export default function Header({ userProfile, activeTab, onToggleSidebar, onLogout, onTabChange }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang } = useTranslate();

  return (
    <header className="sticky top-0 z-30 bg-vw-surface border-b border-vw-border/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl hover:bg-vw-border/40 text-vw-muted transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-sm font-bold text-vw-text tracking-tight">{getTitle(activeTab, t)}</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-vw-muted/70 mt-0.5">
              <span>{t("nav.home")}</span>
              <ChevronRight size={9} />
              <span className="text-vw-text/80 font-medium">{getTitle(activeTab, t)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            className="p-2 rounded-xl text-vw-muted/60 hover:text-vw-accent hover:bg-vw-accent/8 transition-colors cursor-pointer"
            title={t("header.language")}
          >
            <Globe size={15} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-vw-muted/60 hover:text-vw-accent hover:bg-vw-accent/8 transition-colors cursor-pointer"
            title={theme === "light" ? t("header.theme.dark") : t("header.theme.light")}
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button 
            onClick={() => onTabChange("deposit")}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-vw-accent/8 text-vw-accent text-xs font-semibold transition-colors hover:bg-vw-accent/15 cursor-pointer"
          >
            <Wallet size={14} />
            <span className="font-bold">Rp {userProfile.balance.toLocaleString("id-ID")}</span>
          </button>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-vw-border/30">
            <div className="w-7 h-7 rounded-lg bg-vw-accent/10 flex items-center justify-center text-[11px] font-bold text-vw-accent">
              {userProfile.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="hidden sm:block text-xs font-medium text-vw-text">{userProfile.username}</span>
          </div>

          <button 
            onClick={onLogout}
            className="p-2 rounded-xl text-vw-muted/60 hover:text-vw-danger hover:bg-vw-danger/5 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
