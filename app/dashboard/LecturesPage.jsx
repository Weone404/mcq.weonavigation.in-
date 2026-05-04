'use client';

import { useState, useEffect } from 'react';
import { getUser } from '../../lib/storage';
import { openPayment, getSubscription, isSubscribed, daysRemaining, PLANS, grantSubscription } from '../../lib/payment';

const C = {
  bg: '#F0F4FF',
  card: '#FFFFFF',
  primary: '#1D4ED8',
  primaryLight: '#EFF6FF',
  accent: '#F59E0B',
  green: '#10B981',
  red: '#EF4444',
  purple: '#8B5CF6',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  sidebar: '#0A1628',
};

// Only the first 2 lectures GLOBALLY (across all subjects) are free
const FREE_LIMIT = 2;

const LECTURES = [
  // ── AIR REGULATIONS ──────────────────────────────────────────────────────
  {
    id: 'ar-001',
    title: 'Met: Atmospheric Pressure Part-1',
    subject: 'Air Regulations',
    chapter: 'Chapter 1',
    videoUrl: 'https://drive.google.com/file/d/1fnPKGpELy5lBK1a9r9UV-xuG3Dy11x_O/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Wg. Cdr. R.K. Bali (Retd.)',
    description: 'Introduction to key definitions and abbreviations used in Indian Air Regulations.',
    order: 1,
    uploadedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ar-002',
    title: 'Air Regulations – Chapter 2: Aircraft Categories',
    subject: 'Air Regulations',
    chapter: 'Chapter 2',
    videoUrl: 'https://drive.google.com/file/d/1sSKySNACSx6Lgyko6y2fwvkLJ161uM3P/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Wg. Cdr. R.K. Bali (Retd.)',
    description: 'Classification of aircraft under DGCA regulations — types, categories, and classes.',
    order: 2,
    uploadedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'ar-003',
    title: 'Air Regulations – Chapter 3: Aircraft Registration',
    subject: 'Air Regulations',
    chapter: 'Chapter 3',
    videoUrl: 'https://drive.google.com/file/d/1bhblKxgZlFnb9Rc71A1PTdWOmqDNHOqP/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Wg. Cdr. R.K. Bali (Retd.)',
    description: 'Aircraft registration requirements, nationality marks, and DGCA procedures.',
    order: 3,
    uploadedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 'ar-004',
    title: 'Air Regulations – Chapter 4: Registration Part-2',
    subject: 'Air Regulations',
    chapter: 'Chapter 4',
    videoUrl: 'https://drive.google.com/file/d/1sSKySNACSx6Lgyko6y2fwvkLJ161uM3P/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Wg. Cdr. R.K. Bali (Retd.)',
    description: 'Aircraft registration requirements, nationality marks, and DGCA procedures.',
    order: 4,
    uploadedAt: '2024-01-04T00:00:00Z',
  },
  {
    id: 'ar-005',
    title: 'Air Regulations – Chapter 5: Registration Part-3',
    subject: 'Air Regulations',
    chapter: 'Chapter 5',
    videoUrl: 'https://drive.google.com/file/d/10PnlY4PoVeXFplVR9trEduZW0r_T4Pp-/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Wg. Cdr. R.K. Bali (Retd.)',
    description: 'Aircraft registration requirements, nationality marks, and DGCA procedures.',
    order: 5,
    uploadedAt: '2024-01-05T00:00:00Z',
  },

  // ── METEOROLOGY ──────────────────────────────────────────────────────────
  {
    id: 'met-001',
    title: 'Meteorology: Atmosphere',
    subject: 'Meteorology',
    chapter: 'Chapter 1',
    videoUrl: 'https://drive.google.com/file/d/1sSKySNACSx6Lgyko6y2fwvkLJ161uM3P/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Structure of the atmosphere, layers, and standard atmosphere.',
    order: 1,
    uploadedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'met-002',
    title: 'Meteorology – Temperature Part-1',
    subject: 'Meteorology',
    chapter: 'Chapter 2',
    videoUrl: 'https://drive.google.com/file/d/1WSNOhyrJbsHdqrffufdfzG0TBe3iXd3i/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Temperature gradients, pressure systems, and their effects on flight.',
    order: 2,
    uploadedAt: '2024-02-02T00:00:00Z',
  },
  {
    id: 'met-003',
    title: 'Meteorology – Temperature Part-2',
    subject: 'Meteorology',
    chapter: 'Chapter 2 Part-2',
    videoUrl: 'https://drive.google.com/file/d/1XiOdkvgAnuRjDz92KiYcABRgT0aWR9ID/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Continued study of temperature effects and atmospheric stability.',
    order: 3,
    uploadedAt: '2024-02-03T00:00:00Z',
  },
  {
    id: 'met-004',
    title: 'Meteorology – Atmospheric Pressure Part-1',
    subject: 'Meteorology',
    chapter: 'Chapter 4',
    videoUrl: 'https://drive.google.com/file/d/1fnPKGpELy5lBK1a9r9UV-xuG3Dy11x_O/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Atmospheric pressure concepts and their aviation significance.',
    order: 4,
    uploadedAt: '2024-02-04T00:00:00Z',
  },
  {
    id: 'met-004b',
    title: 'Meteorology – Atmospheric Pressure Part-2',
    subject: 'Meteorology',
    chapter: 'Chapter 4 Part-2',
    videoUrl: 'https://drive.google.com/file/d/14MpmzxrlUmKIysLWZLpjrRZuOU9UnStp/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Advanced atmospheric pressure systems and altimetry.',
    order: 5,
    uploadedAt: '2024-02-05T00:00:00Z',
  },
  {
    id: 'met-005',
    title: 'Meteorology – Density',
    subject: 'Meteorology',
    chapter: 'Chapter 5',
    videoUrl: 'https://drive.google.com/file/d/1sQJS4YZny3Nkj4isZeuBuovJqyaW8m-D/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Air density, density altitude, and effects on aircraft performance.',
    order: 6,
    uploadedAt: '2024-02-06T00:00:00Z',
  },
  {
    id: 'met-006',
    title: 'Meteorology – Humidity Part-1',
    subject: 'Meteorology',
    chapter: 'Chapter 6',
    videoUrl: 'https://drive.google.com/file/d/10PnlY4PoVeXFplVR9trEduZW0r_T4Pp-/view?usp=drive_link',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Humidity, dew point, and moisture in the atmosphere.',
    order: 7,
    uploadedAt: '2024-02-07T00:00:00Z',
  },

  // ── NAVIGATION ───────────────────────────────────────────────────────────
  {
    id: 'nav-001',
    title: 'Navigation – Chapter 1: Basic Principles',
    subject: 'Navigation',
    chapter: 'Chapter 1',
    videoUrl: 'https://drive.google.com/file/d/YOUR_ID/view',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Fundamentals of air navigation — charts, coordinates, and direction.',
    order: 1,
    uploadedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'nav-002',
    title: 'Navigation – Chapter 2: VOR & ILS',
    subject: 'Navigation',
    chapter: 'Chapter 2',
    videoUrl: 'https://drive.google.com/file/d/YOUR_ID/view',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'VOR and ILS navigation aids, approach procedures, and limitations.',
    order: 2,
    uploadedAt: '2024-03-02T00:00:00Z',
  },
  {
    id: 'nav-003',
    title: 'Navigation – Chapter 3: RNAV & GPS',
    subject: 'Navigation',
    chapter: 'Chapter 3',
    videoUrl: 'https://drive.google.com/file/d/YOUR_ID/view',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Area navigation, GPS systems, and performance-based navigation.',
    order: 3,
    uploadedAt: '2024-03-03T00:00:00Z',
  },

  // ── TECHNICAL GENERAL ────────────────────────────────────────────────────
  {
    id: 'tg-001',
    title: 'Technical General – Chapter 1: Airframe Structures',
    subject: 'Technical General',
    chapter: 'Chapter 1',
    videoUrl: 'https://drive.google.com/file/d/YOUR_ID/view',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Aircraft structural components, loads, and materials.',
    order: 1,
    uploadedAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 'tg-002',
    title: 'Technical General – Chapter 2: Piston Engines',
    subject: 'Technical General',
    chapter: 'Chapter 2',
    videoUrl: 'https://drive.google.com/file/d/YOUR_ID/view',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Piston engine operation, systems, and maintenance principles.',
    order: 2,
    uploadedAt: '2024-04-02T00:00:00Z',
  },
  {
    id: 'tg-003',
    title: 'Technical General – Chapter 3: Turbine Engines',
    subject: 'Technical General',
    chapter: 'Chapter 3',
    videoUrl: 'https://drive.google.com/file/d/YOUR_ID/view',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Gas turbine engine theory, components, and operational characteristics.',
    order: 3,
    uploadedAt: '2024-04-03T00:00:00Z',
  },

  // ── RADIO TELEPHONY ──────────────────────────────────────────────────────
  {
    id: 'rt-001',
    title: 'Radio Telephony – Chapter 1: RTF Procedures',
    subject: 'Radio Telephony',
    chapter: 'Chapter 1',
    videoUrl: 'https://drive.google.com/file/d/YOUR_ID/view',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Standard RTF procedures, phraseology, and communication techniques.',
    order: 1,
    uploadedAt: '2024-05-01T00:00:00Z',
  },
  {
    id: 'rt-002',
    title: 'Radio Telephony – Chapter 2: Distress & Urgency',
    subject: 'Radio Telephony',
    chapter: 'Chapter 2',
    videoUrl: 'https://drive.google.com/file/d/YOUR_ID/view',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'Emergency communications, distress and urgency procedures.',
    order: 2,
    uploadedAt: '2024-05-02T00:00:00Z',
  },
  {
    id: 'rt-003',
    title: 'Radio Telephony – Chapter 3: ATC Communications',
    subject: 'Radio Telephony',
    chapter: 'Chapter 3',
    videoUrl: 'https://drive.google.com/file/d/YOUR_ID/view',
    thumbnailUrl: '',
    duration: '',
    instructor: 'Your Instructor Name',
    description: 'ATC communication procedures, clearances, and read-back requirements.',
    order: 3,
    uploadedAt: '2024-05-03T00:00:00Z',
  },
];

const SUBJECT_CONFIG = {
  'Air Regulations': {
    icon: '📋',
    subtitle: 'ICAO, DGCA, National Law & Procedures',
    examTags: ['ATPL', 'CPL', 'DGCA'],
  },
  'Meteorology': {
    icon: '🌤️',
    subtitle: 'Weather, Clouds, Pressure Systems',
    examTags: ['ATPL', 'CPL'],
  },
  'Navigation': {
    icon: '🧭',
    subtitle: 'Charts, VOR, ILS, RNAV',
    examTags: ['ATPL', 'CPL'],
  },
  'Technical General': {
    icon: '⚙️',
    subtitle: 'Airframes, Engines, Systems',
    examTags: ['AME', 'ATPL'],
  },
  'Radio Telephony': {
    icon: '📡',
    subtitle: 'RTF Procedures & Phraseology',
    examTags: ['RTR (Aero)'],
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toEmbedUrl(url = '') {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  return url;
}

function isGoogleDrive(url = '') { return url.includes('drive.google.com'); }
function isLocalVideo(url = '') { return url.startsWith('/'); }

function getThumb(videoUrl, thumbnailUrl) {
  if (thumbnailUrl) return thumbnailUrl;
  const ytMatch = videoUrl?.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO MODAL
// ─────────────────────────────────────────────────────────────────────────────
function VideoModal({ lecture, onClose }) {
  const isDrive = isGoogleDrive(lecture.videoUrl);
  const isLocal = isLocalVideo(lecture.videoUrl);
  const embedUrl = toEmbedUrl(lecture.videoUrl);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 960, background: '#000', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.8)' }}>
        <div style={{ background: C.sidebar, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{lecture.title}</div>
            <div style={{ color: '#8BA3C5', fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              {lecture.instructor}{lecture.duration ? ` · ${lecture.duration}` : ''}
              {isDrive && <span style={{ background: '#1A73E820', color: '#8AB4F8', padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>📁 Google Drive</span>}
              {isLocal && <span style={{ background: '#10B98120', color: '#6EE7B7', padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>💾 Local</span>}
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
        </div>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          {isLocal ? (
            <video src={lecture.videoUrl} controls autoPlay
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
          ) : (
            <iframe src={embedUrl} title={lecture.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
          )}
        </div>
        {lecture.description && (
          <div style={{ background: C.sidebar, padding: '14px 20px', borderTop: '1px solid #1E3A5F' }}>
            <div style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.6 }}>{lecture.description}</div>
          </div>
        )}
        {isDrive && (
          <div style={{ background: '#0D2137', padding: '10px 20px', borderTop: '1px solid #1E3A5F', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>ℹ️</span>
            <span style={{ color: '#8AB4F8', fontSize: 12 }}>
              Hosted on Google Drive. If the video doesn't play, ensure the file is shared as <strong>"Anyone with the link → Viewer"</strong>.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYWALL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PaywallModal({ user, onSuccess, onClose }) {
  const [selected, setSelected] = useState('quarterly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePay() {
    if (!user) { setError('Please log in first.'); return; }
    setLoading(true); setError('');
    await openPayment({
      planId: selected, user,
      onSuccess: (sub) => { setLoading(false); onSuccess(sub); },
      onFailure: (msg) => { setLoading(false); setError(msg); },
      onDismiss: () => setLoading(false),
    });
  }

  function handleDemo() { onSuccess(grantSubscription(user?.email, selected)); }
  const plan = PLANS[selected];

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: C.card, borderRadius: 20, width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,.3)', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg,${C.sidebar},${C.primary})`, padding: '28px 32px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>×</button>
          <div style={{ fontSize: 36, marginBottom: 10 }}>👑</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Unlock All Lectures</div>
          <div style={{ color: '#93C5FD', fontSize: 13, lineHeight: 1.6 }}>
            First {FREE_LIMIT} lectures are free. Subscribe to access everything.
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {['🎬 All Lectures', '📋 All Chapters', '📝 Mock Tests', '📊 Analytics'].map(p => (
              <span key={p} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{p}</span>
            ))}
          </div>
        </div>
        <div style={{ padding: '24px 32px' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 14 }}>Choose Your Plan</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {Object.values(PLANS).map(p => (
              <div key={p.id} onClick={() => setSelected(p.id)}
                style={{ borderRadius: 14, border: `2px solid ${selected === p.id ? C.primary : C.border}`, padding: '16px 14px', cursor: 'pointer', background: selected === p.id ? C.primaryLight : C.card, position: 'relative' }}>
                {p.badge && (
                  <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: p.id === 'yearly' ? C.accent : C.primary, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{p.badge}</div>
                )}
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>{p.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: selected === p.id ? C.primary : C.text }}>₹{p.price}</span>
                  <span style={{ fontSize: 12, color: C.muted, textDecoration: 'line-through' }}>₹{p.originalPrice}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{p.durationDays} days</div>
              </div>
            ))}
          </div>
          <div style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>What you get with {plan.label}:</div>
            {plan.features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, marginBottom: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: C.green + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.green, flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
          </div>
          {error && <div style={{ background: '#FEF2F2', border: `1px solid ${C.red}30`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: C.red, marginBottom: 16 }}>⚠️ {error}</div>}
          <button onClick={handlePay} disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? C.border : `linear-gradient(135deg,${C.primary},${C.purple})`, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 10 }}>
            {loading ? '⏳ Processing…' : `💳 Pay ₹${plan.price} with Razorpay`}
          </button>
          <button onClick={handleDemo} style={{ width: '100%', padding: '11px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted, fontSize: 13, cursor: 'pointer' }}>
            🧪 Demo Mode — Activate Free (Testing Only)
          </button>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: C.muted }}>🔒 Secured by Razorpay · Instant activation</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT FOLDER CARD
// freeLecturesOverride = how many in THIS subject are globally free
// ─────────────────────────────────────────────────────────────────────────────
function SubjectFolderCard({ subject, lectures, subscribed, subtitle, examTags, onClick, freeLecturesOverride }) {
  const cfg = SUBJECT_CONFIG[subject] || {};
  const icon = cfg.icon || '📁';
  const totalLectures = lectures.length;

  // Use the globally-computed free count passed from parent
  const freeLectures = freeLecturesOverride !== undefined
    ? freeLecturesOverride
    : Math.min(totalLectures, FREE_LIMIT);
  const lockedLectures = Math.max(0, totalLectures - freeLectures);

  const chapters = [...new Set(lectures.map(l => l.chapter).filter(Boolean))];

  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, borderRadius: 18, border: `1px solid ${C.border}`,
        overflow: 'hidden', cursor: 'pointer', transition: 'all .2s',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,.12)';
        e.currentTarget.style.borderColor = '#94A3B8';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.05)';
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <div style={{ height: 4, background: C.border }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14, background: C.bg,
            border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, flexShrink: 0,
          }}>{icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.text, lineHeight: 1.3 }}>{subject}</div>
              <span style={{ fontSize: 10, fontWeight: 700, background: C.bg, color: C.muted, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {totalLectures} lecture{totalLectures !== 1 ? 's' : ''}
              </span>
            </div>
            {subtitle && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{subtitle}</div>}
            {examTags?.length > 0 && (
              <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                {examTags.map(tag => (
                  <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: C.muted, background: C.bg, border: `1px solid ${C.border}`, padding: '1px 8px', borderRadius: 20 }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          {freeLectures > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#F0FDF4', color: C.green, padding: '2px 9px', borderRadius: 20, border: `1px solid ${C.green}30` }}>
              🆓 {freeLectures} free
            </span>
          )}
          {!subscribed && lockedLectures > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#FDF4FF', color: C.purple, padding: '2px 9px', borderRadius: 20, border: `1px solid ${C.purple}30` }}>
              🔒 {lockedLectures} premium
            </span>
          )}
          {subscribed && lockedLectures > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#F0FDF4', color: C.green, padding: '2px 9px', borderRadius: 20, border: `1px solid ${C.green}30` }}>
              ✅ All unlocked
            </span>
          )}
          {freeLectures === 0 && !subscribed && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#FDF4FF', color: C.purple, padding: '2px 9px', borderRadius: 20, border: `1px solid ${C.purple}30` }}>
              🔒 All premium
            </span>
          )}
        </div>

        {chapters.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
            {chapters.slice(0, 4).map(ch => (
              <span key={ch} style={{ fontSize: 10, color: C.muted, background: C.bg, padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.border}` }}>{ch}</span>
            ))}
            {chapters.length > 4 && (
              <span style={{ fontSize: 10, color: C.muted, background: C.bg, padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.border}` }}>+{chapters.length - 4} more</span>
            )}
          </div>
        )}

        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px',
          color: C.text, fontWeight: 700, fontSize: 12,
        }}>
          📂 Open Subject →
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURE CARD
// globalIndex = position across ALL lectures in ALL subjects (0-based)
// 0 and 1 → FREE,  2+ → LOCKED (triggers paywall)
// ─────────────────────────────────────────────────────────────────────────────
function LectureCard({ lecture, globalIndex, subscribed, onPlay, onLock }) {
  // Lock is based on globalIndex — only first FREE_LIMIT lectures on the platform are free
  const isLocked = !subscribed && globalIndex >= FREE_LIMIT;
  const thumb = getThumb(lecture.videoUrl, lecture.thumbnailUrl);
  const isDrive = isGoogleDrive(lecture.videoUrl);
  const isLocal = isLocalVideo(lecture.videoUrl);

  return (
    <div
      onClick={() => isLocked ? onLock() : onPlay(lecture)}
      style={{
        background: C.card, borderRadius: 16,
        border: `2px solid ${isLocked ? C.purple + '40' : C.border}`,
        overflow: 'hidden', cursor: 'pointer', transition: 'all .2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = isLocked ? `0 10px 28px rgba(139,92,246,.2)` : `0 10px 28px rgba(29,78,216,.15)`;
      }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#0F172A', overflow: 'hidden' }}>
        {thumb
          ? <img src={thumb} alt={lecture.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isLocked ? .4 : 1 }} />
          : <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: isLocked ? 'linear-gradient(135deg,#2D1B69,#1E0A3C)'
              : isDrive ? 'linear-gradient(135deg,#1A3A6A,#0A1628)'
                : isLocal ? 'linear-gradient(135deg,#064E3B,#0A1628)'
                  : `linear-gradient(135deg,${C.sidebar},${C.primary})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
          }}>
            {isLocked ? '🔒' : isDrive ? '📁' : isLocal ? '💾' : '🎬'}
          </div>
        }

        {/* Locked purple overlay */}
        {isLocked && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(139,92,246,.35) 0%, transparent 60%)' }} />
        )}

        {/* Centre play/lock button */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: isLocked ? `linear-gradient(135deg,${C.purple},#6D28D9)` : 'rgba(255,255,255,.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 20px rgba(0,0,0,.45)',
          }}>
            {isLocked ? '🔒' : '▶'}
          </div>
        </div>

        {/* Top-left badge */}
        {isLocked ? (
          <div style={{ position: 'absolute', top: 8, left: 8, background: `linear-gradient(135deg,${C.purple},#6D28D9)`, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
            👑 PREMIUM
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 8, left: 8, background: C.green, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
            🆓 FREE
          </div>
        )}

        {/* Number badge — shows position within subject for clarity */}
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
          #{lecture.order}
        </div>

        {/* Duration */}
        {lecture.duration && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.8)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
            {lecture.duration}
          </div>
        )}

        {/* Drive / Local badge */}
        {!isLocked && isDrive && <div style={{ position: 'absolute', bottom: 8, left: 8, background: '#1A73E8', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>📁 Drive</div>}
        {!isLocked && isLocal && <div style={{ position: 'absolute', bottom: 8, left: 8, background: '#059669', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>💾 Local</div>}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px', background: isLocked ? '#FDFAFF' : C.card }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, background: C.primaryLight, color: C.primary, padding: '2px 8px', borderRadius: 20 }}>
            {lecture.subject}
          </span>
          {lecture.chapter && (
            <span style={{ fontSize: 10, fontWeight: 700, background: C.bg, color: C.muted, padding: '2px 8px', borderRadius: 20 }}>
              {lecture.chapter}
            </span>
          )}
        </div>

        <div style={{ fontWeight: 800, fontSize: 14, color: isLocked ? C.muted : C.text, lineHeight: 1.4, marginBottom: 6 }}>
          {lecture.title}
        </div>

        {lecture.description && (
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {lecture.description}
          </div>
        )}

        {/* Locked CTA */}
        {isLocked && (
          <div style={{
            background: `linear-gradient(135deg,${C.purple}15,${C.primary}12)`,
            border: `1px solid ${C.purple}35`, borderRadius: 10, padding: '10px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10,
          }}>
            <div style={{ fontSize: 12, color: C.purple, fontWeight: 700 }}>🔒 Subscribe to watch</div>
            <div style={{ fontSize: 11, color: C.purple, fontWeight: 700, whiteSpace: 'nowrap' }}>from ₹299 →</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: C.muted }}>{lecture.instructor}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(lecture.uploadedAt)}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB STATUS BAR
// ─────────────────────────────────────────────────────────────────────────────
function SubStatusBar({ sub, onUpgrade }) {
  const days = daysRemaining();
  return (
    <div style={{ background: `linear-gradient(135deg,${C.green},#059669)`, borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👑</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Premium Active — {sub.planLabel} Plan</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12 }}>{days} day{days !== 1 ? 's' : ''} remaining · Expires {fmtDate(sub.expiresAt)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ background: 'rgba(255,255,255,.2)', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ All Lectures Unlocked</div>
        <button onClick={onUpgrade} style={{ background: 'rgba(255,255,255,.3)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Renew →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FREE LIMIT BANNER
// ─────────────────────────────────────────────────────────────────────────────
function FreeLimitBanner({ total, onUpgrade }) {
  return (
    <div style={{ background: `linear-gradient(135deg,${C.purple}15,${C.primary}15)`, border: `1px solid ${C.primary}30`, borderRadius: 14, padding: '18px 22px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>🎬 First {FREE_LIMIT} lectures are free — across all subjects</div>
        <div style={{ fontSize: 13, color: C.muted }}>Subscribe to unlock all {total} lectures — instant access, all subjects.</div>
      </div>
      <button onClick={onUpgrade} style={{ background: `linear-gradient(135deg,${C.primary},${C.purple})`, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        👑 Unlock All →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function LecturesPage() {
  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setUser(getUser());
    setSub(getSubscription());
    setSubscribed(isSubscribed());
  }, []);

  function handlePaySuccess(newSub) {
    setSub(newSub);
    setSubscribed(true);
    setShowPaywall(false);
  }

  // ── Build subject map ─────────────────────────────────────────────────────
  const seen = new Set();
  const dedupedLectures = LECTURES.filter(l => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });

  const subjectMap = {};
  dedupedLectures.forEach(l => {
    if (!subjectMap[l.subject]) subjectMap[l.subject] = [];
    subjectMap[l.subject].push(l);
  });
  Object.keys(subjectMap).forEach(s => {
    subjectMap[s].sort((a, b) => a.order - b.order);
  });

  const ALL_SUBJECTS = Object.keys(SUBJECT_CONFIG);
  ALL_SUBJECTS.forEach(s => { if (!subjectMap[s]) subjectMap[s] = []; });

  const allLectures = dedupedLectures;
  const subjects = ALL_SUBJECTS;

  // ── Compute global index offset for each subject ──────────────────────────
  // This assigns a continuous global index across ALL subjects in order.
  // Subject 1 lectures: index 0, 1, 2, ...
  // Subject 2 lectures: index (subject1.length), (subject1.length)+1, ...
  // etc.
  // Only globalIndex < FREE_LIMIT (i.e. 0 and 1) are free.
  function getGlobalOffset(subject) {
    const pos = ALL_SUBJECTS.indexOf(subject);
    return ALL_SUBJECTS.slice(0, pos).reduce((acc, s) => acc + (subjectMap[s]?.length || 0), 0);
  }

  // ── Lectures for selected subject ─────────────────────────────────────────
  const allSubjectLectures = selectedSubject ? (subjectMap[selectedSubject] || []) : [];
  const globalOffset = selectedSubject ? getGlobalOffset(selectedSubject) : 0;

  // Attach globalIndex BEFORE search filtering so lock status never shifts
  const subjectLecturesWithIndex = allSubjectLectures.map((lecture, idx) => ({
    lecture,
    globalIndex: globalOffset + idx,  // 0 & 1 = FREE globally, 2+ = LOCKED
  }));

  const filteredLectures = search
    ? subjectLecturesWithIndex.filter(({ lecture }) =>
      lecture.title.toLowerCase().includes(search.toLowerCase()) ||
      lecture.chapter?.toLowerCase().includes(search.toLowerCase())
    )
    : subjectLecturesWithIndex;

  const selectedCfg = selectedSubject ? (SUBJECT_CONFIG[selectedSubject] || {}) : {};
  const subjectIcon = selectedCfg.icon || '📁';

  // ── Compute per-subject free lecture count for folder cards ───────────────
  function getSubjectFreeLectureCount(subject) {
    const offset = getGlobalOffset(subject);
    const count = subjectMap[subject]?.length || 0;
    // How many lectures in this subject fall within the global FREE_LIMIT?
    return Math.max(0, Math.min(count, FREE_LIMIT - offset));
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      {activeVideo && <VideoModal lecture={activeVideo} onClose={() => setActiveVideo(null)} />}
      {showPaywall && <PaywallModal user={user} onSuccess={handlePaySuccess} onClose={() => setShowPaywall(false)} />}

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>🎬 Recorded Lectures</h2>
            <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 13 }}>
              {subscribed
                ? `👑 Premium — Full access · ${allLectures.length} lectures across ${subjects.length} subjects`
                : `First ${FREE_LIMIT} lectures free (across all subjects) · Subscribe to unlock all ${allLectures.length}`}
            </p>
          </div>
          {!subscribed && (
            <button onClick={() => setShowPaywall(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,${C.primary},${C.purple})`, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              👑 Get Premium
            </button>
          )}
        </div>
        {subscribed && sub && <SubStatusBar sub={sub} onUpgrade={() => setShowPaywall(true)} />}
        {!subscribed && <FreeLimitBanner total={allLectures.length} onUpgrade={() => setShowPaywall(true)} />}
      </div>

      {/* ══════════════════════════════════════════
          VIEW A — SUBJECT FOLDERS
      ══════════════════════════════════════════ */}
      {!selectedSubject && (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {[
              { icon: '📚', val: subjects.length, label: 'Subjects' },
              { icon: '🎬', val: allLectures.length, label: 'Total Lectures' },
              { icon: '🆓', val: FREE_LIMIT, label: 'Free' },
              { icon: '👑', val: Math.max(0, allLectures.length - FREE_LIMIT), label: 'Premium' },
            ].map(s => (
              <div key={s.label} style={{ background: C.card, borderRadius: 12, padding: '10px 16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.text, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Section heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ height: 3, width: 28, borderRadius: 99, background: C.primary }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>All Subjects</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted }}>{subjects.length} subjects</span>
          </div>

          {/* Subject grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {subjects.map(subject => {
              const cfg = SUBJECT_CONFIG[subject] || {};
              const freeCount = getSubjectFreeLectureCount(subject);
              return (
                <SubjectFolderCard
                  key={subject}
                  subject={subject}
                  lectures={subjectMap[subject] || []}
                  subscribed={subscribed}
                  subtitle={cfg.subtitle || ''}
                  examTags={cfg.examTags || []}
                  freeLecturesOverride={freeCount}
                  onClick={() => { setSelectedSubject(subject); setSearch(''); }}
                />
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          VIEW B — LECTURES INSIDE A SUBJECT
      ══════════════════════════════════════════ */}
      {selectedSubject && (
        <>
          {/* Subject header */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
            padding: '18px 22px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.bg, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {subjectIcon}
              </div>
              <div>
                <div style={{ color: C.text, fontWeight: 900, fontSize: 17 }}>{selectedSubject}</div>
                {selectedCfg.subtitle && <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{selectedCfg.subtitle}</div>}
              </div>
            </div>
            <button
              onClick={() => { setSelectedSubject(null); setSearch(''); }}
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px', fontSize: 13, color: C.muted, cursor: 'pointer', fontWeight: 600 }}>
              ← All Subjects
            </button>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.muted }}>
              {allSubjectLectures.length} lecture{allSubjectLectures.length !== 1 ? 's' : ''}
              {!subscribed && (() => {
                const free = getSubjectFreeLectureCount(selectedSubject);
                return free > 0
                  ? ` · ${free} free, ${allSubjectLectures.length - free} require subscription`
                  : ` · All require subscription`;
              })()}
            </span>
            {selectedCfg.examTags?.map(tag => (
              <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: C.muted, background: C.bg, border: `1px solid ${C.border}`, padding: '2px 10px', borderRadius: 20 }}>{tag}</span>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, borderRadius: 10, padding: '9px 14px', border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <span style={{ color: C.muted }}>🔍</span>
            <input
              placeholder={`Search in ${selectedSubject}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: C.text, width: '100%' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            )}
          </div>

          {/* Lecture grid */}
          {filteredLectures.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{search ? '🔍' : '🎬'}</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 6 }}>
                {search ? 'No lectures found' : 'Lectures Coming Soon'}
              </div>
              <div style={{ color: C.muted, fontSize: 13 }}>
                {search ? 'Try a different search term' : "We're uploading lectures for this subject. Check back soon!"}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {filteredLectures.map(({ lecture, globalIndex }) => (
                <LectureCard
                  key={lecture.id}
                  lecture={lecture}
                  globalIndex={globalIndex}
                  subscribed={subscribed}
                  onPlay={l => setActiveVideo(l)}
                  onLock={() => setShowPaywall(true)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Bottom CTA */}
      {!subscribed && allLectures.length > 0 && (
        <div style={{ marginTop: 32, background: `linear-gradient(135deg,${C.sidebar},${C.primary})`, borderRadius: 20, padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Ready to Unlock Everything?</div>
          <div style={{ color: '#93C5FD', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            Get unlimited access to all {allLectures.length} lectures, mock tests, chapter tests and more.<br />
            Plans starting at just <strong style={{ color: C.accent }}>₹299/month</strong>.
          </div>
          <button onClick={() => setShowPaywall(true)}
            style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>
            👑 Subscribe Now — Starting ₹299 →
          </button>
        </div>
      )}
    </div>
  );
}