'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearUser, getStats, getResults } from '../../lib/storage';
import { chapters } from '../../data/questions';
import ResourcesPage from './ResourcesPage.jsx'; // ← import the notes component

// ─── COLOUR TOKENS (WeOne Aviation design system) ────────────────────────────
const C = {
  bg: '#F0F4FF',
  sidebar: '#0A1628',
  card: '#FFFFFF',
  primary: '#1D4ED8',
  primaryLight: '#EFF6FF',
  accent: '#F59E0B',
  green: '#10B981',
  red: '#EF4444',
  purple: '#8B5CF6',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '??';
}

function getBadge(stats) {
  if (stats.testsAttempted === 0) return { icon: '🛩️', label: 'Cadet', color: C.muted };
  if (stats.avgScore >= 80) return { icon: '🥇', label: 'Ace Pilot', color: C.accent };
  if (stats.avgScore >= 60) return { icon: '🥈', label: 'Co-Pilot', color: C.muted };
  return { icon: '🥉', label: 'Student Pilot', color: '#cd7f32' };
}

function getScoreColor(pct) {
  if (pct >= 80) return C.green;
  if (pct >= 50) return C.accent;
  return C.red;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── TINY UI COMPONENTS ───────────────────────────────────────────────────────
const ProgressBar = ({ value, color = C.primary, height = 6 }) => (
  <div style={{ background: C.border, borderRadius: 99, height, overflow: 'hidden', width: '100%' }}>
    <div style={{ width: `${Math.min(value || 0, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .6s ease' }} />
  </div>
);

const Badge = ({ label, color = C.primary }) => (
  <span style={{ background: color + '20', color, fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, letterSpacing: 0.3 }}>
    {label}
  </span>
);

const StatCard = ({ icon, label, value, color = C.primary }) => (
  <div style={{ background: C.card, borderRadius: 16, padding: '20px 22px', border: `1px solid ${C.border}`, display: 'flex', gap: 16, alignItems: 'center' }}>
    <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{label}</div>
    </div>
  </div>
);

const Skeleton = ({ w = '100%', h = 16, r = 8 }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
);

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', id: 'home' },
  { icon: '📚', label: 'Chapter Tests', id: 'tests' },
  { icon: '📈', label: 'My Progress', id: 'progress' },
  { icon: '📅', label: 'Live Classes', id: 'classes', badge: 'LIVE' },
  { icon: '🎬', label: 'Lectures', id: 'lectures' },
  { icon: '✏️', label: 'Practice', id: 'practice' },
  { icon: '📝', label: 'Mock Tests', id: 'mocktests' },
  { icon: '🏆', label: 'Leaderboard', id: 'leaderboard' },
  { icon: '📁', label: 'Resources', id: 'resources' },   // ← opens notes
];

function Sidebar({ active, onChange, onLogout, user }) {
  return (
    <div style={{ width: 220, minHeight: '100vh', background: C.sidebar, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: 'auto' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #1E3A5F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✈️</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>DGCA</div>
            <div style={{ color: C.accent, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>PREP</div>
          </div>
        </div>
        <div style={{ color: '#8BA3C5', fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>Your Flight. Our Passion.</div>
      </div>

      {/* User mini-profile */}
      {user && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E3A5F', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {getInitials(user.name)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ color: '#8BA3C5', fontSize: 10 }}>Student</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: '10px 10px', flex: 1 }}>
        <div style={{ color: '#4B6785', fontSize: 9, fontWeight: 700, letterSpacing: 1.2, padding: '8px 10px 4px', textTransform: 'uppercase' }}>Main Menu</div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, background: active === item.id ? C.primary : 'transparent', color: active === item.id ? '#fff' : '#8BA3C5', transition: 'all .15s' }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
            {item.badge && <span style={{ marginLeft: 'auto', background: C.red, color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4 }}>{item.badge}</span>}
          </button>
        ))}
      </nav>

      {/* Upgrade CTA */}
      <div style={{ margin: '12px', borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.purple})`, padding: '14px 16px' }}>
        <div style={{ color: C.accent, fontSize: 11, fontWeight: 800, marginBottom: 4 }}>👑 Go Premium</div>
        <div style={{ color: '#CBD5E1', fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>Unlock all mock tests & 1-on-1 mentoring.</div>
        <button style={{ background: '#fff', color: C.primary, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%' }}>Upgrade Now →</button>
      </div>

      {/* Logout */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1E3A5F' }}>
        <button onClick={onLogout} style={{ width: '100%', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, padding: '8px 0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ user, page, onLeaderboard }) {
  const titles = {
    home: 'Dashboard', tests: 'Chapter Tests', progress: 'My Progress',
    classes: 'Live Classes', lectures: 'Recorded Lectures', practice: 'Practice',
    mocktests: 'Mock Tests', leaderboard: 'Leaderboard',
    resources: 'Air Regulations — Study Notes', // ← updated label
  };
  return (
    <div style={{ position: 'fixed', top: 0, left: 220, right: 0, height: 64, background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, zIndex: 90 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{titles[page] || 'Dashboard'}</div>
        <div style={{ fontSize: 11, color: C.muted }}>Home › {titles[page] || 'Dashboard'}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg, borderRadius: 10, padding: '8px 14px', border: `1px solid ${C.border}` }}>
        <span style={{ color: C.muted }}>🔍</span>
        <input placeholder="Search anything..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: C.text, width: 180 }} />
      </div>
      <button onClick={onLeaderboard} style={{ width: 38, height: 38, borderRadius: 10, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `1px solid ${C.border}`, fontSize: 18 }}>
        🏆
      </button>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {getInitials(user.name)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{user.name}</div>
            <div style={{ fontSize: 10, color: C.muted }}>Student ▾</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOME / OVERVIEW PAGE ─────────────────────────────────────────────────────
function HomePage({ user, stats, recentResults, allResults, loading, onNavigate }) {
  const badge = getBadge(stats);

  function getBestForChapter(chapterId) {
    const rs = allResults.filter(r => r.chapterId === chapterId);
    if (!rs.length) return null;
    return Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0));
  }

  const statCards = [
    { icon: '📋', value: stats.testsAttempted, label: 'Tests Attempted', color: C.primary },
    { icon: '🎯', value: `${stats.avgScore}%`, label: 'Avg Accuracy', color: C.green },
    { icon: '🏆', value: `${stats.bestScore}%`, label: 'Best Score', color: C.accent },
    { icon: '❓', value: stats.totalQuestions, label: 'Questions Done', color: C.purple },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div style={{ background: `linear-gradient(120deg,${C.sidebar} 0%,${C.primary} 100%)`, borderRadius: 20, padding: '28px 32px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#93C5FD', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Welcome back, Pilot 👋</div>
          <div style={{ color: '#fff', fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
            Ready for your next<br />DGCA exam session?
          </div>
          <div style={{ color: '#93C5FD', fontSize: 13, marginBottom: 18 }}>
            {loading ? 'Loading your progress…' : `${stats.testsAttempted} tests done · ${stats.avgScore}% average accuracy`}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onNavigate('tests')} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>📚 Start Test</button>
            <button onClick={() => onNavigate('resources')} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>📁 Study Notes</button>
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ background: badge.color + '25', border: `1px solid ${badge.color}50`, borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>{badge.icon}</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{badge.label}</div>
          </div>
          <div style={{ color: '#93C5FD', fontSize: 11 }}>Your rank badge</div>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}><Skeleton h={48} /></div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {statCards.map((s, i) => <StatCard key={i} icon={s.icon} label={s.label} value={s.value} color={s.color} />)}
        </div>
      )}

      {/* Chapter Tests + Recent Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Chapters */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>📚 Chapter-wise Tests</div>
            <button onClick={() => onNavigate('tests')} style={{ color: C.primary, background: C.primaryLight, border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All →</button>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {loading
              ? Array(6).fill(0).map((_, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 12, padding: 16 }}><Skeleton h={14} /><div style={{ marginTop: 8 }}><Skeleton h={8} /></div></div>
              ))
              : chapters.map(ch => {
                const rs = allResults.filter(r => r.chapterId === ch.id);
                const best = rs.length ? Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0)) : null;
                return (
                  <div key={ch.id} onClick={() => onNavigate('tests', ch.id)}
                    style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', border: `1px solid ${C.border}`, borderLeftWidth: 4, borderLeftColor: ch.color }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 20 }}>{ch.icon}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>→</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 2 }}>{ch.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{ch.questionCount} Questions</div>
                    {best !== null && <div style={{ fontSize: 11, fontWeight: 700, color: getScoreColor(best), marginBottom: 6 }}>Best: {best}%</div>}
                    <ProgressBar value={best ?? 0} color={ch.color} height={4} />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick Notes shortcut card */}
          <div
            onClick={() => onNavigate('resources')}
            style={{ background: `linear-gradient(135deg,#1D4ED8,#7C3AED)`, borderRadius: 16, padding: '18px 20px', cursor: 'pointer' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Air Regulations Notes</div>
            <div style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
              All 28 chapters · Definitions, rules, HF, procedures — structured notes from R.K. Bali.
            </div>
            <div style={{ background: 'rgba(255,255,255,.2)', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, display: 'inline-block' }}>
              Open Notes →
            </div>
          </div>

          {/* Profile mini-card */}
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 14 }}>👤 Your Profile</div>
            {user && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>{getInitials(user.name)}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: C.bg, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: C.primary }}>{stats.testsAttempted}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>Tests Done</div>
                  </div>
                  <div style={{ background: C.bg, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: C.accent }}>{stats.avgScore}%</div>
                    <div style={{ fontSize: 10, color: C.muted }}>Avg Score</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Tests */}
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>📈 Recent Tests</div>
              <button onClick={() => onNavigate('results')} style={{ color: C.primary, background: 'none', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All →</button>
            </div>
            {loading
              ? Array(4).fill(0).map((_, i) => <div key={i} style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}` }}><Skeleton h={14} /></div>)
              : recentResults.length === 0
                ? <div style={{ padding: '30px 18px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No tests attempted yet. Start a chapter test!</div>
                : recentResults.map(r => {
                  const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                  const ch = chapters.find(c => c.id === r.chapterId);
                  return (
                    <div key={r.id} style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: (ch?.color || C.primary) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {ch?.icon ?? '📝'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch?.title ?? r.chapterId}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{formatDate(r.date)}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: getScoreColor(pct), whiteSpace: 'nowrap' }}>
                        {r.score}/{r.total} <span style={{ fontSize: 11, fontWeight: 400 }}>({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHAPTER TESTS PAGE ───────────────────────────────────────────────────────
function ChapterTestsPage({ allResults, onStartTest }) {
  function getBestForChapter(chapterId) {
    const rs = allResults.filter(r => r.chapterId === chapterId);
    if (!rs.length) return null;
    return Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0));
  }

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Chapter-wise Tests</h2>
        <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 13 }}>{chapters.length} chapters available — click to start</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {chapters.map(ch => {
          const best = getBestForChapter(ch.id);
          return (
            <div key={ch.id} onClick={() => onStartTest(ch.id)}
              style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, borderLeft: `4px solid ${ch.color}`, padding: 22, cursor: 'pointer', transition: 'all .2s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${ch.color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: ch.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{ch.icon}</div>
                {best !== null && <Badge label={`${best}%`} color={getScoreColor(best)} />}
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>{ch.title}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{ch.questionCount} Questions</div>
              <ProgressBar value={best ?? 0} color={ch.color} height={6} />
              {best !== null
                ? <div style={{ marginTop: 6, fontSize: 11, color: C.muted }}>Best score: <span style={{ fontWeight: 700, color: getScoreColor(best) }}>{best}%</span></div>
                : <div style={{ marginTop: 6, fontSize: 11, color: C.muted }}>Not attempted yet</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PROGRESS PAGE ────────────────────────────────────────────────────────────
function ProgressPage({ stats, allResults, loading }) {
  const chapterStats = chapters.map(ch => {
    const rs = allResults.filter(r => r.chapterId === ch.id);
    const best = rs.length ? Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0)) : null;
    return { ...ch, best, attempts: rs.length };
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}><Skeleton h={48} /></div>)
          : <>
            <StatCard icon="📊" label="Overall Avg" value={`${stats.avgScore}%`} color={C.primary} />
            <StatCard icon="📋" label="Tests Done" value={stats.testsAttempted} color={C.green} />
            <StatCard icon="🏆" label="Best Score" value={`${stats.bestScore}%`} color={C.accent} />
            <StatCard icon="❓" label="Questions Answered" value={stats.totalQuestions} color={C.purple} />
          </>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 18 }}>Chapter Progress</div>
          {loading
            ? Array(5).fill(0).map((_, i) => <div key={i} style={{ marginBottom: 16 }}><Skeleton h={12} /></div>)
            : chapterStats.map(ch => (
              <div key={ch.id} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{ch.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{ch.title}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: ch.best !== null ? getScoreColor(ch.best) : C.muted }}>
                      {ch.best !== null ? `${ch.best}%` : '—'}
                    </span>
                    <div style={{ fontSize: 10, color: C.muted }}>{ch.attempts} attempt{ch.attempts !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <ProgressBar value={ch.best ?? 0} color={ch.color} height={8} />
              </div>
            ))}
        </div>

        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 18 }}>Performance Overview</div>
          {[
            { label: 'Accuracy Rate', value: stats.avgScore, color: C.primary, icon: '🎯' },
            { label: 'Best Performance', value: stats.bestScore, color: C.green, icon: '🏆' },
            { label: 'Completion Rate', value: Math.min(Math.round((stats.testsAttempted / Math.max(chapters.length, 1)) * 100), 100), color: C.accent, icon: '📋' },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 900, color: item.color }}>{loading ? '…' : `${item.value}%`}</span>
              </div>
              <ProgressBar value={loading ? 0 : item.value} color={item.color} height={10} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PLACEHOLDER (for unbuilt pages) ──────────────────────────────────────────
function Placeholder({ page }) {
  const icons = { classes: '📅', lectures: '🎬', practice: '✏️', mocktests: '📝' };
  const labels = { classes: 'Live Classes', lectures: 'Recorded Lectures', practice: 'Practice', mocktests: 'Mock Tests' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: C.muted, background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 56, marginBottom: 14 }}>{icons[page] || '📄'}</div>
      <div style={{ fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 6 }}>{labels[page] || page}</div>
      <div style={{ fontSize: 13 }}>Coming soon in the full build.</div>
    </div>
  );
}

// ─── ROOT DASHBOARD ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [stats, setStats] = useState({ testsAttempted: 0, avgScore: 0, bestScore: 0, totalQuestions: 0 });
  const [recentResults, setRecent] = useState([]);
  const [allResults, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUserState(u);
    Promise.all([getStats(u.email), getResults(u.email)])
      .then(([s, r]) => { setStats(s); setAll(r); setRecent(r.slice(0, 5)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() { clearUser(); router.replace('/login'); }

  function handleNav(newPage, chapterId) {
    if (newPage === 'results') { router.push('/results'); return; }
    if (newPage === 'leaderboard') { router.push('/leaderboard'); return; }
    if (chapterId) { router.push(`/test/${chapterId}`); return; }
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPage() {
    switch (page) {
      case 'tests': return <ChapterTestsPage allResults={allResults} onStartTest={id => router.push(`/test/${id}`)} />;
      case 'progress': return <ProgressPage stats={stats} allResults={allResults} loading={loading} />;
      case 'resources': return <ResourcesPage />;   // ← NOTES WIRED HERE
      case 'classes':
      case 'lectures':
      case 'practice':
      case 'mocktests': return <Placeholder page={page} />;
      default: return (
        <HomePage
          user={user} stats={stats} recentResults={recentResults}
          allResults={allResults} loading={loading} onNavigate={handleNav}
        />
      );
    }
  }

  if (!user) return null;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.bg, minHeight: '100vh' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        * { box-sizing: border-box; }
        button:hover { opacity: .9; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `}</style>

      <Sidebar active={page} onChange={handleNav} onLogout={handleLogout} user={user} />
      <TopBar user={user} page={page} onLeaderboard={() => router.push('/leaderboard')} />

      <main style={{ marginLeft: 220, paddingTop: 64 }}>
        {/* Resources gets full height, others get padded container */}
        {page === 'resources' ? (
          <div style={{ padding: '20px 28px' }}>
            <ResourcesPage />
          </div>
        ) : (
          <div style={{ padding: '28px 32px', maxWidth: 1300 }}>
            {renderPage()}
          </div>
        )}
      </main>

      {/* Footer stats bar */}
      <div style={{ marginLeft: 220, background: C.sidebar, padding: '16px 32px', display: 'flex', justifyContent: 'space-around' }}>
        {[
          ['📋', `${stats.testsAttempted}`, 'Tests Taken'],
          ['🎯', `${stats.avgScore}%`, 'Avg Accuracy'],
          ['🏆', `${stats.bestScore}%`, 'Best Score'],
          ['❓', `${stats.totalQuestions}`, 'Questions Done'],
          ['📚', `${chapters.length}`, 'Chapters'],
          ['✈️', '24/7', 'DGCA Prep'],
        ].map(([icon, val, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16 }}>{icon}</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{val}</div>
            <div style={{ color: '#8BA3C5', fontSize: 10 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}