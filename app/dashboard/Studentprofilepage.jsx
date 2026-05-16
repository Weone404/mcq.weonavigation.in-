'use client';
import { useState, useEffect } from 'react';

// ─── COLOUR TOKENS (matching dashboard) ──────────────────────────────────────
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

function getInitials(name) {
    return name ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '??';
}

function getBadge(stats) {
    if (stats.testsAttempted === 0) return { icon: '🛩️', label: 'Cadet', color: C.muted, desc: 'Just getting started' };
    if (stats.avgScore >= 80) return { icon: '🥇', label: 'Ace Pilot', color: C.accent, desc: 'Top performer' };
    if (stats.avgScore >= 60) return { icon: '🥈', label: 'Co-Pilot', color: C.muted, desc: 'Steady progress' };
    return { icon: '🥉', label: 'Student Pilot', color: '#cd7f32', desc: 'Keep practicing' };
}

function getScoreColor(pct) {
    if (pct >= 80) return C.green;
    if (pct >= 50) return C.accent;
    return C.red;
}

const ProgressBar = ({ value, color = C.primary, height = 6 }) => (
    <div style={{ background: C.border, borderRadius: 99, height, overflow: 'hidden', width: '100%' }}>
        <div style={{
            width: `${Math.min(value || 0, 100)}%`, height: '100%',
            background: color, borderRadius: 99,
            transition: 'width .8s cubic-bezier(.4,0,.2,1)',
        }} />
    </div>
);

const Badge = ({ label, color = C.primary }) => (
    <span style={{
        background: hexAlpha(color, 0.13), color,
        fontSize: 11, fontWeight: 700, padding: '3px 10px',
        borderRadius: 99, letterSpacing: 0.3, display: 'inline-block',
    }}>{label}</span>
);

// ─── RADIAL SCORE RING ────────────────────────────────────────────────────────
function ScoreRing({ value, size = 80, stroke = 7, color = C.primary, label }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - (value || 0) / 100);
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }} />
            </svg>
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                textAlign: 'center', lineHeight: 1.1,
            }}>
                <div style={{ fontSize: size < 80 ? 13 : 16, fontWeight: 800, color: C.text }}>{value ?? '–'}%</div>
                {label && <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{label}</div>}
            </div>
        </div>
    );
}

// ─── SUBJECT PERFORMANCE ROWS ─────────────────────────────────────────────────
const SUBJECT_PERF = [
    { id: 'air_regulations', label: 'Air Regulations', icon: '📋', color: C.primary },
    { id: 'meteorology', label: 'Meteorology', icon: '🌦️', color: '#0EA5E9' },
    { id: 'navigation', label: 'Navigation', icon: '🗺️', color: C.green },
    { id: 'technical', label: 'Technical General', icon: '🔧', color: C.accent },
    { id: 'rtfm', label: 'Radio Telephony', icon: '📻', color: C.red },
];

// ─── ACTIVITY HEATMAP (last 12 weeks) ────────────────────────────────────────
function ActivityHeatmap({ results }) {
    const today = new Date();
    const weeks = 12;
    const days = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);

    const activityMap = {};
    results.forEach(r => {
        const d = new Date(r.date).toISOString().slice(0, 10);
        activityMap[d] = (activityMap[d] || 0) + 1;
    });

    const cells = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        cells.push({ key, count: activityMap[key] || 0, day: d.getDay() });
    }

    function cellColor(count) {
        if (count === 0) return C.border;
        if (count === 1) return hexAlpha(C.primary, 0.3);
        if (count === 2) return hexAlpha(C.primary, 0.55);
        return C.primary;
    }

    const totalActive = Object.values(activityMap).filter(v => v > 0).length;
    const totalTests = results.length;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>📅 Activity</div>
                <span style={{ fontSize: 11, color: C.muted }}>{totalActive} active days · {totalTests} tests</span>
            </div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {cells.map(({ key, count }) => (
                    <div key={key} title={`${key}: ${count} test${count !== 1 ? 's' : ''}`}
                        style={{ width: 12, height: 12, borderRadius: 3, background: cellColor(count), transition: 'background .2s', cursor: count > 0 ? 'pointer' : 'default' }} />
                ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 10, color: C.muted }}>Less</span>
                {[C.border, hexAlpha(C.primary, 0.3), hexAlpha(C.primary, 0.55), C.primary].map((bg, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: bg }} />
                ))}
                <span style={{ fontSize: 10, color: C.muted }}>More</span>
            </div>
        </div>
    );
}

// ─── STREAK COUNTER ───────────────────────────────────────────────────────────
function computeStreak(results) {
    if (!results.length) return 0;
    const days = [...new Set(results.map(r => new Date(r.date).toISOString().slice(0, 10)))].sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    if (days[0] !== today && days[0] !== new Date(Date.now() - 86400000).toISOString().slice(0, 10)) return 0;
    let streak = 1;
    for (let i = 1; i < days.length; i++) {
        const diff = (new Date(days[i - 1]) - new Date(days[i])) / 86400000;
        if (diff === 1) streak++;
        else break;
    }
    return streak;
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditProfileModal({ user, onSave, onClose }) {
    const [form, setForm] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        target: user.target || 'CPL',
        bio: user.bio || '',
        location: user.location || '',
    });

    function handleChange(k, v) { setForm(f => ({ ...f, [k]: v })); }

    const inputStyle = {
        width: '100%', border: `1px solid ${C.border}`, borderRadius: 10,
        padding: '9px 12px', fontSize: 13, color: C.text,
        background: C.bg, outline: 'none', boxSizing: 'border-box',
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
    };
    const labelStyle = { fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 5, display: 'block' };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{
                background: C.card, borderRadius: 18, width: '100%', maxWidth: 460,
                border: `1px solid ${C.border}`, overflow: 'hidden',
                maxHeight: '90vh', overflowY: 'auto',
            }}>
                <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>✏️ Edit Profile</div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted, lineHeight: 1 }}>×</button>
                </div>
                <div style={{ padding: '18px 22px' }}>
                    <div style={{ marginBottom: 14 }}><label style={labelStyle}>Full Name</label><input value={form.name} onChange={e => handleChange('name', e.target.value)} style={inputStyle} /></div>
                    <div style={{ marginBottom: 14 }}><label style={labelStyle}>Email</label><input value={form.email} onChange={e => handleChange('email', e.target.value)} style={inputStyle} /></div>
                    <div style={{ marginBottom: 14 }}><label style={labelStyle}>Phone</label><input value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+91 98765 43210" style={inputStyle} /></div>
                    <div style={{ marginBottom: 14 }}><label style={labelStyle}>Location</label><input value={form.location} onChange={e => handleChange('location', e.target.value)} placeholder="City, State" style={inputStyle} /></div>
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Target Exam</label>
                        <select value={form.target} onChange={e => handleChange('target', e.target.value)} style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}>
                            {['CPL', 'ATPL', 'PPL', 'AME', 'RTR(Aero)'].map(v => <option key={v}>{v}</option>)}
                        </select>
                    </div>
                    <div style={{ marginBottom: 18 }}>
                        <label style={labelStyle}>Bio</label>
                        <textarea value={form.bio} onChange={e => handleChange('bio', e.target.value)} rows={3} placeholder="Tell us about yourself…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'none', color: C.muted, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={() => onSave(form)} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.primary},${C.purple})`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── ACHIEVEMENT BADGES ───────────────────────────────────────────────────────
function computeAchievements(stats, results) {
    const badges = [];
    if (stats.testsAttempted >= 1) badges.push({ icon: '🚀', label: 'First Flight', desc: 'Completed your first test', earned: true });
    if (stats.testsAttempted >= 10) badges.push({ icon: '✈️', label: 'Regular Flyer', desc: '10 tests completed', earned: true });
    if (stats.testsAttempted >= 25) badges.push({ icon: '🛫', label: 'Frequent Flyer', desc: '25 tests completed', earned: true });
    if (stats.bestScore >= 80) badges.push({ icon: '🎯', label: 'Sharpshooter', desc: 'Scored 80%+ on a test', earned: true });
    if (stats.bestScore >= 95) badges.push({ icon: '💯', label: 'Perfect Approach', desc: 'Scored 95%+ on a test', earned: true });
    if (stats.avgScore >= 70) badges.push({ icon: '📈', label: 'On Track', desc: 'Maintained 70%+ avg', earned: true });
    if (computeStreak(results) >= 3) badges.push({ icon: '🔥', label: 'Hot Streak', desc: '3-day activity streak', earned: true });
    if (stats.totalQuestions >= 100) badges.push({ icon: '📚', label: 'Bookworm', desc: '100+ questions answered', earned: true });

    const unearned = [
        { icon: '🏆', label: 'Ace Pilot', desc: 'Score 80%+ average', earned: false },
        { icon: '🌟', label: 'Star Student', desc: '50 tests completed', earned: false },
        { icon: '⚡', label: 'Speed Demon', desc: '7-day streak', earned: false },
    ].filter(b => !badges.find(e => e.label === b.label));

    return [...badges, ...unearned.slice(0, Math.max(0, 6 - badges.length))];
}

// ─── MAIN PROFILE PAGE ────────────────────────────────────────────────────────
export default function StudentProfilePage({ user: propUser, stats: propStats, allResults: propResults, onBack, onNavigate, isMobile }) {
    // ── Demo data fallback (remove when wiring to real data)
    const user = propUser || {
        name: 'Arjun Sharma', email: 'arjun@example.com',
        phone: '+91 98765 43210', location: 'Delhi, India',
        target: 'CPL', bio: 'Aspiring commercial pilot. Preparing for DGCA CPL exams. Passionate about aviation and meteorology.',
        joinedAt: '2024-08-15T00:00:00.000Z',
    };
    const stats = propStats || { testsAttempted: 18, avgScore: 73, bestScore: 91, totalQuestions: 342 };
    const allResults = propResults || [];

    const [editOpen, setEditOpen] = useState(false);
    const [profile, setProfile] = useState(user);
    const [activeTab, setActiveTab] = useState('overview');
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

    const badge = getBadge(stats);
    const streak = computeStreak(allResults);
    const achievements = computeAchievements(stats, allResults);
    const joinDate = new Date(profile.joinedAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    // Per-subject aggregation from allResults
    const subjectScores = SUBJECT_PERF.map(sub => {
        const rs = allResults.filter(r => r.subjectId === sub.id && r.total > 0);
        const avg = rs.length ? Math.round(rs.reduce((a, r) => a + (r.score / r.total) * 100, 0) / rs.length) : null;
        const best = rs.length ? Math.max(...rs.map(r => Math.round((r.score / r.total) * 100))) : null;
        return { ...sub, avg, best, attempts: rs.length };
    });

    function handleSave(form) {
        setProfile(p => ({ ...p, ...form }));
        setEditOpen(false);
    }

    const TABS = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'subjects', label: '📚 Subjects' },
        { id: 'achievements', label: '🏅 Achievements' },
        { id: 'activity', label: '📅 Activity' },
    ];

    const fade = { opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity .5s ease, transform .5s ease' };

    return (
        <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", ...fade }}>
            {editOpen && <EditProfileModal user={profile} onSave={handleSave} onClose={() => setEditOpen(false)} />}

            {/* ── Hero Card ─────────────────────────────────────────── */}
            <div style={{
                background: `linear-gradient(135deg,${C.sidebar} 0%,#1a2f55 60%,${C.primary} 100%)`,
                borderRadius: 20, padding: isMobile ? '24px 18px 20px' : '32px 32px 0', marginBottom: 0,
                position: 'relative', overflow: 'hidden',
            }}>
                {/* decorative rings */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', border: `1px solid ${hexAlpha('#fff', 0.05)}`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: -70, right: -70, width: 280, height: 280, borderRadius: '50%', border: `1px solid ${hexAlpha('#fff', 0.04)}`, pointerEvents: 'none' }} />

                {/* Back btn — BLACK text */}
                {onBack && (
                    <button onClick={onBack} style={{
                        background: '#FFFFFF',
                        border: `1px solid ${hexAlpha('#000', 0.12)}`,
                        borderRadius: 9, padding: '5px 12px',
                        color: '#000000',          // ← BLACK
                        fontSize: 12, cursor: 'pointer', marginBottom: 18,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontWeight: 600,
                    }}>
                        ← Back
                    </button>
                )}

                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 22, alignItems: isMobile ? 'flex-start' : 'flex-end' }}>
                    {/* Avatar + info */}
                    <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 20, flex: 1 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                                width: isMobile ? 72 : 90, height: isMobile ? 72 : 90, borderRadius: 20,
                                background: `linear-gradient(135deg,${C.primary},${C.purple})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 900, fontSize: isMobile ? 26 : 32,
                                border: `3px solid ${hexAlpha('#fff', 0.25)}`,
                                boxShadow: `0 8px 32px ${hexAlpha(C.purple, 0.4)}`,
                            }}>{getInitials(profile.name)}</div>
                            <div style={{
                                position: 'absolute', bottom: -4, right: -4,
                                background: C.green, borderRadius: '50%', width: 18, height: 18,
                                border: `2px solid ${C.sidebar}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 800, color: '#fff',
                            }}>✓</div>
                        </div>
                        <div style={{ paddingBottom: isMobile ? 0 : 20 }}>
                            <div style={{ color: '#93C5FD', fontSize: 11, fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>STUDENT PILOT</div>
                            <div style={{ color: '#fff', fontWeight: 900, fontSize: isMobile ? 20 : 26, lineHeight: 1.15, marginBottom: 6 }}>{profile.name}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {profile.location && <span style={{ background: hexAlpha('#fff', 0.12), color: '#CBD5E1', fontSize: 11, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>📍 {profile.location}</span>}
                                <span style={{ background: hexAlpha(C.accent, 0.2), color: C.accent, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>🎯 {profile.target || 'CPL'}</span>
                                <span style={{ background: hexAlpha('#fff', 0.1), color: '#CBD5E1', fontSize: 11, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>📅 Joined {joinDate}</span>
                            </div>
                            {profile.bio && !isMobile && (
                                <div style={{ color: '#94A3B8', fontSize: 12, lineHeight: 1.65, maxWidth: 420 }}>{profile.bio}</div>
                            )}
                        </div>
                    </div>

                    {/* Badge + edit btn */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 10, paddingBottom: isMobile ? 0 : 20, flexShrink: 0 }}>
                        <div style={{ background: hexAlpha(badge.color, 0.15), border: `1px solid ${hexAlpha(badge.color, 0.3)}`, borderRadius: 14, padding: '10px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: 26, marginBottom: 2 }}>{badge.icon}</div>
                            <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{badge.label}</div>
                            <div style={{ color: '#8BA3C5', fontSize: 10 }}>{badge.desc}</div>
                        </div>

                        {/* Edit Profile btn — BLACK text on WHITE bg */}
                        <button onClick={() => setEditOpen(true)} style={{
                            background: '#FFFFFF',
                            border: `1px solid ${hexAlpha('#000', 0.12)}`,
                            borderRadius: 9, padding: '8px 16px',
                            color: '#000000',          // ← BLACK
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            ✏️ Edit Profile
                        </button>
                    </div>
                </div>

                {isMobile && profile.bio && (
                    <div style={{ color: '#94A3B8', fontSize: 12, lineHeight: 1.65, marginTop: 12, paddingBottom: 4 }}>{profile.bio}</div>
                )}

                {/* Stat strip */}
                <div style={{
                    display: 'flex', gap: 0, marginTop: 22,
                    borderTop: `1px solid ${hexAlpha('#fff', 0.1)}`,
                    flexWrap: 'wrap',
                }}>
                    {[
                        { val: stats.testsAttempted, label: 'Tests Done', icon: '📋' },
                        { val: `${stats.avgScore}%`, label: 'Avg Score', icon: '🎯' },
                        { val: `${stats.bestScore}%`, label: 'Best Score', icon: '🏆' },
                        { val: stats.totalQuestions, label: 'Questions', icon: '❓' },
                        { val: streak > 0 ? `${streak}d` : '—', label: 'Streak', icon: '🔥' },
                    ].map((s, i) => (
                        <div key={s.label} style={{
                            flex: '1 0 80px', padding: '14px 16px', textAlign: 'center',
                            borderLeft: i > 0 ? `1px solid ${hexAlpha('#fff', 0.08)}` : 'none',
                        }}>
                            <div style={{ color: '#64748B', fontSize: 11, marginBottom: 3 }}>{s.icon} {s.label}</div>
                            <div style={{ color: '#fff', fontWeight: 900, fontSize: isMobile ? 16 : 20, lineHeight: 1 }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 4, padding: '14px 0 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: activeTab === tab.id ? C.primary : C.card,
                        color: activeTab === tab.id ? '#fff' : C.muted,
                        fontWeight: activeTab === tab.id ? 700 : 400,
                        fontSize: 13, flexShrink: 0,
                        border: activeTab === tab.id ? 'none' : `1px solid ${C.border}`,
                        transition: 'all .15s',
                    }}>{tab.label}</button>
                ))}
            </div>

            <div style={{ marginTop: 18 }}>

                {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div>
                        {/* Score overview */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
                            {[
                                { label: 'Avg Accuracy', value: stats.avgScore, color: C.primary },
                                { label: 'Best Score', value: stats.bestScore, color: C.green },
                                { label: 'Completion', value: Math.min(Math.round((stats.testsAttempted / 26) * 100), 100), color: C.accent },
                                { label: 'Streak', value: Math.min(streak * 10, 100), color: C.purple },
                            ].map(item => (
                                <div key={item.label} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                    <ScoreRing value={item.value} size={72} stroke={6} color={item.color} />
                                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, textAlign: 'center' }}>{item.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                            {/* Contact info */}
                            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                                <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 14 }}>👤 Profile Details</div>
                                {[
                                    { icon: '✉️', label: 'Email', val: profile.email },
                                    { icon: '📱', label: 'Phone', val: profile.phone || 'Not set' },
                                    { icon: '📍', label: 'Location', val: profile.location || 'Not set' },
                                    { icon: '🎯', label: 'Target Exam', val: profile.target || 'CPL' },
                                    { icon: '🛩️', label: 'Status', val: badge.label },
                                ].map(row => (
                                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
                                        <span style={{ width: 22, flexShrink: 0, fontSize: 14 }}>{row.icon}</span>
                                        <span style={{ width: 90, fontSize: 12, color: C.muted, flexShrink: 0 }}>{row.label}</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: row.val === 'Not set' ? C.muted : C.text }}>{row.val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Recent tests */}
                            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                                <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, fontWeight: 800, fontSize: 13, color: C.text }}>📈 Recent Activity</div>
                                {allResults.length === 0 ? (
                                    <div style={{ padding: '32px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>✈️</div>
                                        No tests yet. Start your first test!
                                    </div>
                                ) : allResults.slice(0, 6).map((r, i) => {
                                    const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                                    return (
                                        <div key={r.id || i} style={{ padding: '10px 18px', borderBottom: i < 5 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 9, background: hexAlpha(getScoreColor(pct), 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                                                {pct >= 80 ? '🏆' : pct >= 50 ? '✈️' : '📚'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.chapterId || 'Test'}</div>
                                                <div style={{ fontSize: 10, color: C.muted }}>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: 13, color: getScoreColor(pct) }}>{pct}%</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SUBJECTS TAB ──────────────────────────────────────── */}
                {activeTab === 'subjects' && (
                    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 18 }}>Subject-wise Performance</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {subjectScores.map(sub => (
                                <div key={sub.id}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 11, background: hexAlpha(sub.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{sub.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <div>
                                                    <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{sub.label}</span>
                                                    <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{sub.attempts} attempt{sub.attempts !== 1 ? 's' : ''}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                    {sub.best !== null && <Badge label={`Best ${sub.best}%`} color={getScoreColor(sub.best)} />}
                                                    <span style={{ fontSize: 13, fontWeight: 800, color: sub.avg !== null ? getScoreColor(sub.avg) : C.muted }}>{sub.avg !== null ? `${sub.avg}%` : '—'}</span>
                                                </div>
                                            </div>
                                            <ProgressBar value={sub.avg ?? 0} color={sub.color} height={7} />
                                        </div>
                                    </div>
                                    {sub.attempts === 0 && (
                                        <div style={{ marginLeft: 52, fontSize: 11, color: C.muted, fontStyle: 'italic' }}>No tests attempted yet</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── ACHIEVEMENTS TAB ──────────────────────────────────── */}
                {activeTab === 'achievements' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 14 }}>
                            {achievements.map((ach, i) => (
                                <div key={i} style={{
                                    background: ach.earned ? C.card : hexAlpha(C.muted, 0.05),
                                    borderRadius: 14, border: `1px solid ${ach.earned ? C.border : hexAlpha(C.muted, 0.15)}`,
                                    padding: '16px 14px', textAlign: 'center', opacity: ach.earned ? 1 : 0.5,
                                    transition: 'transform .2s',
                                }}
                                    onMouseEnter={e => { if (ach.earned) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                                    <div style={{ fontSize: 32, marginBottom: 8, filter: ach.earned ? 'none' : 'grayscale(1)' }}>{ach.icon}</div>
                                    <div style={{ fontWeight: 800, fontSize: 13, color: ach.earned ? C.text : C.muted, marginBottom: 4 }}>{ach.label}</div>
                                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{ach.desc}</div>
                                    {ach.earned && (
                                        <div style={{ marginTop: 8, display: 'inline-block', background: hexAlpha(C.green, 0.12), color: C.green, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>✓ Earned</div>
                                    )}
                                    {!ach.earned && (
                                        <div style={{ marginTop: 8, display: 'inline-block', background: hexAlpha(C.muted, 0.1), color: C.muted, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>🔒 Locked</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── ACTIVITY TAB ──────────────────────────────────────── */}
                {activeTab === 'activity' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                            <ActivityHeatmap results={allResults} />
                        </div>
                        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 16 }}>📊 Test History</div>
                            {allResults.length === 0 ? (
                                <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '24px 0' }}>No tests taken yet.</div>
                            ) : allResults.slice(0, 20).map((r, i) => {
                                const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                                return (
                                    <div key={r.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < allResults.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: getScoreColor(pct), flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{r.chapterId || r.subjectId || 'Test'}</span>
                                            <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 11, color: C.muted }}>{r.score}/{r.total}</span>
                                            <div style={{ width: 60 }}><ProgressBar value={pct} color={getScoreColor(pct)} height={4} /></div>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: getScoreColor(pct), width: 36, textAlign: 'right' }}>{pct}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}