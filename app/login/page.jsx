'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, setUser, registerUser } from '../../lib/storage';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const user = getUser();
    if (user) router.replace('/dashboard');
  }, [router]);

  function validate() {
    const errs = {};
    if (!name || name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      const user = await registerUser({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() });
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Could not connect to server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="radar-bg">
        {[1, 2, 3, 4].map(i => <div key={i} className={`ring ring-${i}`} />)}
        <div className="sweep" />
      </div>

      <div className="card">
        <div className="logo">
          <span className="logo-icon">✈</span>
          <div>
            <div className="logo-title">DGCA Prep</div>
            <div className="logo-sub">PILOT EXAM PLATFORM</div>
          </div>
        </div>

        <h2 className="heading">Create Your Profile</h2>
        <p className="subheading">Start your journey to becoming a licensed pilot</p>

        {apiError && <div className="api-error">⚠️ {apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Arjun Sharma" className={errors.name ? 'error' : ''} disabled={loading} />
            {errors.name && <span className="err">{errors.name}</span>}
          </div>
          <div className="field">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. arjun@email.com" className={errors.email ? 'error' : ''} disabled={loading} />
            {errors.email && <span className="err">{errors.email}</span>}
          </div>
          <div className="field">
            <label>Mobile Number</label>
            <div className="phone-wrap">
              <span className="prefix">+91</span>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" className={errors.phone ? 'error' : ''} disabled={loading} />
            </div>
            {errors.phone && <span className="err">{errors.phone}</span>}
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner-wrap"><span className="spinner" /> Connecting to server...</span> : 'Begin Training →'}
          </button>
        </form>
        <div className="teacher-link">
          <span>Are you a teacher?</span>
          <button type="button" className="teacher-btn" onClick={() => router.push('/teacher')}>Teacher Dashboard</button>
        </div>
      </div>

      <style jsx>{`
        .page { min-height:100vh; display:flex; align-items:center; justify-content:center; background: linear-gradient(135deg, #e0f2fe, #f8fafc); padding:1rem; position:relative; overflow:hidden; font-family:'Segoe UI',system-ui,sans-serif; color:#0f172a; }
        .radar-bg { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:0; }
        .ring { position:absolute; border-radius:50%; border:1px solid rgba(59,130,246,0.12); animation:expand 4s ease-out infinite; }
        .ring-1{width:200px;height:200px;animation-delay:0s}
        .ring-2{width:400px;height:400px;animation-delay:1s}
        .ring-3{width:600px;height:600px;animation-delay:2s}
        .ring-4{width:800px;height:800px;animation-delay:3s}
        @keyframes expand{0%{opacity:.5;transform:scale(.95)}100%{opacity:0;transform:scale(1.05)}}
        .sweep { position:absolute; width:400px; height:400px; border-radius:50%; background:conic-gradient(from 0deg,transparent 340deg,rgba(59,130,246,0.12) 360deg); animation:sweep 4s linear infinite; }
        @keyframes sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .card { position:relative; z-index:1; background:#ffffff; border:1px solid rgba(59,130,246,0.18); border-radius:20px; padding:2.5rem 2rem; width:100%; max-width:440px; box-shadow:0 30px 80px rgba(15,23,42,0.08); }
        .logo { display:flex; align-items:center; gap:.75rem; margin-bottom:2rem; justify-content:center; }
        .logo-icon { font-size:2rem; color:#2563eb; }
        .logo-title { font-size:1.5rem; font-weight:700; color:#0f172a; letter-spacing:.05em; }
        .logo-sub { font-size:.65rem; color:#2563eb; letter-spacing:.15em; font-weight:700; }
        .heading { font-size:1.4rem; font-weight:700; color:#0f172a; text-align:center; margin-bottom:.35rem; }
        .subheading { font-size:.85rem; color:#475569; text-align:center; margin-bottom:1.25rem; }
        .api-error { background:#fee2e2; border:1px solid #fecaca; border-radius:8px; padding:.75rem 1rem; color:#b91c1c; font-size:.85rem; margin-bottom:1rem; }
        .field { margin-bottom:1.2rem; }
        .field label { display:block; font-size:.82rem; font-weight:600; color:#475569; margin-bottom:.4rem; }
        .field input { width:100%; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:.8rem 1rem; color:#0f172a; font-size:.95rem; outline:none; transition:border-color .2s,box-shadow .2s; }
        .field input:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
        .field input.error { border-color:#f87171; }
        .field input::placeholder { color:#94a3b8; }
        .field input:disabled { opacity:.75; }
        .phone-wrap { display:flex; align-items:center; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; overflow:hidden; transition:border-color .2s; }
        .phone-wrap:focus-within { border-color:#2563eb; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
        .prefix { background:#eff6ff; color:#2563eb; padding:.75rem .85rem; font-size:.9rem; font-weight:700; border-right:1px solid #cbd5e1; white-space:nowrap; }
        .phone-wrap input { background:transparent; border:none!important; border-radius:0!important; box-shadow:none!important; flex:1; }
        .err { display:block; margin-top:.35rem; font-size:.78rem; color:#ef4444; }
        .submit-btn { width:100%; padding:.95rem; background:linear-gradient(135deg,#2563eb,#1d4ed8); border:none; border-radius:10px; color:#fff; font-size:1rem; font-weight:700; cursor:pointer; margin-top:.75rem; transition:opacity .2s,transform .15s; }
        .submit-btn:hover:not(:disabled){opacity:.95;transform:translateY(-1px)}
        .submit-btn:disabled{opacity:.7;cursor:not-allowed}
        .teacher-link{margin-top:1rem;display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center;justify-content:center;color:#64748b;font-size:.9rem;}
        .teacher-btn{background:#ffffff;border:1px solid #cbd5e1;border-radius:10px;padding:.75rem 1rem;color:#0f172a;cursor:pointer;}
        .teacher-btn:hover{background:#eef2ff}
        .spinner-wrap{display:flex;align-items:center;justify-content:center;gap:.5rem}
        .spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(37,99,235,.25);border-top-color:#2563eb;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:480px){.card{padding:2rem 1.25rem}}
      `}</style>
    </div>
  );
}
