"use client";

import { useState } from "react";
import { fetchAndStoreUser } from "../../lib/storage";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: linear-gradient(135deg, #dce8f8 0%, #eaf2fb 40%, #f0f6ff 100%);
    min-height: 100vh;
    color: #1e2d5a;
  }

  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background:
      radial-gradient(ellipse at 15% 60%, rgba(100,149,237,0.18) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 20%, rgba(180,210,255,0.22) 0%, transparent 50%),
      linear-gradient(135deg, #dce8f8 0%, #eaf2fb 40%, #f0f6ff 100%);
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
    background: linear-gradient(135deg, #2e4fd4 0%, #5b8df5 100%);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(46,79,212,0.25);
  }
  .brand-icon svg { width: 20px; height: 20px; }
  .brand-text { line-height: 1; }
  .brand-name { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: #1e2d5a; }
  .brand-sub  {
    font-size: 9px; font-weight: 600; letter-spacing: 0.2em;
    color: #2e4fd4; font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase; margin-top: 2px;
  }
  .session-badge {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; color: #6b7db3;
    font-family: 'JetBrains Mono', monospace;
  }
  .session-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.5);
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
    background: #ffffff;
    border: 1px solid rgba(46,79,212,0.1);
    border-radius: 20px;
    padding: 40px 36px 36px;
    box-shadow:
      0 8px 40px rgba(46,79,212,0.08),
      0 2px 8px rgba(0,0,0,0.04);
    animation: fadeUp 0.5s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .card-heading { text-align: center; margin-bottom: 28px; }
  .card-title   { font-size: 26px; font-weight: 700; color: #1e2d5a; letter-spacing: -0.02em; }
  .card-sub     { font-size: 13px; color: #7a8db3; margin-top: 6px; line-height: 1.5; }

  /* ── Fields ── */
  .field { margin-bottom: 16px; }
  .field-label {
    font-size: 13px; font-weight: 600;
    color: #3a4d7a;
    margin-bottom: 8px; display: block;
  }
  .input-wrap { position: relative; width: 100%; }
  .input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: #b0bcdc; pointer-events: none; display: flex;
  }
  .input-icon svg { width: 16px; height: 16px; }
  .input-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    color: #b0bcdc; cursor: pointer; display: flex;
    background: none; border: none; padding: 0;
    transition: color 0.2s;
  }
  .input-eye:hover { color: #2e4fd4; }
  .input-eye svg { width: 16px; height: 16px; }

  /* ── Phone field layout ── */
  .phone-wrap { display: flex; gap: 8px; }
  .dial-select {
    background: #f8faff;
    border: 1.5px solid #dde5f8;
    border-radius: 10px;
    padding: 12px 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; color: #2e4fd4; font-weight: 600;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    flex-shrink: 0;
    appearance: none;
    -webkit-appearance: none;
    min-width: 90px;
    text-align: center;
  }
  .dial-select:focus {
    border-color: #2e4fd4;
    box-shadow: 0 0 0 3px rgba(46,79,212,0.12);
    background: #fff;
  }
  .dial-select.error {
    border-color: rgba(220,38,38,0.5);
    box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
  }
  .dial-select option { background: #fff; color: #1e2d5a; }
  .phone-input-wrap { position: relative; flex: 1; }

  .text-input {
    width: 100%;
    background: #f8faff;
    border: 1.5px solid #dde5f8;
    border-radius: 10px;
    padding: 12px 14px 12px 42px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; color: #1e2d5a;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .text-input.has-eye { padding-right: 42px; }
  .text-input.no-icon { padding-left: 14px; }
  .text-input::placeholder { color: #b0bcdc; }
  .text-input:focus {
    border-color: #2e4fd4;
    box-shadow: 0 0 0 3px rgba(46,79,212,0.12);
    background: #fff;
  }
  .text-input.error {
    border-color: rgba(220,38,38,0.5);
    box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
  }
  .error-msg {
    font-size: 11px; color: #dc2626;
    font-family: 'JetBrains Mono', monospace;
    margin-top: 5px; display: block;
  }

  /* ── Button ── */
  .btn-primary {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #2e4fd4 0%, #4c6ef5 100%);
    border: none; border-radius: 11px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px; font-weight: 700; color: #fff;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    letter-spacing: 0.01em;
    position: relative; overflow: hidden;
    box-shadow: 0 4px 16px rgba(46,79,212,0.35);
  }
  .btn-primary:hover {
    box-shadow: 0 6px 24px rgba(46,79,212,0.45);
    transform: translateY(-1px);
  }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-primary span { position: relative; z-index: 1; }
  .btn-primary svg  { position: relative; z-index: 1; width: 16px; height: 16px; }

  .spinner {
    width: 15px; height: 15px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    position: relative; z-index: 1;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Footer ── */
  .footer-link { text-align: center; font-size: 13px; color: #7a8db3; margin-top: 20px; }
  .footer-link a { color: #2e4fd4; text-decoration: none; font-weight: 600; transition: color 0.2s; }
  .footer-link a:hover { color: #1e3ab8; }

  .sec-badge {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 11px; color: #b0bcdc;
    font-family: 'JetBrains Mono', monospace;
    margin-top: 20px;
  }
  .sec-badge svg { width: 13px; height: 13px; color: #22c55e; }

  .server-error {
    color: #dc2626; font-size: 12px; text-align: center;
    margin-bottom: 12px;
    font-family: 'JetBrains Mono', monospace;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 8px 12px;
  }

  .page-footer {
    text-align: center;
    font-size: 11px; color: #a0b0d0;
    font-family: 'JetBrains Mono', monospace;
    padding: 20px;
  }
`;

/* ── Icon helpers ── */
const IconUser = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const IconMail = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 7l10 7 10-7" />
    </svg>
);

const IconLock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconPhone = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const IconEyeOn = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const IconEyeOff = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const IconUserPlus = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
);

const IconShield = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

/* ── Country dial codes ── */
const DIAL_CODES = [
    { code: "+91", label: "🇮🇳 +91" },
    { code: "+1", label: "🇺🇸 +1" },
    { code: "+44", label: "🇬🇧 +44" },
    { code: "+61", label: "🇦🇺 +61" },
    { code: "+971", label: "🇦🇪 +971" },
    { code: "+65", label: "🇸🇬 +65" },
    { code: "+49", label: "🇩🇪 +49" },
    { code: "+33", label: "🇫🇷 +33" },
    { code: "+81", label: "🇯🇵 +81" },
    { code: "+86", label: "🇨🇳 +86" },
];

const API_BASE = "/api/auth";

function saveTokens(data) {
    if (data?.access_token) localStorage.setItem("access_token", data.access_token);
    if (data?.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("dgca_user", JSON.stringify(data.user));
    }
}

export default function RegisterPage() {
    const [fullName, setFullName] = useState("");
    const [dialCode, setDialCode] = useState("+91");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");

    const validate = () => {
        const e = {};
        if (!fullName.trim()) e.fullName = "Full name is required.";
        const digitsOnly = phone.replace(/\D/g, "");
        if (!digitsOnly || digitsOnly.length < 7 || digitsOnly.length > 15)
            e.phone = "Enter a valid phone number (7–15 digits).";
        if (!email.includes("@")) e.email = "Enter a valid email address.";
        if (password.length < 8) e.password = "Password must be at least 8 characters.";
        else if (!/[A-Z]/.test(password)) e.password = "Add at least one uppercase letter.";
        else if (!/[a-z]/.test(password)) e.password = "Add at least one lowercase letter.";
        else if (!/\d/.test(password)) e.password = "Add at least one number.";
        else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) e.password = "Add at least one special character.";
        if (password !== confirmPw) e.confirmPw = "Passwords do not match.";
        return e;
    };

    const handleRegister = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        setServerError("");
        setLoading(true);

        const userPayload = {
            name: fullName,
            email,
            phone: `${dialCode}${phone.replace(/\D/g, "")}`,
            password,
        };

        const createLocalUser = async () => {
            const localRes = await fetch("/api/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: userPayload.name, email: userPayload.email, phone: userPayload.phone }),
            });
            const localData = await localRes.json().catch(() => null);
            if (!localRes.ok) {
                throw new Error(localData?.error || "Local registration failed");
            }
            return localData;
        };

        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userPayload),
            });

            let data;
            try {
                data = await res.json();
            } catch {
                data = { detail: "Non-JSON response from auth backend" };
            }

            if (!res.ok) {
                if (res.status >= 500 || data.detail === "Non-JSON response from auth backend") {
                    await createLocalUser();
                } else {
                    throw new Error(data.detail || "Registration failed");
                }
            } else {
                saveTokens(data);
            }

            await fetchAndStoreUser({ email, phone: userPayload.phone });
            window.location.href = "/dashboard";
        } catch (err) {
            setServerError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isReady = fullName && phone && email && password && confirmPw;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            <div className="page">



                <div className="center">
                    <div className="card">
                        <div className="card-heading">
                            <h1 className="card-title">Create Account</h1>
                            <p className="card-sub">Sign up with your credentials to explore the premium dashboard</p>
                        </div>

                        {/* Full Name */}
                        <div className="field">
                            <label className="field-label">Full Name</label>
                            <div className="input-wrap">
                                <span className="input-icon"><IconUser /></span>
                                <input
                                    type="text"
                                    className={`text-input${errors.fullName ? " error" : ""}`}
                                    placeholder="e.g. Arjun Sharma"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            {errors.fullName && <span className="error-msg">{errors.fullName}</span>}
                        </div>

                        {/* Phone Number */}
                        <div className="field">
                            <label className="field-label">Mobile Number</label>
                            <div className="phone-wrap">
                                <select
                                    className={`dial-select${errors.phone ? " error" : ""}`}
                                    value={dialCode}
                                    onChange={(e) => setDialCode(e.target.value)}
                                    aria-label="Country dial code"
                                >
                                    {DIAL_CODES.map(({ code, label }) => (
                                        <option key={code} value={code}>{label}</option>
                                    ))}
                                </select>
                                <div className="phone-input-wrap">
                                    <span className="input-icon"><IconPhone /></span>
                                    <input
                                        type="tel"
                                        className={`text-input${errors.phone ? " error" : ""}`}
                                        placeholder="9876543210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s\-().+]/g, ""))}
                                        maxLength={15}
                                    />
                                </div>
                            </div>
                            {errors.phone && <span className="error-msg">{errors.phone}</span>}
                        </div>

                        {/* Email */}
                        <div className="field">
                            <label className="field-label">Email Address</label>
                            <div className="input-wrap">
                                <span className="input-icon"><IconMail /></span>
                                <input
                                    type="email"
                                    className={`text-input${errors.email ? " error" : ""}`}
                                    placeholder="e.g. arjun@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {errors.email && <span className="error-msg">{errors.email}</span>}
                        </div>

                        {/* Create Password */}
                        <div className="field">
                            <label className="field-label">Create Password</label>
                            <div className="input-wrap">
                                <span className="input-icon"><IconLock /></span>
                                <input
                                    type={showPw ? "text" : "password"}
                                    className={`text-input has-eye${errors.password ? " error" : ""}`}
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button className="input-eye" onClick={() => setShowPw(!showPw)} type="button" aria-label="Toggle password visibility">
                                    {showPw ? <IconEyeOff /> : <IconEyeOn />}
                                </button>
                            </div>
                            {errors.password && <span className="error-msg">{errors.password}</span>}
                        </div>

                        {/* Confirm Password */}
                        <div className="field">
                            <label className="field-label">Confirm Password</label>
                            <div className="input-wrap">
                                <span className="input-icon"><IconLock /></span>
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    className={`text-input has-eye${errors.confirmPw ? " error" : ""}`}
                                    placeholder="Re-enter your password"
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                />
                                <button className="input-eye" onClick={() => setShowConfirm(!showConfirm)} type="button" aria-label="Toggle confirm password visibility">
                                    {showConfirm ? <IconEyeOff /> : <IconEyeOn />}
                                </button>
                            </div>
                            {errors.confirmPw && <span className="error-msg">{errors.confirmPw}</span>}
                        </div>

                        {serverError && <div className="server-error">{serverError}</div>}

                        <button
                            className="btn-primary"
                            onClick={handleRegister}
                            disabled={loading || !isReady}
                            style={{ marginTop: "4px" }}
                        >
                            {loading ? (
                                <div className="spinner" />
                            ) : (
                                <>
                                    <span>Begin Training →</span>
                                    <IconUserPlus />
                                </>
                            )}
                        </button>

                        <p className="footer-link">
                            Already registered? <a href="/login">Sign In</a>
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