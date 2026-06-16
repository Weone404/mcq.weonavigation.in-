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

// ─── SUBJECT → COLOUR MAP ─────────────────────────────────────────────────────
const SUBJECT_COLORS = {
  "Meteorology":    "#0EA5E9",
  "Navigation":     "#8B5CF6",
  "Air Regulations":"#10B981",
  "Technical General": "#F59E0B",
  "Radio Navigation":  "#EF4444",
  "General Navigation":"#6366F1",
  "Instrument Navigation": "#EC4899",
};
const subjectColor = (subject) =>
  SUBJECT_COLORS[subject] || C.primary;

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

// ─── CHAPTER TAG ─────────────────────────────────────────────────────────────
const ChapterTag = ({ subject, chapter, accuracy, tests }) => {
  const color = subjectColor(subject);
  const accColor = getAccuracyColor(accuracy);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: color + "12",
      border: `1px solid ${color}35`,
      borderRadius: 8, padding: "3px 8px",
      maxWidth: 260,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: color, flexShrink: 0,
      }} />
      <span style={{ fontSize: 10, color, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>
        {subject}
      </span>
      <span style={{ color: C.border, fontSize: 9 }}>›</span>
      <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>
        {chapter}
      </span>
      <span style={{
        marginLeft: 2, fontSize: 9, fontWeight: 800,
        color: accColor,
        background: accColor + "18",
        borderRadius: 5, padding: "1px 5px", whiteSpace: "nowrap",
      }}>
        {accuracy}%
      </span>
      {tests !== undefined && (
        <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>
          ·{tests}t
        </span>
      )}
    </div>
  );
};

// ─── EXPANDABLE SUBJECT BREAKDOWN (used inside table rows) ────────────────────
function SubjectBreakdownPanel({ breakdown, isMobile }) {
  const [expanded, setExpanded] = useState(false);
  if (!breakdown?.length) return null;

  const preview = breakdown.slice(0, isMobile ? 1 : 2);
  const rest = breakdown.slice(isMobile ? 1 : 2);

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {preview.map((s, i) => (
          <ChapterTag key={i} subject={s.subject} chapter={s.chapter} accuracy={s.accuracy} tests={s.tests} />
        ))}
        {rest.length > 0 && !expanded && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            style={{
              fontSize: 9, fontWeight: 700, color: C.primary,
              background: C.primaryLight, border: `1px solid ${C.primary}30`,
              borderRadius: 8, padding: "3px 8px", cursor: "pointer",
            }}
          >
            +{rest.length} more
          </button>
        )}
        {expanded && rest.map((s, i) => (
          <ChapterTag key={i + preview.length} subject={s.subject} chapter={s.chapter} accuracy={s.accuracy} tests={s.tests} />
        ))}
        {expanded && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            style={{
              fontSize: 9, fontWeight: 700, color: C.muted,
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "3px 8px", cursor: "pointer",
            }}
          >
            less ▲
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SUBJECT ACCURACY MINI-CHART (used in expanded row detail) ────────────────
function SubjectAccuracyBars({ breakdown }) {
  if (!breakdown?.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
      {breakdown.map((s, i) => {
        const color = subjectColor(s.subject);
        const accColor = getAccuracyColor(s.accuracy);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 130, fontSize: 11, color: C.muted, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, marginRight: 5, verticalAlign: "middle" }} />
              {s.subject}
            </div>
            <div style={{ flex: 1 }}>
              <ProgressBar value={s.accuracy} color={accColor} height={7} />
            </div>
            <div style={{ width: 38, fontSize: 11, fontWeight: 800, color: accColor, textAlign: "right", flexShrink: 0 }}>
              {s.accuracy}%
            </div>
            <div style={{ width: 28, fontSize: 10, color: C.muted, textAlign: "right", flexShrink: 0 }}>
              {s.tests}t
            </div>
          </div>
        );
      })}
    </div>
  );
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
function TopBar({ user, onLogout, onMenuToggle, isMobile, isTablet, searchQuery, onSearchChange }) {
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
          <input
            placeholder="Search players..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: C.text, width: isTablet ? 120 : 180 }}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
          )}
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
function LeaderboardHome({ user, board, loading, onNav, isMobile, isTablet, searchQuery }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState("All");

  // collect all unique subjects across board
  const allSubjects = ["All", ...Array.from(new Set(
    board.flatMap(e => (e.subjectBreakdown || []).map(s => s.subject))
  ))];

  // filter board by search + subject
  const filtered = board.filter(entry => {
    const matchName = !searchQuery || entry.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = subjectFilter === "All" || (entry.subjectBreakdown || []).some(s => s.subject === subjectFilter);
    return matchName && matchSubject;
  });

  const top3 = board.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : top3;
  const podiumHeights = [120, 160, 100];
  const podiumColors = [C.primary, C.accent, C.purple];
  const medals = ['🥇', '🥈', '🥉'];
  const podiumRanks = top3.length === 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : [0];

  const userRankIdx = board.findIndex(entry => entry.email === user?.email);
  const userRank = userRankIdx >= 0 ? userRankIdx + 1 : null;
  const userEntry = userRankIdx >= 0 ? board[userRankIdx] : null;

  // user's strongest subject
  const userStrongest = userEntry?.subjectBreakdown?.length
    ? [...userEntry.subjectBreakdown].sort((a, b) => b.accuracy - a.accuracy)[0]
    : null;

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
        <div style={{ display: "flex", gap: isMobile ? 16 : 24, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: isMobile ? 32 : 42, fontWeight: 900, lineHeight: 1 }}>{userRank || '–'}</div>
            <div style={{ color: "#93C5FD", fontSize: 11 }}>Your Rank</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: isMobile ? 32 : 42, fontWeight: 900, lineHeight: 1 }}>{userEntry?.accuracy ?? '–'}{userEntry ? '%' : ''}</div>
            <div style={{ color: "#93C5FD", fontSize: 11 }}>Accuracy</div>
          </div>
          {userStrongest && !isMobile && (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{userStrongest.subject}</div>
              <div style={{ color: C.accent, fontSize: 11, marginTop: 2 }}>⭐ Strongest Subject</div>
            </div>
          )}
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
              const topSubject = entry.subjectBreakdown?.length
                ? [...entry.subjectBreakdown].sort((a, b) => b.accuracy - a.accuracy)[0]
                : null;
              return (
                <div key={entry.email} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: isMobile ? 100 : 150 }}>
                  <div style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, background: `linear-gradient(135deg,${color},${color}dd)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: isMobile ? 13 : 16, marginBottom: 6, border: `3px solid ${isYou ? C.green : '#fff'}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    {getInitials(entry.name)}
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color: C.text, marginBottom: 2, textAlign: "center", wordBreak: "break-word" }}>
                    {entry.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color, marginBottom: 2 }}>{entry.accuracy}%</div>
                  {/* Strongest subject pill on podium */}
                  {topSubject && !isMobile && (
                    <div style={{
                      fontSize: 9, fontWeight: 700, marginBottom: 6,
                      background: subjectColor(topSubject.subject) + "18",
                      color: subjectColor(topSubject.subject),
                      border: `1px solid ${subjectColor(topSubject.subject)}35`,
                      borderRadius: 6, padding: "2px 7px", textAlign: "center",
                      maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      ⭐ {topSubject.subject}
                    </div>
                  )}
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

      {/* Subject Filter Pills */}
      {!loading && allSubjects.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {allSubjects.map(subj => {
            const active = subjectFilter === subj;
            const color = subj === "All" ? C.primary : subjectColor(subj);
            return (
              <button key={subj} onClick={() => setSubjectFilter(subj)} style={{
                fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 99,
                border: `1.5px solid ${active ? color : C.border}`,
                background: active ? color : C.card,
                color: active ? "#fff" : C.muted,
                cursor: "pointer", transition: "all .15s",
              }}>
                {subj === "All" ? "All Subjects" : subj}
                {subj !== "All" && (
                  <span style={{ marginLeft: 4, opacity: .7 }}>
                    ({board.filter(e => (e.subjectBreakdown || []).some(s => s.subject === subj)).length})
                  </span>
                )}
              </button>
            );
          })}
          {searchQuery && (
            <div style={{ fontSize: 11, color: C.muted, alignSelf: "center", marginLeft: 4 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Rankings Table */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>
            All Rankings
            {subjectFilter !== "All" && (
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: subjectColor(subjectFilter) }}>
                — {subjectFilter}
              </span>
            )}
          </div>
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
            : filtered.length === 0
              ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: C.muted }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>No players found</div>
                  <div style={{ fontSize: 12 }}>Try a different name or subject filter</div>
                </div>
              )
              : filtered.map((entry, i) => {
                const globalRank = board.findIndex(e => e.email === entry.email) + 1;
                const isYou = entry.email === user?.email;
                const isExpanded = expandedRow === entry.email;
                const medals = ['🥇', '🥈', '🥉'];
                // strongest subject for this entry
                const strongest = entry.subjectBreakdown?.length
                  ? [...entry.subjectBreakdown].sort((a, b) => b.accuracy - a.accuracy)[0]
                  : null;

                return (
                  <div key={entry.email}>
                    {/* Main row */}
                    <div
                      onClick={() => setExpandedRow(isExpanded ? null : entry.email)}
                      style={{
                        padding: isMobile ? "12px 14px" : "14px 22px",
                        borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                        display: "flex", alignItems: "flex-start", gap: isMobile ? 10 : 14,
                        cursor: "pointer",
                        background: isYou ? C.primaryLight : isExpanded ? "#F8FAFF" : "transparent",
                        transition: "background .2s",
                      }}>
                      {/* Rank badge */}
                      <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: isMobile ? 15 : 18, background: isYou ? `linear-gradient(135deg,${C.primary},${C.purple})` : C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 12 : 13, fontWeight: 700, color: isYou ? "#fff" : C.text, flexShrink: 0, marginTop: 2 }}>
                        {globalRank <= 3 ? medals[globalRank - 1] : `#${globalRank}`}
                      </div>

                      {/* Avatar */}
                      <div style={{ width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, borderRadius: isMobile ? 17 : 21, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: isMobile ? 11 : 14, flexShrink: 0, marginTop: 2 }}>
                        {getInitials(entry.name)}
                      </div>

                      {/* Name + meta + chapters */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 14, color: C.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 100 : "none" }}>{entry.name}</span>
                          {isYou && <Badge label="You" color={C.green} />}
                          {strongest && (
                            <Badge label={`⭐ ${strongest.subject}`} color={subjectColor(strongest.subject)} />
                          )}
                        </div>

                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          {entry.testsAttempted} tests · {entry.totalScore}/{entry.totalQuestions}
                          {entry.lastTestChapter && (
                            <span style={{ marginLeft: 6 }}>· 📖 Last: <span style={{ color: C.text, fontWeight: 600 }}>{entry.lastTestChapter}</span></span>
                          )}
                        </div>

                        {/* Chapter tags — desktop shows inline, mobile shows last chapter only */}
                        {!isMobile && entry.subjectBreakdown?.length > 0 && (
                          <SubjectBreakdownPanel breakdown={entry.subjectBreakdown} isMobile={isMobile} />
                        )}

                        {isMobile && entry.subjectBreakdown?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                            <ChapterTag
                              subject={entry.subjectBreakdown[0].subject}
                              chapter={entry.subjectBreakdown[0].chapter}
                              accuracy={entry.subjectBreakdown[0].accuracy}
                            />
                            {entry.subjectBreakdown.length > 1 && (
                              <span style={{ fontSize: 9, color: C.muted, alignSelf: "center" }}>+{entry.subjectBreakdown.length - 1}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score + expand toggle */}
                      <div style={{ textAlign: "right", flexShrink: 0, minWidth: isMobile ? 52 : 72 }}>
                        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: getAccuracyColor(entry.accuracy), marginBottom: 4 }}>{entry.accuracy}%</div>
                        <ProgressBar value={entry.accuracy} color={getAccuracyColor(entry.accuracy)} height={5} />
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{isExpanded ? "▲ less" : "▼ detail"}</div>
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div style={{
                        borderTop: `1px solid ${C.border}`,
                        background: "#F8FAFF",
                        padding: isMobile ? "14px 14px 14px 14px" : "16px 22px 16px 80px",
                        borderBottom: i < filtered.length - 1 ? `2px solid ${C.primaryLight}` : "none",
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                          📊 Subject-wise Performance
                        </div>
                        {entry.subjectBreakdown?.length > 0 ? (
                          <>
                            <SubjectAccuracyBars breakdown={entry.subjectBreakdown} />
                            {/* Chapter details table */}
                            <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 60px 40px" : "1fr 120px 60px 60px", background: C.bg, padding: "7px 12px", fontSize: 10, fontWeight: 700, color: C.muted, gap: 8 }}>
                                <div>CHAPTER</div>
                                {!isMobile && <div>SUBJECT</div>}
                                <div style={{ textAlign: "center" }}>ACC</div>
                                <div style={{ textAlign: "center" }}>TESTS</div>
                              </div>
                              {entry.subjectBreakdown.map((s, idx) => (
                                <div key={idx} style={{
                                  display: "grid",
                                  gridTemplateColumns: isMobile ? "1fr 60px 40px" : "1fr 120px 60px 60px",
                                  padding: "9px 12px", gap: 8,
                                  borderTop: `1px solid ${C.border}`,
                                  background: idx % 2 === 0 ? "#fff" : "#FAFBFF",
                                  alignItems: "center",
                                }}>
                                  <div style={{ fontSize: 11, color: C.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: subjectColor(s.subject), marginRight: 5, verticalAlign: "middle" }} />
                                    {s.chapter}
                                  </div>
                                  {!isMobile && (
                                    <div style={{ fontSize: 10, color: subjectColor(s.subject), fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {s.subject}
                                    </div>
                                  )}
                                  <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: getAccuracyColor(s.accuracy) }}>
                                    {s.accuracy}%
                                  </div>
                                  <div style={{ textAlign: "center", fontSize: 11, color: C.muted }}>
                                    {s.tests}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: C.muted }}>No chapter data available yet.</div>
                        )}
                      </div>
                    )}
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
  const [searchQuery, setSearchQuery] = useState('');
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

      {isDesktop ? (
        <Sidebar active="leaderboard" onChange={handleNav} open={true} onClose={() => {}} isMobile={false} />
      ) : (
        <Sidebar active="leaderboard" onChange={handleNav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={true} />
      )}

      <TopBar
        user={user}
        onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen(o => !o)}
        isMobile={isMobile}
        isTablet={isTablet}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
            searchQuery={searchQuery}
          />
        </div>

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

      {(isMobile || isTablet) && (
        <BottomNav active="leaderboard" onChange={handleNav} />
      )}
    </div>
  );
}