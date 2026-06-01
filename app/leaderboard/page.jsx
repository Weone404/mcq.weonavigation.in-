'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getLeaderboard, clearUser } from '../../lib/storage';

// ─── COLOUR TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#F0F4FF", sidebar: "#0A1628", card: "#FFFFFF",
  primary: "#1D4ED8", primaryLight: "#EFF6FF",
  accent: "#F59E0B", green: "#10B981", red: "#EF4444", purple: "#8B5CF6",
  text: "#0F172A", muted: "#64748B", border: "#E2E8F0",
};

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState({ isMobile: false, isTablet: false, isDesktop: true, width: 1200 });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setBp({ isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024, width: w });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return bp;
}

// ─── TINY HELPERS ─────────────────────────────────────────────────────────────
const ProgressBar = ({ value, color = C.primary, height = 6 }) => (
  <div style={{ background: "#E2E8F0", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
    <div style={{ width: `${Math.min(value || 0, 100)}%`, height: "100%", background: color, borderRadius: 99, transition: "width .6s ease" }} />
  </div>
);

const Badge = ({ label, color = C.primary }) => (
  <span style={{ background: color + "20", color, fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99, letterSpacing: .3 }}>
    {label}
  </span>
);

const StatCard = ({ icon, label, value, sub, color = C.primary }) => (
  <div style={{ background: C.card, borderRadius: 16, padding: "16px 18px", border: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center" }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const Skeleton = ({ w = "100%", h = 16, r = 8 }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
);

const getAccuracyColor = (pct) => pct >= 80 ? C.green : pct >= 50 ? C.accent : C.red;

function getInitials(name) {
  return name ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '??';
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", id: "dashboard" },
  { icon: "📝", label: "Tests", id: "tests" },
  { icon: "🏆", label: "Leaderboard", id: "leaderboard" },
  { icon: "📊", label: "Results", id: "results" },
  { icon: "👤", label: "Profile", id: "profile" },
];

function Sidebar({ active, onChange, open, onClose, isMobile }) {
  if (isMobile && !open) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }}
        />
      )}
      <div style={{
        width: 220, minHeight: "100vh", background: C.sidebar,
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0,
        zIndex: 100, overflowY: "auto",
        transform: isMobile && !open ? "translateX(-100%)" : "translateX(0)",
        transition: "transform .25s ease",
        boxShadow: isMobile ? "4px 0 24px rgba(0,0,0,0.3)" : "none",
      }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1E3A5F", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✈️</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>DGCA</div>
              <div style={{ color: C.accent, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>MCQ PLATFORM</div>
            </div>
          </div>
          {isMobile && (
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8BA3C5", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
          )}
        </div>
        <div style={{ color: "#8BA3C5", fontSize: 10, padding: "6px 20px 10px", fontStyle: "italic", borderBottom: "1px solid #1E3A5F" }}>Your Flight. Your Future.</div>

        <nav style={{ padding: "10px 10px", flex: 1 }}>
          <div style={{ color: "#4B6785", fontSize: 9, fontWeight: 700, letterSpacing: 1.2, padding: "8px 10px 4px", textTransform: "uppercase" }}>Main Menu</div>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { onChange(item.id); if (isMobile) onClose(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", marginBottom: 2,
                background: active === item.id ? C.primary : "transparent",
                color: active === item.id ? "#fff" : "#8BA3C5", transition: "all .15s"
              }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ margin: "12px", borderRadius: 14, background: "linear-gradient(135deg,#1D4ED8,#7C3AED)", padding: "14px 16px" }}>
          <div style={{ color: C.accent, fontSize: 11, fontWeight: 800, marginBottom: 4 }}>👑 Go Premium</div>
          <div style={{ color: "#CBD5E1", fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>Unlock advanced mock tests & detailed analytics.</div>
          <button style={{ background: "#fff", color: C.primary, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", width: "100%" }}>Upgrade Now →</button>
        </div>
      </div>
    </>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ user, onLogout, onMenuToggle, isMobile, isTablet }) {
  const sidebarWidth = (isMobile || isTablet) ? 0 : 220;
  return (
    <div style={{
      position: "fixed", top: 0, left: sidebarWidth, right: 0, height: 64,
      background: "#fff", borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center",
      padding: isMobile ? "0 16px" : "0 28px", gap: 12, zIndex: 90
    }}>
      {(isMobile || isTablet) && (
        <button onClick={onMenuToggle} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", padding: 4, color: C.text }}>☰</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: C.text }}>Leaderboard</div>
        {!isMobile && <div style={{ fontSize: 11, color: C.muted }}>Home › Leaderboard</div>}
      </div>
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, borderRadius: 10, padding: "8px 14px", border: `1px solid ${C.border}`, flexShrink: 0 }}>
          <span style={{ color: C.muted }}>🔍</span>
          <input placeholder="Search players..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: C.text, width: isTablet ? 120 : 180 }} />
        </div>
      )}
      <div style={{ position: "relative", width: 36, height: 36, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1px solid ${C.border}`, flexShrink: 0 }}>
        🔔
        <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: C.red, borderRadius: "50%", border: "2px solid #fff" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>
          {getInitials(user?.name)}
        </div>
        {!isMobile && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{user?.name || 'Student'}</div>
            <div style={{ fontSize: 10, color: C.muted }}>Student ▾</div>
          </div>
        )}
      </div>
      <button onClick={onLogout} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 8, padding: isMobile ? "7px 10px" : "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
        {isMobile ? "↩" : "Logout"}
      </button>
    </div>
  );
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
      background: C.sidebar, display: "flex", alignItems: "center",
      zIndex: 90, borderTop: "1px solid #1E3A5F", paddingBottom: "env(safe-area-inset-bottom)"
    }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "8px 4px",
            color: active === item.id ? C.accent : "#8BA3C5"
          }}>
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          <span style={{ fontSize: 9, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── LEADERBOARD HOME ─────────────────────────────────────────────────────────
function LeaderboardHome({ user, board, loading, onNav, isMobile, isTablet }) {
  const top3 = board.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : top3;
  const podiumHeights = [120, 160, 100];
  const podiumColors = [C.primary, C.accent, C.purple];
  const medals = ['🥇', '🥈', '🥉'];
  const podiumRanks = top3.length === 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : [0];

  const userRank = board.findIndex(entry => entry.email === user?.email) + 1;
  const userEntry = board.find(entry => entry.email === user?.email);

  const statsGridCols = isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)";

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: `linear-gradient(120deg,${C.sidebar} 0%,#1D4ED8 100%)`,
        borderRadius: isMobile ? 16 : 20, padding: isMobile ? "20px 18px" : "28px 32px",
        marginBottom: 20,
        display: "flex", flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 16 : 0
      }}>
        <div>
          <div style={{ color: "#93C5FD", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>🏆 Rankings & Competition</div>
          <div style={{ color: "#fff", fontSize: isMobile ? 20 : 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
            See How You Rank{!isMobile && <br />} Among Pilots
          </div>
          <div style={{ color: "#93C5FD", fontSize: 12, marginBottom: 16 }}>
            {loading ? "Loading rankings..." : `${board.length} pilots competing · Based on accuracy`}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => onNav("tests")} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📝 Take Test</button>
            <button onClick={() => onNav("dashboard")} style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📊 Dashboard</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: isMobile ? 32 : 42, fontWeight: 900, lineHeight: 1 }}>{userRank || '–'}</div>
            <div style={{ color: "#93C5FD", fontSize: 11 }}>Your Rank</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: isMobile ? 32 : 42, fontWeight: 900, lineHeight: 1 }}>{userEntry?.accuracy || '–'}%</div>
            <div style={{ color: "#93C5FD", fontSize: 11 }}>Accuracy</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: statsGridCols, gap: 12, marginBottom: 20 }}>
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}><Skeleton h={44} /></div>)
          : <>
            <StatCard icon="👥" label="Total Players" value={board.length} color={C.primary} />
            <StatCard icon="🥇" label="Top Score" value={`${board[0]?.accuracy || 0}%`} color={C.accent} />
            <StatCard icon="🎯" label="Avg Accuracy" value={`${Math.round(board.reduce((sum, p) => sum + p.accuracy, 0) / Math.max(board.length, 1))}%`} color={C.green} />
            <StatCard icon="📝" label="Tests Taken" value={board.reduce((sum, p) => sum + p.testsAttempted, 0)} color={C.purple} />
          </>}
      </div>

      {/* Podium */}
      {loading ? (
        <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <Skeleton h={160} />
        </div>
      ) : top3.length >= 2 && (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: isMobile ? "16px 12px" : 24, marginBottom: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 2 }}>🏆 Top Performers</div>
            <div style={{ fontSize: 12, color: C.muted }}>Highest accuracy scores</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: isMobile ? 8 : 16 }}>
            {podiumOrder.map((entry, i) => {
              const rank = podiumRanks[i];
              const isYou = entry.email === user?.email;
              const h = isMobile ? podiumHeights[i] * 0.7 : podiumHeights[i];
              const color = podiumColors[rank];
              const avatarSize = isMobile ? 48 : 60;
              return (
                <div key={entry.email} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: isMobile ? 100 : 140 }}>
                  <div style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, background: `linear-gradient(135deg,${color},${color}dd)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: isMobile ? 13 : 16, marginBottom: 6, border: `3px solid ${isYou ? C.green : '#fff'}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    {getInitials(entry.name)}
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 14, fontWeight: 700, color: C.text, marginBottom: 2, textAlign: "center", wordBreak: "break-word" }}>
                    {entry.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color, marginBottom: 6 }}>{entry.accuracy}%</div>
                  <div style={{ fontSize: isMobile ? 16 : 20, marginBottom: 6 }}>{medals[rank]}</div>
                  <div style={{ width: "100%", height: h, background: color + "20", border: `2px solid ${color}`, borderBottom: "none", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 }}>
                    <span style={{ color, fontSize: isMobile ? 11 : 14, fontWeight: 800 }}>#{rank + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>All Rankings</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.muted }}>Live</span>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? C.accent : C.green }} />
          </div>
        </div>

        <div style={{ padding: "6px 0", overflowX: isMobile ? "auto" : "visible" }}>
          {loading
            ? Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ padding: "12px 18px", borderTop: i > 0 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton w={36} h={36} r={18} />
                <div style={{ flex: 1 }}>
                  <Skeleton h={14} style={{ marginBottom: 4 }} />
                  <Skeleton h={10} w="55%" />
                </div>
                <Skeleton w={50} h={14} />
              </div>
            ))
            : board.map((entry, i) => {
              const isYou = entry.email === user?.email;
              const rank = i + 1;
              return (
                <div key={entry.email} style={{
                  padding: isMobile ? "12px 14px" : "14px 22px",
                  borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                  display: "flex", alignItems: "center", gap: isMobile ? 10 : 14,
                  cursor: "pointer", background: isYou ? C.primaryLight : "transparent",
                  transition: "background .2s",
                }}>
                  {/* Rank badge */}
                  <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: isMobile ? 15 : 18, background: isYou ? `linear-gradient(135deg,${C.primary},${C.purple})` : C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 12 : 13, fontWeight: 700, color: isYou ? "#fff" : C.text, flexShrink: 0 }}>
                    {rank <= 3 ? medals[rank - 1] : `#${rank}`}
                  </div>
                  {/* Avatar */}
                  <div style={{ width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, borderRadius: isMobile ? 17 : 21, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: isMobile ? 11 : 14, flexShrink: 0 }}>
                    {getInitials(entry.name)}
                  </div>
                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 14, color: C.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 100 : "none" }}>{entry.name}</span>
                      {isYou && <Badge label="You" color={C.green} />}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {entry.testsAttempted} tests · {entry.totalScore}/{entry.totalQuestions}
                    </div>
                  </div>
                  {/* Score */}
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: isMobile ? 52 : 72 }}>
                    <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: getAccuracyColor(entry.accuracy), marginBottom: 4 }}>{entry.accuracy}%</div>
                    <ProgressBar value={entry.accuracy} color={getAccuracyColor(entry.accuracy)} height={5} />
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
    getLeaderboard()
      .then(setBoard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = useCallback(() => { clearUser(); router.replace('/login'); }, [router]);

  const handleNav = useCallback((page) => {
    setSidebarOpen(false);
    if (page === 'dashboard') router.push('/dashboard');
    else if (page === 'tests') router.push('/dashboard');
    else if (page === 'results') router.push('/results');
    else if (page === 'profile') router.push('/dashboard');
  }, [router]);

  if (!user) return null;

  const sidebarWidth = isDesktop ? 220 : 0;
  const bottomNavHeight = (isMobile || isTablet) ? 64 : 0;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        * { box-sizing: border-box; }
        @media (max-width: 639px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* Sidebar: always shown on desktop, drawer on mobile/tablet */}
      {isDesktop ? (
        <Sidebar active="leaderboard" onChange={handleNav} open={true} onClose={() => { }} isMobile={false} />
      ) : (
        <Sidebar active="leaderboard" onChange={handleNav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={true} />
      )}

      <TopBar
        user={user}
        onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen(o => !o)}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <main style={{ marginLeft: sidebarWidth, paddingTop: 64, paddingBottom: bottomNavHeight }}>
        <div style={{ padding: isMobile ? "16px 14px" : isTablet ? "20px 20px" : "28px 32px", maxWidth: 1300 }}>
          <LeaderboardHome
            user={user}
            board={board}
            loading={loading}
            onNav={handleNav}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>

        {/* Footer bar — desktop only */}
        {isDesktop && (
          <div style={{ background: C.sidebar, padding: "16px 32px", display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {[
              ["🏆", "Rankings", "Compete"],
              ["🎯", "Accuracy", "Score"],
              ["📊", "Analytics", "Track"],
              ["👨‍🏫", "Support", "Help"],
              ["🎓", "Practice", "Learn"],
              ["📱", "Mobile", "App"]
            ].map(([icon, val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{icon}</div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{val}</div>
                <div style={{ color: "#8BA3C5", fontSize: 10 }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mobile / Tablet bottom nav */}
      {(isMobile || isTablet) && (
        <BottomNav active="leaderboard" onChange={handleNav} />
      )}
    </div>
  );
}