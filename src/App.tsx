import { useState, useEffect, lazy, Suspense, Component, ReactNode } from "react";
import {
  LogIn,
  UserPlus,
  ArrowLeft,
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
          
          fetch(`/api/users/${u.given_name || u.email}`)
            .then(res => res.json())
            .then(matched => {
              if (matched && !matched.error) {
                const role = matched.role || "member";
                setIsAdmin(matched.username === "admin" || role === "admin" || role === "owner");
                localStorage.setItem("vw_role", role);
                setUserProfile({
                  username: matched.username,
                  email: matched.email || u.email || "",
                  phone: matched.phone || "",
                  balance: matched.balance || 0,
                  tier: matched.tier || "Regular",
                  role: role,
                  apiKey: matched.apiKey || "vt_live_" + matched.username
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
        // Kinde handles password reset directly
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
          VIEW 2: AUTH PAGE — Kinde OAuth
          ========================================== */}
      {screenView === "auth" && (
        <div className="flex-1 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={() => navigateTo("landing")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-vw-muted hover:text-vw-text transition-colors px-4 py-2 cursor-pointer"
            >
              <ArrowLeft size={14} /> Kembali ke Beranda
            </button>
          </div>

          <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="Vitalwounds Store" className="w-14 h-14 rounded-2xl object-contain bg-white shadow-lg" />
            </div>
            <h2 className="text-center text-2xl font-bold text-vw-text tracking-tight">
              Vitalwounds <span className="text-vw-accent">Store</span>
            </h2>
            <p className="mt-1.5 text-center text-xs text-vw-muted font-medium">
              Wajib memiliki akun untuk mulai berbelanja layanan kami
            </p>
          </div>

          <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
            <div className="border border-vw-border rounded-3xl bg-white p-8 sm:p-10 shadow-lg space-y-4">
              {/* Login with Kinde */}
              <a
                href="/api/auth/login"
                className="w-full bg-vw-accent hover:bg-vw-accent-hover text-white font-semibold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer shadow-lg shadow-vw-accent/20 hover:scale-[1.01] active:scale-[0.98]"
              >
                <LogIn size={18} />
                <span>Masuk dengan Kinde</span>
              </a>

              {/* Register with Kinde */}
              <a
                href="/api/auth/register"
                className="w-full border-2 border-vw-border hover:border-vw-accent/40 text-vw-text font-semibold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer hover:bg-vw-accent/5 active:scale-[0.98]"
              >
                <UserPlus size={18} className="text-vw-accent" />
                <span>Daftar dengan Kinde</span>
              </a>

              {/* Divider */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-vw-border/60" />
                <span className="text-[10px] font-medium text-vw-muted uppercase tracking-wider">Aman & Terpercaya</span>
                <div className="flex-1 h-px bg-vw-border/60" />
              </div>

              <p className="text-[11px] text-vw-muted text-center leading-relaxed">
                Login dan registrasi diproses melalui{" "}
                <span className="font-semibold text-vw-text">Kinde</span>,
                penyedia autentikasi enterprise terpercaya. Data Anda aman.
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
