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

function getAttColor(pct) {
    if (pct >= 80) return '#16a34a';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
}

function getChapterTitle(chapterId) {
    return chapters.find(ch => ch.id === chapterId)?.title || chapterId;
}

function getQuestionData(chapterId, questionId) {
    return allQuestions[chapterId]?.find(q => q.id === questionId) || null;
}

function initials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColors(i) {
    const list = [['#dbeafe', '#2563eb'], ['#dcfce7', '#16a34a'], ['#fef3c7', '#b45309'], ['#f3e8ff', '#7c3aed'], ['#ffe4e6', '#be123c']];
    return list[i % list.length];
}

// ─── Attendance Sub-components ────────────────────────────────────────────────

function AttMarkTab({ students }) {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [batch, setBatch] = useState('Batch A — Morning');
    const [rollStatus, setRollStatus] = useState({});
    const [notes, setNotes] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    const setStatus = (email, status) => setRollStatus(prev => ({ ...prev, [email]: status }));
    const setNote = (email, note) => setNotes(prev => ({ ...prev, [email]: note }));

    const markAll = (status) => {
        const next = {};
        students.forEach(s => { next[s.email] = status; });
        setRollStatus(next);
    };

    const marked = Object.keys(rollStatus).length;
    const presentCount = Object.values(rollStatus).filter(v => v === 'present').length;
    const absentCount = Object.values(rollStatus).filter(v => v === 'absent').length;
    const lateCount = Object.values(rollStatus).filter(v => v === 'late').length;

    async function saveAttendance() {
        setSaving(true);
        setSaveMsg('');
        try {
            const records = students.map(s => ({
                email: s.email,
                name: s.name,
                status: rollStatus[s.email] || 'absent',
                note: notes[s.email] || '',
            }));
            const res = await fetch('/api/teacher/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, batch, records }),
            });
            if (!res.ok) throw new Error('Failed to save');
            setSaveMsg('Attendance saved successfully!');
        } catch {
            setSaveMsg('Error saving attendance. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <div className="att-controls">
                <select value={batch} onChange={e => setBatch(e.target.value)}>
                    <option>Batch A — Morning</option>
                    <option>Batch B — Evening</option>
                    <option>Batch C — Weekend</option>
                </select>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <div className="att-controls-right">
                    <button className="att-btn att-btn-outline" onClick={() => markAll('present')}>✓ All Present</button>
                    <button className="att-btn att-btn-primary" onClick={saveAttendance} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Attendance'}
                    </button>
                </div>
            </div>

            {saveMsg && (
                <div className={`save-msg ${saveMsg.includes('Error') ? 'save-msg-err' : 'save-msg-ok'}`}>{saveMsg}</div>
            )}

            <div className="att-stat-row">
                <div className="att-stat-card"><span style={{ color: '#16a34a' }}>{presentCount}</span><small>Present</small></div>
                <div className="att-stat-card"><span style={{ color: '#ef4444' }}>{absentCount}</span><small>Absent</small></div>
                <div className="att-stat-card"><span style={{ color: '#b45309' }}>{lateCount}</span><small>Late</small></div>
                <div className="att-stat-card"><span style={{ color: '#2563eb' }}>{marked}/{students.length}</span><small>Marked</small></div>
            </div>

            <div className="teacher-panel">
                <div className="panel-header">
                    <h2>Roll Call — {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                    <span>{students.length} students · {marked} marked</span>
                </div>
                <div className="teacher-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s, i) => {
                                const st = rollStatus[s.email] || '';
                                const [bg, fg] = avatarColors(i);
                                return (
                                    <tr key={s.email}>
                                        <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{i + 1}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="att-avatar" style={{ background: bg, color: fg }}>{initials(s.name)}</div>
                                                {s.name}
                                            </div>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{s.email}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {['present', 'absent', 'late'].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setStatus(s.email, status)}
                                                        className={`status-btn status-${status}${st === status ? ' status-active' : ''}`}
                                                    >
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                placeholder="Optional note"
                                                value={notes[s.email] || ''}
                                                onChange={e => setNote(s.email, e.target.value)}
                                                className="note-input"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AttReportTab({ students }) {
    const [batch, setBatch] = useState('Batch A — Morning');
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { loadReport(); }, [batch, month]);

    async function loadReport() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/teacher/attendance/report?batch=${encodeURIComponent(batch)}&month=${month}`);
            if (!res.ok) throw new Error('Failed to load report');
            const data = await res.json();
            setReport(data.report);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        months.push({ val, label });
    }

    return (
        <div>
            <div className="att-controls">
                <select value={batch} onChange={e => setBatch(e.target.value)}>
                    <option>Batch A — Morning</option>
                    <option>Batch B — Evening</option>
                    <option>Batch C — Weekend</option>
                </select>
                <select value={month} onChange={e => setMonth(e.target.value)}>
                    {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
            </div>
            {loading ? (
                <div className="teacher-loading">Loading report…</div>
            ) : error ? (
                <div className="teacher-error-card">{error}</div>
            ) : (
                <div className="teacher-panel">
                    <div className="panel-header">
                        <h2>Monthly Attendance Report</h2>
                        <span>{report.length} students</span>
                    </div>
                    <div className="teacher-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Late</th>
                                    <th>Attendance %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.length === 0 ? (
                                    <tr><td colSpan={5}><div className="empty-state">No attendance records for this period.</div></td></tr>
                                ) : report.map((row, i) => {
                                    const total = row.present + row.absent + row.late;
                                    const pct = total > 0 ? Math.round((row.present / total) * 100) : 0;
                                    const color = getAttColor(pct);
                                    const [bg, fg] = avatarColors(i);
                                    return (
                                        <tr key={row.email}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="att-avatar" style={{ background: bg, color: fg }}>{initials(row.name)}</div>
                                                    {row.name}
                                                </div>
                                            </td>
                                            <td><span className="att-tag att-tag-present">{row.present}</span></td>
                                            <td><span className="att-tag att-tag-absent">{row.absent}</span></td>
                                            <td><span className="att-tag att-tag-late">{row.late}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="pct-bar-bg">
                                                        <div className="pct-bar" style={{ width: `${pct}%`, background: color }} />
                                                    </div>
                                                    <span style={{ color, fontWeight: 700, fontSize: '0.88rem', minWidth: 36 }}>{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
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

    useEffect(() => {
        if (!selectedEmail) return;
        setLoading(true);
        fetch(`/api/teacher/attendance/student?email=${encodeURIComponent(selectedEmail)}`)
            .then(r => r.json())
            .then(d => setRecord(d))
            .catch(() => setRecord(null))
            .finally(() => setLoading(false));
    }, [selectedEmail]);

    const selectedStudent = students.find(s => s.email === selectedEmail);

    // Build calendar days for current month from record
    const calendarDays = () => {
        if (!record?.days) return [];
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const result = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            result.push({ day: d, status: record.days[key] || 'x' });
        }
        return result;
    };

    const dayClass = { present: 'day-p', absent: 'day-a', late: 'day-l', x: 'day-x', holiday: 'day-h' };

    return (
        <div className="teacher-grid">
            <div className="teacher-panel">
                <div className="panel-header"><h2>Students</h2><span>{students.length} enrolled</span></div>
                <div className="teacher-table-wrap">
                    <table>
                        <thead>
                            <tr><th>Name</th><th>Email</th><th></th></tr>
                        </thead>
                        <tbody>
                            {students.map((s, i) => {
                                const [bg, fg] = avatarColors(i);
                                return (
                                    <tr key={s.email} className={selectedEmail === s.email ? 'selected' : ''} onClick={() => setSelectedEmail(s.email)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="att-avatar" style={{ background: bg, color: fg }}>{initials(s.name)}</div>
                                                {s.name}
                                            </div>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{s.email}</td>
                                        <td><button type="button">View</button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="teacher-panel">
                <div className="panel-header">
                    <h2>Attendance Record</h2>
                    <span>{selectedStudent?.email || 'Select a student'}</span>
                </div>
                {loading ? (
                    <div className="teacher-loading">Loading…</div>
                ) : !record ? (
                    <div className="empty-state">Select a student to view their attendance record.</div>
                ) : (
                    <div className="student-detail-card">
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
                            <h3 style={{ marginBottom: '0.75rem' }}>
                                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Calendar
                            </h3>
                            <div className="month-grid">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(l => (
                                    <div key={l} className="day-label">{l}</div>
                                ))}
                                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}
                                {calendarDays().map(({ day, status }) => (
                                    <div key={day} className={`day-cell ${dayClass[status] || 'day-x'}`} title={status}>{day}</div>
                                ))}
                            </div>
                            <div className="legend">
                                {[['day-p', 'Present'], ['day-a', 'Absent'], ['day-l', 'Late'], ['day-h', 'Holiday'], ['day-x', 'No class']].map(([cls, label]) => (
                                    <div key={cls} className="legend-item">
                                        <div className={`legend-dot ${cls}`} />{label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="results-section">
                            <h3>Recent Sessions</h3>
                            <div className="results-list">
                                {(record.recent || []).length === 0 ? (
                                    <div className="empty-state">No records yet.</div>
                                ) : record.recent.map((r, i) => (
                                    <div key={i} className="result-row">
                                        <div>
                                            <strong>{r.batch}</strong>
                                            <span>{formatDate(r.date)}</span>
                                        </div>
                                        <span className={`att-tag att-tag-${r.status}`}>{r.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Teacher Page ────────────────────────────────────────────────────────

export default function TeacherPage() {
    const router = useRouter();
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [summary, setSummary] = useState({ totalStudents: 0, totalTests: 0, avgAccuracy: 0 });
    const [activeTab, setActiveTab] = useState('students'); // 'students' | 'attendance'
    const [attSubTab, setAttSubTab] = useState('mark');    // 'mark' | 'report' | 'student'

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

    // ── Auth Screen ──────────────────────────────────────────────────────────
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
          .teacher-auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #e0f2fe, #f8fafc); color: #0f172a; font-family: 'Segoe UI', system-ui, sans-serif; padding: 1rem; }
          .teacher-auth-card { width: 100%; max-width: 420px; background: #ffffff; border: 1px solid #dbeafe; border-radius: 24px; padding: 2rem; text-align: center; box-shadow: 0 30px 80px rgba(15,23,42,0.08); }
          .teacher-auth-card h1 { margin-bottom: 0.5rem; font-size: 1.9rem; color: #0f172a; }
          .teacher-auth-card p { margin-bottom: 1.5rem; color: #475569; }
          .teacher-auth-card input { width: 100%; padding: 0.95rem 1rem; border-radius: 14px; border: 1px solid #dbeafe; background: #f8fafc; color: #0f172a; margin-bottom: 1rem; outline: none; }
          .teacher-auth-card input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }
          .teacher-auth-card button { width: 100%; padding: 0.95rem 1rem; border: none; border-radius: 14px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; font-weight: 700; cursor: pointer; margin-bottom: 0.75rem; }
          .teacher-back { background: transparent; border: 1px solid #dbeafe; color: #475569; }
          .teacher-error { color: #ef4444; margin-bottom: 1rem; font-size: 0.95rem; }
        `}</style>
            </div>
        );
    }

    // ── Dashboard ────────────────────────────────────────────────────────────
    return (
        <div className="teacher-page">
            <nav className="teacher-nav">
                <div className="teacher-nav-brand">👩‍🏫 Teacher Dashboard</div>
                <div className="teacher-nav-actions">
                    <button
                        className={`teacher-nav-btn${activeTab === 'students' ? ' teacher-nav-btn-active' : ''}`}
                        onClick={() => setActiveTab('students')}
                    >
                        Students
                    </button>
                    <button
                        className={`teacher-nav-btn${activeTab === 'attendance' ? ' teacher-nav-btn-active' : ''}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        Attendance
                    </button>
                    <button className="teacher-nav-btn" onClick={() => router.push('/')}>Home</button>
                    <button className="teacher-nav-btn logout" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="teacher-content">

                {/* ── STUDENTS TAB ── */}
                {activeTab === 'students' && (
                    <>
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
                    </>
                )}

                {/* ── ATTENDANCE TAB ── */}
                {activeTab === 'attendance' && (
                    <>
                        <header className="teacher-hero">
                            <div>
                                <h1>Attendance Management</h1>
                                <p>Mark daily attendance, view monthly reports, and track individual student records from MongoDB.</p>
                            </div>
                            <div className="teacher-summary">
                                <div><span>{summary.totalStudents}</span><small>Students</small></div>
                                <div><span style={{ color: '#16a34a' }}>—</span><small>Present Today</small></div>
                                <div><span style={{ color: '#ef4444' }}>—</span><small>Absent Today</small></div>
                            </div>
                        </header>

                        <div className="att-tabs">
                            {[['mark', 'Mark Attendance'], ['report', 'Monthly Report'], ['student', 'Student Records']].map(([id, label]) => (
                                <button
                                    key={id}
                                    className={`att-tab${attSubTab === id ? ' att-tab-active' : ''}`}
                                    onClick={() => setAttSubTab(id)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="teacher-loading">Loading student data…</div>
                        ) : error ? (
                            <div className="teacher-error-card">{error}</div>
                        ) : (
                            <>
                                {attSubTab === 'mark' && <AttMarkTab students={students} />}
                                {attSubTab === 'report' && <AttReportTab students={students} />}
                                {attSubTab === 'student' && <AttStudentTab students={students} />}
                            </>
                        )}
                    </>
                )}
            </div>

            <style jsx>{`
        /* ── Base ── */
        .teacher-page { min-height: 100vh; background: linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%); color: #0f172a; font-family: 'Segoe UI', system-ui, sans-serif; }

        /* ── Nav ── */
        .teacher-nav { display: flex; align-items: center; justify-content: space-between; padding: 1.15rem 1.5rem; border-bottom: 1px solid #dbeafe; background: #ffffff; position: sticky; top: 0; z-index: 20; box-shadow: 0 10px 30px rgba(15,23,42,0.05); }
        .teacher-nav-brand { font-weight: 700; letter-spacing: 0.02em; color: #0f172a; }
        .teacher-nav-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .teacher-nav-btn { border: 1px solid #dbeafe; background: #eff6ff; color: #2563eb; border-radius: 10px; padding: 0.6rem 1rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
        .teacher-nav-btn-active { background: linear-gradient(135deg, #2563eb, #1d4ed8) !important; color: #fff !important; border-color: #2563eb !important; }
        .teacher-nav-btn.logout { background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; border-color: #ef4444; }

        /* ── Content ── */
        .teacher-content { max-width: 1280px; margin: 0 auto; padding: 1.5rem; }
        .teacher-hero { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1.75rem; }
        .teacher-hero h1 { font-size: clamp(2rem, 2.8vw, 3rem); margin-bottom: 0.6rem; line-height: 1.05; color: #0f172a; }
        .teacher-hero p { max-width: 680px; color: #475569; font-size: 1rem; }
        .teacher-summary { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap: 1rem; align-items: stretch; }
        .teacher-summary div { background: #ffffff; border: 1px solid #dbeafe; border-radius: 18px; padding: 1.25rem 1.35rem; text-align: center; box-shadow: 0 18px 40px rgba(15,23,42,0.05); }
        .teacher-summary span { display: block; font-size: 2rem; font-weight: 800; margin-bottom: 0.35rem; color: #0f172a; }
        .teacher-summary small { color: #64748b; }
        .teacher-loading, .teacher-error-card { padding: 2rem 1.5rem; background: #ffffff; border: 1px solid #dbeafe; border-radius: 18px; text-align: center; box-shadow: 0 18px 40px rgba(15,23,42,0.05); }
        .teacher-error-card { color: #ef4444; }

        /* ── Grid & Panel ── */
        .teacher-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; }
        .teacher-panel { background: #ffffff; border: 1px solid #dbeafe; border-radius: 20px; padding: 1.5rem; box-shadow: 0 18px 40px rgba(15,23,42,0.05); }
        .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .panel-header h2 { margin: 0; font-size: 1.05rem; color: #0f172a; }
        .panel-header span { color: #64748b; font-size: 0.9rem; }

        /* ── Table ── */
        .teacher-table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 500px; }
        th, td { padding: 0.95rem 0.85rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { color: #64748b; font-size: 0.84rem; text-transform: uppercase; letter-spacing: 0.04em; }
        td button { padding: 0.5rem 0.9rem; border-radius: 10px; border: none; background: #eff6ff; color: #2563eb; cursor: pointer; }
        tr:hover td { background: #f8fafc; }
        tr.selected td { background: #dbeafe; }

        /* ── Student Detail ── */
        .student-detail-card { display: grid; gap: 1rem; }
        .student-info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .student-info-row div { background: #f8fafc; border: 1px solid #dbeafe; border-radius: 16px; padding: 1rem; }
        .student-info-row strong { display: block; color: #64748b; margin-bottom: 0.5rem; font-size: 0.82rem; }
        .student-info-row span { font-size: 1rem; font-weight: 700; color: #0f172a; }
        .student-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
        .student-metrics div { background: #f8fafc; border: 1px solid #dbeafe; border-radius: 16px; padding: 1rem; text-align: center; }
        .student-metrics strong { display: block; color: #64748b; font-size: 0.82rem; margin-bottom: 0.5rem; }
        .student-insights { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .insight-block { background: #ffffff; border: 1px solid #dbeafe; border-radius: 18px; padding: 1rem; }
        .insight-block h3 { margin: 0 0 0.75rem; font-size: 1rem; color: #0f172a; }
        .topic-grid { display: grid; gap: 0.75rem; }
        .topic-chip { padding: 0.75rem 1rem; border-radius: 14px; background: #eff6ff; color: #2563eb; font-size: 0.9rem; }
        .topic-chip.clear { border: 1px solid #a7f3d0; }
        .topic-chip.weak { border: 1px solid #fecaca; }
        .results-section h3 { margin: 0 0 0.75rem; font-size: 1rem; color: #0f172a; }
        .results-list { display: grid; gap: 0.75rem; }
        .result-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.95rem 1rem; border-radius: 16px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .result-row strong { display: block; font-size: 0.95rem; color: #0f172a; }
        .result-row span { color: #64748b; font-size: 0.85rem; }
        .wrong-questions-section { margin-top: 1rem; }
        .wrong-questions-section h3 { margin: 0 0 0.75rem; font-size: 1rem; color: #0f172a; }
        .wrong-list { display: grid; gap: 0.75rem; }
        .wrong-row { background: #ffffff; border: 1px solid #dbeafe; border-radius: 16px; padding: 1rem; display: grid; gap: 0.5rem; }
        .wrong-row p { margin: 0.25rem 0 0; color: #475569; font-size: 0.95rem; line-height: 1.4; }
        .wrong-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .wrong-label { font-size: 0.85rem; color: #ef4444; }
        .correct-label { font-size: 0.85rem; color: #16a34a; }
        .empty-state { padding: 1.5rem; border-radius: 16px; border: 1px dashed #93c5fd; color: #64748b; text-align: center; background: #eff6ff; }

        /* ── Attendance Tabs ── */
        .att-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; background: #e2e8f0; border-radius: 14px; padding: 4px; }
        .att-tab { flex: 1; text-align: center; padding: 0.55rem 0.5rem; border-radius: 10px; border: none; background: transparent; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #64748b; }
        .att-tab-active { background: #ffffff; color: #2563eb; border: 1px solid #dbeafe; box-shadow: 0 2px 8px rgba(15,23,42,0.08); }

        /* ── Attendance Controls ── */
        .att-controls { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 1.25rem; }
        .att-controls select, .att-controls input[type="date"] { border: 1px solid #dbeafe; background: #ffffff; color: #0f172a; border-radius: 12px; padding: 0.65rem 1rem; font-size: 0.9rem; outline: none; cursor: pointer; }
        .att-controls select:focus, .att-controls input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        .att-controls-right { margin-left: auto; display: flex; gap: 0.75rem; }
        .att-btn { border: none; border-radius: 12px; padding: 0.65rem 1.2rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
        .att-btn-primary { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; }
        .att-btn-outline { background: #eff6ff; border: 1px solid #dbeafe; color: #2563eb; }
        .att-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Attendance Stat Row ── */
        .att-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
        .att-stat-card { background: #ffffff; border: 1px solid #dbeafe; border-radius: 18px; padding: 1rem 1.25rem; text-align: center; box-shadow: 0 18px 40px rgba(15,23,42,0.05); }
        .att-stat-card span { display: block; font-size: 1.75rem; font-weight: 800; margin-bottom: 0.2rem; }
        .att-stat-card small { color: #64748b; font-size: 0.8rem; }

        /* ── Status Buttons ── */
        .status-btn { border: 1px solid transparent; border-radius: 8px; padding: 0.35rem 0.7rem; cursor: pointer; font-size: 0.78rem; font-weight: 600; background: #f1f5f9; color: #64748b; }
        .status-present.status-active { background: #dcfce7; color: #15803d; border-color: #86efac; }
        .status-absent.status-active { background: #fee2e2; color: #b91c1c; border-color: #fca5a5; }
        .status-late.status-active { background: #fef3c7; color: #b45309; border-color: #fde68a; }

        /* ── Note Input ── */
        .note-input { border: 1px solid #dbeafe; border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.78rem; width: 110px; background: #f8fafc; color: #0f172a; outline: none; }
        .note-input:focus { border-color: #2563eb; }

        /* ── Attendance Tags ── */
        .att-tag { display: inline-block; padding: 0.25rem 0.65rem; border-radius: 8px; font-size: 0.78rem; font-weight: 600; }
        .att-tag-present { background: #dcfce7; color: #15803d; }
        .att-tag-absent { background: #fee2e2; color: #b91c1c; }
        .att-tag-late { background: #fef3c7; color: #b45309; }

        /* ── Progress Bar ── */
        .pct-bar-bg { background: #e2e8f0; border-radius: 99px; height: 6px; flex: 1; }
        .pct-bar { height: 6px; border-radius: 99px; }

        /* ── Avatar ── */
        .att-avatar { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }

        /* ── Save Message ── */
        .save-msg { padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem; }
        .save-msg-ok { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .save-msg-err { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

        /* ── Calendar ── */
        .month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .day-label { text-align: center; font-size: 0.7rem; color: #64748b; font-weight: 600; padding: 2px; }
        .day-cell { aspect-ratio: 1; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 600; }
        .day-p { background: #dcfce7; color: #15803d; }
        .day-a { background: #fee2e2; color: #b91c1c; }
        .day-l { background: #fef3c7; color: #b45309; }
        .day-x { background: #f1f5f9; color: #cbd5e1; }
        .day-h { background: #e0e7ff; color: #6366f1; }
        .legend { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.75rem; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; color: #64748b; }
        .legend-dot { width: 10px; height: 10px; border-radius: 3px; }

        /* ── Responsive ── */
        @media (max-width: 980px) {
          .teacher-grid { grid-template-columns: 1fr; }
          .student-info-row { grid-template-columns: 1fr; }
          .student-metrics { grid-template-columns: 1fr; }
          .att-stat-row { grid-template-columns: repeat(2, 1fr); }
          .teacher-summary { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .att-controls-right { margin-left: 0; }
          .teacher-summary { grid-template-columns: 1fr; }
          .att-stat-row { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
        </div>
    );
}