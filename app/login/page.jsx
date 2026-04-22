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
      </div>

      <style jsx>{`
        .page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#070b14; padding:1rem; position:relative; overflow:hidden; font-family:'Segoe UI',system-ui,sans-serif; }
        .radar-bg { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:0; }
        .ring { position:absolute; border-radius:50%; border:1px solid rgba(0,200,100,0.08); animation:expand 4s ease-out infinite; }
        .ring-1{width:200px;height:200px;animation-delay:0s}
        .ring-2{width:400px;height:400px;animation-delay:1s}
        .ring-3{width:600px;height:600px;animation-delay:2s}
        .ring-4{width:800px;height:800px;animation-delay:3s}
        @keyframes expand{0%{opacity:.5;transform:scale(.95)}100%{opacity:0;transform:scale(1.05)}}
        .sweep { position:absolute; width:400px; height:400px; border-radius:50%; background:conic-gradient(from 0deg,transparent 340deg,rgba(0,200,100,0.08) 360deg); animation:sweep 4s linear infinite; }
        @keyframes sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .card { position:relative; z-index:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:2.5rem 2rem; width:100%; max-width:440px; backdrop-filter:blur(12px); }
        .logo { display:flex; align-items:center; gap:.75rem; margin-bottom:2rem; justify-content:center; }
        .logo-icon { font-size:2rem; filter:drop-shadow(0 0 8px #00c864); }
        .logo-title { font-size:1.5rem; font-weight:700; color:#fff; letter-spacing:.05em; }
        .logo-sub { font-size:.65rem; color:#00c864; letter-spacing:.15em; font-weight:600; }
        .heading { font-size:1.4rem; font-weight:700; color:#fff; text-align:center; margin-bottom:.35rem; }
        .subheading { font-size:.85rem; color:#6b7a8f; text-align:center; margin-bottom:1.25rem; }
        .api-error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:.75rem 1rem; color:#ef4444; font-size:.85rem; margin-bottom:1rem; }
        .field { margin-bottom:1.2rem; }
        .field label { display:block; font-size:.82rem; font-weight:600; color:#e2e8f0; margin-bottom:.4rem; }
        .field input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:.7rem 1rem; color:#fff; font-size:.95rem; outline:none; transition:border-color .2s,box-shadow .2s; }
        .field input:focus { border-color:#00c864; box-shadow:0 0 0 3px rgba(0,200,100,.15); }
        .field input.error { border-color:#ef4444; }
        .field input::placeholder { color:#6b7a8f; }
        .field input:disabled { opacity:.6; }
        .phone-wrap { display:flex; align-items:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; overflow:hidden; transition:border-color .2s; }
        .phone-wrap:focus-within { border-color:#00c864; box-shadow:0 0 0 3px rgba(0,200,100,.15); }
        .prefix { background:rgba(0,200,100,.1); color:#00c864; padding:.7rem .75rem; font-size:.9rem; font-weight:600; border-right:1px solid rgba(255,255,255,.1); white-space:nowrap; }
        .phone-wrap input { background:transparent; border:none!important; border-radius:0!important; box-shadow:none!important; flex:1; }
        .err { display:block; margin-top:.35rem; font-size:.78rem; color:#ef4444; }
        .submit-btn { width:100%; padding:.85rem; background:linear-gradient(135deg,#00c864,#00a050); border:none; border-radius:8px; color:#fff; font-size:1rem; font-weight:700; cursor:pointer; margin-top:.75rem; transition:opacity .2s,transform .15s; }
        .submit-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
        .submit-btn:disabled{opacity:.7;cursor:not-allowed}
        .spinner-wrap{display:flex;align-items:center;justify-content:center;gap:.5rem}
        .spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:480px){.card{padding:2rem 1.25rem}}
      `}</style>
    </div>
  );
}
