'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser, getResults } from '../../lib/storage';
import { chapters } from '../../data/questions';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function getScoreColor(pct) {
  if (pct >= 80) return '#00c864';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const latestScore = searchParams.get('score');
  const latestTotal = searchParams.get('total');
  const latestChapterId = searchParams.get('chapter');

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
    getResults(u.email)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (!user) return null;

  const latestPct = latestScore && latestTotal ? Math.round((Number(latestScore)/Number(latestTotal))*100) : null;
  const latestChapter = latestChapterId ? chapters.find(c => c.id === latestChapterId) : null;

  function getLatestEmoji(pct) { return pct>=80?'🏆':pct>=50?'✈️':'📚'; }

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <button className="back-btn" onClick={() => router.push('/dashboard')}>← Dashboard</button>
          <span className="nav-title">📈 Test History</span>
          <div style={{width:100}} />
        </div>
      </nav>

      <div className="content">
        {latestPct !== null && latestChapter && (
          <div className="banner" style={{borderColor:`${getScoreColor(latestPct)}44`, background:`${getScoreColor(latestPct)}10`}}>
            <span className="banner-emoji">{getLatestEmoji(latestPct)}</span>
            <div className="banner-info">
              <div className="banner-title">Latest Result: {latestChapter.icon} {latestChapter.title}</div>
              <div className="banner-score" style={{color:getScoreColor(latestPct)}}>{latestScore}/{latestTotal} — {latestPct}%</div>
            </div>
          </div>
        )}

        <h2 className="section-title">All Results</h2>

        {loading ? (
          <div className="loading-row"><span className="spinner" /> Loading your results from database...</div>
        ) : results.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <p className="empty-msg">No test results yet. Start your first test!</p>
            <button className="cta-btn" onClick={() => router.push('/dashboard')}>Start Now →</button>
          </div>
        ) : (
          <div className="results-list">
            {results.map(r => {
              const pct = r.total > 0 ? Math.round((r.score/r.total)*100) : 0;
              const ch = chapters.find(c => c.id === r.chapterId);
              return (
                <div key={r.id} className="result-card">
                  <div className="rc-icon">{ch?.icon ?? '📝'}</div>
                  <div className="rc-info">
                    <div className="rc-name">{ch?.title ?? r.chapterId}</div>
                    <div className="rc-date">{formatDate(r.date)}</div>
                  </div>
                  <div className="rc-score-wrap">
                    <div className="rc-score" style={{color:getScoreColor(pct)}}>{r.score}/{r.total}</div>
                    <div className="rc-pct" style={{color:getScoreColor(pct)}}>{pct}%</div>
                    <div className="rc-bar-bg"><div className="rc-bar-fill" style={{width:`${pct}%`, background:getScoreColor(pct)}} /></div>
                  </div>
                  <button className="retry-btn" onClick={() => router.push(`/test/${r.chapterId}`)}>Retry</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .page{min-height:100vh;background:#070b14;font-family:'Segoe UI',system-ui,sans-serif;color:#e2e8f0}
        .nav{position:sticky;top:0;z-index:100;background:rgba(10,16,30,.98);border-bottom:1px solid rgba(255,255,255,.06);backdrop-filter:blur(10px)}
        .nav-inner{max-width:800px;margin:0 auto;padding:0 1.5rem;height:60px;display:flex;align-items:center;justify-content:space-between}
        .back-btn{background:none;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.4rem .85rem;color:#e2e8f0;font-size:.85rem;cursor:pointer}
        .nav-title{font-size:1.1rem;font-weight:700;color:#fff}
        .content{max-width:800px;margin:0 auto;padding:2rem 1.5rem}
        .loading-row{display:flex;align-items:center;gap:.75rem;color:#6b7a8f;padding:2rem 0;font-size:.9rem}
        .spinner{display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.1);border-top-color:#00c864;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .banner{display:flex;align-items:center;gap:1rem;border:1px solid;border-radius:14px;padding:1.25rem 1.5rem;margin-bottom:2rem}
        .banner-emoji{font-size:2.5rem}.banner-title{font-size:.9rem;color:#e2e8f0;margin-bottom:.2rem}
        .banner-score{font-size:1.3rem;font-weight:800}
        .section-title{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:1rem}
        .empty{text-align:center;padding:4rem 1rem}
        .empty-icon{font-size:3.5rem;margin-bottom:1rem}
        .empty-msg{color:#6b7a8f;margin-bottom:1.5rem}
        .cta-btn{background:linear-gradient(135deg,#00c864,#00a050);border:none;border-radius:8px;padding:.75rem 1.5rem;color:#fff;font-size:1rem;font-weight:700;cursor:pointer}
        .results-list{display:flex;flex-direction:column;gap:.75rem}
        .result-card{display:flex;align-items:center;gap:1rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:1rem 1.1rem}
        .rc-icon{font-size:1.75rem;flex-shrink:0}
        .rc-info{flex:1;min-width:0}
        .rc-name{font-size:.92rem;font-weight:600;color:#fff}
        .rc-date{font-size:.75rem;color:#6b7a8f;margin-top:.15rem}
        .rc-score-wrap{text-align:right;flex-shrink:0}
        .rc-score{font-size:1rem;font-weight:700}
        .rc-pct{font-size:.8rem;font-weight:600;margin-bottom:.35rem}
        .rc-bar-bg{height:4px;width:60px;background:rgba(255,255,255,.06);border-radius:2px;margin-left:auto;overflow:hidden}
        .rc-bar-fill{height:100%;border-radius:2px}
        .retry-btn{background:none;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:.4rem .85rem;color:#e2e8f0;font-size:.82rem;cursor:pointer;flex-shrink:0;transition:background .15s}
        .retry-btn:hover{background:rgba(255,255,255,.06)}
        @media(max-width:480px){.content{padding:1rem}.result-card{flex-wrap:wrap}}
      `}</style>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',background:'#070b14',display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7a8f',fontFamily:'system-ui'}}>
        Loading results...
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
