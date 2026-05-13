'use client';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearUser, getStats, getResults } from '../../lib/storage';
import { chapters, questions as allQuestions } from '../../data/questions';
import LecturesPage from './LecturesPage.jsx';
import ResourcesPage from './ResourcesPage.jsx';
import DoubtChat from '../../components/DoubtChat/page.jsx';

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

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState({ isMobile: false, isTablet: false, isDesktop: true, width: 1200 });
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setBp({
        isMobile: w < 640,
        isTablet: w >= 640 && w < 1024,
        isDesktop: w >= 1024,
        width: w,
      });
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return bp;
}

// ─── SHUFFLE HELPER ────────────────────────────────────────────────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMockPool(count = 50, subjectChapterIds = null) {
  let pool = [];
  if (subjectChapterIds && subjectChapterIds.length > 0) {
    subjectChapterIds.forEach(id => {
      if (allQuestions[id]) pool.push(...allQuestions[id]);
    });
  } else {
    Object.values(allQuestions).forEach(arr => pool.push(...arr));
  }
  if (pool.length === 0) return [];
  return shuffleArray(pool).slice(0, Math.min(count, pool.length));
}

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
      { label: 'Part I – Air Regulations', color: '#1D4ED8', chapterIds: ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10', 'ch11', 'ch12', 'ch13', 'ch14', 'ch15', 'ch16', 'ch17', 'ch18', 'ch19', 'ch20', 'ch21', 'ch22'] },
      { label: 'Part II – Human Factors', color: '#8B5CF6', chapterIds: ['ch23', 'ch24', 'ch25', 'ch26'] },
      { label: 'Part III – QB Extra', color: '#0EA5E9', chapterIds: ['qb01', 'qb02', 'qb03', 'qb04', 'qb05', 'qb06', 'qb07', 'qb08', 'qb09', 'qb10', 'qb11', 'qb12', 'qb13'] },
    ],
    chapterIds: [
      'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10',
      'ch11', 'ch12', 'ch13', 'ch14', 'ch15', 'ch16', 'ch17', 'ch18', 'ch19', 'ch20',
      'ch21', 'ch22', 'ch23', 'ch24', 'ch25', 'ch26',
      'qb01', 'qb02', 'qb03', 'qb04', 'qb05', 'qb06', 'qb07', 'qb08', 'qb09', 'qb10', 'qb11', 'qb12', 'qb13',
    ],
    stats: '39 Chapters · 500+ MCQs',
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
    stats: '10 Chapters · 150+ MCQs',
    exam: 'ATPL / CPL',
    // comingSoon: true,
  },
  {
    id: 'navigation',
    title: 'Navigation',
    subtitle: 'Charts, VOR, ILS, RNAV',
    icon: '🗺️',
    color: '#10B981',
    gradient: 'linear-gradient(135deg,#10B981,#34D399)',
    parts: [
      { label: 'Part I – General Navigation', color: '#10B981', chapterIds: ['gn01', 'gn02', 'gn03', 'gn04', 'gn05', 'gn06', 'gn07', 'gn08', 'gn09', 'gn10'] },
      { label: 'Part II – Radio Navigation', color: '#059669', chapterIds: ['rn01', 'rn02', 'rn03', 'rn04', 'rn05', 'rn06', 'rn07', 'rn08', 'rn09', 'rn10'] },
    ],
    chapterIds: [
      'gn01', 'gn02', 'gn03', 'gn04', 'gn05', 'gn06', 'gn07', 'gn08', 'gn09', 'gn10',
      'rn01', 'rn02', 'rn03', 'rn04', 'rn05', 'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
    ],
    stats: '20 Chapters · 400+ MCQs',
    exam: 'ATPL / CPL',
  },
  {
    id: 'technical',
    title: 'Technical General',
    subtitle: 'Airframes, Engines, Systems',
    icon: '🔧',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
    parts: [
      { label: 'Part I – Aerodynamics & Structures', color: '#F59E0B', chapterIds: ['tg01', 'tg02'] },
      { label: 'Part II – Engines & Propellers', color: '#D97706', chapterIds: ['tg03', 'tg04'] },
      { label: 'Part III – Aircraft Systems', color: '#B45309', chapterIds: ['tg05', 'tg06', 'tg07', 'tg08'] },
    ],
    chapterIds: ['tg01', 'tg02', 'tg03', 'tg04', 'tg05', 'tg06', 'tg07', 'tg08'],
    stats: '8 Chapters · 200+ MCQs',
    exam: 'AME / ATPL',
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
    stats: '8 Chapters · 120+ MCQs',
    exam: 'RTR (Aero)',
    // comingSoon: true,
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
    stats: '100 Questions · 120 Mins',
    exam: 'All Exams',
    isMock: true,
  },
];

const MOCK_ALL_OPTION = {
  id: 'all',
  title: 'All Subjects',
  subtitle: 'Mixed questions from every chapter',
  icon: '🎯',
  color: '#8B5CF6',
  gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
  chapterIds: [
    'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10',
    'ch11', 'ch12', 'ch13', 'ch14', 'ch15', 'ch16', 'ch17', 'ch18', 'ch19', 'ch20',
    'ch21', 'ch22', 'ch23', 'ch24', 'ch25', 'ch26',
    'qb01', 'qb02', 'qb03', 'qb04', 'qb05', 'qb06', 'qb07', 'qb08', 'qb09', 'qb10', 'qb11', 'qb12', 'qb13',
    'gn01', 'gn02', 'gn03', 'gn04', 'gn05', 'gn06', 'gn07', 'gn08', 'gn09', 'gn10',
    'rn01', 'rn02', 'rn03', 'rn04', 'rn05', 'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
    'tg01', 'tg02', 'tg03', 'tg04', 'tg05', 'tg06', 'tg07', 'tg08',
  ],
  stats: '100 questions · all chapters combined',
  exam: 'All Exams',
};

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
    <div style={{
      width: `${Math.min(value || 0, 100)}%`,
      height: '100%',
      background: color,
      borderRadius: 99,
      WebkitTransition: 'width .6s ease',
      transition: 'width .6s ease',
    }} />
  </div>
);

const Badge = ({ label, color = C.primary }) => (
  <span style={{
    background: hexAlpha(color, 0.13),
    color,
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 9px',
    borderRadius: 99,
    letterSpacing: 0.3,
    display: 'inline-block',
  }}>{label}</span>
);

const StatCard = ({ icon, label, value, color = C.primary }) => (
  <div style={{
    background: C.card,
    borderRadius: 16,
    padding: '16px 18px',
    border: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
  }}>
    <div style={{
      width: 44,
      height: 44,
      borderRadius: 12,
      background: hexAlpha(color, 0.08),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20,
      flexShrink: 0,
      marginRight: 12,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{label}</div>
    </div>
  </div>
);

const Skeleton = ({ w = '100%', h = 16, r = 8 }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)',
    backgroundSize: '200% 100%',
    WebkitAnimation: 'shimmer 1.4s infinite',
    animation: 'shimmer 1.4s infinite',
  }} />
);

// ─── COMING SOON PLACEHOLDER ──────────────────────────────────────────────────
function ComingSoonPage({ subject, onBack }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 480,
      background: C.card,
      borderRadius: 20,
      border: `1px solid ${C.border}`,
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20, marginBottom: 20,
        background: subject.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 38,
        boxShadow: `0 8px 32px ${hexAlpha(subject.color, 0.25)}`,
      }}>{subject.icon}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 8 }}>{subject.title}</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, maxWidth: 360, lineHeight: 1.7 }}>
        {subject.subtitle} — this subject is being prepared by our content team.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
        {[['📅', 'Launching Soon'], ['✍️', 'MCQs in Progress'], ['🎯', subject.exam]].map(([icon, label]) => (
          <span key={label} style={{
            background: hexAlpha(subject.color, 0.08),
            color: subject.color,
            border: `1px solid ${hexAlpha(subject.color, 0.18)}`,
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            margin: '0 6px 6px 0', display: 'inline-block',
          }}>{icon} {label}</span>
        ))}
      </div>
      <button onClick={onBack} style={{
        background: subject.gradient, color: '#fff', border: 'none', borderRadius: 12,
        padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        WebkitAppearance: 'none', appearance: 'none',
      }}>← Back to Subjects</button>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', id: 'home' },
  { icon: '📚', label: 'Subject Tests', id: 'tests' },
  { icon: '🤖', label: 'AI Doubt Chat', id: 'doubt' },
  { icon: '📈', label: 'My Progress', id: 'progress' },
  { icon: '📅', label: 'Live Classes', id: 'classes', badge: 'LIVE' },
  { icon: '🎬', label: 'Lectures', id: 'lectures' },
  { icon: '✏️', label: 'Practice', id: 'practice' },
  { icon: '📝', label: 'Mock Tests', id: 'mocktests' },
  { icon: '🏆', label: 'Leaderboard', id: 'leaderboard' },
  { icon: '📁', label: 'Resources', id: 'resources' },
];

function Sidebar({ active, onChange, onLogout, user, isOpen, onClose, isMobile }) {
  return (
    <>
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, WebkitTapHighlightColor: 'transparent',
          }}
        />
      )}
      <div style={{
        width: 220,
        minHeight: '100vh',
        background: C.sidebar,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        WebkitTransform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        WebkitTransition: 'transform .25s ease',
        transition: 'transform .25s ease',
        boxShadow: isMobile && isOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #1E3A5F' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0, marginRight: 10,
              }}>
                <img
                  src="/Logo.webp"
                  alt="DGCA Prep Logo"
                  style={{ width: 28, height: 28, objectFit: 'contain' }}
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span style="font-size:18px">✈️</span>';
                  }}
                />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>DGCA</div>
                <div style={{ color: C.accent, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>PREP</div>
              </div>
            </div>
            {isMobile && (
              <button onClick={onClose} style={{
                background: 'transparent', border: 'none', color: '#8BA3C5',
                fontSize: 20, cursor: 'pointer', padding: 4,
              }}>✕</button>
            )}
          </div>
          <div style={{ color: '#8BA3C5', fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>Your Flight. Our Passion.</div>
        </div>

        {user && (
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid #1E3A5F',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: `linear-gradient(135deg,${C.primary},${C.purple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0, marginRight: 10,
            }}>{getInitials(user.name)}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ color: '#8BA3C5', fontSize: 10 }}>Student</div>
            </div>
          </div>
        )}

        <nav style={{ padding: '8px 10px', flex: 1 }}>
          <div style={{ color: '#4B6785', fontSize: 9, fontWeight: 700, letterSpacing: 1.2, padding: '8px 10px 4px', textTransform: 'uppercase' }}>Main Menu</div>
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              onClick={() => { onChange(item.id); if (isMobile) onClose(); }}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center',
                padding: '9px 12px', borderRadius: 10, border: 'none',
                cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                // highlight mocktests nav item same as 'tests' when on mock page
                background: active === item.id ? C.primary : 'transparent',
                color: active === item.id ? '#fff' : '#8BA3C5',
                WebkitTransition: 'all .15s', transition: 'all .15s',
                WebkitAppearance: 'none', appearance: 'none',
              }}>
              <span style={{ fontSize: 15, marginRight: 10 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  marginLeft: 'auto', background: C.red, color: '#fff',
                  fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4, display: 'inline-block',
                }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ margin: '10px', borderRadius: 12, background: `linear-gradient(135deg,${C.primary},${C.purple})`, padding: '12px 14px' }}>
          <div style={{ color: C.accent, fontSize: 11, fontWeight: 800, marginBottom: 4 }}>👑 Go Premium</div>
          <div style={{ color: '#CBD5E1', fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>Unlock all mock tests & 1-on-1 mentoring.</div>
          <button style={{
            background: '#fff', color: C.primary, border: 'none', borderRadius: 8,
            padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%',
            WebkitAppearance: 'none', appearance: 'none',
          }}>Upgrade Now →</button>
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid #1E3A5F' }}>
          <button onClick={onLogout} style={{
            width: '100%', background: hexAlpha(C.red, 0.1),
            border: `1px solid ${hexAlpha(C.red, 0.3)}`, borderRadius: 10,
            padding: '8px 0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            WebkitAppearance: 'none', appearance: 'none',
          }}>🚪 Logout</button>
        </div>
      </div>
    </>
  );
}

// ─── BOTTOM NAV (Mobile) ──────────────────────────────────────────────────────
const BOTTOM_NAV = [
  { icon: '🏠', label: 'Home', id: 'home' },
  { icon: '📚', label: 'Tests', id: 'tests' },
  { icon: '🤖', label: 'Doubt', id: 'doubt' },
  { icon: '📈', label: 'Progress', id: 'progress' },
  { icon: '📁', label: 'Resources', id: 'resources' },
];

function BottomNav({ active, onChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
      background: C.sidebar,
      borderTop: '1px solid #1E3A5F',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {BOTTOM_NAV.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8px 4px', background: 'transparent', border: 'none',
          cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none',
          color: active === item.id ? C.accent : '#8BA3C5',
        }}>
          <span style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</span>
          <span style={{ fontSize: 9, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ user, page, subPage, onLeaderboard, onMenuOpen, isMobile }) {
  const base = { home: 'Dashboard', tests: 'Tests', progress: 'My Progress', classes: 'Live Classes', lectures: 'Lectures', practice: 'Practice', mocktests: 'Mock Tests', leaderboard: 'Leaderboard', resources: 'Study Notes', doubt: 'AI Doubt Chat' };
  const sub = { subject: 'Air Regulations', chapters: 'Chapters', mock: 'Mock Test' };
  const title = sub[subPage] || base[page] || 'Dashboard';
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: isMobile ? 0 : 220,
      right: 0,
      height: 56,
      background: 'rgba(255,255,255,0.97)',
      WebkitBackdropFilter: 'blur(10px)',
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      zIndex: 89,
      gap: 10,
    }}>
      {isMobile && (
        <button onClick={onMenuOpen} style={{
          width: 36, height: 36, borderRadius: 9, background: C.bg, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, fontSize: 18,
          WebkitAppearance: 'none', appearance: 'none',
        }}>☰</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {!isMobile && (
          <div style={{ fontSize: 11, color: C.muted }}>
            Home › {base[page]}
            {subPage === 'subject' && ' › Air Regulations'}
            {subPage === 'mock' && ' › Mock Test'}
          </div>
        )}
      </div>
      {!isMobile && (
        <div style={{
          display: 'flex', alignItems: 'center',
          background: C.bg, borderRadius: 10,
          padding: '7px 12px', border: `1px solid ${C.border}`,
        }}>
          <span style={{ color: C.muted, marginRight: 8 }}>🔍</span>
          <input placeholder="Search anything..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: C.text, width: 160 }} />
        </div>
      )}
      <button onClick={onLeaderboard} style={{
        width: 36, height: 36, borderRadius: 9, background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', border: `1px solid ${C.border}`, fontSize: 17,
        WebkitAppearance: 'none', appearance: 'none', flexShrink: 0,
      }}>🏆</button>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `linear-gradient(135deg,${C.primary},${C.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12,
          }}>{getInitials(user.name)}</div>
        </div>
      )}
    </div>
  );
}

// ─── RTR SIMULATOR CARD ───────────────────────────────────────────────────────
function RTRSimulatorCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href="/rtr" style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: C.sidebar,
          border: `1px solid ${hovered ? C.primary : '#1E3A5F'}`,
          borderRadius: 14,
          padding: '18px 18px 16px',
          cursor: 'pointer',
          WebkitTransition: 'border-color .2s, box-shadow .2s',
          transition: 'border-color .2s, box-shadow .2s',
          boxShadow: hovered ? `0 6px 24px ${hexAlpha(C.primary, 0.18)}` : 'none',
          display: 'block',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>🎧</span>
          <div>
            <div style={{
              fontFamily: 'monospace',
              fontWeight: 600,
              fontSize: 14,
              color: hovered ? '#93C5FD' : '#fff',
              WebkitTransition: 'color .2s',
              transition: 'color .2s',
              lineHeight: 1.2,
            }}>
              RTR(A) Simulator
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#64748B',
              marginTop: 2,
            }}>
              Part 2 · Practical Exam
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#8BA3C5',
          lineHeight: 1.6,
          marginBottom: 12,
        }}>
          Practice ATC radio telephony with voice recognition. 6 phases — startup to landing.
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Voice', bg: hexAlpha('#1D4ED8', 0.35), color: '#93C5FD' },
            { label: 'ICAO Phraseology', bg: hexAlpha('#10B981', 0.25), color: '#6EE7B7' },
            { label: 'AI Scoring', bg: hexAlpha('#8B5CF6', 0.3), color: '#C4B5FD' },
          ].map(tag => (
            <span key={tag.label} style={{
              fontFamily: 'monospace',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: tag.bg,
              color: tag.color,
              display: 'inline-block',
            }}>{tag.label}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ user, stats, recentResults, allResults, loading, onNavigate, isMobile, isTablet }) {
  const badge = getBadge(stats);
  const statCards = [
    { icon: '📋', value: stats.testsAttempted, label: 'Tests Attempted', color: C.primary },
    { icon: '🎯', value: `${stats.avgScore}%`, label: 'Avg Accuracy', color: C.green },
    { icon: '🏆', value: `${stats.bestScore}%`, label: 'Best Score', color: C.accent },
    { icon: '❓', value: stats.totalQuestions, label: 'Questions Done', color: C.purple },
  ];

  const statCols = isMobile ? '1fr 1fr' : 'repeat(4,1fr)';
  const mainCols = (isMobile || isTablet) ? '1fr' : '1fr 340px';

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(120deg,${C.sidebar} 0%,${C.primary} 100%)`,
        borderRadius: 18,
        padding: isMobile ? '22px 18px' : '26px 28px',
        marginBottom: 20,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 16,
      }}>
        <div>
          <div style={{ color: '#93C5FD', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Welcome back, Pilot 👋</div>
          <div style={{ color: '#fff', fontSize: isMobile ? 20 : 24, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
            Ready for your next DGCA exam session?
          </div>
          <div style={{ color: '#93C5FD', fontSize: 12, marginBottom: 16 }}>
            {loading ? 'Loading…' : `${stats.testsAttempted} tests done · ${stats.avgScore}% avg accuracy`}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('tests')} style={{
              background: C.accent, color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              WebkitAppearance: 'none', appearance: 'none',
            }}>📚 Start Test</button>
            <button onClick={() => onNavigate('resources')} style={{
              background: hexAlpha('#ffffff', 0.15), color: '#fff',
              border: `1px solid ${hexAlpha('#ffffff', 0.3)}`,
              borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              WebkitAppearance: 'none', appearance: 'none',
            }}>📁 Study Notes</button>
          </div>
        </div>
        {!isMobile && (
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
            <div style={{
              background: hexAlpha(badge.color, 0.15),
              border: `1px solid ${hexAlpha(badge.color, 0.31)}`,
              borderRadius: 12, padding: '10px 18px', textAlign: 'center', marginBottom: 6,
            }}>
              <div style={{ fontSize: 28 }}>{badge.icon}</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{badge.label}</div>
            </div>
            <div style={{ color: '#93C5FD', fontSize: 11 }}>Your rank badge</div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: statCols, gap: 12, marginBottom: 20 }}>
        {loading
          ? Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
              <Skeleton h={40} />
            </div>
          ))
          : statCards.map((s, i) => <StatCard key={i} icon={s.icon} label={s.label} value={s.value} color={s.color} />)
        }
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: mainCols, gap: 18 }}>
        {/* Subject tests */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 18px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>📚 Chapter-wise Tests</div>
            <button onClick={() => onNavigate('tests')} style={{
              color: C.primary, background: C.primaryLight, border: 'none', borderRadius: 8,
              padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              WebkitAppearance: 'none', appearance: 'none',
            }}>View All →</button>
          </div>
          <div style={{ padding: 14, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            {loading
              ? Array(4).fill(0).map((_, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 10, padding: 14 }}><Skeleton h={12} /></div>
              ))
              : chapters.slice(0, isMobile ? 4 : 8).map(ch => {
                const rs = allResults.filter(r => r.chapterId === ch.id);
                const best = rs.length ? Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0)) : null;
                return (
                  <div key={ch.id} onClick={() => onNavigate('tests', ch.id)}
                    style={{
                      background: C.bg, borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                      border: `1px solid ${C.border}`, borderLeft: `4px solid ${ch.color || C.primary}`,
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 18 }}>{ch.icon}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>→</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: C.text, marginBottom: 2 }}>{ch.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 7 }}>{ch.questionCount || 10} Questions</div>
                    {best !== null && <div style={{ fontSize: 11, fontWeight: 700, color: getScoreColor(best), marginBottom: 5 }}>Best: {best}%</div>}
                    <ProgressBar value={best ?? 0} color={ch.color || C.primary} height={4} />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Air Regulations Notes card */}
          <div onClick={() => onNavigate('resources')} style={{
            background: `linear-gradient(135deg,#1D4ED8,#7C3AED)`,
            borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
          }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>📖</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Air Regulations Notes</div>
            <div style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>All 26 chapters · Definitions, rules, HF, procedures.</div>
            <div style={{
              background: hexAlpha('#ffffff', 0.2), color: '#fff', borderRadius: 8,
              padding: '6px 12px', fontSize: 12, fontWeight: 700, display: 'inline-block',
            }}>Open Notes →</div>
          </div>

          {/* RTR(A) Simulator card */}
          <RTRSimulatorCard />

          {/* User profile card */}
          {user && (
            <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 12 }}>👤 Your Profile</div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: `linear-gradient(135deg,${C.primary},${C.purple})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 16, marginRight: 10, flexShrink: 0,
                }}>{getInitials(user.name)}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{user.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: C.bg, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.primary }}>{stats.testsAttempted}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Tests Done</div>
                </div>
                <div style={{ background: C.bg, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.accent }}>{stats.avgScore}%</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Avg Score</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent tests card */}
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', flex: 1 }}>
            <div style={{
              padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>📈 Recent Tests</div>
            </div>
            {loading
              ? Array(3).fill(0).map((_, i) => (
                <div key={i} style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}><Skeleton h={12} /></div>
              ))
              : recentResults.length === 0
                ? <div style={{ padding: '24px 16px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No tests yet!</div>
                : recentResults.map(r => {
                  const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                  const ch = chapters.find(c => c.id === r.chapterId);
                  return (
                    <div key={r.id} style={{
                      padding: '10px 16px', borderTop: `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: hexAlpha(ch?.color || C.primary, 0.13),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, flexShrink: 0, marginRight: 10,
                      }}>{ch?.icon ?? '📝'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch?.title ?? r.chapterId}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{formatDate(r.date)}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: getScoreColor(pct), whiteSpace: 'nowrap' }}>{r.score}/{r.total}</div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUBJECT SELECTOR ──────────────────────────────────────────────────────────
function SubjectSelector({ allResults, onSelectSubject, onMockTest, isMobile }) {
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 800, color: C.text }}>Select a Subject</h2>
        <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 13 }}>Choose a subject below to start chapter-wise tests.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {SUBJECTS.map(sub => {
          const subChapters = chapters.filter(c => sub.chapterIds.includes(c.id));
          const attempted = subChapters.filter(c => allResults.some(r => r.chapterId === c.id)).length;
          const allPcts = allResults
            .filter(r => sub.chapterIds.includes(r.chapterId) && r.total > 0)
            .map(r => Math.round((r.score / r.total) * 100));
          const avgPct = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : 0;

          return (
            <div key={sub.id}
              onClick={() => sub.isMock ? onMockTest() : onSelectSubject(sub.id)}
              style={{
                background: C.card, borderRadius: 18, border: `1px solid ${C.border}`,
                overflow: 'hidden', cursor: 'pointer',
                WebkitTransition: 'transform .2s', transition: 'transform .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 10px 28px ${hexAlpha(sub.color, 0.14)}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}>
              <div style={{ background: sub.gradient, padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: hexAlpha('#ffffff', 0.25),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  }}>{sub.icon}</div>
                  {sub.comingSoon
                    ? <span style={{ background: hexAlpha('#000000', 0.25), color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>🚧 Coming Soon</span>
                    : sub.isMock
                      ? <span style={{ background: hexAlpha('#ffffff', 0.3), color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>🎯 Full Paper</span>
                      : attempted > 0
                        ? <span style={{ background: hexAlpha('#ffffff', 0.3), color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>{attempted}/{subChapters.length} done</span>
                        : <span style={{ background: hexAlpha('#ffffff', 0.2), color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}></span>}
                </div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginTop: 12, marginBottom: 3 }}>{sub.title}</div>
                <div style={{ color: hexAlpha('#ffffff', 0.8), fontSize: 12 }}>{sub.subtitle}</div>
              </div>
              <div style={{ padding: '14px 20px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{sub.stats}</span>
                  <span style={{ fontSize: 11, background: hexAlpha(sub.color, 0.08), color: sub.color, padding: '3px 10px', borderRadius: 20, fontWeight: 700, display: 'inline-block' }}>{sub.exam}</span>
                </div>
                {!sub.comingSoon && !sub.isMock && subChapters.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>Avg Score</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: avgPct > 0 ? getScoreColor(avgPct) : C.muted }}>{avgPct > 0 ? `${avgPct}%` : '—'}</span>
                    </div>
                    <ProgressBar value={avgPct} color={sub.color} height={5} />
                  </>
                )}
                <button style={{
                  marginTop: 12, width: '100%', padding: '10px 0',
                  background: sub.gradient, color: '#fff', border: 'none', borderRadius: 10,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  WebkitAppearance: 'none', appearance: 'none',
                }}>
                  {sub.comingSoon ? '🚧 Coming Soon →' : sub.isMock ? '🎯 Choose Subject & Start →' : '📚 View Chapters →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GENERIC SUBJECT CHAPTER LIST ─────────────────────────────────────────────
function SubjectChapterList({ subject, subjectChapters, allResults, onStartTest, onBack, isMobile }) {
  const [search, setSearch] = useState('');

  function getBest(chapterId) {
    const rs = allResults.filter(r => r.chapterId === chapterId);
    if (!rs.length) return null;
    return Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0));
  }

  const filtered = subjectChapters.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  function getGroups() {
    if (!subject.parts || subject.parts.length === 0) {
      return [{ label: subject.title, color: subject.color, chapters: filtered }];
    }
    return subject.parts
      .map(part => ({
        label: part.label,
        color: part.color,
        chapters: filtered.filter(c => part.chapterIds && part.chapterIds.includes(c.id)),
      }))
      .filter(g => g.chapters.length > 0);
  }

  const groups = getGroups();

  const attempted = subjectChapters.filter(c => allResults.some(r => r.chapterId === c.id)).length;
  const allPcts = allResults
    .filter(r => subject.chapterIds.includes(r.chapterId) && r.total > 0)
    .map(r => Math.round((r.score / r.total) * 100));
  const avgScore = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : null;
  const bestScore = allPcts.length ? Math.max(...allPcts) : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: 10, background: C.card,
          border: `1px solid ${C.border}`, fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          WebkitAppearance: 'none', appearance: 'none',
        }}>←</button>
        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: subject.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>{subject.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 800, color: C.text }}>
            {subject.icon} {subject.title}
          </h2>
          <p style={{ margin: '2px 0 0', color: C.muted, fontSize: 12 }}>
            {subjectChapters.length} chapters · Click to start MCQ test
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', background: C.card,
        borderRadius: 10, padding: '8px 14px', border: `1px solid ${C.border}`, marginBottom: 18,
      }}>
        <span style={{ color: C.muted, marginRight: 8 }}>🔍</span>
        <input
          placeholder="Search chapters…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: C.text, width: '100%' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 22 }}>
        {[
          { icon: '📚', val: subjectChapters.length, label: 'Total Chapters' },
          { icon: '✅', val: attempted, label: 'Attempted' },
          { icon: '🎯', val: avgScore !== null ? `${avgScore}%` : '—', label: 'Avg Score' },
          { icon: '🏆', val: bestScore !== null ? `${bestScore}%` : '—', label: 'Best Score' },
        ].map(s => (
          <div key={s.label} style={{
            background: C.card, borderRadius: 12, padding: '10px 14px',
            border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.text, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {groups.map(group => (
        <div key={group.label} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 10 }}>
            <div style={{ height: 3, width: 24, borderRadius: 99, background: group.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: 14, color: group.color }}>{group.label}</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{group.chapters.length} ch.</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(260px,1fr))',
            gap: 12,
          }}>
            {group.chapters.map(ch => {
              const best = getBest(ch.id);
              const attempts = allResults.filter(r => r.chapterId === ch.id).length;
              const chNum = ch.id.replace(/^[a-z]+/i, '').replace(/^0+/, '') || ch.id;
              return (
                <div key={ch.id} onClick={() => onStartTest(ch.id)}
                  style={{
                    background: C.card, borderRadius: 14,
                    border: `1px solid ${C.border}`, borderLeft: `4px solid ${group.color}`,
                    padding: 16, cursor: 'pointer',
                    WebkitTransition: 'transform .18s', transition: 'transform .18s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${hexAlpha(group.color, 0.12)}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: hexAlpha(group.color, 0.08),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      }}>{ch.icon || subject.icon}</div>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, background: group.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 9, fontWeight: 800,
                      }}>{chNum}</div>
                    </div>
                    {best !== null
                      ? <Badge label={`${best}%`} color={getScoreColor(best)} />
                      : <span style={{
                        fontSize: 10, color: C.muted, background: C.bg,
                        padding: '2px 8px', borderRadius: 20, display: 'inline-block',
                      }}>New</span>}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 3, lineHeight: 1.3 }}>{ch.title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
                    {ch.part || subject.title} · {attempts} attempt{attempts !== 1 ? 's' : ''}
                  </div>
                  <ProgressBar value={best ?? 0} color={group.color} height={4} />
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: best !== null ? getScoreColor(best) : C.muted, fontWeight: best !== null ? 700 : 400 }}>
                      {best !== null ? `Best: ${best}%` : 'Not attempted'}
                    </span>
                    <span style={{ fontSize: 11, color: group.color, fontWeight: 700 }}>Start →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: C.muted, padding: '48px 0', fontSize: 14 }}>
          No chapters match "{search}"
        </div>
      )}
    </div>
  );
}

// ─── MOCK TEST SUBJECT SELECTOR ───────────────────────────────────────────────
function MockSubjectSelector({ onSelectSubject, onBack, isMobile }) {
  const btnBase = { border: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' };

  const options = [
    ...SUBJECTS.filter(s => !s.isMock),
    MOCK_ALL_OPTION,
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        ...btnBase,
        marginBottom: 20,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '7px 16px',
        fontSize: 13,
        color: C.text,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>← Back to Tests</button>

      <div style={{
        background: `linear-gradient(120deg,${C.sidebar} 0%,${C.purple} 100%)`,
        borderRadius: 18,
        padding: isMobile ? '20px 18px' : '24px 28px',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: isMobile ? 22 : 28, marginBottom: 8 }}>🎯</div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: isMobile ? 18 : 22, marginBottom: 6 }}>
          Mock Test — Choose a Subject
        </div>
        <div style={{ color: '#C4B5FD', fontSize: 13, lineHeight: 1.6 }}>
          Select a subject below to generate a 100-question DGCA-style mock paper from that topic.
          Choose "All Subjects" for a mixed paper covering every chapter.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {[['❓', '100 Questions'], ['⏱️', '120 Minutes'], ['💡', 'Instant Results'], ['🔀', 'Randomised']].map(([icon, label]) => (
            <span key={label} style={{
              background: hexAlpha('#ffffff', 0.15),
              color: '#fff',
              border: `1px solid ${hexAlpha('#ffffff', 0.2)}`,
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block',
            }}>{icon} {label}</span>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(230px,1fr))',
        gap: 14,
      }}>
        {options.map((sub) => {
          const isAll = sub.id === 'all';
          const isComingSoon = sub.comingSoon;
          return (
            <div
              key={sub.id}
              onClick={() => !isComingSoon && onSelectSubject(sub)}
              style={{
                background: C.card,
                borderRadius: 16,
                border: isAll ? `2px dashed ${hexAlpha(sub.color, 0.4)}` : `1px solid ${C.border}`,
                overflow: 'hidden',
                cursor: isComingSoon ? 'not-allowed' : 'pointer',
                opacity: isComingSoon ? 0.55 : 1,
                WebkitTransition: 'transform .18s, box-shadow .18s',
                transition: 'transform .18s, box-shadow .18s',
              }}
              onMouseEnter={e => {
                if (isComingSoon) return;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 10px 28px ${hexAlpha(sub.color, 0.16)}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ background: sub.gradient, padding: '18px 18px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: hexAlpha('#ffffff', 0.25),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  }}>{sub.icon}</div>
                  <span style={{
                    background: hexAlpha('#ffffff', 0.25),
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 20, display: 'inline-block',
                  }}>
                    {isComingSoon ? '🚧 Coming Soon' : isAll ? '🎲 Mixed' : sub.exam}
                  </span>
                </div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginTop: 10, marginBottom: 2 }}>{sub.title}</div>
                <div style={{ color: hexAlpha('#ffffff', 0.8), fontSize: 11 }}>{sub.subtitle}</div>
              </div>
              <div style={{ padding: '12px 18px 16px' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                  {isComingSoon ? 'Questions being prepared by our content team' : sub.stats}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); if (!isComingSoon) onSelectSubject(sub); }}
                  disabled={isComingSoon}
                  style={{
                    border: 'none', cursor: isComingSoon ? 'not-allowed' : 'pointer',
                    WebkitAppearance: 'none', appearance: 'none',
                    width: '100%',
                    padding: '9px 0',
                    background: isComingSoon ? C.border : sub.gradient,
                    borderRadius: 10,
                    color: isComingSoon ? C.muted : '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {isComingSoon ? '🚧 Coming Soon' : isAll ? '🎯 Start Combined Test →' : `📝 Start ${sub.title} Test →`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MOCK TEST PAGE ───────────────────────────────────────────────────────────
function MockTestPage({ onBack, isMobile }) {
  const TOTAL_TIME = 6000;
  const TOTAL_Q = 100;

  const btnBase = { border: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' };

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [pool, setPool] = useState([]);
  const [screen, setScreen] = useState('subjectSelect');
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const timerRef = useRef(null);

  function handleSubjectSelect(subject) {
    const chapterIds = subject.id === 'all' ? null : subject.chapterIds;
    const newPool = buildMockPool(TOTAL_Q, chapterIds);
    setSelectedSubject(subject);
    setPool(newPool);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(TOTAL_TIME);
    setScreen('intro');
  }

  function resetMock() {
    clearInterval(timerRef.current);
    setSelectedSubject(null);
    setPool([]);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(TOTAL_TIME);
    setScreen('subjectSelect');
  }

  useEffect(() => {
    if (screen !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setScreen('finish'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  // REPLACE WITH:
  const answeringRef = useRef(false);
  function handleAnswer(idx) {
    if (answers[currentQ] !== undefined) return;
    if (answeringRef.current) return;
    answeringRef.current = true;
    setAnswers(prev => ({ ...prev, [currentQ]: idx }));
    setTimeout(() => { answeringRef.current = false; }, 400);
  }
  function submit() { clearInterval(timerRef.current); setScreen('finish'); }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct = timeLeft / TOTAL_TIME;
  const tColor = pct > 0.4 ? C.primary : pct > 0.15 ? C.purple : C.red;
  const circ = 2 * Math.PI * 22;

  const score = pool.reduce((a, q, i) => a + (answers[i] === q.correct ? 1 : 0), 0);
  const scorePct = pool.length ? Math.round((score / pool.length) * 100) : 0;
  const answered = Object.keys(answers).length;
  const notAnswered = pool.length - answered;
  const wrong = answered - score;

  // REPLACE WITH:
  function getDotState(i) {
    if (screen === 'finish') {
      if (answers[i] === undefined) return 'unanswered';
      return answers[i] === pool[i]?.correct ? 'correct' : 'wrong';
    }
    if (i === currentQ) return 'active';
    if (answers[i] !== undefined) return 'answered';
    return 'default';
  }

  if (screen === 'subjectSelect') {
    return (
      <MockSubjectSelector
        onSelectSubject={handleSubjectSelect}
        onBack={onBack}
        isMobile={isMobile}
      />
    );
  }

  if (screen === 'intro') return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: isMobile ? '0 4px' : 0 }}>
      <button onClick={() => setScreen('subjectSelect')} style={{
        ...btnBase, marginBottom: 18, background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 10,
        padding: '7px 14px', fontSize: 13, color: C.text,
      }}>← Change Subject</button>

      <div style={{
        background: C.card, borderRadius: 18, border: `1px solid ${C.border}`,
        padding: isMobile ? '24px 18px' : '32px 28px', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: hexAlpha(selectedSubject?.color || C.purple, 0.08),
          border: `1px solid ${hexAlpha(selectedSubject?.color || C.purple, 0.2)}`,
          borderRadius: 20, padding: '5px 14px', marginBottom: 16,
        }}>
          <span style={{ fontSize: 16 }}>{selectedSubject?.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: selectedSubject?.color || C.purple }}>
            {selectedSubject?.title || 'All Subjects'}
          </span>
        </div>

        <div style={{ fontSize: 48, marginBottom: 14 }}>🎯</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: C.text }}>DGCA Mock Test</h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
          {selectedSubject?.id === 'all'
            ? 'Full-length paper combining all subjects & chapters.'
            : `100 questions from ${selectedSubject?.title} — DGCA exam style.`}
        </p>

        {pool.length < TOTAL_Q && (
          <div style={{
            background: hexAlpha(C.accent, 0.08),
            border: `1px solid ${hexAlpha(C.accent, 0.25)}`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.text,
          }}>
            ⚠️ Only {pool.length} questions available for this subject. The test will use all of them.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {[
            ['❓', `${pool.length} Questions`],
            ['⏱️', '100 Minutes'],
            ['📚', selectedSubject?.id === 'all' ? 'All Chapters' : selectedSubject?.title],
            ['💡', 'Instant Results'],
          ].map(([icon, label]) => (
            <span key={label} style={{
              background: C.primaryLight, color: C.primary, border: `1px solid ${hexAlpha(C.primary, 0.19)}`,
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-block',
            }}>{icon} {label}</span>
          ))}
        </div>

        <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
          {[
            'Each question has 4 options — choose the best answer',
            'Once answered, selection cannot be changed',
            'Test auto-submits when timer reaches zero',
            'Score summary shown at the end',
          ].map(r => (
            <li key={r} style={{ background: C.bg, borderRadius: 8, padding: '9px 13px', fontSize: 13, color: C.text, marginBottom: 7 }}>✔ {r}</li>
          ))}
        </ul>

        <button
          onClick={() => pool.length > 0 ? setScreen('test') : null}
          disabled={pool.length === 0}
          style={{
            ...btnBase, width: '100%', padding: '13px',
            background: pool.length === 0
              ? C.border
              : `linear-gradient(135deg,${selectedSubject?.color || C.primary},${C.purple})`,
            borderRadius: 12, color: pool.length === 0 ? C.muted : '#fff',
            fontSize: 15, fontWeight: 800,
            cursor: pool.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {pool.length === 0 ? '⚠️ No questions available' : '🚀 Start Mock Test →'}
        </button>

        <button onClick={() => setScreen('subjectSelect')} style={{
          ...btnBase, marginTop: 10, width: '100%', padding: '11px',
          background: 'none', border: `1px solid ${C.border}`,
          borderRadius: 12, color: C.muted, fontSize: 13,
        }}>← Choose Different Subject</button>
      </div>
    </div>
  );

  if (screen === 'test') {
    const q = pool[currentQ];
    const selected = answers[currentQ];
    const isAnswered = selected !== undefined;
    return (
      <div>
        <div style={{
          position: 'sticky', top: 56, zIndex: 80,
          background: 'rgba(255,255,255,0.97)',
          WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 0', marginBottom: 16,
          gap: 10,
        }}>
          <button onClick={onBack} style={{
            ...btnBase, background: 'none', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '6px 12px', color: C.text, fontSize: 13, flexShrink: 0,
          }}>← Exit</button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {!isMobile && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: hexAlpha(selectedSubject?.color || C.purple, 0.1),
                color: selectedSubject?.color || C.purple,
                padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                {selectedSubject?.icon} {selectedSubject?.title}
              </span>
            )}
            <span style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{answered}/{pool.length} answered</span>
          </div>
          <div style={{ position: 'relative', width: 50, height: 50, flexShrink: 0 }}>
            <svg width="50" height="50" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke={C.border} strokeWidth="4" />
              <circle cx="26" cy="26" r="22" fill="none" stroke={tColor} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                transform="rotate(-90 26 26)"
                style={{ WebkitTransition: 'stroke-dashoffset 1s linear,stroke .5s', transition: 'stroke-dashoffset 1s linear,stroke .5s' }} />
            </svg>
            <span style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)', WebkitTransform: 'translate(-50%,-50%)',
              fontSize: 9, fontWeight: 800, color: tColor,
            }}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
          </div>
        </div>

        <div style={{ height: 3, background: C.border, borderRadius: 99, marginBottom: 16 }}>
          <div style={{
            height: '100%',
            width: `${pool.length > 0 ? ((currentQ + 1) / pool.length) * 100 : 0}%`,
            background: selectedSubject?.color || C.primary,
            borderRadius: 99, transition: 'width .3s',
          }} />
        </div>

        <div style={{
          display: 'flex', flexWrap: isMobile ? 'nowrap' : 'wrap',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: 6, marginBottom: 16, paddingBottom: isMobile ? 6 : 0,
        }}>
          {pool.map((_, i) => {
            const ds = getDotState(i);
            // REPLACE WITH:
            const bg = ds === 'answered' ? hexAlpha(C.primary, 0.18) : ds === 'correct' ? C.primary : ds === 'wrong' ? C.red : ds === 'active' ? C.primaryLight : C.card;
            const co = ds === 'answered' ? C.primary : ds === 'correct' || ds === 'wrong' ? '#fff' : ds === 'active' ? C.primary : C.muted;
            const br = ds === 'active' ? `2px solid ${C.primary}` : ds === 'answered' ? `1px solid ${hexAlpha(C.primary, 0.3)}` : `1px solid ${C.border}`;
            return (
              <button key={i} onClick={() => setCurrentQ(i)} style={{
                ...btnBase,
                width: 30, height: 30, borderRadius: 7, border: br, background: bg, color: co,
                fontSize: 10, fontWeight: 700, flexShrink: 0,
                transition: 'all .15s',
              }}>{i + 1}</button>
            );
          })}
        </div>

        <div style={{
          background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
          padding: isMobile ? '18px 16px' : '22px 24px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: .8 }}>Q {currentQ + 1} / {pool.length}</span>
            {q && (
              <span style={{
                fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 700, display: 'inline-block',
                background: hexAlpha(selectedSubject?.color || C.primary, 0.1),
                color: selectedSubject?.color || C.primary,
              }}>
                {selectedSubject?.icon} {selectedSubject?.title}
              </span>
            )}
          </div>
          <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: C.text, lineHeight: 1.6, marginBottom: 18 }}>{q?.question}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            // FIND this line:
            {q?.options.map((opt, idx) => {
              const isSelected = selected === idx;
              return (
                <button key={idx}
                  onClick={() => { if (answers[currentQ] === undefined) handleAnswer(idx); }}
                  style={{
                    ...btnBase, display: 'flex', alignItems: 'center',
                    background: isSelected ? C.primaryLight : C.bg,
                    border: isSelected ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
                    borderRadius: 10, padding: '11px 14px',
                    cursor: isAnswered ? 'default' : 'pointer',
                    textAlign: 'left', color: C.text, fontSize: 13, fontWeight: 400,
                    transition: 'all .15s',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none', WebkitUserSelect: 'none',
                  }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: isSelected ? C.primary : hexAlpha(C.primary, 0.08),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                    color: isSelected ? '#fff' : C.primary,
                    flexShrink: 0, marginRight: 10,
                  }}>{['A', 'B', 'C', 'D'][idx]}</span>
                  <span style={{ flex: 1 }}>{opt}</span>
                </button>
              );
            })}
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setCurrentQ(c => c - 1)} disabled={currentQ === 0}
            style={{
              ...btnBase, background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '10px 16px', color: C.text, fontSize: 13,
              cursor: currentQ === 0 ? 'not-allowed' : 'pointer', opacity: currentQ === 0 ? .4 : 1,
            }}>← Prev</button>
          {!isMobile && <span style={{ fontSize: 12, color: C.muted }}>{answered}/{pool.length} answered</span>}
          {currentQ === pool.length - 1
            ? <button onClick={submit} style={{
              ...btnBase, background: `linear-gradient(135deg,${C.accent},#D97706)`,
              borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700,
            }}>Submit ✓</button>
            : <button onClick={() => setCurrentQ(c => c + 1)} style={{
              ...btnBase, background: C.primaryLight, border: `1px solid ${hexAlpha(C.primary, 0.19)}`,
              borderRadius: 10, padding: '10px 18px', color: C.primary, fontSize: 13, fontWeight: 700,
            }}>Next →</button>}
        </div>
      </div>
    );
  }

  // Finish screen
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '0 4px' : 0 }}>
      <div style={{
        background: C.card, borderRadius: 18, border: `1px solid ${C.border}`,
        padding: isMobile ? '24px 18px' : '32px 28px', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: hexAlpha(selectedSubject?.color || C.purple, 0.08),
          border: `1px solid ${hexAlpha(selectedSubject?.color || C.purple, 0.2)}`,
          borderRadius: 20, padding: '4px 12px', marginBottom: 14,
        }}>
          <span style={{ fontSize: 14 }}>{selectedSubject?.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: selectedSubject?.color || C.purple }}>
            {selectedSubject?.title}
          </span>
        </div>

        <div style={{ fontSize: 48, marginBottom: 10 }}>{scorePct >= 80 ? '🏆' : scorePct >= 50 ? '✈️' : '📚'}</div>
        <h2 style={{ margin: '0 0 4px', fontWeight: 900, fontSize: 20, color: C.text }}>
          {scorePct >= 80 ? 'Excellent!' : scorePct >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
        </h2>
        <div style={{ fontSize: 44, fontWeight: 900, color: getScoreColor(scorePct), lineHeight: 1 }}>{score}/{pool.length}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(scorePct), marginBottom: 20 }}>{scorePct}%</div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '✓', val: score, label: 'Correct', bg: '#EFF6FF', co: C.primary, br: hexAlpha(C.primary, 0.25) },
            { icon: '✗', val: wrong, label: 'Wrong', bg: '#FEF2F2', co: C.red, br: hexAlpha(C.red, 0.25) },
            { icon: '–', val: notAnswered, label: 'Skipped', bg: '#F5F3FF', co: C.purple, br: hexAlpha(C.purple, 0.25) },
          ].map(b => (
            <div key={b.label} style={{
              flex: 1, background: b.bg, border: `1px solid ${b.br}`,
              borderRadius: 12, padding: '12px 8px',
            }}>
              <div style={{ fontSize: 18, color: b.co }}>{b.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{b.val}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{b.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 4px',
          marginBottom: 20,
        }}>
          {pool.map((_, i) => {
            const ds = getDotState(i);
            const bg = ds === 'correct' ? C.primary : ds === 'wrong' ? C.red : ds === 'unanswered' ? hexAlpha(C.purple, 0.3) : C.bg;
            const co = ds === 'correct' || ds === 'wrong' ? '#fff' : ds === 'unanswered' ? C.purple : C.muted;
            return (
              <span key={i} style={{
                width: 26, height: 26, borderRadius: 6,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, background: bg, color: co,
                border: `1px solid ${C.border}`,
              }}>{i + 1}</span>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
          {[
            { color: C.primary, label: 'Correct' },
            { color: C.red, label: 'Wrong' },
            { color: hexAlpha(C.purple, 0.3), label: 'Skipped' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: l.color, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: C.muted }}>{l.label}</span>
            </div>
          ))}
        </div>

        <button onClick={onBack} style={{
          width: '100%', padding: '12px',
          background: `linear-gradient(135deg,${C.primary},${C.purple})`,
          border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
          marginBottom: 10, WebkitAppearance: 'none', appearance: 'none',
        }}>Back to Tests</button>

        <button onClick={resetMock} style={{
          width: '100%', padding: '11px',
          background: 'none', border: `1px solid ${C.border}`,
          borderRadius: 12, color: C.muted, fontSize: 13, cursor: 'pointer',
          WebkitAppearance: 'none', appearance: 'none',
        }}>🔄 Try Another Subject</button>
      </div>
    </div>
  );
}

// ─── CHAPTER TESTS PAGE ───────────────────────────────────────────────────────
// ✅ FIX: accepts initialSubView prop so 'mocktests' nav item can open mock directly
function ChapterTestsPage({ allResults, onStartTest, isMobile, initialSubView = 'subjects' }) {
  const [subView, setSubView] = useState(initialSubView);

  // Keep in sync if parent re-navigates with a new initialSubView
  useEffect(() => {
    setSubView(initialSubView);
  }, [initialSubView]);

  const activeSubject = SUBJECTS.find(s => s.id === subView);

  if (activeSubject?.comingSoon) {
    return <ComingSoonPage subject={activeSubject} onBack={() => setSubView('subjects')} />;
  }

  if (subView === 'mock') {
    return <MockTestPage onBack={() => setSubView('subjects')} isMobile={isMobile} />;
  }

  if (activeSubject && activeSubject.chapterIds.length > 0) {
    const known = chapters.filter(c => activeSubject.chapterIds.includes(c.id));
    const knownIds = known.map(c => c.id);
    const stubs = activeSubject.chapterIds
      .filter(id => !knownIds.includes(id))
      .map((id, i) => ({
        id,
        title: `Chapter ${id.replace(/^[a-z]+/i, '').replace(/^0+/, '') || i + 1}`,
        icon: activeSubject.icon,
        part: activeSubject.title,
        questionCount: 0,
        color: activeSubject.color,
      }));

    return (
      <SubjectChapterList
        subject={activeSubject}
        subjectChapters={[...known, ...stubs]}
        allResults={allResults}
        onStartTest={onStartTest}
        onBack={() => setSubView('subjects')}
        isMobile={isMobile}
      />
    );
  }

  return (
    <SubjectSelector
      allResults={allResults}
      onSelectSubject={id => setSubView(id)}
      onMockTest={() => setSubView('mock')}
      isMobile={isMobile}
    />
  );
}

// ─── PROGRESS PAGE ────────────────────────────────────────────────────────────
function ProgressPage({ stats, allResults, loading, isMobile }) {
  const chapterStats = chapters.map(ch => {
    const rs = allResults.filter(r => r.chapterId === ch.id);
    const best = rs.length ? Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0)) : null;
    return { ...ch, best, attempts: rs.length };
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}><Skeleton h={40} /></div>
        )) : <>
          <StatCard icon="📊" label="Overall Avg" value={`${stats.avgScore}%`} color={C.primary} />
          <StatCard icon="📋" label="Tests Done" value={stats.testsAttempted} color={C.green} />
          <StatCard icon="🏆" label="Best Score" value={`${stats.bestScore}%`} color={C.accent} />
          <StatCard icon="❓" label="Questions" value={stats.totalQuestions} color={C.purple} />
        </>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18 }}>
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 16 }}>Chapter Progress</div>
          {loading ? Array(5).fill(0).map((_, i) => <div key={i} style={{ marginBottom: 14 }}><Skeleton h={10} /></div>) :
            chapterStats.map(ch => (
              <div key={ch.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 14 }}>{ch.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: ch.best !== null ? getScoreColor(ch.best) : C.muted }}>{ch.best !== null ? `${ch.best}%` : '—'}</span>
                  </div>
                </div>
                <ProgressBar value={ch.best ?? 0} color={ch.color || C.primary} height={6} />
              </div>
            ))
          }
        </div>
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 16 }}>Performance Overview</div>
          {[
            { label: 'Accuracy Rate', value: stats.avgScore, color: C.primary, icon: '🎯' },
            { label: 'Best Performance', value: stats.bestScore, color: C.green, icon: '🏆' },
            { label: 'Completion Rate', value: Math.min(Math.round((stats.testsAttempted / Math.max(chapters.length, 1)) * 100), 100), color: C.accent, icon: '📋' },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span>{item.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{loading ? '…' : `${item.value}%`}</span>
              </div>
              <ProgressBar value={loading ? 0 : item.value} color={item.color} height={8} />
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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: 360, color: C.muted, background: C.card, borderRadius: 18, border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icons[page] || '📄'}</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: C.text, marginBottom: 5 }}>{labels[page] || page}</div>
      <div style={{ fontSize: 13 }}>Coming soon in the full build.</div>
    </div>
  );
}

// ─── ROOT DASHBOARD ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUserState] = useState(null);
  const [stats, setStats] = useState({ testsAttempted: 0, avgScore: 0, bestScore: 0, totalQuestions: 0 });
  const [recentResults, setRecent] = useState([]);
  const [allResults, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  // ✅ FIX: subPage drives ChapterTestsPage's initialSubView
  const [subPage, setSubPage] = useState('subjects');


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
  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUserState(u);
    Promise.all([getStats(u.email), getResults(u.email)])
      .then(([s, r]) => { setStats(s); setAll(r); setRecent(r.slice(0, 5)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  // ✅ NEW — hide AliaWidget during mock test
  useEffect(() => {
    const isMockActive = page === 'tests' && subPage === 'mock';
    document.body.setAttribute('data-hide-widget', isMockActive ? 'true' : 'false');
    return () => document.body.removeAttribute('data-hide-widget');
  }, [page, subPage]);

  function handleLogout() { clearUser(); router.replace('/login'); }

  function handleNav(newPage, chapterId) {
    if (newPage === 'results') { router.push('/results'); return; }
    if (newPage === 'leaderboard') { router.push('/leaderboard'); return; }
    if (chapterId) { router.push(`/test/${chapterId}`); return; }

    // ✅ FIX: 'mocktests' sidebar item → go to tests page with mock sub-view
    if (newPage === 'mocktests') {
      setPage('tests');
      setSubPage('mock');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPage(newPage);
    // Reset subPage to 'subjects' for normal test navigation,
    // but keep it untouched for any other page (progress, resources, etc.)
    if (newPage === 'tests') {
      setSubPage('subjects');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const sidebarWidth = isDesktop ? 220 : 0;
  const topBarHeight = 56;
  const bottomNavHeight = isMobile ? 56 : 0;

  // ✅ FIX: determine which nav item should appear "active" in sidebar
  // When we're on the tests page showing the mock sub-view, highlight 'mocktests'
  const activeNavItem = (page === 'tests' && subPage === 'mock') ? 'mocktests' : page;

  function renderPage() {
    switch (page) {
      case 'tests':
        return (
          <ChapterTestsPage
            allResults={allResults}
            onStartTest={id => router.push(`/test/${id}`)}
            isMobile={isMobile}
            initialSubView={subPage}  // ✅ FIX: pass subPage as initialSubView
          />
        );
      case 'progress':
        return <ProgressPage stats={stats} allResults={allResults} loading={loading} isMobile={isMobile} />;
      case 'resources':
        return <ResourcesPage />;
      case 'lectures':
      case 'classes':
        return <LecturesPage user={user} />;
      case 'practice':
        return <Placeholder page={page} />;
      case 'doubt':
        return <div style={{ minHeight: 500 }}><DoubtChat studentId={user?.id} /></div>;
      default:
        return (
          <HomePage
            user={user} stats={stats} recentResults={recentResults}
            allResults={allResults} loading={loading} onNavigate={handleNav}
            isMobile={isMobile} isTablet={isTablet}
          />
        );
    }
  }

  if (!user) return null;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.bg, minHeight: '100vh' }}>
      <style>{`
        @-webkit-keyframes shimmer {
          0%  { background-position: 200% 0; }
          100%{ background-position: -200% 0; }
        }
        @keyframes shimmer {
          0%  { background-position: 200% 0; }
          100%{ background-position: -200% 0; }
        }
        * { -webkit-box-sizing: border-box; box-sizing: border-box; margin: 0; }
        button:hover { opacity: .9; }
        input, button { -webkit-appearance: none; appearance: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        body { overflow-x: hidden; }
      `}</style>

      {/* ✅ FIX: pass activeNavItem so 'Mock Tests' highlights correctly */}
      <Sidebar
        active={activeNavItem}
        onChange={handleNav}
        onLogout={handleLogout}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={!isDesktop}
      />

      <TopBar
        user={user} page={page} subPage={subPage}
        onLeaderboard={() => router.push('/leaderboard')}
        onMenuOpen={() => setSidebarOpen(true)}
        isMobile={!isDesktop}
      />

      <main style={{
        marginLeft: sidebarWidth,
        paddingTop: topBarHeight,
        paddingBottom: isMobile ? bottomNavHeight + 16 : 0,
        minHeight: '100vh',
      }}>
        {page === 'resources'
          ? <div style={{ padding: isMobile ? '16px 14px' : '20px 24px' }}><ResourcesPage /></div>
          : <div style={{ padding: isMobile ? '16px 14px' : isTablet ? '20px 24px' : '24px 28px', maxWidth: 1280 }}>{renderPage()}</div>
        }
      </main>

      {!isMobile && (
        <div style={{
          marginLeft: sidebarWidth,
          background: C.sidebar,
          padding: '14px 28px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {[
            ['📋', `${stats.testsAttempted}`, 'Tests Taken'],
            ['🎯', `${stats.avgScore}%`, 'Avg Accuracy'],
            ['🏆', `${stats.bestScore}%`, 'Best Score'],
            ['❓', `${stats.totalQuestions}`, 'Questions Done'],
            ['📚', `${chapters.length}`, 'Chapters'],
            ['✈️', '24/7', 'DGCA Prep'],
          ].map(([icon, val, label]) => (
            <div key={label} style={{ textAlign: 'center', padding: '3px 10px' }}>
              <div style={{ fontSize: 14 }}>{icon}</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{val}</div>
              <div style={{ color: '#8BA3C5', fontSize: 10 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {isMobile && <BottomNav active={activeNavItem} onChange={handleNav} />}
    </div>
  );
}