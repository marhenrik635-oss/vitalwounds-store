import { useState, useEffect, lazy, Suspense, Component, ReactNode } from "react";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  UserPlus,
  LogIn,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff
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
    if (isLoggedIn && currentUsername) {
      fetch(`/api/users/${currentUsername}`)
        .then(res => res.json())
        .then(matched => {
          if (matched && !matched.error) {
            const role = matched.role || "member";
            setIsAdmin(matched.username === "admin" || role === "admin" || role === "owner");
            localStorage.setItem("vw_role", role);
            setUserProfile({
              username: matched.username,
              email: matched.email || "",
              phone: matched.phone || "",
              balance: matched.balance || 0,
              tier: matched.tier || "Regular",
              role: role,
              apiKey: matched.apiKey || "vt_live_" + matched.username
            });
            
            fetch(`/api/orders/${currentUsername}`).then(r => r.json()).then(d => { if (d.orders) setOrders(d.orders); }).catch(() => {});
            // fetch(`/api/tickets/${currentUsername}`).then(r => r.json()).then(d => { if (d.tickets) setTickets(d.tickets); }).catch(() => {});
            // Removed: Ticket fetching functionality is deprecated
          } else {
            setUserProfile(prev => ({ ...prev, username: currentUsername }));
          }
        })
        .catch(err => {
          console.error("Error fetching profile:", err);
          setUserProfile(prev => ({ ...prev, username: currentUsername }));
        });

      const getSafeJson = (key: string) => {
        try {
          const val = localStorage.getItem(key);
          return val ? JSON.parse(val) : [];
        } catch { return []; }
      };

      setDeposits(Array.isArray(getSafeJson(`vw_deposits_${currentUsername}`)) ? getSafeJson(`vw_deposits_${currentUsername}`) : []);
      setOrders(Array.isArray(getSafeJson(`vw_orders_${currentUsername}`)) ? getSafeJson(`vw_orders_${currentUsername}`) : []);
    } else {
      setUserProfile(initialUserProfile);
      setDeposits(initialDeposits);
      setOrders(initialOrders);
    }
  }, [currentUsername, isLoggedIn]);

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
        setScreenView("auth");
        setAuthTab("login");
        setForgotPasswordStep("reset");
        setResetToken(params.get("token") || "");
        setForgotEmail(params.get("email") || "");
      } else if (route === "/" || route === "/index.html" || route === "") {
        setScreenView("landing");
      } else if (route === "/auth" || route === "auth") {
        setScreenView("auth");
      } else if (route === "/contact" || route === "contact") {
        setScreenView("dashboard-panel");
        setActiveTab("contact");
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
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.setItem("vw_is_logged_in", "false");
    localStorage.removeItem("vw_current_user");
    localStorage.removeItem("vw_role");
    navigateTo("landing");
  };

  // Auth view states
  const [authTab, setAuthTab] = useState<"login" | "register" | "forgot">("login");
  const [loginUsername, setLoginUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  const [regStep, setRegStep] = useState<"email" | "otp" | "form">("email");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regOtp, setRegOtp] = useState<string>("");
  const [regOtpSent, setRegOtpSent] = useState<boolean>(false);
  const [regOtpVerified, setRegOtpVerified] = useState<boolean>(false);
  const [regPhone, setRegPhone] = useState<string>("");
  const [regUsername, setRegUsername] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>("");
  const [regError, setRegError] = useState<string>("");
  const [regSuccess, setRegSuccess] = useState<string>("");
  const [regLoading, setRegLoading] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Forgot Password View States
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"request" | "reset">("request");
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [forgotError, setForgotError] = useState<string>("");
  const [forgotSuccess, setForgotSuccess] = useState<string>("");
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);

  useEffect(() => {
    if (screenView === "auth") {
      setAuthTab("login");
      setRegStep("email"); setRegEmail(""); setRegOtp(""); setRegOtpSent(false); setRegOtpVerified(false);
      setRegPhone(""); setRegUsername(""); setRegPassword(""); setRegConfirmPassword("");
      setRegError(""); setRegSuccess(""); setRegLoading(false);
      setLoginUsername(""); setLoginPassword(""); setLoginError("");
      setForgotEmail(""); setResetToken(""); setNewPassword(""); setForgotError(""); setForgotSuccess(""); setForgotLoading(false);
      
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "reset-password") {
        setAuthTab("forgot");
        setForgotPasswordStep("reset");
        setResetToken(params.get("token") || "");
        setForgotEmail(params.get("email") || "");
      } else {
        setForgotPasswordStep("request");
      }
    }
  }, [screenView]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginUsername.trim() || !loginPassword) {
      setLoginError("Harap isi semua kolom!");
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user;
        setIsLoggedIn(true);
        localStorage.setItem("vw_is_logged_in", "true");
        setCurrentUsername(user.username);
        localStorage.setItem("vw_current_user", user.username);
        const role = user.role || "member";
        setIsAdmin(user.username === "admin" || role === "admin" || role === "owner");
        localStorage.setItem("vw_role", role);
        setUserProfile({
          username: user.username, email: user.email || "", phone: user.phone || "",
          balance: user.balance || 0, tier: user.tier || "Regular", role: role, apiKey: user.apiKey || ""
        });
        
        setLoginUsername("");
        setLoginPassword("");
        navigateTo("dashboard-panel", role === "admin" ? "admin" : "dashboard", true);
      } else {
        setLoginError(data.error || "Login gagal!");
      }
    } catch (err) {
      setLoginError("Server tidak dapat dijangkau.");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!regEmail.trim()) { setRegError("Masukkan email"); return; }

    setRegLoading(true);
    try {
      const r = await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: regEmail }) });
      const d = await r.json();
      if (r.ok) { setRegStep("otp"); setRegOtpSent(true); setRegError(""); }
      else setRegError(d.error || "Gagal kirim OTP");
    } catch { setRegError("Server tidak dapat dijangkau."); }
    finally { setRegLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!regOtp.trim()) { setRegError("Masukkan kode OTP"); return; }

    setRegLoading(true);
    try {
      const r = await fetch('/api/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: regEmail, otp: regOtp }) });
      const d = await r.json();
      if (r.ok) { setRegOtpVerified(true); setRegStep("form"); setRegError(""); }
      else setRegError(d.error || "Kode OTP salah");
    } catch { setRegError("Server tidak dapat dijangkau."); }
    finally { setRegLoading(false); }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regUsername.trim() || !regPassword || !regConfirmPassword) {
      setRegError("Harap isi semua kolom!");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Password dan Konfirmasi Password tidak cocok!");
      return;
    }

    try {
      const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword, phone: regPhone }) });
      const data = await response.json();

      if (response.ok) {
        fetch('/api/xoftware/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender: regPhone, name: regUsername }) })
          .then(rx => rx.json()).then(xData => {                            if (xData && xData.status) console.log('Registration success:', xData);
                            else console.warn('Registration skipped or failed:', xData?.message);
          }).catch(() => {});

        setIsLoggedIn(true);
        localStorage.setItem("vw_is_logged_in", "true");
        setCurrentUsername(data.user.username);
        localStorage.setItem("vw_current_user", data.user.username);
        const role = data.user.role || "member";
        setIsAdmin(data.user.username === "Vitalwounds" || role === "admin" || role === "owner");
        localStorage.setItem("vw_role", role);
        setUserProfile({
          username: data.user.username, email: data.user.email, phone: data.user.phone || "",
          balance: data.user.balance || 0, tier: data.user.tier || "Regular", role: role, apiKey: data.user.apiKey || "",
        });
        navigateTo("dashboard-panel", "profile", true);
        setRegUsername(""); setRegEmail(""); setRegPhone(""); setRegPassword(""); setRegConfirmPassword(""); setRegOtp(""); setRegStep("email"); setRegOtpVerified(false);
      } else {
        setRegError(data.error || "Gagal mendaftar.");
      }
    } catch (err) {
      setRegError("Server tidak dapat dijangkau.");
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!forgotEmail.trim()) {
      setForgotError("Email wajib diisi!");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setForgotSuccess(data.message || "Link reset kata sandi telah dikirim ke email Anda.");
        setForgotEmail("");
      } else {
        setForgotError(data.error || "Gagal mengirim link reset.");
      }
    } catch (err) {
      setForgotError("Server tidak dapat dijangkau.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!newPassword) {
      setForgotError("Kata sandi baru wajib diisi!");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, token: resetToken, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setForgotSuccess("Kata sandi berhasil diatur ulang! Silakan masuk kembali.");
        setNewPassword("");
        // After 2 seconds redirect to login tab
        setTimeout(() => {
          setAuthTab("login");
          setForgotPasswordStep("request");
          // clean URL parameters
          try {
            window.history.pushState(null, "", "/auth");
          } catch (e) {
            window.location.hash = "/auth";
          }
        }, 2000);
      } else {
        setForgotError(data.error || "Gagal mengatur ulang kata sandi.");
      }
    } catch (err) {
      setForgotError("Server tidak dapat dijangkau.");
    } finally {
      setForgotLoading(false);
    }
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

      {/* ==========================================
          VIEW 2: AUTH PAGE
          ========================================== */}
      {screenView === "auth" && (
        <div className="flex-1 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
          {/* Back button */}
          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={() => navigateTo("landing")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-vw-muted hover:text-vw-text transition-colors px-4 py-2 cursor-pointer"
            >
              <ArrowLeft size={14} /> Kembali ke Beranda
            </button>
          </div>

          <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">                          <div className="flex justify-center mb-4">
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
            <div className="border border-vw-border rounded-3xl bg-white p-8 sm:p-10 shadow-lg">
              <div className="flex bg-gray-100 border border-vw-border p-1 rounded-full mb-6 relative">
                <button
                  type="button"
                  onClick={() => { setAuthTab("login"); setLoginError(""); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 ease-in-out cursor-pointer relative z-10 ${
                    authTab === "login" ? "text-white" : "text-vw-muted hover:text-vw-text"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <LogIn size={13} /> Masuk (Login)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab("register"); setRegError(""); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 ease-in-out cursor-pointer relative z-10 ${
                    authTab === "register" ? "text-white" : "text-vw-muted hover:text-vw-text"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UserPlus size={13} /> Daftar (Register)
                  </span>
                </button>
                <div
                  className={`absolute top-[4px] bottom-[4px] w-[calc(50%-4px)] bg-vw-accent rounded-full transition-all duration-300 ease-in-out ${
                    authTab === "login" ? "left-[4px]" : (authTab === "register" ? "left-[calc(50%)]" : "hidden")
                  }`}
                />
              </div>

              {authTab === "login" && (
                <div className="flex justify-center mb-6">
                  <button
                    type="button"
                    onClick={() => { setAuthTab("forgot"); setForgotError(""); setForgotSuccess(""); }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-vw-muted hover:text-vw-text transition-colors cursor-pointer"
                  >
                    <Lock size={13} /> Lupa Kata Sandi?
                  </button>
                </div>
              )}

              {/* Forgot Password View */}
              {authTab === "forgot" && (
                <div className="space-y-4">
                  {forgotError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-600 flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{forgotError}</span>
                    </div>
                  )}
                  {forgotSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-600 flex items-start gap-2">
                      <ShieldCheck size={15} className="shrink-0 mt-0.5" />
                      <span>{forgotSuccess}</span>
                    </div>
                  )}

                  {forgotPasswordStep === "request" && (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                      <p className="text-xs text-vw-muted">Masukkan email akun Anda untuk mendapatkan link reset kata sandi.</p>
                      <div>
                        <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">Email</label>
                        <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                          placeholder="email@anda.com" disabled={forgotLoading}
                          className="block w-full px-3.5 py-2.5 border border-vw-border rounded-xl text-sm placeholder-vw-muted/70 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors disabled:opacity-50" />
                      </div>
                      <button type="submit" disabled={forgotLoading}
                        className="w-full bg-vw-accent hover:bg-vw-accent-hover text-white font-semibold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50">
                        {forgotLoading ? "Mengirim..." : "Kirim Link Reset"}
                      </button>
                      <button type="button" onClick={() => { setAuthTab("login"); setForgotError(""); }}
                        className="w-full text-xs text-vw-accent hover:underline cursor-pointer text-center bg-transparent border-none">
                        Kembali ke Login
                      </button>
                    </form>
                  )}

                  {forgotPasswordStep === "reset" && (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      <p className="text-xs text-vw-muted">Masukkan kata sandi baru untuk akun <strong>{forgotEmail}</strong>.</p>
                      <div>
                        <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">Password Baru</label>
                        <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          placeholder="••••••••" disabled={forgotLoading}
                          className="block w-full px-3.5 py-2.5 border border-vw-border rounded-xl text-sm placeholder-vw-muted/70 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors disabled:opacity-50" />
                      </div>
                      <button type="submit" disabled={forgotLoading}
                        className="w-full bg-vw-accent hover:bg-vw-accent-hover text-white font-semibold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50">
                        {forgotLoading ? "Memproses..." : "Atur Ulang Kata Sandi"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Login View */}
              {authTab === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  {loginError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-600 flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">Username / Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-vw-muted/60">
                        <User size={15} />
                      </div>
                      <input type="text" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="Username atau email"
                        className="block w-full pl-10 pr-3.5 py-2.5 border border-vw-border rounded-xl text-sm placeholder-vw-muted/70 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-vw-muted/60">
                        <Lock size={15} />
                      </div>
                      <input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-3.5 py-2.5 border border-vw-border rounded-xl text-sm placeholder-vw-muted/70 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer text-vw-muted/60 hover:text-vw-accent">
                        {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full bg-vw-accent hover:bg-vw-accent-hover text-white font-semibold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer mt-6 shadow-lg shadow-vw-accent/20">
                    <LogIn size={14} /> Masuk Ke Akun
                  </button>
                </form>
              )}

              {/* Register View */}
              {authTab === "register" && (
                <div className="space-y-4">
                  {regError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-600 flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}
                  {regSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-600 flex items-start gap-2">
                      <ShieldCheck size={15} className="shrink-0 mt-0.5" />
                      <span>{regSuccess}</span>
                    </div>
                  )}

                  {/* Step indicator */}
                  <div className="flex items-center gap-2 justify-center mb-4">
                    {["email","otp","form"].map((s,i) => (
                      <div key={s} className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                          regStep === s ? "bg-vw-accent text-white" : regStep === "form" && s !== "form" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 border border-vw-border text-vw-muted"
                        }`}>{regStep === "form" && s !== "form" ? "✓" : i+1}</div>
                        {i < 2 && <div className="w-6 h-px bg-vw-border" />}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Email */}
                  {regStep === "email" && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">Email</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-vw-muted/60">
                            <Mail size={15} />
                          </div>
                          <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
                            placeholder="email@anda.com" disabled={regLoading}
                            className="block w-full pl-10 pr-3.5 py-2.5 border border-vw-border rounded-xl text-sm placeholder-vw-muted/70 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors disabled:opacity-50" />
                        </div>
                      </div>
                      <button type="submit" disabled={regLoading}
                        className="w-full bg-vw-accent hover:bg-vw-accent-hover text-white font-semibold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50">
                        {regLoading ? "Mengirim..." : "Kirim Kode OTP"}
                      </button>
                    </form>
                  )}

                  {/* Step 2: OTP */}
                  {regStep === "otp" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <p className="text-[11px] text-vw-muted text-center">Kode OTP dikirim ke <strong>{regEmail}</strong></p>
                      <div>
                        <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">Kode OTP</label>
                        <input type="text" required value={regOtp} onChange={e => setRegOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                          placeholder="000000" maxLength={6} disabled={regLoading}
                          className="block w-full text-center text-lg tracking-[8px] py-2.5 border border-vw-border rounded-xl placeholder-vw-muted/50 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors disabled:opacity-50 font-mono" />
                      </div>
                      <button type="submit" disabled={regLoading}
                        className="w-full bg-vw-accent hover:bg-vw-accent-hover text-white font-semibold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50">
                        {regLoading ? "Verifikasi..." : "Verifikasi OTP"}
                      </button>
                      <button type="button" onClick={() => { setRegStep("email"); setRegOtp(""); setRegError(""); }}
                        className="w-full text-[11px] text-vw-accent hover:underline cursor-pointer text-center bg-transparent border-none">
                        Ganti email
                      </button>
                    </form>
                  )}

                  {/* Step 3: Register form */}
                  {regStep === "form" && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-600 text-center">
                        ✓ Email {regEmail} terverifikasi
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">Username</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-vw-muted/60">
                            <User size={15} />
                          </div>
                          <input type="text" required value={regUsername} onChange={e => setRegUsername(e.target.value)}
                            placeholder="Pilih username unik"
                            className="block w-full pl-10 pr-3.5 py-2.5 border border-vw-border rounded-xl text-sm placeholder-vw-muted/70 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">No. HP (opsional)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-vw-muted/60">
                            <Phone size={15} />
                          </div>
                          <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)}
                            placeholder="08xxxxxxxxxx"
                            className="block w-full pl-10 pr-3.5 py-2.5 border border-vw-border rounded-xl text-sm placeholder-vw-muted/70 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-vw-muted/60">
                            <Lock size={15} />
                          </div>
                          <input type={showPassword ? "text" : "password"} required value={regPassword} onChange={e => setRegPassword(e.target.value)}
                            placeholder="Buat password minimal 6 karakter"
                            className="block w-full pl-10 pr-3.5 py-2.5 border border-vw-border rounded-xl text-sm placeholder-vw-muted/70 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer text-vw-muted/60 hover:text-vw-accent">
                            {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-vw-muted uppercase tracking-wider mb-1.5">Konfirmasi Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-vw-muted/60">
                            <Lock size={15} />
                          </div>
                          <input type={showPassword ? "text" : "password"} required value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)}
                            placeholder="Ulangi password Anda"
                            className="block w-full pl-10 pr-3.5 py-2.5 border border-vw-border rounded-xl text-sm placeholder-vw-muted/70 focus:outline-none focus:border-vw-accent focus:ring-1 focus:ring-vw-accent transition-colors" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer text-vw-muted/60 hover:text-vw-accent">
                            {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </div>
                      </div>
                      <button type="submit"
                        className="w-full bg-vw-accent hover:bg-vw-accent-hover text-white font-semibold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg shadow-vw-accent/20">
                        <UserPlus size={14} /> Daftar Sekarang
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Toggle text link */}
              <div className="mt-5 text-center text-xs text-vw-muted font-medium">
                {authTab === "login" ? (
                  <span>Belum punya akun?{" "}
                    <button type="button" onClick={() => { setAuthTab("register"); setRegError(""); }}
                      className="text-vw-accent hover:underline font-bold cursor-pointer">Daftar (Register) disini</button>
                  </span>
                ) : (
                  <span>Sudah punya akun?{" "}
                    <button type="button" onClick={() => { setAuthTab("login"); setLoginError(""); }}
                      className="text-vw-accent hover:underline font-bold cursor-pointer">Masuk (Login) disini</button>
                  </span>
                )}
              </div>
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
