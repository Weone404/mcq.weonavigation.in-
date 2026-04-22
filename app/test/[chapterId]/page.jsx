'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, saveResult, updateLeaderboard } from '../../../lib/storage';
import { chapters, questions as allQuestions } from '../../../data/questions';

const TOTAL_TIME = 600;

export default function TestPage({ params }) {
  const { chapterId } = params;
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [screen, setScreen] = useState('start');

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const timerRef = useRef(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) { router.replace('/dashboard'); return; }
    setChapter(ch);
    setQuestions(allQuestions[chapterId] || []);
  }, [chapterId, router]);

  const submitTest = useCallback(() => {
    clearInterval(timerRef.current);
    setScreen('finish');
  }, []);

  useEffect(() => {
    if (screen !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, submitTest]);

  function startTest() {
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(TOTAL_TIME);
    setScreen('test');
  }

  function resetTest() {
    clearInterval(timerRef.current);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(TOTAL_TIME);
    setScreen('start');
  }

  function handleAnswer(optionIndex) {
    if (answers[currentQ] !== undefined) return;
    setAnswers(prev => ({ ...prev, [currentQ]: optionIndex }));
  }

  const [saving, setSaving] = useState(false);

  async function handleSaveAndContinue() {
    if (saving) return;
    setSaving(true);
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
    const total = questions.length;
    try {
      await saveResult({ userEmail: user.email, chapterId, score, total });
      await updateLeaderboard(user, score, total, chapterId);
    } catch (err) {
      console.error('Failed to save result:', err);
    }
    router.push(`/results?score=${score}&total=${total}&chapter=${chapterId}`);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerPct = timeLeft / TOTAL_TIME;
  const timerColor = timerPct > 0.4 ? '#00c864' : timerPct > 0.15 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference * (1 - timerPct);

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
  const total = questions.length;
  const scorePct = total > 0 ? Math.round((score / total) * 100) : 0;
  const answeredCount = Object.keys(answers).length;

  function getResultEmoji() {
    if (scorePct >= 80) return '🏆';
    if (scorePct >= 50) return '✈️';
    return '📚';
  }
  function getResultTitle() {
    if (scorePct >= 80) return 'Excellent!';
    if (scorePct >= 50) return 'Good Effort!';
    return 'Keep Practicing!';
  }
  function getScoreColor(pct) {
    if (pct >= 80) return '#00c864';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  }

  function getDotState(i) {
    if (i === currentQ) return 'active';
    if (answers[i] !== undefined) {
      return answers[i] === questions[i]?.correct ? 'correct' : 'wrong';
    }
    return 'default';
  }

  if (!user || !chapter) return null;

  // ──────────────────────────────────────────────────────────────────
  // SCREEN 1: START
  // ──────────────────────────────────────────────────────────────────
  if (screen === 'start') {
    return (
      <div className="page">
        <div className="start-wrap">
          <div className="start-card">
            <div className="start-icon">{chapter.icon}</div>
            <h1 className="start-title">{chapter.title}</h1>
            <p className="start-sub">DGCA MCQ Test</p>
            <div className="meta-badges">
              <span className="meta-badge">❓ {questions.length} Questions</span>
              <span className="meta-badge">⏱️ 10 Minutes</span>
              <span className="meta-badge">💡 Instant Explanations</span>
            </div>
            <ul className="rules">
              <li>✔ Each question has 4 options — select the best answer</li>
              <li>✔ Once answered, you cannot change your selection</li>
              <li>✔ Explanations are shown immediately after answering</li>
              <li>✔ Test auto-submits when the timer reaches zero</li>
            </ul>
            <button className="start-btn" onClick={startTest}>Start Test →</button>
            <button className="ghost-btn" onClick={() => router.push('/dashboard')}>← Back to Dashboard</button>
          </div>
        </div>

        <style jsx>{`
          .page { min-height: 100vh; background: #070b14; display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: 'Segoe UI', system-ui, sans-serif; }
          .start-wrap { width: 100%; max-width: 560px; }
          .start-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-left: 4px solid ${chapter.color}; border-radius: 16px; padding: 2.5rem 2rem; text-align: center; }
          .start-icon { font-size: 4rem; margin-bottom: 1rem; }
          .start-title { font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; }
          .start-sub { font-size: 0.9rem; color: #6b7a8f; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 1.5rem; }
          .meta-badges { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1.5rem; }
          .meta-badge { background: rgba(0,200,100,0.1); border: 1px solid rgba(0,200,100,0.2); color: #00c864; padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
          .rules { list-style: none; text-align: left; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.6rem; }
          .rules li { font-size: 0.88rem; color: #e2e8f0; padding: 0.6rem 0.9rem; background: rgba(255,255,255,0.03); border-radius: 8px; }
          .start-btn { width: 100%; padding: 0.9rem; background: linear-gradient(135deg, #00c864, #00a050); border: none; border-radius: 8px; color: #fff; font-size: 1.05rem; font-weight: 700; cursor: pointer; margin-bottom: 0.75rem; transition: opacity 0.2s, transform 0.15s; }
          .start-btn:hover { opacity: 0.9; transform: translateY(-1px); }
          .ghost-btn { width: 100%; padding: 0.8rem; background: none; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: #e2e8f0; font-size: 0.95rem; cursor: pointer; transition: background 0.2s; }
          .ghost-btn:hover { background: rgba(255,255,255,0.06); }
        `}</style>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // SCREEN 2: TEST
  // ──────────────────────────────────────────────────────────────────
  const q = questions[currentQ];
  const selected = answers[currentQ];
  const isAnswered = selected !== undefined;

  if (screen === 'test') {
    return (
      <div className="page">
        {/* STICKY HEADER */}
        <div className="test-header">
          <button className="back-btn" onClick={() => router.push('/dashboard')}>← Exit</button>
          <span className="ch-name">{chapter.icon} {chapter.title}</span>
          <div className="timer-wrap">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
              <circle
                cx="26" cy="26" r="22" fill="none"
                stroke={timerColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 26 26)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
              />
            </svg>
            <span className="timer-text" style={{ color: timerColor }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${((currentQ + 1) / total) * 100}%`, background: chapter.color }} />
        </div>

        <div className="test-body">
          {/* QUESTION DOTS */}
          <div className="dots-row">
            {questions.map((_, i) => {
              const ds = getDotState(i);
              return (
                <button key={i} className={`dot dot-${ds}`} onClick={() => setCurrentQ(i)}>
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* QUESTION CARD */}
          <div className="q-card">
            <div className="q-label">Question {currentQ + 1} of {total}</div>
            <div className="q-text">{q.question}</div>

            <div className="options">
              {q.options.map((opt, idx) => {
                let cls = 'option';
                if (isAnswered) {
                  if (idx === q.correct) cls += ' opt-correct';
                  else if (idx === selected && selected !== q.correct) cls += ' opt-wrong';
                  else cls += ' opt-faded';
                }
                const letter = ['A', 'B', 'C', 'D'][idx];
                return (
                  <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={isAnswered}>
                    <span className="opt-letter">{letter}</span>
                    <span className="opt-text">{opt}</span>
                    {isAnswered && idx === q.correct && <span className="opt-badge badge-correct">✓ Correct</span>}
                    {isAnswered && idx === selected && selected !== q.correct && <span className="opt-badge badge-wrong">✗ Wrong</span>}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="explanation">
                <span className="exp-label">💡 Explanation</span>
                <p className="exp-text">{q.explanation}</p>
              </div>
            )}
          </div>

          {/* NAV ROW */}
          <div className="nav-row">
            <button className="nav-btn" onClick={() => setCurrentQ(c => c - 1)} disabled={currentQ === 0}>
              ← Previous
            </button>
            <span className="answered-count">{answeredCount}/{total} answered</span>
            {currentQ === total - 1 ? (
              <button className="submit-test-btn" onClick={submitTest}>Submit Test ✓</button>
            ) : (
              <button className="nav-btn nav-next" onClick={() => setCurrentQ(c => c + 1)}>
                Next →
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          .page { min-height: 100vh; background: #070b14; font-family: 'Segoe UI', system-ui, sans-serif; color: #e2e8f0; }

          .test-header {
            position: sticky; top: 0; z-index: 100;
            background: rgba(10,16,30,0.98);
            border-bottom: 1px solid rgba(255,255,255,0.06);
            backdrop-filter: blur(10px);
            display: flex; align-items: center; justify-content: space-between;
            padding: 0.6rem 1.5rem;
          }
          .back-btn { background: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.4rem 0.85rem; color: #e2e8f0; font-size: 0.85rem; cursor: pointer; }
          .ch-name { font-size: 0.95rem; font-weight: 600; color: #fff; }
          .timer-wrap { position: relative; display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; }
          .timer-text { position: absolute; font-size: 0.72rem; font-weight: 700; }

          .progress-bar-wrap { height: 3px; background: rgba(255,255,255,0.06); }
          .progress-bar-fill { height: 100%; transition: width 0.3s; }

          .test-body { max-width: 700px; margin: 0 auto; padding: 1.5rem 1rem; }

          .dots-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
          .dot {
            width: 34px; height: 34px; border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.04);
            color: #6b7a8f; font-size: 0.78rem; font-weight: 600;
            cursor: pointer; transition: all 0.15s;
          }
          .dot:hover { border-color: #00c864; color: #00c864; }
          .dot-active { border-color: #00c864 !important; background: rgba(0,200,100,0.15) !important; color: #00c864 !important; }
          .dot-correct { background: #00c864 !important; border-color: #00c864 !important; color: #fff !important; }
          .dot-wrong { background: #ef4444 !important; border-color: #ef4444 !important; color: #fff !important; }

          .q-card {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px;
            padding: 1.75rem;
            margin-bottom: 1.25rem;
          }
          .q-label { font-size: 0.78rem; color: #6b7a8f; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
          .q-text { font-size: 1.1rem; font-weight: 700; color: #fff; line-height: 1.5; margin-bottom: 1.5rem; }

          .options { display: flex; flex-direction: column; gap: 0.7rem; }
          .option {
            display: flex; align-items: center; gap: 0.75rem;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 0.8rem 1rem;
            cursor: pointer;
            text-align: left;
            color: #e2e8f0;
            font-size: 0.92rem;
            transition: border-color 0.15s, background 0.15s;
          }
          .option:hover:not(:disabled) { border-color: #00c864; background: rgba(0,200,100,0.06); }
          .option:disabled { cursor: default; }
          .opt-letter {
            width: 28px; height: 28px; border-radius: 50%;
            background: rgba(255,255,255,0.08);
            display: flex; align-items: center; justify-content: center;
            font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
          }
          .opt-text { flex: 1; }
          .opt-correct { background: rgba(0,200,100,0.12) !important; border-color: #00c864 !important; color: #fff !important; }
          .opt-wrong { background: rgba(239,68,68,0.12) !important; border-color: #ef4444 !important; }
          .opt-faded { opacity: 0.4; }
          .opt-badge { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 20px; flex-shrink: 0; }
          .badge-correct { background: rgba(0,200,100,0.2); color: #00c864; }
          .badge-wrong { background: rgba(239,68,68,0.2); color: #ef4444; }

          .explanation {
            margin-top: 1.25rem;
            padding: 1rem 1.1rem;
            background: rgba(59,130,246,0.08);
            border: 1px solid rgba(59,130,246,0.2);
            border-radius: 10px;
          }
          .exp-label { font-size: 0.82rem; font-weight: 700; color: #3b82f6; display: block; margin-bottom: 0.4rem; }
          .exp-text { font-size: 0.88rem; color: #e2e8f0; line-height: 1.6; }

          .nav-row {
            display: flex; align-items: center; justify-content: space-between;
            gap: 1rem;
          }
          .nav-btn {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 0.65rem 1.25rem;
            color: #e2e8f0;
            font-size: 0.9rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          .nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
          .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
          .nav-next { color: #00c864; border-color: rgba(0,200,100,0.3); }
          .answered-count { font-size: 0.82rem; color: #6b7a8f; white-space: nowrap; }
          .submit-test-btn {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border: none; border-radius: 8px;
            padding: 0.65rem 1.25rem;
            color: #fff; font-size: 0.9rem; font-weight: 700;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          .submit-test-btn:hover { opacity: 0.9; }

          @media (max-width: 480px) {
            .test-body { padding: 1rem 0.75rem; }
            .q-card { padding: 1.25rem; }
            .ch-name { display: none; }
          }
        `}</style>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // SCREEN 3: FINISH
  // ──────────────────────────────────────────────────────────────────
  const correctCount = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
  const wrongCount = total - correctCount;

  return (
    <div className="page">
      <div className="finish-wrap">
        <div className="finish-card">
          <div className="result-emoji">{getResultEmoji()}</div>
          <h1 className="result-title">{getResultTitle()}</h1>
          <div className="score-display" style={{ color: getScoreColor(scorePct) }}>
            {correctCount} / {total}
          </div>
          <div className="score-pct" style={{ color: getScoreColor(scorePct) }}>{scorePct}%</div>

          <div className="breakdown">
            <div className="breakdown-item" style={{ background: 'rgba(0,200,100,0.1)', borderColor: 'rgba(0,200,100,0.3)' }}>
              <span style={{ color: '#00c864', fontSize: '1.2rem' }}>✓</span>
              <span className="bd-val">{correctCount}</span>
              <span className="bd-label">Correct</span>
            </div>
            <div className="breakdown-item" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <span style={{ color: '#ef4444', fontSize: '1.2rem' }}>✗</span>
              <span className="bd-val">{wrongCount}</span>
              <span className="bd-label">Wrong</span>
            </div>
          </div>

          <button className="save-btn" onClick={handleSaveAndContinue} disabled={saving}>
            {saving ? '💾 Saving...' : 'Save Result & Continue →'}
          </button>
          <button className="retry-btn" onClick={resetTest}>↺ Retry Test</button>
        </div>
      </div>

      <style jsx>{`
        .page { min-height: 100vh; background: #070b14; display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: 'Segoe UI', system-ui, sans-serif; }
        .finish-wrap { width: 100%; max-width: 460px; }
        .finish-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 2.5rem 2rem;
          text-align: center;
        }
        .result-emoji { font-size: 4.5rem; margin-bottom: 0.75rem; }
        .result-title { font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; }
        .score-display { font-size: 3.5rem; font-weight: 900; line-height: 1; }
        .score-pct { font-size: 1.4rem; font-weight: 700; margin-bottom: 1.5rem; }
        .breakdown { display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem; }
        .breakdown-item {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          padding: 1rem; border: 1px solid; border-radius: 12px; gap: 0.3rem;
        }
        .bd-val { font-size: 1.5rem; font-weight: 800; color: #fff; }
        .bd-label { font-size: 0.78rem; color: #6b7a8f; }
        .save-btn {
          width: 100%; padding: 0.9rem;
          background: linear-gradient(135deg, #00c864, #00a050);
          border: none; border-radius: 8px;
          color: #fff; font-size: 1rem; font-weight: 700;
          cursor: pointer; margin-bottom: 0.75rem;
          transition: opacity 0.2s;
        }
        .save-btn:hover { opacity: 0.9; }
        .retry-btn {
          width: 100%; padding: 0.8rem;
          background: none;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #e2e8f0; font-size: 0.95rem;
          cursor: pointer; transition: background 0.2s;
        }
        .retry-btn:hover { background: rgba(255,255,255,0.06); }
      `}</style>
    </div>
  );
}