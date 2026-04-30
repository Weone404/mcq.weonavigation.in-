'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearUser, getStats, getResults } from '../../lib/storage';
import { chapters } from '../../data/questions';
import LecturesPage from './LecturesPage.jsx';
import ResourcesPage from './ResourcesPage.jsx';

// ─── COLOUR TOKENS ─────────────────────────────────────────────────────────────
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

// ─── SUBJECTS CONFIG ───────────────────────────────────────────────────────────
const SUBJECTS = [
  {
    id: 'air_regulations',
    title: 'Air Regulations',
    subtitle: 'ICAO, DGCA, National Law & Procedures',
    icon: '📋',
    color: '#1D4ED8',
    gradient: 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
    parts: [
      { label: 'Part I – Air Regulations', color: '#1D4ED8' },
      { label: 'Part II – Human Factors', color: '#8B5CF6' },
    ],
    chapterIds: [
      'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10',
      'ch11', 'ch12', 'ch13', 'ch14', 'ch15', 'ch16', 'ch17', 'ch18', 'ch19', 'ch20',
      'ch21', 'ch22', 'ch23', 'ch24', 'ch25', 'ch26',
    ],
    stats: '26 Chapters · 200+ MCQs',
    exam: 'ATPL / CPL / DGCA',
  },
  {
    id: 'meteorology',
    title: 'Meteorology',
    subtitle: 'Weather, Clouds, Pressure Systems',
    icon: '🌦️',
    color: '#0EA5E9',
    gradient: 'linear-gradient(135deg,#0EA5E9,#38BDF8)',
    parts: [],
    chapterIds: [],
    stats: 'Coming Soon',
    exam: 'ATPL / CPL',
    locked: true,
  },
  {
    id: 'navigation',
    title: 'Navigation',
    subtitle: 'Charts, VOR, ILS, RNAV',
    icon: '🗺️',
    color: '#10B981',
    gradient: 'linear-gradient(135deg,#10B981,#34D399)',
    parts: [],
    chapterIds: [],
    stats: 'Coming Soon',
    exam: 'ATPL / CPL',
    locked: true,
  },
  {
    id: 'technical',
    title: 'Technical General',
    subtitle: 'Airframes, Engines, Systems',
    icon: '🔧',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
    parts: [],
    chapterIds: [],
    stats: 'Coming Soon',
    exam: 'AME / ATPL',
    locked: true,
  },
  {
    id: 'rtfm',
    title: 'Radio Telephony',
    subtitle: 'RTF Procedures & Phraseology',
    icon: '📻',
    color: '#EF4444',
    gradient: 'linear-gradient(135deg,#EF4444,#F87171)',
    parts: [],
    chapterIds: [],
    stats: 'Coming Soon',
    exam: 'RTR (Aero)',
    locked: true,
  },
  {
    id: 'mock',
    title: 'Mock Test',
    subtitle: 'Full DGCA-style 50Q paper',
    icon: '🎯',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
    parts: [],
    chapterIds: [],
    stats: '50 Questions · 60 Mins',
    exam: 'All Exams',
    isMock: true,
  },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────
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

// ─── TINY UI ──────────────────────────────────────────────────────────────────
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
  { icon: '📁', label: 'Resources', id: 'resources' },
];

function Sidebar({ active, onChange, onLogout, user }) {
  return (
    <div style={{ width: 220, minHeight: '100vh', background: C.sidebar, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: 'auto' }}>
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

      <div style={{ margin: '12px', borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.purple})`, padding: '14px 16px' }}>
        <div style={{ color: C.accent, fontSize: 11, fontWeight: 800, marginBottom: 4 }}>👑 Go Premium</div>
        <div style={{ color: '#CBD5E1', fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>Unlock all mock tests & 1-on-1 mentoring.</div>
        <button style={{ background: '#fff', color: C.primary, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%' }}>Upgrade Now →</button>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #1E3A5F' }}>
        <button onClick={onLogout} style={{ width: '100%', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, padding: '8px 0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ user, page, subPage, onLeaderboard }) {
  const base = { home: 'Dashboard', tests: 'Tests', progress: 'My Progress', classes: 'Live Classes', lectures: 'Recorded Lectures', practice: 'Practice', mocktests: 'Mock Tests', leaderboard: 'Leaderboard', resources: 'Study Notes' };
  const sub = { subject: 'Air Regulations', chapters: 'Select Chapter', mock: 'Mock Test' };
  const title = sub[subPage] || base[page] || 'Dashboard';
  return (
    <div style={{ position: 'fixed', top: 0, left: 220, right: 0, height: 64, background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, zIndex: 90 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{title}</div>
        <div style={{ fontSize: 11, color: C.muted }}>
          Home › {base[page]}
          {subPage === 'subject' && ' › Air Regulations'}
          {subPage === 'chapters' && ' › Air Regulations › Chapters'}
          {subPage === 'mock' && ' › Mock Test'}
        </div>
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

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ user, stats, recentResults, allResults, loading, onNavigate }) {
  const badge = getBadge(stats);
  const statCards = [
    { icon: '📋', value: stats.testsAttempted, label: 'Tests Attempted', color: C.primary },
    { icon: '🎯', value: `${stats.avgScore}%`, label: 'Avg Accuracy', color: C.green },
    { icon: '🏆', value: `${stats.bestScore}%`, label: 'Best Score', color: C.accent },
    { icon: '❓', value: stats.totalQuestions, label: 'Questions Done', color: C.purple },
  ];
  return (
    <div>
      {/* Hero */}
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

      {/* Stat cards */}
      {loading
        ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>{Array(4).fill(0).map((_, i) => <div key={i} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}><Skeleton h={48} /></div>)}</div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {statCards.map((s, i) => <StatCard key={i} icon={s.icon} label={s.label} value={s.value} color={s.color} />)}
        </div>}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>📚 Chapter-wise Tests</div>
            <button onClick={() => onNavigate('tests')} style={{ color: C.primary, background: C.primaryLight, border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All →</button>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {loading
              ? Array(6).fill(0).map((_, i) => <div key={i} style={{ background: C.bg, borderRadius: 12, padding: 16 }}><Skeleton h={14} /></div>)
              : chapters.slice(0, 8).map(ch => {
                const rs = allResults.filter(r => r.chapterId === ch.id);
                const best = rs.length ? Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0)) : null;
                return (
                  <div key={ch.id} onClick={() => onNavigate('tests', ch.id)}
                    style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', border: `1px solid ${C.border}`, borderLeft: `4px solid ${ch.color || C.primary}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 20 }}>{ch.icon}</span><span style={{ fontSize: 11, color: C.muted }}>→</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 2 }}>{ch.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{ch.questionCount || 10} Questions</div>
                    {best !== null && <div style={{ fontSize: 11, fontWeight: 700, color: getScoreColor(best), marginBottom: 6 }}>Best: {best}%</div>}
                    <ProgressBar value={best ?? 0} color={ch.color || C.primary} height={4} />
                  </div>
                );
              })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div onClick={() => onNavigate('resources')} style={{ background: `linear-gradient(135deg,#1D4ED8,#7C3AED)`, borderRadius: 16, padding: '18px 20px', cursor: 'pointer' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Air Regulations Notes</div>
            <div style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>All 26 chapters · Definitions, rules, HF, procedures.</div>
            <div style={{ background: 'rgba(255,255,255,.2)', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, display: 'inline-block' }}>Open Notes →</div>
          </div>

          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 14 }}>👤 Your Profile</div>
            {user && <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>{getInitials(user.name)}</div>
                <div><div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{user.name}</div><div style={{ fontSize: 11, color: C.muted }}>{user.email}</div></div>
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
            </>}
          </div>

          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>📈 Recent Tests</div>
            </div>
            {loading
              ? Array(4).fill(0).map((_, i) => <div key={i} style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}` }}><Skeleton h={14} /></div>)
              : recentResults.length === 0
                ? <div style={{ padding: '30px 18px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No tests yet. Start a chapter test!</div>
                : recentResults.map(r => {
                  const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                  const ch = chapters.find(c => c.id === r.chapterId);
                  return (
                    <div key={r.id} style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: (ch?.color || C.primary) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{ch?.icon ?? '📝'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch?.title ?? r.chapterId}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{formatDate(r.date)}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: getScoreColor(pct), whiteSpace: 'nowrap' }}>{r.score}/{r.total} <span style={{ fontSize: 11, fontWeight: 400 }}>({pct}%)</span></div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUBJECT SELECTOR (step 1 of tests flow) ──────────────────────────────────
function SubjectSelector({ allResults, onSelectSubject, onMockTest }) {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Select a Subject</h2>
        <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 13 }}>Choose a subject below to start chapter-wise tests or a full mock test.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
        {SUBJECTS.map(sub => {
          // Compute stats for this subject
          const subChapters = chapters.filter(c => sub.chapterIds.includes(c.id));
          const attempted = subChapters.filter(c => allResults.some(r => r.chapterId === c.id)).length;
          const allPcts = allResults
            .filter(r => sub.chapterIds.includes(r.chapterId) && r.total > 0)
            .map(r => Math.round((r.score / r.total) * 100));
          const avgPct = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : 0;

          return (
            <div key={sub.id}
              onClick={() => sub.locked ? null : sub.isMock ? onMockTest() : onSelectSubject(sub.id)}
              style={{
                background: C.card, borderRadius: 20, border: `1px solid ${C.border}`,
                overflow: 'hidden', cursor: sub.locked ? 'not-allowed' : 'pointer',
                opacity: sub.locked ? 0.6 : 1,
                transition: 'all .2s', position: 'relative',
              }}
              onMouseEnter={e => { if (!sub.locked) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${sub.color}25`; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>

              {/* Coloured top strip */}
              <div style={{ background: sub.gradient, padding: '22px 22px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{sub.icon}</div>
                  {sub.locked
                    ? <span style={{ background: 'rgba(0,0,0,.3)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>🔒 Coming Soon</span>
                    : sub.isMock
                      ? <span style={{ background: 'rgba(255,255,255,.3)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>🎯 Full Paper</span>
                      : attempted > 0
                        ? <span style={{ background: 'rgba(255,255,255,.3)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{attempted}/{subChapters.length} done</span>
                        : <span style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>Not started</span>}
                </div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginTop: 14, marginBottom: 4 }}>{sub.title}</div>
                <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12 }}>{sub.subtitle}</div>
              </div>

              {/* Body */}
              <div style={{ padding: '16px 22px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{sub.stats}</span>
                  <span style={{ fontSize: 11, background: sub.color + '15', color: sub.color, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>{sub.exam}</span>
                </div>

                {/* Part tags */}
                {sub.parts.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {sub.parts.map(p => (
                      <span key={p.label} style={{ fontSize: 10, background: p.color + '15', color: p.color, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{p.label}</span>
                    ))}
                  </div>
                )}

                {/* Progress bar (only if not locked/mock) */}
                {!sub.locked && !sub.isMock && subChapters.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>Avg Score</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: avgPct > 0 ? getScoreColor(avgPct) : C.muted }}>{avgPct > 0 ? `${avgPct}%` : '—'}</span>
                    </div>
                    <ProgressBar value={avgPct} color={sub.color} height={6} />
                  </div>
                )}

                <button style={{
                  marginTop: 14, width: '100%', padding: '10px 0',
                  background: sub.locked ? C.border : sub.gradient,
                  color: sub.locked ? C.muted : '#fff',
                  border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: sub.locked ? 'not-allowed' : 'pointer',
                }}>
                  {sub.locked ? '🔒 Coming Soon' : sub.isMock ? '🎯 Start Mock Test →' : '📚 View Chapters →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CHAPTER LIST (step 2 – after picking Air Regulations) ────────────────────
function AirRegChapterList({ allResults, onStartTest, onBack }) {
  const [search, setSearch] = useState('');

  // Group chapters by part
  const parts = [
    { label: 'Part I – Air Regulations', color: C.primary, ids: ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10', 'ch11', 'ch12', 'ch13', 'ch14', 'ch15', 'ch16', 'ch17', 'ch18', 'ch19', 'ch20', 'ch21', 'ch22'] },
    { label: 'Part II – Human Factors', color: C.purple, ids: ['ch23', 'ch24', 'ch25', 'ch26'] },
  ];

  function getBest(chapterId) {
    const rs = allResults.filter(r => r.chapterId === chapterId);
    if (!rs.length) return null;
    return Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0));
  }

  const filtered = chapters.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={onBack}
          style={{ width: 40, height: 40, borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>📋 Air Regulations</h2>
          <p style={{ margin: '3px 0 0', color: C.muted, fontSize: 13 }}>
            {chapters.length} chapters · R.K. Bali 16th Ed (2024) · Click a chapter to start MCQ test
          </p>
        </div>

        {/* Search */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: C.card, borderRadius: 10, padding: '8px 14px', border: `1px solid ${C.border}` }}>
          <span style={{ color: C.muted }}>🔍</span>
          <input
            placeholder="Search chapters…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: C.text, width: 160 }}
          />
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { icon: '📚', val: chapters.length, label: 'Total Chapters' },
          { icon: '✅', val: chapters.filter(c => allResults.some(r => r.chapterId === c.id)).length, label: 'Attempted' },
          { icon: '🎯', val: (() => { const ps = allResults.filter(r => chapters.find(c => c.id === r.chapterId) && r.total > 0).map(r => Math.round((r.score / r.total) * 100)); return ps.length ? Math.round(ps.reduce((a, b) => a + b) / ps.length) + '%' : '—'; })(), label: 'Avg Score' },
          { icon: '🏆', val: (() => { const ps = allResults.filter(r => chapters.find(c => c.id === r.chapterId) && r.total > 0).map(r => Math.round((r.score / r.total) * 100)); return ps.length ? Math.max(...ps) + '%' : '—'; })(), label: 'Best Score' },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, borderRadius: 12, padding: '12px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: C.text, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Parts */}
      {parts.map(part => {
        const partChapters = filtered.filter(c => part.ids.includes(c.id));
        if (!partChapters.length) return null;
        return (
          <div key={part.label} style={{ marginBottom: 32 }}>
            {/* Part header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ height: 3, width: 28, borderRadius: 99, background: part.color }} />
              <span style={{ fontWeight: 800, fontSize: 15, color: part.color }}>{part.label}</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: 12, color: C.muted }}>{partChapters.length} chapters</span>
            </div>

            {/* Chapter cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {partChapters.map((ch, idx) => {
                const best = getBest(ch.id);
                const attempts = allResults.filter(r => r.chapterId === ch.id).length;
                const chNum = ch.id.replace('ch', '');

                return (
                  <div key={ch.id}
                    onClick={() => onStartTest(ch.id)}
                    style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, borderLeft: `4px solid ${part.color}`, padding: 20, cursor: 'pointer', transition: 'all .2s', position: 'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${part.color}20`; e.currentTarget.style.borderColor = part.color; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.borderLeftColor = part.color; }}>

                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: part.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                          {ch.icon}
                        </div>
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: part.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800 }}>
                          {chNum}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {best !== null
                          ? <Badge label={`${best}%`} color={getScoreColor(best)} />
                          : <span style={{ fontSize: 11, color: C.muted, background: C.bg, padding: '2px 8px', borderRadius: 20 }}>New</span>}
                      </div>
                    </div>

                    {/* Title */}
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>{ch.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                      {ch.part} · {attempts} attempt{attempts !== 1 ? 's' : ''}
                    </div>

                    {/* Progress */}
                    <ProgressBar value={best ?? 0} color={part.color} height={5} />
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: best !== null ? getScoreColor(best) : C.muted, fontWeight: best !== null ? 700 : 400 }}>
                        {best !== null ? `Best: ${best}%` : 'Not attempted'}
                      </span>
                      <span style={{ fontSize: 11, color: part.color, fontWeight: 700 }}>Start →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MOCK TEST PAGE ───────────────────────────────────────────────────────────
// Picks 50 random questions from all chapters and runs a 60-min timed test.
function MockTestPage({ onBack, user }) {
  const router = useRouter();
  const TOTAL_TIME = 3600; // 60 min
  const TOTAL_Q = 50;

  // ── build question pool once ──
  const [pool] = useState(() => {
    // lazy-import questions
    try {
      const { questions: allQ } = require('../../data/questions');
      let pool = [];
      Object.values(allQ).forEach(arr => pool.push(...arr));
      // shuffle + pick 50
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, TOTAL_Q);
    } catch { return []; }
  });

  const [screen, setScreen] = useState('intro');   // intro | test | finish
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const timerRef = useState(null);

  // timer
  useEffect(() => {
    if (screen !== 'test') return;
    timerRef[0] = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef[0]); setScreen('finish'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef[0]);
  }, [screen]);

  function handleAnswer(idx) {
    if (answers[currentQ] !== undefined) return;
    setAnswers(prev => ({ ...prev, [currentQ]: idx }));
  }
  function submit() { clearInterval(timerRef[0]); setScreen('finish'); }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct = timeLeft / TOTAL_TIME;
  const tColor = pct > 0.4 ? C.primary : pct > 0.15 ? C.purple : C.red;
  const circ = 2 * Math.PI * 22;

  const score = pool.reduce((a, q, i) => a + (answers[i] === q.correct ? 1 : 0), 0);
  const scorePct = pool.length ? Math.round((score / pool.length) * 100) : 0;
  const answered = Object.keys(answers).length;
  const notAnswered = pool.length - Object.keys(answers).length;
  const wrong = pool.length - score - notAnswered;

  function getDotState(i) {
    if (screen === 'finish') {
      if (answers[i] === undefined) return 'unanswered';
      return answers[i] === pool[i]?.correct ? 'correct' : 'wrong';
    }
    if (i === currentQ) return 'active';
    if (answers[i] !== undefined) return answers[i] === pool[i]?.correct ? 'correct' : 'wrong';
    return 'default';
  }

  // ── INTRO SCREEN ──
  if (screen === 'intro') return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <button onClick={onBack} style={{ marginBottom: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: C.text }}>← Back to Tests</button>
      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: '36px 32px', textAlign: 'center', boxShadow: `0 8px 32px ${C.primary}10` }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: C.text }}>DGCA Mock Test</h2>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Full-length paper combining all Air Regulations & Human Factors topics.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          {[['❓', '50 Questions'], ['⏱️', '60 Minutes'], ['📚', 'All Chapters'], ['💡', 'Instant Results']].map(([icon, label]) => (
            <span key={label} style={{ background: C.primaryLight, color: C.primary, border: `1px solid ${C.primary}30`, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{icon} {label}</span>
          ))}
        </div>
        <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Each question has 4 options — choose the best answer', 'Once answered, selection cannot be changed', 'Test auto-submits when the timer reaches zero', 'Score summary shown at the end with chapter analysis'].map(r => (
            <li key={r} style={{ background: C.bg, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.text }}>✔ {r}</li>
          ))}
        </ul>
        <button onClick={() => setScreen('test')}
          style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg,${C.primary},${C.purple})`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
          🚀 Start Mock Test →
        </button>
        <button onClick={onBack} style={{ marginTop: 10, width: '100%', padding: '11px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted, fontSize: 13, cursor: 'pointer' }}>
          ← Back to Subjects
        </button>
      </div>
    </div>
  );

  // ── TEST SCREEN ──
  if (screen === 'test') {
    const q = pool[currentQ];
    const selected = answers[currentQ];
    const isAnswered = selected !== undefined;
    return (
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 64, zIndex: 80, background: 'rgba(255,255,255,.97)', borderBottom: `1px solid ${C.border}`, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', color: C.text, fontSize: 13, cursor: 'pointer' }}>← Exit</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>🎯 Mock Test</span>
            <span style={{ fontSize: 12, color: C.muted }}>{answered}/{pool.length} answered</span>
          </div>
          {/* Circular timer */}
          <div style={{ position: 'relative', width: 52, height: 52 }}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke={C.border} strokeWidth="4" />
              <circle cx="26" cy="26" r="22" fill="none" stroke={tColor} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} transform="rotate(-90 26 26)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke .5s' }} />
            </svg>
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 10, fontWeight: 800, color: tColor }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: C.border, borderRadius: 99, marginBottom: 20 }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / pool.length) * 100}%`, background: C.primary, borderRadius: 99, transition: 'width .3s' }} />
        </div>

        {/* Question dots */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {pool.map((_, i) => {
            const ds = getDotState(i);
            const bg = ds === 'correct' ? C.primary : ds === 'wrong' ? C.red : ds === 'active' ? C.primaryLight : C.card;
            const co = ds === 'correct' || ds === 'wrong' ? '#fff' : ds === 'active' ? C.primary : C.muted;
            const br = ds === 'active' ? `2px solid ${C.primary}` : `1px solid ${C.border}`;
            return (
              <button key={i} onClick={() => setCurrentQ(i)}
                style={{ width: 32, height: 32, borderRadius: 8, border: br, background: bg, color: co, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question card */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '24px 28px', marginBottom: 16, boxShadow: `0 4px 16px ${C.primary}08` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: .8 }}>Question {currentQ + 1} of {pool.length}</span>
            {q && <span style={{ fontSize: 11, background: C.primaryLight, color: C.primary, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
              Ch {q.id?.split('_')[0]?.replace('ch', '') || '?'}
            </span>}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, lineHeight: 1.6, marginBottom: 20 }}>{q?.question}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q?.options.map((opt, idx) => {
              let bg = C.bg, border = `1px solid ${C.border}`, color = C.text;
              if (isAnswered) {
                if (idx === q.correct) { bg = '#EFF6FF'; border = `1px solid ${C.primary}`; color = C.primary; }
                else if (idx === selected && selected !== q.correct) { bg = '#FEF2F2'; border = `1px solid ${C.red}`; color = C.red; }
                else { bg = C.bg; color = C.muted; }
              }
              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={isAnswered}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: bg, border, borderRadius: 12, padding: '13px 16px', cursor: isAnswered ? 'default' : 'pointer', textAlign: 'left', color, fontSize: 14, transition: 'all .15s', fontWeight: isAnswered && idx === q.correct ? 700 : 400 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: isAnswered && idx === q.correct ? C.primary : isAnswered && idx === selected && selected !== q.correct ? C.red : `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: isAnswered && (idx === q.correct || (idx === selected && selected !== q.correct)) ? '#fff' : C.primary, flexShrink: 0 }}>
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {isAnswered && idx === q.correct && <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>✓ Correct</span>}
                  {isAnswered && idx === selected && selected !== q.correct && <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>✗ Wrong</span>}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div style={{ marginTop: 16, background: '#EFF6FF', border: `1px solid ${C.primary}30`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: C.primary, marginBottom: 4 }}>💡 Explanation</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{q?.explanation}</div>
            </div>
          )}
        </div>

        {/* Nav row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setCurrentQ(c => c - 1)} disabled={currentQ === 0}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', color: C.text, fontSize: 13, cursor: currentQ === 0 ? 'not-allowed' : 'pointer', opacity: currentQ === 0 ? .4 : 1 }}>
            ← Previous
          </button>
          <span style={{ fontSize: 12, color: C.muted }}>{answered}/{pool.length} answered</span>
          {currentQ === pool.length - 1
            ? <button onClick={submit} style={{ background: `linear-gradient(135deg,${C.accent},#D97706)`, border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit Test ✓</button>
            : <button onClick={() => setCurrentQ(c => c + 1)} style={{ background: C.primaryLight, border: `1px solid ${C.primary}30`, borderRadius: 10, padding: '10px 20px', color: C.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Next →</button>}
        </div>
      </div>
    );
  }

  // ── FINISH SCREEN ──
  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: '36px 32px', textAlign: 'center', boxShadow: `0 8px 32px ${C.primary}15` }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{scorePct >= 80 ? '🏆' : scorePct >= 50 ? '✈️' : '📚'}</div>
        <h2 style={{ margin: '0 0 6px', fontWeight: 900, fontSize: 22, color: C.text }}>{scorePct >= 80 ? 'Excellent!' : scorePct >= 50 ? 'Good Effort!' : 'Keep Practicing!'}</h2>
        <div style={{ fontSize: 48, fontWeight: 900, color: getScoreColor(scorePct), lineHeight: 1 }}>{score}/{pool.length}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(scorePct), marginBottom: 24 }}>{scorePct}%</div>

        {/* 3-way breakdown */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
          {[
            { icon: '✓', val: score, label: 'Correct', bg: '#EFF6FF', co: C.primary, br: `${C.primary}40` },
            { icon: '✗', val: wrong, label: 'Wrong', bg: '#FEF2F2', co: C.red, br: `${C.red}40` },
            { icon: '–', val: notAnswered, label: 'Not Answered', bg: '#F5F3FF', co: C.purple, br: `${C.purple}40` },
          ].map(b => (
            <div key={b.label} style={{ flex: 1, background: b.bg, border: `1px solid ${b.br}`, borderRadius: 14, padding: '14px 10px' }}>
              <div style={{ fontSize: 20, color: b.co }}>{b.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>{b.val}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{b.label}</div>
            </div>
          ))}
        </div>

        {/* Dot legend */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 12 }}>
          {[['#1D4ED8', 'Correct'], ['#EF4444', 'Wrong'], ['rgba(139,92,246,.4)', 'Not Answered']].map(([bg, label]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: bg, display: 'inline-block', border: `1px solid ${bg}` }} />
              {label}
            </span>
          ))}
        </div>

        {/* Dots grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {pool.map((_, i) => {
            const ds = getDotState(i);
            const bg = ds === 'correct' ? C.primary : ds === 'wrong' ? C.red : ds === 'unanswered' ? 'rgba(139,92,246,.3)' : C.bg;
            const co = ds === 'correct' || ds === 'wrong' ? '#fff' : ds === 'unanswered' ? C.purple : C.muted;
            return (
              <span key={i} title={`Q${i + 1}`} style={{ width: 28, height: 28, borderRadius: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: bg, color: co, border: `1px solid ${C.border}` }}>
                {i + 1}
              </span>
            );
          })}
        </div>

        <button onClick={onBack} style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg,${C.primary},${C.purple})`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 10 }}>
          Back to Tests
        </button>
        <button onClick={() => { setAnswers({}); setCurrentQ(0); setTimeLeft(TOTAL_TIME); setScreen('intro'); }}
          style={{ width: '100%', padding: '11px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted, fontSize: 13, cursor: 'pointer' }}>
          ↺ Retry Mock Test
        </button>
      </div>
    </div>
  );
}

// ─── CHAPTER TESTS PAGE (top-level controller) ────────────────────────────────
function ChapterTestsPage({ allResults, onStartTest }) {
  // subView: 'subjects' | 'air_regulations' | 'mock'
  const [subView, setSubView] = useState('subjects');

  if (subView === 'air_regulations') {
    return (
      <AirRegChapterList
        allResults={allResults}
        onStartTest={onStartTest}
        onBack={() => setSubView('subjects')}
      />
    );
  }
  if (subView === 'mock') {
    return (
      <MockTestPage
        onBack={() => setSubView('subjects')}
      />
    );
  }
  return (
    <SubjectSelector
      allResults={allResults}
      onSelectSubject={id => { if (id === 'air_regulations') setSubView('air_regulations'); }}
      onMockTest={() => setSubView('mock')}
    />
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
                <ProgressBar value={ch.best ?? 0} color={ch.color || C.primary} height={8} />
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
  const [subPage, setSubPage] = useState('');   // tracks nested state for TopBar breadcrumb

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
    setSubPage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPage() {
    switch (page) {
      case 'tests':
        return (
          <ChapterTestsPage
            allResults={allResults}
            onStartTest={id => router.push(`/test/${id}`)}
          />
        );
      case 'progress': return <ProgressPage stats={stats} allResults={allResults} loading={loading} />;
      case 'resources': return <ResourcesPage />;
      case 'classes':
      case 'lectures': return <LecturesPage user={user} />;
      case 'practice':
      case 'mocktests': return <Placeholder page={page} />;
      default:
        return (
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
        button:hover { opacity:.9; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
        ::-webkit-scrollbar-thumb:hover { background:#94A3B8; }
      `}</style>

      <Sidebar active={page} onChange={handleNav} onLogout={handleLogout} user={user} />
      <TopBar user={user} page={page} subPage={subPage} onLeaderboard={() => router.push('/leaderboard')} />

      <main style={{ marginLeft: 220, paddingTop: 64 }}>
        {page === 'resources'
          ? <div style={{ padding: '20px 28px' }}><ResourcesPage /></div>
          : <div style={{ padding: '28px 32px', maxWidth: 1300 }}>{renderPage()}</div>
        }
      </main>

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