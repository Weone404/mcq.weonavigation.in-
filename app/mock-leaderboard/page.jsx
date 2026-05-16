'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser, clearUser } from '../../lib/storage';

// ─── COLOUR TOKENS ────────────────────────────────────────────────────────────
const C = {
    bg: '#F0F4FF', sidebar: '#0A1628', card: '#FFFFFF',
    primary: '#1D4ED8', primaryLight: '#EFF6FF',
    accent: '#F59E0B', green: '#10B981', red: '#EF4444', purple: '#8B5CF6',
    text: '#0F172A', muted: '#64748B', border: '#E2E8F0',
};

// ─── TINY HELPERS ─────────────────────────────────────────────────────────────
const ProgressBar = ({ value, color = C.primary, height = 6 }) => (
    <div style={{ background: '#E2E8F0', borderRadius: 99, height, overflow: 'hidden', width: '100%' }}>
        <div style={{ width: `${Math.min(value || 0, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .6s ease' }} />
    </div>
);

const Badge = ({ label, color = C.primary }) => (
    <span style={{ background: color + '20', color, fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, letterSpacing: .3 }}>
        {label}
    </span>
);

const StatCard = ({ icon, label, value, color = C.primary }) => (
    <div style={{ background: C.card, borderRadius: 16, padding: '20px 22px', border: `1px solid ${C.border}`, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
        <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{label}</div>
        </div>
    </div>
);

const Skeleton = ({ w = '100%', h = 16, r = 8 }) => (
    <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
);

const medals = ['🥇', '🥈', '🥉'];
const getAccuracyColor = (pct) => pct >= 80 ? C.green : pct >= 50 ? C.accent : C.red;
function getInitials(name) {
    return name ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '??';
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── SUBJECT TABS ─────────────────────────────────────────────────────────────
const SUBJECT_TABS = [
    { id: 'all', label: 'All Subjects', icon: '🎯', color: C.purple },
    { id: 'air_regulations', label: 'Air Regulations', icon: '📋', color: C.primary },
    { id: 'meteorology', label: 'Meteorology', icon: '🌦️', color: '#0EA5E9' },
    { id: 'navigation', label: 'Navigation', icon: '🗺️', color: C.green },
    { id: 'technical', label: 'Technical', icon: '🔧', color: C.accent },
    { id: 'rtfm', label: 'Radio Telephony', icon: '📻', color: C.red },
];

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { icon: '🏠', label: 'Dashboard', id: 'dashboard' },
    { icon: '📚', label: 'Tests', id: 'tests' },
    { icon: '🏆', label: 'Mock Leaderboard', id: 'leaderboard' },
    { icon: '📈', label: 'My Progress', id: 'progress' },
];

function Sidebar({ user, onLogout, onNav }) {
    return (
        <div style={{ width: 220, minHeight: '100vh', background: C.sidebar, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: 'auto' }}>
            <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #1E3A5F' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src="/Logo.webp" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:20px">✈️</span>'; }} />
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>DGCA</div>
                        <div style={{ color: C.accent, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>PREP</div>
                    </div>
                </div>
                <div style={{ color: '#8BA3C5', fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>Your Flight. Our Passion.</div>
            </div>

            {user && (
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #1E3A5F', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0, marginRight: 10 }}>
                        {getInitials(user.name)}
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{user.name}</div>
                        <div style={{ color: '#8BA3C5', fontSize: 10 }}>Student</div>
                    </div>
                </div>
            )}

            <nav style={{ padding: '10px 10px', flex: 1 }}>
                <div style={{ color: '#4B6785', fontSize: 9, fontWeight: 700, letterSpacing: 1.2, padding: '8px 10px 4px', textTransform: 'uppercase' }}>Main Menu</div>
                {NAV_ITEMS.map(item => (
                    <button key={item.id} onClick={() => onNav(item.id)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                        borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                        background: item.id === 'leaderboard' ? C.primary : 'transparent',
                        color: item.id === 'leaderboard' ? '#fff' : '#8BA3C5',
                        transition: 'all .15s', appearance: 'none',
                    }}>
                        <span style={{ fontSize: 15 }}>{item.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: item.id === 'leaderboard' ? 700 : 400 }}>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Go Premium card */}
            <div style={{ margin: '12px', borderRadius: 14, background: 'linear-gradient(135deg,#1D4ED8,#7C3AED)', padding: '14px 16px' }}>
                <div style={{ color: C.accent, fontSize: 11, fontWeight: 800, marginBottom: 4 }}>👑 Go Premium</div>
                <div style={{ color: '#CBD5E1', fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>Unlock advanced mock tests &amp; detailed analytics.</div>
                <button style={{ background: '#fff', color: C.primary, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%' }}>Upgrade Now →</button>
            </div>

            <div style={{ padding: '10px 14px', borderTop: '1px solid #1E3A5F' }}>
                <button onClick={onLogout} style={{ width: '100%', background: C.red + '18', border: `1px solid ${C.red}50`, borderRadius: 10, padding: '8px 0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    🚪 Logout
                </button>
            </div>
        </div>
    );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ user, onLogout, onBack, search, onSearch, onRefresh, lastRefresh, loading }) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 220, right: 0, height: 64, background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, zIndex: 90 }}>
            <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, appearance: 'none', flexShrink: 0 }}>←</button>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>🏆 Mock Test Leaderboard</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                    {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Loading…'}
                </div>
            </div>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', background: C.bg, borderRadius: 10, padding: '8px 14px', border: `1px solid ${C.border}`, gap: 8 }}>
                <span style={{ color: C.muted, fontSize: 14 }}>🔍</span>
                <input
                    placeholder="Search students…"
                    value={search}
                    onChange={e => onSearch(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: C.text, width: 160 }}
                />
                {search && (
                    <button onClick={() => onSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 14, padding: 0 }}>✕</button>
                )}
            </div>

            {/* Notification bell */}
            <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 10, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `1px solid ${C.border}`, flexShrink: 0, fontSize: 16 }}>
                🔔
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: C.red, borderRadius: '50%', border: '2px solid #fff' }} />
            </div>

            {/* Refresh */}
            <button onClick={onRefresh} style={{ width: 34, height: 34, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, appearance: 'none', flexShrink: 0 }} title="Refresh">🔄</button>

            {/* User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                    {getInitials(user?.name)}
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{user?.name || 'Student'}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>Student ▾</div>
                </div>
            </div>

            <button onClick={onLogout} style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Logout</button>
        </div>
    );
}

// ─── PODIUM ───────────────────────────────────────────────────────────────────
function Podium({ top3, user }) {
    if (top3.length < 2) return null;

    const order = top3.length >= 3
        ? [{ entry: top3[1], rank: 2, height: 120 }, { entry: top3[0], rank: 1, height: 160 }, { entry: top3[2], rank: 3, height: 100 }]
        : [{ entry: top3[1], rank: 2, height: 120 }, { entry: top3[0], rank: 1, height: 160 }];

    const podiumColors = { 1: C.accent, 2: C.primary, 3: C.purple };

    return (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, marginBottom: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>🏆 Top Performers</div>
                <div style={{ fontSize: 13, color: C.muted }}>Highest accuracy in mock tests</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16 }}>
                {order.map(({ entry, rank, height }) => {
                    const isYou = entry.email === user?.email;
                    const color = podiumColors[rank];
                    return (
                        <div key={entry.email} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 140 }}>
                            {isYou && (
                                <span style={{ background: C.green + '25', color: C.green, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginBottom: 4, display: 'inline-block' }}>You</span>
                            )}
                            <div style={{
                                width: 60, height: 60, borderRadius: 30,
                                background: `linear-gradient(135deg,${color},${color}cc)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 8,
                                border: `3px solid ${isYou ? C.green : '#fff'}`,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}>
                                {getInitials(entry.name)}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4, textAlign: 'center' }}>
                                {entry.name.split(' ')[0]}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 800, color, marginBottom: 8 }}>{entry.accuracy}%</div>
                            <div style={{ fontSize: 20, marginBottom: 8 }}>{medals[rank - 1]}</div>
                            <div style={{
                                width: '100%', height,
                                background: color + '20', border: `2px solid ${color}`,
                                borderBottom: 'none', borderRadius: '8px 8px 0 0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span style={{ color, fontSize: 14, fontWeight: 900 }}>#{rank}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── LEADERBOARD TABLE ────────────────────────────────────────────────────────
function LeaderboardTable({ board, user, loading }) {
    if (loading) {
        return (
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                    <Skeleton h={20} w="40%" />
                </div>
                {Array(8).fill(0).map((_, i) => (
                    <div key={i} style={{ padding: '14px 22px', borderTop: i > 0 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Skeleton w={36} h={36} r={18} />
                        <Skeleton w={42} h={42} r={21} />
                        <div style={{ flex: 1 }}>
                            <Skeleton h={14} style={{ marginBottom: 6 }} />
                            <Skeleton h={10} w="55%" />
                        </div>
                        <Skeleton w={70} h={16} />
                    </div>
                ))}
            </div>
        );
    }

    if (board.length === 0) {
        return (
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>No scores yet!</div>
                <div style={{ fontSize: 13, color: C.muted }}>Be the first to complete a mock test and claim the top spot.</div>
            </div>
        );
    }

    return (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>All Rankings</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{board.length} pilots</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green }} />
                </div>
            </div>

            {/* Table header */}
            <div style={{ padding: '8px 22px', background: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, fontSize: 11, color: C.muted, fontWeight: 700, flexShrink: 0 }}>Rank</div>
                <div style={{ width: 42, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 11, color: C.muted, fontWeight: 700 }}>Student</div>
                <div style={{ width: 90, fontSize: 11, color: C.muted, fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>Score</div>
                <div style={{ width: 100, fontSize: 11, color: C.muted, fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>Accuracy</div>
            </div>

            <div style={{ padding: '8px 0' }}>
                {board.map((entry, i) => {
                    const isYou = entry.email === user?.email;
                    const rank = i + 1;
                    return (
                        <div
                            key={`${entry.email}-${entry.subject}`}
                            style={{ padding: '14px 22px', borderTop: i > 0 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'background .2s', background: isYou ? C.primaryLight : 'transparent' }}
                            onMouseEnter={e => { if (!isYou) e.currentTarget.style.background = C.bg; }}
                            onMouseLeave={e => { if (!isYou) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {/* Rank badge */}
                            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: isYou ? `linear-gradient(135deg,${C.primary},${C.purple})` : rank <= 3 ? 'transparent' : C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: rank <= 3 ? 20 : 12, fontWeight: 700, color: isYou ? '#fff' : C.text }}>
                                {rank <= 3 ? medals[rank - 1] : `#${rank}`}
                            </div>

                            {/* Avatar */}
                            <div style={{ width: 42, height: 42, borderRadius: 21, flexShrink: 0, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                                {getInitials(entry.name)}
                            </div>

                            {/* Name + meta */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
                                    {isYou && <Badge label="You" color={C.green} />}
                                    {rank === 1 && <Badge label="Top Scorer" color={C.accent} />}
                                </div>
                                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                                    {entry.subjectLabel || entry.subject} · {entry.attempts || 1} attempt{(entry.attempts || 1) !== 1 ? 's' : ''} · {formatDate(entry.submittedAt)}
                                </div>
                            </div>

                            {/* Score */}
                            <div style={{ width: 90, textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{entry.score}/{entry.total}</div>
                            </div>

                            {/* Accuracy + bar */}
                            <div style={{ width: 100, flexShrink: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: getAccuracyColor(entry.accuracy) }}>{entry.accuracy}%</span>
                                </div>
                                <ProgressBar value={entry.accuracy} color={getAccuracyColor(entry.accuracy)} height={5} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────
export default function MockLeaderboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState(null);
    const [board, setBoard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubject, setActiveSubject] = useState(searchParams.get('subject') || 'all');
    const [search, setSearch] = useState('');
    const [lastRefresh, setLastRefresh] = useState(null);

    useEffect(() => {
        const u = getUser();
        if (!u) { router.replace('/login'); return; }
        setUser(u);
    }, [router]);

    const fetchBoard = useCallback(async (subject) => {
        setLoading(true);
        try {
            const url = subject === 'all' ? '/api/mock-leaderboard' : `/api/mock-leaderboard?subject=${subject}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setBoard(data.entries);
                setLastRefresh(new Date());
            }
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) fetchBoard(activeSubject);
    }, [user, activeSubject, fetchBoard]);

    const handleLogout = useCallback(() => { clearUser(); router.replace('/login'); }, [router]);
    const handleNav = useCallback((page) => {
        if (page === 'dashboard') router.push('/dashboard');
        else if (page === 'tests') router.push('/dashboard');
        else if (page === 'progress') router.push('/dashboard');
    }, [router]);

    const filteredBoard = search.trim()
        ? board.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
        : board;

    const top3 = filteredBoard.slice(0, 3);
    const userEntry = board.find(e => e.email === user?.email);
    const userRank = board.findIndex(e => e.email === user?.email) + 1;
    const avgAccuracy = board.length
        ? Math.round(board.reduce((s, e) => s + e.accuracy, 0) / board.length)
        : 0;

    const activeTab = SUBJECT_TABS.find(t => t.id === activeSubject) || SUBJECT_TABS[0];

    if (!user) return null;

    return (
        <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.bg, minHeight: '100vh' }}>
            <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        *{box-sizing:border-box;margin:0}
        button:hover{opacity:.9}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px}
        body{overflow-x:hidden}
      `}</style>

            <Sidebar user={user} onLogout={handleLogout} onNav={handleNav} />

            <TopBar
                user={user}
                onLogout={handleLogout}
                onBack={() => router.push('/dashboard')}
                search={search}
                onSearch={setSearch}
                onRefresh={() => fetchBoard(activeSubject)}
                lastRefresh={lastRefresh}
                loading={loading}
            />

            <main style={{ marginLeft: 220, paddingTop: 64 }}>
                <div style={{ padding: '28px 32px', maxWidth: 1100 }}>

                    {/* Hero banner */}
                    <div style={{
                        background: `linear-gradient(120deg,${C.sidebar} 0%,${C.primary} 100%)`,
                        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20,
                    }}>
                        <div>
                            <div style={{ color: '#93C5FD', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🎯 Mock Test Rankings</div>
                            <div style={{ color: '#fff', fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
                                See Where You Stand<br />Among All Pilots
                            </div>
                            <div style={{ color: '#93C5FD', fontSize: 13, marginBottom: 18 }}>
                                {loading ? 'Loading rankings...' : `${board.length} students · ranked by best accuracy`}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => router.push('/dashboard')} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                    📝 Take Mock Test
                                </button>
                                <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                    📊 Dashboard
                                </button>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ color: '#93C5FD', fontSize: 12, marginBottom: 4 }}>Your Rank</div>
                            <div style={{ color: '#fff', fontSize: 42, fontWeight: 900, lineHeight: 1 }}>
                                {userRank > 0 ? `#${userRank}` : '–'}
                            </div>
                            {userEntry && (
                                <>
                                    <div style={{ color: '#93C5FD', fontSize: 12, marginTop: 10, marginBottom: 2 }}>Your Best Score</div>
                                    <div style={{ color: '#fff', fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{userEntry.accuracy}%</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
                        {loading
                            ? Array(4).fill(0).map((_, i) => <div key={i} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}><Skeleton h={48} /></div>)
                            : <>
                                <StatCard icon="👥" label="Total Students" value={board.length} color={C.primary} />
                                <StatCard icon="🥇" label="Top Accuracy" value={board[0] ? `${board[0].accuracy}%` : '—'} color={C.accent} />
                                <StatCard icon="🎯" label="Avg Accuracy" value={`${avgAccuracy}%`} color={C.green} />
                                <StatCard icon="📝" label="Your Attempts" value={userEntry?.attempts || 0} color={C.purple} />
                            </>
                        }
                    </div>

                    {/* Subject tabs */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                        {SUBJECT_TABS.map(tab => {
                            const isActive = activeSubject === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveSubject(tab.id)} style={{
                                    padding: '8px 16px', borderRadius: 24,
                                    border: isActive ? `2px solid ${tab.color}` : `1px solid ${C.border}`,
                                    background: isActive ? tab.color + '18' : C.card,
                                    color: isActive ? tab.color : C.muted,
                                    fontWeight: isActive ? 700 : 400, fontSize: 13, cursor: 'pointer', appearance: 'none',
                                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
                                }}>
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    {isActive && !loading && (
                                        <span style={{ background: tab.color + '20', color: tab.color, fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                                            {filteredBoard.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Podium */}
                    {!loading && !search && top3.length >= 2 && (
                        <Podium top3={top3} user={user} />
                    )}

                    {/* Table */}
                    <LeaderboardTable board={filteredBoard} user={user} loading={loading} />

                    {/* Your position callout (if not in top 10) */}
                    {!loading && userEntry && userRank > 10 && (
                        <div style={{
                            marginTop: 16, background: C.primaryLight, border: `1px solid ${C.primary}40`,
                            borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
                        }}>
                            <div style={{ width: 40, height: 40, borderRadius: 20, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                                {getInitials(user.name)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{user.name} <Badge label="You" color={C.green} /></div>
                                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                                    Rank #{userRank} · {userEntry.accuracy}% accuracy · {userEntry.score}/{userEntry.total} correct
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>#{userRank}</div>
                                <div style={{ fontSize: 11, color: C.muted }}>Your position</div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div style={{ marginLeft: 0, background: C.sidebar, padding: '16px 32px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 }}>
                    {[
                        ['🏆', 'Rankings', 'Compete'],
                        ['🎯', 'Accuracy', 'Score'],
                        ['📊', 'Analytics', 'Track'],
                        ['👨‍🏫', 'Support', 'Help'],
                        ['🎓', 'Practice', 'Learn'],
                        ['📱', 'Mobile', 'App'],
                    ].map(([icon, val, label]) => (
                        <div key={label} style={{ textAlign: 'center', padding: '3px 10px' }}>
                            <div style={{ fontSize: 16 }}>{icon}</div>
                            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{val}</div>
                            <div style={{ color: '#8BA3C5', fontSize: 10 }}>{label}</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}