"use client";

import { useState } from "react";
import { fetchAndStoreUser } from "../../lib/storage";

const GUEST_SESSION_KEY = "guest_mock_session_id";

function getPostLoginRedirect(hasTransfer = false) {
  if (typeof window === "undefined") return hasTransfer ? "/dashboard?mockUnlock=1" : "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next && next.startsWith("/")) return next;
  return hasTransfer ? "/dashboard?mockUnlock=1" : "/dashboard";
}

function getGuestIdFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const guestId = params.get("guestId");
  if (guestId) {
    localStorage.setItem(GUEST_SESSION_KEY, guestId);
    localStorage.setItem("guestId", guestId);
    return guestId;
  }
  return localStorage.getItem(GUEST_SESSION_KEY) || localStorage.getItem("guestId");
}

async function transferGuestResult(guestId, email, name) {
  if (!guestId || !email) return null;
  try {
    const res = await fetch('/api/mock-leaderboard/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, email, name }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.result) {
      sessionStorage.setItem('transferred_mock_result', JSON.stringify(data.result));
      localStorage.removeItem(GUEST_SESSION_KEY);
      localStorage.removeItem('guestId');
      return data.result;
    }
  } catch (err) {
    console.error('Guest transfer failed:', err);
  }
  return null;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Sora', sans-serif;
    background-color: #0d1117;
    min-height: 100vh;
    color: #e2e8f0;
  }

  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.07) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(56,189,248,0.05) 0%, transparent 50%),
      #0d1117;
  }

  /* ── Navbar ── */
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-icon {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, #6366f1 0%, #38bdf8 100%);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .brand-icon svg { width: 20px; height: 20px; }
  .brand-text { line-height: 1; }
  .brand-name  { font-size: 15px; font-weight: 600; letter-spacing: 0.02em; color: #f1f5f9; }
  .brand-sub   {
    font-size: 9px; font-weight: 500; letter-spacing: 0.2em;
    color: #6366f1; font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase; margin-top: 2px;
  }
  .session-badge {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
  }
  .session-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e; box-shadow: 0 0 8px #22c55e;
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

  /* ── Center / Card ── */
  .center {
    flex: 1;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%; max-width: 420px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 40px 36px 36px;
    backdrop-filter: blur(12px);
    box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.08);
    animation: fadeUp 0.5s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .card-heading { text-align: center; margin-bottom: 28px; }
  .card-title   { font-size: 26px; font-weight: 600; color: #f8fafc; letter-spacing: -0.02em; }
  .card-sub     { font-size: 13px; color: #64748b; margin-top: 6px; line-height: 1.5; }

  /* ── Tabs ── */
  .tabs {
    display: grid; grid-template-columns: 1fr 1fr;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 4px; gap: 4px;
    margin-bottom: 28px;
  }
  .tab-btn {
    padding: 10px 0;
    border: none; border-radius: 9px;
    font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.22s ease;
    background: transparent; color: #64748b;
  }
  .tab-btn.active {
    background: rgba(99,102,241,0.18);
    color: #a5b4fc;
    box-shadow: inset 0 0 0 1px rgba(99,102,241,0.3);
  }
  .tab-btn:hover:not(.active) { color: #94a3b8; background: rgba(255,255,255,0.04); }

  /* ── Input mode toggle ── */
  .toggle-row {
    display: flex;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 3px; gap: 3px;
    margin-bottom: 16px;
  }
  .toggle-btn {
    flex: 1; padding: 8px 0;
    border: none; border-radius: 8px;
    font-family: 'Sora', sans-serif;
    font-size: 12px; font-weight: 500;
    cursor: pointer;
    background: transparent; color: #64748b;
    transition: all 0.18s ease;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .toggle-btn.active {
    background: rgba(99,102,241,0.2);
    color: #a5b4fc;
    box-shadow: inset 0 0 0 1px rgba(99,102,241,0.25);
  }
  .toggle-btn svg { width: 13px; height: 13px; }

  /* ── Fields ── */
  .field { margin-bottom: 18px; }
  .field-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 8px; display: block;
  }

  .phone-row { display: flex; gap: 8px; width: 100%; }
  .cc-input {
    flex: 0 0 68px; min-width: 0;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px;
    padding: 12px 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; color: #a5b4fc;
    outline: none; text-align: center;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .cc-input:focus {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .num-wrap { position: relative; flex: 1 1 0; min-width: 0; }
  .num-input {
    width: 100%; min-width: 0;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px;
    padding: 12px 13px 12px 40px;
    font-family: 'Sora', sans-serif;
    font-size: 14px; color: #e2e8f0;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .num-input::placeholder { color: #475569; }
  .num-input:focus {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }

  .input-wrap { position: relative; width: 100%; }
  .input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: #475569; pointer-events: none; display: flex;
  }
  .input-icon svg { width: 16px; height: 16px; }
  .text-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px;
    padding: 12px 14px 12px 42px;
    font-family: 'Sora', sans-serif;
    font-size: 14px; color: #e2e8f0;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .text-input::placeholder { color: #475569; }
  .text-input:focus {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }

  /* ── Misc ── */
  .helper-text { font-size: 12px; color: #475569; text-align: center; margin-bottom: 20px; line-height: 1.6; }
  .helper-text.success { color: #4ade80; }

  .btn-primary {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #6366f1 0%, #38bdf8 100%);
    border: none; border-radius: 11px;
    font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 600; color: #fff;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.2s, transform 0.15s;
    letter-spacing: 0.01em;
    position: relative; overflow: hidden;
  }
  .btn-primary::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, #818cf8 0%, #7dd3fc 100%);
    opacity: 0; transition: opacity 0.2s;
  }
  .btn-primary:hover::before { opacity: 1; }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary span { position: relative; z-index: 1; }
  .btn-primary svg  { position: relative; z-index: 1; width: 15px; height: 15px; }

  .spinner {
    width: 15px; height: 15px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    position: relative; z-index: 1;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0; }

  .footer-link { text-align: center; font-size: 13px; color: #475569; }
  .footer-link a { color: #818cf8; text-decoration: none; font-weight: 500; transition: color 0.2s; }
  .footer-link a:hover { color: #a5b4fc; }

  .sec-badge {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 11px; color: #334155;
    font-family: 'JetBrains Mono', monospace;
    margin-top: 20px;
  }
  .sec-badge svg { width: 13px; height: 13px; color: #22c55e; }

  .page-footer {
    text-align: center;
    font-size: 11px; color: #1e293b;
    font-family: 'JetBrains Mono', monospace;
    padding: 20px;
  }
`;

// ── SVG icon helpers ──────────────────────────────────────────────
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.41 2 2 0 0 1 3.54 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.58-1.58a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ── API proxy base — use Next.js local proxy to avoid CORS and keep backend URL server-side.
const API_BASE = "/api/auth";

// ── FIX 2: saveSession now stores a clean, display-safe user object.
// For phone-only logins where the backend doesn't return a user.name,
// we store the phone as identifier and leave name empty rather than
// setting name = "+919876543210" which looks wrong on the dashboard.
function saveSession(data, credential) {
  if (data?.access_token) {
    localStorage.setItem("access_token", data.access_token);

    // Store token expiry so we can proactively refresh before 401s
    // Assumes a standard JWT — decode the exp claim without a library.
    try {
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      if (payload.exp) {
        localStorage.setItem("token_exp", String(payload.exp * 1000)); // ms
      }
    } catch {
      // Non-JWT token or decode failed — skip expiry tracking
    }
  }

  if (data?.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token);
  }

  // Build a clean user object.
  // Priority: backend's user object → derive from credential safely.
  const isEmail = credential.includes("@");
  const userObj = data?.user
    ? {
      ...data.user,
      // Ensure name is never a raw phone number if backend omits it
      name: data.user.name || (isEmail ? credential.split("@")[0] : ""),
      email: data.user.email || (isEmail ? credential : ""),
      phone: data.user.phone || (!isEmail ? credential : ""),
    }
    : {
      email: isEmail ? credential : "",
      phone: isEmail ? "" : credential,
      name: isEmail ? credential.split("@")[0] : "", // empty for phone — dashboard should use phone fallback
    };

  // 'dgca_user' is the key getUser() in lib/storage.js reads
  localStorage.setItem("dgca_user", JSON.stringify(userObj));
  localStorage.setItem("user", JSON.stringify(userObj));
}

async function saveSessionAndHydrateUser(data, credential) {
  saveSession(data, credential);
  if (!credential) return;
  const lookup = credential.includes("@")
    ? { email: credential }
    : { phone: credential };
  await fetchAndStoreUser(lookup);
}

// ── FIX 3: Token refresh utility.
// Call this anywhere in the app before making authenticated requests,
// or set up an interceptor that catches 401s and calls this first.
//
// Usage in other components/pages:
//   import { refreshAccessToken } from "@/app/login/page"; // or move to lib/auth.js
//   await refreshAccessToken();
//
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("No refresh token available");

  const res = await fetch(`${API_BASE}/token/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    // Refresh failed — clear everything and send to login
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_exp");
    localStorage.removeItem("dgca_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token);

    try {
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      if (payload.exp) localStorage.setItem("token_exp", String(payload.exp * 1000));
    } catch {
      // ignore
    }
  }
}

// ── FIX 4: Authenticated fetch wrapper.
// Replaces raw fetch() for all post-login API calls.
// Automatically refreshes the token if it's expired (or within 60s of expiry).
//
// Usage:
//   const data = await authFetch("/api/some-protected-route");
//
export async function authFetch(url, options = {}) {
  const exp = parseInt(localStorage.getItem("token_exp") || "0", 10);
  const now = Date.now();
  const sixtySeconds = 60 * 1000;

  // Proactively refresh if token expires within 60 seconds
  if (exp && now >= exp - sixtySeconds) {
    await refreshAccessToken();
  }

  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, { ...options, headers });

  // If we still get 401 after refresh attempt, force logout
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return res;
}

// ── Main component ────────────────────────────────────────────────
export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("password");

  // Password tab
  const [pwMode, setPwMode] = useState("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [pwEmail, setPwEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP tab
  const [otpMode, setOtpMode] = useState("phone");
  const [otpCc, setOtpCc] = useState("+91");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setOtpSent(false);
    setOtp("");
    setLoading(false);
    setError("");
  };

  const handleOtpModeSwitch = (mode) => {
    setOtpMode(mode);
    setOtpSent(false);
    setOtp("");
    setError("");
  };

  // ── Password login ──────────────────────────────────────────────
  const handlePasswordLogin = async () => {
    const id = pwMode === "phone" ? `${countryCode}${phone}` : pwEmail;
    if (!id || !password) return;
    setError("");
    setLoading(true);
    try {
      // FIX 1 in action: calling /api/auth/... (proxy) instead of backend directly
      const res = await fetch(`${API_BASE}/login/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: id, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      await saveSessionAndHydrateUser(data, id);
      const guestId = getGuestIdFromUrl();
      const transferResult = await transferGuestResult(guestId, id, data?.user?.name || id);
      window.location.href = getPostLoginRedirect(Boolean(transferResult));
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  // ── OTP: Send ──────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const id = otpMode === "phone" ? `${otpCc}${otpPhone}` : otpEmail;
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not send OTP");
      setOtpSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: Verify ────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    const id = otpMode === "phone" ? `${otpCc}${otpPhone}` : otpEmail;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: id, otp_code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid OTP");

      await saveSessionAndHydrateUser(data, id);
      const guestId = getGuestIdFromUrl();
      const transferResult = await transferGuestResult(guestId, id, data?.user?.name || id);
      window.location.href = getPostLoginRedirect(Boolean(transferResult));
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const otpDestLabel = otpMode === "phone" ? "phone" : "inbox";
  const otpSentTo = otpMode === "phone" ? `${otpCc} ${otpPhone}` : otpEmail;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="page">

        {/* ── Navbar ── */}
        <nav className="navbar">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="brand-text">
              <div className="brand-name">PortalAuth</div>
              <div className="brand-sub">Secure Gateway</div>
            </div>
          </div>
          <div className="session-badge">
            <div className="session-dot" />
            Active Session Tunnel
          </div>
        </nav>

        {/* ── Card ── */}
        <div className="center">
          <div className="card">
            <div className="card-heading">
              <h1 className="card-title">Secure Login</h1>
              <p className="card-sub">Step into your sandbox account workspace with confidence</p>
            </div>

            {/* ── Main tabs ── */}
            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === "password" ? "active" : ""}`}
                onClick={() => handleTabSwitch("password")}
              >
                Password
              </button>
              <button
                className={`tab-btn ${activeTab === "otp" ? "active" : ""}`}
                onClick={() => handleTabSwitch("otp")}
              >
                Security OTP
              </button>
            </div>

            {error && (
              <p style={{ color: "#f87171", fontSize: "12px", textAlign: "center", marginBottom: "14px", fontFamily: "'JetBrains Mono', monospace" }}>
                {error}
              </p>
            )}

            {/* ════════════════════════════════
                PASSWORD TAB
                ════════════════════════════════ */}
            {activeTab === "password" && (
              <>
                <div className="toggle-row">
                  <button
                    className={`toggle-btn ${pwMode === "phone" ? "active" : ""}`}
                    onClick={() => setPwMode("phone")}
                  >
                    <IconPhone />
                    Phone Number
                  </button>
                  <button
                    className={`toggle-btn ${pwMode === "email" ? "active" : ""}`}
                    onClick={() => setPwMode("email")}
                  >
                    <IconMail />
                    Email Address
                  </button>
                </div>

                {pwMode === "phone" && (
                  <div className="field">
                    <label className="field-label">Phone Number</label>
                    <div className="phone-row">
                      <input
                        type="text"
                        className="cc-input"
                        value={countryCode}
                        maxLength={5}
                        onChange={(e) => setCountryCode(e.target.value)}
                      />
                      <div className="num-wrap">
                        <span className="input-icon"><IconPhone /></span>
                        <input
                          type="tel"
                          className="num-input"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {pwMode === "email" && (
                  <div className="field">
                    <label className="field-label">Email Address</label>
                    <div className="input-wrap">
                      <span className="input-icon"><IconMail /></span>
                      <input
                        type="email"
                        className="text-input"
                        placeholder="name@example.com"
                        value={pwEmail}
                        onChange={(e) => setPwEmail(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="input-wrap">
                    <span className="input-icon"><IconLock /></span>
                    <input
                      type="password"
                      className="text-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                    />
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={handlePasswordLogin}
                  disabled={loading || !(pwMode === "phone" ? phone : pwEmail) || !password}
                >
                  {loading ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <IconArrowRight />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* ════════════════════════════════
                OTP TAB
                ════════════════════════════════ */}
            {activeTab === "otp" && (
              <>
                <div className="toggle-row">
                  <button
                    className={`toggle-btn ${otpMode === "phone" ? "active" : ""}`}
                    onClick={() => handleOtpModeSwitch("phone")}
                  >
                    <IconPhone />
                    Phone Number
                  </button>
                  <button
                    className={`toggle-btn ${otpMode === "email" ? "active" : ""}`}
                    onClick={() => handleOtpModeSwitch("email")}
                  >
                    <IconMail />
                    Email Address
                  </button>
                </div>

                {otpMode === "phone" && (
                  <div className="field">
                    <label className="field-label">Phone Number</label>
                    <div className="phone-row">
                      <input
                        type="text"
                        className="cc-input"
                        value={otpCc}
                        maxLength={5}
                        onChange={(e) => setOtpCc(e.target.value)}
                      />
                      <div className="num-wrap">
                        <span className="input-icon"><IconPhone /></span>
                        <input
                          type="tel"
                          className="num-input"
                          placeholder="98765 43210"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {otpMode === "email" && (
                  <div className="field">
                    <label className="field-label">Email Address</label>
                    <div className="input-wrap">
                      <span className="input-icon"><IconMail /></span>
                      <input
                        type="email"
                        className="text-input"
                        placeholder="name@example.com"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {!otpSent ? (
                  <>
                    <p className="helper-text">
                      We will dispatch a secure 6-digit passcode to your {otpDestLabel}.
                    </p>
                    <button
                      className="btn-primary"
                      onClick={handleSendOtp}
                      disabled={loading || !(otpMode === "phone" ? otpPhone : otpEmail)}
                    >
                      {loading ? (
                        <div className="spinner" />
                      ) : (
                        <>
                          <IconSend />
                          <span>Send OTP Verification Code</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="helper-text success">✓ OTP dispatched to {otpSentTo}</p>

                    <div className="field">
                      <label className="field-label">Enter OTP</label>
                      <div className="input-wrap">
                        <span className="input-icon"><IconShield /></span>
                        <input
                          type="text"
                          className="text-input"
                          placeholder="000000"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                          style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.25em" }}
                        />
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? (
                        <div className="spinner" />
                      ) : (
                        <>
                          <IconShield />
                          <span>Verify &amp; Sign In</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </>
            )}

            <hr className="divider" />

            <p className="footer-link">
              New around here? <a href="/register">Create Free Account</a>
            </p>

            <div className="sec-badge">
              <IconShield />
              AES-256 local storage sandbox vault verification
            </div>
          </div>
        </div>

        <footer className="page-footer">
          © 2026 PortalAuth Gateway. Sandbox local sandbox context.
        </footer>
      </div>
    </>
  );
}