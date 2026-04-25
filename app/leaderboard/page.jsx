'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getLeaderboard } from '../../lib/storage';

// ─── COLOUR TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#F0F4FF", sidebar: "#0A1628", card: "#FFFFFF",
  primary: "#1D4ED8", primaryLight: "#EFF6FF",
  accent: "#F59E0B", green: "#10B981", red: "#EF4444", purple: "#8B5CF6",
  text: "#0F172A", muted: "#64748B", border: "#E2E8F0",
};

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
  <div style={{ background: C.card, borderRadius: 16, padding: "20px 22px", border: `1px solid ${C.border}`, display: "flex", gap: 16, alignItems: "center" }}>
    <div style={{ width: 48, height: 48, borderRadius: 14, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{label}</div>
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

function Sidebar({ active, onChange }) {
  return (
    <div style={{ width: 220, minHeight: "100vh", background: C.sidebar, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: "auto" }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1E3A5F" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✈️</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>DGCA</div>
            <div style={{ color: C.accent, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>MCQ PLATFORM</div>
          </div>
        </div>
        <div style={{ color: "#8BA3C5", fontSize: 10, marginTop: 6, fontStyle: "italic" }}>Your Flight. Your Future.</div>
      </div>

      <nav style={{ padding: "10px 10px", flex: 1 }}>
        <div style={{ color: "#4B6785", fontSize: 9, fontWeight: 700, letterSpacing: 1.2, padding: "8px 10px 4px", textTransform: "uppercase" }}>Main Menu</div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)}
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
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ user, onLogout }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 220, right: 0, height: 64, background: "#fff", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 28px", gap: 16, zIndex: 90 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Leaderboard</div>
        <div style={{ fontSize: 11, color: C.muted }}>Home › Leaderboard</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, borderRadius: 10, padding: "8px 14px", border: `1px solid ${C.border}` }}>
        <span style={{ color: C.muted }}>🔍</span>
        <input placeholder="Search players..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: C.text, width: 180 }} />
      </div>
      <div style={{ position: "relative", width: 38, height: 38, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1px solid ${C.border}` }}>
        🔔
        <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: C.red, borderRadius: "50%", border: "2px solid #fff" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
          {getInitials(user?.name)}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{user?.name || 'Student'}</div>
          <div style={{ fontSize: 10, color: C.muted }}>Student ▾</div>
        </div>
      </div>
      <button onClick={onLogout} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Logout</button>
    </div>
  );
}

// ─── LEADERBOARD HOME ─────────────────────────────────────────────────────────
function LeaderboardHome({ user, board, loading, onNav }) {
  const top3 = board.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : top3;
  const podiumHeights = [120, 160, 100];
  const podiumColors = [C.primary, C.accent, C.purple];
  const medals = ['🥇', '🥈', '🥉'];
  const podiumRanks = top3.length === 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : [0];

  const userRank = board.findIndex(entry => entry.email === user?.email) + 1;
  const userEntry = board.find(entry => entry.email === user?.email);

  return (
    <div>
      <div style={{ background: `linear-gradient(120deg,${C.sidebar} 0%,#1D4ED8 100%)`, borderRadius: 20, padding: "28px 32px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#93C5FD", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🏆 Rankings & Competition</div>
          <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>See How You Rank<br />Among Pilots</div>
          <div style={{ color: "#93C5FD", fontSize: 13, marginBottom: 18 }}>
            {loading ? "Loading rankings..." : `${board.length} pilots competing · Rankings based on accuracy`}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => onNav("tests")} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📝 Take Test</button>
            <button onClick={() => onNav("dashboard")} style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📊 Dashboard</button>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#fff", fontSize: 42, fontWeight: 900 }}>{userRank || '–'}</div>
          <div style={{ color: "#93C5FD", fontSize: 12 }}>Your Rank</div>
          <div style={{ marginTop: 8, color: "#fff", fontSize: 32, fontWeight: 900 }}>{userEntry?.accuracy || '–'}%</div>
          <div style={{ color: "#93C5FD", fontSize: 12 }}>Your Accuracy</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}><Skeleton h={48} /></div>)
          : <>
            <StatCard icon="👥" label="Total Players" value={board.length} color={C.primary} />
            <StatCard icon="🥇" label="Top Score" value={`${board[0]?.accuracy || 0}%`} color={C.accent} />
            <StatCard icon="🎯" label="Avg Accuracy" value={`${Math.round(board.reduce((sum, p) => sum + p.accuracy, 0) / Math.max(board.length, 1))}%`} color={C.green} />
            <StatCard icon="📝" label="Tests Taken" value={board.reduce((sum, p) => sum + p.testsAttempted, 0)} color={C.purple} />
          </>}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 24 }}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: "center" }}>
              <Skeleton w={60} h={60} r={30} style={{ margin: "0 auto 12px" }} />
              <Skeleton h={16} style={{ marginBottom: 8 }} />
              <Skeleton h={20} style={{ marginBottom: 4 }} />
              <Skeleton h={12} w="60%" style={{ margin: "0 auto" }} />
            </div>
          ))}
        </div>
      ) : top3.length >= 2 && (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, marginBottom: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>🏆 Top Performers</div>
            <div style={{ fontSize: 13, color: C.muted }}>Highest accuracy scores</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 16 }}>
            {podiumOrder.map((entry, i) => {
              const rank = podiumRanks[i];
              const isYou = entry.email === user?.email;
              const h = podiumHeights[i];
              const color = podiumColors[rank];
              return (
                <div key={entry.email} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: 140 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 30, background: `linear-gradient(135deg,${color},${color}dd)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 8, border: `3px solid ${isYou ? C.green : '#fff'}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    {getInitials(entry.name)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4, textAlign: "center" }}>{entry.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color, marginBottom: 8 }}>{entry.accuracy}%</div>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{medals[rank]}</div>
                  <div style={{ width: "100%", height: h, background: color + "20", border: `2px solid ${color}`, borderBottom: "none", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 8 }}>
                    <span style={{ color, fontSize: 14, fontWeight: 800 }}>#{rank + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>All Rankings</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.muted }}>Live rankings</span>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? C.accent : C.green }} />
          </div>
        </div>

        <div style={{ padding: "8px 0" }}>
          {loading
            ? Array(8).fill(0).map((_, i) => (
              <div key={i} style={{ padding: "14px 22px", borderTop: i > 0 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <Skeleton w={36} h={36} r={18} />
                <div style={{ flex: 1 }}>
                  <Skeleton h={16} style={{ marginBottom: 4 }} />
                  <Skeleton h={12} w="60%" />
                </div>
                <Skeleton w={60} h={16} />
              </div>
            ))
            : board.map((entry, i) => {
              const isYou = entry.email === user?.email;
              const rank = i + 1;
              return (
                <div key={entry.email} onClick={() => { }} style={{ padding: "14px 22px", borderTop: i > 0 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background .2s", background: isYou ? C.primaryLight : "transparent" }}
                  onMouseEnter={(e) => !isYou && (e.target.style.background = C.bg)} onMouseLeave={(e) => !isYou && (e.target.style.background = "transparent")}>
                  <div style={{ width: 36, height: 36, borderRadius: 18, background: isYou ? `linear-gradient(135deg,${C.primary},${C.purple})` : C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: isYou ? "#fff" : C.text, flexShrink: 0 }}>
                    {rank <= 3 ? medals[rank - 1] : `#${rank}`}
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 21, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                    {getInitials(entry.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                      {entry.name}
                      {isYou && <Badge label="You" color={C.green} />}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{entry.testsAttempted} tests · {entry.totalScore}/{entry.totalQuestions} correct</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: getAccuracyColor(entry.accuracy), marginBottom: 4 }}>{entry.accuracy}%</div>
                    <ProgressBar value={entry.accuracy} color={getAccuracyColor(entry.accuracy)} height={6} />
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
    if (page === 'dashboard') router.push('/dashboard');
    else if (page === 'tests') router.push('/dashboard');
    else if (page === 'results') router.push('/results');
    else if (page === 'profile') router.push('/dashboard');
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <Sidebar active="leaderboard" onChange={handleNav} />
      <TopBar user={user} onLogout={handleLogout} />
      <main style={{ marginLeft: 220, paddingTop: 64 }}>
        <div style={{ padding: "28px 32px", maxWidth: 1300 }}>
          <LeaderboardHome user={user} board={board} loading={loading} onNav={handleNav} />
        </div>
      </main>
      <div style={{ marginLeft: 220, background: C.sidebar, padding: "16px 32px", display: "flex", justifyContent: "space-around" }}>
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
    </div>
  );
}
