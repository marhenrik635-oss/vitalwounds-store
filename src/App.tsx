import { useState, useEffect, lazy, Suspense, Component, ReactNode } from "react";
import {
  LogIn,
  UserPlus,
} from "lucide-react";

// Import types & initial data
import { UserProfile, Deposit, Order } from "./types";
import { 
  initialUserProfile, 
  initialDeposits, 
  initialOrders, 
  appProducts
} from "./initialData";

// Import modular components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";

const TabDashboard = lazy(() => import("./components/TabDashboard"));
const TabProfile = lazy(() => import("./components/TabProfile"));
const TabDeposit = lazy(() => import("./components/TabDeposit"));
const TabRiwayatDeposit = lazy(() => import("./components/TabRiwayatDeposit"));
const TabRiwayatOrder = lazy(() => import("./components/TabRiwayatOrder"));
const TabAppPremium = lazy(() => import("./components/TabAppPremium"));
const TosPage = lazy(() => import("./components/TosPage"));

const TabContact = lazy(() => import("./components/TabContact"));
const TabAdmin = lazy(() => import("./components/TabAdmin"));

class ErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Minimal helpers for Error boundary
function FallbackErrorUI() { return <div className="p-8 text-center text-vw-muted">Error saat memuat dashboard.</div>; }

export default function App() {
  // Navigation Router state
  const [screenView, setScreenView] = useState<"landing" | "auth" | "dashboard-panel">("landing");
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => { var r = localStorage.getItem("vw_role"); return r === "admin" || r === "owner"; });

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("vw_is_logged_in") === "true";
  });
  const [currentUsername, setCurrentUsername] = useState<string>(() => {
    return localStorage.getItem("vw_current_user") || "";
  });

  // Core Store States
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [deposits, setDeposits] = useState<Deposit[]>(initialDeposits);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Load user-specific data
  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          const u = data.user;
          setIsLoggedIn(true);
          localStorage.setItem("vw_is_logged_in", "true");
          setCurrentUsername(u.given_name || u.email);
          localStorage.setItem("vw_current_user", u.given_name || u.email);
          
          // Sync user to local database
          fetch("/api/auth/sync", { method: "POST" })
            .then(res => res.json())
            .then(syncData => {
              if (syncData.user) {
                const matched = syncData.user;
                const role = matched.role || "member";
                setIsAdmin(role === "admin" || role === "owner");
                localStorage.setItem("vw_role", role);
                setUserProfile({
                  username: matched.username,
                  email: matched.email || u.email || "",
                  phone: matched.phone || "",
                  balance: matched.balance || 0,
                  tier: matched.tier || "Regular",
                  role: role,
                  apiKey: "vt_live_" + matched.username
                });
              } else {
                setUserProfile({
                  username: u.given_name || u.email,
                  email: u.email || "",
                  phone: "",
                  balance: 0,
                  tier: "Regular",
                  role: "member",
                  apiKey: "vt_live_" + (u.given_name || u.email)
                });
              }
            })
            .catch(() => {
              // Fallback if sync fails
              setUserProfile({
                username: u.given_name || u.email,
                email: u.email || "",
                phone: "",
                balance: 0,
                tier: "Regular",
                role: "member",
                apiKey: "vt_live_" + (u.given_name || u.email)
              });
            });
        } else {
          setIsLoggedIn(false);
          localStorage.setItem("vw_is_logged_in", "false");
          setCurrentUsername("");
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        localStorage.setItem("vw_is_logged_in", "false");
      });
  }, []);

  // Sync profile to localStorage
  useEffect(() => {
    if (isLoggedIn && currentUsername) {
      const accountsStr = localStorage.getItem("vw_accounts");
      if (accountsStr) {
        const accounts = JSON.parse(accountsStr);
        const updatedAccounts = accounts.map((a: any) => {
          if (a.username.toLowerCase() === currentUsername.toLowerCase()) {
            return {
              ...a,
              username: userProfile.username,
              email: userProfile.email,
              phone: userProfile.phone,
              balance: userProfile.balance,
              tier: userProfile.tier,
              apiKey: userProfile.apiKey
            };
          }
          return a;
        });
        localStorage.setItem("vw_accounts", JSON.stringify(updatedAccounts));
      }
    }
  }, [userProfile, isLoggedIn, currentUsername]);

  // Sync deposits/orders/tickets
  useEffect(() => {
    if (isLoggedIn && currentUsername) {
      localStorage.setItem(`vw_deposits_${currentUsername}`, JSON.stringify(deposits));
    }
  }, [deposits, isLoggedIn, currentUsername]);

  useEffect(() => {
    if (isLoggedIn && currentUsername && orders.length > 0) {
      orders.forEach(o => {
        fetch('/api/orders/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: o.id, username: currentUsername, serviceType: o.serviceType,
            productName: o.productName, target: o.target, quantity: o.quantity,
            price: o.price, status: o.status, date: o.date, details: o.details || ''
          })
        }).catch(() => {});
      });
    }
  }, [orders.length, isLoggedIn, currentUsername]);

  useEffect(() => {
    if (isLoggedIn && currentUsername) {
      localStorage.setItem(`vw_orders_${currentUsername}`, JSON.stringify(orders));
    }
  }, [orders, isLoggedIn, currentUsername]);
  useEffect(() => {
    const parseUrlRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const route = hash ? hash.replace("#", "") : path;
      const params = new URLSearchParams(window.location.search);

      if (params.get("mode") === "reset-password") {
        // Redirect to auth provider for password reset
        window.location.href = "/api/auth/login";
      } else if (route === "/" || route === "/index.html" || route === "") {
        setScreenView("landing");
      } else if (route === "/auth" || route === "auth") {
        setScreenView("auth");
      } else if (route === "/contact" || route === "contact") {
        setScreenView("dashboard-panel");
        setActiveTab("contact");
      } else if (route === "/tos") {
        setScreenView("tos");
      } else if (route === "/dashboard" || route.startsWith("/")) {
        const loggedIn = localStorage.getItem("vw_is_logged_in") === "true";
        if (!loggedIn) {
          setScreenView("auth");
        } else {
          setScreenView("dashboard-panel");
          const validTabs = ["dashboard", "profile", "deposit", "riwayat-deposit", "riwayat-order", "layanan/app-premium", "contact", "admin"];
                    const tabKey = route.replace(/^\/|\/$/g, "");
                    setActiveTab(validTabs.includes(tabKey) ? tabKey : "dashboard");
                  }
                } else if (route.startsWith("/api/auth/kinde_callback")) {
                  // Handle OAuth callback on client-side routing
                  window.location.href = route;
                } else {
        const loggedIn = localStorage.getItem("vw_is_logged_in") === "true";
        setScreenView(loggedIn ? "dashboard-panel" : "auth");
      }
    };
    
    parseUrlRoute();
    window.addEventListener("popstate", parseUrlRoute);
    return () => window.removeEventListener("popstate", parseUrlRoute);
  }, [isLoggedIn]);

  const navigateTo = (view: "landing" | "auth" | "dashboard-panel", tabId: string = "dashboard", forceDashboard: boolean = false) => {
    let targetView = view;
    if (view === "dashboard-panel" && !isLoggedIn && !forceDashboard) {
      targetView = "auth";
    }

    setIsLoading(true);

    setTimeout(() => {
      setScreenView(targetView);
      setActiveTab(tabId);
      setMobileSidebarOpen(false);

      const targetPath = targetView === "landing" ? "/" : (targetView === "auth" ? "/auth" : `/${tabId}`);
      
      try {
        window.history.pushState(null, "", targetPath);
      } catch (e) {
        window.location.hash = targetView === "landing" ? "/" : (targetView === "auth" ? "/auth" : `/${tabId}`);
      }

      setIsLoading(false);
    }, 200);
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updated }));
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };





  const handleUpdateBalance = (amount: number) => {
    setUserProfile(prev => ({ ...prev, balance: prev.balance + amount }));
  };

  const handleDeductBalance = (amount: number) => {
    setUserProfile(prev => ({ ...prev, balance: Math.max(0, prev.balance - amount) }));
  };

  const handleAddDeposit = (newDep: Deposit) => {
    setDeposits(prev => [newDep, ...prev]);
  };

  const handleAddOrder = (newOrd: Order) => {
    setOrders(prev => [newOrd, ...prev]);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="min-h-screen flex flex-col bg-vw-bg text-vw-text antialiased relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-vw-bg/90">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-vw-accent" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-medium text-vw-muted">Loading...</span>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 1: LANDING PAGE
          ========================================== */}
      {screenView === "landing" && (
        <LandingPage navigateTo={navigateTo} isLoggedIn={isLoggedIn} />
      )}

      {screenView === "tos" && (
        <TosPage />
      )}

      {/* ==========================================
          VIEW 2: AUTH PAGE — Split Screen
          ========================================== */}
      {screenView === "auth" && (
        <div className="flex-1 min-h-screen flex flex-col md:flex-row relative">
          {/* ===== LEFT: ILLUSTRATION PANEL ===== */}
          <div className="hidden md:flex md:w-[55%] lg:w-[58%] relative overflow-hidden bg-gradient-to-br from-[#1A1A3E] via-[#1E2A5A] to-[#0F1A3E] items-center justify-center">
            {/* Decorative gradient orbs */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] aspect-square rounded-full bg-[#3B82F6]/10 blur-[80px]" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[50%] aspect-square rounded-full bg-[#6366F1]/8 blur-[60px]" />
            <div className="absolute top-[30%] left-[20%] w-[30%] aspect-square rounded-full bg-[#3B82F6]/5 blur-[100px]" />

            {/* Brand watermark */}
            <div className="absolute top-8 left-8 z-10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <img src="/logo.png" alt="Vitalwounds" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-white/70 text-xs font-medium tracking-wide">Vitalwounds</span>
            </div>

            {/* SVG Illustration */}
            <div className="relative z-10 w-full max-w-lg px-8 animate-fade-in">
              <svg viewBox="0 0 520 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                {/* Grid dots */}
                {Array.from({length: 8}, (_, i) => (
                  Array.from({length: 8}, (_, j) => (
                    <circle key={`dot-${i}-${j}`} cx={40 + i * 60} cy={30 + j * 55} r="1.5" fill="rgba(255,255,255,0.12)" />
                  ))
                ))}

                {/* Large central orb */}
                <circle cx="260" cy="240" r="120" fill="url(#orbGrad1)" opacity="0.2" />
                <circle cx="260" cy="240" r="85" fill="url(#orbGrad2)" opacity="0.3" />
                <circle cx="260" cy="240" r="50" fill="url(#orbGrad3)" />

                {/* Outer ring */}
                <circle cx="260" cy="240" r="140" stroke="rgba(59,130,246,0.15)" strokeWidth="1" strokeDasharray="6 6" fill="none" />
                <circle cx="260" cy="240" r="170" stroke="rgba(59,130,246,0.08)" strokeWidth="1" strokeDasharray="3 8" fill="none" />

                {/* Connection lines */}
                <g stroke="rgba(59,130,246,0.2)" strokeWidth="1.5">
                  <line x1="260" y1="240" x2="120" y2="160" />
                  <line x1="260" y1="240" x2="400" y2="160" />
                  <line x1="260" y1="240" x2="130" y2="340" />
                  <line x1="260" y1="240" x2="390" y2="340" />
                  <line x1="260" y1="240" x2="80" y2="250" />
                  <line x1="260" y1="240" x2="440" y2="230" />
                </g>

                {/* Node dots */}
                <circle cx="120" cy="160" r="8" fill="rgba(96,165,250,0.5)" />
                <circle cx="400" cy="160" r="8" fill="rgba(96,165,250,0.5)" />
                <circle cx="130" cy="340" r="6" fill="rgba(96,165,250,0.4)" />
                <circle cx="390" cy="340" r="6" fill="rgba(96,165,250,0.4)" />
                <circle cx="80" cy="250" r="5" fill="rgba(96,165,250,0.3)" />
                <circle cx="440" cy="230" r="5" fill="rgba(96,165,250,0.3)" />

                {/* Abstract cards/shapes */}
                <g>
                  {/* Card 1 */}
                  <rect x="80" y="80" width="28" height="20" rx="4" fill="rgba(59,130,246,0.2)" />
                  <rect x="80" y="80" width="28" height="20" rx="4" stroke="rgba(59,130,246,0.3)" strokeWidth="1" fill="none" />
                  <rect x="84" y="85" width="8" height="4" rx="1" fill="rgba(96,165,250,0.4)" />
                  <rect x="84" y="92" width="16" height="3" rx="1" fill="rgba(96,165,250,0.2)" />

                  {/* Card 2 */}
                  <rect x="410" y="380" width="24" height="18" rx="4" fill="rgba(99,102,241,0.15)" />
                  <rect x="410" y="380" width="24" height="18" rx="4" stroke="rgba(99,102,241,0.2)" strokeWidth="1" fill="none" />
                  <rect x="414" y="384" width="6" height="4" rx="1" fill="rgba(129,140,248,0.3)" />

                  {/* Card 3 */}
                  <rect x="85" y="380" width="20" height="16" rx="3" fill="rgba(59,130,246,0.1)" />
                  <rect x="85" y="380" width="20" height="16" rx="3" stroke="rgba(59,130,246,0.15)" strokeWidth="1" fill="none" />
                </g>

                {/* Floating dots */}
                <circle cx="50" cy="140" r="2" fill="rgba(96,165,250,0.5)" />
                <circle cx="470" cy="120" r="2.5" fill="rgba(129,140,248,0.4)" />
                <circle cx="100" cy="430" r="2" fill="rgba(96,165,250,0.35)" />
                <circle cx="460" cy="300" r="1.5" fill="rgba(96,165,250,0.4)" />
                <circle cx="420" cy="70" r="1.5" fill="rgba(129,140,248,0.3)" />

                {/* Shield/security abstract */}
                <g transform="translate(220, 385)" opacity="0.25">
                  <path d="M0 0 L20 0 L20 10 Q20 25 10 30 Q0 25 0 10 Z" stroke="rgba(96,165,250,0.5)" strokeWidth="1" fill="none" />
                  <line x1="10" y1="8" x2="10" y2="18" stroke="rgba(96,165,250,0.5)" strokeWidth="1" />
                  <line x1="6" y1="14" x2="10" y2="18" stroke="rgba(96,165,250,0.5)" strokeWidth="1" />
                </g>

                {/* Central icon abstract — star/hexagon */}
                <g transform="translate(240, 220)" opacity="0.4">
                  <polygon points="20,0 37,11 37,30 20,41 3,30 3,11" fill="none" stroke="rgba(96,165,250,0.6)" strokeWidth="1.5" />
                  <polygon points="20,5 32,13 32,28 20,36 8,28 8,13" fill="none" stroke="rgba(96,165,250,0.3)" strokeWidth="1" />
                </g>

                {/* Bottom curve accent */}
                <path d="M0 470 Q130 420 260 450 Q390 480 520 440 L520 480 L0 480 Z" fill="rgba(59,130,246,0.06)" />

                {/* Gradients */}
                <defs>
                  <radialGradient id="orbGrad1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="orbGrad2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="orbGrad3" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.15" />
                    <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Tagline overlay */}
              <div className="text-center mt-2">
                <p className="text-white/50 text-[10px] font-medium tracking-[0.2em] uppercase">Digital Premium Services</p>
              </div>
            </div>
          </div>

          {/* ===== RIGHT: AUTH FORM PANEL ===== */}
          <div className="flex-1 md:w-[45%] lg:w-[42%] bg-white dark:bg-[#121212] flex flex-col relative overflow-y-auto">
            {/* Top nav */}
            <div className="flex items-center justify-between px-6 py-5">
              <button
                onClick={() => navigateTo("landing")}
                className="text-xs font-medium text-vw-muted hover:text-vw-text transition-colors duration-200 cursor-pointer"
              >
                <span className="hidden sm:inline">← Beranda</span>
                <span className="sm:hidden">←</span>
              </button>
              <span className="md:hidden text-[10px] font-medium text-vw-muted/50">Vitalwounds Store</span>
            </div>

            {/* Center form */}
            <div className="flex-1 flex items-center justify-center px-8 py-4">
              <div className="w-full max-w-[320px]">
                {/* Logo */}
                <div className="hero-enter">
                  <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-vw-accent to-[#1D4ED8] shadow-elevated flex items-center justify-center overflow-hidden mb-5">
                    <img src="/logo.png" alt="Vitalwounds" className="w-7 h-7 object-contain brightness-0 invert" />
                  </div>
                </div>

                {/* Heading */}
                <h1 className="hero-enter hero-enter-d1 text-xl font-bold text-vw-text tracking-[-0.02em]">
                  Selamat datang
                </h1>
                <p className="hero-enter hero-enter-d2 mt-1 text-[13px] text-vw-muted leading-relaxed">
                  Masuk atau buat akun untuk melanjutkan
                </p>

                {/* Buttons */}
                <div className="hero-enter hero-enter-d3 mt-8 w-full flex flex-col gap-3">
                  <a
                    href="/api/auth/login"
                    className="w-full bg-vw-accent hover:bg-vw-accent-hover text-white text-sm font-semibold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-btn hover:shadow-btn-hover active:scale-[0.98]"
                  >
                    <LogIn size={15} />
                    <span>Masuk</span>
                  </a>

                  <a
                    href="/api/auth/register"
                    className="w-full bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-vw-text text-sm font-medium py-2.5 px-5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer border border-vw-border active:scale-[0.98]"
                  >
                    <UserPlus size={15} className="text-vw-muted" />
                    <span>Buat Akun</span>
                  </a>
                </div>

                {/* Separator */}
                <div className="hero-enter hero-enter-d4 mt-8 flex items-center gap-3">
                  <div className="flex-1 h-px bg-vw-border/60" />
                  <span className="text-[10px] font-medium text-vw-muted/40 uppercase tracking-[0.1em]">Aman & Terpercaya</span>
                  <div className="flex-1 h-px bg-vw-border/60" />
                </div>

                <p className="hero-enter hero-enter-d4 mt-3 text-[10px] text-vw-muted/40 text-center leading-relaxed">
                  Data Anda aman dengan enkripsi end-to-end
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pb-5 text-center">
              <p className="text-[10px] text-vw-muted/30 font-medium">
                Vitalwounds Store &mdash; 2026
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 3: DASHBOARD PANEL
          ========================================== */}
      {screenView === "dashboard-panel" && (
        <Suspense fallback={
          <div className="min-h-screen bg-vw-bg p-6 space-y-6">
            <div className="h-16 bg-white rounded-xl border border-vw-border"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-40 bg-white rounded-xl border border-vw-border col-span-2"></div>
              <div className="h-40 bg-white rounded-xl border border-vw-border"></div>
            </div>
          </div>
        }>
          <div className="flex-1 flex min-h-screen relative">
            {/* Sidebar drawer component */}
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tabId) => navigateTo("dashboard-panel", tabId)}
              isOpen={mobileSidebarOpen}
              onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              isAdmin={isAdmin}
              userProfile={userProfile}
            />

            {/* Core Content frame */}
            <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
              {/* Nav Header block */}
              <Header
                userProfile={userProfile}
                activeTab={activeTab}
                onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                onLogout={handleLogout}
                onTabChange={(tabId) => navigateTo("dashboard-panel", tabId)}
              />

              {/* Scrollable Main viewport */}
              <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20">
                <div className="max-w-7xl mx-auto">
                  {!userProfile.username ? (
                    <div className="p-6 space-y-6 animate-pulse">
                      <div className="h-16 bg-white rounded-xl border border-gray-100"></div>
                      <div className="h-64 bg-white rounded-xl border border-gray-100"></div>
                    </div>
                  ) : (
                    <>
                  {activeTab === "dashboard" && (
                    <ErrorBoundary fallback={<FallbackErrorUI />}>
                      <Suspense fallback={<div className="p-6"><div className="h-16 bg-white rounded-xl"></div></div>}>
                        <TabDashboard
                          userProfile={userProfile}
                          orders={orders}
                          deposits={deposits}
                          onTabChange={(tabId) => navigateTo("dashboard-panel", tabId)}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                      {activeTab === "profile" && (
                        <TabProfile userProfile={userProfile} onUpdateProfile={handleUpdateProfile} />
                      )}
                      {activeTab === "deposit" && (
                        <TabDeposit userProfile={userProfile} onAddDeposit={handleAddDeposit} onUpdateBalance={handleUpdateBalance} />
                      )}
                      {activeTab === "riwayat-deposit" && (
                        <TabRiwayatDeposit deposits={deposits} />
                      )}
                      {activeTab === "riwayat-order" && (
                        <TabRiwayatOrder orders={orders} />
                      )}
                      {activeTab === "layanan/app-premium" && (
                        <TabAppPremium userProfile={userProfile} products={appProducts} onDeductBalance={handleDeductBalance} onAddOrder={handleAddOrder} onTabChange={(tabId) => navigateTo("dashboard-panel", tabId)} />
                      )}
                      {activeTab === "contact" && (
                        <TabContact />
                      )}
                      {activeTab === "admin" && isAdmin && (
                        <ErrorBoundary fallback={<FallbackErrorUI />}>
                          <Suspense fallback={<div className="p-6"><div className="h-16 bg-white rounded-xl"></div></div>}>
                            <TabAdmin userProfile={userProfile} />
                          </Suspense>
                        </ErrorBoundary>
                      )}
                    </>
                  )}
                </div>
              </main>
            </div>
          </div>
        </Suspense>
      )}
    </div>
  );
}
