'use client';
import Link from 'next/link';
import { useState } from 'react';

// ─── COLOUR TOKENS — matches DGCA dashboard exactly ──────────────────────────
const C = {
    bg: '#F0F4FF',           // page background (light blue-grey)
    sidebar: '#0A1628',      // sidebar / dark navy
    card: '#FFFFFF',         // white card
    cardBorder: '#E2E8F0',   // subtle border
    primary: '#1D4ED8',      // blue primary
    primaryLight: '#EFF6FF', // blue tint bg
    primaryMid: '#BFDBFE',   // blue mid
    accent: '#F59E0B',       // amber/yellow
    accentLight: '#FEF3C7',  // amber tint
    green: '#10B981',        // green
    greenLight: '#D1FAE5',   // green tint
    red: '#EF4444',
    purple: '#7C3AED',
    purpleLight: '#EDE9FE',
    text: '#0F172A',
    textMid: '#1E3A5F',
    muted: '#64748B',
    mutedLight: '#94A3B8',
    border: '#E2E8F0',
    navText: '#CBD5E1',
};

function rgba(hex, a) {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ─── MODE CARD ────────────────────────────────────────────────────────────────
function ModeCard({ href, icon, title, description, accentColor, tags }) {
    const [hovered, setHovered] = useState(false);
    return (
        <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    background: C.card,
                    border: `1.5px solid ${hovered ? accentColor : C.border}`,
                    borderTop: `3px solid ${hovered ? accentColor : C.border}`,
                    borderRadius: 14,
                    padding: '22px 20px',
                    cursor: 'pointer',
                    transition: 'border-color .2s, box-shadow .2s, transform .2s',
                    boxShadow: hovered
                        ? `0 8px 28px ${rgba(accentColor, 0.18)}`
                        : '0 2px 8px rgba(15,23,42,0.07)',
                    transform: hovered ? 'translateY(-3px)' : 'none',
                    height: '100%',
                }}
            >
                <div style={{ fontSize: 30, marginBottom: 12, lineHeight: 1 }}>{icon}</div>
                <div style={{
                    fontFamily: "'DM Sans','Segoe UI',sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    color: hovered ? accentColor : C.text,
                    marginBottom: 8,
                    transition: 'color .2s',
                }}>
                    {title}
                </div>
                <div style={{
                    fontFamily: "'DM Sans','Segoe UI',sans-serif",
                    fontSize: 12.5,
                    color: C.muted,
                    lineHeight: 1.6,
                    marginBottom: tags ? 14 : 0,
                }}>
                    {description}
                </div>
                {tags && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {tags.map(tag => (
                            <span key={tag.label} style={{
                                fontFamily: "'DM Sans','Segoe UI',sans-serif",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: 20,
                                background: rgba(tag.color, 0.12),
                                color: tag.color,
                                border: `1px solid ${rgba(tag.color, 0.25)}`,
                                display: 'inline-block',
                            }}>{tag.label}</span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}

// ─── RTR LANDING PAGE ─────────────────────────────────────────────────────────
export default function RtrLandingPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: C.bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}>

            {/* ── Hero ── */}
            <div style={{ textAlign: 'center', marginBottom: 36, maxWidth: 540 }}>

                {/* Platform badge */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    background: C.greenLight,
                    border: `1px solid ${rgba(C.green, 0.3)}`,
                    borderRadius: 20,
                    padding: '5px 14px',
                    marginBottom: 20,
                }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
                    <span style={{
                        fontFamily: "'DM Sans','Segoe UI',sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                        color: '#065F46',
                    }}>
                        We One Aviation · DGCA Prep Platform
                    </span>
                </div>

                {/* Title */}
                <h1 style={{
                    fontFamily: "'DM Sans','Segoe UI',sans-serif",
                    fontWeight: 800,
                    fontSize: 'clamp(22px, 5vw, 32px)',
                    color: C.text,
                    lineHeight: 1.2,
                    marginBottom: 12,
                }}>
                    RTR(A) Part 2 Simulator
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontFamily: "'DM Sans','Segoe UI',sans-serif",
                    fontSize: 14,
                    color: C.muted,
                    lineHeight: 1.7,
                    maxWidth: 420,
                    margin: '0 auto 22px',
                }}>
                    Practice realistic ATC radio telephony for your DGCA RTR(A) practical exam.
                    6 sequential flight phases with voice recognition and instant scoring.
                </p>

                {/* Feature pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                    {[
                        { label: '🎙️ Voice Recognition', color: C.primary },
                        { label: '6 Flight Phases', color: C.accent },
                        { label: 'ICAO Phraseology', color: C.green },
                        { label: 'AI Scoring', color: C.purple },
                    ].map(p => (
                        <span key={p.label} style={{
                            fontFamily: "'DM Sans','Segoe UI',sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '5px 13px',
                            borderRadius: 20,
                            background: rgba(p.color, 0.1),
                            border: `1px solid ${rgba(p.color, 0.22)}`,
                            color: p.color,
                            display: 'inline-block',
                        }}>{p.label}</span>
                    ))}
                </div>
            </div>

            {/* ── Mode cards ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                width: '100%',
                maxWidth: 520,
                marginBottom: 28,
            }}>
                <ModeCard
                    href="/rtr/practice"
                    icon="🎧"
                    title="Practice Mode"
                    description="Step-by-step with hints visible and scoring after each phase."
                    accentColor={C.primary}
                    tags={[
                        { label: 'Hints On', color: C.primary },
                        { label: 'Per-phase', color: C.green },
                    ]}
                />
                <ModeCard
                    href="/rtr/mock-exam"
                    icon="📋"
                    title="Mock Exam"
                    description="Full simulation, no hints, DGCA-style result sheet at the end."
                    accentColor={C.accent}
                    tags={[
                        { label: 'No Hints', color: C.accent },
                        { label: 'DGCA Style', color: C.purple },
                    ]}
                />
            </div>

            {/* ── Info strip ── */}
            <div style={{
                display: 'flex',
                gap: 0,
                marginBottom: 28,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                overflow: 'hidden',
                width: '100%',
                maxWidth: 520,
                boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
            }}>
                {[
                    { icon: '✈️', val: '6', label: 'Phases' },
                    { icon: '🎯', val: 'ICAO', label: 'Standard' },
                    { icon: '⏱️', val: '~20 min', label: 'Per session' },
                    { icon: '📊', val: 'Instant', label: 'Results' },
                ].map((item, i, arr) => (
                    <div key={item.label} style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '14px 8px',
                        borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                    }}>
                        <div style={{ fontSize: 16, marginBottom: 4 }}>{item.icon}</div>
                        <div style={{
                            fontFamily: "'DM Sans','Segoe UI',sans-serif",
                            fontWeight: 800,
                            fontSize: 14,
                            color: C.text,
                            lineHeight: 1,
                        }}>{item.val}</div>
                        <div style={{
                            fontFamily: "'DM Sans','Segoe UI',sans-serif",
                            fontSize: 11,
                            color: C.muted,
                            marginTop: 3,
                        }}>{item.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Back link ── */}
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <span style={{
                    fontFamily: "'DM Sans','Segoe UI',sans-serif",
                    fontSize: 13,
                    color: C.muted,
                    cursor: 'pointer',
                    transition: 'color .15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}
                    onMouseEnter={e => e.currentTarget.style.color = C.primary}
                    onMouseLeave={e => e.currentTarget.style.color = C.muted}
                >
                    ← Back to Dashboard
                </span>
            </Link>
        </div>
    );
}