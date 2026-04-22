'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearUser, getStats, getResults } from '../../lib/storage';
import { chapters } from '../../data/questions';

function getInitials(name) {
  return name ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2) : '??';
}
function getBadge(stats) {
  if (stats.testsAttempted === 0) return { icon:'🛩️', label:'Cadet', color:'#6b7a8f' };
  if (stats.avgScore >= 80) return { icon:'🥇', label:'Ace Pilot', color:'#f59e0b' };
  if (stats.avgScore >= 60) return { icon:'🥈', label:'Co-Pilot', color:'#94a3b8' };
  return { icon:'🥉', label:'Student Pilot', color:'#cd7f32' };
}
function getScoreColor(pct) {
  if (pct >= 80) return '#00c864';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [stats, setStats] = useState({ testsAttempted:0, avgScore:0, bestScore:0, totalQuestions:0 });
  const [recentResults, setRecentResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUserState(u);
    Promise.all([getStats(u.email), getResults(u.email)])
      .then(([s, r]) => {
        setStats(s);
        setAllResults(r);
        setRecentResults(r.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() { clearUser(); router.replace('/login'); }

  function getBestForChapter(chapterId) {
    const rs = allResults.filter(r => r.chapterId === chapterId);
    if (!rs.length) return null;
    return Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score/r.total)*100) : 0));
  }

  if (!user) return null;
  const badge = getBadge(stats);
  const statCards = [
    { icon:'📋', value:stats.testsAttempted, label:'Tests Attempted', accent:'#00c864' },
    { icon:'🎯', value:`${stats.avgScore}%`, label:'Avg Accuracy', accent:'#3b82f6' },
    { icon:'🏆', value:`${stats.bestScore}%`, label:'Best Score', accent:'#f59e0b' },
    { icon:'❓', value:stats.totalQuestions, label:'Questions Done', accent:'#a855f7' },
  ];

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo"><span className="nav-icon">✈</span><span className="nav-brand">DGCA Prep</span></div>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => router.push('/leaderboard')}>🏆 Leaderboard</button>
            <div className="avatar">{getInitials(user.name)}</div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="content">
        <div className="profile-card">
          <div className="profile-avatar">{getInitials(user.name)}</div>
          <div className="profile-info">
            <div className="profile-name">{user.name}</div>
            <div className="profile-meta">✉ {user.email}</div>
            <div className="profile-meta">📱 +91 {user.phone}</div>
            <div className="profile-meta">📅 Joined {formatDate(user.joinedAt)}</div>
            <div className="badge" style={{ color:badge.color, borderColor:badge.color }}>{badge.icon} {badge.label}</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-row">
            <span className="spinner" /> Loading your stats from database...
          </div>
        ) : (
          <>
            <div className="stats-grid">
              {statCards.map((s,i) => (
                <div key={i} className="stat-card" style={{'--accent':s.accent}}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="section">
              <h2 className="section-title">📚 Chapter-wise Tests</h2>
              <div className="chapters-grid">
                {chapters.map(ch => {
                  const best = getBestForChapter(ch.id);
                  return (
                    <div key={ch.id} className="chapter-card" style={{'--ch-color':ch.color}} onClick={() => router.push(`/test/${ch.id}`)}>
                      <div className="ch-top"><span className="ch-icon">{ch.icon}</span><span className="ch-arrow">→</span></div>
                      <div className="ch-title">{ch.title}</div>
                      <div className="ch-meta">{ch.questionCount} Questions</div>
                      {best !== null && <div className="ch-best" style={{color:getScoreColor(best)}}>Best: {best}%</div>}
                      <div className="ch-bar-bg"><div className="ch-bar-fill" style={{width:`${best ?? 0}%`, background:ch.color}} /></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {recentResults.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">📈 Recent Tests</h2>
                  <button className="view-all" onClick={() => router.push('/results')}>View All →</button>
                </div>
                <div className="results-list">
                  {recentResults.map(r => {
                    const pct = r.total > 0 ? Math.round((r.score/r.total)*100) : 0;
                    const ch = chapters.find(c => c.id === r.chapterId);
                    return (
                      <div key={r.id} className="result-row">
                        <span className="result-icon">{ch?.icon ?? '📝'}</span>
                        <div className="result-info">
                          <div className="result-name">{ch?.title ?? r.chapterId}</div>
                          <div className="result-date">{formatDate(r.date)}</div>
                        </div>
                        <div className="result-score" style={{color:getScoreColor(pct)}}>
                          {r.score}/{r.total} <span className="result-pct">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .page{min-height:100vh;background:#070b14;font-family:'Segoe UI',system-ui,sans-serif;color:#e2e8f0}
        .nav{position:sticky;top:0;z-index:100;background:rgba(10,16,30,.98);border-bottom:1px solid rgba(255,255,255,.06);backdrop-filter:blur(10px)}
        .nav-inner{max-width:1100px;margin:0 auto;padding:0 1.5rem;height:60px;display:flex;align-items:center;justify-content:space-between}
        .nav-logo{display:flex;align-items:center;gap:.5rem}
        .nav-icon{font-size:1.4rem;filter:drop-shadow(0 0 6px #00c864)}
        .nav-brand{font-size:1.1rem;font-weight:700;color:#fff}
        .nav-actions{display:flex;align-items:center;gap:.75rem}
        .nav-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.4rem .85rem;color:#e2e8f0;font-size:.85rem;cursor:pointer;transition:background .2s}
        .nav-btn:hover{background:rgba(255,255,255,.1)}
        .avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#00c864,#00a050);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;color:#fff}
        .logout-btn{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:.4rem .85rem;color:#ef4444;font-size:.85rem;cursor:pointer}
        .content{max-width:1100px;margin:0 auto;padding:2rem 1.5rem}
        .loading-row{display:flex;align-items:center;gap:.75rem;color:#6b7a8f;padding:2rem 0;font-size:.9rem}
        .spinner{display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.1);border-top-color:#00c864;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .profile-card{display:flex;align-items:center;gap:1.5rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.75rem;margin-bottom:1.75rem}
        .profile-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#00c864,#00a050);display:flex;align-items:center;justify-content:center;font-size:1.75rem;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 0 20px rgba(0,200,100,.3)}
        .profile-name{font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:.3rem}
        .profile-meta{font-size:.83rem;color:#6b7a8f;margin-bottom:.2rem}
        .badge{display:inline-block;margin-top:.6rem;padding:.25rem .75rem;border-radius:20px;border:1px solid;font-size:.82rem;font-weight:600}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem}
        .stat-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:1.25rem 1rem;text-align:center;transition:border-color .2s,transform .15s}
        .stat-card:hover{border-top:3px solid var(--accent);transform:translateY(-2px)}
        .stat-icon{font-size:1.5rem;margin-bottom:.5rem}
        .stat-value{font-size:1.6rem;font-weight:800;color:#fff}
        .stat-label{font-size:.75rem;color:#6b7a8f;margin-top:.25rem}
        .section{margin-bottom:2.5rem}
        .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
        .section-title{font-size:1.15rem;font-weight:700;color:#fff;margin-bottom:1rem}
        .view-all{background:none;border:none;color:#00c864;font-size:.85rem;cursor:pointer;padding:0}
        .chapters-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}
        .chapter-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-left:4px solid var(--ch-color);border-radius:12px;padding:1.25rem;cursor:pointer;transition:transform .15s,box-shadow .2s}
        .chapter-card:hover{transform:translateY(-3px);box-shadow:0 0 20px rgba(0,0,0,.4),0 0 0 1px var(--ch-color)}
        .ch-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem}
        .ch-icon{font-size:1.75rem}.ch-arrow{color:#6b7a8f;font-size:1.1rem}
        .ch-title{font-size:1rem;font-weight:700;color:#fff;margin-bottom:.3rem}
        .ch-meta{font-size:.8rem;color:#6b7a8f;margin-bottom:.3rem}
        .ch-best{font-size:.82rem;font-weight:600;margin-bottom:.5rem}
        .ch-bar-bg{height:4px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:.5rem;overflow:hidden}
        .ch-bar-fill{height:100%;border-radius:2px;transition:width .4s}
        .results-list{display:flex;flex-direction:column;gap:.75rem}
        .result-row{display:flex;align-items:center;gap:1rem;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:.9rem 1rem}
        .result-icon{font-size:1.5rem}.result-info{flex:1}
        .result-name{font-size:.9rem;font-weight:600;color:#fff}
        .result-date{font-size:.78rem;color:#6b7a8f;margin-top:.15rem}
        .result-score{font-size:1rem;font-weight:700}.result-pct{font-size:.8rem;font-weight:400}
        @media(max-width:768px){.stats-grid{grid-template-columns:repeat(2,1fr)}.profile-card{flex-direction:column;text-align:center}.nav-brand{display:none}}
        @media(max-width:480px){.content{padding:1rem}.nav-inner{padding:0 1rem}}
      `}</style>
    </div>
  );
}
