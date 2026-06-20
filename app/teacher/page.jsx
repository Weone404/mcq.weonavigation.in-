'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { chapters, questions as allQuestions } from '../../data/questions';

const TEACHER_PASSWORD = process.env.NEXT_PUBLIC_TEACHER_PASSWORD || 'dgca@teacher2026';
const TEACHER_AUTH_KEY = 'dgca_teacher_authed';
const LIVE_POLL_MS = 15_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
    return new Date(iso).toLocaleString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}
function getScoreColor(pct) { return pct >= 80 ? '#00c864' : pct >= 60 ? '#f59e0b' : '#ef4444'; }
function getAttColor(pct) { return pct >= 80 ? '#16a34a' : pct >= 60 ? '#f59e0b' : '#ef4444'; }
function getChapterTitle(id) { return chapters.find(ch => ch.id === id)?.title || id; }
function getQuestionData(chId, qId) { return allQuestions[chId]?.find(q => q.id === qId) || null; }
function initials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
function avatarColors(i) {
    const list = [['#dbeafe', '#2563eb'], ['#dcfce7', '#16a34a'], ['#fef3c7', '#b45309'], ['#f3e8ff', '#7c3aed'], ['#ffe4e6', '#be123c']];
    return list[i % list.length];
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = '' }) {
    const [display, setDisplay] = useState(0);
    const prevRef = useRef(0);
    useEffect(() => {
        const start = prevRef.current, end = parseFloat(value) || 0;
        if (start === end) return;
        const t0 = performance.now();
        const tick = now => {
            const p = Math.min((now - t0) / 700, 1), e = 1 - Math.pow(1 - p, 4);
            setDisplay(Math.round(start + (end - start) * e));
            if (p < 1) requestAnimationFrame(tick); else prevRef.current = end;
        };
        requestAnimationFrame(tick);
    }, [value]);
    return <>{display}{suffix}</>;
}

function Counter({ value, color }) {
    const [display, setDisplay] = useState(0);
    const prev = useRef(0);
    useEffect(() => {
        const start = prev.current, end = value;
        if (start === end) return;
        const t0 = performance.now();
        const frame = now => {
            const p = Math.min((now - t0) / 500, 1), e = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(start + (end - start) * e));
            if (p < 1) requestAnimationFrame(frame); else prev.current = end;
        };
        requestAnimationFrame(frame);
    }, [value]);
    return <span style={{ color }}>{display}</span>;
}

function Ring({ pct, color, size = 52, stroke = 4 }) {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, dash = circ * pct / 100;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE CLASS BUTTON  — export for student dashboard
// ═══════════════════════════════════════════════════════════════════════════════
export function LiveClassButton() {
    const [liveData, setLiveData] = useState(null);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const prevUrl = useRef(null);
    const timerRef = useRef(null);
   
    async function fetchLiveLink() {
        try {
            const res = await fetch('/api/live-link', { cache: 'no-store' });
            const data = await res.json();
            if (data?.url) {
                if (prevUrl.current !== data.url) {
                    setVisible(false);
                    setTimeout(() => setVisible(true), 60);
                }
                setLiveData(data);
                prevUrl.current = data.url;
            } else {
                setLiveData(null); setVisible(false); prevUrl.current = null;
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }

    useEffect(() => {
        fetchLiveLink();
        timerRef.current = setInterval(fetchLiveLink, LIVE_POLL_MS);
        return () => clearInterval(timerRef.current);
    }, []);

    if (loading || !liveData?.url) return null;

    return (
        <div className={`lcb-wrap${visible ? ' lcb-in' : ''}`}>
            <div className="lcb-glow" />
            <div className="lcb-content">
                <div className="lcb-indicator">
                    <span className="lcb-ring" />
                    <span className="lcb-dot" />
                </div>
                <div className="lcb-text">
                    <span className="lcb-badge">● LIVE NOW</span>
                    <span className="lcb-label">{liveData.label || 'Live Class in Progress'}</span>
                    {liveData.setAt && (
                        <span className="lcb-since">
                            Started {new Date(liveData.setAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
                <button className="lcb-btn" onClick={() => window.open(liveData.url, '_blank', 'noopener,noreferrer')}>
                    <span className="lcb-btn-icon">📹</span>
                    Join Live Class
                    <span className="lcb-btn-arrow">→</span>
                </button>
            </div>
            <style jsx>{`
        .lcb-wrap{position:relative;overflow:hidden;border-radius:20px;background:linear-gradient(135deg,#1a0a0a,#2d0a0a);border:1.5px solid rgba(239,68,68,.4);padding:1.1rem 1.4rem;display:flex;align-items:center;box-shadow:0 0 0 1px rgba(239,68,68,.1),0 8px 32px rgba(239,68,68,.2),0 2px 8px rgba(0,0,0,.3);opacity:0;transform:translateY(-8px) scale(.98);transition:opacity .45s cubic-bezier(0.16,1,0.3,1),transform .45s cubic-bezier(0.16,1,0.3,1);margin-bottom:1.25rem;cursor:default}
        .lcb-in{opacity:1;transform:none}
        .lcb-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 20% 50%,rgba(239,68,68,.15) 0%,transparent 60%);animation:glowShift 4s ease-in-out infinite alternate;pointer-events:none}
        @keyframes glowShift{from{transform:translateX(-10%) scaleX(.9);opacity:.7}to{transform:translateX(10%) scaleX(1.1);opacity:1}}
        .lcb-content{position:relative;z-index:1;display:flex;align-items:center;gap:1rem;width:100%;flex-wrap:wrap}
        .lcb-indicator{position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lcb-dot{width:12px;height:12px;background:#ef4444;border-radius:50%;z-index:1;box-shadow:0 0 8px rgba(239,68,68,.8)}
        .lcb-ring{position:absolute;width:32px;height:32px;border-radius:50%;border:2px solid rgba(239,68,68,.6);animation:liveRing 2s ease-out infinite}
        @keyframes liveRing{0%{transform:scale(.5);opacity:1}80%,100%{transform:scale(1.5);opacity:0}}
        .lcb-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
        .lcb-badge{font-size:10px;font-weight:800;color:#ef4444;letter-spacing:.1em;text-transform:uppercase;animation:badgeFade 2s ease-in-out infinite}
        @keyframes badgeFade{0%,100%{opacity:1}50%{opacity:.5}}
        .lcb-label{font-size:.95rem;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .lcb-since{font-size:.73rem;color:rgba(255,255,255,.45)}
        .lcb-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.3rem;border-radius:13px;border:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:.9rem;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0;box-shadow:0 4px 16px rgba(239,68,68,.45);transition:transform .2s cubic-bezier(0.16,1,0.3,1),box-shadow .2s;animation:btnPulse 2.5s ease-in-out infinite}
        .lcb-btn:hover{transform:translateY(-2px) scale(1.04);box-shadow:0 8px 24px rgba(239,68,68,.6);animation:none}
        .lcb-btn:active{transform:translateY(0) scale(.98)}
        @keyframes btnPulse{0%,100%{box-shadow:0 4px 16px rgba(239,68,68,.45)}50%{box-shadow:0 4px 24px rgba(239,68,68,.75)}}
        .lcb-btn-icon{font-size:1rem}
        .lcb-btn-arrow{font-size:.8rem;opacity:.8;transition:transform .2s;display:inline-block}
        .lcb-btn:hover .lcb-btn-arrow{transform:translateX(4px);opacity:1}
        @media(max-width:500px){.lcb-wrap{padding:1rem}.lcb-btn{width:100%;justify-content:center}}
      `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK LIVE LINK PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function QuickLiveLinkPanel() {
    const [link, setLink] = useState('');
    const [label, setLabel] = useState('');
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [currentLive, setCurrentLive] = useState(null);
    const [loadingCurrent, setLoadingCurrent] = useState(true);
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 20); }, []);
    useEffect(() => {
        fetch('/api/live-link')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.url) setCurrentLive(d); })
            .catch(() => { })
            .finally(() => setLoadingCurrent(false));
    }, []);

    function flash(text, type = 'ok') { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 4000); }
    function isValidUrl(s) { try { new URL(s); return true; } catch { return false; } }

    async function handleGoLive() {
        if (!link.trim()) { flash('Please paste a meeting link first.', 'err'); return; }
        if (!isValidUrl(link.trim())) { flash("Doesn't look like a valid URL — include https://", 'err'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/teacher/live-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link.trim(), label: label.trim() || 'Live Class' }) });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to set live link.');
            setCurrentLive(data.liveLink); setLink(''); setLabel('');
            flash('✓ Link is now live! Students can see the Join button on their dashboard.', 'ok');
        } catch (err) { flash(err.message, 'err'); }
        finally { setSaving(false); }
    }

    async function handleClearLive() {
        setClearing(true);
        try {
            const res = await fetch('/api/teacher/live-link', { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to clear live link.');
            setCurrentLive(null);
            flash('Live class ended. The Join button has been removed from the student dashboard.', 'ok');
        } catch (err) { flash(err.message, 'err'); }
        finally { setClearing(false); }
    }

    function copyLink() {
        if (!currentLive?.url) return;
        navigator.clipboard.writeText(currentLive.url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }

    return (
        <div className={`qlp-wrap${mounted ? ' qlp-in' : ''}`}>
            {!loadingCurrent && currentLive?.url && (
                <div className="qlp-live-banner qlp-banner-in">
                    <div className="qlp-live-dot-wrap"><span className="qlp-live-ring" /><span className="qlp-live-dot" /></div>
                    <div className="qlp-live-info">
                        <div className="qlp-live-title"><span className="qlp-live-badge">● LIVE</span><strong>{currentLive.label || 'Live Class'}</strong></div>
                        <div className="qlp-live-url">{currentLive.url}</div>
                        {currentLive.setAt && <div className="qlp-live-since">Started {new Date(currentLive.setAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</div>}
                    </div>
                    <div className="qlp-live-actions">
                        <a href={currentLive.url} target="_blank" rel="noopener noreferrer" className="qlp-join-btn">🔴 Join Now</a>
                        <button className="qlp-copy-btn" onClick={copyLink}>{copied ? '✓ Copied' : '📋 Copy'}</button>
                        <button className={`qlp-end-btn${clearing ? ' qlp-btn-busy' : ''}`} onClick={handleClearLive} disabled={clearing}>{clearing ? <span className="qlp-spinner" /> : '⏹ End Live'}</button>
                    </div>
                </div>
            )}
            {!loadingCurrent && !currentLive?.url && (
                <div className="qlp-offline-notice"><span className="qlp-offline-dot" /> No live class running — students see no Join button right now.</div>
            )}
            {msg.text && <div className={`qlp-msg qlp-msg-${msg.type} qlp-msg-in`}>{msg.text}</div>}
            <div className="qlp-card">
                <div className="qlp-card-header">
                    <div className="qlp-card-icon">⚡</div>
                    <div><h3>Quick Live Link</h3><p>Paste any meeting URL (Google Meet, Zoom, Teams, Jitsi…) and go live instantly. Students will see a pulsing <strong>Join Live Class</strong> button the moment you submit.</p></div>
                </div>
                <div className="qlp-form">
                    <div className="qlp-field">
                        <label>Session Label <span className="qlp-optional">(optional)</span></label>
                        <input type="text" placeholder="e.g. Air Navigation – Live Doubt Session" value={label} onChange={e => setLabel(e.target.value)} />
                    </div>
                    <div className="qlp-link-row">
                        <div className="qlp-link-input-wrap">
                            <span className="qlp-link-prefix">🔗</span>
                            <input className="qlp-link-input" type="url" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGoLive()} spellCheck={false} autoComplete="off" />
                            {link && <button className="qlp-clear-input" onClick={() => setLink('')}>×</button>}
                        </div>
                        <button className={`qlp-go-live-btn${saving ? ' qlp-btn-busy' : ''}`} onClick={handleGoLive} disabled={saving || !link.trim()}>
                            {saving ? <><span className="qlp-spinner" /> Going live…</> : <><span className="qlp-live-pulse-icon" />Go Live</>}
                        </button>
                    </div>
                    <div className="qlp-how-it-works">
                        <span className="qlp-how-step">1️⃣ Paste your link</span><span className="qlp-how-arrow">→</span>
                        <span className="qlp-how-step">2️⃣ Hit Go Live</span><span className="qlp-how-arrow">→</span>
                        <span className="qlp-how-step">3️⃣ Students see <span className="qlp-how-badge">🔴 Join Live Class</span></span><span className="qlp-how-arrow">→</span>
                        <span className="qlp-how-step">4️⃣ Hit End Live when done</span>
                    </div>
                </div>
            </div>
            <style jsx>{`
        .qlp-wrap{opacity:0;transform:translateY(12px);transition:opacity .4s cubic-bezier(0.16,1,0.3,1),transform .4s cubic-bezier(0.16,1,0.3,1);margin-bottom:1.5rem;display:flex;flex-direction:column;gap:.85rem}
        .qlp-in{opacity:1;transform:none}
        .qlp-live-banner{background:linear-gradient(135deg,#fff1f2,#fff8f8);border:1.5px solid #fca5a5;border-radius:20px;padding:1.1rem 1.4rem;display:flex;align-items:center;gap:1.1rem;flex-wrap:wrap;box-shadow:0 8px 30px rgba(239,68,68,.1)}
        .qlp-banner-in{animation:bannerIn .5s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes bannerIn{from{opacity:0;transform:translateY(-10px) scale(.98)}to{opacity:1;transform:none}}
        .qlp-live-dot-wrap{position:relative;width:28px;height:28px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .qlp-live-dot{width:12px;height:12px;background:#ef4444;border-radius:50%;position:absolute;z-index:1}
        .qlp-live-ring{position:absolute;width:28px;height:28px;border-radius:50%;border:2px solid #ef4444;animation:livePulse 1.8s ease-in-out infinite}
        @keyframes livePulse{0%{transform:scale(.6);opacity:1}80%,100%{transform:scale(1.4);opacity:0}}
        .qlp-live-info{flex:1;min-width:0}
        .qlp-live-title{display:flex;align-items:center;gap:.6rem;margin-bottom:4px;flex-wrap:wrap}
        .qlp-live-badge{font-size:10px;font-weight:800;color:#ef4444;background:#fee2e2;border:1px solid #fca5a5;border-radius:20px;padding:2px 9px;letter-spacing:.06em;animation:badgePulse 2s ease-in-out infinite}
        @keyframes badgePulse{0%,100%{opacity:1}50%{opacity:.6}}
        .qlp-live-title strong{font-size:.95rem;color:#0f172a}
        .qlp-live-url{font-size:.78rem;color:#64748b;word-break:break-all;margin-bottom:3px}
        .qlp-live-since{font-size:.74rem;color:#94a3b8}
        .qlp-live-actions{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
        .qlp-join-btn{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;padding:.5rem 1rem;border-radius:11px;text-decoration:none;font-size:.82rem;font-weight:700;transition:opacity .2s,transform .15s;box-shadow:0 4px 14px rgba(239,68,68,.3)}
        .qlp-join-btn:hover{opacity:.88;transform:translateY(-2px)}
        .qlp-copy-btn{background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5;padding:.45rem .9rem;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;transition:background .2s}
        .qlp-copy-btn:hover{background:#fee2e2}
        .qlp-end-btn{background:#fff;color:#475569;border:1px solid #e2e8f0;padding:.45rem .9rem;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .2s}
        .qlp-end-btn:hover:not(:disabled){background:#f1f5f9;color:#0f172a;border-color:#cbd5e1}
        .qlp-end-btn:disabled{opacity:.5;cursor:not-allowed}
        .qlp-offline-notice{display:flex;align-items:center;gap:.55rem;font-size:.84rem;color:#94a3b8;padding:.65rem 1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
        .qlp-offline-dot{width:8px;height:8px;background:#cbd5e1;border-radius:50%;flex-shrink:0}
        .qlp-msg{padding:.75rem 1rem;border-radius:12px;font-size:.87rem;font-weight:600}
        .qlp-msg-ok{background:#f0fdf4;color:#15803d;border:1px solid #86efac}
        .qlp-msg-err{background:#fff1f2;color:#b91c1c;border:1px solid #fca5a5}
        .qlp-msg-in{animation:msgIn .3s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes msgIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .qlp-card{background:#fff;border:1px solid #dbeafe;border-radius:20px;padding:1.5rem;box-shadow:0 12px 32px rgba(15,23,42,.05)}
        .qlp-card-header{display:flex;gap:.9rem;align-items:flex-start;margin-bottom:1.25rem;padding-bottom:1.1rem;border-bottom:1px solid #f1f5f9}
        .qlp-card-icon{font-size:2rem;flex-shrink:0;line-height:1}
        .qlp-card-header h3{margin:0 0 4px;font-size:1rem;color:#0f172a}
        .qlp-card-header p{margin:0;font-size:.82rem;color:#64748b;line-height:1.5}
        .qlp-card-header strong{color:#ef4444}
        .qlp-form{display:flex;flex-direction:column;gap:.9rem}
        .qlp-field{display:flex;flex-direction:column;gap:5px}
        .qlp-field label{font-size:.82rem;font-weight:700;color:#374151}
        .qlp-optional{font-weight:400;color:#94a3b8}
        .qlp-field input{border:1px solid #dbeafe;border-radius:12px;padding:.65rem .9rem;background:#f8fafc;color:#0f172a;font-size:.9rem;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;font-family:inherit}
        .qlp-field input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(59,130,246,.15);background:#fff}
        .qlp-link-row{display:flex;gap:.75rem;align-items:center}
        .qlp-link-input-wrap{position:relative;flex:1}
        .qlp-link-prefix{position:absolute;left:.9rem;top:50%;transform:translateY(-50%);font-size:.9rem;pointer-events:none}
        .qlp-link-input{width:100%;border:1.5px solid #dbeafe;border-radius:13px;padding:.75rem 2.4rem .75rem 2.5rem;background:#f8fafc;color:#0f172a;font-size:.9rem;outline:none;box-sizing:border-box;transition:border-color .2s,box-shadow .2s,background .2s;font-family:monospace;letter-spacing:-.01em}
        .qlp-link-input:focus{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.12);background:#fff}
        .qlp-link-input::placeholder{font-family:inherit;letter-spacing:0;color:#cbd5e1}
        .qlp-clear-input{position:absolute;right:.8rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;color:#94a3b8;line-height:1;padding:0;transition:color .2s,transform .2s}
        .qlp-clear-input:hover{color:#475569;transform:translateY(-50%) scale(1.2)}
        .qlp-go-live-btn{padding:.75rem 1.4rem;border:none;border-radius:13px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-weight:800;font-size:.92rem;cursor:pointer;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;flex-shrink:0;box-shadow:0 6px 20px rgba(239,68,68,.3);transition:all .25s cubic-bezier(0.16,1,0.3,1)}
        .qlp-go-live-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(239,68,68,.42)}
        .qlp-go-live-btn:active{transform:translateY(0)}
        .qlp-go-live-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
        .qlp-btn-busy{background:linear-gradient(135deg,#f97316,#ea580c)!important}
        .qlp-live-pulse-icon::before{content:'🔴';margin-right:2px;animation:iconPulse 1.2s ease-in-out infinite;display:inline-block}
        @keyframes iconPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
        .qlp-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .qlp-how-it-works{display:flex;align-items:center;flex-wrap:wrap;gap:.4rem;padding:.7rem .9rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
        .qlp-how-step{font-size:.76rem;color:#64748b}
        .qlp-how-arrow{font-size:.7rem;color:#cbd5e1}
        .qlp-how-badge{display:inline-flex;align-items:center;padding:1px 7px;border-radius:8px;background:#fee2e2;color:#b91c1c;font-size:.72rem;font-weight:700;border:1px solid #fca5a5}
        @media(max-width:640px){.qlp-link-row{flex-direction:column;align-items:stretch}.qlp-go-live-btn{justify-content:center}.qlp-live-banner{flex-direction:column;gap:.9rem}.qlp-live-actions{width:100%}.qlp-how-it-works{display:none}}
      `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE MEETING TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ScheduleMeetingTab() {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({ title: '', description: '', date: today, time: '10:00', duration: '60', meetLink: '', batch: 'All Batches' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [successEvent, setSuccess] = useState(null);
    const [saveErr, setSaveErr] = useState('');
    const [classes, setClasses] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [copied, setCopied] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 20); }, []);
    useEffect(() => {
        fetch('/api/classes').then(r => r.json()).then(d => { if (d.success) setClasses(d.events); }).catch(() => { }).finally(() => setLoadingList(false));
    }, []);

    function setField(k, v) { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); }

    function validate() {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Class title is required.';
        if (!form.meetLink.trim()) errs.meetLink = 'Meeting link is required.';
        else { try { new URL(form.meetLink); } catch { errs.meetLink = 'Enter a valid URL starting with https://'; } }
        if (!form.date) errs.date = 'Date is required.';
        if (!form.time) errs.time = 'Time is required.';
        return errs;
    }

    async function handleSubmit() {
        const errs = validate(); setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setSaving(true); setSaveErr(''); setSuccess(null);
        try {
            const res = await fetch('/api/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to save class.');
            setSuccess(data.event); setClasses(prev => [data.event, ...prev]);
            setForm({ title: '', description: '', date: today, time: '10:00', duration: '60', meetLink: '', batch: 'All Batches' });
        } catch (err) { setSaveErr(err.message); }
        finally { setSaving(false); }
    }

    async function handleDelete(id) {
        setDeletingId(id);
        try {
            const res = await fetch('/api/classes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to delete.');
            setClasses(prev => prev.filter(c => (c._id?.toString() || c.id) !== id));
        } catch (err) { setSaveErr(err.message); }
        finally { setDeletingId(null); }
    }

    function copyLink(link, id) { navigator.clipboard.writeText(link).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); }); }
    function isLive(start, end) { const now = Date.now(); return new Date(start) <= now && now <= new Date(end); }
    function countdown(start) {
        const diff = new Date(start) - Date.now(); if (diff <= 0) return null;
        const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
        if (h > 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`; if (h > 0) return `in ${h}h ${m}m`; return `in ${m}m`;
    }
    function fmtDateTime(iso) { return new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

    const C = { primary: '#1D4ED8', purple: '#8B5CF6', green: '#10B981', red: '#EF4444', accent: '#F59E0B', text: '#0F172A', muted: '#64748B', border: '#E2E8F0', bg: '#F0F4FF', card: '#FFFFFF', primaryLight: '#EFF6FF', sidebar: '#0A1628' };

    return (
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: 'opacity .4s ease, transform .4s ease', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
            <div style={{ background: `linear-gradient(135deg, ${C.sidebar}, ${C.primary})`, borderRadius: 16, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 36 }}>📅</div>
                <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Schedule a Live Class</div>
                    <div style={{ color: '#93C5FD', fontSize: 13, lineHeight: 1.6 }}>Paste your Google Meet link below with date and time. Students will see it on their dashboard with a live button that turns red exactly when the class starts.</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[['🔗', 'Paste link'], ['📅', 'Set time'], ['🔴', 'Auto live button']].map(([icon, label]) => (
                        <span key={label} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{icon} {label}</span>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 18 }}>
                {/* LEFT: Form */}
                <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: '22px', boxShadow: '0 8px 30px rgba(15,23,42,.06)' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 18 }}>➕ Add New Class</div>
                    {successEvent && (
                        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '14px 16px', marginBottom: 16, animation: 'fadeIn .3s ease' }}>
                            <div style={{ fontWeight: 700, color: '#15803D', marginBottom: 6 }}>✅ Class scheduled!</div>
                            <div style={{ fontSize: 13, color: '#166534' }}>{successEvent.title}</div>
                            <div style={{ fontSize: 12, color: '#15803D', marginTop: 4 }}>Students can now see this class on their dashboard.</div>
                        </div>
                    )}
                    {saveErr && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>⚠️ {saveErr}</div>}

                    {[{ label: 'Class Title *', key: 'title', type: 'text', placeholder: 'e.g. Air Regulations – Chapter 3 Live' }, { label: '🔗 Google Meet / Zoom Link *', key: 'meetLink', type: 'url', placeholder: 'https://meet.google.com/xxx-xxxx-xxx' }].map(({ label, key, type, placeholder }) => (
                        <div key={key} style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 5 }}>{label}</label>
                            <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setField(key, e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', border: `1px solid ${errors[key] ? '#FCA5A5' : C.border}`, background: errors[key] ? '#FFF1F2' : C.bg, color: key === 'meetLink' ? C.primary : C.text, fontSize: 13, outline: 'none', fontFamily: key === 'meetLink' ? 'monospace' : 'inherit' }} />
                            {errors[key] && <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 3 }}>{errors[key]}</div>}
                        </div>
                    ))}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        {[{ label: 'Date *', key: 'date', type: 'date', min: today }, { label: 'Start Time *', key: 'time', type: 'time' }].map(({ label, key, type, min }) => (
                            <div key={key}>
                                <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 5 }}>{label}</label>
                                <input type={type} value={form[key]} min={min} onChange={e => setField(key, e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', border: `1px solid ${errors[key] ? '#FCA5A5' : C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                                {errors[key] && <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 3 }}>{errors[key]}</div>}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 5 }}>Duration</label>
                            <select value={form.duration} onChange={e => setField('duration', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                                <option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 5 }}>Batch</label>
                            <select value={form.batch} onChange={e => setField('batch', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                                <option>All Batches</option><option>Batch A — Morning</option><option>Batch B — Evening</option><option>Batch C — Weekend</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 5 }}>Description <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></label>
                        <textarea rows={2} placeholder="Topics covered, what to prepare, etc." value={form.description} onChange={e => setField('description', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>

                    {form.title && form.date && form.time && (
                        <div style={{ background: C.primaryLight, border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Preview</div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 2 }}>{form.title}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>🗓 {new Date(`${form.date}T${form.time}`).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} &nbsp;·&nbsp; ⏱ {form.duration} min &nbsp;·&nbsp; 👥 {form.batch}</div>
                        </div>
                    )}

                    <button onClick={handleSubmit} disabled={saving} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: saving ? C.muted : `linear-gradient(135deg, ${C.primary}, ${C.purple})`, color: '#fff', fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform .15s, box-shadow .15s' }}
                        onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(29,78,216,.3)'; } }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        {saving ? '⏳ Saving…' : '📅 Schedule Class'}
                    </button>
                </div>

                {/* RIGHT: Class list */}
                <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: '22px', boxShadow: '0 8px 30px rgba(15,23,42,.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>📋 Upcoming Classes</div>
                        <span style={{ fontSize: 12, color: C.muted, background: C.bg, padding: '3px 10px', borderRadius: 20, border: `1px solid ${C.border}` }}>{classes.length} scheduled</span>
                    </div>
                    {loadingList ? <div style={{ padding: '24px 0', textAlign: 'center', color: C.muted, fontSize: 13 }}>Loading…</div>
                        : classes.length === 0 ? (
                            <div style={{ padding: '36px 20px', textAlign: 'center', border: `1.5px dashed ${C.border}`, borderRadius: 14, background: C.bg }}>
                                <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
                                <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>No classes scheduled</div>
                                <div style={{ fontSize: 12, color: C.muted }}>Add your first class using the form.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 560 }}>
                                {classes.map(cls => {
                                    const id = cls._id?.toString() || cls.id;
                                    const live = isLive(cls.startDateTime, cls.endDateTime);
                                    const timer = countdown(cls.startDateTime);
                                    return (
                                        <div key={id} style={{ background: live ? '#FFF1F1' : C.bg, border: `1px solid ${live ? '#FCA5A5' : C.border}`, borderRadius: 14, padding: '14px 16px', transition: 'box-shadow .2s' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {live && <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 20 }}>🔴 LIVE NOW</span>}
                                                    {!live && timer && <span style={{ background: C.primaryLight, color: C.primary, fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}>⏰ {timer}</span>}
                                                    <span style={{ background: C.bg, color: C.muted, fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 20, border: `1px solid ${C.border}` }}>{cls.batch}</span>
                                                </div>
                                                <button onClick={() => handleDelete(id)} disabled={deletingId === id} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #FECACA', background: '#FFF1F2', color: '#B91C1C', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .15s' }} title="Cancel class">✕</button>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 4 }}>{cls.title}</div>
                                            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>🕐 {fmtDateTime(cls.startDateTime)}{cls.endDateTime && ` → ${new Date(cls.endDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}</div>
                                            {cls.description && <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, lineHeight: 1.4 }}>{cls.description}</div>}
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                                {live ? (
                                                    <a href={cls.meetLink} target="_blank" rel="noopener noreferrer" style={{ background: `linear-gradient(135deg, ${C.red}, #DC2626)`, color: '#fff', padding: '7px 14px', borderRadius: 9, fontWeight: 700, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: '0 4px 14px rgba(239,68,68,.4)' }}>🔴 Join Live Now</a>
                                                ) : (
                                                    <button disabled style={{ background: '#E2E8F0', color: '#94A3B8', padding: '7px 14px', borderRadius: 9, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Join button activates when class starts">⚫ Join Live {timer ? `(${timer})` : ''}</button>
                                                )}
                                                <button onClick={() => copyLink(cls.meetLink, id)} style={{ background: C.primaryLight, color: C.primary, padding: '7px 12px', borderRadius: 9, fontWeight: 700, fontSize: 12, border: '1px solid #BFDBFE', cursor: 'pointer' }}>{copied === id ? '✓ Copied!' : '📋 Copy Link'}</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </div>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANAGE STUDENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ManageStudentsTab({ students, onStudentsChange }) {
    const [search, setSearch] = useState('');
    const [confirmRemove, setConfirmRemove] = useState(null);
    const [removing, setRemoving] = useState(null);
    const [removeMsg, setRemoveMsg] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', batch: 'Batch A — Morning' });
    const [addErrors, setAddErrors] = useState({});
    const [adding, setAdding] = useState(false);
    const [addMsg, setAddMsg] = useState('');
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setTimeout(() => setMounted(true), 10); }, []);

    const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

    function validateAdd() {
        const errs = {};
        if (!addForm.name.trim()) errs.name = 'Name is required';
        if (!addForm.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) errs.email = 'Invalid email format';
        else if (students.find(s => s.email.toLowerCase() === addForm.email.toLowerCase())) errs.email = 'Student with this email already exists';
        if (!addForm.phone.trim()) errs.phone = 'Phone is required';
        else if (!/^\d{10}$/.test(addForm.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid 10-digit phone number';
        return errs;
    }

    async function handleAddStudent() {
        const errs = validateAdd(); setAddErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setAdding(true); setAddMsg('');
        try {
            const res = await fetch('/api/teacher/students/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) });
            if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Failed to add student'); }
            const data = await res.json();
            setAddMsg(`✓ ${addForm.name} added successfully!`);
            setAddForm({ name: '', email: '', phone: '', batch: 'Batch A — Morning' });
            setShowAddForm(false); onStudentsChange(data.students);
        } catch (err) { setAddMsg(`✗ ${err.message}`); }
        finally { setAdding(false); }
    }

    async function handleRemoveStudent(email) {
        setRemoving(email); setRemoveMsg('');
        try {
            const res = await fetch('/api/teacher/students/remove', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
            if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Failed to remove student'); }
            const data = await res.json();
            setRemoveMsg('Student removed successfully.'); setConfirmRemove(null); onStudentsChange(data.students);
        } catch (err) { setRemoveMsg(`Error: ${err.message}`); }
        finally { setRemoving(null); }
    }

    const studentToRemove = students.find(s => s.email === confirmRemove);

    return (
        <div className={`tab-content${mounted ? ' tab-content-in' : ''}`}>
            <div className="manage-topbar">
                <div className="manage-search-wrap">
                    <span className="manage-search-icon">🔍</span>
                    <input className="manage-search" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <button className="manage-search-clear" onClick={() => setSearch('')}>×</button>}
                </div>
                <button className="manage-add-btn btn-ripple" onClick={() => { setShowAddForm(true); setAddMsg(''); setAddErrors({}); }}>+ Add Student</button>
            </div>

            {removeMsg && <div className={`save-msg ${removeMsg.startsWith('Error') ? 'save-msg-err' : 'save-msg-ok'} msg-slide-in`}>{removeMsg}</div>}
            {addMsg && <div className={`save-msg ${addMsg.startsWith('✗') ? 'save-msg-err' : 'save-msg-ok'} msg-slide-in`}>{addMsg}</div>}

            {showAddForm && (
                <div className="modal-backdrop modal-backdrop-in" onClick={e => { if (e.target === e.currentTarget) setShowAddForm(false); }}>
                    <div className="modal-card modal-card-in">
                        <div className="modal-header"><h2>Add New Student</h2><button className="modal-close" onClick={() => setShowAddForm(false)}>×</button></div>
                        <div className="modal-body">
                            {['name', 'email', 'phone'].map((field, fi) => (
                                <div key={field} className="form-group" style={{ animationDelay: `${fi * 60}ms` }}>
                                    <label>{field === 'name' ? 'Full Name *' : field === 'email' ? 'Email Address *' : 'Phone Number *'}</label>
                                    <input type={field === 'email' ? 'email' : 'text'} placeholder={field === 'name' ? 'e.g. Arjun Sharma' : field === 'email' ? 'e.g. arjun@email.com' : '10-digit mobile number'} value={addForm[field]} onChange={e => setAddForm(p => ({ ...p, [field]: e.target.value }))} className={addErrors[field] ? 'input-err' : ''} />
                                    {addErrors[field] && <span className="field-err field-err-in">{addErrors[field]}</span>}
                                </div>
                            ))}
                            <div className="form-group" style={{ animationDelay: '180ms' }}>
                                <label>Batch</label>
                                <select value={addForm.batch} onChange={e => setAddForm(p => ({ ...p, batch: e.target.value }))}>
                                    <option>Batch A — Morning</option><option>Batch B — Evening</option><option>Batch C — Weekend</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
                            <button className="modal-save-btn btn-ripple" onClick={handleAddStudent} disabled={adding}>{adding ? <span className="btn-spinner" /> : 'Add Student'}</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmRemove && (
                <div className="modal-backdrop modal-backdrop-in" onClick={e => { if (e.target === e.currentTarget) setConfirmRemove(null); }}>
                    <div className="modal-card modal-card-sm modal-card-in">
                        <div className="modal-header"><h2>Remove Student</h2><button className="modal-close" onClick={() => setConfirmRemove(null)}>×</button></div>
                        <div className="modal-body">
                            <div className="remove-confirm-body">
                                <div className="remove-icon shake-icon">⚠️</div>
                                <p>Are you sure you want to remove <strong>{studentToRemove?.name}</strong>?</p>
                                <p className="remove-warning">Their test history and attendance records will be retained but they will no longer appear in the dashboard.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel-btn" onClick={() => setConfirmRemove(null)}>Cancel</button>
                            <button className="modal-remove-btn btn-ripple" onClick={() => handleRemoveStudent(confirmRemove)} disabled={removing === confirmRemove}>{removing === confirmRemove ? <span className="btn-spinner" /> : 'Yes, Remove'}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="teacher-panel panel-slide-up">
                <div className="panel-header"><h2>Enrolled Students</h2><span>{filtered.length} of {students.length} students</span></div>
                <div className="teacher-table-wrap">
                    <table>
                        <thead><tr><th>#</th><th>Student</th><th>Email</th><th>Phone</th><th>Batch</th><th>Joined</th><th>Tests</th><th>Action</th></tr></thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8}><div className="empty-state empty-state-in">{search ? `No students found matching "${search}".` : 'No students enrolled yet.'}</div></td></tr>
                            ) : filtered.map((s, i) => {
                                const [bg, fg] = avatarColors(i);
                                return (
                                    <tr key={s.email} className="table-row-anim" style={{ animationDelay: `${i * 40}ms` }}>
                                        <td style={{ color: '#64748b', fontSize: '.8rem' }}>{i + 1}</td>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="att-avatar avatar-pop" style={{ background: bg, color: fg }}>{initials(s.name)}</div><span style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</span></div></td>
                                        <td style={{ color: '#64748b', fontSize: '.82rem' }}>{s.email}</td>
                                        <td style={{ color: '#64748b', fontSize: '.82rem' }}>+91 {s.phone}</td>
                                        <td><span className="batch-chip">{s.batch || 'Batch A — Morning'}</span></td>
                                        <td style={{ color: '#64748b', fontSize: '.82rem' }}>{formatDate(s.joinedAt)}</td>
                                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{s.testsAttempted}</td>
                                        <td><button className="remove-btn" onClick={() => { setConfirmRemove(s.email); setRemoveMsg(''); }} disabled={removing === s.email}>{removing === s.email ? <span className="btn-spinner btn-spinner-sm" /> : 'Remove'}</button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="batch-summary-row">
                {['Batch A — Morning', 'Batch B — Evening', 'Batch C — Weekend'].map((batch, i) => {
                    const count = students.filter(s => (s.batch || 'Batch A — Morning') === batch).length;
                    const colors = [['#dbeafe', '#2563eb'], ['#dcfce7', '#16a34a'], ['#f3e8ff', '#7c3aed']];
                    const [bg, fg] = colors[i];
                    return (
                        <div key={batch} className="batch-card batch-card-hover" style={{ borderColor: bg, animationDelay: `${i * 80}ms` }}>
                            <div className="batch-card-count" style={{ color: fg }}><AnimatedCounter value={count} /></div>
                            <div className="batch-card-label">{batch}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE TABS
// ═══════════════════════════════════════════════════════════════════════════════
function AttMarkTab({ students = [] }) {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [batch, setBatch] = useState('Batch A — Morning');
    const [rollStatus, setRollStatus] = useState({});
    const [notes, setNotes] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveErr, setSaveErr] = useState('');
    const [mounted, setMounted] = useState(false);
    const [loadingRecord, setLoadingRecord] = useState(false);
    const [isFutureDate, setIsFutureDate] = useState(false);

    useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);
    useEffect(() => {
        const sel = new Date(date), tod = new Date(today);
        sel.setHours(0, 0, 0, 0); tod.setHours(0, 0, 0, 0);
        if (sel > tod) { setIsFutureDate(true); setRollStatus({}); setNotes({}); return; }
        setIsFutureDate(false); setLoadingRecord(true); setRollStatus({}); setNotes({});
        fetch(`/api/teacher/attendance/day?date=${date}&batch=${encodeURIComponent(batch)}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.records?.length > 0) {
                    const statusMap = {}, noteMap = {};
                    data.records.forEach(r => { if (r.status) statusMap[r.email] = r.status; if (r.note) noteMap[r.email] = r.note; });
                    setRollStatus(statusMap); setNotes(noteMap);
                }
            }).catch(() => { }).finally(() => setLoadingRecord(false));
    }, [date, batch]);

    const setStatus = (email, status) => setRollStatus(prev => ({ ...prev, [email]: prev[email] === status ? '' : status }));
    const setNote = (email, note) => setNotes(prev => ({ ...prev, [email]: note }));
    const markAll = (status) => { const next = {}; students.forEach(s => { next[s.email] = status; }); setRollStatus(next); };

    const marked = Object.values(rollStatus).filter(Boolean).length;
    const present = Object.values(rollStatus).filter(v => v === 'present').length;
    const absent = Object.values(rollStatus).filter(v => v === 'absent').length;
    const late = Object.values(rollStatus).filter(v => v === 'late').length;
    const total = students.length;
    const donePct = total > 0 ? Math.round((marked / total) * 100) : 0;
    const presPct = total > 0 ? Math.round((present / total) * 100) : 0;

    async function saveAttendance() {
        if (isFutureDate) return;
        setSaving(true); setSaveErr(''); setSaved(false);
        try {
            const records = students.map(s => ({ email: s.email, name: s.name, status: rollStatus[s.email] || 'absent', note: notes[s.email] || '' }));
            const res = await fetch('/api/teacher/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, batch, records }) });
            if (!res.ok) throw new Error('Failed to save');
            setSaved(true); setTimeout(() => setSaved(false), 3000);
        } catch { setSaveErr('Could not save. Please try again.'); }
        finally { setSaving(false); }
    }

    const rowBg = { present: '#f0fdf4', absent: '#fff1f2', late: '#fffbeb', '': '#ffffff' };
    const rowBorder = { present: '#86efac', absent: '#fca5a5', late: '#fde68a', '': '#e2e8f0' };

    return (
        <div className={`att-wrap${mounted ? ' att-in' : ''}`}>
            <div className="att-controls-bar">
                <div className="att-ctrl-left">
                    <div className="ctrl-group"><label className="ctrl-label">Batch</label>
                        <select className="ctrl-select" value={batch} onChange={e => setBatch(e.target.value)}><option>Batch A — Morning</option><option>Batch B — Evening</option><option>Batch C — Weekend</option></select></div>
                    <div className="ctrl-group"><label className="ctrl-label">Date</label>
                        <input className="ctrl-select" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                </div>
                <div className="att-ctrl-right">
                    {loadingRecord && <div className="ctrl-loading"><span className="ctrl-spinner" /> Loading…</div>}
                    <button className="btn-all-present" onClick={() => markAll('present')} disabled={isFutureDate || loadingRecord}><span>✓</span> Mark All Present</button>
                    <button className={`btn-save${saving ? ' btn-saving' : ''}${saved ? ' btn-saved' : ''}`} onClick={saveAttendance} disabled={saving || isFutureDate || loadingRecord}>
                        {saving && <span className="spin-ring" />}{saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Attendance'}
                    </button>
                </div>
            </div>

            {isFutureDate && <div className="att-toast att-toast-warn"><span>📅</span> You cannot mark or save attendance for a future date.</div>}
            {saveErr && <div className="att-toast att-toast-err"><span>⚠</span> {saveErr}</div>}
            {saved && <div className="att-toast att-toast-ok"><span>✓</span> Attendance saved successfully for {total} students!</div>}

            <div className="att-mark-stat-row">
                {[
                    { label: 'Present', count: present, color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '✓' },
                    { label: 'Absent', count: absent, color: '#dc2626', bg: '#fff1f2', border: '#fca5a5', icon: '✗' },
                    { label: 'Late', count: late, color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '◷' },
                    { label: 'Unmarked', count: total - marked, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: '○' },
                ].map((s, i) => (
                    <div key={s.label} className="att-mark-stat-card" style={{ background: s.bg, borderColor: s.border, animationDelay: `${i * 70}ms` }}>
                        <div className="att-mark-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                        <div className="att-mark-stat-num"><Counter value={s.count} color={s.color} /></div>
                        <div className="att-mark-stat-label" style={{ color: s.color }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="att-progress-section">
                <div className="att-progress-header">
                    <div className="att-progress-meta"><Ring pct={donePct} color="#2563eb" /><div><div className="att-progress-title">Roll call progress</div><div className="att-progress-sub"><Counter value={marked} color="#2563eb" /> of {total} marked</div></div></div>
                    <div className="att-progress-meta"><Ring pct={presPct} color="#16a34a" /><div><div className="att-progress-title">Attendance rate</div><div className="att-progress-sub" style={{ color: '#16a34a' }}><Counter value={presPct} color="#16a34a" />% present</div></div></div>
                </div>
                <div className="att-prog-bar-wrap">
                    <div className="att-prog-bar-track">
                        <div className="att-prog-bar-fill att-prog-green" style={{ width: `${presPct}%` }} />
                        <div className="att-prog-bar-fill att-prog-yellow" style={{ width: `${total > 0 ? Math.round(late / total * 100) : 0}%`, left: `${presPct}%` }} />
                        <div className="att-prog-bar-fill att-prog-red" style={{ width: `${total > 0 ? Math.round(absent / total * 100) : 0}%`, left: `${presPct + (total > 0 ? Math.round(late / total * 100) : 0)}%` }} />
                    </div>
                    <div className="att-prog-legend">
                        {[['#16a34a', 'Present'], ['#d97706', 'Late'], ['#dc2626', 'Absent'], ['#e2e8f0', 'Unmarked']].map(([c, l]) => (
                            <span key={l}><span className="att-prog-dot" style={{ background: c }} />{l}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="roll-header">
                <div className="roll-title">Roll Call<span className="roll-date">{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                <div className="roll-badge">{total} students</div>
            </div>
            <div className="roll-list">
                {students.map((s, i) => {
                    const st = rollStatus[s.email] || '', [bg, fg] = avatarColors(i);
                    return (
                        <div key={s.email} className={`roll-row${st ? ' roll-row-marked' : ''}`} style={{ background: rowBg[st], borderColor: rowBorder[st], animationDelay: `${i * 45}ms` }}>
                            <div className="roll-left">
                                <span className="roll-idx">{i + 1}</span>
                                <div className="roll-avatar" style={{ background: bg, color: fg }}>{initials(s.name)}</div>
                                <div className="roll-info"><span className="roll-name">{s.name}</span><span className="roll-email">{s.email}</span></div>
                            </div>
                            <div className="roll-status-group">
                                {[
                                    { key: 'present', label: 'Present', color: '#16a34a', activeBg: '#dcfce7', activeBorder: '#86efac' },
                                    { key: 'absent', label: 'Absent', color: '#dc2626', activeBg: '#fee2e2', activeBorder: '#fca5a5' },
                                    { key: 'late', label: 'Late', color: '#d97706', activeBg: '#fef3c7', activeBorder: '#fde68a' },
                                ].map(({ key, label, color, activeBg, activeBorder }) => {
                                    const active = st === key;
                                    return <button key={key} onClick={() => setStatus(s.email, key)} className={`roll-status-pill${active ? ' roll-status-pill-active' : ''}`} style={active ? { background: activeBg, borderColor: activeBorder, color } : {}}>{active && <span className="roll-pill-check">✓</span>}{label}</button>;
                                })}
                            </div>
                            <input className="roll-note" placeholder="Add note…" value={notes[s.email] || ''} onChange={e => setNote(s.email, e.target.value)} />
                            <div className={`roll-dot${st ? ` roll-dot-${st}` : ''}`} />
                        </div>
                    );
                })}
                {students.length === 0 && <div className="roll-empty">No students in this batch.</div>}
            </div>

            {total > 0 && (
                <div className="roll-bottom-save">
                    <span className="roll-bottom-save-info">{marked} of {total} students marked</span>
                    <button className={`btn-save btn-save-lg${saving ? ' btn-saving' : ''}${saved ? ' btn-saved' : ''}`} onClick={saveAttendance} disabled={saving}>
                        {saving && <span className="spin-ring" />}{saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Attendance'}
                    </button>
                </div>
            )}
            <style jsx>{`
        .att-wrap{opacity:0;transform:translateY(16px);transition:opacity .4s cubic-bezier(0.16,1,0.3,1),transform .4s cubic-bezier(0.16,1,0.3,1)}
        .att-in{opacity:1;transform:none}
        .att-controls-bar{display:flex;flex-wrap:wrap;align-items:flex-end;gap:1rem;justify-content:space-between;background:#fff;border:1px solid #dbeafe;border-radius:18px;padding:1.1rem 1.4rem;margin-bottom:1.25rem;box-shadow:0 4px 20px rgba(15,23,42,.04)}
        .att-ctrl-left{display:flex;gap:1rem;flex-wrap:wrap}.att-ctrl-right{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
        .ctrl-group{display:flex;flex-direction:column;gap:4px}
        .ctrl-label{font-size:.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
        .ctrl-select{border:1px solid #dbeafe;background:#f8fafc;color:#0f172a;border-radius:11px;padding:.55rem .9rem;font-size:.88rem;outline:none;transition:border-color .2s,box-shadow .2s}
        .ctrl-select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
        .btn-all-present{padding:.6rem 1.1rem;border-radius:11px;border:1px solid #a7f3d0;background:#f0fdf4;color:#15803d;font-size:.85rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .2s cubic-bezier(0.16,1,0.3,1)}
        .btn-all-present:hover{background:#dcfce7;transform:translateY(-1px);box-shadow:0 4px 12px rgba(22,163,74,.2)}
        .btn-save{padding:.65rem 1.35rem;border-radius:11px;border:none;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-size:.88rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all .25s cubic-bezier(0.16,1,0.3,1);box-shadow:0 4px 14px rgba(37,99,235,.28)}
        .btn-save:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 20px rgba(37,99,235,.38)}
        .btn-save:disabled{opacity:.7;cursor:not-allowed}
        .btn-saved{background:linear-gradient(135deg,#16a34a,#15803d)!important;box-shadow:0 4px 14px rgba(22,163,74,.35)!important;animation:savePop .4s cubic-bezier(0.34,1.56,.64,1)}
        @keyframes savePop{0%{transform:scale(.95)}50%{transform:scale(1.05)}100%{transform:scale(1)}}
        .btn-save-lg{padding:.75rem 1.8rem;font-size:.92rem}
        .spin-ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .att-toast{display:flex;align-items:center;gap:.6rem;padding:.8rem 1.1rem;border-radius:13px;font-size:.88rem;font-weight:600;margin-bottom:1rem;animation:toastIn .35s cubic-bezier(0.16,1,0.3,1)}
        @keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        .att-toast-ok{background:#f0fdf4;color:#15803d;border:1px solid #86efac}
        .att-toast-err{background:#fff1f2;color:#b91c1c;border:1px solid #fca5a5}
        .att-toast-warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a}
        .att-mark-stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.25rem}
        .att-mark-stat-card{border:1px solid;border-radius:18px;padding:1.15rem 1.1rem;display:flex;flex-direction:column;align-items:center;gap:4px;animation:statIn .45s cubic-bezier(0.34,1.56,.64,1) both;transition:transform .2s,box-shadow .2s}
        .att-mark-stat-card:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(15,23,42,.1)}
        @keyframes statIn{from{opacity:0;transform:scale(.82) translateY(10px)}to{opacity:1;transform:none}}
        .att-mark-stat-icon{font-size:1.4rem;line-height:1}.att-mark-stat-num{font-size:2rem;font-weight:800;line-height:1}.att-mark-stat-label{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
        .att-progress-section{background:#fff;border:1px solid #dbeafe;border-radius:18px;padding:1.2rem 1.4rem;margin-bottom:1.4rem;animation:panelUp .4s cubic-bezier(0.16,1,0.3,1) .15s both}
        @keyframes panelUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .att-progress-header{display:flex;gap:2rem;margin-bottom:1rem;flex-wrap:wrap}.att-progress-meta{display:flex;align-items:center;gap:.75rem}
        .att-progress-title{font-size:.82rem;font-weight:700;color:#0f172a}.att-progress-sub{font-size:1rem;font-weight:800;color:#2563eb;margin-top:1px}
        .att-prog-bar-wrap{margin-top:.5rem}
        .att-prog-bar-track{position:relative;height:10px;background:#e2e8f0;border-radius:99px;overflow:hidden}
        .att-prog-bar-fill{position:absolute;top:0;height:100%;border-radius:99px;transition:width .7s cubic-bezier(0.16,1,0.3,1)}
        .att-prog-green{background:#16a34a;left:0}.att-prog-yellow{background:#d97706}.att-prog-red{background:#dc2626}
        .att-prog-legend{display:flex;gap:1rem;margin-top:.6rem;flex-wrap:wrap}
        .att-prog-legend span{display:flex;align-items:center;gap:5px;font-size:.75rem;color:#64748b}
        .att-prog-dot{width:9px;height:9px;border-radius:50%;display:inline-block}
        .roll-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.85rem}
        .roll-title{font-size:1.2rem;font-weight:800;color:#0f172a;display:flex;flex-direction:column;gap:2px}
        .roll-date{font-size:.82rem;font-weight:500;color:#64748b}
        .roll-badge{background:#eff6ff;color:#2563eb;border:1px solid #dbeafe;border-radius:10px;padding:.3rem .8rem;font-size:.8rem;font-weight:700}
        .roll-list{display:flex;flex-direction:column;gap:.55rem}
        .roll-row{display:flex;align-items:center;gap:.75rem;padding:.85rem 1rem;border:1px solid #e2e8f0;border-radius:16px;background:#fff;position:relative;overflow:hidden;transition:background .3s,border-color .3s,box-shadow .25s,transform .2s;animation:rowIn .38s cubic-bezier(0.16,1,0.3,1) both}
        .roll-row:hover{box-shadow:0 4px 18px rgba(15,23,42,.08);transform:translateX(3px)}
        @keyframes rowIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}
        .roll-left{display:flex;align-items:center;gap:.6rem;flex:1;min-width:0}
        .roll-idx{font-size:.75rem;color:#94a3b8;font-weight:600;min-width:18px;text-align:right}
        .roll-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;transition:transform .2s}
        .roll-row:hover .roll-avatar{transform:scale(1.12)}
        .roll-info{display:flex;flex-direction:column;min-width:0}
        .roll-name{font-size:.9rem;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .roll-email{font-size:.74rem;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .roll-status-group{display:flex;gap:5px;flex-shrink:0}
        .roll-status-pill{border:1px solid #e2e8f0;border-radius:9px;padding:.32rem .7rem;font-size:.76rem;font-weight:700;background:#f8fafc;color:#64748b;cursor:pointer;display:flex;align-items:center;gap:3px;transition:all .2s cubic-bezier(0.16,1,0.3,1)}
        .roll-status-pill:hover{border-color:#cbd5e1;background:#f1f5f9;transform:scale(1.06)}
        .roll-status-pill-active{transform:scale(1.07)!important;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,.1)}
        .roll-pill-check{font-size:.7rem;animation:checkPop .3s cubic-bezier(0.34,1.56,.64,1)}
        @keyframes checkPop{from{transform:scale(0)}to{transform:scale(1)}}
        .roll-note{border:1px solid #e2e8f0;border-radius:9px;padding:.32rem .65rem;font-size:.76rem;width:100px;background:rgba(248,250,252,.8);color:#0f172a;outline:none;transition:border-color .2s,width .25s cubic-bezier(0.16,1,0.3,1),box-shadow .2s}
        .roll-note:focus{border-color:#93c5fd;width:140px;box-shadow:0 0 0 3px rgba(147,197,253,.25);background:#fff}
        .roll-note::placeholder{color:#cbd5e1}
        .roll-dot{position:absolute;right:0;top:0;bottom:0;width:4px;border-radius:0 16px 16px 0;background:transparent;transition:background .3s}
        .roll-dot-present{background:#16a34a}.roll-dot-absent{background:#dc2626}.roll-dot-late{background:#d97706}
        .roll-empty{padding:2rem;text-align:center;color:#94a3b8;border:1px dashed #dbeafe;border-radius:16px;background:#f8fafc}
        .roll-bottom-save{display:flex;align-items:center;justify-content:space-between;margin-top:1.25rem;padding:1rem 1.4rem;background:#fff;border:1px solid #dbeafe;border-radius:16px;box-shadow:0 4px 20px rgba(15,23,42,.06);animation:panelUp .4s cubic-bezier(0.16,1,0.3,1) both}
        .roll-bottom-save-info{font-size:.88rem;color:#64748b;font-weight:600}
        .ctrl-loading{display:flex;align-items:center;gap:6px;font-size:.82rem;color:#64748b}
        .ctrl-spinner{width:12px;height:12px;border:2px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
        @media(max-width:780px){.att-mark-stat-row{grid-template-columns:repeat(2,1fr)}.roll-row{flex-wrap:wrap;gap:.6rem}.roll-note{width:100%}.att-controls-bar{flex-direction:column;align-items:stretch}.att-ctrl-right{justify-content:flex-end}.att-progress-header{flex-direction:column;gap:.75rem}}
        @media(max-width:500px){.roll-status-group{flex-wrap:wrap}}
      `}</style>
        </div>
    );
}

function AttReportTab({ students }) {
    const [batch, setBatch] = useState('Batch A — Morning');
    const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setTimeout(() => setMounted(true), 10); }, []);
    useEffect(() => { loadReport(); }, [batch, month]);
    async function loadReport() {
        setLoading(true); setError('');
        try {
            const res = await fetch(`/api/teacher/attendance/report?batch=${encodeURIComponent(batch)}&month=${month}`);
            if (!res.ok) throw new Error('Failed to load report');
            const data = await res.json(); setReport(data.report);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }
    const months = [];
    for (let i = 0; i < 6; i++) { const d = new Date(); d.setMonth(d.getMonth() - i); months.push({ val: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }); }
    return (
        <div className={`tab-content${mounted ? ' tab-content-in' : ''}`}>
            <div className="att-controls">
                <select value={batch} onChange={e => setBatch(e.target.value)}><option>Batch A — Morning</option><option>Batch B — Evening</option><option>Batch C — Weekend</option></select>
                <select value={month} onChange={e => setMonth(e.target.value)}>{months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}</select>
            </div>
            {loading ? <div className="teacher-loading"><span className="loading-dots"><span /><span /><span /></span>Loading report…</div>
                : error ? <div className="teacher-error-card">{error}</div>
                    : (
                        <div className="teacher-panel panel-slide-up">
                            <div className="panel-header"><h2>Monthly Attendance Report</h2><span>{report.length} students</span></div>
                            <div className="teacher-table-wrap">
                                <table><thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th></tr></thead>
                                    <tbody>{report.length === 0 ? <tr><td colSpan={5}><div className="empty-state empty-state-in">No attendance records for this period.</div></td></tr>
                                        : report.map((row, i) => {
                                            const total = row.present + row.absent + row.late, pct = total > 0 ? Math.round((row.present / total) * 100) : 0, color = getAttColor(pct), [bg, fg] = avatarColors(i);
                                            return <tr key={row.email} className="table-row-anim" style={{ animationDelay: `${i * 40}ms` }}>
                                                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="att-avatar" style={{ background: bg, color: fg }}>{initials(row.name)}</div>{row.name}</div></td>
                                                <td><span className="att-tag att-tag-present">{row.present}</span></td>
                                                <td><span className="att-tag att-tag-absent">{row.absent}</span></td>
                                                <td><span className="att-tag att-tag-late">{row.late}</span></td>
                                                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="pct-bar-bg"><div className="pct-bar pct-bar-anim" style={{ '--pct': `${pct}%`, background: color }} /></div><span style={{ color, fontWeight: 700, fontSize: '.88rem', minWidth: 36 }}>{pct}%</span></div></td>
                                            </tr>;
                                        })}</tbody>
                                </table>
                            </div>
                        </div>
                    )}
        </div>
    );
}

function AttStudentTab({ students }) {
    const [selectedEmail, setSelectedEmail] = useState(students[0]?.email || null);
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setTimeout(() => setMounted(true), 10); }, []);
    useEffect(() => {
        if (!selectedEmail) return;
        setLoading(true);
        fetch(`/api/teacher/attendance/student?email=${encodeURIComponent(selectedEmail)}`).then(r => r.json()).then(d => setRecord(d)).catch(() => setRecord(null)).finally(() => setLoading(false));
    }, [selectedEmail]);

    const selectedStudent = students.find(s => s.email === selectedEmail);
    const calendarDays = () => {
        if (!record?.days) return [];
        const now = new Date(), daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), result = [];
        for (let d = 1; d <= daysInMonth; d++) { const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; result.push({ day: d, status: record.days[key] || 'x' }); }
        return result;
    };
    const dayClass = { present: 'day-p', absent: 'day-a', late: 'day-l', x: 'day-x', holiday: 'day-h' };
    return (
        <div className={`teacher-grid tab-content${mounted ? ' tab-content-in' : ''}`}>
            <div className="teacher-panel panel-slide-up">
                <div className="panel-header"><h2>Students</h2><span>{students.length} enrolled</span></div>
                <div className="teacher-table-wrap">
                    <table><thead><tr><th>Name</th><th>Email</th><th></th></tr></thead>
                        <tbody>{students.map((s, i) => {
                            const [bg, fg] = avatarColors(i);
                            return (
                                <tr key={s.email} className={`table-row-anim${selectedEmail === s.email ? ' selected' : ''}`} style={{ animationDelay: `${i * 35}ms`, cursor: 'pointer' }} onClick={() => setSelectedEmail(s.email)}>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="att-avatar" style={{ background: bg, color: fg }}>{initials(s.name)}</div>{s.name}</div></td>
                                    <td style={{ color: '#64748b', fontSize: '.82rem' }}>{s.email}</td>
                                    <td><button type="button">View</button></td>
                                </tr>);
                        })}</tbody>
                    </table>
                </div>
            </div>
            <div className="teacher-panel panel-slide-up" style={{ animationDelay: '80ms' }}>
                <div className="panel-header"><h2>Attendance Record</h2><span>{selectedStudent?.email || 'Select a student'}</span></div>
                {loading ? <div className="teacher-loading"><span className="loading-dots"><span /><span /><span /></span>Loading…</div>
                    : !record ? <div className="empty-state empty-state-in">Select a student to view their attendance record.</div>
                        : (
                            <div className="student-detail-card detail-fade-in">
                                <div className="student-info-row">
                                    <div><strong>Name</strong><span>{selectedStudent?.name}</span></div>
                                    <div><strong>This Month</strong><span style={{ color: getAttColor(record.monthPct) }}>{record.monthPct}%</span></div>
                                </div>
                                <div className="student-metrics">
                                    <div><strong>Present</strong><span style={{ color: '#16a34a' }}>{record.present}</span></div>
                                    <div><strong>Absent</strong><span style={{ color: '#ef4444' }}>{record.absent}</span></div>
                                    <div><strong>Late</strong><span style={{ color: '#b45309' }}>{record.late}</span></div>
                                </div>
                                <div className="insight-block">
                                    <h3 style={{ marginBottom: '.75rem' }}>{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Calendar</h3>
                                    <div className="month-grid">
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(l => <div key={l} className="day-label">{l}</div>)}
                                        {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => <div key={`e${i}`} />)}
                                        {calendarDays().map(({ day, status }, i) => <div key={day} className={`day-cell ${dayClass[status] || 'day-x'} day-cell-pop`} style={{ animationDelay: `${i * 15}ms` }} title={status}>{day}</div>)}
                                    </div>
                                    <div className="legend">{[['day-p', 'Present'], ['day-a', 'Absent'], ['day-l', 'Late'], ['day-h', 'Holiday'], ['day-x', 'No class']].map(([cls, label]) => <div key={cls} className="legend-item"><div className={`legend-dot ${cls}`} />{label}</div>)}</div>
                                </div>
                                <div className="results-section"><h3>Recent Sessions</h3><div className="results-list">
                                    {(record.recent || []).length === 0 ? <div className="empty-state">No records yet.</div>
                                        : (record.recent || []).map((r, i) => <div key={i} className="result-row result-row-anim" style={{ animationDelay: `${i * 50}ms` }}><div><strong>{r.batch}</strong><span>{formatDate(r.date)}</span></div><span className={`att-tag att-tag-${r.status}`}>{r.status}</span></div>)}
                                </div></div>
                            </div>
                        )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD HELPERS & COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const LB_MEDALS = ['🥇', '🥈', '🥉'];
// ═══════════════════════════════════════════════════════════════════════════════
// ALL RESULTS TAB — Show all exam results from all students
// ═══════════════════════════════════════════════════════════════════════════════
function AllResultsTab({ students }) {
    const [searchStudent, setSearchStudent] = useState('');
    const [searchChapter, setSearchChapter] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setTimeout(() => setMounted(true), 20); }, []);

    // Flatten all results with student info
    const allResults = students.flatMap(student =>
        (student.results || []).map(result => ({
            ...result,
            studentName: student.name,
            studentEmail: student.email,
            studentPhone: student.phone,
            chapterTitle: result.title || result.subjectLabel || getChapterTitle(result.chapterId),
        }))
    );

    let filtered = allResults.filter(r => {
        const matchStudent = searchStudent.trim() === '' || 
            r.studentName.toLowerCase().includes(searchStudent.toLowerCase()) ||
            r.studentEmail.toLowerCase().includes(searchStudent.toLowerCase());
        const matchChapter = searchChapter === '' || r.chapterId === searchChapter;
        return matchStudent && matchChapter;
    });

    // Sort results
    if (sortBy === 'date-desc') filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortBy === 'date-asc') filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sortBy === 'score-desc') filtered.sort((a, b) => b.pct - a.pct);
    else if (sortBy === 'score-asc') filtered.sort((a, b) => a.pct - b.pct);

    const chapters = [...new Set(allResults.map(r => r.chapterId))];
    const totalResults = allResults.length;
    const avgScore = totalResults > 0 ? Math.round(allResults.reduce((sum, r) => sum + r.pct, 0) / totalResults) : 0;
    const bestScore = totalResults > 0 ? Math.max(...allResults.map(r => r.pct)) : 0;

    return (
        <div className={`all-results-wrap${mounted ? ' all-results-in' : ''}`}>
            <div className="results-summary-row">
                {[
                    { icon: '📝', label: 'Total Results', value: totalResults },
                    { icon: '👥', label: 'Students', value: students.length },
                    { icon: '🎯', label: 'Avg Accuracy', value: `${avgScore}%` },
                    { icon: '🏆', label: 'Best Score', value: `${bestScore}%` },
                ].map((stat, i) => (
                    <div key={stat.label} className="result-stat-card" style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="results-controls">
                <div className="control-group">
                    <label>Search Student</label>
                    <div className="search-input-wrap">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="By name or email…" value={searchStudent} onChange={e => setSearchStudent(e.target.value)} />
                        {searchStudent && <button className="clear-btn" onClick={() => setSearchStudent('')}>×</button>}
                    </div>
                </div>
                <div className="control-group">
                    <label>Filter by Chapter</label>
                    <select value={searchChapter} onChange={e => setSearchChapter(e.target.value)}>
                        <option value="">All Chapters</option>
                        {chapters.map(ch => <option key={ch} value={ch}>{getChapterTitle(ch)}</option>)}
                    </select>
                </div>
                <div className="control-group">
                    <label>Sort By</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="score-desc">Highest Score</option>
                        <option value="score-asc">Lowest Score</option>
                    </select>
                </div>
            </div>

            <div className="results-panel">
                <div className="panel-header"><h2>All Exam Results</h2><span>{filtered.length} of {totalResults} results</span></div>
                <div className="results-table-wrap">
                    {filtered.length === 0 ? (
                        <div className="empty-state empty-state-in">No results matching your filters.</div>
                    ) : (
                        <div className="results-timeline">
                            {filtered.map((result, i) => {
                                const [bg, fg] = avatarColors(i);
                                return (
                                    <div key={`${result.studentEmail}-${result.id}-${i}`} className="timeline-item timeline-item-anim" style={{ animationDelay: `${i * 25}ms` }}>
                                        <div className="timeline-dot" style={{ background: getScoreColor(result.pct) }} />
                                        <div className="timeline-content">
                                            <div className="result-card">
                                                <div className="result-card-left">
                                                    <div className="result-avatar" style={{ background: bg, color: fg }}>{initials(result.studentName)}</div>
                                                    <div className="result-info">
                                                        <div className="result-student"><strong>{result.studentName}</strong></div>
                                                        <div className="result-email">{result.studentEmail}</div>
                                                    </div>
                                                </div>
                                                <div className="result-card-center">
                                                    <div className="result-chapter">{result.chapterTitle}</div>
                                                    <div className="result-datetime">{formatDateTime(result.date)}</div>
                                                </div>
                                                <div className="result-card-right">
                                                    <div className="result-score-box">
                                                        <div className="score-pct" style={{ color: getScoreColor(result.pct) }}>{result.pct}%</div>
                                                        <div className="score-fraction">{result.score}/{result.total}</div>
                                                    </div>
                                                    <div className="result-breakdown">
                                                        <div className="correct"><span style={{ color: '#16a34a' }}>✓</span> {result.correctCount}</div>
                                                        <div className="wrong"><span style={{ color: '#ef4444' }}>✗</span> {result.wrongCount}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .all-results-wrap{opacity:0;transform:translateY(14px);transition:opacity .35s cubic-bezier(0.16,1,0.3,1),transform .35s cubic-bezier(0.16,1,0.3,1)}
        .all-results-in{opacity:1;transform:none}
        .results-summary-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.75rem}
        .result-stat-card{background:#fff;border:1px solid #dbeafe;border-radius:18px;padding:1.25rem 1.15rem;text-align:center;box-shadow:0 10px 30px rgba(15,23,42,.04);animation:statPop .45s cubic-bezier(0.34,1.56,.64,1) both;transition:transform .2s,box-shadow .2s}
        .result-stat-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(15,23,42,.08)}
        @keyframes statPop{from{opacity:0;transform:scale(.8) translateY(12px)}to{opacity:1;transform:none}}
        .stat-icon{font-size:1.8rem;margin-bottom:.5rem}
        .stat-value{font-size:1.8rem;font-weight:800;color:#0f172a;margin-bottom:.25rem}
        .stat-label{font-size:.78rem;color:#64748b;font-weight:600}
        .results-controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:1.25rem;margin-bottom:1.5rem;background:#fff;padding:1.25rem;border:1px solid #dbeafe;border-radius:18px;box-shadow:0 8px 24px rgba(15,23,42,.04)}
        .control-group{display:flex;flex-direction:column;gap:.5rem}
        .control-group label{font-size:.82rem;font-weight:700;color:#474747;text-transform:uppercase;letter-spacing:.04em}
        .control-group select,.search-input-wrap input{border:1px solid #dbeafe;background:#f8fafc;color:#0f172a;border-radius:12px;padding:.75rem 1rem;font-size:.9rem;outline:none;width:100%;box-sizing:border-box;transition:border-color .2s,box-shadow .2s}
        .search-input-wrap{position:relative}
        .search-icon{position:absolute;left:1rem;top:50%;transform:translateY(-50%);font-size:.85rem;pointer-events:none}
        .search-input-wrap input{padding-left:2.5rem;padding-right:2.5rem}
        .clear-btn{position:absolute;right:1rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.2rem;color:#94a3b8;transition:color .2s}
        .clear-btn:hover{color:#475569}
        .control-group select:focus,.control-group select:hover{border-color:#2563eb;box-shadow:0 0 0 3px rgba(59,130,246,.15);background:#fff}
        .results-panel{background:#fff;border:1px solid #dbeafe;border-radius:20px;padding:1.5rem;box-shadow:0 18px 40px rgba(15,23,42,.05)}
        .panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem}
        .panel-header h2{margin:0;font-size:1.05rem;color:#0f172a}.panel-header span{color:#64748b;font-size:.9rem}
        .results-table-wrap{max-height:700px;overflow-y:auto}
        .results-timeline{display:flex;flex-direction:column;gap:.75rem;position:relative;padding-left:20px}
        .results-timeline::before{content:'';position:absolute;left:4px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,#2563eb,transparent);pointer-events:none}
        .timeline-item{display:flex;gap:.75rem;position:relative;animation:timelineIn .3s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes timelineIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        .timeline-dot{width:12px;height:12px;border-radius:50%;position:absolute;left:-18px;top:16px;border:2px solid #fff;box-shadow:0 0 0 2px #2563eb;flex-shrink:0}
        .timeline-content{flex:1;min-width:0}
        .result-card{display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;transition:all .25s cubic-bezier(0.16,1,0.3,1)}
        .result-card:hover{background:#eff6ff;border-color:#dbeafe;box-shadow:0 8px 20px rgba(37,99,235,.08)}
        .result-card-left{display:flex;align-items:center;gap:.75rem;flex-shrink:0}
        .result-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.08)}
        .result-info{display:flex;flex-direction:column;gap:.15rem;min-width:0}
        .result-student{font-size:.95rem;font-weight:700;color:#0f172a;white-space:nowrap}
        .result-email{font-size:.78rem;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .result-card-center{flex:1;min-width:0;display:flex;flex-direction:column;gap:.25rem}
        .result-chapter{font-size:.92rem;font-weight:700;color:#0f172a}
        .result-datetime{font-size:.78rem;color:#64748b}
        .result-card-right{display:flex;align-items:center;gap:1.25rem;flex-shrink:0}
        .result-score-box{background:#fff;padding:.6rem 1rem;border-radius:12px;text-align:center;border:1px solid #dbeafe}
        .score-pct{font-size:1.25rem;font-weight:800;display:block;line-height:1}
        .score-fraction{font-size:.75rem;color:#64748b;margin-top:.2rem}
        .result-breakdown{display:flex;flex-direction:column;gap:.35rem;text-align:center;font-size:.8rem}
        .result-breakdown .correct{color:#16a34a;font-weight:600}
        .result-breakdown .wrong{color:#ef4444;font-weight:600}
        @media(max-width:1024px){.results-controls{grid-template-columns:1fr 1fr;gap:1rem}.result-card{flex-wrap:wrap;gap:.85rem}.result-card-right{width:100%;justify-content:space-between}}
        @media(max-width:640px){.results-summary-row{grid-template-columns:repeat(2,1fr)}.results-controls{grid-template-columns:1fr}.result-card{flex-direction:column;gap:.75rem}.result-card-left{width:100%}.result-card-center{width:100%}.result-card-right{width:100%}}
      `}</style>
        </div>
    );
}


const MOCK_LB_SUBJECT_TABS = [
    { id: 'all', label: 'All', icon: '🎯', color: '#8B5CF6' },
    { id: 'air_regulations', label: 'Air Regs', icon: '📋', color: '#1D4ED8' },
    { id: 'meteorology', label: 'Meteorology', icon: '🌦️', color: '#0EA5E9' },
    { id: 'navigation', label: 'Navigation', icon: '🗺️', color: '#10B981' },
    { id: 'technical', label: 'Technical', icon: '🔧', color: '#F59E0B' },
    { id: 'rtfm', label: 'Radio Tel.', icon: '📻', color: '#EF4444' },
];

function lbAccuracyColor(pct) { return pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'; }
function lbFmtDate(iso) { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
function hexA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function LbMiniPodium({ top3 }) {
    if (top3.length < 2) return null;
    const podiumColors = { 1: '#F59E0B', 2: '#1D4ED8', 3: '#8B5CF6' };
    const order = top3.length >= 3
        ? [{ e: top3[1], rank: 2, h: 80 }, { e: top3[0], rank: 1, h: 110 }, { e: top3[2], rank: 3, h: 60 }]
        : [{ e: top3[1], rank: 2, h: 80 }, { e: top3[0], rank: 1, h: 110 }];
    return (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 16px 0', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>🏆 Top Performers</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Best accuracy across all mock tests</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
                {order.map(({ e, rank, h }, idx) => {
                    const color = podiumColors[rank];
                    return (
                        <div key={e.email} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 100 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 22, background: `linear-gradient(135deg,${color},${color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, marginBottom: 6, boxShadow: `0 3px 10px ${hexA(color, 0.3)}` }}>
                                {initials(e.name)}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textAlign: 'center', marginBottom: 1 }}>{e.name.split(' ')[0]}</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 3 }}>{e.accuracy}%</div>
                            <div style={{ fontSize: 16, marginBottom: 6 }}>{LB_MEDALS[rank - 1]}</div>
                            <div style={{ width: '100%', height: h, background: hexA(color, 0.1), border: `2px solid ${color}`, borderBottom: 'none', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color, fontSize: 13, fontWeight: 900 }}>#{rank}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TeacherLeaderboardTab() {
    const [activeBoard, setActiveBoard] = useState('exam'); // 'exam' | 'mock'

    // ── Exam Leaderboard State ──
    const [examBoard, setExamBoard] = useState([]);
    const [examLoading, setExamLoading] = useState(true);
    const [examSearch, setExamSearch] = useState('');
    const [examLastRefresh, setExamLastRefresh] = useState(null);
    const [expandedExamRow, setExpandedExamRow] = useState(null);

    // ── Mock Leaderboard State ──
    const [mockBoard, setMockBoard] = useState([]);
    const [mockLoading, setMockLoading] = useState(true);
    const [mockSearch, setMockSearch] = useState('');
    const [mockLastRefresh, setMockLastRefresh] = useState(null);
    const [activeMockSubject, setActiveMockSubject] = useState('all');
    const [expandedMockRow, setExpandedMockRow] = useState(null);

    const MOCK_SUBJECTS = [
        { id: 'all',            label: 'All',          icon: '🎯', color: '#8B5CF6' },
        { id: 'air_regulations',label: 'Air Regs',     icon: '📋', color: '#1D4ED8' },
        { id: 'meteorology',    label: 'Meteorology',  icon: '🌦️', color: '#0EA5E9' },
        { id: 'navigation',     label: 'Navigation',   icon: '🗺️', color: '#10B981' },
        { id: 'technical',      label: 'Technical',    icon: '🔧', color: '#F59E0B' },
        { id: 'rtfm',           label: 'Radio Tel.',   icon: '📻', color: '#EF4444' },
    ];

    const SUBJECT_COLOR_MAP = {
        'Air Regulations':       '#1D4ED8',
        'Meteorology':           '#0EA5E9',
        'Navigation':            '#10B981',
        'General Navigation':    '#6366F1',
        'Instrument Navigation': '#EC4899',
        'Radio Navigation':      '#EF4444',
        'Technical General':     '#F59E0B',
        'Technical':             '#F59E0B',
        'Radio Tel.':            '#EF4444',
    };
    const subjectColor = (s) => SUBJECT_COLOR_MAP[s] || '#8B5CF6';

    // ── Fetch Exam Board ──
    const fetchExamBoard = useCallback(async () => {
        setExamLoading(true);
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            if (Array.isArray(data)) { setExamBoard(data); setExamLastRefresh(new Date()); }
        } catch (err) { console.error('Exam leaderboard fetch failed:', err); }
        finally { setExamLoading(false); }
    }, []);

    // ── Fetch Mock Board ──
    const fetchMockBoard = useCallback(async (subject) => {
        setMockLoading(true);
        try {
            const url = subject === 'all' ? '/api/mock-leaderboard' : `/api/mock-leaderboard?subject=${subject}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) { setMockBoard(data.entries); setMockLastRefresh(new Date()); }
        } catch (err) { console.error('Mock leaderboard fetch failed:', err); }
        finally { setMockLoading(false); }
    }, []);

    useEffect(() => { fetchExamBoard(); }, [fetchExamBoard]);
    useEffect(() => { fetchMockBoard(activeMockSubject); }, [activeMockSubject, fetchMockBoard]);

    const examFiltered = examSearch.trim()
        ? examBoard.filter(e => e.name.toLowerCase().includes(examSearch.toLowerCase()))
        : examBoard;
    const mockFiltered = mockSearch.trim()
        ? mockBoard.filter(e => e.name.toLowerCase().includes(mockSearch.toLowerCase()))
        : mockBoard;

    const medals      = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const podiumColors = { 1: '#F59E0B', 2: '#1D4ED8', 3: '#8B5CF6' };
    const aColor = (pct) => pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
    const circ   = 2 * Math.PI * 11;

    function hexA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // ── Chapter Tag ──────────────────────────────────────────────────────────
    function ChapterTag({ subject, chapter, accuracy, tests }) {
        const color = subjectColor(subject);
        const ac    = aColor(accuracy);
        return (
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: color + '12', border: `1px solid ${color}30`,
                borderRadius: 7, padding: '3px 7px',
            }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, color, fontWeight: 700, whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {subject}
                </span>
                <span style={{ fontSize: 9, color: '#CBD5E0' }}>›</span>
                <span style={{ fontSize: 9, color: '#64748B', whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chapter}
                </span>
                <span style={{ fontSize: 8, fontWeight: 800, color: ac, background: ac + '18', borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap' }}>
                    {accuracy}%
                </span>
                {tests !== undefined && (
                    <span style={{ fontSize: 8, color: '#94A3B8', whiteSpace: 'nowrap' }}>·{tests}t</span>
                )}
            </div>
        );
    }

    // ── Subject Accuracy Bars (expanded panel) ───────────────────────────────
    function SubjectBars({ breakdown }) {
        if (!breakdown?.length) return null;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                {breakdown.map((s, i) => {
                    const color = subjectColor(s.subject);
                    const ac    = aColor(s.accuracy);
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 130, fontSize: 10, color: '#64748B', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 5, verticalAlign: 'middle' }} />
                                {s.subject}
                            </div>
                            <div style={{ flex: 1, background: '#E2E8F0', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(s.accuracy, 100)}%`, height: '100%', background: ac, borderRadius: 99, transition: 'width .6s ease' }} />
                            </div>
                            <div style={{ width: 34, fontSize: 10, fontWeight: 800, color: ac, textAlign: 'right', flexShrink: 0 }}>{s.accuracy}%</div>
                            <div style={{ width: 24, fontSize: 9, color: '#94A3B8', textAlign: 'right', flexShrink: 0 }}>{s.tests}t</div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // ── Chapter Detail Table (expanded panel) ────────────────────────────────
    function ChapterTable({ breakdown }) {
        if (!breakdown?.length) return null;
        return (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 50px 50px', background: '#F0F4FF', padding: '6px 12px', fontSize: 9, fontWeight: 700, color: '#64748B', gap: 8 }}>
                    <div>CHAPTER</div>
                    <div>SUBJECT</div>
                    <div style={{ textAlign: 'center' }}>ACC</div>
                    <div style={{ textAlign: 'center' }}>TESTS</div>
                </div>
                {breakdown.map((s, i) => (
                    <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '1fr 110px 50px 50px',
                        padding: '8px 12px', gap: 8,
                        borderTop: '1px solid #E2E8F0',
                        background: i % 2 === 0 ? '#fff' : '#FAFBFF',
                        alignItems: 'center',
                    }}>
                        <div style={{ fontSize: 10, color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: subjectColor(s.subject), marginRight: 5, verticalAlign: 'middle' }} />
                            {s.chapter}
                        </div>
                        <div style={{ fontSize: 9, color: subjectColor(s.subject), fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.subject}
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: aColor(s.accuracy) }}>
                            {s.accuracy}%
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 10, color: '#64748B' }}>
                            {s.tests}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // ── Expanded Detail Panel ────────────────────────────────────────────────
    function ExpandedPanel({ entry }) {
        const hasBreakdown = entry.subjectBreakdown?.length > 0;
        return (
            <div style={{
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFF',
                padding: '14px 18px 16px 96px',
                borderBottom: '2px solid #EFF6FF',
            }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>
                    📊 Subject-wise Performance
                </div>
                {hasBreakdown ? (
                    <>
                        <SubjectBars breakdown={entry.subjectBreakdown} />
                        <ChapterTable breakdown={entry.subjectBreakdown} />
                    </>
                ) : (
                    <div style={{ fontSize: 11, color: '#94A3B8', padding: '10px 0' }}>
                        No chapter breakdown available yet.
                    </div>
                )}
            </div>
        );
    }

    // ── Shared Podium ────────────────────────────────────────────────────────
    function Podium({ top3 }) {
        if (top3.length < 2) return null;
        const order = top3.length >= 3
            ? [{ e: top3[1], rank: 2, h: 80 }, { e: top3[0], rank: 1, h: 110 }, { e: top3[2], rank: 3, h: 60 }]
            : [{ e: top3[1], rank: 2, h: 80 }, { e: top3[0], rank: 1, h: 110 }];
        return (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 16px 0', marginBottom: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>🏆 Top Performers</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Highest accuracy scores</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
                    {order.map(({ e, rank, h }) => {
                        const color = podiumColors[rank];
                        // strongest subject for podium pill
                        const strongest = e.subjectBreakdown?.length
                            ? [...e.subjectBreakdown].sort((a, b) => b.accuracy - a.accuracy)[0]
                            : null;
                        return (
                            <div key={e.email} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 130 }}>
                                <div style={{ width: 50, height: 50, borderRadius: 25, background: `linear-gradient(135deg,${color},${color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 6, boxShadow: `0 4px 12px ${color}44` }}>
                                    {initials(e.name)}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textAlign: 'center', marginBottom: 2 }}>{e.name.split(' ')[0]}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color, marginBottom: strongest ? 3 : 4 }}>{e.accuracy}%</div>
                                {/* strongest subject pill */}
                                {strongest && (
                                    <div style={{
                                        fontSize: 8, fontWeight: 700, marginBottom: 4,
                                        background: subjectColor(strongest.subject) + '18',
                                        color: subjectColor(strongest.subject),
                                        border: `1px solid ${subjectColor(strongest.subject)}30`,
                                        borderRadius: 5, padding: '2px 6px',
                                        maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
                                    }}>
                                        ⭐ {strongest.subject}
                                    </div>
                                )}
                                <div style={{ fontSize: 20, marginBottom: 6 }}>{medals[rank]}</div>
                                <div style={{ width: '100%', height: h, background: color + '20', border: `2px solid ${color}`, borderBottom: 'none', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color, fontSize: 13, fontWeight: 900 }}>#{rank}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Shared Stats Banner ──────────────────────────────────────────────────
    function StatsBanner({ board, loading, topSubLabel }) {
        const avg        = board.length ? Math.round(board.reduce((s, e) => s + e.accuracy, 0) / board.length) : 0;
        const totalTests = board.reduce((s, e) => s + (e.testsAttempted || e.attempts || 0), 0);
        return (
            <div style={{ background: 'linear-gradient(120deg,#0A1628 0%,#1D4ED8 100%)', borderRadius: 14, padding: '18px 22px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    {[
                        { icon: '👥', label: 'Students',     value: loading ? '…' : board.length },
                        { icon: '🥇', label: 'Top Score',    value: loading ? '…' : (board[0] ? `${board[0].accuracy}%` : '—') },
                        { icon: '🎯', label: 'Avg Accuracy', value: loading ? '…' : `${avg}%` },
                        { icon: '📝', label: 'Total Tests',  value: loading ? '…' : totalTests },
                    ].map(s => (
                        <div key={s.label}>
                            <div style={{ color: '#93C5FD', fontSize: 10, marginBottom: 2 }}>{s.icon} {s.label}</div>
                            <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#93C5FD', fontSize: 11, marginBottom: 2 }}>Top Student</div>
                    <div style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>{board[0]?.name || '—'}</div>
                    {board[0] && <div style={{ color: '#93C5FD', fontSize: 11, marginTop: 4 }}>{board[0].accuracy}% · {topSubLabel}</div>}
                </div>
            </div>
        );
    }

    // ── Shared Loading Skeleton ──────────────────────────────────────────────
    function SkeletonRows() {
        return Array(5).fill(0).map((_, i) => (
            <div key={i} style={{ padding: '12px 18px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8,  background: '#E2E8F0' }} />
                <div style={{ width: 40, height: 40, borderRadius: 20, background: '#E2E8F0' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ height: 12, borderRadius: 6, background: '#E2E8F0', marginBottom: 6 }} />
                    <div style={{ height: 9,  borderRadius: 6, background: '#E2E8F0', width: '60%' }} />
                </div>
                <div style={{ width: 60, height: 13, borderRadius: 6, background: '#E2E8F0' }} />
            </div>
        ));
    }

    // ════════════════════════════════════════════════════════════════════════
    return (
        <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

            {/* ── Board Switcher ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#E2E8F0', borderRadius: 14, padding: 4 }}>
                {[
                    { id: 'exam', label: '📝 Exam Leaderboard',      desc: 'Chapter test scores' },
                    { id: 'mock', label: '🎯 Mock Test Leaderboard', desc: 'Mock test scores by subject' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveBoard(tab.id)} style={{
                        flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: activeBoard === tab.id ? '#fff' : 'transparent',
                        boxShadow: activeBoard === tab.id ? '0 2px 8px rgba(15,23,42,.08)' : 'none',
                        transition: 'all .2s',
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: activeBoard === tab.id ? '#1D4ED8' : '#64748B' }}>{tab.label}</div>
                        <div style={{ fontSize: 11, color: activeBoard === tab.id ? '#64748B' : '#94A3B8', marginTop: 2 }}>{tab.desc}</div>
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* EXAM LEADERBOARD                                            */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeBoard === 'exam' && (
                <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>📝 Exam Leaderboard</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                {examLoading ? 'Loading…' : `${examBoard.length} students · ranked by accuracy${examLastRefresh ? ` · updated ${examLastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 9, padding: '6px 10px', gap: 6 }}>
                                <span style={{ color: '#64748B' }}>🔍</span>
                                <input value={examSearch} onChange={e => setExamSearch(e.target.value)} placeholder="Search student…"
                                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: '#0F172A', width: 140 }} />
                                {examSearch && <button onClick={() => setExamSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, padding: 0 }}>✕</button>}
                            </div>
                            <button onClick={fetchExamBoard}
                                style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0)'}>🔄</button>
                        </div>
                    </div>

                    <StatsBanner board={examBoard} loading={examLoading} topSubLabel={`${examBoard[0]?.testsAttempted || 0} tests taken`} />
                    {!examLoading && !examSearch && <Podium top3={examFiltered.slice(0, 3)} />}

                    {/* Table */}
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        {/* Table header bar */}
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>All Rankings</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#64748B' }}>{examFiltered.length} students</span>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'lbPulse 2s ease-in-out infinite' }} />
                            </div>
                        </div>
                        {/* Column headers */}
                        <div style={{ padding: '8px 18px', background: '#F0F4FF', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
                            <div style={{ width: 36, fontSize: 10, color: '#64748B', fontWeight: 700 }}>Rank</div>
                            <div style={{ width: 40 }} />
                            <div style={{ flex: 1, fontSize: 10, color: '#64748B', fontWeight: 700 }}>Student & Chapters</div>
                            <div style={{ width: 70, fontSize: 10, color: '#64748B', fontWeight: 700, textAlign: 'center' }}>Tests</div>
                            <div style={{ width: 90, fontSize: 10, color: '#64748B', fontWeight: 700, textAlign: 'right' }}>Score</div>
                            <div style={{ width: 90, fontSize: 10, color: '#64748B', fontWeight: 700, textAlign: 'right' }}>Accuracy</div>
                        </div>

                        {examLoading ? <SkeletonRows /> : examFiltered.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                                <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
                                {examSearch ? `No students matching "${examSearch}"` : 'No exam entries yet. Students appear here after taking chapter tests.'}
                            </div>
                        ) : examFiltered.map((entry, i) => {
                            const rank       = i + 1;
                            const ac         = aColor(entry.accuracy);
                            const [bg, fg]   = avatarColors(i);
                            const isExpanded = expandedExamRow === entry.email;
                            const strongest  = entry.subjectBreakdown?.length
                                ? [...entry.subjectBreakdown].sort((a, b) => b.accuracy - a.accuracy)[0]
                                : null;

                            return (
                                <div key={entry.email}>
                                    {/* Main row — clickable to expand */}
                                    <div
                                        onClick={() => setExpandedExamRow(isExpanded ? null : entry.email)}
                                        style={{
                                            padding: '12px 18px', borderTop: '1px solid #E2E8F0',
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                            background: rank === 1 ? '#FFFBEB' : isExpanded ? '#F8FAFF' : 'transparent',
                                            cursor: 'pointer', transition: 'background .15s',
                                        }}
                                        onMouseEnter={e => { if (rank > 1 && !isExpanded) e.currentTarget.style.background = '#F8FAFC'; }}
                                        onMouseLeave={e => { if (rank > 1 && !isExpanded) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {/* Rank */}
                                        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, marginTop: 2, background: rank <= 3 ? 'transparent' : '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: rank <= 3 ? 20 : 11, fontWeight: 700, color: '#0F172A' }}>
                                            {rank <= 3 ? medals[rank] : `#${rank}`}
                                        </div>
                                        {/* Avatar */}
                                        <div style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0, marginTop: 2, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fg, fontWeight: 800, fontSize: 12 }}>
                                            {initials(entry.name)}
                                        </div>
                                        {/* Name + email + chapter tags */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
                                                {strongest && (
                                                    <span style={{
                                                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 5,
                                                        background: subjectColor(strongest.subject) + '18',
                                                        color: subjectColor(strongest.subject),
                                                        border: `1px solid ${subjectColor(strongest.subject)}30`,
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        ⭐ {strongest.subject}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{entry.email}</div>

                                            {/* Chapter tags — up to 3 inline */}
                                            {entry.subjectBreakdown?.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5 }}>
                                                    {entry.subjectBreakdown.slice(0, 3).map((s, idx) => (
                                                        <ChapterTag key={idx} subject={s.subject} chapter={s.chapter} accuracy={s.accuracy} tests={s.tests} />
                                                    ))}
                                                    {entry.subjectBreakdown.length > 3 && (
                                                        <span style={{ fontSize: 9, color: '#64748B', alignSelf: 'center', background: '#F0F4FF', border: '1px solid #E2E8F0', borderRadius: 5, padding: '2px 6px' }}>
                                                            +{entry.subjectBreakdown.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Last chapter if no breakdown */}
                                            {!entry.subjectBreakdown?.length && entry.lastTestChapter && (
                                                <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4 }}>
                                                    📖 Last: <span style={{ color: '#0F172A', fontWeight: 600 }}>{entry.lastTestChapter}</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Tests */}
                                        <div style={{ width: 70, textAlign: 'center', flexShrink: 0, paddingTop: 2 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{entry.testsAttempted}</div>
                                            <div style={{ fontSize: 10, color: '#64748B' }}>tests</div>
                                        </div>
                                        {/* Score */}
                                        <div style={{ width: 90, textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{entry.totalScore}/{entry.totalQuestions}</div>
                                            <div style={{ fontSize: 10, color: '#64748B' }}>score</div>
                                        </div>
                                        {/* Accuracy + ring + expand hint */}
                                        <div style={{ width: 90, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: ac }}>{entry.accuracy}%</span>
                                                <svg width={26} height={26} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                                                    <circle cx={13} cy={13} r={11} fill="none" stroke="#E2E8F0" strokeWidth={3} />
                                                    <circle cx={13} cy={13} r={11} fill="none" stroke={ac} strokeWidth={3}
                                                        strokeDasharray={`${circ * entry.accuracy / 100} ${circ}`} strokeLinecap="round"
                                                        style={{ transition: 'stroke-dasharray .5s ease' }} />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: 9, color: '#94A3B8' }}>{isExpanded ? '▲ less' : '▼ detail'}</div>
                                        </div>
                                    </div>

                                    {/* Expanded detail panel */}
                                    {isExpanded && <ExpandedPanel entry={entry} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* MOCK LEADERBOARD                                            */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeBoard === 'mock' && (
                <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>🎯 Mock Test Leaderboard</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                {mockLoading ? 'Loading…' : `${mockBoard.length} students · ranked by best accuracy${mockLastRefresh ? ` · updated ${mockLastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 9, padding: '6px 10px', gap: 6 }}>
                                <span style={{ color: '#64748B' }}>🔍</span>
                                <input value={mockSearch} onChange={e => setMockSearch(e.target.value)} placeholder="Search student…"
                                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: '#0F172A', width: 140 }} />
                                {mockSearch && <button onClick={() => setMockSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, padding: 0 }}>✕</button>}
                            </div>
                            <button onClick={() => fetchMockBoard(activeMockSubject)}
                                style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0)'}>🔄</button>
                        </div>
                    </div>

                    <StatsBanner board={mockBoard} loading={mockLoading} topSubLabel={mockBoard[0]?.subjectLabel || mockBoard[0]?.subject || ''} />

                    {/* Subject Filter Tabs */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                        {MOCK_SUBJECTS.map(tab => {
                            const isActive = activeMockSubject === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveMockSubject(tab.id)} style={{
                                    padding: '6px 13px', borderRadius: 20,
                                    border: isActive ? `2px solid ${tab.color}` : '1px solid #E2E8F0',
                                    background: isActive ? hexA(tab.color, 0.1) : '#fff',
                                    color: isActive ? tab.color : '#64748B',
                                    fontWeight: isActive ? 700 : 400, fontSize: 12, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s',
                                    transform: isActive ? 'scale(1.04)' : 'scale(1)',
                                }}>
                                    <span>{tab.icon}</span><span>{tab.label}</span>
                                    {isActive && !mockLoading && (
                                        <span style={{ background: hexA(tab.color, 0.15), color: tab.color, fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 8 }}>{mockFiltered.length}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {!mockLoading && !mockSearch && <Podium top3={mockFiltered.slice(0, 3)} />}

                    {/* Table */}
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>All Rankings</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#64748B' }}>{mockFiltered.length} students</span>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'lbPulse 2s ease-in-out infinite' }} />
                            </div>
                        </div>
                        {/* Column headers */}
                        <div style={{ padding: '8px 18px', background: '#F0F4FF', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
                            <div style={{ width: 36, fontSize: 10, color: '#64748B', fontWeight: 700 }}>Rank</div>
                            <div style={{ width: 40 }} />
                            <div style={{ flex: 1, fontSize: 10, color: '#64748B', fontWeight: 700 }}>Student & Chapter</div>
                            <div style={{ width: 80, fontSize: 10, color: '#64748B', fontWeight: 700, textAlign: 'right' }}>Score</div>
                            <div style={{ width: 90, fontSize: 10, color: '#64748B', fontWeight: 700, textAlign: 'right' }}>Accuracy</div>
                        </div>

                        {mockLoading ? <SkeletonRows /> : mockFiltered.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                                <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
                                {mockSearch ? `No students matching "${mockSearch}"` : 'No mock test entries yet.'}
                            </div>
                        ) : mockFiltered.slice(0, 50).map((entry, i) => {
                            const rank       = i + 1;
                            const ac         = aColor(entry.accuracy);
                            const [bg, fg]   = avatarColors(i);
                            const isExpanded = expandedMockRow === entry.email;
                            const subColor   = subjectColor(entry.subjectLabel || entry.subject || '');

                            return (
                                <div key={`${entry.email}-${i}`}>
                                    {/* Main row */}
                                    <div
                                        onClick={() => setExpandedMockRow(isExpanded ? null : entry.email)}
                                        style={{
                                            padding: '12px 18px', borderTop: '1px solid #E2E8F0',
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                            background: rank === 1 ? '#FFFBEB' : isExpanded ? '#F8FAFF' : 'transparent',
                                            cursor: 'pointer', transition: 'background .15s',
                                        }}
                                        onMouseEnter={e => { if (rank > 1 && !isExpanded) e.currentTarget.style.background = '#F8FAFC'; }}
                                        onMouseLeave={e => { if (rank > 1 && !isExpanded) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {/* Rank */}
                                        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, marginTop: 2, background: rank <= 3 ? 'transparent' : '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: rank <= 3 ? 20 : 11, fontWeight: 700, color: '#0F172A' }}>
                                            {rank <= 3 ? medals[rank] : `#${rank}`}
                                        </div>
                                        {/* Avatar */}
                                        <div style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0, marginTop: 2, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fg, fontWeight: 800, fontSize: 12 }}>
                                            {initials(entry.name)}
                                        </div>
                                        {/* Name + subject + chapter */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                                            {/* Subject pill + attempts */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
                                                <span style={{
                                                    fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 5,
                                                    background: subColor + '15', color: subColor,
                                                    border: `1px solid ${subColor}30`,
                                                }}>
                                                    {entry.subjectLabel || entry.subject}
                                                </span>
                                                <span style={{ fontSize: 9, color: '#94A3B8' }}>
                                                    {entry.attempts || 1} attempt{(entry.attempts || 1) !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {/* Last chapter */}
                                            {entry.lastChapter && (
                                                <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4 }}>
                                                    📖 Last chapter: <span style={{ color: '#0F172A', fontWeight: 600 }}>{entry.lastChapter}</span>
                                                </div>
                                            )}
                                            {/* Chapter tags if subjectBreakdown present */}
                                            {entry.subjectBreakdown?.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5 }}>
                                                    {entry.subjectBreakdown.slice(0, 2).map((s, idx) => (
                                                        <ChapterTag key={idx} subject={s.subject} chapter={s.chapter} accuracy={s.accuracy} tests={s.tests} />
                                                    ))}
                                                    {entry.subjectBreakdown.length > 2 && (
                                                        <span style={{ fontSize: 9, color: '#64748B', alignSelf: 'center', background: '#F0F4FF', border: '1px solid #E2E8F0', borderRadius: 5, padding: '2px 6px' }}>
                                                            +{entry.subjectBreakdown.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Score */}
                                        <div style={{ width: 80, textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{entry.score}/{entry.total}</div>
                                            <div style={{ fontSize: 10, color: '#64748B' }}>score</div>
                                        </div>
                                        {/* Accuracy + ring + expand hint */}
                                        <div style={{ width: 90, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: ac }}>{entry.accuracy}%</span>
                                                <svg width={26} height={26} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                                                    <circle cx={13} cy={13} r={11} fill="none" stroke="#E2E8F0" strokeWidth={3} />
                                                    <circle cx={13} cy={13} r={11} fill="none" stroke={ac} strokeWidth={3}
                                                        strokeDasharray={`${circ * entry.accuracy / 100} ${circ}`} strokeLinecap="round"
                                                        style={{ transition: 'stroke-dasharray .5s ease' }} />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: 9, color: '#94A3B8' }}>{isExpanded ? '▲ less' : '▼ detail'}</div>
                                        </div>
                                    </div>

                                    {/* Expanded detail panel */}
                                    {isExpanded && <ExpandedPanel entry={entry} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style>{`@keyframes lbPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.2)}}`}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGN TEST TAB
// ═══════════════════════════════════════════════════════════════════════════════
function AssignTestTab() {
    const SUBJECT_OPTIONS = [
        {
            id: 'air_regulations',
            label: 'Air Regulations',
            subtitle: 'ICAO, DGCA, National Law & Procedures',
            icon: '📋',
            color: '#1D4ED8',
            chapters: [
                { id: 'ch01', label: 'Definitions & Abbreviations' },
                { id: 'ch02', label: 'International Organisations & Conventions' },
                { id: 'ch03', label: 'Aircraft Nationality & Registration Marks' },
                { id: 'ch04', label: 'Rules of the Air' },
                { id: 'ch05', label: 'Air Traffic Services' },
                { id: 'ch06', label: 'Separation Methods & Minima' },
                { id: 'ch07', label: 'Separation in the Vicinity of Aerodromes' },
                { id: 'ch08', label: 'Procedures for Aerodrome Control Service' },
                { id: 'ch09', label: 'ATS Surveillance System' },
                { id: 'ch10', label: 'Aeronautical Information Services' },
                { id: 'ch11', label: 'Search and Rescue' },
                { id: 'ch12', label: 'Visual Aids for Navigation' },
                { id: 'ch13', label: 'Procedures for ANS – Aircraft Operations' },
                { id: 'ch14', label: 'National Law' },
                { id: 'ch15', label: 'Personnel Licensing' },
                { id: 'ch16', label: 'Airworthiness of Aircraft' },
                { id: 'ch17', label: 'Operational Procedures' },
                { id: 'ch18', label: 'Special Operational Procedures & Hazards' },
                { id: 'ch19', label: 'Communications' },
                { id: 'ch20', label: 'Aircraft Accident and Incident' },
                { id: 'ch21', label: 'Facilitation' },
                { id: 'ch22', label: 'Security – Safeguarding International Civil Aviation' },
                { id: 'qb01', label: 'Question Bank 1' },
                { id: 'qb02', label: 'Question Bank 2' },
                { id: 'qb03', label: 'Question Bank 3' },
            ],
        },
        {
            id: 'meteorology',
            label: 'Meteorology',
            subtitle: 'Weather, Clouds, Pressure Systems',
            icon: '🌦️',
            color: '#0EA5E9',
            chapters: [
                { id: 'met01', label: 'Atmosphere' },
                { id: 'met02', label: 'Atmospheric Pressure' },
                { id: 'met03', label: 'Temperature' },
                { id: 'met04', label: 'Air Density' },
                { id: 'met05', label: 'Humidity' },
                { id: 'met06', label: 'Winds' },
                { id: 'met07', label: 'Visibility and Fog' },
                { id: 'met08', label: 'Vertical Motion and Clouds' },
                { id: 'met09', label: 'Stability' },
                { id: 'met10', label: 'Optical Phenomena' },
                { id: 'met11', label: 'Precipitation' },
                { id: 'met12', label: 'Ice Accretion' },
                { id: 'met13', label: 'Thunderstorm' },
                { id: 'met14', label: 'Air Masses and Fronts and WDs' },
                { id: 'met15', label: 'Jet Streams' },
                { id: 'met16', label: 'Clear Air Turbulence' },
                { id: 'met17', label: 'Mountain Waves' },
                { id: 'met18', label: 'Tropical Systems' },
                { id: 'met19', label: 'Climatology of India' },
                { id: 'met20', label: 'Met Services' },
                { id: 'met21', label: 'Station Model' },
                { id: 'met22', label: 'METAR, SPECI and TREND' },
                { id: 'met23', label: 'TAF, ARFOR, ROFOR' },
            ],
        },
        {
            id: 'navigation',
            label: 'Navigation',
            subtitle: 'General, Radio & Instrument Navigation',
            icon: '🗺️',
            color: '#10B981',
            chapters: [
                { id: 'gn01', label: 'Departure, Convergency & Conversion Angle' },
                { id: 'gn02', label: 'Scale, Distance & Velocity' },
                { id: 'gn03', label: 'One in 60 Rule' },
                { id: 'gn04', label: 'Climb Gradient, PNR, PSR & Critical Point' },
                { id: 'gn05', label: 'Magnetic Compasses' },
                { id: 'gn06', label: 'Mercator Projection' },
                { id: 'gn07', label: 'Lambert Conical Projection' },
                { id: 'gn08', label: 'Polar Stereographic Projection' },
                { id: 'gn09', label: 'PNR & PSR' },
                { id: 'gn10', label: 'Flight Planning (Fuel Planning, Weight & Balance, ROD)' },
                { id: 'gn11', label: 'Solar System & Time' },
                { id: 'rn01', label: 'Properties of Radio Waves' },
                { id: 'rn02', label: 'Modulation' },
                { id: 'rn03', label: 'VOR & ADF' },
                { id: 'rn04', label: 'ILS (Instrument Landing System)' },
                { id: 'rn05', label: 'VOR' },
                { id: 'rn06', label: 'Radar Principles' },
                { id: 'rn07', label: 'Ground Radar' },
                { id: 'rn08', label: 'AWR (Airborne Weather Radar)' },
                { id: 'rn09', label: 'SSR (Secondary Surveillance Radar)' },
                { id: 'rn10', label: 'DME (Distance Measuring Equipment)' },
                { id: 'rn11', label: 'Radio Altimeter' },
                { id: 'rn12', label: 'GPS' },
                { id: 'rn13', label: 'Doppler Radar' },
            ],
        },
        {
            id: 'technical',
            label: 'Technical General',
            subtitle: 'Airframes, Engines, Systems',
            icon: '🔧',
            color: '#F59E0B',
            gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
            parts: [
                {
                    label: 'Part I – Principle of Flight',
                    color: '#F59E0B',
                    chapterIds: ['tg01', 'tg02'],
                },
                {
                    label: 'Part II – Engines',
                    color: '#D97706',
                    chapterIds: ['tg03', 'tg04'],
                },
                {
                    label: 'Part III – Aircraft Systems',
                    color: '#B45309',
                    chapterIds: ['tg05', 'tg06', 'tg07', 'tg08'],
                },
            ],
            chapters: [
                {
                    id: 'tg01',
                    title: 'Principle of Flight',
                    topics: [
                        { id: 'tg01_t01', label: 'Overview and Definitions' },
                        { id: 'tg01_t02', label: 'Atmosphere' },
                        { id: 'tg01_t03', label: 'Basic Aerodynamic Theory' },
                        { id: 'tg01_t04', label: 'Subsonic Airflow' },
                        { id: 'tg01_t05', label: 'Lift' },
                        { id: 'tg01_t06', label: 'Drag' },
                        { id: 'tg01_t07', label: 'Stalling' },
                        { id: 'tg01_t08', label: 'High Lift Devices' },
                        { id: 'tg01_t09', label: 'Airframe Contamination' },
                        { id: 'tg01_t10', label: 'Stability and Control' },
                        { id: 'tg01_t11', label: 'Controls' },
                        { id: 'tg01_t12', label: 'Flight Mechanics' },
                        { id: 'tg01_t13', label: 'High Speed Flight' },
                        { id: 'tg01_t14', label: 'Limitations' },
                        { id: 'tg01_t15', label: 'Windshear' },
                        { id: 'tg01_t16', label: 'Propellers' },
                    ],
                },
                {
                    id: 'tg02',
                    title: 'Performance',
                    topics: [
                        { id: 'tg02_t01', label: 'Performance' },
                    ],
                },
                {
                    id: 'tg03',
                    title: 'Jet Engine',
                    topics: [
                        { id: 'tg03_t01', label: 'Basics of Jet Engine' },
                        { id: 'tg03_t02', label: 'Types of Engine' },
                        { id: 'tg03_t03', label: 'Compressors' },
                        { id: 'tg03_t04', label: 'Combustion Chamber' },
                        { id: 'tg03_t05', label: 'Turbine Assembly' },
                        { id: 'tg03_t06', label: 'Jet Pipe' },
                        { id: 'tg03_t07', label: 'Reverse Thrust' },
                        { id: 'tg03_t08', label: 'Engine Starting System Requirements' },
                        { id: 'tg03_t09', label: 'APU (Auxiliary Power Unit)' },
                    ],
                },
                {
                    id: 'tg04',
                    title: 'Piston Engine',
                    topics: [
                        { id: 'tg04_t01', label: 'Introduction' },
                        { id: 'tg04_t02', label: 'General' },
                        { id: 'tg04_t03', label: 'Lubrication' },
                        { id: 'tg04_t04', label: 'Cooling' },
                        { id: 'tg04_t05', label: 'Ignition' },
                        { id: 'tg04_t06', label: 'Fuel' },
                        { id: 'tg04_t07', label: 'Mixture' },
                        { id: 'tg04_t08', label: 'Carburettors' },
                        { id: 'tg04_t09', label: 'Icing' },
                        { id: 'tg04_t10', label: 'Fuel Injection' },
                        { id: 'tg04_t11', label: 'Performance and Power Augmentation' },
                        { id: 'tg04_t12', label: 'Propellers' },
                    ],
                },
                {
                    id: 'tg05',
                    title: 'Airframe Systems',
                    topics: [
                        { id: 'tg05_t01', label: 'Fuselage, Wings and Stabilizing Surfaces' },
                        { id: 'tg05_t02', label: 'Basic Hydraulics' },
                        { id: 'tg05_t03', label: 'Landing Gear' },
                        { id: 'tg05_t04', label: 'Aircraft Wheels' },
                        { id: 'tg05_t05', label: 'Aircraft Tyres' },
                        { id: 'tg05_t06', label: 'Aircraft Brakes' },
                        { id: 'tg05_t07', label: 'Flight Control System' },
                        { id: 'tg05_t08', label: 'Flight Controls' },
                        { id: 'tg05_t09', label: 'Powered Flying Controls' },
                        { id: 'tg05_t10', label: 'Aircraft Pneumatic Systems' },
                        { id: 'tg05_t11', label: 'Pressurization Systems' },
                        { id: 'tg05_t12', label: 'Ice and Rain Protection' },
                        { id: 'tg05_t13', label: 'Aircraft Oxygen Equipment' },
                        { id: 'tg05_t14', label: 'Smoke Detection' },
                        { id: 'tg05_t15', label: 'Fire Detection and Protection' },
                        { id: 'tg05_t16', label: 'Aircraft Fuel Systems' },
                    ],
                },
                {
                    id: 'tg06',
                    title: 'Electrical Systems',
                    topics: [
                        { id: 'tg06_t01', label: 'Electrical Systems' },
                    ],
                },
                {
                    id: 'tg07',
                    title: 'Instruments',
                    topics: [
                        { id: 'tg07_t01', label: 'Instruments' },
                    ],
                },
                {
                    id: 'tg08',
                    title: 'Avionics',
                    topics: [
                        { id: 'tg08_t01', label: 'Avionics' },
                    ],
                },
            ],
            chapterIds: ['tg01', 'tg02', 'tg03', 'tg04', 'tg05', 'tg06', 'tg07', 'tg08'],
        },
        {
            id: 'rtfm',
            label: 'Radio Telephony',
            subtitle: 'RTF Procedures & Phraseology',
            icon: '📻',
            color: '#8B5CF6',
            chapters: [
                { id: 'rt01', label: 'RT Procedures – General & Phraseology' },
                { id: 'rt02', label: 'RT – Departure, En-Route & Approach' },
                { id: 'rt03', label: 'RT – Emergencies & Special Procedures' },
            ],
        },
    ];

    const [mounted, setMounted] = useState(false);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [selectedTest, setSelectedTest] = useState(null);
    const [testResults, setTestResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(false);

    const [expandedSubject, setExpandedSubject] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);

    const [form, setForm] = useState({
        title: '',
        numQuestions: 20,
        durationMins: 30,
        instructions: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => { setTimeout(() => setMounted(true), 20); }, []);
    useEffect(() => { fetchTests(); }, []);

    async function fetchTests() {
        setLoading(true);
        try {
            const res = await fetch('/api/teacher/assigned-tests');
            const data = await res.json();
            if (data.success) setTests(data.tests);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function fetchTestResults(testId) {
        setLoadingResults(true);
        try {
            const res = await fetch(`/api/assigned-tests/submit?testId=${testId}`);
            const data = await res.json();
            if (data.success) setTestResults(data.results);
        } catch (err) { console.error(err); }
        finally { setLoadingResults(false); }
    }

    function flash(text, type = 'ok') {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    }

    function setField(k, v) {
        setForm(p => ({ ...p, [k]: v }));
        setErrors(p => ({ ...p, [k]: '' }));
    }

    function handleSubjectClick(subjectId) {
        setExpandedSubject(prev => prev === subjectId ? null : subjectId);
        setSelectedChapter(prev => {
            if (prev?.subjectId !== subjectId) return null;
            return prev;
        });
    }

    function handleChapterClick(subject, chapter) {
        setSelectedChapter(prev => {
            const sameSubject = prev?.subjectId === subject.id;
            const currentIds = sameSubject ? [...prev.chapterIds] : [];
            const currentLabels = sameSubject ? [...prev.chapterLabels] : [];
            const existingIndex = currentIds.indexOf(chapter.id);

            if (existingIndex >= 0) {
                currentIds.splice(existingIndex, 1);
                currentLabels.splice(existingIndex, 1);
            } else {
                currentIds.push(chapter.id);
                currentLabels.push(chapter.label);
            }

            const finalIds = currentIds;
            const finalLabels = currentLabels;
            if (finalIds.length === 0) return null;

            const titleHint = finalLabels.length === 1
                ? `${subject.label} — ${finalLabels[0]}`
                : `${subject.label} — ${finalLabels.join(', ')}`;

            return {
                subjectId: subject.id,
                subjectLabel: subject.label,
                subjectIcon: subject.icon,
                subjectColor: subject.color,
                chapterIds: finalIds,
                chapterLabels: finalLabels,
                chapterId: finalIds[0] || '',
                chapterLabel: finalLabels.join(', '),
                titleHint,
            };
        });

        setErrors(p => ({ ...p, chapter: '' }));
        setForm(p => ({
            ...p,
            title: p.title || `${subject.label} — ${chapter.label}`,
        }));
    }

    function validate() {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Title is required';
        if (!selectedChapter || !selectedChapter.chapterIds?.length) errs.chapter = 'Please select at least one chapter';
        if (form.numQuestions < 5 || form.numQuestions > 100) 
            errs.numQuestions = 'Must be between 5 and 100';
        if (form.durationMins < 5 || form.durationMins > 180) 
            errs.durationMins = 'Must be between 5 and 180 minutes';
        return errs;
    }

    async function handleCreate() {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true);
        try {
            const res = await fetch('/api/teacher/assigned-tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title.trim(),
                    subjectId: selectedChapter.subjectId,
                    subjectLabel: selectedChapter.subjectLabel,
                    chapterId: selectedChapter.chapterId,
                    chapterLabel: selectedChapter.chapterLabel,
                    chapterIds: selectedChapter.chapterIds,
                    numQuestions: Number(form.numQuestions),
                    durationMins: Number(form.durationMins),
                    instructions: form.instructions.trim(),
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to create test');
            setTests(prev => [data.test, ...prev]);
            setForm({ title: '', numQuestions: 20, durationMins: 30, instructions: '' });
            setSelectedChapter(null);
            setExpandedSubject(null);
            flash('✓ Test created! Students can now see and take this test.', 'ok');
        } catch (err) {
            flash(`✗ ${err.message}`, 'err');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        setDeletingId(id);
        try {
            const res = await fetch('/api/teacher/assigned-tests', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setTests(prev => prev.filter(t => t.id !== id));
            flash('Test deleted.', 'ok');
        } catch (err) {
            flash(`✗ ${err.message}`, 'err');
        } finally {
            setDeletingId(null);
        }
    }

    async function handleToggle(test) {
        setTogglingId(test.id);
        try {
            const res = await fetch('/api/teacher/assigned-tests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: test.id, isActive: !test.is_active }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setTests(prev => prev.map(t => 
                t.id === test.id ? { ...t, is_active: !t.is_active } : t
            ));
        } catch (err) {
            flash(`✗ ${err.message}`, 'err');
        } finally {
            setTogglingId(null);
        }
    }

    const C = {
        primary: '#1D4ED8', text: '#0F172A', muted: '#64748B',
        border: '#E2E8F0', bg: '#F0F4FF', card: '#FFFFFF',
        green: '#10B981', red: '#EF4444',
    };

    if (selectedTest) {
        const test = tests.find(t => t.id === selectedTest);
        return (
            <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
                <button
                    onClick={() => { setSelectedTest(null); setTestResults([]); }}
                    style={{ marginBottom: 20, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: C.text }}
                >
                    ← Back to Assigned Tests
                </button>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 24px', marginBottom: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                        {test?.title}
                    </div>
                    <div style={{ fontSize: 13, color: C.muted }}>
                        {test?.subject_label}
                        {test?.chapter_label ? ` › ${test.chapter_label}` : ''}
                        {' '}· {test?.num_questions} questions · {test?.duration_mins} mins
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>Student Results</div>
                        <span style={{ fontSize: 12, color: C.muted }}>{testResults.length} submissions</span>
                    </div>
                    {loadingResults ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: C.muted }}>Loading results…</div>
                    ) : testResults.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>
                            <div style={{ fontSize: 32, marginBottom: 10 }}>📝</div>
                            No submissions yet. Students have not taken this test.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                                <thead>
                                    <tr style={{ background: '#F0F4FF' }}>
                                        {['#', 'Student', 'Score', 'Accuracy', 'Submitted'].map(h => (
                                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {testResults.map((r, i) => {
                                        const [bg, fg] = [
                                            ['#dbeafe','#2563eb'],
                                            ['#dcfce7','#16a34a'],
                                            ['#fef3c7','#b45309'],
                                            ['#f3e8ff','#7c3aed'],
                                            ['#ffe4e6','#be123c']
                                        ][i % 5];
                                        const accColor = r.accuracy >= 80 ? '#16a34a' 
                                            : r.accuracy >= 60 ? '#d97706' : '#dc2626';
                                        return (
                                            <tr key={r.id}
                                                style={{ borderTop: '1px solid #E2E8F0' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '12px 16px', color: C.muted, fontSize: 12 }}>{i + 1}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                                                            {r.student_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{r.student_name}</div>
                                                            <div style={{ fontSize: 11, color: C.muted }}>{r.student_email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, color: C.text }}>
                                                    {r.score}/{r.total}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ fontWeight: 700, fontSize: 14, color: accColor }}>{r.accuracy}%</span>
                                                </td>
                                                <td style={{ padding: '12px 16px', color: C.muted, fontSize: 12 }}>
                                                    {new Date(r.submitted_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: 'opacity .4s ease, transform .4s ease', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

            {msg.text && (
                <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontWeight: 600, fontSize: 13, background: msg.type === 'ok' ? '#f0fdf4' : '#fff1f2', color: msg.type === 'ok' ? '#15803d' : '#b91c1c', border: `1px solid ${msg.type === 'ok' ? '#86efac' : '#fca5a5'}` }}>
                    {msg.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20 }}>

                <div style={{ background: C.card, borderRadius: 18, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 8px 30px rgba(15,23,42,.05)' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 20 }}>
                        ➕ Create Assigned Test
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 8 }}>
                                Step 1 — Select Subject &amp; Chapters *
                        </label>

                        {errors.chapter && (
                            <div style={{ fontSize: 11, color: '#b91c1c', marginBottom: 8 }}>
                                {errors.chapter}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {SUBJECT_OPTIONS.map(sub => {
                                const isExpanded = expandedSubject === sub.id;
                                return (
                                    <div key={sub.id}>
                                        <div
                                            onClick={() => handleSubjectClick(sub.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                border: isExpanded
                                                    ? `2px solid ${sub.color}`
                                                    : '1px solid #E2E8F0',
                                                background: isExpanded ? sub.color + '12' : '#F8FAFC',
                                                transition: 'all .15s',
                                            }}
                                        >
                                            <span style={{ fontSize: 18 }}>{sub.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: isExpanded ? sub.color : C.text }}>
                                                    {sub.label}
                                                </div>
                                                <div style={{ fontSize: 11, color: C.muted }}>{sub.subtitle}</div>
                                            </div>
                                            <span style={{ fontSize: 10, color: C.muted, background: '#E2E8F0', padding: '2px 7px', borderRadius: 20 }}>
                                                {sub.chapters.length} chapters
                                            </span>
                                            <span style={{
                                                fontSize: 12,
                                                color: isExpanded ? sub.color : C.muted,
                                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                                transition: 'transform .2s',
                                                display: 'inline-block',
                                            }}>
                                                ›
                                            </span>
                                        </div>

                                        {isExpanded && (
                                            <div style={{
                                                margin: '4px 0 4px 12px',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: 10,
                                                overflow: 'hidden',
                                                background: '#FAFBFF',
                                            }}>
                                                {sub.chapters.map((ch, idx) => {
                                                    const isChSelected = selectedChapter?.chapterIds?.includes(ch.id);
                                                    return (
                                                        <div
                                                            key={ch.id}
                                                            onClick={() => handleChapterClick(sub, ch)}
                                                            style={{
                                                                padding: '9px 14px',
                                                                fontSize: 12,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                borderBottom: idx < sub.chapters.length - 1
                                                                    ? '1px solid #F0F4FF' : 'none',
                                                                background: isChSelected ? sub.color + '15' : 'transparent',
                                                                color: isChSelected ? sub.color : C.muted,
                                                                fontWeight: isChSelected ? 700 : 400,
                                                                transition: 'background .12s',
                                                            }}
                                                            onMouseEnter={e => {
                                                                if (!isChSelected) e.currentTarget.style.background = '#F0F4FF';
                                                            }}
                                                            onMouseLeave={e => {
                                                                if (!isChSelected) e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <span>📖 {ch.label}</span>
                                                            {isChSelected && (
                                                                <span style={{ fontSize: 10, fontWeight: 800, background: sub.color + '20', color: sub.color, padding: '2px 8px', borderRadius: 20, border: `1px solid ${sub.color}40` }}>
                                                                    selected ✓
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {selectedChapter && (
                        <>
                            <div style={{
                                background: selectedChapter.subjectColor + '12',
                                border: `1px solid ${selectedChapter.subjectColor}40`,
                                borderRadius: 10,
                                padding: '10px 14px',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}>
                                <span style={{ fontSize: 20 }}>{selectedChapter.subjectIcon}</span>
                                <div>
                                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 1 }}>Selected chapters</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: selectedChapter.subjectColor }}>
                                        {selectedChapter.subjectLabel} › {selectedChapter.chapterLabel}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedChapter(null)}
                                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.muted, lineHeight: 1 }}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 6 }}>
                                    Step 2 — Test Title *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Meteorology — Wind Chapter Test"
                                    value={form.title}
                                    onChange={e => setField('title', e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', border: `1px solid ${errors.title ? '#FCA5A5' : '#E2E8F0'}`, background: errors.title ? '#FFF1F2' : '#F8FAFC', color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                                />
                                {errors.title && (
                                    <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 3 }}>{errors.title}</div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 6 }}>
                                        No. of Questions *
                                    </label>
                                    <input
                                        type="number" min={5} max={100}
                                        value={form.numQuestions}
                                        onChange={e => setField('numQuestions', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', border: `1px solid ${errors.numQuestions ? '#FCA5A5' : '#E2E8F0'}`, background: '#F8FAFC', color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                                    />
                                    {errors.numQuestions && (
                                        <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 3 }}>{errors.numQuestions}</div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 6 }}>
                                        Duration (mins) *
                                    </label>
                                    <input
                                        type="number" min={5} max={180}
                                        value={form.durationMins}
                                        onChange={e => setField('durationMins', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', border: `1px solid ${errors.durationMins ? '#FCA5A5' : '#E2E8F0'}`, background: '#F8FAFC', color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                                    />
                                    {errors.durationMins && (
                                        <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 3 }}>{errors.durationMins}</div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: 18 }}>
                                <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'block', marginBottom: 6 }}>
                                    Instructions <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Any special instructions for students…"
                                    value={form.instructions}
                                    onChange={e => setField('instructions', e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', border: '1px solid #E2E8F0', background: '#F8FAFC', color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                                />
                            </div>

                            {selectedChapter && (
                                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Preview
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 2 }}>
                                        {form.title.trim() || selectedChapter.titleHint}
                                    </div>
                                    <div style={{ fontSize: 12, color: C.muted }}>
                                        {selectedChapter.subjectIcon} {selectedChapter.subjectLabel} › {selectedChapter.chapterLabel}
                                        {' '}· ❓ {form.numQuestions} questions · ⏱️ {form.durationMins} mins
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleCreate}
                                disabled={saving}
                                style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: saving ? '#94A3B8' : `linear-gradient(135deg, ${selectedChapter.subjectColor}, #7C3AED)`, color: '#fff', fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity .15s' }}
                            >
                                {saving ? '⏳ Creating…' : '📝 Assign Test to All Students'}
                            </button>
                        </>
                    )}

                    {!selectedChapter && (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13, borderTop: '1px dashed #E2E8F0', marginTop: 8 }}>
                            ☝️ Select a subject above, then pick a chapter to continue
                        </div>
                    )}
                </div>

                <div style={{ background: C.card, borderRadius: 18, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 8px 30px rgba(15,23,42,.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>📋 Assigned Tests</div>
                        <span style={{ fontSize: 12, color: C.muted, background: '#F0F4FF', padding: '3px 10px', borderRadius: 20, border: '1px solid #E2E8F0' }}>
                            {tests.length} total
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Loading…</div>
                    ) : tests.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', border: '1.5px dashed #E2E8F0', borderRadius: 14, background: '#F8FAFC' }}>
                            <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
                            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>No tests assigned yet</div>
                            <div style={{ fontSize: 12, color: C.muted }}>Create your first test using the form.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 600 }}>
                            {tests.map(test => {
                                const sub = SUBJECT_OPTIONS.find(s => s.id === test.subject_id);
                                return (
                                    <div key={test.id} style={{ background: test.is_active ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${test.is_active ? '#86EFAC' : '#E2E8F0'}`, borderRadius: 14, padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ fontSize: 16 }}>{sub?.icon || '📝'}</span>
                                                <span style={{ background: test.is_active ? '#DCFCE7' : '#F1F5F9', color: test.is_active ? '#15803D' : '#64748B', fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 20 }}>
                                                    {test.is_active ? '✓ ACTIVE' : '⏸ PAUSED'}
                                                </span>
                                                <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 20, border: '1px solid #DBEAFE' }}>
                                                    {test.subject_label}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(test.id)}
                                                disabled={deletingId === test.id}
                                                style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #FECACA', background: '#FFF1F2', color: '#B91C1C', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >✕</button>
                                        </div>

                                        <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 2 }}>
                                            {test.title}
                                        </div>

                                        {test.chapter_label && (
                                            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                                                📖 {test.chapter_label}
                                            </div>
                                        )}

                                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                                            ❓ {test.num_questions} questions · ⏱️ {test.duration_mins} mins · 📅 {new Date(test.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>

                                        {test.instructions && (
                                            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, fontStyle: 'italic' }}>
                                                "{test.instructions}"
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => handleToggle(test)}
                                                disabled={togglingId === test.id}
                                                style={{ background: test.is_active ? '#FEF3C7' : '#DCFCE7', color: test.is_active ? '#92400E' : '#15803D', border: `1px solid ${test.is_active ? '#FDE68A' : '#86EFAC'}`, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                {test.is_active ? '⏸ Pause' : '▶ Activate'}
                                            </button>
                                            <button
                                                onClick={() => { setSelectedTest(test.id); fetchTestResults(test.id); }}
                                                style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                📊 View Results
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TEACHER PAGE  (default export)
// ═══════════════════════════════════════════════════════════════════════════════
export default function TeacherPage() {
    const router = useRouter();
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [summary, setSummary] = useState({ totalStudents: 0, totalTests: 0, avgAccuracy: 0 });
    const [activeTab, setActiveTab] = useState('students');
    const [attSubTab, setAttSubTab] = useState('mark');
    const [authCardVisible, setAuthCardVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setAuthCardVisible(true), 50);
        if (typeof window === 'undefined') return;
        if (localStorage.getItem(TEACHER_AUTH_KEY) === 'yes') { setAuthed(true); loadData(); }
    }, []);

    async function loadData() {
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/teacher/students');
            if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || `Failed to fetch teacher data (${res.status})`); }
            const data = await res.json();
            setStudents(data.students); setSummary(data.summary);
            if (data.students.length > 0) setSelectedEmail(data.students[0].email);
        } catch (err) { setError(err.message || 'Unable to load teacher dashboard data.'); }
        finally { setLoading(false); }
    }

    function handleStudentsChange(updatedStudents) {
        setStudents(updatedStudents);
        setSummary(prev => ({ ...prev, totalStudents: updatedStudents.length }));
        if (updatedStudents.length > 0 && !updatedStudents.find(s => s.email === selectedEmail)) setSelectedEmail(updatedStudents[0].email);
    }

    function handleLogin() {
        if (password.trim() === TEACHER_PASSWORD) { localStorage.setItem(TEACHER_AUTH_KEY, 'yes'); setAuthed(true); loadData(); }
        else setError('Teacher password is incorrect.');
    }
    function handleLogout() { localStorage.removeItem(TEACHER_AUTH_KEY); router.push('/'); }

    const selectedStudent = students.find(s => s.email === selectedEmail);
    const selectedStudentChapterStats = selectedStudent ? selectedStudent.results.reduce((acc, result) => {
        const chapter = result.chapterId;
        if (!chapter) return acc;
        const answers = Array.isArray(result.answers) ? result.answers : [];
        if (!acc[chapter]) acc[chapter] = { correct: 0, total: 0 };
        acc[chapter].total += answers.length;
        acc[chapter].correct += answers.filter(a => a.isCorrect).length;
        return acc;
    }, {}) : {};
    const chapterStatus = selectedStudent ? Object.entries(selectedStudentChapterStats).map(([chapterId, stats]) => ({
        chapterId, title: getChapterTitle(chapterId), accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    })) : [];
    const clearTopics = chapterStatus.filter(c => c.accuracy >= 80);
    const weakTopics = chapterStatus.filter(c => c.accuracy < 60);
    const wrongQuestions = selectedStudent ? selectedStudent.results.flatMap(result => {
        const chapterTitle = result.title || result.subjectLabel || getChapterTitle(result.chapterId) || 'Class Test';
        return (Array.isArray(result.answers) ? result.answers : []).filter(a => !a.isCorrect).map(a => {
            const question = result.chapterId ? getQuestionData(result.chapterId, a.questionId) : null;
            return {
                chapterTitle,
                question: question?.question || `Question ${a.questionId}`,
                selected: question?.options?.[a.selected] || `Option ${a.selected + 1}`,
                correct: question?.options?.[a.correct] || `Option ${a.correct + 1}`,
                date: result.date,
            };
        });
    }) : [];

    // ── Login screen ──
    if (!authed) {
        return (
            <div className="teacher-auth-page">
                <div className={`teacher-auth-card${authCardVisible ? ' auth-card-in' : ''}`}>
                    <div className="auth-lock-icon">👩‍🏫</div>
                    <h1>Teacher Dashboard</h1>
                    <p>Enter the teacher password to view all student data.</p>
                    <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Teacher password" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    {error && <div className="teacher-error error-shake">{error}</div>}
                    <button className="btn-ripple" onClick={handleLogin}>Unlock Dashboard</button>
                    <button className="teacher-back" onClick={() => router.push('/')}>← Back to App</button>
                </div>
                <style jsx>{`
          .teacher-auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#e0f2fe,#f8fafc);color:#0f172a;font-family:'Segoe UI',system-ui,sans-serif;padding:1rem}
          .teacher-auth-card{width:100%;max-width:420px;background:#fff;border:1px solid #dbeafe;border-radius:24px;padding:2rem;text-align:center;box-shadow:0 30px 80px rgba(15,23,42,.08);opacity:0;transform:translateY(28px) scale(.97);transition:opacity .5s cubic-bezier(0.16,1,0.3,1),transform .5s cubic-bezier(0.16,1,0.3,1)}
          .auth-card-in{opacity:1!important;transform:none!important}
          .auth-lock-icon{font-size:2.5rem;margin-bottom:.75rem;display:block;animation:iconBounce .6s .4s cubic-bezier(0.34,1.56,.64,1) both}
          @keyframes iconBounce{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
          .teacher-auth-card h1{margin-bottom:.5rem;font-size:1.9rem;color:#0f172a}.teacher-auth-card p{margin-bottom:1.5rem;color:#475569}
          .teacher-auth-card input{width:100%;padding:.95rem 1rem;border-radius:14px;border:1px solid #dbeafe;background:#f8fafc;color:#0f172a;margin-bottom:1rem;outline:none;box-sizing:border-box;transition:border-color .2s,box-shadow .2s}
          .teacher-auth-card input:focus{border-color:#2563eb;box-shadow:0 0 0 4px rgba(59,130,246,.15)}
          .teacher-auth-card button{width:100%;padding:.95rem 1rem;border:none;border-radius:14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-weight:700;cursor:pointer;margin-bottom:.75rem;transition:opacity .2s,transform .15s}
          .teacher-auth-card button:hover{opacity:.9;transform:translateY(-1px)}.teacher-auth-card button:active{transform:translateY(0)}
          .teacher-back{background:transparent!important;border:1px solid #dbeafe!important;color:#475569!important}
          .teacher-error{color:#ef4444;margin-bottom:1rem;font-size:.95rem}
          .error-shake{animation:shake .4s cubic-bezier(.36,.07,.19,.97)}
          @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
          .btn-ripple{position:relative;overflow:hidden}.btn-ripple::after{content:'';position:absolute;inset:0;background:radial-gradient(circle,rgba(255,255,255,.35) 0%,transparent 70%);opacity:0;transition:opacity .3s}.btn-ripple:active::after{opacity:1}
        `}</style>
            </div>
        );
    }

    // ── Main dashboard ──
    const NAV_TABS = [
    { id: 'students', label: '📊 Students' },
    { id: 'allresults', label: '📝 All Results' },
    { id: 'attendance', label: '✅ Attendance' },
    { id: 'schedule', label: '📅 Schedule Meeting' },
    { id: 'assigntest', label: '🎯 Assign Test' }, // 👈 NEW
    { id: 'manage', label: '👥 Manage Students' },
    { id: 'leaderboard', label: '🏆 Leaderboard' },
];

    return (
        <div className="teacher-page">
            <nav className="teacher-nav">
                <div className="teacher-nav-brand">👩‍🏫 Teacher Dashboard</div>
                <div className="teacher-nav-actions">
                    {NAV_TABS.map(({ id, label }) => (
                        <button key={id} className={`teacher-nav-btn${activeTab === id ? ' teacher-nav-btn-active' : ''}`} onClick={() => setActiveTab(id)}>{label}</button>
                    ))}
                    <button className="teacher-nav-btn" onClick={() => router.push('/')}>Home</button>
                    <button className="teacher-nav-btn logout" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="teacher-content">

                {/* ── STUDENTS TAB ── */}
                {activeTab === 'students' && (
                    <div className="tab-content tab-content-in">
                        <header className="teacher-hero hero-slide-in">
                            <div><h1>All Students &amp; Test Performance</h1><p>Live data from Supabase for every student, including performance scores, results, and joined date.</p></div>
                            <div className="teacher-summary">
                                <div className="stat-card-pop" style={{ animationDelay: '0ms' }}><span><AnimatedCounter value={summary.totalStudents} /></span><small>Students</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '80ms' }}><span><AnimatedCounter value={summary.totalTests} /></span><small>Total Tests</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '160ms' }}><span><AnimatedCounter value={summary.avgAccuracy} suffix="%" /></span><small>Avg Accuracy</small></div>
                            </div>
                        </header>

                        {loading ? <div className="teacher-loading"><span className="loading-dots"><span /><span /><span /></span>Loading student data from the database...</div>
                            : error ? <div className="teacher-error-card">{error}</div>
                                : (
                                    <div className="teacher-grid">
                                        <section className="teacher-panel teacher-list-panel panel-slide-up">
                                            <div className="panel-header"><h2>Students</h2><span>{students.length} records</span></div>
                                            <div className="teacher-table-wrap">
                                                <table>
                                                    <thead><tr><th>Name</th><th>Email</th><th>Tests</th><th>Avg</th><th>Best</th><th></th></tr></thead>
                                                    <tbody>{students.map((student, i) => (
                                                        <tr key={student.email} className={`table-row-anim${selectedEmail === student.email ? ' selected' : ''}`} style={{ animationDelay: `${i * 40}ms`, cursor: 'pointer' }} onClick={() => setSelectedEmail(student.email)}>
                                                            <td>{student.name}</td><td>{student.email}</td><td>{student.testsAttempted}</td>
                                                            <td style={{ color: getScoreColor(student.avgScore) }}>{student.avgScore}%</td>
                                                            <td style={{ color: getScoreColor(student.bestScore) }}>{student.bestScore}%</td>
                                                            <td><button type="button">View</button></td>
                                                        </tr>
                                                    ))}</tbody>
                                                </table>
                                            </div>
                                        </section>

                                        <section className="teacher-panel teacher-detail-panel panel-slide-up" style={{ animationDelay: '80ms' }}>
                                            <div className="panel-header"><h2>Student Details</h2><span>{selectedStudent ? selectedStudent.email : 'Select a student'}</span></div>
                                            {selectedStudent ? (
                                                <div className="student-detail-card detail-fade-in" key={selectedEmail}>
                                                    <div className="student-info-row"><div><strong>Name</strong><span>{selectedStudent.name}</span></div><div><strong>Phone</strong><span>+91 {selectedStudent.phone}</span></div></div>
                                                    <div className="student-info-row"><div><strong>Joined</strong><span>{formatDate(selectedStudent.joinedAt)}</span></div><div><strong>Total Questions</strong><span>{selectedStudent.totalQuestions}</span></div></div>
                                                    <div className="student-metrics"><div><strong>Tests</strong><span>{selectedStudent.testsAttempted}</span></div><div><strong>Avg Score</strong><span style={{ color: getScoreColor(selectedStudent.avgScore) }}>{selectedStudent.avgScore}%</span></div><div><strong>Best Score</strong><span style={{ color: getScoreColor(selectedStudent.bestScore) }}>{selectedStudent.bestScore}%</span></div></div>
                                                    <div className="student-insights">
                                                        <div className="insight-block"><h3>Clear Topics</h3>{clearTopics.length === 0 ? <div className="empty-state">No strong topics yet.</div> : <div className="topic-grid">{clearTopics.map((t, i) => <div key={t.chapterId} className="topic-chip clear chip-in" style={{ animationDelay: `${i * 50}ms` }}>{t.title}: {t.accuracy}%</div>)}</div>}</div>
                                                        <div className="insight-block"><h3>Topics to Review</h3>{weakTopics.length === 0 ? <div className="empty-state">No weak topics yet.</div> : <div className="topic-grid">{weakTopics.map((t, i) => <div key={t.chapterId} className="topic-chip weak chip-in" style={{ animationDelay: `${i * 50}ms` }}>{t.title}: {t.accuracy}%</div>)}</div>}</div>
                                                    </div>
                                                    <div className="results-section"><h3>All Exam Results ({selectedStudent.results.length} total)</h3><div className="results-list">{selectedStudent.results.length === 0 ? <div className="empty-state">No results found for this student.</div> : selectedStudent.results.sort((a, b) => new Date(b.date) - new Date(a.date)).map((result, i) => <div key={result.id} className="result-row result-row-anim result-row-detail" style={{ animationDelay: `${i * 30}ms` }}><div className="result-content"><div><strong style={{ fontSize: '.98rem' }}>{getChapterTitle(result.chapterId)}</strong><span style={{ fontSize: '.8rem' }}>{formatDateTime(result.date)}</span></div><div style={{ fontSize: '.82rem', color: '#64748b', marginTop: '.4rem' }}>Answered {(result.answers || []).length} questions</div></div><div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}><div style={{ background: '#eff6ff', padding: '.5rem 1rem', borderRadius: '12px' }}><div style={{ color: getScoreColor(result.pct), fontWeight: 800, fontSize: '1.1rem' }}>{result.pct}%</div><div style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 600 }}>{result.score}/{result.total}</div></div><div style={{ textAlign: 'center', fontSize: '.8rem', color: '#64748b' }}><div style={{ fontSize: '.75rem' }}>{(result.answers || []).filter(a => a.isCorrect).length} correct</div><div style={{ fontSize: '.75rem' }}>{(result.answers || []).filter(a => !a.isCorrect).length} wrong</div></div></div></div>)}</div></div>
                                                    <div className="wrong-questions-section"><h3>Recent Wrong Questions</h3>{wrongQuestions.length === 0 ? <div className="empty-state">No wrong answers recorded yet.</div> : <div className="wrong-list">{wrongQuestions.slice(0, 6).map((item, index) => <div key={`${item.question}-${index}`} className="wrong-row wrong-row-anim" style={{ animationDelay: `${index * 55}ms` }}><div><strong>{item.chapterTitle}</strong><p>{item.question}</p></div><div className="wrong-meta"><span className="wrong-label">Selected: {item.selected}</span><span className="correct-label">Correct: {item.correct}</span></div></div>)}</div>}</div>
                                                </div>
                                            ) : <div className="empty-state empty-state-in">Select a student to review their performance details.</div>}
                                        </section>
                                    </div>
                                )}
                    </div>
                )}

                {/* ── ALL RESULTS TAB ── */}
                {activeTab === 'allresults' && (
                    <div className="tab-content tab-content-in">
                        <header className="teacher-hero hero-slide-in">
                            <div><h1>📝 All Exam Results</h1><p>Complete record of every test result from every student. Filter by student or subject, and sort by date or score.</p></div>
                            <div className="teacher-summary">
                                <div className="stat-card-pop"><span><AnimatedCounter value={students.flatMap(s => s.results || []).length} /></span><small>Total Results</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '80ms' }}><span><AnimatedCounter value={students.length} /></span><small>Students</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '160ms' }}><span><AnimatedCounter value={students.length ? Math.round(students.flatMap(s => s.results || []).reduce((sum, r) => sum + (r.pct || 0), 0) / (students.flatMap(s => s.results || []).length || 1)) : 0} suffix="%" /></span><small>Avg Accuracy</small></div>
                            </div>
                        </header>
                        {loading ? <div className="teacher-loading"><span className="loading-dots"><span /><span /><span /></span>Loading all results…</div>
                            : error ? <div className="teacher-error-card">{error}</div>
                                : <AllResultsTab students={students} />}
                    </div>
                )}

                {/* ── ATTENDANCE TAB ── */}
                {activeTab === 'attendance' && (
                    <div className="tab-content tab-content-in">
                        <header className="teacher-hero hero-slide-in">
                            <div><h1>Attendance Management</h1><p>Mark daily attendance, view monthly reports, and track individual student records.</p></div>
                            <div className="teacher-summary">
                                <div className="stat-card-pop"><span><AnimatedCounter value={summary.totalStudents} /></span><small>Students</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '80ms' }}><span style={{ color: '#16a34a' }}>—</span><small>Present Today</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '160ms' }}><span style={{ color: '#ef4444' }}>—</span><small>Absent Today</small></div>
                            </div>
                        </header>
                        <div className="att-tabs">
                            {[['mark', 'Mark Attendance'], ['report', 'Monthly Report'], ['student', 'Student Records']].map(([id, label]) => (
                                <button key={id} className={`att-tab${attSubTab === id ? ' att-tab-active' : ''}`} onClick={() => setAttSubTab(id)}>{label}</button>
                            ))}
                        </div>
                        {loading ? <div className="teacher-loading"><span className="loading-dots"><span /><span /><span /></span>Loading student data…</div>
                            : error ? <div className="teacher-error-card">{error}</div>
                                : <>{attSubTab === 'mark' && <AttMarkTab students={students} />}{attSubTab === 'report' && <AttReportTab students={students} />}{attSubTab === 'student' && <AttStudentTab students={students} />}</>}
                    </div>
                )}

                {/* ── SCHEDULE MEETING TAB ── */}
                {activeTab === 'schedule' && (
                    <div className="tab-content tab-content-in">
                        <header className="teacher-hero hero-slide-in">
                            <div><h1>📅 Schedule Live Classes</h1><p>Paste a link to go live instantly, or create a Google Meet session for a future class. Students see the Join button the moment you go live.</p></div>
                            <div className="teacher-summary">
                                <div className="stat-card-pop"><span>⚡</span><small>Instant Live Link</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '80ms' }}><span>📅</span><small>Google Calendar</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '160ms' }}><span>🎥</span><small>Google Meet</small></div>
                            </div>
                        </header>
                        <ScheduleMeetingTab />
                    </div>
                )}

                {/* ── ASSIGN TEST TAB ── */}
                {activeTab === 'assigntest' && (
                    <div className="tab-content tab-content-in">
                        <AssignTestTab />
                    </div>
                )}

                {/* ── MANAGE STUDENTS TAB ── */}
                {activeTab === 'manage' && (
                    <div className="tab-content tab-content-in">
                        <header className="teacher-hero hero-slide-in">
                            <div><h1>Manage Students</h1><p>Add new students when a batch starts, or remove students who have left.</p></div>
                            <div className="teacher-summary">
                                <div className="stat-card-pop"><span><AnimatedCounter value={students.length} /></span><small>Total Enrolled</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '80ms' }}><span><AnimatedCounter value={students.filter(s => (s.batch || 'Batch A — Morning') === 'Batch A — Morning').length} /></span><small>Morning Batch</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '160ms' }}><span><AnimatedCounter value={students.filter(s => s.batch === 'Batch B — Evening' || s.batch === 'Batch C — Weekend').length} /></span><small>Other Batches</small></div>
                            </div>
                        </header>
                        {loading ? <div className="teacher-loading"><span className="loading-dots"><span /><span /><span /></span>Loading student data…</div>
                            : error ? <div className="teacher-error-card">{error}</div>
                                : <ManageStudentsTab students={students} onStudentsChange={handleStudentsChange} />}
                    </div>
                )}

                {/* ── LEADERBOARD TAB ── */}
                {activeTab === 'leaderboard' && (
                    <div className="tab-content tab-content-in">
                        <header className="teacher-hero hero-slide-in">
                            <div>
                                <h1>🏆 Mock Test Leaderboard</h1>
                                <p>Live rankings for all students across every mock test subject. Filter by subject and search by name. Ranked by best accuracy.</p>
                            </div>
                            <div className="teacher-summary">
                                <div className="stat-card-pop"><span>🏆</span><small>Live Rankings</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '80ms' }}><span>🎯</span><small>By Subject</small></div>
                                <div className="stat-card-pop" style={{ animationDelay: '160ms' }}><span>📊</span><small>Best Accuracy</small></div>
                            </div>
                        </header>
                        <div className="teacher-panel panel-slide-up">
                            <TeacherLeaderboardTab />
                        </div>w
                    </div>
                )}

            </div>

            <style jsx>{`
        .teacher-page{min-height:100vh;background:linear-gradient(180deg,#eff6ff 0%,#f8fbff 100%);color:#0f172a;font-family:'Segoe UI',system-ui,sans-serif}
        .teacher-nav{display:flex;align-items:center;justify-content:space-between;padding:1.15rem 1.5rem;border-bottom:1px solid #dbeafe;background:rgba(255,255,255,.85);backdrop-filter:blur(12px);position:sticky;top:0;z-index:20;box-shadow:0 10px 30px rgba(15,23,42,.05);flex-wrap:wrap;gap:.5rem}
        .teacher-nav-brand{font-weight:700;letter-spacing:.02em;color:#0f172a}
        .teacher-nav-actions{display:flex;gap:.5rem;flex-wrap:wrap}
        .teacher-nav-btn{border:1px solid #dbeafe;background:#eff6ff;color:#2563eb;border-radius:10px;padding:.6rem 1rem;cursor:pointer;font-size:.85rem;font-weight:600;transition:all .2s cubic-bezier(0.16,1,0.3,1)}
        .teacher-nav-btn:hover{background:#dbeafe;transform:translateY(-1px);box-shadow:0 4px 12px rgba(37,99,235,.15)}
        .teacher-nav-btn-active{background:linear-gradient(135deg,#2563eb,#1d4ed8)!important;color:#fff!important;border-color:#2563eb!important;box-shadow:0 4px 12px rgba(37,99,235,.3)}
        .teacher-nav-btn.logout{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;border-color:#ef4444}
        .teacher-nav-btn.logout:hover{box-shadow:0 4px 12px rgba(239,68,68,.3)}
        .teacher-content{max-width:1280px;margin:0 auto;padding:1.5rem}
        .tab-content{opacity:0;transform:translateY(14px);transition:opacity .35s cubic-bezier(0.16,1,0.3,1),transform .35s cubic-bezier(0.16,1,0.3,1)}
        .tab-content-in{opacity:1;transform:none}
        .teacher-hero{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;align-items:flex-start;margin-bottom:1.75rem}
        .hero-slide-in{animation:heroSlide .5s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes heroSlide{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}
        .teacher-hero h1{font-size:clamp(1.6rem,2.8vw,2.6rem);margin-bottom:.6rem;line-height:1.05;color:#0f172a}
        .teacher-hero p{max-width:680px;color:#475569;font-size:1rem}
        .teacher-summary{display:grid;grid-template-columns:repeat(3,minmax(110px,1fr));gap:1rem;align-items:stretch}
        .teacher-summary div{background:#fff;border:1px solid #dbeafe;border-radius:18px;padding:1.25rem 1.35rem;text-align:center;box-shadow:0 18px 40px rgba(15,23,42,.05);transition:transform .2s,box-shadow .2s}
        .teacher-summary div:hover{transform:translateY(-3px);box-shadow:0 24px 50px rgba(15,23,42,.1)}
        .teacher-summary span{display:block;font-size:2rem;font-weight:800;margin-bottom:.35rem;color:#0f172a}
        .teacher-summary small{color:#64748b}
        .stat-card-pop{animation:statPop .5s cubic-bezier(0.34,1.56,.64,1) both}
        @keyframes statPop{from{opacity:0;transform:scale(.85) translateY(10px)}to{opacity:1;transform:none}}
        .teacher-loading,.teacher-error-card{padding:2rem 1.5rem;background:#fff;border:1px solid #dbeafe;border-radius:18px;text-align:center;box-shadow:0 18px 40px rgba(15,23,42,.05);display:flex;align-items:center;justify-content:center;gap:.75rem}
        .teacher-error-card{color:#ef4444}
        .loading-dots{display:inline-flex;gap:4px}
        .loading-dots span{width:7px;height:7px;border-radius:50%;background:#2563eb;animation:dotBounce 1.2s infinite ease-in-out}
        .loading-dots span:nth-child(1){animation-delay:0s}.loading-dots span:nth-child(2){animation-delay:.2s}.loading-dots span:nth-child(3){animation-delay:.4s}
        @keyframes dotBounce{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
        .teacher-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:1.5rem}
        .teacher-panel{background:#fff;border:1px solid #dbeafe;border-radius:20px;padding:1.5rem;box-shadow:0 18px 40px rgba(15,23,42,.05)}
        .panel-slide-up{animation:panelUp .4s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes panelUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
        .panel-header h2{margin:0;font-size:1.05rem;color:#0f172a}.panel-header span{color:#64748b;font-size:.9rem}
        .teacher-table-wrap{overflow-x:auto}
        table{width:100%;border-collapse:collapse;min-width:500px}
        th,td{padding:.95rem .85rem;text-align:left;border-bottom:1px solid #e2e8f0}
        th{color:#64748b;font-size:.84rem;text-transform:uppercase;letter-spacing:.04em}
        td button{padding:.5rem .9rem;border-radius:10px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;transition:background .2s,transform .15s}
        td button:hover{background:#dbeafe;transform:scale(1.05)}
        tr{transition:background .15s}
        tr:hover td{background:#f8fafc}
        tr.selected td{background:#dbeafe}
        .table-row-anim{animation:rowSlide .35s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes rowSlide{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
        .student-detail-card{display:grid;gap:1rem}
        .detail-fade-in{animation:detailIn .4s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes detailIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .student-info-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .student-info-row div{background:#f8fafc;border:1px solid #dbeafe;border-radius:16px;padding:1rem;transition:box-shadow .2s}
        .student-info-row div:hover{box-shadow:0 8px 20px rgba(15,23,42,.06)}
        .student-info-row strong{display:block;color:#64748b;margin-bottom:.5rem;font-size:.82rem}
        .student-info-row span{font-size:1rem;font-weight:700;color:#0f172a}
        .student-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}
        .student-metrics div{background:#f8fafc;border:1px solid #dbeafe;border-radius:16px;padding:1rem;text-align:center;transition:transform .2s,box-shadow .2s}
        .student-metrics div:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(15,23,42,.07)}
        .student-metrics strong{display:block;color:#64748b;font-size:.82rem;margin-bottom:.5rem}
        .student-insights{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .insight-block{background:#fff;border:1px solid #dbeafe;border-radius:18px;padding:1rem}
        .insight-block h3{margin:0 0 .75rem;font-size:1rem;color:#0f172a}
        .topic-grid{display:grid;gap:.75rem}
        .topic-chip{padding:.75rem 1rem;border-radius:14px;background:#eff6ff;color:#2563eb;font-size:.9rem;transition:transform .2s}
        .topic-chip:hover{transform:translateX(3px)}
        .topic-chip.clear{border:1px solid #a7f3d0}.topic-chip.weak{border:1px solid #fecaca}
        .chip-in{animation:chipIn .35s cubic-bezier(0.34,1.56,.64,1) both}
        @keyframes chipIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
        .results-section h3{margin:0 0 .75rem;font-size:1rem;color:#0f172a}
        .results-list{display:grid;gap:.75rem}
        .result-row{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.95rem 1rem;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;transition:transform .2s,box-shadow .2s}
        .result-row:hover{transform:translateX(4px);box-shadow:0 4px 16px rgba(15,23,42,.07)}
        .result-row-anim{animation:resultIn .35s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes resultIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        .result-row strong{display:block;font-size:.95rem;color:#0f172a}.result-row span{color:#64748b;font-size:.85rem}
            .result-row-detail{display:flex;justify-content:space-between;align-items:center;gap:1.25rem;padding:1.15rem 1.25rem}
            .result-content{flex:1}.result-content>div:first-child{display:flex;flex-direction:column;gap:.2rem}
            .result-content strong{display:block;font-size:.98rem;color:#0f172a}.result-content span{font-size:.8rem;color:#64748b}
        .wrong-questions-section{margin-top:1rem}
        .wrong-questions-section h3{margin:0 0 .75rem;font-size:1rem;color:#0f172a}
        .wrong-list{display:grid;gap:.75rem}
        .wrong-row{background:#fff;border:1px solid #dbeafe;border-radius:16px;padding:1rem;display:grid;gap:.5rem;transition:transform .2s,box-shadow .2s}
        .wrong-row:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(15,23,42,.08)}
        .wrong-row-anim{animation:wrongIn .4s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes wrongIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .wrong-row p{margin:.25rem 0 0;color:#475569;font-size:.95rem;line-height:1.4}
        .wrong-meta{display:flex;flex-wrap:wrap;gap:.75rem}
        .wrong-label{font-size:.85rem;color:#ef4444}.correct-label{font-size:.85rem;color:#16a34a}
        .empty-state{padding:1.5rem;border-radius:16px;border:1px dashed #93c5fd;color:#64748b;text-align:center;background:#eff6ff}
        .empty-state-in{animation:fadeIn .3s ease both}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .att-tabs{display:flex;gap:.5rem;margin-bottom:1.25rem;background:#e2e8f0;border-radius:14px;padding:4px}
        .att-tab{flex:1;text-align:center;padding:.55rem .5rem;border-radius:10px;border:none;background:transparent;cursor:pointer;font-size:.85rem;font-weight:600;color:#64748b;transition:all .25s cubic-bezier(0.16,1,0.3,1)}
        .att-tab:hover{color:#2563eb}
        .att-tab-active{background:#fff;color:#2563eb;border:1px solid #dbeafe;box-shadow:0 2px 8px rgba(15,23,42,.08)}
        .att-controls{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;margin-bottom:1.25rem}
        .att-controls select,.att-controls input[type="date"]{border:1px solid #dbeafe;background:#fff;color:#0f172a;border-radius:12px;padding:.65rem 1rem;font-size:.9rem;outline:none;cursor:pointer;transition:border-color .2s,box-shadow .2s}
        .att-controls select:focus,.att-controls input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
        .att-tag{display:inline-block;padding:.25rem .65rem;border-radius:8px;font-size:.78rem;font-weight:600}
        .att-tag-present{background:#dcfce7;color:#15803d}.att-tag-absent{background:#fee2e2;color:#b91c1c}.att-tag-late{background:#fef3c7;color:#b45309}
        .pct-bar-bg{background:#e2e8f0;border-radius:99px;height:6px;flex:1;overflow:hidden}
        .pct-bar{height:6px;border-radius:99px;width:0}
        .pct-bar-anim{animation:barGrow .7s cubic-bezier(0.16,1,0.3,1) forwards;animation-delay:.2s}
        @keyframes barGrow{from{width:0}to{width:var(--pct)}}
        .att-avatar{width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;transition:transform .2s}
        .att-avatar:hover{transform:scale(1.1)}
        .avatar-pop{animation:avatarPop .35s cubic-bezier(0.34,1.56,.64,1) both}
        @keyframes avatarPop{from{transform:scale(0)}to{transform:scale(1)}}
        .save-msg{padding:.75rem 1rem;border-radius:12px;font-size:.9rem;font-weight:600;margin-bottom:1rem}
        .msg-slide-in{animation:msgSlide .35s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes msgSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        .save-msg-ok{background:#dcfce7;color:#15803d;border:1px solid #86efac}
        .save-msg-err{background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5}
        .month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
        .day-label{text-align:center;font-size:.7rem;color:#64748b;font-weight:600;padding:2px}
        .day-cell{aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:600;transition:transform .15s}
        .day-cell:hover{transform:scale(1.15);z-index:1}
        .day-cell-pop{animation:dayPop .3s cubic-bezier(0.34,1.56,.64,1) both}
        @keyframes dayPop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
        .day-p{background:#dcfce7;color:#15803d}.day-a{background:#fee2e2;color:#b91c1c}.day-l{background:#fef3c7;color:#b45309}.day-x{background:#f1f5f9;color:#cbd5e1}.day-h{background:#e0e7ff;color:#6366f1}
        .legend{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:.75rem}
        .legend-item{display:flex;align-items:center;gap:5px;font-size:.75rem;color:#64748b}
        .legend-dot{width:10px;height:10px;border-radius:3px}
        .manage-topbar{display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;flex-wrap:wrap}
        .manage-search-wrap{position:relative;flex:1;min-width:220px}
        .manage-search-icon{position:absolute;left:.85rem;top:50%;transform:translateY(-50%);font-size:.85rem;pointer-events:none}
        .manage-search{width:100%;padding:.7rem 2.5rem;border:1px solid #dbeafe;border-radius:12px;background:#fff;color:#0f172a;font-size:.9rem;outline:none;box-sizing:border-box;transition:border-color .2s,box-shadow .2s}
        .manage-search:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
        .manage-search-clear{position:absolute;right:.85rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;color:#94a3b8;line-height:1;transition:color .2s,transform .2s}
        .manage-search-clear:hover{color:#475569;transform:translateY(-50%) scale(1.2)}
        .manage-add-btn{padding:.7rem 1.4rem;border:none;border-radius:12px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-weight:700;font-size:.9rem;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .2s cubic-bezier(0.16,1,0.3,1);box-shadow:0 4px 12px rgba(37,99,235,.25)}
        .manage-add-btn:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(37,99,235,.35)}
        .remove-btn{padding:.45rem .9rem;border-radius:10px;border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;cursor:pointer;font-size:.8rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;transition:all .2s}
        .remove-btn:hover{background:#fee2e2;transform:scale(1.05)}.remove-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .batch-chip{display:inline-block;padding:.25rem .65rem;border-radius:8px;font-size:.75rem;font-weight:600;background:#eff6ff;color:#2563eb;border:1px solid #dbeafe}
        .batch-summary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.25rem}
        .batch-card{background:#fff;border:2px solid;border-radius:20px;padding:1.25rem 1.5rem;text-align:center;box-shadow:0 18px 40px rgba(15,23,42,.05);animation:panelUp .4s cubic-bezier(0.16,1,0.3,1) both}
        .batch-card-hover{transition:transform .2s,box-shadow .2s}.batch-card-hover:hover{transform:translateY(-4px);box-shadow:0 28px 56px rgba(15,23,42,.1)}
        .batch-card-count{font-size:2.25rem;font-weight:800;margin-bottom:.35rem}.batch-card-label{font-size:.85rem;color:#64748b;font-weight:500}
        .btn-spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        .btn-spinner-sm{width:11px;height:11px;border-color:rgba(185,28,28,.3);border-top-color:#b91c1c}
        @keyframes spin{to{transform:rotate(360deg)}}
        .btn-ripple{position:relative;overflow:hidden}.btn-ripple::after{content:'';position:absolute;inset:0;background:radial-gradient(circle,rgba(255,255,255,.3) 0%,transparent 70%);opacity:0;transition:opacity .3s}.btn-ripple:active::after{opacity:1}
        .modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(6px)}
        .modal-backdrop-in{animation:backdropIn .25s ease both}
        @keyframes backdropIn{from{opacity:0}to{opacity:1}}
        .modal-card{background:#fff;border-radius:24px;width:100%;max-width:480px;box-shadow:0 40px 100px rgba(15,23,42,.18);border:1px solid #dbeafe;overflow:hidden}
        .modal-card-in{animation:modalIn .35s cubic-bezier(0.34,1.56,.64,1) both}
        @keyframes modalIn{from{opacity:0;transform:scale(.88) translateY(16px)}to{opacity:1;transform:none}}
        .modal-card-sm{max-width:400px}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #e2e8f0}
        .modal-header h2{margin:0;font-size:1.1rem;color:#0f172a}
        .modal-close{background:#f1f5f9;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;color:#64748b;display:flex;align-items:center;justify-content:center;transition:background .2s,transform .2s}
        .modal-close:hover{background:#e2e8f0;transform:rotate(90deg)}
        .modal-body{padding:1.5rem;display:grid;gap:1rem}
        .modal-footer{padding:1rem 1.5rem;border-top:1px solid #e2e8f0;display:flex;gap:.75rem;justify-content:flex-end}
        .form-group{display:grid;gap:.4rem;animation:formGroupIn .3s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes formGroupIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .form-group label{font-size:.85rem;font-weight:600;color:#374151}
        .form-group input,.form-group select{padding:.75rem 1rem;border:1px solid #dbeafe;border-radius:12px;background:#f8fafc;color:#0f172a;font-size:.9rem;outline:none;width:100%;box-sizing:border-box;transition:border-color .2s,box-shadow .2s,background .2s}
        .form-group input:focus,.form-group select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(59,130,246,.15);background:#fff}
        .form-group input.input-err{border-color:#fca5a5;background:#fff1f2}
        .field-err{font-size:.78rem;color:#b91c1c}
        .field-err-in{animation:msgSlide .25s ease both}
        .modal-cancel-btn{padding:.7rem 1.25rem;border:1px solid #dbeafe;border-radius:12px;background:#f8fafc;color:#64748b;font-weight:600;cursor:pointer;font-size:.9rem;transition:background .2s}
        .modal-cancel-btn:hover{background:#e2e8f0}
        .modal-save-btn{padding:.7rem 1.4rem;border:none;border-radius:12px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-weight:700;cursor:pointer;font-size:.9rem;display:inline-flex;align-items:center;gap:6px;transition:all .2s}
        .modal-save-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(37,99,235,.3)}.modal-save-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .modal-remove-btn{padding:.7rem 1.4rem;border:none;border-radius:12px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;font-weight:700;cursor:pointer;font-size:.9rem;display:inline-flex;align-items:center;gap:6px;transition:all .2s}
        .modal-remove-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(239,68,68,.3)}.modal-remove-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .remove-confirm-body{text-align:center;padding:.5rem 0}
        .remove-icon{font-size:2.5rem;margin-bottom:.75rem}
        .shake-icon{animation:shakeIcon .6s .15s cubic-bezier(.36,.07,.19,.97) both}
        @keyframes shakeIcon{0%,100%{transform:rotate(0)}20%{transform:rotate(-12deg)}40%{transform:rotate(10deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(6deg)}}
        .remove-confirm-body p{margin:0 0 .5rem;color:#0f172a}
        .remove-warning{font-size:.85rem;color:#64748b;line-height:1.5}
        @media(max-width:980px){.teacher-grid{grid-template-columns:1fr}.student-info-row{grid-template-columns:1fr}.student-metrics{grid-template-columns:1fr}.teacher-summary{grid-template-columns:repeat(3,1fr)}.batch-summary-row{grid-template-columns:1fr}}
        @media(max-width:600px){.teacher-summary{grid-template-columns:1fr}.batch-summary-row{grid-template-columns:1fr}}
      `}</style>
        </div>
    );
}