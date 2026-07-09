import { X, ChevronRight, LayoutDashboard, User, Wallet, History, ShoppingBag, Gem, MessageSquare, Mail, Shield } from "lucide-react";
import { UserProfile } from "../types";
import { useT } from "../i18n/LanguageContext";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isAdmin?: boolean;
  userProfile: UserProfile;
}

export default function Sidebar({ activeTab, onTabChange, isOpen, onToggle, isAdmin, userProfile }: SidebarProps) {
  const t = useT();

  const menuGroups = [
    { title: t("nav.utama"), items: [
      { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      { id: "profile", label: t("nav.profile"), icon: User },
      { id: "deposit", label: t("nav.deposit"), icon: Wallet },
      { id: "riwayat-deposit", label: t("nav.riwayat-deposit"), icon: History },
      { id: "riwayat-order", label: t("nav.riwayat-order"), icon: ShoppingBag },
    ]},
    { title: t("nav.layanan"), items: [
      { id: "layanan/app-premium", label: t("nav.app-premium"), icon: Gem },
    ]},
    { title: t("nav.lainnya"), items: [
      { id: "contact", label: t("nav.contact"), icon: Mail },
    ]},
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/15 z-40 lg:hidden" onClick={onToggle} />
      )}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 z-50 lg:translate-x-0 flex flex-col bg-vw-surface border-r border-vw-border/60 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-5 h-16 flex items-center gap-3 border-b border-vw-border/50">
          <img src="/logo.png" alt="Vitalwounds" className="w-8 h-8 rounded-xl object-contain bg-white" />
          <div>
            <span className="font-bold text-vw-text text-sm leading-tight block">Vitalwounds</span>
            <span className="text-[9px] tracking-[0.15em] text-vw-muted uppercase font-medium">Store Panel</span>
          </div>
          <button onClick={onToggle} className="lg:hidden ml-auto p-1.5 rounded-lg text-vw-muted hover:text-vw-text hover:bg-vw-border/50 transition-all cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {userProfile.username === "admin" ? (
            <div>
              <p className="px-3 mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-vw-accent">Admin</p>
              <div className="space-y-0.5">
                <button onClick={() => { onTabChange("admin"); if (window.innerWidth < 1024) onToggle(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                    activeTab === "admin" 
                      ? "bg-vw-accent/10 text-vw-accent font-semibold" 
                      : "text-vw-muted hover:bg-vw-border/30 hover:text-vw-text"
                  }`}>
                  <Shield size={17} strokeWidth={activeTab === "admin" ? 2.5 : 1.5} />
                  <span>Admin Panel</span>
                  {activeTab === "admin" && <ChevronRight size={12} className="ml-auto text-vw-accent/60" />}
                </button>
              </div>
            </div>
          ) : (
            <>
              {menuGroups.map((g, gi) => (
                <div key={gi}>
                  <p className="px-3 mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-vw-muted/70">{g.title}</p>
                  <div className="space-y-0.5">
                    {g.items.map(item => {
                      const active = activeTab === item.id;
                      const Icon = item.icon;
                      return (
                        <button key={item.id} onClick={() => { onTabChange(item.id); if (window.innerWidth < 1024) onToggle(); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                            active 
                              ? "bg-vw-accent/10 text-vw-accent font-semibold" 
                              : "text-vw-muted hover:bg-vw-border/30 hover:text-vw-text"
                          }`}>
                          <Icon size={17} strokeWidth={active ? 2.5 : 1.5} />
                          <span>{item.label}</span>
                          {active && <ChevronRight size={12} className="ml-auto text-vw-accent/60" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </nav>

        <div className="px-5 py-4 border-t border-vw-border/50">
          <span className="block text-[9px] text-vw-muted/50 font-medium tracking-[0.1em] text-center">v1.4.0</span>
        </div>
      </aside>
    </>
  );
}
