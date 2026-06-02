'use client';

import { useState, useEffect, useRef } from 'react';
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

const FREE_LIMIT = 2;

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT CONFIG
// Each subject has 23 iframe slots. Paste the full YouTube <iframe> embed code
// (copy from YouTube → Share → Embed) into the `iframeCode` field.
// Leave iframeCode as '' to show a "Coming Soon" placeholder.
// ─────────────────────────────────────────────────────────────────────────────

function makeSlots(overrides = []) {
  return Array.from({ length: 26 }, (_, i) => {
    const slot = overrides[i] || {};
    return {
      order: i + 1,
      title: slot.title || `Lecture ${i + 1}`,
      chapter: slot.chapter || `Chapter ${i + 1}`,
      description: slot.description || '',
      iframeCode: slot.iframeCode || '', // ← PASTE YouTube iframe code here
      duration: slot.duration || '',
      uploadedAt: slot.uploadedAt || '2024-01-01T00:00:00Z',
    };
  });
}

const SUBJECTS_DATA = {
  Meteorology: {
    icon: '🌤️',
    subtitle: 'Weather, Clouds, Pressure Systems',
    examTags: ['ATPL', 'CPL'],
    color: '#0EA5E9',
    lectures: makeSlots([
      {
        title: 'Met : Atmosphere Composition, Structure, and Standard Specifications',
        chapter: 'Chapter 1',
        description: 'Structure of the atmosphere, layers, and standard atmosphere.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/9JdYfqbPQ6g?si=SKQbsC4kWbS_sNUI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>', // ← PASTE IFRAME CODE HERE
      },
      {
        title: 'Met : Atmospheric Pressure and Altimetry Fundamentals',
        chapter: 'Chapter 2',
        description: 'Temperature gradients, lapse rates, and inversions.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/ks2598HPflQ?si=LLwIQ7X8KEGiSVp6" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Principles of Temperature and Heat Dynamics',
        chapter: 'Chapter 3',
        description: 'Continued study of temperature effects and atmospheric stability.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/36VHcqi8Qyc?si=nvjT_tlt1zBaV4mn" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Density in Aviation Principles and Effects',
        chapter: 'Chapter 4',
        description: 'Air Density in Aviation Principles and Effects',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/lTPUZum-Lrc?si=_zO5Nfon9lW05ptw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },

      {
        title: 'Met: Air Density in Aviation Principles and Effects',
        chapter: 'Chapter 4',
        description: 'Air Density in Aviation Principles and Effects.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/lTPUZum-Lrc?si=x6J5KA2nlHUiCTV9" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Principles and Measurements of Atmospheric Humidity',
        chapter: 'Chapter 5',
        description: 'Principles and Measurements of Atmospheric Humidity.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/iMBvaoH9OU0?si=4xyZV35HhzBn8TL8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Meteorological Principles of Wind and Atmospheric Motion',
        chapter: 'Chapter 6',
        description: 'Meteorological Principles of Wind and Atmospheric Motion',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/08bD_5amrdI?si=Yz5o4LpvxgJrixiV" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Aeronautical Meteorology Visibility and Fog Analysis',
        chapter: 'Chapter 7',
        description: 'Aeronautical Meteorology Visibility and Fog Analysis',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/JkJ6BAur4VA?si=QCownWE0CuMOOr4Z" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Vertical Motion and Clouds',
        chapter: 'Chapter 8',
        description: 'Vertical Motion and Clouds.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/XD56qfNTFjQ?si=TIRbbaAKIPB5JRTI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Stability and Instability of the Atmosphere',
        chapter: 'Chapter 9',
        description: 'Stability and Instability of the Atmosphere',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/0blqi_2TyMQ?si=YTYrQ0nj6W7hymzH" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },

      {
        title: 'Met: Atmospheric Optical Phenomena and Electricity',
        chapter: 'Chapter 10',
        description: 'Atmospheric Optical Phenomena and Electricity.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/9JdYfqbPQ6g?si=69Cyw3GynXw2lJlQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },

      {
        title: 'Met: Precipitation Theories, Classifications, and Mechanisms',
        chapter: 'Chapter 11',
        description: 'Precipitation theories, classifications, and mechanisms.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/Y0jlY-U_SZM?si=83w7KjX0xm5p5ms6" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Aviation Meteorology Ice Accretion and its Effects on Flight',
        chapter: 'Chapter 12',
        description: 'Ice accretion and its effects on flight operations.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/wEFrC9Qi24o?si=ZGeFL9q3yV25CEMX" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Thunderstorms and Severe Weather Phenomena Structures and Hazards',
        chapter: 'Chapter 13',
        description: 'Thunderstorms and severe weather phenomena, structures, and hazards.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/NgkGB6jTjs8?si=RruhR06xriR7zH3X" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Masses, Fronts, and Western Disturbances',
        chapter: 'Chapter 14',
        description: 'Air masses, fronts, and western disturbances in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/D29mYN0vxLw?si=S0Vhi7BK0t8FnWWQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Masses, Fronts, and Western Disturbances',
        chapter: 'Chapter 15',
        description: 'Air masses, fronts, and western disturbances in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/VWK1eyCBwK8?si=K01pKbHevuzT2iN0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Masses, Fronts, and Western Disturbances',
        chapter: 'Chapter 16',
        description: 'Air masses, fronts, and western disturbances in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/Kh8Aeq4Oq0I?si=UoMrhW8lHpT8GGnF" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Masses, Fronts, and Western Disturbances',
        chapter: 'Chapter 17',
        description: 'Air masses, fronts, and western disturbances in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/wvw6B4UBv1c?si=2S7oOj0TMhFXiXju" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met:  Climatology of India',
        chapter: 'Chapter 18',
        description: 'Climatology of India.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/JK7yJnBFANs?si=H3I0EiHZwUl3AR5h" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met:  General Circulation of the Atmosphere',
        chapter: 'Chapter 19',
        description: ' General Circulation of the Atmosphere.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/8hbpbHX7KiU?si=LpoxGAwEMrk97tVO" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Masses, Fronts, and Western Disturbances',
        chapter: 'Chapter 20',
        description: 'Air masses, fronts, and western disturbances in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/D29mYN0vxLw?si=S0Vhi7BK0t8FnWWQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Masses, Fronts, and Western Disturbances',
        chapter: 'Chapter 21',
        description: 'Air masses, fronts, and western disturbances in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/D29mYN0vxLw?si=S0Vhi7BK0t8FnWWQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Masses, Fronts, and Western Disturbances',
        chapter: 'Chapter 22',
        description: 'Air masses, fronts, and western disturbances in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/D29mYN0vxLw?si=S0Vhi7BK0t8FnWWQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Masses, Fronts, and Western Disturbances',
        chapter: 'Chapter 23',
        description: 'Air masses, fronts, and western disturbances in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/D29mYN0vxLw?si=S0Vhi7BK0t8FnWWQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Air Masses, Fronts, and Western Disturbances',
        chapter: 'Chapter 24',
        description: 'Air masses, fronts, and western disturbances in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/D29mYN0vxLw?si=S0Vhi7BK0t8FnWWQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Radar Reports, SIGMET Messages, and Satellite Bulletins',
        chapter: 'Chapter 25',
        description: 'Radar reports, SIGMET messages, and satellite bulletins in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/I_seSfqO59w?si=kKrKyA1h6Cj4sTvw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      {
        title: 'Met: Aviation Meteorological Documentation and Briefing Procedures',
        chapter: 'Chapter 26',
        description: 'Documentation and briefing procedures in aviation meteorology.',
        iframeCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/a3C39KMMsqE?si=r8_jD_XIcaub8VxO" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      },
      // Lectures 8–23 are empty slots — fill iframeCode when ready
    ]),
  },

  'Air Regulations': {
    icon: '📋',
    subtitle: 'ICAO, DGCA, National Law & Procedures',
    examTags: ['ATPL', 'CPL', 'DGCA'],
    color: '#6366F1',
    lectures: makeSlots([
      {
        title: 'Air Regulations – Definitions & Abbreviations',
        chapter: 'Chapter 1',
        description: 'Key definitions and abbreviations used in Indian Air Regulations.',
        iframeCode: '',
      },
      {
        title: 'Air Regulations – Aircraft Categories',
        chapter: 'Chapter 2',
        description: 'Classification of aircraft under DGCA regulations.',
        iframeCode: '',
      },
      {
        title: 'Air Regulations – Aircraft Registration Part-1',
        chapter: 'Chapter 3',
        description: 'Registration requirements, nationality marks, DGCA procedures.',
        iframeCode: '',
      },
      {
        title: 'Air Regulations – Aircraft Registration Part-2',
        chapter: 'Chapter 3 Part-2',
        description: 'Continued registration topics.',
        iframeCode: '',
      },
      {
        title: 'Air Regulations – Aircraft Registration Part-3',
        chapter: 'Chapter 3 Part-3',
        description: 'Advanced registration procedures.',
        iframeCode: '',
      },
    ]),
  },

  Navigation: {
    icon: '🧭',
    subtitle: 'Charts, VOR, ILS, RNAV',
    examTags: ['ATPL', 'CPL'],
    color: '#10B981',
    lectures: makeSlots([
      {
        title: 'Navigation – Basic Principles',
        chapter: 'Chapter 1',
        description: 'Fundamentals of air navigation — charts, coordinates, and direction.',
        iframeCode: '',
      },
      {
        title: 'Navigation – VOR & ILS',
        chapter: 'Chapter 2',
        description: 'VOR and ILS navigation aids, approach procedures, and limitations.',
        iframeCode: '',
      },
      {
        title: 'Navigation – RNAV & GPS',
        chapter: 'Chapter 3',
        description: 'Area navigation, GPS systems, and performance-based navigation.',
        iframeCode: '',
      },
    ]),
  },

  'Technical General': {
    icon: '⚙️',
    subtitle: 'Airframes, Engines, Systems',
    examTags: ['AME', 'ATPL'],
    color: '#F59E0B',
    lectures: makeSlots([
      {
        title: 'Technical General – Airframe Structures',
        chapter: 'Chapter 1',
        description: 'Aircraft structural components, loads, and materials.',
        iframeCode: '',
      },
      {
        title: 'Technical General – Piston Engines',
        chapter: 'Chapter 2',
        description: 'Piston engine operation, systems, and maintenance principles.',
        iframeCode: '',
      },
      {
        title: 'Technical General – Turbine Engines',
        chapter: 'Chapter 3',
        description: 'Gas turbine engine theory, components, and operational characteristics.',
        iframeCode: '',
      },
    ]),
  },

  'Radio Telephony': {
    icon: '📡',
    subtitle: 'RTF Procedures & Phraseology',
    examTags: ['RTR (Aero)'],
    color: '#EF4444',
    lectures: makeSlots([
      {
        title: 'Radio Telephony – RTF Procedures',
        chapter: 'Chapter 1',
        description: 'Standard RTF procedures, phraseology, and communication techniques.',
        iframeCode: '',
      },
      {
        title: 'Radio Telephony – Distress & Urgency',
        chapter: 'Chapter 2',
        description: 'Emergency communications, distress and urgency procedures.',
        iframeCode: '',
      },
      {
        title: 'Radio Telephony – ATC Communications',
        chapter: 'Chapter 3',
        description: 'ATC communication procedures, clearances, and read-back requirements.',
        iframeCode: '',
      },
    ]),
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/**
 * Extract the src URL from a raw YouTube <iframe> embed code string.
 * If iframeCode is already a URL, returns it directly.
 */
function extractSrc(iframeCode) {
  if (!iframeCode) return '';
  if (iframeCode.startsWith('http')) return iframeCode;
  const match = iframeCode.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO MODAL
// ─────────────────────────────────────────────────────────────────────────────
function VideoModal({ lecture, subject, onClose }) {
  const src = extractSrc(lecture.iframeCode);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)',
        zIndex: 9999, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        background: C.sidebar, borderRadius: 20, width: '100%', maxWidth: 900,
        overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.7)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,.1)',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{lecture.title}</div>
            <div style={{ color: '#93C5FD', fontSize: 12, marginTop: 2 }}>
              {subject} · {lecture.chapter}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,.15)', border: 'none',
              color: '#fff', fontSize: 22, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* iframe embed */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
          {src ? (
            <iframe
              src={src}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%', border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              title={lecture.title}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: '#64748B', gap: 12,
            }}>
              <div style={{ fontSize: 52 }}>🎬</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#94A3B8' }}>
                Video coming soon
              </div>
              <div style={{ fontSize: 12, color: '#475569' }}>
                Paste the YouTube iframe code in SUBJECTS_DATA
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {lecture.description && (
            <div style={{ color: '#94A3B8', fontSize: 12, flex: 1, marginRight: 16 }}>
              {lecture.description}
            </div>
          )}
          <div style={{ color: '#475569', fontSize: 12, flexShrink: 0 }}>
            {fmtDate(lecture.uploadedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CLASSES SECTION
// ─────────────────────────────────────────────────────────────────────────────
function LiveClassesSection() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const nowRef = useRef(Date.now());
  const [tick, setTick] = useState(0);

  const fetchClasses = () => {
    setApiError('');
    fetch('/api/classes')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        if (d.success) setClasses(d.events || []);
        else setApiError(d.message || 'API returned success:false');
      })
      .catch((err) => setApiError(err.message || 'Failed to load classes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { const id = setInterval(fetchClasses, 60_000); return () => clearInterval(id); }, []);
  useEffect(() => {
    const id = setInterval(() => { nowRef.current = Date.now(); setTick((t) => t + 1); }, 15_000);
    return () => clearInterval(id);
  }, []);

  function isLive(cls) {
    const now = nowRef.current;
    return cls.startDateTime && cls.endDateTime &&
      new Date(cls.startDateTime).getTime() <= now && now <= new Date(cls.endDateTime).getTime();
  }
  function isPast(cls) {
    if (!cls.endDateTime) return false;
    return new Date(cls.endDateTime).getTime() < nowRef.current;
  }
  function countdown(cls) {
    if (!cls.startDateTime) return null;
    const diff = new Date(cls.startDateTime).getTime() - nowRef.current;
    if (diff <= 0) return null;
    const totalMins = Math.floor(diff / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `in ${h}h ${m}m`;
    return `in ${m}m`;
  }
  function formatDateTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const visibleClasses = classes
    .filter((cls) => !isPast(cls))
    .sort((a, b) => {
      const aLive = isLive(a), bLive = isLive(b);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return new Date(a.startDateTime) - new Date(b.startDateTime);
    });

  if (loading) return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px 22px', marginBottom: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 14 }}>📅 Live Classes</div>
      {[1, 2].map((i) => (
        <div key={i} style={{ height: 72, background: C.bg, borderRadius: 10, marginBottom: 10, animation: 'sk 1.5s ease-in-out infinite' }} />
      ))}
      <style>{`@keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );

  if (apiError) return (
    <div style={{ background: C.card, borderRadius: 16, border: '1px solid #FCA5A5', padding: '20px 22px', marginBottom: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: C.red, marginBottom: 6 }}>⚠️ Live Classes — Could Not Load</div>
      <div style={{ color: C.muted, fontSize: 13, marginBottom: 10 }}>{apiError}</div>
      <button onClick={fetchClasses} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🔄 Retry</button>
    </div>
  );

  if (visibleClasses.length === 0) return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px 22px', marginBottom: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 6 }}>📅 Live Classes</div>
      <div style={{ color: C.muted, fontSize: 13 }}>No upcoming classes scheduled. Check back soon!</div>
    </div>
  );

  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px 22px', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>📅 Upcoming Live Classes</div>
        <span style={{ fontSize: 12, color: C.muted, background: C.bg, padding: '3px 10px', borderRadius: 20, border: `1px solid ${C.border}` }}>
          {visibleClasses.length} scheduled
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleClasses.map((cls) => {
          const live = isLive(cls);
          const timer = countdown(cls);
          const id = cls._id ? (typeof cls._id === 'object' ? cls._id.toString() : cls._id) : cls.id;
          const endTime = cls.endDateTime ? new Date(cls.endDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;
          const hasMeetLink = cls.meetLink && cls.meetLink.startsWith('http');
          return (
            <div key={id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 14, padding: '14px 16px', borderRadius: 12, flexWrap: 'wrap',
              background: live ? '#FFF1F1' : C.bg,
              border: `1px solid ${live ? C.red + '55' : C.border}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                  {live && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'liveDot 1.4s ease-in-out infinite' }} /> LIVE NOW
                  </span>}
                  {!live && timer && <span style={{ background: C.primaryLight, color: C.primary, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>⏰ {timer}</span>}
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{cls.title}</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>🕐 {formatDateTime(cls.startDateTime)}{endTime && ` → ${endTime}`}</div>
                {cls.description && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{cls.description}</div>}
              </div>
              {live ? (hasMeetLink
                ? <a href={cls.meetLink} target="_blank" rel="noopener noreferrer" style={{ background: `linear-gradient(135deg,${C.red},#DC2626)`, color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(239,68,68,.35)', animation: 'joinPulse 2.5s ease-in-out infinite' }}>🔴 Join Now →</a>
                : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <div style={{ background: '#FEF2F2', border: `1px solid ${C.red}55`, color: C.red, padding: '10px 16px', borderRadius: 10, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>🔴 Class is Live</div>
                  <div style={{ fontSize: 10, color: C.red }}>⚠️ No meeting link added yet</div>
                </div>)
                : <button disabled style={{ background: '#E2E8F0', color: '#94A3B8', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0 }}>⚫ Join Live {timer ? `(${timer})` : ''}</button>}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes liveDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.6)} }
        @keyframes joinPulse { 0%,100%{box-shadow:0 4px 14px rgba(239,68,68,.35)} 50%{box-shadow:0 4px 24px rgba(239,68,68,.65)} }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYWALL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PaywallModal({ user, totalLectures, onSuccess, onClose }) {
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
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: C.card, borderRadius: 20, width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,.3)', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg,${C.sidebar},${C.primary})`, padding: '28px 32px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>×</button>
          <div style={{ fontSize: 36, marginBottom: 10 }}>👑</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Unlock All Lectures</div>
          <div style={{ color: '#93C5FD', fontSize: 13, lineHeight: 1.6 }}>First {FREE_LIMIT} lectures free. Subscribe to access all {totalLectures} lectures.</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {['🎬 All Lectures', '📋 All Chapters', '📝 Mock Tests', '📊 Analytics'].map((p) => (
              <span key={p} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{p}</span>
            ))}
          </div>
        </div>
        <div style={{ padding: '24px 32px' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 14 }}>Choose Your Plan</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {Object.values(PLANS).map((p) => (
              <div key={p.id} onClick={() => setSelected(p.id)} style={{ borderRadius: 14, border: `2px solid ${selected === p.id ? C.primary : C.border}`, padding: '16px 14px', cursor: 'pointer', background: selected === p.id ? C.primaryLight : C.card, position: 'relative' }}>
                {p.badge && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: p.id === 'yearly' ? C.accent : C.primary, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{p.badge}</div>}
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
            {plan.features.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, marginBottom: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: C.green + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.green, flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
          </div>
          {error && <div style={{ background: '#FEF2F2', border: `1px solid ${C.red}30`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: C.red, marginBottom: 16 }}>⚠️ {error}</div>}
          <button onClick={handlePay} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? C.border : `linear-gradient(135deg,${C.primary},${C.purple})`, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 10 }}>
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
// SUBJECT FOLDER CARD (grid view)
// ─────────────────────────────────────────────────────────────────────────────
function SubjectFolderCard({ subjectKey, cfg, subscribed, globalOffset, onClick }) {
  const lectures = cfg.lectures;
  const total = lectures.length; // always 23
  const filled = lectures.filter((l) => !!l.iframeCode).length;
  const freeLectures = Math.max(0, Math.min(total, FREE_LIMIT - globalOffset));
  const locked = Math.max(0, total - freeLectures);

  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, borderRadius: 20,
        border: `1.5px solid ${C.border}`,
        overflow: 'hidden', cursor: 'pointer',
        transition: 'all .22s', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = `0 18px 44px rgba(0,0,0,.13)`;
        e.currentTarget.style.borderColor = cfg.color + '88';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.05)';
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {/* Colored top bar */}
      <div style={{ height: 5, background: cfg.color }} />

      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: cfg.color + '18',
            border: `1.5px solid ${cfg.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, flexShrink: 0,
          }}>{cfg.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.text, lineHeight: 1.3 }}>{subjectKey}</div>
              <span style={{ fontSize: 10, fontWeight: 700, background: C.bg, color: C.muted, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {total} slots
              </span>
            </div>
            {cfg.subtitle && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{cfg.subtitle}</div>}
            {cfg.examTags?.length > 0 && (
              <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                {cfg.examTags.map((tag) => (
                  <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: cfg.color, background: cfg.color + '12', border: `1px solid ${cfg.color}30`, padding: '1px 8px', borderRadius: 20 }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar — how many slots filled */}
        <div style={{ marginTop: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: C.muted }}>{filled} / {total} lectures uploaded</span>
            <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{Math.round((filled / total) * 100)}%</span>
          </div>
          <div style={{ height: 6, background: C.bg, borderRadius: 99, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <div style={{ height: '100%', width: `${(filled / total) * 100}%`, background: cfg.color, borderRadius: 99, transition: 'width .6s ease' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {freeLectures > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#F0FDF4', color: C.green, padding: '2px 9px', borderRadius: 20, border: `1px solid ${C.green}30` }}>🆓 {freeLectures} free</span>
          )}
          {!subscribed && locked > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#FDF4FF', color: C.purple, padding: '2px 9px', borderRadius: 20, border: `1px solid ${C.purple}30` }}>🔒 {locked} premium</span>
          )}
          {subscribed && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#F0FDF4', color: C.green, padding: '2px 9px', borderRadius: 20, border: `1px solid ${C.green}30` }}>✅ All unlocked</span>
          )}
        </div>

        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: cfg.color + '10', border: `1px solid ${cfg.color}30`,
          borderRadius: 10, padding: '9px',
          color: cfg.color, fontWeight: 700, fontSize: 12,
        }}>
          📂 Open {subjectKey} →
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURE CARD (inside a subject)
// Shows YouTube iframe preview if video is available, otherwise shows a placeholder.
// ─────────────────────────────────────────────────────────────────────────────
function LectureCard({ lecture, slotNumber, globalIndex, subjectColor, subscribed, onPlay, onLock }) {
  const isLocked = !subscribed && globalIndex >= FREE_LIMIT;
  const hasVideo = !!lecture.iframeCode;
  const src = extractSrc(lecture.iframeCode);

  // Extract YouTube video ID for thumbnail
  const ytIdMatch = src.match(/youtube\.com\/embed\/([\w-]{11})/);
  const thumbUrl = ytIdMatch ? `https://img.youtube.com/vi/${ytIdMatch[1]}/hqdefault.jpg` : null;

  return (
    <div
      onClick={() => {
        if (!hasVideo) return; // no-op for empty slots
        if (isLocked) onLock();
        else onPlay(lecture);
      }}
      style={{
        background: C.card, borderRadius: 16,
        border: `2px solid ${isLocked ? C.purple + '40' : hasVideo ? C.border : C.border}`,
        overflow: 'hidden',
        cursor: hasVideo ? 'pointer' : 'default',
        transition: 'all .2s',
        opacity: hasVideo ? 1 : 0.6,
      }}
      onMouseEnter={(e) => {
        if (!hasVideo) return;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = isLocked
          ? '0 10px 28px rgba(139,92,246,.2)'
          : `0 10px 28px ${subjectColor}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Thumbnail / iframe preview area */}
      <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#0F172A', overflow: 'hidden' }}>
        {hasVideo && thumbUrl ? (
          <img
            src={thumbUrl}
            alt={lecture.title}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover', opacity: isLocked ? 0.35 : 1,
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: hasVideo
              ? (isLocked ? 'linear-gradient(135deg,#2D1B69,#1E0A3C)' : `linear-gradient(135deg,${subjectColor}22,${C.sidebar})`)
              : 'linear-gradient(135deg,#1E293B,#0F172A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
          }}>
            {hasVideo ? (isLocked ? '🔒' : '🎬') : '⏳'}
          </div>
        )}

        {/* Locked overlay */}
        {isLocked && hasVideo && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(139,92,246,.4) 0%, transparent 60%)' }} />
        )}

        {/* Play / lock / coming-soon icon */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasVideo ? (
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: isLocked ? `linear-gradient(135deg,${C.purple},#6D28D9)` : 'rgba(255,255,255,.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 4px 20px rgba(0,0,0,.45)',
            }}>
              {isLocked ? '🔒' : '▶'}
            </div>
          ) : (
            <div style={{
              background: 'rgba(0,0,0,.5)', color: '#64748B',
              fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 20,
              border: '1px solid rgba(255,255,255,.1)',
            }}>Coming Soon</div>
          )}
        </div>

        {/* Badges */}
        {hasVideo ? (
          isLocked
            ? <div style={{ position: 'absolute', top: 8, left: 8, background: `linear-gradient(135deg,${C.purple},#6D28D9)`, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>👑 PREMIUM</div>
            : <div style={{ position: 'absolute', top: 8, left: 8, background: C.green, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>🆓 FREE</div>
        ) : null}

        {/* Slot number badge */}
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
          #{slotNumber}
        </div>

        {lecture.duration && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.8)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
            {lecture.duration}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px', background: isLocked ? '#FDFAFF' : C.card }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, background: subjectColor + '15', color: subjectColor, padding: '2px 8px', borderRadius: 20, border: `1px solid ${subjectColor}30` }}>
            {lecture.chapter}
          </span>
        </div>
        <div style={{ fontWeight: 800, fontSize: 14, color: isLocked ? C.muted : C.text, lineHeight: 1.4, marginBottom: 6 }}>
          {lecture.title}
        </div>
        {lecture.description && (
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {lecture.description}
          </div>
        )}

        {/* Lock CTA */}
        {isLocked && hasVideo && (
          <div style={{ background: `linear-gradient(135deg,${C.purple}15,${C.primary}12)`, border: `1px solid ${C.purple}35`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.purple, fontWeight: 700 }}>🔒 Subscribe to watch</div>
            <div style={{ fontSize: 11, color: C.purple, fontWeight: 700, whiteSpace: 'nowrap' }}>from ₹299 →</div>
          </div>
        )}

        {!hasVideo && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 11, color: C.muted, textAlign: 'center' }}>
            ⏳ Video will be uploaded soon
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 11, color: C.muted }}>{hasVideo ? 'Available' : 'Upcoming'}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(lecture.uploadedAt)}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION STATUS BAR
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
        <div style={{ fontSize: 13, color: C.muted }}>Subscribe to unlock all {total} lecture slots — instant access, all subjects.</div>
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
  const [activeVideo, setActiveVideo] = useState(null);   // { lecture, subjectKey }
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

  const SUBJECT_KEYS = Object.keys(SUBJECTS_DATA);

  // Compute global offset for each subject (for free-limit calculation)
  function getGlobalOffset(subjectKey) {
    const pos = SUBJECT_KEYS.indexOf(subjectKey);
    return SUBJECT_KEYS.slice(0, pos).reduce(
      (acc, k) => acc + SUBJECTS_DATA[k].lectures.length, 0
    );
  }

  const totalSlots = SUBJECT_KEYS.reduce((acc, k) => acc + SUBJECTS_DATA[k].lectures.length, 0);
  const totalFilled = SUBJECT_KEYS.reduce(
    (acc, k) => acc + SUBJECTS_DATA[k].lectures.filter((l) => !!l.iframeCode).length, 0
  );

  const selectedCfg = selectedSubject ? SUBJECTS_DATA[selectedSubject] : null;
  const selectedOffset = selectedSubject ? getGlobalOffset(selectedSubject) : 0;

  const subjectLecturesWithIndex = selectedSubject
    ? selectedCfg.lectures.map((lecture, idx) => ({
      lecture,
      slotNumber: idx + 1,
      globalIndex: selectedOffset + idx,
    }))
    : [];

  const filteredLectures = search
    ? subjectLecturesWithIndex.filter(({ lecture }) =>
      lecture.title.toLowerCase().includes(search.toLowerCase()) ||
      lecture.chapter?.toLowerCase().includes(search.toLowerCase())
    )
    : subjectLecturesWithIndex;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* VIDEO MODAL */}
      {activeVideo && (
        <VideoModal
          lecture={activeVideo.lecture}
          subject={activeVideo.subjectKey}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* PAYWALL */}
      {showPaywall && (
        <PaywallModal
          user={user}
          totalLectures={totalSlots}
          onSuccess={handlePaySuccess}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>🎬 Recorded Lectures</h2>
            <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 13 }}>
              {subscribed
                ? `👑 Premium — Full access · ${totalFilled} lectures live, ${totalSlots} total slots across ${SUBJECT_KEYS.length} subjects`
                : `First ${FREE_LIMIT} lectures free · Subscribe to unlock all ${totalSlots} slots`}
            </p>
          </div>
          {!subscribed && (
            <button onClick={() => setShowPaywall(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,${C.primary},${C.purple})`, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              👑 Get Premium
            </button>
          )}
        </div>
        {subscribed && sub && <SubStatusBar sub={sub} onUpgrade={() => setShowPaywall(true)} />}
        {!subscribed && <FreeLimitBanner total={totalSlots} onUpgrade={() => setShowPaywall(true)} />}
      </div>

      {/* LIVE CLASSES */}
      <LiveClassesSection />

      {/* ══════════════════════════════════════════
          VIEW A — SUBJECT FOLDERS
      ══════════════════════════════════════════ */}
      {!selectedSubject && (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {[
              { icon: '📚', val: SUBJECT_KEYS.length, label: 'Subjects' },
              { icon: '🎬', val: totalFilled, label: 'Uploaded' },
              { icon: '⏳', val: totalSlots - totalFilled, label: 'Coming Soon' },
              { icon: '🆓', val: FREE_LIMIT, label: 'Free Slots' },
              { icon: '👑', val: Math.max(0, totalSlots - FREE_LIMIT), label: 'Premium' },
            ].map((s) => (
              <div key={s.label} style={{ background: C.card, borderRadius: 12, padding: '10px 16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.text, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ height: 3, width: 28, borderRadius: 99, background: C.primary }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>All Subjects</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted }}>{SUBJECT_KEYS.length} subjects · 23 slots each</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {SUBJECT_KEYS.map((key) => (
              <SubjectFolderCard
                key={key}
                subjectKey={key}
                cfg={SUBJECTS_DATA[key]}
                subscribed={subscribed}
                globalOffset={getGlobalOffset(key)}
                onClick={() => { setSelectedSubject(key); setSearch(''); }}
              />
            ))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          VIEW B — LECTURES INSIDE A SUBJECT
          Shows all 23 slots (filled or placeholder)
      ══════════════════════════════════════════ */}
      {selectedSubject && selectedCfg && (
        <>
          {/* Breadcrumb header */}
          <div style={{
            background: C.card, border: `1.5px solid ${selectedCfg.color}40`,
            borderRadius: 16, padding: '18px 22px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: selectedCfg.color + '18', border: `1.5px solid ${selectedCfg.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
              }}>{selectedCfg.icon}</div>
              <div>
                <div style={{ color: C.text, fontWeight: 900, fontSize: 18 }}>{selectedSubject}</div>
                {selectedCfg.subtitle && <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{selectedCfg.subtitle}</div>}
                <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                  {selectedCfg.examTags?.map((tag) => (
                    <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: selectedCfg.color, background: selectedCfg.color + '12', border: `1px solid ${selectedCfg.color}30`, padding: '1px 8px', borderRadius: 20 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setSelectedSubject(null); setSearch(''); }}
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px', fontSize: 13, color: C.muted, cursor: 'pointer', fontWeight: 600 }}
            >← All Subjects</button>
          </div>

          {/* Info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.muted }}>
              {selectedCfg.lectures.filter((l) => !!l.iframeCode).length} uploaded · {selectedCfg.lectures.filter((l) => !l.iframeCode).length} coming soon
            </span>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, borderRadius: 10, padding: '9px 14px', border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <span style={{ color: C.muted }}>🔍</span>
            <input
              placeholder={`Search in ${selectedSubject}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: C.text, width: '100%' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>}
          </div>

          {/* 
            ── HOW TO ADD A VIDEO ──────────────────────────────────────────────
            1. Go to YouTube video → Share → Embed → Copy the <iframe> code
            2. Open this file and find SUBJECTS_DATA
            3. Paste the iframe code into the `iframeCode` field of the right slot
            4. Also update `title`, `chapter`, `description` for that slot
            ───────────────────────────────────────────────────────────────────
          */}

          {/* How-to tip box (only shown when some slots are empty) */}
          {selectedCfg.lectures.some((l) => !l.iframeCode) && (
            <div style={{
              background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 2 }}>
                  How to add a YouTube video to an empty slot
                </div>
                <div style={{ fontSize: 12, color: '#B45309', lineHeight: 1.6 }}>
                  Open <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 }}>SUBJECTS_DATA</code> in this file → find the <strong>{selectedSubject}</strong> lectures array → paste the YouTube <code>&lt;iframe&gt;</code> embed code into the <code>iframeCode</code> field of the corresponding slot.
                </div>
              </div>
            </div>
          )}

          {/* Lecture grid — all 23 slots */}
          {filteredLectures.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 6 }}>No lectures found</div>
              <div style={{ color: C.muted, fontSize: 13 }}>Try a different search term</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {filteredLectures.map(({ lecture, slotNumber, globalIndex }) => (
                <LectureCard
                  key={slotNumber}
                  lecture={lecture}
                  slotNumber={slotNumber}
                  globalIndex={globalIndex}
                  subjectColor={selectedCfg.color}
                  subscribed={subscribed}
                  onPlay={(l) => setActiveVideo({ lecture: l, subjectKey: selectedSubject })}
                  onLock={() => setShowPaywall(true)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Bottom CTA */}
      {!subscribed && (
        <div style={{ marginTop: 32, background: `linear-gradient(135deg,${C.sidebar},${C.primary})`, borderRadius: 20, padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Ready to Unlock Everything?</div>
          <div style={{ color: '#93C5FD', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            Get unlimited access to all {totalSlots} lecture slots, mock tests, chapter tests and more.<br />
            Plans starting at just <strong style={{ color: C.accent }}>₹299/month</strong>.
          </div>
          <button onClick={() => setShowPaywall(true)} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>
            👑 Subscribe Now — Starting ₹299 →
          </button>
        </div>
      )}
    </div>
  );
}