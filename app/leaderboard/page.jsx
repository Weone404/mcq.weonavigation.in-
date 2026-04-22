'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getLeaderboard } from '../../lib/storage';

function getInitials(name) {
  return name ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2) : '??';
}
function getAccuracyColor(pct) {
  if (pct >= 80) return '#00c864';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
    getLeaderboard()
      .then(setBoard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (!user) return null;

  const top3 = board.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : top3;
  const podiumHeights = [120, 160, 100];
  const podiumColors = ['#94a3b8', '#f59e0b', '#cd7f32'];
  const medals = ['🥇', '🥈', '🥉'];
  const podiumRanks = top3.length === 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : [0];

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <button className="back-btn" onClick={() => router.push('/dashboard')}>← Dashboard</button>
          <span className="nav-title">🏆 Leaderboard</span>
          <div style={{width:100}} />
        </div>
      </nav>

      <div className="content">
        <p className="subtitle">Rankings based on accuracy across all tests</p>

        {loading ? (
          <div className="loading-row"><span className="spinner" /> Loading leaderboard from database...</div>
        ) : board.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <p className="empty-msg">No rankings yet. Complete a test to appear here!</p>
            <button className="cta-btn" onClick={() => router.push('/dashboard')}>Start a Test →</button>
          </div>
        ) : (
          <>
            {top3.length >= 2 && (
              <div className="podium">
                {podiumOrder.map((entry, i) => {
                  const rank = podiumRanks[i];
                  const isYou = entry.email === user.email;
                  const h = podiumHeights[i];
                  const color = podiumColors[rank];
                  return (
                    <div key={entry.email} className="podium-col">
                      <div className="podium-name" style={{color: isYou ? '#00c864' : '#e2e8f0'}}>{entry.name.split(' ')[0]}</div>
                      <div className="podium-pct" style={{color}}>{entry.accuracy}%</div>
                      <div className="podium-medal">{medals[rank]}</div>
                      <div className="podium-block" style={{height:h, background:`${color}22`, border:`2px solid ${color}`, borderBottom:'none'}}>
                        <span className="podium-rank" style={{color}}>#{rank+1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="table-section">
              <h2 className="table-title">All Rankings</h2>
              <div className="table-list">
                {board.map((entry, i) => {
                  const isYou = entry.email === user.email;
                  const rank = i + 1;
                  const medal = rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':`#${rank}`;
                  return (
                    <div key={entry.email} className={`row ${isYou ? 'row-you' : ''}`}>
                      <div className="rank-cell">{medal}</div>
                      <div className={`av-circle ${isYou ? 'av-you' : ''}`}>{getInitials(entry.name)}</div>
                      <div className="info-cell">
                        <div className="entry-name">{entry.name}{isYou && <span className="you-badge">You</span>}</div>
                        <div className="entry-meta">{entry.testsAttempted} tests · {entry.totalScore}/{entry.totalQuestions} correct</div>
                      </div>
                      <div className="accuracy-cell">
                        <div className="acc-val" style={{color:getAccuracyColor(entry.accuracy)}}>{entry.accuracy}%</div>
                        <div className="acc-bar-bg"><div className="acc-bar-fill" style={{width:`${entry.accuracy}%`, background:getAccuracyColor(entry.accuracy)}} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .page{min-height:100vh;background:#070b14;font-family:'Segoe UI',system-ui,sans-serif;color:#e2e8f0}
        .nav{position:sticky;top:0;z-index:100;background:rgba(10,16,30,.98);border-bottom:1px solid rgba(255,255,255,.06);backdrop-filter:blur(10px)}
        .nav-inner{max-width:800px;margin:0 auto;padding:0 1.5rem;height:60px;display:flex;align-items:center;justify-content:space-between}
        .back-btn{background:none;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.4rem .85rem;color:#e2e8f0;font-size:.85rem;cursor:pointer}
        .nav-title{font-size:1.1rem;font-weight:700;color:#fff}
        .content{max-width:800px;margin:0 auto;padding:2rem 1.5rem}
        .subtitle{text-align:center;color:#6b7a8f;font-size:.88rem;margin-bottom:2rem}
        .loading-row{display:flex;align-items:center;gap:.75rem;color:#6b7a8f;padding:2rem 0;font-size:.9rem}
        .spinner{display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.1);border-top-color:#00c864;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{text-align:center;padding:4rem 1rem}
        .empty-icon{font-size:3.5rem;margin-bottom:1rem}
        .empty-msg{color:#6b7a8f;margin-bottom:1.5rem}
        .cta-btn{background:linear-gradient(135deg,#00c864,#00a050);border:none;border-radius:8px;padding:.75rem 1.5rem;color:#fff;font-size:1rem;font-weight:700;cursor:pointer}
        .podium{display:flex;align-items:flex-end;justify-content:center;gap:.5rem;margin-bottom:2.5rem;padding:0 1rem}
        .podium-col{display:flex;flex-direction:column;align-items:center;flex:1;max-width:160px}
        .podium-name{font-size:.85rem;font-weight:700;margin-bottom:.2rem;text-align:center}
        .podium-pct{font-size:.9rem;font-weight:700;margin-bottom:.3rem}
        .podium-medal{font-size:1.5rem;margin-bottom:.3rem}
        .podium-block{width:100%;display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0}
        .podium-rank{font-size:1.1rem;font-weight:800}
        .table-title{font-size:1rem;font-weight:700;color:#fff;margin-bottom:1rem}
        .table-list{display:flex;flex-direction:column;gap:.6rem}
        .row{display:flex;align-items:center;gap:.85rem;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:.85rem 1rem}
        .row-you{background:rgba(0,200,100,.05)!important;border-color:rgba(0,200,100,.25)!important}
        .rank-cell{width:36px;text-align:center;font-size:.85rem;font-weight:700;flex-shrink:0}
        .av-circle{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;flex-shrink:0}
        .av-you{background:linear-gradient(135deg,#00c864,#00a050)!important;color:#fff!important}
        .info-cell{flex:1;min-width:0}
        .entry-name{font-size:.92rem;font-weight:600;color:#fff;display:flex;align-items:center;gap:.4rem}
        .you-badge{background:rgba(0,200,100,.15);color:#00c864;font-size:.7rem;padding:.1rem .4rem;border-radius:10px;border:1px solid rgba(0,200,100,.3)}
        .entry-meta{font-size:.75rem;color:#6b7a8f;margin-top:.15rem}
        .accuracy-cell{text-align:right;flex-shrink:0;min-width:70px}
        .acc-val{font-size:.95rem;font-weight:700;margin-bottom:.3rem}
        .acc-bar-bg{height:4px;background:rgba(255,255,255,.06);border-radius:2px;width:64px;margin-left:auto;overflow:hidden}
        .acc-bar-fill{height:100%;border-radius:2px}
        @media(max-width:480px){.content{padding:1rem}}
      `}</style>
    </div>
  );
}
