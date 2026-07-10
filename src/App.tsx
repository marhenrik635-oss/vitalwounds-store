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
          VIEW 2: AUTH PAGE — Clean Gateway
          ========================================== */}
      {screenView === "auth" && (
        <div className="flex-1 min-h-screen flex flex-col relative">
          {/* Subtle grain overlay */}
          <div className="grain-overlay" />

          {/* Top nav */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-5">
            <button
              onClick={() => navigateTo("landing")}
              className="text-xs font-medium text-vw-muted hover:text-vw-text transition-colors duration-200 cursor-pointer"
            >
              ← Beranda
            </button>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="flex flex-col items-center w-full max-w-xs">
              {/* Logo */}
              <div className="hero-enter">
                <div className="w-16 h-16 rounded-[18px] bg-white shadow-elevated flex items-center justify-center overflow-hidden mb-5">
                  <img src="/logo.png" alt="Vitalwounds" className="w-10 h-10 object-contain" />
                </div>
              </div>

              {/* Heading */}
              <h1 className="hero-enter hero-enter-d1 text-[22px] font-bold text-vw-text text-center tracking-[-0.03em]">
                Vitalwounds
              </h1>
              <p className="hero-enter hero-enter-d2 mt-1.5 text-[13px] text-vw-muted text-center leading-relaxed">
                Masuk atau buat akun untuk melanjutkan
              </p>

              {/* Buttons */}
              <div className="hero-enter hero-enter-d3 mt-8 w-full flex flex-col gap-3">
                <a
                  href="/api/auth/login"
                  className="relative w-full bg-vw-accent hover:bg-vw-accent-hover text-white text-sm font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-btn hover:shadow-btn-hover active:scale-[0.97] overflow-hidden group animate-pulse-glow"
                >
                  <LogIn size={16} />
                  <span>Masuk</span>
                </a>

                <a
                  href="/api/auth/register"
                  className="w-full bg-white hover:bg-gray-50 text-vw-text text-sm font-medium py-3 px-5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer border border-vw-border active:scale-[0.97]"
                >
                  <UserPlus size={16} className="text-vw-muted" />
                  <span>Buat Akun</span>
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="hero-enter hero-enter-d4 pb-6 text-center">
            <p className="text-[11px] text-vw-muted/50 font-medium">
              Vitalwounds Store &mdash; 2026
            </p>
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
