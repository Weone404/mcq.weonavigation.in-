'use client';
import { useState, useEffect } from 'react';
import { SCENARIOS } from '../../../lib/rtr/scenarios';
import { scoreSession } from '../../../lib/rtr/scorer';
import { useRtrSession } from '../../../hooks/useRtrSession';
import ATCPanel from '../../../components/rtr/ATCPanel';
import PilotMic from '../../../components/rtr/PilotMic';
import TranscriptPanel from '../../../components/rtr/TranscriptPanel';
import ScenarioProgress from '../../../components/rtr/ScenarioProgress';
import ScoringPanel from '../../../components/rtr/ScoringPanel';
import Link from 'next/link';

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const T = {
    bg: '#EEF2FB',
    card: '#FFFFFF',
    cardAlt: '#F7F9FF',
    border: '#E2E8F0',
    borderMid: '#BFDBFE',
    hairline: '#F1F5F9',

    blue: '#1D4ED8',
    blueLight: '#3B82F6',
    blueGhost: '#EFF6FF',

    amber: '#D97706',
    amberLight: '#F59E0B',
    amberGhost: '#FFFBEB',

    green: '#059669',
    greenLight: '#10B981',
    greenGhost: '#ECFDF5',

    red: '#DC2626',
    redLight: '#EF4444',
    redGhost: '#FEF2F2',

    cyan: '#0891B2',
    cyanLight: '#06B6D4',

    text: '#0F172A',
    textSub: '#334155',
    muted: '#64748B',
    mutedLight: '#94A3B8',

    sans: "'DM Sans','Segoe UI',sans-serif",
    mono: "'JetBrains Mono','Fira Code','Courier New',monospace",
};

function hex(h, a) {
    const n = parseInt(h.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ── Primitives ────────────────────────────────────────────────────────────────
function Badge({ children, color = T.blue, size = 'sm' }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            fontFamily: T.sans, fontSize: size === 'lg' ? 11 : 10,
            fontWeight: 700, letterSpacing: '0.03em',
            color, background: hex(color, 0.1),
            border: `1px solid ${hex(color, 0.25)}`,
            borderRadius: 99, padding: size === 'lg' ? '4px 14px' : '2px 9px',
            whiteSpace: 'nowrap', flexShrink: 0,
        }}>{children}</span>
    );
}

function PulseDot({ active, color }) {
    return (
        <span style={{
            display: 'inline-block', width: 8, height: 8,
            borderRadius: '50%', flexShrink: 0,
            background: active ? color : T.border,
            boxShadow: active ? `0 0 0 3px ${hex(color, 0.2)}` : 'none',
            transition: 'all .3s',
        }} />
    );
}

function SectionLabel({ children, color, dot, dotColor, dotActive, action }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12,
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontFamily: T.sans, fontSize: 10, fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: color || T.muted,
            }}>
                {dot && <PulseDot active={dotActive} color={dotColor} />}
                {children}
            </div>
            {action}
        </div>
    );
}

function Card({ children, accent, glowColor, style: s = {} }) {
    return (
        <div style={{
            background: T.card,
            border: `1px solid ${accent ? hex(accent, 0.3) : T.border}`,
            borderTop: `2px solid ${accent || T.border}`,
            borderRadius: 16,
            boxShadow: glowColor
                ? `0 0 0 1px ${hex(glowColor, 0.08)}, 0 8px 32px ${hex(glowColor, 0.1)}`
                : '0 1px 4px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.04)',
            overflow: 'hidden', ...s,
        }}>{children}</div>
    );
}

function Pad({ children, style: s = {} }) {
    return <div style={{ padding: '20px 22px', ...s }}>{children}</div>;
}

function Divider() {
    return <div style={{ height: 1, background: T.hairline }} />;
}

function PrimaryBtn({ onClick, children, variant = 'blue', full }) {
    const [hov, setHov] = useState(false);
    const configs = {
        blue: { bg: `linear-gradient(135deg,${T.blue},${T.blueLight})`, shadow: hex(T.blue, 0.28), color: '#fff' },
        green: { bg: `linear-gradient(135deg,${T.green},${T.greenLight})`, shadow: hex(T.green, 0.28), color: '#fff' },
        ghost: { bg: T.blueGhost, shadow: 'none', color: T.blue, border: `1.5px solid ${T.borderMid}` },
    };
    const cfg = configs[variant] || configs.blue;
    return (
        <button onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: full ? '100%' : 'auto', padding: '13px 28px',
                fontFamily: T.sans, fontSize: 13, fontWeight: 700,
                color: cfg.color, background: cfg.bg,
                border: cfg.border || 'none', borderRadius: 12, cursor: 'pointer',
                boxShadow: hov ? 'none' : `0 4px 16px ${cfg.shadow}`,
                opacity: hov ? 0.88 : 1,
                transform: hov ? 'translateY(-1px)' : 'translateY(0)',
                transition: 'all .15s ease', WebkitAppearance: 'none',
            }}>{children}</button>
    );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, max, size = 88 }) {
    const pct = max > 0 ? score / max : 0;
    const r = (size - 10) / 2;
    const c = 2 * Math.PI * r;
    const col = pct >= 0.8 ? T.greenLight : pct >= 0.5 ? T.amberLight : T.redLight;
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={hex(col, 0.15)} strokeWidth={7} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={7}
                    strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round" />
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontFamily: T.sans, fontWeight: 900, fontSize: size * 0.23, color: col, lineHeight: 1 }}>{score}</span>
                <span style={{ fontFamily: T.sans, fontSize: size * 0.14, color: T.muted, lineHeight: 1.3 }}>/{max}</span>
            </div>
        </div>
    );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, color }) {
    return (
        <div style={{
            flex: 1, minWidth: 0, textAlign: 'center',
            padding: '12px 10px', borderRadius: 10,
            background: color ? hex(color, 0.06) : T.cardAlt,
            border: `1px solid ${color ? hex(color, 0.15) : T.border}`,
        }}>
            <div style={{ fontFamily: T.sans, fontWeight: 900, fontSize: 20, color: color || T.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 700, color: T.mutedLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 5 }}>{label}</div>
        </div>
    );
}

// ── Expected readback chips (reused in active + result views) ─────────────────
function ReadbackChips({ phase, userTranscript, showMatch }) {
    const items = phase?.expectedReadback
        ? (Array.isArray(phase.expectedReadback)
            ? phase.expectedReadback
            : phase.expectedReadback.split(',').map(s => s.trim()))
        : [];

    if (!items.length) return null;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {items.map((item, i) => {
                const matched = showMatch
                    ? (userTranscript || '').toLowerCase().includes(item.toLowerCase())
                    : null;

                const color = matched === null
                    ? T.blue
                    : matched ? T.green : T.red;
                const colorLight = matched === null
                    ? T.blueLight
                    : matched ? T.greenLight : T.redLight;

                return (
                    <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: T.sans, fontSize: 11, fontWeight: 700,
                        color,
                        background: hex(colorLight, 0.1),
                        border: `1px solid ${hex(colorLight, 0.3)}`,
                        borderRadius: 6, padding: '4px 10px',
                        transition: 'all .3s',
                    }}>
                        {matched === true && <span style={{ fontSize: 10 }}>✓</span>}
                        {matched === false && <span style={{ fontSize: 10 }}>✗</span>}
                        {item}
                    </span>
                );
            })}
        </div>
    );
}

// ── Phase result accordion ────────────────────────────────────────────────────
function PhaseRow({ phase, transcript, phaseResult, index }) {
    const [open, setOpen] = useState(false);
    const score = phaseResult?.score ?? 0;
    const max = phase.maxScore;
    const pct = max > 0 ? score / max : 0;
    const col = pct >= 0.8 ? T.green : pct >= 0.5 ? T.amber : T.red;
    const colL = pct >= 0.8 ? T.greenLight : pct >= 0.5 ? T.amberLight : T.redLight;
    const statusLabel = pct >= 0.8 ? 'Excellent' : pct >= 0.5 ? 'Partial' : 'Needs Work';

    return (
        <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderLeft: `3px solid ${colL}`,
            borderRadius: 12, overflow: 'hidden',
            boxShadow: open ? '0 4px 20px rgba(15,23,42,0.08)' : '0 1px 3px rgba(15,23,42,0.04)',
            transition: 'box-shadow .2s',
        }}>
            {/* Collapsed header */}
            <button onClick={() => setOpen(o => !o)} style={{
                width: '100%', display: 'grid',
                gridTemplateColumns: '36px 1fr auto auto',
                alignItems: 'center', gap: 12,
                padding: '13px 16px',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: hex(colL, 0.12), border: `1px solid ${hex(colL, 0.3)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: T.sans, fontSize: 12, fontWeight: 900, color: col,
                }}>{index + 1}</div>

                <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 13, color: T.text }}>{phase.label}</div>
                    <div style={{
                        fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{phase.atcUnit}{phase.frequency ? ` · ${phase.frequency} MHz` : ''}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
                    <span style={{ fontFamily: T.sans, fontWeight: 900, fontSize: 18, color: colL }}>{score}</span>
                    <span style={{ fontFamily: T.sans, fontSize: 12, color: T.muted }}>/{max}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                    <Badge color={colL}>{statusLabel}</Badge>
                    <span style={{
                        display: 'inline-block', fontSize: 12, color: T.muted,
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform .2s',
                    }}>▾</span>
                </div>
            </button>

            {/* Thin progress bar */}
            <div style={{ height: 3, background: T.hairline }}>
                <div style={{
                    width: `${pct * 100}%`, height: '100%',
                    background: `linear-gradient(90deg,${col},${colL})`,
                    transition: 'width .6s ease',
                }} />
            </div>

            {/* Expanded body */}
            {open && (
                <div>
                    {/* ATC */}
                    <div style={{ padding: '16px 18px', background: hex(T.cyan, 0.03), borderBottom: `1px solid ${T.border}` }}>
                        <SectionLabel color={T.cyan}>📡 ATC Transmission</SectionLabel>
                        <div style={{
                            fontFamily: T.mono, fontSize: 12.5, color: T.text,
                            background: hex(T.cyan, 0.06), border: `1px solid ${hex(T.cyan, 0.18)}`,
                            borderRadius: 8, padding: '11px 14px', lineHeight: 1.75,
                        }}>{phase.atcScript || phase.atcText || <em style={{ color: T.muted }}>—</em>}</div>

                        {/* Expected readback chips with match highlighting */}
                        {phase.expectedReadback && (
                            <div style={{ marginTop: 11 }}>
                                <div style={{
                                    fontFamily: T.sans, fontSize: 10, fontWeight: 700,
                                    letterSpacing: '0.07em', textTransform: 'uppercase',
                                    color: T.muted, marginBottom: 7,
                                }}>Required Readback Elements</div>
                                <ReadbackChips phase={phase} userTranscript={transcript} showMatch={true} />
                            </div>
                        )}
                    </div>

                    {/* Model answer */}
                    {phase.modelAnswer && (
                        <div style={{ padding: '14px 18px', background: hex(T.blue, 0.02), borderBottom: `1px solid ${T.border}` }}>
                            <SectionLabel color={T.blue}>📖 Model Answer</SectionLabel>
                            <div style={{
                                fontFamily: T.mono, fontSize: 12.5, color: T.text,
                                background: hex(T.blue, 0.05), border: `1px solid ${hex(T.blue, 0.18)}`,
                                borderRadius: 8, padding: '11px 14px', lineHeight: 1.75,
                            }}>{phase.modelAnswer}</div>
                        </div>
                    )}

                    {/* Your response */}
                    <div style={{ padding: '16px 18px', background: hex(T.green, 0.02), borderBottom: `1px solid ${T.border}` }}>
                        <SectionLabel color={T.green}>🎙 Your Response</SectionLabel>
                        <div style={{
                            fontFamily: T.mono, fontSize: 12.5, lineHeight: 1.75,
                            color: transcript ? T.text : T.muted,
                            background: hex(T.green, 0.05), border: `1px solid ${hex(T.green, 0.18)}`,
                            borderRadius: 8, padding: '11px 14px',
                            fontStyle: transcript ? 'normal' : 'italic',
                        }}>{transcript || 'No response recorded'}</div>
                    </div>

                    {/* Feedback list */}
                    {phaseResult?.feedback?.length > 0 && (
                        <div style={{ padding: '16px 18px' }}>
                            <SectionLabel color={T.muted}>Feedback</SectionLabel>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {phaseResult.feedback.map((fb, i) => {
                                    const good = fb.type === 'correct' || fb.points > 0;
                                    const fc = good ? T.green : T.red;
                                    const fcL = good ? T.greenLight : T.redLight;
                                    return (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                            padding: '9px 12px', borderRadius: 9,
                                            background: hex(fcL, 0.07), border: `1px solid ${hex(fcL, 0.2)}`,
                                        }}>
                                            <span style={{
                                                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                                                background: hex(fcL, 0.15), border: `1px solid ${hex(fcL, 0.3)}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 10, color: fc, fontWeight: 800,
                                            }}>{good ? '✓' : '✗'}</span>
                                            <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.textSub, lineHeight: 1.5, flex: 1 }}>
                                                {fb.message || fb.text || String(fb)}
                                            </span>
                                            {fb.points !== undefined && (
                                                <span style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 11, color: fc, flexShrink: 0 }}>
                                                    {fb.points > 0 ? `+${fb.points}` : fb.points}pt
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Result sheet ──────────────────────────────────────────────────────────────
function ResultSheet({ result, scenario, transcripts, duration }) {
    const total = result?.totalScore ?? 0;
    const max = result?.maxScore ?? scenario.phases.reduce((s, p) => s + p.maxScore, 0);
    const pct = max > 0 ? total / max : 0;
    const passed = pct >= 0.65;
    const grade = pct >= 0.8 ? 'A' : pct >= 0.65 ? 'B' : pct >= 0.5 ? 'C' : 'F';
    const gradeCol = pct >= 0.8 ? T.greenLight : pct >= 0.65 ? T.amberLight : pct >= 0.5 ? T.amberLight : T.redLight;
    const mins = Math.floor((duration || 0) / 60);
    const secs = ((duration || 0) % 60).toString().padStart(2, '0');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Hero ── */}
            <div style={{
                display: 'flex', gap: 18, alignItems: 'center',
                padding: '20px 22px', borderRadius: 14,
                background: passed
                    ? `linear-gradient(135deg,${hex(T.green, 0.07)},${hex(T.blue, 0.05)})`
                    : `linear-gradient(135deg,${hex(T.red, 0.07)},${hex(T.amber, 0.05)})`,
                border: `1px solid ${passed ? hex(T.green, 0.18) : hex(T.red, 0.18)}`,
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <ScoreRing score={total} max={max} size={92} />
                    <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: hex(gradeCol, 0.15), border: `2px solid ${hex(gradeCol, 0.35)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: T.sans, fontWeight: 900, fontSize: 22, color: gradeCol,
                    }}>{grade}</div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    <div>
                        <div style={{ fontFamily: T.sans, fontWeight: 900, fontSize: 19, color: T.text, lineHeight: 1.2 }}>
                            {passed ? '🎉 Session Passed' : '📚 Keep Practicing'}
                        </div>
                        <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, marginTop: 4 }}>
                            {scenario.departureName} → {scenario.destinationName} · {scenario.callsign}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <StatTile label="Score" value={`${Math.round(pct * 100)}%`} color={gradeCol} />
                        <StatTile label="Points" value={`${total}/${max}`} />
                        <StatTile label="Time" value={`${mins}:${secs}`} />
                        <StatTile label="Phases" value={scenario.phases.length} />
                    </div>
                </div>

                <div style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
                    <div style={{
                        padding: '6px 14px', borderRadius: 99,
                        background: hex(passed ? T.green : T.red, 0.12),
                        border: `1.5px solid ${hex(passed ? T.green : T.red, 0.3)}`,
                        fontFamily: T.sans, fontWeight: 800, fontSize: 12,
                        color: passed ? T.green : T.red,
                    }}>{passed ? '✓ PASS' : '✗ FAIL'}</div>
                </div>
            </div>

            {/* ── Bar chart ── */}
            <div>
                <SectionLabel color={T.muted}>Score Breakdown</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {scenario.phases.map((phase, i) => {
                        const pr = result?.phases?.[i] ?? result?.phaseResults?.[i];
                        const s = pr?.score ?? 0;
                        const m = phase.maxScore;
                        const p = m > 0 ? s / m : 0;
                        const bc = p >= 0.8 ? T.greenLight : p >= 0.5 ? T.amberLight : T.redLight;
                        return (
                            <div key={phase.id} style={{ display: 'grid', gridTemplateColumns: '118px 1fr 44px', alignItems: 'center', gap: 10 }}>
                                <div style={{ fontFamily: T.sans, fontSize: 12, color: T.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {phase.label}
                                </div>
                                <div style={{ height: 9, borderRadius: 99, background: hex(bc, 0.12), overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${p * 100}%`, height: '100%', borderRadius: 99,
                                        background: `linear-gradient(90deg,${bc},${hex(bc, 0.7)})`,
                                        transition: 'width .8s ease',
                                    }} />
                                </div>
                                <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 12, color: bc, textAlign: 'right' }}>
                                    {s}/{m}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Divider />

            {/* ── Phase accordion ── */}
            <div>
                <SectionLabel color={T.muted} action={<Badge color={T.blue}>Tap to expand</Badge>}>
                    Phase-by-Phase Review
                </SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {scenario.phases.map((phase, i) => {
                        const pr = result?.phases?.[i] ?? result?.phaseResults?.[i];
                        const tx = transcripts?.[i]?.transcript ?? transcripts?.[i] ?? '';
                        return <PhaseRow key={phase.id} phase={phase} transcript={tx} phaseResult={pr} index={i} />;
                    })}
                </div>
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 10 }}>
                <PrimaryBtn onClick={() => window.location.reload()} full>↩ Practice Again</PrimaryBtn>
                <Link href="/rtr" style={{ flex: 1, textDecoration: 'none' }}>
                    <PrimaryBtn full variant="ghost">← Back to RTR</PrimaryBtn>
                </Link>
            </div>
        </div>
    );
}

// ─── ACTIVE PHASE Q&A PANEL ───────────────────────────────────────────────────
// Shows: 1) ATC question  2) Expected answer  3) Mic + match result
function ActiveQAPanel({
    currentPhase,
    sessionState,
    replayATC,
    submitPilotResponse,
    isAwaitingPilot,
    isATCSpeaking,
    isSubmitted,
    currentResult,
    currentPhaseIndex,
    transcripts,
    isLastPhase,
    goToNextPhase,
}) {
    const userTranscript = transcripts[currentPhaseIndex]?.transcript ?? '';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── ZONE 1: ATC QUESTION ─────────────────────────────────────── */}
            <Card accent={isATCSpeaking ? T.cyanLight : T.blue} glowColor={isATCSpeaking ? T.cyanLight : undefined}>
                {/* Zone header bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 18px',
                    background: isATCSpeaking
                        ? `linear-gradient(90deg,${hex(T.cyanLight, 0.12)},${hex(T.blue, 0.04)})`
                        : hex(T.blue, 0.04),
                    borderBottom: `1px solid ${isATCSpeaking ? hex(T.cyanLight, 0.25) : T.hairline}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: hex(T.blue, 0.12), border: `1px solid ${hex(T.blue, 0.25)}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: T.sans, fontSize: 11, fontWeight: 900, color: T.blue,
                        }}>1</div>
                        <div style={{
                            fontFamily: T.sans, fontSize: 10, fontWeight: 800,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            color: isATCSpeaking ? T.cyan : T.blue,
                        }}>
                            ATC Transmission — The Question
                        </div>
                        {isATCSpeaking && <PulseDot active color={T.cyanLight} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isATCSpeaking && <Badge color={T.cyan}>On Air</Badge>}
                        {currentPhase?.frequency && (
                            <div style={{
                                fontFamily: T.mono, fontSize: 12, fontWeight: 800,
                                color: T.cyan, background: hex(T.cyan, 0.08),
                                border: `1px solid ${hex(T.cyan, 0.25)}`,
                                borderRadius: 6, padding: '3px 8px',
                            }}>{currentPhase.frequency} MHz</div>
                        )}
                    </div>
                </div>

                <Pad>
                    <div className="atc-panel-zone" style={{ fontSize: 14, lineHeight: 1.75, color: T.text }}>
                        <ATCPanel phase={currentPhase} sessionState={sessionState} onReplay={replayATC} />
                    </div>
                </Pad>
            </Card>

            {/* ── ZONE 2: EXPECTED ANSWER ──────────────────────────────────── */}
            <Card accent={T.blueLight}>
                {/* Zone header bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px',
                    background: hex(T.blue, 0.04),
                    borderBottom: `1px solid ${T.hairline}`,
                }}>
                    <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: hex(T.blue, 0.12), border: `1px solid ${hex(T.blue, 0.25)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: T.sans, fontSize: 11, fontWeight: 900, color: T.blue,
                    }}>2</div>
                    <div style={{
                        fontFamily: T.sans, fontSize: 10, fontWeight: 800,
                        letterSpacing: '0.08em', textTransform: 'uppercase', color: T.blue,
                    }}>
                        Expected Readback — The Answer
                    </div>
                </div>

                <Pad>
                    {/* Required elements */}
                    {currentPhase?.expectedReadback && (
                        <div style={{ marginBottom: 14 }}>
                            <div style={{
                                fontFamily: T.sans, fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.07em', textTransform: 'uppercase',
                                color: T.muted, marginBottom: 8,
                            }}>Required elements to include</div>
                            <ReadbackChips
                                phase={currentPhase}
                                userTranscript={isSubmitted ? userTranscript : null}
                                showMatch={isSubmitted}
                            />
                            {isSubmitted && (
                                <div style={{
                                    marginTop: 8, fontFamily: T.sans, fontSize: 11, color: T.muted,
                                    fontStyle: 'italic',
                                }}>
                                    ✓ green = found in your response · ✗ red = missing
                                </div>
                            )}
                        </div>
                    )}

                    {/* Model answer */}
                    {currentPhase?.modelAnswer ? (
                        <>
                            <div style={{
                                fontFamily: T.sans, fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.07em', textTransform: 'uppercase',
                                color: T.muted, marginBottom: 6,
                            }}>Model answer</div>
                            <div style={{
                                fontFamily: T.mono, fontSize: 13, color: T.text, lineHeight: 1.8,
                                background: hex(T.blue, 0.05), border: `1px solid ${hex(T.blue, 0.18)}`,
                                borderRadius: 8, padding: '11px 14px',
                            }}>{currentPhase.modelAnswer}</div>
                        </>
                    ) : !currentPhase?.expectedReadback && (
                        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, fontStyle: 'italic' }}>
                            No expected answer defined for this phase.
                        </div>
                    )}
                </Pad>
            </Card>

            {/* ── ZONE 3: YOUR RESPONSE + MATCH ───────────────────────────── */}
            <Card
                accent={isSubmitted ? T.amberLight : isAwaitingPilot ? T.greenLight : undefined}
                glowColor={isAwaitingPilot && !isSubmitted ? T.green : undefined}
            >
                {/* Zone header bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 18px',
                    background: isAwaitingPilot && !isSubmitted
                        ? `linear-gradient(90deg,${hex(T.greenLight, 0.1)},${hex(T.green, 0.04)})`
                        : isSubmitted
                            ? hex(T.amber, 0.05)
                            : hex(T.muted, 0.04),
                    borderBottom: `1px solid ${isAwaitingPilot && !isSubmitted
                        ? hex(T.greenLight, 0.25)
                        : T.hairline}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: isSubmitted
                                ? hex(T.amber, 0.12)
                                : hex(T.green, 0.12),
                            border: `1px solid ${isSubmitted
                                ? hex(T.amber, 0.25)
                                : hex(T.green, 0.25)}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: T.sans, fontSize: 11, fontWeight: 900,
                            color: isSubmitted ? T.amber : T.green,
                        }}>3</div>
                        <div style={{
                            fontFamily: T.sans, fontSize: 10, fontWeight: 800,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            color: isSubmitted ? T.amber : isAwaitingPilot ? T.green : T.muted,
                        }}>
                            {isSubmitted ? 'Your Response + Match Result' : 'Your Response — Transmit Now'}
                        </div>
                        {isAwaitingPilot && !isSubmitted && <PulseDot active color={T.greenLight} />}
                    </div>
                    {isAwaitingPilot && !isSubmitted && <Badge color={T.greenLight}>Your Turn</Badge>}
                    {isSubmitted && <Badge color={T.amberLight}>Submitted</Badge>}
                </div>

                <Pad>
                    {/* Mic / recording controls */}
                    {!isSubmitted && (
                        <div className="pilot-mic-zone" style={{ color: T.text }}>
                            <PilotMic onSubmit={submitPilotResponse} disabled={!isAwaitingPilot} />
                        </div>
                    )}

                    {/* After submit: show transcript + per-element match */}
                    {isSubmitted && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                            {/* Transcript bubble */}
                            <div>
                                <div style={{
                                    fontFamily: T.sans, fontSize: 10, fontWeight: 700,
                                    letterSpacing: '0.07em', textTransform: 'uppercase',
                                    color: T.muted, marginBottom: 6,
                                }}>You said</div>
                                <div style={{
                                    fontFamily: T.mono, fontSize: 13, color: userTranscript ? T.text : T.muted,
                                    lineHeight: 1.8, fontStyle: userTranscript ? 'normal' : 'italic',
                                    background: hex(T.green, 0.05),
                                    border: `1px solid ${hex(T.greenLight, 0.25)}`,
                                    borderRadius: 8, padding: '11px 14px',
                                }}>{userTranscript || 'No audio recorded'}</div>
                            </div>

                            {/* Element match chips (updated with match status) */}
                            {currentPhase?.expectedReadback && (
                                <div>
                                    <div style={{
                                        fontFamily: T.sans, fontSize: 10, fontWeight: 700,
                                        letterSpacing: '0.07em', textTransform: 'uppercase',
                                        color: T.muted, marginBottom: 8,
                                    }}>Element match</div>
                                    <ReadbackChips
                                        phase={currentPhase}
                                        userTranscript={userTranscript}
                                        showMatch={true}
                                    />
                                </div>
                            )}

                            {/* Scoring panel */}
                            {currentResult && (
                                <div style={{
                                    borderTop: `1px solid ${T.hairline}`,
                                    paddingTop: 14,
                                }}>
                                    <ScoringPanel result={currentResult} phaseIndex={currentPhaseIndex} />
                                </div>
                            )}
                        </div>
                    )}
                </Pad>
            </Card>

            {/* ── NEXT PHASE BUTTON ────────────────────────────────────────── */}
            {isSubmitted && (
                <PrimaryBtn onClick={goToNextPhase} full>
                    {isLastPhase ? 'View Final Result →' : 'Next Phase →'}
                </PrimaryBtn>
            )}
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RtrPracticePage() {
    const scenario = SCENARIOS[0];

    const {
        currentPhase, currentPhaseIndex, sessionState, transcripts,
        isLastPhase, totalDuration, startSession, submitPilotResponse,
        goToNextPhase, replayATC,
    } = useRtrSession(scenario);

    const [result, setResult] = useState(null);
    const [saving, setSaving] = useState(false);

    // Client-only button overrides — avoids SSR quote-encoding hydration mismatch
    useEffect(() => {
        const id = 'rtr-global-styles';
        if (document.getElementById(id)) return;
        const el = document.createElement('style');
        el.id = id;
        el.textContent = [
            ".pilot-mic-zone button{font-family:'DM Sans','Segoe UI',sans-serif!important;font-weight:700!important;border-radius:10px!important;padding:11px 22px!important;cursor:pointer!important;transition:opacity .15s,transform .1s!important;font-size:13px!important}",
            ".pilot-mic-zone button:first-of-type{background:linear-gradient(135deg,#059669,#10B981)!important;color:#fff!important;border:none!important;box-shadow:0 4px 14px rgba(5,150,105,.28)!important}",
            ".pilot-mic-zone button:last-of-type{background:linear-gradient(135deg,#1D4ED8,#3B82F6)!important;color:#fff!important;border:none!important;box-shadow:0 4px 14px rgba(29,78,216,.28)!important}",
            ".pilot-mic-zone button:hover{opacity:.88!important;transform:translateY(-1px)!important}",
            ".pilot-mic-zone button:disabled{opacity:.35!important;cursor:not-allowed!important;transform:none!important;box-shadow:none!important}",
            ".atc-panel-zone button{background:#EFF6FF!important;color:#1D4ED8!important;border:1px solid #BFDBFE!important;border-radius:8px!important;padding:7px 16px!important;font-family:'DM Sans','Segoe UI',sans-serif!important;font-size:12px!important;font-weight:700!important;cursor:pointer!important}",
            ".atc-panel-zone button:hover{background:#DBEAFE!important}",
        ].join('');
        document.head.appendChild(el);
        return () => { document.getElementById(id)?.remove(); };
    }, []);

    const isIdle = sessionState === 'idle';
    const isCompleted = sessionState === 'completed';
    const isSubmitted = sessionState === 'submitted';
    const isAwaitingPilot = sessionState === 'awaiting_pilot';
    const isATCSpeaking = sessionState === 'atc_speaking';

    const currentResult = transcripts.length > 0
        ? scoreSession(transcripts.map(t => t.transcript), scenario)
        : null;

    useEffect(() => {
        if (!isCompleted || transcripts.length === 0 || saving) return;
        const scored = scoreSession(transcripts.map(t => t.transcript), scenario);
        setResult(scored);
        setSaving(true);
        fetch('/api/rtr/attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenarioId: scenario.id, mode: 'practice', transcripts, duration: totalDuration }),
        }).then(r => r.json()).then(() => setSaving(false)).catch(() => setSaving(false));
    }, [isCompleted]);

    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans }}>

            {/* ══ STICKY TOP BAR ══════════════════════════════════════════════ */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 40,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${T.border}`,
                boxShadow: '0 1px 12px rgba(15,23,42,0.06)',
            }}>
                <div style={{
                    maxWidth: 780, margin: '0 auto', padding: '0 20px',
                    height: 58, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 16,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href="/rtr" style={{ textDecoration: 'none' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: T.blueGhost, border: `1px solid ${T.borderMid}`,
                                borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                            }}>
                                <span style={{ color: T.blue, fontSize: 12 }}>←</span>
                                <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 800, color: T.blue }}>RTR</span>
                            </div>
                        </Link>

                        <div style={{ width: 1, height: 22, background: T.border }} />

                        <div>
                            <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 14, color: T.text, lineHeight: 1 }}>
                                RTR(A) Practice Simulator
                            </div>
                            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontWeight: 700, color: T.blue }}>{scenario.callsign}</span>
                                <span style={{ color: T.borderMid }}>·</span>
                                {scenario.departureName}
                                <span style={{ color: T.mutedLight }}>→</span>
                                {scenario.destinationName}
                            </div>
                        </div>
                    </div>

                    {!isIdle && !isCompleted && currentPhase && (
                        <div style={{
                            background: hex(T.cyan, 0.08), border: `1.5px solid ${hex(T.cyan, 0.3)}`,
                            borderRadius: 10, padding: '7px 14px', textAlign: 'right', flexShrink: 0,
                        }}>
                            <div style={{
                                fontFamily: T.sans, fontSize: 9, fontWeight: 800,
                                letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 1,
                            }}>{currentPhase.atcUnit || 'ATC'}</div>
                            <div style={{
                                fontFamily: T.mono, fontSize: 15, fontWeight: 800,
                                color: T.cyan, letterSpacing: '0.04em',
                            }}>{currentPhase.frequency ? `${currentPhase.frequency} MHz` : '—'}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ PAGE BODY ═══════════════════════════════════════════════════ */}
            <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 20px 80px' }}>

                {/* ── IDLE ─────────────────────────────────────────────────── */}
                {isIdle && (
                    <div style={{ maxWidth: 520, margin: '0 auto', paddingTop: 16 }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
                                background: T.blueGhost, border: `1.5px solid ${T.borderMid}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 34, boxShadow: `0 6px 20px ${hex(T.blue, 0.13)}`,
                            }}>🎧</div>
                            <h1 style={{ fontFamily: T.sans, fontWeight: 900, fontSize: 26, color: T.text, margin: '0 0 10px' }}>
                                Ready for RT Practice?
                            </h1>
                            <p style={{ fontFamily: T.sans, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                                6 interactive phases · DGCA-style phraseology · AI-scored readbacks
                            </p>
                        </div>

                        {/* How it works */}
                        <div style={{
                            display: 'flex', gap: 0, marginBottom: 24,
                            background: T.card, border: `1px solid ${T.border}`,
                            borderRadius: 14, overflow: 'hidden',
                        }}>
                            {[
                                { n: '1', icon: '📡', label: 'ATC speaks', sub: 'Listen to transmission' },
                                { n: '2', icon: '📖', label: 'See answer', sub: 'Study expected readback' },
                                { n: '3', icon: '🎙', label: 'You respond', sub: 'Record & get matched' },
                            ].map((step, i) => (
                                <div key={i} style={{
                                    flex: 1, textAlign: 'center', padding: '16px 12px',
                                    borderRight: i < 2 ? `1px solid ${T.hairline}` : 'none',
                                    background: i === 1 ? T.cardAlt : T.card,
                                }}>
                                    <div style={{ fontSize: 22, marginBottom: 6 }}>{step.icon}</div>
                                    <div style={{
                                        fontFamily: T.sans, fontSize: 12, fontWeight: 800,
                                        color: T.text, marginBottom: 3,
                                    }}>{step.label}</div>
                                    <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>{step.sub}</div>
                                </div>
                            ))}
                        </div>

                        <Card style={{ marginBottom: 24 }}>
                            <div style={{
                                padding: '13px 20px', display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', background: T.cardAlt,
                                borderBottom: `1px solid ${T.border}`,
                            }}>
                                <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                    Session Phases
                                </span>
                                <Badge color={T.amber}>{scenario.phases.reduce((s, p) => s + p.maxScore, 0)} pts total</Badge>
                            </div>

                            {scenario.phases.map((p, i) => (
                                <div key={p.id}>
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: '32px 1fr auto',
                                        alignItems: 'center', gap: 12, padding: '13px 20px',
                                    }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 7,
                                            background: T.blueGhost, border: `1px solid ${T.borderMid}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontFamily: T.sans, fontSize: 11, fontWeight: 900, color: T.blue,
                                        }}>{i + 1}</div>
                                        <span style={{ fontFamily: T.sans, fontSize: 13, color: T.text }}>{p.label}</span>
                                        <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 800, color: T.amber }}>{p.maxScore}pt</span>
                                    </div>
                                    {i < scenario.phases.length - 1 && <Divider />}
                                </div>
                            ))}
                        </Card>

                        <PrimaryBtn onClick={startSession} full>Start Session →</PrimaryBtn>
                    </div>
                )}

                {/* ── ACTIVE ───────────────────────────────────────────────── */}
                {!isIdle && !isCompleted && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {/* Progress */}
                        <Card>
                            <Pad style={{ padding: '14px 20px' }}>
                                <ScenarioProgress
                                    phases={scenario.phases}
                                    currentIndex={currentPhaseIndex}
                                    sessionState={sessionState}
                                />
                            </Pad>
                        </Card>

                        {/* Status strip */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 16px', borderRadius: 10,
                            background: isATCSpeaking
                                ? hex(T.cyan, 0.07)
                                : isAwaitingPilot
                                    ? hex(T.green, 0.07)
                                    : isSubmitted
                                        ? hex(T.amber, 0.07)
                                        : hex(T.blue, 0.05),
                            border: `1px solid ${isATCSpeaking
                                ? hex(T.cyan, 0.25)
                                : isAwaitingPilot
                                    ? hex(T.green, 0.25)
                                    : isSubmitted
                                        ? hex(T.amber, 0.25)
                                        : hex(T.blue, 0.15)}`,
                        }}>
                            <PulseDot active={isATCSpeaking} color={T.cyanLight} />
                            <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.muted, flex: 1 }}>
                                {isATCSpeaking
                                    ? 'Zone 1 — ATC is transmitting, listen carefully'
                                    : isAwaitingPilot
                                        ? 'Zone 3 — Your turn, respond using the expected readback in Zone 2'
                                        : isSubmitted
                                            ? 'Zone 3 — Response recorded, check your element match below'
                                            : 'Waiting…'}
                            </span>
                            <PulseDot active={isAwaitingPilot} color={T.greenLight} />
                        </div>

                        {/* ── 3-zone Q&A layout ── */}
                        <ActiveQAPanel
                            currentPhase={currentPhase}
                            sessionState={sessionState}
                            replayATC={replayATC}
                            submitPilotResponse={submitPilotResponse}
                            isAwaitingPilot={isAwaitingPilot}
                            isATCSpeaking={isATCSpeaking}
                            isSubmitted={isSubmitted}
                            currentResult={currentResult}
                            currentPhaseIndex={currentPhaseIndex}
                            transcripts={transcripts}
                            isLastPhase={isLastPhase}
                            goToNextPhase={goToNextPhase}
                        />

                        {/* Transcript log */}
                        {transcripts.length > 0 && (
                            <Card>
                                <Pad>
                                    <SectionLabel color={T.muted}>Session Transcript</SectionLabel>
                                    <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
                                        <TranscriptPanel transcripts={transcripts} phases={scenario.phases} />
                                    </div>
                                </Pad>
                            </Card>
                        )}
                    </div>
                )}

                {/* ── COMPLETED ────────────────────────────────────────────── */}
                {isCompleted && result && (
                    <Card glowColor={T.blue}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '18px 22px',
                            background: `linear-gradient(120deg,${T.blueGhost},${hex(T.blue, 0.07)})`,
                            borderBottom: `1px solid ${T.border}`,
                        }}>
                            <div>
                                <div style={{
                                    fontFamily: T.sans, fontSize: 10, fontWeight: 800,
                                    letterSpacing: '0.09em', textTransform: 'uppercase', color: T.blue, marginBottom: 4,
                                }}>Session Complete</div>
                                <div style={{ fontFamily: T.sans, fontWeight: 900, fontSize: 20, color: T.text }}>
                                    RTR(A) Practice Result
                                </div>
                            </div>
                            <Badge color={T.green} size="lg">Completed ✓</Badge>
                        </div>

                        <Pad>
                            <ResultSheet result={result} scenario={scenario} transcripts={transcripts} duration={totalDuration} />
                        </Pad>
                    </Card>
                )}

                {isCompleted && !result && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: T.muted }}>
                        <div style={{ fontSize: 32, marginBottom: 14 }}>⏳</div>
                        <div style={{ fontFamily: T.sans, fontSize: 14 }}>Calculating results…</div>
                    </div>
                )}
            </div>
        </div>
    );
}