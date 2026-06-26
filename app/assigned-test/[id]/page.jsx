'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/storage';
import { questions as allQuestions } from '../../../data/questions';

function shuffleArray(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

export default function AssignedTestPage({ params }) {
    const { id } = params;
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [screen, setScreen] = useState('loading');
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [saving, setSaving] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('idle');
    const timerRef = useRef(null);
    const testActiveRef = useRef(false);

    useEffect(() => {
        const u = getUser();
        if (!u) { router.replace('/login'); return; }
        setUser(u);
    }, [router]);

    useEffect(() => {
        if (!id) return;
        fetch('/api/assigned-tests')
            .then(r => r.json())
            .then(data => {
                if (!data.success) { router.replace('/dashboard'); return; }
                const found = data.tests.find(t => String(t.id) === String(id));
                if (!found) { router.replace('/dashboard'); return; }
                setTest(found);

                // Build question pool from subject chapter IDs
                let pool = [];
                const chapterIds = found.chapterIds || [];
                chapterIds.forEach(chId => {
                    if (allQuestions[chId]) pool.push(...allQuestions[chId]);
                });
                pool = shuffleArray(pool).slice(0, found.numQuestions);
                setQuestions(pool);
                setTimeLeft(found.durationMins * 60);
                setScreen('start');
            })
            .catch(() => router.replace('/dashboard'));
    }, [id, router]);

    // Tab-switch guard
    useEffect(() => {
        testActiveRef.current = screen === 'test';
    }, [screen]);

    useEffect(() => {
        function handleVisibilityChange() {
            if (document.hidden && testActiveRef.current) {
                clearInterval(timerRef.current);
                router.replace('/dashboard?reason=tab_switch');
            }
        }
        function handleBlur() {
            if (testActiveRef.current) {
                clearInterval(timerRef.current);
                router.replace('/dashboard?reason=tab_switch');
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [router]);

    const submitTest = useCallback(() => {
        clearInterval(timerRef.current);
        setScreen('finish');
    }, []);

    useEffect(() => {
        if (screen !== 'test') return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); submitTest(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [screen, submitTest]);

    function startTest() {
        setAnswers({});
        setCurrentQ(0);
        setTimeLeft(test.durationMins * 60);
        setScreen('test');
    }

    function handleAnswer(idx) {
        if (answers[currentQ] !== undefined) return;
        setAnswers(prev => ({ ...prev, [currentQ]: idx }));
    }

    async function handleSave() {
        if (saving || !user || !test) return;
        setSaving(true);
        setSubmitStatus('saving');

        const score = questions.reduce((a, q, i) => a + (answers[i] === q.correct ? 1 : 0), 0);
        const total = questions.length;
        const answerDetails = questions.map((q, i) => ({
            questionId: q.id,
            selected: answers[i] != null ? answers[i] : -1,
            correct: q.correct,
            isCorrect: answers[i] === q.correct,
        }));

        console.log('📤 [handleSave] Submitting assigned test result:', {
            testId: test.id,
            studentEmail: user.email,
            studentName: user.name,
            score,
            total,
            pct: Math.round((score / total) * 100),
        });

        try {
            const res = await fetch('/api/assigned-tests/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: test.id,
                    studentEmail: user.email,
                    studentName: user.name,
                    score,
                    total,
                    answers: answerDetails,
                }),
            });
            const data = await res.json();
            if (data.success) {
                console.log('✅ [handleSave] Result submitted successfully, ID:', data.result?.id);
            } else {
                console.error('❌ [handleSave] Server returned error:', data.error);
            }
            setSubmitStatus(data.success ? 'saved' : 'error');
        } catch (err) {
            console.error('❌ [handleSave] Network/parse error:', err);
            setSubmitStatus('error');
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        if (screen !== 'finish' || submitStatus !== 'idle') return;
        handleSave();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    if (screen === 'loading' || !test) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e0f2fe,#f8fafc)', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                    Loading test…
                </div>
            </div>
        );
    }

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const totalTime = test.durationMins * 60;
    const timerPct = timeLeft / totalTime;
    const timerColor = timerPct > 0.4 ? '#2563eb' : timerPct > 0.15 ? '#7c3aed' : '#dc2626';
    const circumference = 2 * Math.PI * 22;

    const score = questions.reduce((a, q, i) => a + (answers[i] === q.correct ? 1 : 0), 0);
    const total = questions.length;
    const scorePct = total > 0 ? Math.round((score / total) * 100) : 0;
    const answeredCount = Object.keys(answers).length;

    function getDotState(i) {
        if (screen === 'finish') {
            if (answers[i] === undefined) return 'unanswered';
            return answers[i] === questions[i]?.correct ? 'correct' : 'wrong';
        }
        if (i === currentQ) return 'active';
        if (answers[i] !== undefined) return answers[i] === questions[i]?.correct ? 'correct' : 'wrong';
        return 'default';
    }

    function getScoreColor(pct) {
        if (pct >= 80) return '#2563eb';
        if (pct >= 50) return '#7c3aed';
        return '#dc2626';
    }

    // ── START SCREEN
    if (screen === 'start') {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#e0f2fe,#f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
                <div style={{ width: '100%', maxWidth: 560 }}>
                    <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(59,130,246,0.2)', borderLeft: '4px solid #2563eb', borderRadius: 16, padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(59,130,246,0.1)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎯</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '5px 14px', marginBottom: 16 }}>
                            <span style={{ fontSize: 14 }}>
                                {({ air_regulations: '📋', meteorology: '🌦️', navigation: '🗺️', technical: '🔧', rtfm: '📻' })[test.subjectId] || '📝'}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>{test.subjectLabel}</span>
                        </div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af', marginBottom: '0.5rem' }}>{test.title}</h1>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Assigned by your teacher</p>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            {[`❓ ${test.numQuestions} Questions`, `⏱️ ${test.durationMins} Minutes`, '💡 Instant Results'].map(label => (
                                <span key={label} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#2563eb', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{label}</span>
                            ))}
                        </div>

                        {questions.length < test.numQuestions && (
                            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
                                ⚠️ Only {questions.length} questions available from this subject.
                            </div>
                        )}

                        {test.instructions && (
                            <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, textAlign: 'left' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>📌 Teacher Instructions</div>
                                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{test.instructions}</div>
                            </div>
                        )}

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {['Each question has 4 options — select the best answer', 'Once answered, you cannot change your selection', 'Test auto-submits when the timer reaches zero', 'Do not switch tabs — test will end immediately'].map(rule => (
                                <li key={rule} style={{ fontSize: '0.87rem', color: '#374151', padding: '8px 12px', background: 'rgba(59,130,246,0.05)', borderRadius: 8 }}>✔ {rule}</li>
                            ))}
                        </ul>

                        <button onClick={startTest}
                            style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
                            🚀 Start Test →
                        </button>
                        <button onClick={() => router.push('/dashboard')}
                            style={{ width: '100%', padding: '11px', background: 'none', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, color: '#374151', fontSize: '0.95rem', cursor: 'pointer' }}>
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── TEST SCREEN
    if (screen === 'test') {
        const q = questions[currentQ];
        const selected = answers[currentQ];
        const isAnswered = selected !== undefined;

        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#e0f2fe,#f8fafc)', fontFamily: "'Segoe UI',system-ui,sans-serif", color: '#374151' }}>
                {/* Header */}
                <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1.5rem', gap: 10 }}>
                    <button onClick={() => router.push('/dashboard')}
                        style={{ background: 'none', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '6px 14px', color: '#374151', fontSize: 13, cursor: 'pointer' }}>
                        ← Exit
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e40af' }}>🎯 {test.title}</span>
                    {/* Timer */}
                    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
                        <svg width="52" height="52" viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="4" />
                            <circle cx="26" cy="26" r="22" fill="none" stroke={timerColor} strokeWidth="4"
                                strokeLinecap="round" strokeDasharray={circumference}
                                strokeDashoffset={circumference * (1 - timerPct)}
                                transform="rotate(-90 26 26)"
                                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }} />
                        </svg>
                        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 10, fontWeight: 800, color: timerColor }}>
                            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: 'rgba(59,130,246,0.15)' }}>
                    <div style={{ height: '100%', width: `${total > 0 ? ((currentQ + 1) / total) * 100 : 0}%`, background: '#2563eb', transition: 'width 0.3s' }} />
                </div>

                <div style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem' }}>
                    {/* Dots */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                        {questions.map((_, i) => {
                            const ds = getDotState(i);
                            const styles = {
                                active:     { background: 'rgba(59,130,246,0.15)', border: '1px solid #2563eb', color: '#2563eb' },
                                correct:    { background: '#2563eb', border: '1px solid #2563eb', color: '#fff' },
                                wrong:      { background: '#dc2626', border: '1px solid #dc2626', color: '#fff' },
                                unanswered: { background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', color: '#3b82f6' },
                                default:    { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(59,130,246,0.3)', color: '#64748b' },
                            };
                            return (
                                <button key={i} onClick={() => setCurrentQ(i)}
                                    style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 11, fontWeight: 600, cursor: 'pointer', ...styles[ds] }}>
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>

                    {/* Question card */}
                    <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, padding: '1.75rem', marginBottom: 16, boxShadow: '0 4px 16px rgba(59,130,246,0.08)' }}>
                        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Question {currentQ + 1} of {total}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#1e40af', lineHeight: 1.6, marginBottom: 20 }}>{q?.question}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {q?.options.map((opt, idx) => {
                                let bg = 'rgba(255,255,255,0.8)', border = '1px solid rgba(59,130,246,0.2)', color = '#374151';
                                if (isAnswered) {
                                    if (idx === q.correct) { bg = 'rgba(59,130,246,0.12)'; border = '1px solid #2563eb'; color = '#1e40af'; }
                                    else if (idx === selected) { bg = 'rgba(220,38,38,0.12)'; border = '1px solid #dc2626'; }
                                    else { bg = 'rgba(255,255,255,0.4)'; }
                                }
                                return (
                                    <button key={idx} onClick={() => handleAnswer(idx)} disabled={isAnswered}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, background: bg, border, borderRadius: 10, padding: '12px 16px', cursor: isAnswered ? 'default' : 'pointer', textAlign: 'left', color, fontSize: 14, transition: 'all .15s' }}>
                                        <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, color: '#2563eb' }}>
                                            {['A','B','C','D'][idx]}
                                        </span>
                                        <span style={{ flex: 1, lineHeight: 1.5 }}>{opt}</span>
                                        {isAnswered && idx === q.correct && <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>✓</span>}
                                        {isAnswered && idx === selected && selected !== q.correct && <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>✗</span>}
                                    </button>
                                );
                            })}
                        </div>
                        {isAnswered && q?.explanation && (
                            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>💡 Explanation</div>
                                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{q.explanation}</div>
                            </div>
                        )}
                    </div>

                    {/* Nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => setCurrentQ(c => c - 1)} disabled={currentQ === 0}
                            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 18px', color: '#374151', fontSize: 13, cursor: currentQ === 0 ? 'not-allowed' : 'pointer', opacity: currentQ === 0 ? 0.4 : 1 }}>
                            ← Prev
                        </button>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{answeredCount}/{total} answered</span>
                        {currentQ === total - 1
                            ? <button onClick={submitTest} style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit ✓</button>
                            : <button onClick={() => setCurrentQ(c => c + 1)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '10px 20px', color: '#2563eb', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Next →</button>
                        }
                    </div>
                </div>
            </div>
        );
    }

    // ── FINISH SCREEN
    const correctCount = questions.reduce((a, q, i) => a + (answers[i] === q.correct ? 1 : 0), 0);
    const wrongCount = total - correctCount - (total - answeredCount);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#e0f2fe,#f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
            <div style={{ width: '100%', maxWidth: 500 }}>
                <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(59,130,246,0.1)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>{scorePct >= 80 ? '🏆' : scorePct >= 50 ? '✈️' : '📚'}</div>
                    <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1e40af', marginBottom: 6 }}>
                        {scorePct >= 80 ? 'Excellent!' : scorePct >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
                    </h1>
                    <div style={{ fontSize: '3.5rem', fontWeight: 900, color: getScoreColor(scorePct), lineHeight: 1 }}>{correctCount}/{total}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: getScoreColor(scorePct), marginBottom: 20 }}>{scorePct}%</div>

                    {/* Save status */}
                    <div style={{ marginBottom: 20, minHeight: 34 }}>
                        {submitStatus === 'idle' && (
                            <button onClick={handleSave} disabled={saving}
                                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                💾 Save Result
                            </button>
                        )}
                        {submitStatus === 'saving' && (
                            <span style={{ background: 'rgba(245,158,11,0.1)', color: '#92400e', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>⏳ Saving…</span>
                        )}
                        {submitStatus === 'saved' && (
                            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#065f46', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>✅ Result saved!</span>
                        )}
                        {submitStatus === 'error' && (
                            <span style={{ background: 'rgba(239,68,68,0.1)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>⚠️ Save failed — check connection</span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        {[{ icon: '✓', val: correctCount, label: 'Correct', bg: 'rgba(59,130,246,0.1)', color: '#2563eb' },
                          { icon: '✗', val: wrongCount, label: 'Wrong', bg: 'rgba(220,38,38,0.1)', color: '#dc2626' },
                          { icon: '–', val: total - answeredCount, label: 'Skipped', bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' }
                        ].map(b => (
                            <div key={b.label} style={{ flex: 1, background: b.bg, borderRadius: 12, padding: '12px 6px', textAlign: 'center' }}>
                                <div style={{ fontSize: 18, color: b.color }}>{b.icon}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af' }}>{b.val}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{b.label}</div>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => router.push('/dashboard')}
                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}