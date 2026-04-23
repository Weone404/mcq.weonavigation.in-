'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { chapters, questions as allQuestions } from '../../data/questions';

const TEACHER_PASSWORD = 'dgca@teacher2024';
const TEACHER_AUTH_KEY = 'dgca_teacher_authed';

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getScoreColor(pct) {
    if (pct >= 80) return '#00c864';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
}

function getChapterTitle(chapterId) {
    return chapters.find(ch => ch.id === chapterId)?.title || chapterId;
}

function getQuestionData(chapterId, questionId) {
    return allQuestions[chapterId]?.find(q => q.id === questionId) || null;
}

export default function TeacherPage() {
    const router = useRouter();
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [summary, setSummary] = useState({ totalStudents: 0, totalTests: 0, avgAccuracy: 0 });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (localStorage.getItem(TEACHER_AUTH_KEY) === 'yes') {
            setAuthed(true);
            loadData();
        }
    }, []);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/teacher/students');
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Failed to fetch teacher data (${res.status})`);
            }
            const data = await res.json();
            setStudents(data.students);
            setSummary(data.summary);
            if (data.students.length > 0) setSelectedEmail(data.students[0].email);
        } catch (err) {
            setError(err.message || 'Unable to load teacher dashboard data.');
        } finally {
            setLoading(false);
        }
    }

    function handleLogin() {
        if (password.trim() === TEACHER_PASSWORD) {
            localStorage.setItem(TEACHER_AUTH_KEY, 'yes');
            setAuthed(true);
            loadData();
        } else {
            setError('Teacher password is incorrect.');
        }
    }

    function handleLogout() {
        localStorage.removeItem(TEACHER_AUTH_KEY);
        router.push('/');
    }

    const selectedStudent = students.find(s => s.email === selectedEmail);

    const selectedStudentChapterStats = selectedStudent ? selectedStudent.results.reduce((acc, result) => {
        const chapter = result.chapterId;
        const answers = Array.isArray(result.answers) ? result.answers : [];
        if (!acc[chapter]) acc[chapter] = { correct: 0, total: 0 };
        acc[chapter].total += answers.length;
        acc[chapter].correct += answers.filter(a => a.isCorrect).length;
        return acc;
    }, {}) : {};

    const chapterStatus = selectedStudent ? Object.entries(selectedStudentChapterStats).map(([chapterId, stats]) => ({
        chapterId,
        title: getChapterTitle(chapterId),
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    })) : [];

    const clearTopics = chapterStatus.filter(c => c.accuracy >= 80);
    const weakTopics = chapterStatus.filter(c => c.accuracy < 60);

    const wrongQuestions = selectedStudent ? selectedStudent.results.flatMap(result => {
        const chapterTitle = getChapterTitle(result.chapterId);
        return (Array.isArray(result.answers) ? result.answers : []).filter(a => !a.isCorrect).map(a => {
            const question = getQuestionData(result.chapterId, a.questionId);
            return {
                chapterTitle,
                question: question?.question || `Question ${a.questionId}`,
                selected: question?.options?.[a.selected] || `Option ${a.selected + 1}`,
                correct: question?.options?.[a.correct] || `Option ${a.correct + 1}`,
                date: result.date,
            };
        });
    }) : [];

    if (!authed) {
        return (
            <div className="teacher-auth-page">
                <div className="teacher-auth-card">
                    <h1>Teacher Dashboard</h1>
                    <p>Enter the teacher password to view all student data.</p>
                    <input
                        type="password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="Teacher password"
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                    {error && <div className="teacher-error">{error}</div>}
                    <button onClick={handleLogin}>Unlock Dashboard</button>
                    <button className="teacher-back" onClick={() => router.push('/')}>← Back to App</button>
                </div>
                <style jsx>{`
          .teacher-auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #070b14; color: #e2e8f0; font-family: 'Segoe UI', system-ui, sans-serif; padding: 1rem; }
          .teacher-auth-card { width: 100%; max-width: 420px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 2rem; text-align: center; }
          .teacher-auth-card h1 { margin-bottom: 0.5rem; font-size: 1.8rem; }
          .teacher-auth-card p { margin-bottom: 1.5rem; color: #94a3b8; }
          .teacher-auth-card input { width: 100%; padding: 0.95rem 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #e2e8f0; margin-bottom: 1rem; outline: none; }
          .teacher-auth-card button { width: 100%; padding: 0.95rem 1rem; border: none; border-radius: 12px; background: linear-gradient(135deg, #00c864, #15803d); color: #fff; font-weight: 700; cursor: pointer; margin-bottom: 0.75rem; }
          .teacher-back { background: transparent; border: 1px solid rgba(255,255,255,0.12); color: #9ca3af; }
          .teacher-error { color: #f87171; margin-bottom: 1rem; font-size: 0.95rem; }
        `}</style>
            </div>
        );
    }

    return (
        <div className="teacher-page">
            <nav className="teacher-nav">
                <div className="teacher-nav-brand">👩‍🏫 Teacher Dashboard</div>
                <div className="teacher-nav-actions">
                    <button className="teacher-nav-btn" onClick={() => router.push('/')}>Home</button>
                    <button className="teacher-nav-btn logout" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="teacher-content">
                <header className="teacher-hero">
                    <div>
                        <h1>All Students & Test Performance</h1>
                        <p>Live data from MongoDB for every student, including performance scores, results, and joined date.</p>
                    </div>
                    <div className="teacher-summary">
                        <div><span>{summary.totalStudents}</span><small>Students</small></div>
                        <div><span>{summary.totalTests}</span><small>Total Tests</small></div>
                        <div><span>{summary.avgAccuracy}%</span><small>Avg Accuracy</small></div>
                    </div>
                </header>

                {loading ? (
                    <div className="teacher-loading">Loading student data from the database...</div>
                ) : error ? (
                    <div className="teacher-error-card">{error}</div>
                ) : (
                    <div className="teacher-grid">
                        <section className="teacher-panel teacher-list-panel">
                            <div className="panel-header">
                                <h2>Students</h2>
                                <span>{students.length} records</span>
                            </div>
                            <div className="teacher-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Tests</th>
                                            <th>Avg</th>
                                            <th>Best</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student.email} className={selectedEmail === student.email ? 'selected' : ''} onClick={() => setSelectedEmail(student.email)}>
                                                <td>{student.name}</td>
                                                <td>{student.email}</td>
                                                <td>{student.testsAttempted}</td>
                                                <td style={{ color: getScoreColor(student.avgScore) }}>{student.avgScore}%</td>
                                                <td style={{ color: getScoreColor(student.bestScore) }}>{student.bestScore}%</td>
                                                <td><button type="button">View</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="teacher-panel teacher-detail-panel">
                            <div className="panel-header">
                                <h2>Student Details</h2>
                                <span>{selectedStudent ? selectedStudent.email : 'Select a student'}</span>
                            </div>
                            {selectedStudent ? (
                                <div className="student-detail-card">
                                    <div className="student-info-row">
                                        <div><strong>Name</strong><span>{selectedStudent.name}</span></div>
                                        <div><strong>Phone</strong><span>+91 {selectedStudent.phone}</span></div>
                                    </div>
                                    <div className="student-info-row">
                                        <div><strong>Joined</strong><span>{formatDate(selectedStudent.joinedAt)}</span></div>
                                        <div><strong>Total Questions</strong><span>{selectedStudent.totalQuestions}</span></div>
                                    </div>

                                    <div className="student-metrics">
                                        <div><strong>Tests</strong><span>{selectedStudent.testsAttempted}</span></div>
                                        <div><strong>Avg Score</strong><span style={{ color: getScoreColor(selectedStudent.avgScore) }}>{selectedStudent.avgScore}%</span></div>
                                        <div><strong>Best Score</strong><span style={{ color: getScoreColor(selectedStudent.bestScore) }}>{selectedStudent.bestScore}%</span></div>
                                    </div>

                                    <div className="student-insights">
                                        <div className="insight-block">
                                            <h3>Clear Topics</h3>
                                            {clearTopics.length === 0 ? (
                                                <div className="empty-state">No strong topics yet.</div>
                                            ) : (
                                                <div className="topic-grid">
                                                    {clearTopics.map(topic => (
                                                        <div key={topic.chapterId} className="topic-chip clear">{topic.title}: {topic.accuracy}%</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="insight-block">
                                            <h3>Topics to Review</h3>
                                            {weakTopics.length === 0 ? (
                                                <div className="empty-state">No weak topics yet.</div>
                                            ) : (
                                                <div className="topic-grid">
                                                    {weakTopics.map(topic => (
                                                        <div key={topic.chapterId} className="topic-chip weak">{topic.title}: {topic.accuracy}%</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="results-section">
                                        <h3>Recent Results</h3>
                                        <div className="results-list">
                                            {selectedStudent.results.length === 0 ? (
                                                <div className="empty-state">No results found for this student.</div>
                                            ) : selectedStudent.results.map(result => (
                                                <div key={result.id} className="result-row">
                                                    <div>
                                                        <strong>{getChapterTitle(result.chapterId)}</strong>
                                                        <span>{formatDate(result.date)}</span>
                                                    </div>
                                                    <div style={{ color: getScoreColor(result.pct) }}>{result.score}/{result.total} ({result.pct}%)</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="wrong-questions-section">
                                        <h3>Recent Wrong Questions</h3>
                                        {wrongQuestions.length === 0 ? (
                                            <div className="empty-state">No wrong answers recorded yet.</div>
                                        ) : (
                                            <div className="wrong-list">
                                                {wrongQuestions.slice(0, 6).map((item, index) => (
                                                    <div key={`${item.question}-${index}`} className="wrong-row">
                                                        <div>
                                                            <strong>{item.chapterTitle}</strong>
                                                            <p>{item.question}</p>
                                                        </div>
                                                        <div className="wrong-meta">
                                                            <span className="wrong-label">Selected: {item.selected}</span>
                                                            <span className="correct-label">Correct: {item.correct}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">Select a student to review their performance details.</div>
                            )}
                        </section>
                    </div>
                )}
            </div>

            <style jsx>{`
        .teacher-page { min-height: 100vh; background: #060b16; color: #e2e8f0; font-family: 'Segoe UI', system-ui, sans-serif; }
        .teacher-nav { display: flex; align-items: center; justify-content: space-between; padding: 1.15rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(7, 11, 20, 0.95); position: sticky; top: 0; z-index: 20; }
        .teacher-nav-brand { font-weight: 700; letter-spacing: 0.02em; }
        .teacher-nav-actions { display: flex; gap: 0.75rem; }
        .teacher-nav-btn { border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #e2e8f0; border-radius: 10px; padding: 0.7rem 1rem; cursor: pointer; }
        .teacher-nav-btn.logout { background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; }
        .teacher-content { max-width: 1280px; margin: 0 auto; padding: 1.5rem; }
        .teacher-hero { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1.75rem; }
        .teacher-hero h1 { font-size: clamp(2rem, 2.8vw, 3rem); margin-bottom: 0.6rem; line-height: 1.05; }
        .teacher-hero p { max-width: 680px; color: #94a3b8; font-size: 1rem; }
        .teacher-summary { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap: 1rem; align-items: stretch; }
        .teacher-summary div { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 1rem 1.15rem; text-align: center; }
        .teacher-summary span { display: block; font-size: 2rem; font-weight: 800; margin-bottom: 0.35rem; }
        .teacher-summary small { color: #94a3b8; }
        .teacher-loading, .teacher-error-card { padding: 2rem 1.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; text-align: center; }
        .teacher-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; }
        .teacher-panel { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 1.25rem; }
        .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .panel-header h2 { margin: 0; font-size: 1.05rem; }
        .panel-header span { color: #94a3b8; font-size: 0.9rem; }
        .teacher-table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 650px; }
        th, td { padding: 0.9rem 0.85rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.08); }
        th { color: #94a3b8; font-size: 0.84rem; text-transform: uppercase; letter-spacing: 0.04em; }
        td button { padding: 0.45rem 0.8rem; border-radius: 10px; border: none; background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; }
        tr:hover { background: rgba(255,255,255,0.04); }
        tr.selected { background: rgba(0,200,100,0.08); }
        .student-detail-card { display: grid; gap: 1rem; }
        .student-info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .student-info-row div { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1rem; }
        .student-info-row strong { display: block; color: #94a3b8; margin-bottom: 0.5rem; font-size: 0.82rem; }
        .student-info-row span { font-size: 1rem; font-weight: 700; }
        .student-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
        .student-metrics div { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1rem; text-align: center; }
        .student-metrics strong { display: block; color: #94a3b8; font-size: 0.82rem; margin-bottom: 0.5rem; }
        .student-insights { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .insight-block { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 1rem; }
        .insight-block h3 { margin: 0 0 0.75rem; font-size: 1rem; }
        .topic-grid { display: grid; gap: 0.65rem; }
        .topic-chip { padding: 0.75rem 1rem; border-radius: 14px; background: rgba(255,255,255,0.06); color: #e2e8f0; font-size: 0.9rem; }
        .topic-chip.clear { border: 1px solid rgba(34,197,94,0.3); }
        .topic-chip.weak { border: 1px solid rgba(239,68,68,0.35); }
        .results-section h3 { margin: 0 0 0.75rem; font-size: 1rem; }
        .results-list { display: grid; gap: 0.75rem; }
        .result-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.95rem 1rem; border-radius: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .result-row strong { display: block; font-size: 0.95rem; }
        .result-row span { color: #94a3b8; font-size: 0.85rem; }
        .wrong-questions-section { margin-top: 1rem; }
        .wrong-questions-section h3 { margin: 0 0 0.75rem; font-size: 1rem; }
        .wrong-list { display: grid; gap: 0.75rem; }
        .wrong-row { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1rem; display: grid; gap: 0.5rem; }
        .wrong-row p { margin: 0.25rem 0 0; color: #e2e8f0; font-size: 0.95rem; line-height: 1.4; }
        .wrong-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .wrong-label, .correct-label { font-size: 0.85rem; color: #cbd5e1; }
        .wrong-label { color: #f87171; }
        .correct-label { color: #34d399; }
        .empty-state { padding: 1.5rem; border-radius: 16px; border: 1px dashed rgba(255,255,255,0.18); color: #94a3b8; text-align: center; }
        @media (max-width: 980px) { .teacher-grid { grid-template-columns: 1fr; } .student-info-row { grid-template-columns: 1fr; } .student-metrics { grid-template-columns: 1fr; } }
      `}</style>
        </div>
    );
}
