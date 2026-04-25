'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, saveResult, updateLeaderboard } from '../../../lib/storage';
import { chapters, questions as allQuestions } from '../../../data/questions';

const TOTAL_TIME = 300;

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
    const answerDetails = questions.map((q, i) => ({
      questionId: q.id,
      selected: answers[i] != null ? answers[i] : -1,
      correct: q.correct,
      isCorrect: answers[i] === q.correct,
    }));
    try {
      await saveResult({ userEmail: user.email, chapterId, score, total, answers: answerDetails });
      await updateLeaderboard(user, score, total, chapterId);
    } catch (err) {
      console.error('Failed to save result:', err);
    }
    router.push(`/results?score=${score}&total=${total}&chapter=${chapterId}`);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerPct = timeLeft / TOTAL_TIME;
  const timerColor = timerPct > 0.4 ? '#2563eb' : timerPct > 0.15 ? '#7c3aed' : '#dc2626';
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
    if (pct >= 80) return '#2563eb';
    if (pct >= 50) return '#7c3aed';
    return '#dc2626';
  }

  // ── CHANGE 1: getDotState now handles 'finish' screen with 'unanswered' state ──
  function getDotState(i) {
    if (screen === 'finish') {
      if (answers[i] === undefined) return 'unanswered';
      return answers[i] === questions[i]?.correct ? 'correct' : 'wrong';
    }
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
          .page { min-height: 100vh; background: linear-gradient(135deg, #e0f2fe, #f8fafc); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: 'Segoe UI', system-ui, sans-serif; }
          .start-wrap { width: 100%; max-width: 560px; }
          .start-card { background: rgba(255,255,255,0.95); border: 1px solid rgba(59,130,246,0.2); border-left: 4px solid #2563eb; border-radius: 16px; padding: 2.5rem 2rem; text-align: center; box-shadow: 0 8px 32px rgba(59,130,246,0.1); }
          .start-icon { font-size: 4rem; margin-bottom: 1rem; }
          .start-title { font-size: 1.8rem; font-weight: 800; color: #1e40af; margin-bottom: 0.4rem; }
          .start-sub { font-size: 0.9rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 1.5rem; }
          .meta-badges { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1.5rem; }
          .meta-badge { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: #2563eb; padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
          .rules { list-style: none; text-align: left; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.6rem; }
          .rules li { font-size: 0.88rem; color: #374151; padding: 0.6rem 0.9rem; background: rgba(59,130,246,0.05); border-radius: 8px; }
          .start-btn { width: 100%; padding: 0.9rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 8px; color: #fff; font-size: 1.05rem; font-weight: 700; cursor: pointer; margin-bottom: 0.75rem; transition: opacity 0.2s, transform 0.15s; }
          .start-btn:hover { opacity: 0.9; transform: translateY(-1px); }
          .ghost-btn { width: 100%; padding: 0.8rem; background: none; border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; color: #374151; font-size: 0.95rem; cursor: pointer; transition: background 0.2s; }
          .ghost-btn:hover { background: rgba(59,130,246,0.05); }
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
          <div className="progress-bar-fill" style={{ width: `${((currentQ + 1) / total) * 100}%` }} />
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
          .page { min-height: 100vh; background: linear-gradient(135deg, #e0f2fe, #f8fafc); font-family: 'Segoe UI', system-ui, sans-serif; color: #374151; }

          .test-header {
            position: sticky; top: 0; z-index: 100;
            background: rgba(255,255,255,0.95);
            border-bottom: 1px solid rgba(59,130,246,0.2);
            backdrop-filter: blur(10px);
            display: flex; align-items: center; justify-content: space-between;
            padding: 0.6rem 1.5rem;
            box-shadow: 0 2px 8px rgba(59,130,246,0.1);
          }
          .back-btn { background: none; border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 0.4rem 0.85rem; color: #374151; font-size: 0.85rem; cursor: pointer; }
          .ch-name { font-size: 0.95rem; font-weight: 600; color: #1e40af; }
          .timer-wrap { position: relative; display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; }
          .timer-text { position: absolute; font-size: 0.72rem; font-weight: 700; }

          .progress-bar-wrap { height: 3px; background: rgba(59,130,246,0.2); }
          .progress-bar-fill { height: 100%; transition: width 0.3s; background: #2563eb; }

          .test-body { max-width: 700px; margin: 0 auto; padding: 1.5rem 1rem; }

          .dots-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
          .dot {
            width: 34px; height: 34px; border-radius: 50%;
            border: 1px solid rgba(59,130,246,0.3);
            background: rgba(255,255,255,0.8);
            color: #64748b; font-size: 0.78rem; font-weight: 600;
            cursor: pointer; transition: all 0.15s;
          }
          .dot:hover { border-color: #2563eb; color: #2563eb; }
          .dot-active { border-color: #2563eb !important; background: rgba(59,130,246,0.15) !important; color: #2563eb !important; }
          .dot-correct { background: #2563eb !important; border-color: #2563eb !important; color: #fff !important; }
          .dot-wrong { background: #dc2626 !important; border-color: #dc2626 !important; color: #fff !important; }
          /* ── CHANGE 2: blue dot for unanswered questions on finish screen ── */
          .dot-unanswered { background: rgba(59,130,246,0.2) !important; border-color: #3b82f6 !important; color: #3b82f6 !important; }

          .q-card {
            background: rgba(255,255,255,0.95);
            border: 1px solid rgba(59,130,246,0.2);
            border-radius: 14px;
            padding: 1.75rem;
            margin-bottom: 1.25rem;
            box-shadow: 0 4px 16px rgba(59,130,246,0.1);
          }
          .q-label { font-size: 0.78rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
          .q-text { font-size: 1.1rem; font-weight: 700; color: #1e40af; line-height: 1.5; margin-bottom: 1.5rem; }

          .options { display: flex; flex-direction: column; gap: 0.7rem; }
          .option {
            display: flex; align-items: center; gap: 0.75rem;
            background: rgba(255,255,255,0.8);
            border: 1px solid rgba(59,130,246,0.2);
            border-radius: 10px;
            padding: 0.8rem 1rem;
            cursor: pointer;
            text-align: left;
            color: #374151;
            font-size: 0.92rem;
            transition: border-color 0.15s, background 0.15s;
          }
          .option:hover:not(:disabled) { border-color: #2563eb; background: rgba(59,130,246,0.05); }
          .option:disabled { cursor: default; }
          .opt-letter {
            width: 28px; height: 28px; border-radius: 50%;
            background: rgba(59,130,246,0.1);
            display: flex; align-items: center; justify-content: center;
            font-size: 0.8rem; font-weight: 700; flex-shrink: 0; color: #2563eb;
          }
          .opt-text { flex: 1; }
          .opt-correct { background: rgba(59,130,246,0.12) !important; border-color: #2563eb !important; color: #1e40af !important; }
          .opt-wrong { background: rgba(220,38,38,0.12) !important; border-color: #dc2626 !important; }
          .opt-faded { opacity: 0.4; }
          .opt-badge { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 20px; flex-shrink: 0; }
          .badge-correct { background: rgba(59,130,246,0.2); color: #2563eb; }
          .badge-wrong { background: rgba(220,38,38,0.2); color: #dc2626; }

          .explanation {
            margin-top: 1.25rem;
            padding: 1rem 1.1rem;
            background: rgba(59,130,246,0.08);
            border: 1px solid rgba(59,130,246,0.2);
            border-radius: 10px;
          }
          .exp-label { font-size: 0.82rem; font-weight: 700; color: #2563eb; display: block; margin-bottom: 0.4rem; }
          .exp-text { font-size: 0.88rem; color: #374151; line-height: 1.6; }

          .nav-row {
            display: flex; align-items: center; justify-content: space-between;
            gap: 1rem;
          }
          .nav-btn {
            background: rgba(255,255,255,0.8);
            border: 1px solid rgba(59,130,246,0.2);
            border-radius: 8px;
            padding: 0.65rem 1.25rem;
            color: #374151;
            font-size: 0.9rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          .nav-btn:hover:not(:disabled) { background: rgba(59,130,246,0.05); }
          .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
          .nav-next { color: #2563eb; border-color: rgba(59,130,246,0.3); }
          .answered-count { font-size: 0.82rem; color: #64748b; white-space: nowrap; }
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
  // ── CHANGE 3: separate not-answered from wrong ──
  const notAnsweredCount = questions.filter((_, i) => answers[i] === undefined).length;
  const wrongCount = total - correctCount - notAnsweredCount;

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

          {/* ── CHANGE 4: three-card breakdown with blue "Not Answered" ── */}
          <div className="breakdown">
            <div className="breakdown-item" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }}>
              <span style={{ color: '#2563eb', fontSize: '1.2rem' }}>✓</span>
              <span className="bd-val">{correctCount}</span>
              <span className="bd-label">Correct</span>
            </div>
            <div className="breakdown-item" style={{ background: 'rgba(220,38,38,0.1)', borderColor: 'rgba(220,38,38,0.3)' }}>
              <span style={{ color: '#dc2626', fontSize: '1.2rem' }}>✗</span>
              <span className="bd-val">{wrongCount}</span>
              <span className="bd-label">Wrong</span>
            </div>
            <div className="breakdown-item" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }}>
              <span style={{ color: '#3b82f6', fontSize: '1.2rem' }}>–</span>
              <span className="bd-val">{notAnsweredCount}</span>
              <span className="bd-label">Not Answered</span>
            </div>
          </div>

          {/* Dot legend */}
          <div className="dot-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#2563eb' }} />Correct</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#dc2626' }} />Wrong</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: 'rgba(59,130,246,0.3)', border: '1px solid #3b82f6' }} />Not Answered</span>
          </div>

          {/* Dots review on finish screen */}
          <div className="finish-dots">
            {questions.map((_, i) => {
              const ds = getDotState(i);
              return (
                <span key={i} className={`fdot fdot-${ds}`} title={`Q${i + 1}`}>
                  {i + 1}
                </span>
              );
            })}
          </div>

          <button className="save-btn" onClick={handleSaveAndContinue} disabled={saving}>
            {saving ? '💾 Saving...' : 'Save Result & Continue →'}
          </button>
          <button className="retry-btn" onClick={resetTest}>↺ Retry Test</button>
        </div>
      </div>

      <style jsx>{`
        .page { min-height: 100vh; background: linear-gradient(135deg, #e0f2fe, #f8fafc); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: 'Segoe UI', system-ui, sans-serif; }
        .finish-wrap { width: 100%; max-width: 480px; }
        .finish-card {
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(59,130,246,0.2);
          border-radius: 16px;
          padding: 2.5rem 2rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(59,130,246,0.1);
        }
        .result-emoji { font-size: 4.5rem; margin-bottom: 0.75rem; }
        .result-title { font-size: 1.8rem; font-weight: 800; color: #1e40af; margin-bottom: 0.5rem; }
        .score-display { font-size: 3.5rem; font-weight: 900; line-height: 1; }
        .score-pct { font-size: 1.4rem; font-weight: 700; margin-bottom: 1.5rem; }
        .breakdown { display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1.25rem; }
        .breakdown-item {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          padding: 0.85rem 0.5rem; border: 1px solid; border-radius: 12px; gap: 0.3rem;
        }
        .bd-val { font-size: 1.5rem; font-weight: 800; color: #1e40af; }
        .bd-label { font-size: 0.72rem; color: #64748b; }
        .dot-legend { display: flex; gap: 1rem; justify-content: center; margin-bottom: 0.85rem; }
        .legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: #64748b; }
        .legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .finish-dots { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; margin-bottom: 1.75rem; }
        .fdot {
          width: 30px; height: 30px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: 600;
          border: 1px solid rgba(59,130,246,0.2);
          background: rgba(255,255,255,0.8);
          color: #64748b;
        }
        .fdot-correct { background: #2563eb !important; border-color: #2563eb !important; color: #fff !important; }
        .fdot-wrong   { background: #dc2626 !important; border-color: #dc2626 !important; color: #fff !important; }
        .fdot-unanswered { background: rgba(59,130,246,0.2) !important; border-color: #3b82f6 !important; color: #3b82f6 !important; }
        .save-btn {
          width: 100%; padding: 0.9rem;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: none; border-radius: 8px;
          color: #fff; font-size: 1rem; font-weight: 700;
          cursor: pointer; margin-bottom: 0.75rem;
          transition: opacity 0.2s;
        }
        .save-btn:hover { opacity: 0.9; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .retry-btn {
          width: 100%; padding: 0.8rem;
          background: none;
          border: 1px solid rgba(59,130,246,0.3);
          border-radius: 8px;
          color: #374151; font-size: 0.95rem;
          cursor: pointer; transition: background 0.2s;
        }
        .retry-btn:hover { background: rgba(59,130,246,0.05); }
      `}</style>
    </div>
  );
}