'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser, getResults } from '../../lib/storage';
import { chapters } from '../../data/questions';

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

const getScoreColor = (pct) => pct >= 80 ? C.green : pct >= 50 ? C.accent : C.red;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
function TopBar({ user, onLogout, search, onSearchChange, filter, onFilterChange }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 220, right: 0, height: 64, background: "#fff", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 28px", gap: 16, zIndex: 90 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Test Results</div>
        <div style={{ fontSize: 11, color: C.muted }}>Home › Results</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, borderRadius: 10, padding: "8px 14px", border: `1px solid ${C.border}` }}>
        <span style={{ color: C.muted }}>🔍</span>
        <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search results..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: C.text, width: 180 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {["All", "This Month", "This Week"].map(period => (
          <button key={period} onClick={() => onFilterChange(period)}
            style={{ background: filter === period ? C.primary : C.bg, color: filter === period ? "#fff" : C.text, border: `1px solid ${filter === period ? C.primary : C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>
            {period}
          </button>
        ))}
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

// ─── RESULTS HOME ─────────────────────────────────────────────────────────────
function ResultsHome({ user, results, loading, latestScore, latestTotal, latestChapterId, onNav, search, onSearchChange, filter, onFilterChange }) {
  const latestPct = latestScore && latestTotal ? Math.round((Number(latestScore) / Number(latestTotal)) * 100) : null;
  const latestChapter = latestChapterId ? chapters.find(c => c.id === latestChapterId) : null;

  function getLatestEmoji(pct) { return pct >= 80 ? '🏆' : pct >= 50 ? '✈️' : '📚'; }

  // Filter results based on search and filter
  const filteredResults = results.filter(r => {
    const ch = chapters.find(c => c.id === r.chapterId);
    const matchesSearch = !search || (ch?.title || r.chapterId).toLowerCase().includes(search.toLowerCase());
    const date = new Date(r.date);
    const now = new Date();
    let matchesFilter = true;
    if (filter === "This Month") {
      matchesFilter = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (filter === "This Week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesFilter = date >= weekAgo;
    }
    return matchesSearch && matchesFilter;
  });

  const totalTests = filteredResults.length;
  const avgScore = totalTests > 0 ? Math.round(filteredResults.reduce((sum, r) => sum + (r.total > 0 ? Math.round((r.score / r.total) * 100) : 0), 0) / totalTests) : 0;
  const bestScore = totalTests > 0 ? Math.max(...filteredResults.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0)) : 0;
  const totalQuestions = filteredResults.reduce((sum, r) => sum + r.total, 0);

  return (
    <div>
      {latestPct !== null && latestChapter && (
        <div style={{ background: `linear-gradient(120deg,${C.sidebar} 0%,#1D4ED8 100%)`, borderRadius: 20, padding: "28px 32px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 48 }}>{getLatestEmoji(latestPct)}</div>
            <div>
              <div style={{ color: "#93C5FD", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Latest Test Result</div>
              <div style={{ color: "#fff", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{latestChapter.icon} {latestChapter.title}</div>
              <div style={{ color: "#93C5FD", fontSize: 13, marginBottom: 8 }}>{formatDate(new Date().toISOString())}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ color: "#fff", fontSize: 32, fontWeight: 900 }}>{latestScore}/{latestTotal}</div>
                <div style={{ color: getScoreColor(latestPct), fontSize: 28, fontWeight: 800 }}>{latestPct}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}><Skeleton h={48} /></div>)
          : <>
            <StatCard icon="📝" label="Total Tests" value={totalTests} color={C.primary} />
            <StatCard icon="🎯" label="Avg Score" value={`${avgScore}%`} color={C.green} />
            <StatCard icon="🏆" label="Best Score" value={`${bestScore}%`} color={C.accent} />
            <StatCard icon="❓" label="Questions" value={totalQuestions} color={C.purple} />
          </>}
      </div>

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>Test History</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.muted }}>{filteredResults.length} test{filteredResults.length !== 1 ? "s" : ""} found</span>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? C.accent : C.green }} />
          </div>
        </div>

        <div style={{ padding: "8px 0" }}>
          {loading
            ? Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ padding: "14px 22px", borderTop: i > 0 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <Skeleton w={36} h={36} r={18} />
                <div style={{ flex: 1 }}>
                  <Skeleton h={16} style={{ marginBottom: 4 }} />
                  <Skeleton h={12} w="60%" />
                </div>
                <Skeleton w={60} h={16} />
              </div>
            ))
            : filteredResults.length === 0 ? (
              <div style={{ padding: "40px 22px", textAlign: "center", color: C.muted }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>No test results found</div>
                <div style={{ fontSize: 14, marginBottom: 20 }}>Try adjusting your search or filter criteria.</div>
                <button onClick={() => onNav("dashboard")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Take Your First Test →</button>
              </div>
            ) : (
              filteredResults.map(r => {
                const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                const ch = chapters.find(c => c.id === r.chapterId);
                return (
                  <div key={r.id} style={{ padding: "14px 22px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background .2s" }}
                    onMouseEnter={(e) => e.target.style.background = C.bg} onMouseLeave={(e) => e.target.style.background = "transparent"}>
                    <div style={{ width: 42, height: 42, borderRadius: 21, background: (ch?.color || C.primary) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {ch?.icon || '📝'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 2 }}>{ch?.title || r.chapterId}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{formatDate(r.date)}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: getScoreColor(pct), marginBottom: 4 }}>{r.score}/{r.total}</div>
                      <div style={{ fontSize: 12, color: getScoreColor(pct), fontWeight: 600 }}>{pct}%</div>
                      <ProgressBar value={pct} color={getScoreColor(pct)} height={4} />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onNav(`test/${r.chapterId}`); }} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Retry</button>
                  </div>
                );
              })
            )
          }
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const latestScore = searchParams.get('score');
  const latestTotal = searchParams.get('total');
  const latestChapterId = searchParams.get('chapter');

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
    getResults(u.email)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => { clearUser(); router.replace('/login'); };

  const handleNav = (page) => {
    if (page.startsWith('test/')) {
      router.push(`/${page}`);
    } else if (page === 'dashboard') {
      router.push('/dashboard');
    } else if (page === 'leaderboard') {
      router.push('/leaderboard');
    }
  };

  if (!user) return null;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <Sidebar active="results" onChange={handleNav} />
      <TopBar user={user} onLogout={handleLogout} search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} />
      <main style={{ marginLeft: 220, paddingTop: 64 }}>
        <div style={{ padding: "28px 32px", maxWidth: 1300 }}>
          <ResultsHome user={user} results={results} loading={loading} latestScore={latestScore} latestTotal={latestTotal} latestChapterId={latestChapterId} onNav={handleNav} search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} />
        </div>
      </main>
      <div style={{ marginLeft: 220, background: C.sidebar, padding: "16px 32px", display: "flex", justifyContent: "space-around" }}>
        {[
          ["📊", "Analytics", "Track"],
          ["📈", "Progress", "Monitor"],
          ["🎯", "Accuracy", "Improve"],
          ["👨‍🏫", "Support", "Help"],
          ["📱", "Mobile", "Access"],
          ["⚡", "Fast", "Results"]
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

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontFamily: 'system-ui' }}>
        Loading results...
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
