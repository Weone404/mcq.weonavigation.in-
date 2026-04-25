'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_PASSWORD = 'dgca@admin2024';
const LS_CHAPTERS = 'dgca_admin_chapters';
const LS_QUESTIONS = 'dgca_admin_questions';

function loadAdminData() {
  if (typeof window === 'undefined') return { chapters: [], questions: {} };
  try {
    const ch = JSON.parse(localStorage.getItem(LS_CHAPTERS) || '[]');
    const qs = JSON.parse(localStorage.getItem(LS_QUESTIONS) || '{}');
    return { chapters: ch, questions: qs };
  } catch { return { chapters: [], questions: {} }; }
}

function saveAdminData(chapters, questions) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_CHAPTERS, JSON.stringify(chapters));
  localStorage.setItem(LS_QUESTIONS, JSON.stringify(questions));
}

function downloadJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dgca_questions_export.json';
  a.click();
  URL.revokeObjectURL(url);
}

const emptyQ = { question: '', options: ['', '', '', ''], correct: 0, explanation: '' };
const emptyCh = { id: '', title: '', icon: '📋', color: '#00c864' };

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState({});

  const [activeTab, setActiveTab] = useState('chapters');
  const [selectedChapter, setSelectedChapter] = useState('');

  const [chForm, setChForm] = useState(emptyCh);
  const [chErrors, setChErrors] = useState({});

  const [qForm, setQForm] = useState(emptyQ);
  const [editingQ, setEditingQ] = useState(null); // index or null
  const [showQForm, setShowQForm] = useState(false);

  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('dgca_admin_authed') === 'yes') {
      setAuthed(true);
      const d = loadAdminData();
      setChapters(d.chapters);
      setQuestions(d.questions);
    }
  }, []);

  function handleLogin() {
    if (pwInput === ADMIN_PASSWORD) {
      localStorage.setItem('dgca_admin_authed', 'yes');
      setAuthed(true);
      const d = loadAdminData();
      setChapters(d.chapters);
      setQuestions(d.questions);
    } else {
      setPwError('Incorrect password. Try again.');
    }
  }

  function flashSaved() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  function persist(chs, qs) {
    saveAdminData(chs, qs);
    flashSaved();
  }

  // ── CHAPTER CRUD ──
  function validateCh() {
    const e = {};
    if (!chForm.id || !/^[a-z0-9-]+$/.test(chForm.id)) e.id = 'ID must be lowercase slug (letters, numbers, hyphens).';
    if (!chForm.title || chForm.title.trim().length < 2) e.title = 'Title is required.';
    if (chapters.some(c => c.id === chForm.id)) e.id = 'Chapter ID already exists.';
    return e;
  }

  function addChapter() {
    const e = validateCh();
    if (Object.keys(e).length) { setChErrors(e); return; }
    setChErrors({});
    const newCh = [...chapters, { ...chForm, questionCount: 0 }];
    const newQs = { ...questions, [chForm.id]: [] };
    setChapters(newCh);
    setQuestions(newQs);
    persist(newCh, newQs);
    setChForm(emptyCh);
  }

  function deleteChapter(id) {
    if (!confirm(`Delete chapter "${id}" and all its questions?`)) return;
    const newCh = chapters.filter(c => c.id !== id);
    const newQs = { ...questions };
    delete newQs[id];
    setChapters(newCh);
    setQuestions(newQs);
    persist(newCh, newQs);
    if (selectedChapter === id) setSelectedChapter('');
  }

  // ── QUESTION CRUD ──
  function startAddQ() {
    setQForm(emptyQ);
    setEditingQ(null);
    setShowQForm(true);
  }

  function startEditQ(idx) {
    const q = questions[selectedChapter][idx];
    setQForm({ ...q, options: [...q.options] });
    setEditingQ(idx);
    setShowQForm(true);
  }

  function saveQuestion() {
    if (!qForm.question.trim() || qForm.options.some(o => !o.trim())) {
      alert('Fill in the question and all 4 options.');
      return;
    }
    const qList = [...(questions[selectedChapter] || [])];
    const newQ = {
      id: `q_${Date.now()}`,
      question: qForm.question.trim(),
      options: qForm.options.map(o => o.trim()),
      correct: qForm.correct,
      explanation: qForm.explanation.trim(),
    };
    if (editingQ !== null) {
      qList[editingQ] = newQ;
    } else {
      qList.push(newQ);
    }
    const newQs = { ...questions, [selectedChapter]: qList };
    const newCh = chapters.map(c => c.id === selectedChapter ? { ...c, questionCount: qList.length } : c);
    setQuestions(newQs);
    setChapters(newCh);
    persist(newCh, newQs);
    setShowQForm(false);
  }

  function deleteQuestion(idx) {
    if (!confirm('Delete this question?')) return;
    const qList = [...(questions[selectedChapter] || [])];
    qList.splice(idx, 1);
    const newQs = { ...questions, [selectedChapter]: qList };
    const newCh = chapters.map(c => c.id === selectedChapter ? { ...c, questionCount: qList.length } : c);
    setQuestions(newQs);
    setChapters(newCh);
    persist(newCh, newQs);
  }

  // ── AUTH SCREEN ──
  if (!authed) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-icon">🔐</div>
          <h1 className="auth-title">Admin Panel</h1>
          <p className="auth-sub">Enter admin password to continue</p>
          <input
            type="password"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="pw-input"
          />
          {pwError && <p className="pw-error">{pwError}</p>}
          <button className="login-btn" onClick={handleLogin}>Login →</button>
          <button className="back-link" onClick={() => router.push('/')}>← Back to App</button>
        </div>

        <style jsx>{`
          .auth-page { min-height: 100vh; background: #070b14; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', system-ui, sans-serif; }
          .auth-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 2.5rem 2rem; width: 100%; max-width: 380px; text-align: center; }
          .auth-icon { font-size: 3rem; margin-bottom: 0.75rem; }
          .auth-title { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem; }
          .auth-sub { font-size: 0.85rem; color: #6b7a8f; margin-bottom: 1.5rem; }
          .pw-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem 1rem; color: #fff; font-size: 0.95rem; outline: none; margin-bottom: 0.5rem; }
          .pw-input:focus { border-color: #00c864; }
          .pw-error { color: #ef4444; font-size: 0.82rem; margin-bottom: 0.75rem; }
          .login-btn { width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #00c864, #00a050); border: none; border-radius: 8px; color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer; margin-bottom: 0.75rem; }
          .back-link { background: none; border: none; color: #6b7a8f; font-size: 0.85rem; cursor: pointer; text-decoration: underline; }
        `}</style>
      </div>
    );
  }

  const chQs = questions[selectedChapter] || [];

  // ── ADMIN PANEL ──
  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <button className="back-btn" onClick={() => router.push('/')}>← App</button>
          <span className="nav-title">⚙️ Admin Panel</span>
          <div className="nav-actions">
            {savedFlash && <span className="saved-badge">✓ Saved</span>}
            <button className="export-btn" onClick={() => downloadJSON({ chapters, questions })}>⬇ Export JSON</button>
          </div>
        </div>
      </nav>

      <div className="content">
        {/* TABS */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'chapters' ? 'tab-active' : ''}`} onClick={() => setActiveTab('chapters')}>
            Chapters ({chapters.length})
          </button>
          <button className={`tab ${activeTab === 'questions' ? 'tab-active' : ''}`} onClick={() => setActiveTab('questions')}>
            Questions
          </button>
        </div>

        {/* ── CHAPTERS TAB ── */}
        {activeTab === 'chapters' && (
          <div>
            <div className="card">
              <h3 className="card-title">Add Chapter</h3>
              <div className="form-grid">
                <div className="field">
                  <label>ID (slug)</label>
                  <input value={chForm.id} onChange={e => setChForm(p => ({ ...p, id: e.target.value }))} placeholder="e.g. air-law" className={chErrors.id ? 'error' : ''} />
                  {chErrors.id && <span className="err">{chErrors.id}</span>}
                </div>
                <div className="field">
                  <label>Title</label>
                  <input value={chForm.title} onChange={e => setChForm(p => ({ ...p, title: e.target.value }))} placeholder="Air Law & Regulations" className={chErrors.title ? 'error' : ''} />
                  {chErrors.title && <span className="err">{chErrors.title}</span>}
                </div>
                <div className="field">
                  <label>Icon (emoji)</label>
                  <input value={chForm.icon} onChange={e => setChForm(p => ({ ...p, icon: e.target.value }))} placeholder="📜" style={{ width: 80 }} />
                </div>
                <div className="field">
                  <label>Color</label>
                  <input type="color" value={chForm.color} onChange={e => setChForm(p => ({ ...p, color: e.target.value }))} style={{ width: 60, height: 38, padding: 2 }} />
                </div>
              </div>
              <button className="green-btn" onClick={addChapter}>+ Add Chapter</button>
            </div>

            <div className="ch-list">
              {chapters.length === 0 && <p className="empty-text">No chapters yet. Add one above.</p>}
              {chapters.map(ch => (
                <div key={ch.id} className="ch-row" style={{ borderLeftColor: ch.color }}>
                  <span className="ch-row-icon">{ch.icon}</span>
                  <div className="ch-row-info">
                    <div className="ch-row-title">{ch.title}</div>
                    <div className="ch-row-meta">{ch.id} · {(questions[ch.id] || []).length} questions</div>
                  </div>
                  <button className="edit-q-btn" onClick={() => { setSelectedChapter(ch.id); setActiveTab('questions'); }}>Edit Questions →</button>
                  <button className="del-btn" onClick={() => deleteChapter(ch.id)}>🗑</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── QUESTIONS TAB ── */}
        {activeTab === 'questions' && (
          <div>
            <div className="q-toolbar">
              <select className="ch-select" value={selectedChapter} onChange={e => { setSelectedChapter(e.target.value); setShowQForm(false); }}>
                <option value="">— Select a Chapter —</option>
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.icon} {ch.title}</option>
                ))}
              </select>
              {selectedChapter && (
                <button className="green-btn" onClick={startAddQ}>+ Add Question</button>
              )}
            </div>

            {/* QUESTION FORM */}
            {showQForm && selectedChapter && (
              <div className="card q-form-card">
                <h3 className="card-title">{editingQ !== null ? 'Edit Question' : 'New Question'}</h3>
                <div className="field">
                  <label>Question Text</label>
                  <textarea rows={3} value={qForm.question} onChange={e => setQForm(p => ({ ...p, question: e.target.value }))} placeholder="Enter question..." />
                </div>
                <div className="options-form">
                  {['A', 'B', 'C', 'D'].map((letter, i) => (
                    <div key={i} className="opt-form-row">
                      <label className={`radio-wrap ${qForm.correct === i ? 'radio-selected' : ''}`}>
                        <input
                          type="radio"
                          name="correct"
                          checked={qForm.correct === i}
                          onChange={() => setQForm(p => ({ ...p, correct: i }))}
                        />
                        {letter}
                        {qForm.correct === i && <span className="correct-tag">✓ Correct</span>}
                      </label>
                      <input
                        className="opt-input"
                        value={qForm.options[i]}
                        onChange={e => {
                          const opts = [...qForm.options];
                          opts[i] = e.target.value;
                          setQForm(p => ({ ...p, options: opts }));
                        }}
                        placeholder={`Option ${letter}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="field">
                  <label>Explanation</label>
                  <textarea rows={2} value={qForm.explanation} onChange={e => setQForm(p => ({ ...p, explanation: e.target.value }))} placeholder="Explanation for the correct answer..." />
                </div>
                <div className="form-btns">
                  <button className="green-btn" onClick={saveQuestion}>Save Question</button>
                  <button className="ghost-btn" onClick={() => setShowQForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* QUESTION LIST */}
            {selectedChapter && !showQForm && (
              <div className="q-list">
                {chQs.length === 0 && <p className="empty-text">No questions for this chapter yet.</p>}
                {chQs.map((q, i) => (
                  <div key={q.id || i} className="q-row">
                    <div className="q-num">Q{i + 1}</div>
                    <div className="q-content">
                      <div className="q-text-preview">{q.question}</div>
                      <div className="q-opts-preview">
                        {q.options.map((opt, oi) => (
                          <span key={oi} className={`q-opt-chip ${oi === q.correct ? 'q-opt-correct' : ''}`}>
                            {['A', 'B', 'C', 'D'][oi]}: {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="q-actions">
                      <button className="edit-btn" onClick={() => startEditQ(i)}>✏️</button>
                      <button className="del-btn" onClick={() => deleteQuestion(i)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!selectedChapter && <p className="empty-text" style={{ marginTop: '1rem' }}>Select a chapter to manage its questions.</p>}
          </div>
        )}
      </div>

      <style jsx>{`
        .page { min-height: 100vh; background: linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%); font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; }

        .nav {
          position: sticky; top: 0; z-index: 100;
          background: #ffffff;
          border-bottom: 1px solid #dbeafe;
          box-shadow: 0 10px 30px rgba(15,23,42,0.05);
        }
        .nav-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 0 1.5rem; height: 72px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .back-btn { background: transparent; border: 1px solid #bfdbfe; border-radius: 10px; padding: 0.5rem 1rem; color: #2563eb; font-size: 0.9rem; cursor: pointer; }
        .nav-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
        .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
        .saved-badge { background: #e0f2fe; color: #2563eb; border: 1px solid #93c5fd; border-radius: 20px; padding: 0.3rem 0.75rem; font-size: 0.78rem; font-weight: 700; }
        .export-btn { background: #eff6ff; border: 1px solid #dbeafe; border-radius: 10px; padding: 0.5rem 1rem; color: #2563eb; font-size: 0.9rem; cursor: pointer; }

        .content { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }

        .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.75rem; }
        .tab { background: #ffffff; border: 1px solid #dbeafe; padding: 0.8rem 1.2rem; color: #475569; font-size: 0.95rem; font-weight: 700; cursor: pointer; border-radius: 12px; transition: all 0.2s; }
        .tab:hover { background: #eff6ff; }
        .tab-active { background: #2563eb; color: #fff !important; border-color: #2563eb; }

        .card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px; padding: 1.75rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 20px 50px rgba(15,23,42,0.05);
        }
        .card-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr 80px 80px; gap: 1rem; align-items: end; margin-bottom: 1rem; }
        .field { display: flex; flex-direction: column; gap: 0.35rem; }
        .field label { font-size: 0.85rem; font-weight: 700; color: #475569; }
        .field input, .field textarea, .field select { background: #f8fafc; border: 1px solid #dbeafe; border-radius: 12px; padding: 0.85rem 1rem; color: #0f172a; font-size: 0.95rem; outline: none; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; }
        .field input:focus, .field textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }
        .field input.error { border-color: #ef4444; }
        .field input::placeholder, .field textarea::placeholder { color: #94a3b8; }
        .err { font-size: 0.8rem; color: #ef4444; }

        .green-btn { background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 14px; padding: 0.75rem 1.4rem; color: #fff; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .green-btn:hover { opacity: 0.95; }
        .ghost-btn { background: transparent; border: 1px solid #dbeafe; border-radius: 14px; padding: 0.75rem 1.4rem; color: #475569; font-size: 0.95rem; cursor: pointer; }

        .ch-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .ch-row {
          display: flex; align-items: center; gap: 0.85rem;
          background: #ffffff; border: 1px solid #e2e8f0;
          border-left: 4px solid; border-radius: 14px; padding: 1rem;
        }
        .ch-row-icon { font-size: 1.5rem; }
        .ch-row-info { flex: 1; }
        .ch-row-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
        .ch-row-meta { font-size: 0.78rem; color: #64748b; }
        .edit-q-btn { background: #eff6ff; border: 1px solid #dbeafe; border-radius: 10px; padding: 0.35rem 0.75rem; color: #2563eb; font-size: 0.85rem; cursor: pointer; }
        .del-btn { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 0.35rem 0.7rem; color: #dc2626; font-size: 0.9rem; cursor: pointer; }

        .q-toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .ch-select { background: #f8fafc; border: 1px solid #dbeafe; border-radius: 12px; padding: 0.8rem 1rem; color: #0f172a; font-size: 0.95rem; outline: none; flex: 1; max-width: 360px; }

        .q-form-card { }
        .options-form { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
        .opt-form-row { display: flex; align-items: center; gap: 0.75rem; }
        .radio-wrap { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: #475569; cursor: pointer; white-space: nowrap; min-width: 80px; }
        .radio-selected { color: #2563eb !important; }
        .radio-wrap input { accent-color: #2563eb; width: 16px; height: 16px; }
        .correct-tag { color: #2563eb; font-size: 0.78rem; font-weight: 600; }
        .opt-input { flex: 1; background: #f8fafc; border: 1px solid #dbeafe; border-radius: 12px; padding: 0.75rem 0.95rem; color: #0f172a; font-size: 0.9rem; outline: none; }
        .opt-input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }
        .form-btns { display: flex; gap: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap; }

        .q-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .q-row {
          display: flex; align-items: flex-start; gap: 1rem;
          background: #ffffff; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 1rem;
        }
        .q-num { font-size: 0.8rem; font-weight: 700; color: #64748b; min-width: 28px; padding-top: 2px; }
        .q-content { flex: 1; min-width: 0; }
        .q-text-preview { font-size: 0.9rem; color: #0f172a; margin-bottom: 0.5rem; }
        .q-opts-preview { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .q-opt-chip { font-size: 0.78rem; padding: 0.35rem 0.65rem; background: #eef2ff; border-radius: 10px; color: #2563eb; }
        .q-opt-correct { background: #dbeafe !important; color: #2563eb !important; border: 1px solid #93c5fd; }
        .q-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }
        .edit-btn { background: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 0.35rem 0.75rem; font-size: 0.9rem; cursor: pointer; }

        .empty-text { color: #64748b; font-size: 0.88rem; }

        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr 1fr; }
          .content { padding: 1rem; }
        }
      `}</style>
    </div>
  );
}
