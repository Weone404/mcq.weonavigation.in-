'use client';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearUser, getStats, getResults, fetchAndStoreUser } from '../../lib/storage';
import { chapters, questions as allQuestions } from '../../data/questions';
import LecturesPage from './LecturesPage.jsx';
import ResourcesPage from './ResourcesPage.jsx';
import DoubtChat from '../../components/DoubtChat/page.jsx';
import StudentProfilePage from './Studentprofilepage.jsx'

// ─── COLOUR TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F4FF',
  sidebar: '#0A1628',
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
};

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState({ isMobile: false, isTablet: false, isDesktop: true, width: 1200 });
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setBp({
        isMobile: w < 640,
        isTablet: w >= 640 && w < 1024,
        isDesktop: w >= 1024,
        width: w,
      });
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return bp;
}

// ─── ANIMATED COUNTER HOOK ────────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target || isNaN(Number(target))) { setValue(target); return; }
    const num = Number(target);
    const start = Date.now();
    const raf = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * num));
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ─── FADE-IN HOOK ─────────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

// ─── SHUFFLE HELPER ────────────────────────────────────────────────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMockPool(count = 50, subjectChapterIds = null) {
  let pool = [];
  if (subjectChapterIds && subjectChapterIds.length > 0) {
    subjectChapterIds.forEach(id => {
      if (allQuestions[id]) pool.push(...allQuestions[id]);
    });
  } else {
    Object.values(allQuestions).forEach(arr => pool.push(...arr));
  }
  if (pool.length === 0) return [];
  return shuffleArray(pool).slice(0, Math.min(count, pool.length));
}



export const NAV_SUB_SUBJECTS = [
  {
    id: 'general_navigation',
    title: 'General Navigation',
    subtitle: 'Dead Reckoning, Maps, Charts & Plotting',
    icon: '🗺️',
    color: '#10B981',
    gradient: 'linear-gradient(135deg,#10B981,#34D399)',
    parts: [
      {
        label: 'General Navigation',
        color: '#10B981',
        chapterIds: [
          'gn01', 'gn02', 'gn03', 'gn04', 'gn05',
          'gn06', 'gn07', 'gn08', 'gn09', 'gn10', 'gn11',
        ],
      },
    ],
    chapterIds: [
      'gn01', 'gn02', 'gn03', 'gn04', 'gn05',
      'gn06', 'gn07', 'gn08', 'gn09', 'gn10', 'gn11',
    ],
    stats: '10 Chapters · 200+ MCQs',
    exam: 'ATPL / CPL',
    comingSoon: false,
  },
  {
    id: 'radio_navigation',
    title: 'Radio Navigation',
    subtitle: 'VOR, DME, ILS, NDB, RNAV & GPS',
    icon: '📡',
    color: '#059669',
    gradient: 'linear-gradient(135deg,#059669,#10B981)',
    parts: [
      {
        label: 'Radio Navigation',
        color: '#059669',
        chapterIds: [
          'rn01', 'rn02', 'rn03', 'rn04', 'rn05',
          'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
        ],
      },
    ],
    chapterIds: [
      'rn01', 'rn02', 'rn03', 'rn04', 'rn05',
      'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
    ],
    stats: '10 Chapters · 200+ MCQs',
    exam: 'ATPL / CPL',
    comingSoon: false,
  },
  {
    id: 'instrument_navigation',
    title: 'Instrument Navigation',
    subtitle: 'Flight Instruments, Gyroscopes & Compasses',
    icon: '🛩️',
    color: '#0284C7',
    gradient: 'linear-gradient(135deg,#0284C7,#38BDF8)',
    parts: [
      {
        label: 'Instrument Navigation',
        color: '#0284C7',
        chapterIds: [
          'in01', 'in02', 'in03', 'in04',
          'in05', 'in06', 'in07', 'in08',
        ],
      },
    ],
    chapterIds: [
      'in01', 'in02', 'in03', 'in04',
      'in05', 'in06', 'in07', 'in08',
    ],
    stats: '8 Chapters · 150+ MCQs',
    exam: 'ATPL / CPL',
    comingSoon: false,
  },
];

export const ATPL_SUB_SUBJECTS = [
  {
    id: 'atpl_meteorology',
    title: 'Meteorology',
    subtitle: 'Weather, Clouds, Pressure Systems',
    icon: '🌦️',
    color: '#0EA5E9',
    gradient: 'linear-gradient(135deg,#0EA5E9,#38BDF8)',
    parts: [
      {
        label: 'Meteorology',
        color: '#0EA5E9',
        chapterIds: [
          'met01', 'met02', 'met03', 'met04', 'met05', 'met06', 'met07', 'met08',
          'met09', 'met10', 'met11', 'met12', 'met13', 'met14', 'met15', 'met16',
          'met17', 'met18', 'met19', 'met20', 'met21', 'met22', 'met23',
        ],
      },
    ],
    chapterIds: [
      'met01', 'met02', 'met03', 'met04', 'met05', 'met06', 'met07', 'met08',
      'met09', 'met10', 'met11', 'met12', 'met13', 'met14', 'met15', 'met16',
      'met17', 'met18', 'met19', 'met20', 'met21', 'met22', 'met23',
    ],
    stats: '23 Chapters · 300+ MCQs',
    exam: 'ATPL / CPL',
    comingSoon: false,
    isMock: true,
  },
  {
    id: 'atpl_navigation',
    title: 'Navigation',
    subtitle: 'General, Radio & Instrument Navigation',
    icon: '🗺️',
    color: '#10B981',
    gradient: 'linear-gradient(135deg,#10B981,#34D399)',
    parts: [
      {
        label: 'Part I – General Navigation',
        color: '#10B981',
        chapterIds: [
          'gn01', 'gn02', 'gn03', 'gn04', 'gn05',
          'gn06', 'gn07', 'gn08', 'gn09', 'gn10', 'gn11',
        ],
      },
      {
        label: 'Part II – Radio Navigation',
        color: '#059669',
        chapterIds: [
          'rn01', 'rn02', 'rn03', 'rn04', 'rn05',
          'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
        ],
      },
      {
        label: 'Part III – Instrument Navigation',
        color: '#0284C7',
        chapterIds: [
          'in01', 'in02', 'in03', 'in04',
          'in05', 'in06', 'in07', 'in08',
        ],
      },
    ],
    chapterIds: [
      'gn01', 'gn02', 'gn03', 'gn04', 'gn05', 'gn06', 'gn07', 'gn08', 'gn09', 'gn10', 'gn11',
      'rn01', 'rn02', 'rn03', 'rn04', 'rn05', 'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
      'in01', 'in02', 'in03', 'in04', 'in05', 'in06', 'in07', 'in08',
    ],
    stats: '28 Chapters · 550+ MCQs',
    exam: 'ATPL / CPL',
    comingSoon: false,
    isMock: true,
    hasSubjects: true,
    subSubjects: NAV_SUB_SUBJECTS, // reuses existing NAV_SUB_SUBJECTS
  },
];

// ─── SUBJECTS CONFIG ───────────────────────────────────────────────────────────
export const SUBJECTS = [
  {
    id: 'air_regulations',
    title: 'Air Regulations',
    subtitle: 'ICAO, DGCA, National Law & Procedures',
    icon: '📋',
    color: '#1D4ED8',
    gradient: 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
    parts: [
      {
        label: 'Part I – Air Regulations',
        color: '#1D4ED8',
        chapterIds: [
          'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10',
          'ch11', 'ch12', 'ch13', 'ch14', 'ch15', 'ch16', 'ch17', 'ch18', 'ch19', 'ch20',
          'ch21', 'ch22',
        ],
      },
      {
        label: 'Part II – Human Factors',
        color: '#8B5CF6',
        chapterIds: ['ch23', 'ch24', 'ch25', 'ch26'],
      },
      {
        label: 'Part III – QB Extra',
        color: '#0EA5E9',
        chapterIds: [
          'qb01', 'qb02', 'qb03', 'qb04', 'qb05', 'qb06', 'qb07',
          'qb08', 'qb09', 'qb10', 'qb11', 'qb12', 'qb13',
        ],
      },
    ],
    chapterIds: [
      'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10',
      'ch11', 'ch12', 'ch13', 'ch14', 'ch15', 'ch16', 'ch17', 'ch18', 'ch19', 'ch20',
      'ch21', 'ch22', 'ch23', 'ch24', 'ch25', 'ch26',
      'qb01', 'qb02', 'qb03', 'qb04', 'qb05', 'qb06', 'qb07',
      'qb08', 'qb09', 'qb10', 'qb11', 'qb12', 'qb13',
    ],
    stats: '39 Chapters · 500+ MCQs',
    exam: 'ATPL / CPL / DGCA',
    comingSoon: false,
    hasSubjects: false,
  },

  {
    id: 'meteorology',
    title: 'Meteorology',
    subtitle: 'Weather, Clouds, Pressure Systems',
    icon: '🌦️',
    color: '#0EA5E9',
    gradient: 'linear-gradient(135deg,#0EA5E9,#38BDF8)',
    parts: [
      {
        label: 'Meteorology',
        color: '#0EA5E9',
        chapterIds: [
          'met01', 'met02', 'met03', 'met04', 'met05', 'met06', 'met07', 'met08',
          'met09', 'met10', 'met11', 'met12', 'met13', 'met14', 'met15', 'met16',
          'met17', 'met18', 'met19', 'met20', 'met21', 'met22', 'met23',
        ],
      },
    ],
    chapterIds: [
      'met01', 'met02', 'met03', 'met04', 'met05', 'met06', 'met07', 'met08',
      'met09', 'met10', 'met11', 'met12', 'met13', 'met14', 'met15', 'met16',
      'met17', 'met18', 'met19', 'met20', 'met21', 'met22', 'met23',
    ],
    stats: '23 Chapters · 300+ MCQs',
    exam: 'ATPL / CPL',
    comingSoon: false,
    hasSubjects: false,
  },

  {
    id: 'navigation',
    title: 'Navigation',
    subtitle: 'General, Radio & Instrument Navigation',
    icon: '🗺️',
    color: '#10B981',
    gradient: 'linear-gradient(135deg,#10B981,#34D399)',
    parts: [
      {
        label: 'Part I – General Navigation',
        color: '#10B981',
        chapterIds: [
          'gn01', 'gn02', 'gn03', 'gn04', 'gn05',
          'gn06', 'gn07', 'gn08', 'gn09', 'gn10', 'gn11',
        ],
      },
      {
        label: 'Part II – Radio Navigation',
        color: '#059669',
        chapterIds: [
          'rn01', 'rn02', 'rn03', 'rn04', 'rn05',
          'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
        ],
      },
      {
        label: 'Part III – Instrument Navigation',
        color: '#0284C7',
        chapterIds: [
          'in01', 'in02', 'in03', 'in04',
          'in05', 'in06', 'in07', 'in08',
        ],
      },
    ],
    chapterIds: [
      'gn01', 'gn02', 'gn03', 'gn04', 'gn05', 'gn06', 'gn07', 'gn08', 'gn09', 'gn10', 'gn11',
      'rn01', 'rn02', 'rn03', 'rn04', 'rn05', 'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
      'in01', 'in02', 'in03', 'in04', 'in05', 'in06', 'in07', 'in08',
    ],
    stats: '28 Chapters · 550+ MCQs',
    exam: 'ATPL / CPL',
    comingSoon: false,
    hasSubjects: true,
    subSubjects: NAV_SUB_SUBJECTS,
  },

  {
  id: 'technical',
  title: 'Technical General',
  subtitle: 'Airframes, Engines, Systems',
  icon: '🔧',
  color: '#F59E0B',
  gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
  parts: [
    {
      label: 'Part I – Principle of Flight',
      color: '#F59E0B',
      chapterIds: ['tg01', 'tg02'],
    },
    {
      label: 'Part II – Engines',
      color: '#D97706',
      chapterIds: ['tg03', 'tg04'],
    },
    {
      label: 'Part III – Aircraft Systems',
      color: '#B45309',
      chapterIds: ['tg05', 'tg06', 'tg07', 'tg08'],
    },
  ],
  chapters: [
    {
      id: 'tg01',
      title: 'Principle of Flight',
      topics: [
        { id: 'tg01_t01', label: 'Overview and Definitions' },
        { id: 'tg01_t02', label: 'Atmosphere' },
        { id: 'tg01_t03', label: 'Basic Aerodynamic Theory' },
        { id: 'tg01_t04', label: 'Subsonic Airflow' },
        { id: 'tg01_t05', label: 'Lift' },
        { id: 'tg01_t06', label: 'Drag' },
        { id: 'tg01_t07', label: 'Stalling' },
        { id: 'tg01_t08', label: 'High Lift Devices' },
        { id: 'tg01_t09', label: 'Airframe Contamination' },
        { id: 'tg01_t10', label: 'Stability and Control' },
        { id: 'tg01_t11', label: 'Controls' },
        { id: 'tg01_t12', label: 'Flight Mechanics' },
        { id: 'tg01_t13', label: 'High Speed Flight' },
        { id: 'tg01_t14', label: 'Limitations' },
        { id: 'tg01_t15', label: 'Windshear' },
        { id: 'tg01_t16', label: 'Propellers' },
      ],
    },
    {
      id: 'tg02',
      title: 'Performance',
      topics: [
        { id: 'tg02_t01', label: 'Performance' },
      ],
    },
    {
      id: 'tg03',
      title: 'Jet Engine',
      topics: [
        { id: 'tg03_t01', label: 'Basics of Jet Engine' },
        { id: 'tg03_t02', label: 'Types of Engine' },
        { id: 'tg03_t03', label: 'Compressors' },
        { id: 'tg03_t04', label: 'Combustion Chamber' },
        { id: 'tg03_t05', label: 'Turbine Assembly' },
        { id: 'tg03_t06', label: 'Jet Pipe' },
        { id: 'tg03_t07', label: 'Reverse Thrust' },
        { id: 'tg03_t08', label: 'Engine Starting System Requirements' },
        { id: 'tg03_t09', label: 'APU (Auxiliary Power Unit)' },
      ],
    },
    {
      id: 'tg04',
      title: 'Piston Engine',
      topics: [
        { id: 'tg04_t01', label: 'Introduction' },
        { id: 'tg04_t02', label: 'General' },
        { id: 'tg04_t03', label: 'Lubrication' },
        { id: 'tg04_t04', label: 'Cooling' },
        { id: 'tg04_t05', label: 'Ignition' },
        { id: 'tg04_t06', label: 'Fuel' },
        { id: 'tg04_t07', label: 'Mixture' },
        { id: 'tg04_t08', label: 'Carburettors' },
        { id: 'tg04_t09', label: 'Icing' },
        { id: 'tg04_t10', label: 'Fuel Injection' },
        { id: 'tg04_t11', label: 'Performance and Power Augmentation' },
        { id: 'tg04_t12', label: 'Propellers' },
      ],
    },
    {
      id: 'tg05',
      title: 'Airframe Systems',
      topics: [
        { id: 'tg05_t01', label: 'Fuselage, Wings and Stabilizing Surfaces' },
        { id: 'tg05_t02', label: 'Basic Hydraulics' },
        { id: 'tg05_t03', label: 'Landing Gear' },
        { id: 'tg05_t04', label: 'Aircraft Wheels' },
        { id: 'tg05_t05', label: 'Aircraft Tyres' },
        { id: 'tg05_t06', label: 'Aircraft Brakes' },
        { id: 'tg05_t07', label: 'Flight Control System' },
        { id: 'tg05_t08', label: 'Flight Controls' },
        { id: 'tg05_t09', label: 'Powered Flying Controls' },
        { id: 'tg05_t10', label: 'Aircraft Pneumatic Systems' },
        { id: 'tg05_t11', label: 'Pressurization Systems' },
        { id: 'tg05_t12', label: 'Ice and Rain Protection' },
        { id: 'tg05_t13', label: 'Aircraft Oxygen Equipment' },
        { id: 'tg05_t14', label: 'Smoke Detection' },
        { id: 'tg05_t15', label: 'Fire Detection and Protection' },
        { id: 'tg05_t16', label: 'Aircraft Fuel Systems' },
      ],
    },
    {
      id: 'tg06',
      title: 'Electrical Systems',
      topics: [
        { id: 'tg06_t01', label: 'Electrical Systems' },
      ],
    },
    {
      id: 'tg07',
      title: 'Instruments',
      topics: [
        { id: 'tg07_t01', label: 'Instruments' },
      ],
    },
    {
      id: 'tg08',
      title: 'Avionics',
      topics: [
        { id: 'tg08_t01', label: 'Avionics' },
      ],
    },
  ],
  chapterIds: ['tg01', 'tg02', 'tg03', 'tg04', 'tg05', 'tg06', 'tg07', 'tg08'],
  stats: '8 Chapters · 200+ MCQs',
  exam: 'AME / ATPL',
  comingSoon: false,
  hasSubjects: false,
},




  {
    id: 'rtfm',
    title: 'Radio Telephony',
    subtitle: 'RTF Procedures & Phraseology',
    icon: '📻',
    color: '#EF4444',
    gradient: 'linear-gradient(135deg,#EF4444,#F87171)',
    parts: [
      {
        label: 'Radio Telephony',
        color: '#EF4444',
        chapterIds: ['rt01', 'rt02', 'rt03'],
      },
    ],
    chapterIds: ['rt01', 'rt02', 'rt03'],
    stats: '3 Chapters · 60+ MCQs',
    exam: 'RTR (Aero)',
    comingSoon: false,
    hasSubjects: false,
  },

  {
    id: 'mock',
    title: 'Mock Test',
    subtitle: 'Full DGCA-style 100Q paper',
    icon: '🎯',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
    parts: [],
    chapterIds: [
      'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10',
      'ch11', 'ch12', 'ch13', 'ch14', 'ch15', 'ch16', 'ch17', 'ch18', 'ch19', 'ch20',
      'ch21', 'ch22', 'ch23', 'ch24', 'ch25', 'ch26',
      'qb01', 'qb02', 'qb03', 'qb04', 'qb05', 'qb06', 'qb07',
      'qb08', 'qb09', 'qb10', 'qb11', 'qb12', 'qb13',
      'met01', 'met02', 'met03', 'met04', 'met05', 'met06', 'met07', 'met08',
      'met09', 'met10', 'met11', 'met12', 'met13', 'met14', 'met15', 'met16',
      'met17', 'met18', 'met19', 'met20', 'met21', 'met22', 'met23',
      'gn01', 'gn02', 'gn03', 'gn04', 'gn05', 'gn06', 'gn07', 'gn08', 'gn09', 'gn10', 'gn11',
      'rn01', 'rn02', 'rn03', 'rn04', 'rn05', 'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
      'in01', 'in02', 'in03', 'in04', 'in05', 'in06', 'in07', 'in08',
      'tg01', 'tg02', 'tg03', 'tg04', 'tg05', 'tg06', 'tg07', 'tg08',
      'rt01', 'rt02', 'rt03',
    ],
    stats: '100 Questions · 120 Mins',
    exam: 'All Exams',
    isMock: true,
    comingSoon: false,
    hasSubjects: false,
  },
  // After the mock subject object, before the closing ];
{
  id: 'atpl',
  title: 'ATPL',
  subtitle: 'Meteorology & Navigation Mock Tests',
  icon: '✈️',
  color: '#0EA5E9',
  gradient: 'linear-gradient(135deg,#0EA5E9,#6366F1)',
  parts: [],
  chapterIds: [
    'met01', 'met02', 'met03', 'met04', 'met05', 'met06', 'met07', 'met08',
    'met09', 'met10', 'met11', 'met12', 'met13', 'met14', 'met15', 'met16',
    'met17', 'met18', 'met19', 'met20', 'met21', 'met22', 'met23',
    'gn01', 'gn02', 'gn03', 'gn04', 'gn05', 'gn06', 'gn07', 'gn08', 'gn09', 'gn10', 'gn11',
    'rn01', 'rn02', 'rn03', 'rn04', 'rn05', 'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
    'in01', 'in02', 'in03', 'in04', 'in05', 'in06', 'in07', 'in08',
  ],
  stats: '2 Subjects · Mock Only',
  exam: 'ATPL / CPL',
  isMock: true,
  isAptl: true,
  comingSoon: false,
  hasSubjects: true,         // ← changed to true
  subSubjects: ATPL_SUB_SUBJECTS,  // ← added
},
];


export function getQuestionsForSubject(subjectId, questions, limit = null) {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  if (!subject) return [];
  let pool = subject.chapterIds.flatMap(id => questions[id] ?? []);
  if (subject.isMock) {
    pool = pool.sort(() => Math.random() - 0.5).slice(0, limit ?? 100);
  }
  return pool;
}

export const MOCK_ALL_OPTION = {
  id: 'all',
  title: 'All Subjects',
  subtitle: 'Mixed questions from every chapter',
  icon: '🎯',
  color: '#8B5CF6',
  gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
  chapterIds: [
    'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10',
    'ch11', 'ch12', 'ch13', 'ch14', 'ch15', 'ch16', 'ch17', 'ch18', 'ch19', 'ch20',
    'ch21', 'ch22', 'ch23', 'ch24', 'ch25', 'ch26',
    'qb01', 'qb02', 'qb03', 'qb04', 'qb05', 'qb06', 'qb07',
    'qb08', 'qb09', 'qb10', 'qb11', 'qb12', 'qb13',
    'met01', 'met02', 'met03', 'met04', 'met05', 'met06', 'met07', 'met08',
    'met09', 'met10', 'met11', 'met12', 'met13', 'met14', 'met15', 'met16',
    'met17', 'met18', 'met19', 'met20', 'met21', 'met22', 'met23',
    'gn01', 'gn02', 'gn03', 'gn04', 'gn05', 'gn06', 'gn07', 'gn08', 'gn09', 'gn10', 'gn11',
    'rn01', 'rn02', 'rn03', 'rn04', 'rn05', 'rn06', 'rn07', 'rn08', 'rn09', 'rn10',
    'in01', 'in02', 'in03', 'in04', 'in05', 'in06', 'in07', 'in08',
    'tg01', 'tg02', 'tg03', 'tg04', 'tg05', 'tg06', 'tg07', 'tg08',
    'rt01', 'rt02', 'rt03',
  ],
  stats: '100 questions · all chapters combined',
  exam: 'All Exams',
  comingSoon: false,
  hasSubjects: false,
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '??';
}
function getBadge(stats) {
  if (stats.testsAttempted === 0) return { icon: '🛩️', label: 'Cadet', color: C.muted };
  if (stats.avgScore >= 80) return { icon: '🥇', label: 'Ace Pilot', color: C.accent };
  if (stats.avgScore >= 60) return { icon: '🥈', label: 'Co-Pilot', color: C.muted };
  return { icon: '🥉', label: 'Student Pilot', color: '#cd7f32' };
}
function getScoreColor(pct) {
  if (pct >= 80) return C.green;
  if (pct >= 50) return C.accent;
  return C.red;
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── TINY UI ──────────────────────────────────────────────────────────────────
const ProgressBar = ({ value, color = C.primary, height = 6, animated = false }) => (
  <div style={{ background: C.border, borderRadius: 99, height, overflow: 'hidden', width: '100%' }}>
    <div style={{
      width: `${Math.min(value || 0, 100)}%`,
      height: '100%',
      background: animated
        ? `linear-gradient(90deg, ${color}, ${color}cc, ${color})`
        : color,
      backgroundSize: animated ? '200% 100%' : undefined,
      borderRadius: 99,
      WebkitTransition: 'width .8s cubic-bezier(.4,0,.2,1)',
      transition: 'width .8s cubic-bezier(.4,0,.2,1)',
      WebkitAnimation: animated ? 'barShimmer 2s infinite' : undefined,
      animation: animated ? 'barShimmer 2s infinite' : undefined,
    }} />
  </div>
);

const Badge = ({ label, color = C.primary }) => (
  <span style={{
    background: hexAlpha(color, 0.13),
    color,
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 99,
    letterSpacing: 0.3,
    display: 'inline-block',
    WebkitAnimation: 'fadeIn .3s ease',
    animation: 'fadeIn .3s ease',
  }}>{label}</span>
);

// ─── ANIMATED STAT CARD ────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = C.primary, delay = 0 }) => {
  const visible = useFadeIn(delay);
  const isNum = !isNaN(Number(String(value).replace('%', '')));
  const numPart = isNum ? Number(String(value).replace('%', '')) : 0;
  const suffix = String(value).includes('%') ? '%' : '';
  const counted = useCountUp(isNum ? numPart : 0, 1000);

  return (
    <div style={{
      background: C.card,
      borderRadius: 16,
      padding: '20px 22px',
      border: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      WebkitTransition: 'opacity .5s ease, transform .5s ease',
      transition: 'opacity .5s ease, transform .5s ease',
    }}>
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: hexAlpha(color, 0.08),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        flexShrink: 0,
        marginRight: 16,
        WebkitAnimation: 'iconPop .5s ease',
        animation: 'iconPop .5s ease',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
          {isNum ? `${counted}${suffix}` : value}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
};

const Skeleton = ({ w = '100%', h = 16, r = 8 }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)',
    backgroundSize: '200% 100%',
    WebkitAnimation: 'shimmer 1.4s infinite',
    animation: 'shimmer 1.4s infinite',
  }} />
);

// ─── COMING SOON PLACEHOLDER ──────────────────────────────────────────────────
function ComingSoonPage({ subject, onBack }) {
  const visible = useFadeIn(0);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 480, background: C.card, borderRadius: 20, border: `1px solid ${C.border}`,
      padding: '48px 24px', textAlign: 'center',
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(.97)',
      WebkitTransition: 'opacity .4s ease, transform .4s ease',
      transition: 'opacity .4s ease, transform .4s ease',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20, marginBottom: 20,
        background: subject.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
        boxShadow: `0 8px 32px ${hexAlpha(subject.color, 0.25)}`,
        WebkitAnimation: 'float 3s ease-in-out infinite',
        animation: 'float 3s ease-in-out infinite',
      }}>{subject.icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 8 }}>{subject.title}</div>
      <div style={{ fontSize: 15, color: C.muted, marginBottom: 24, maxWidth: 360, lineHeight: 1.7 }}>
        {subject.subtitle} — this subject is being prepared by our content team.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
        {[['📅', 'Launching Soon'], ['✍️', 'MCQs in Progress'], ['🎯', subject.exam]].map(([icon, label]) => (
          <span key={label} style={{
            background: hexAlpha(subject.color, 0.08), color: subject.color,
            border: `1px solid ${hexAlpha(subject.color, 0.18)}`,
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
            margin: '0 6px 6px 0', display: 'inline-block',
          }}>{icon} {label}</span>
        ))}
      </div>
      <button onClick={onBack} style={{
        background: subject.gradient, color: '#fff', border: 'none', borderRadius: 12,
        padding: '13px 30px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
        WebkitAppearance: 'none', appearance: 'none',
        WebkitTransition: 'transform .15s, box-shadow .15s',
        transition: 'transform .15s, box-shadow .15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${hexAlpha(subject.color, 0.3)}`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
      >← Back to Subjects</button>
    </div>
  );
}

// ─── MOCK LEADERBOARD WIDGET ──────────────────────────────────────────────────
const MOCK_LB_SUBJECT_TABS = [
  { id: 'all', label: 'All', icon: '🎯', color: C.purple },
  { id: 'air_regulations', label: 'Air Regs', icon: '📋', color: C.primary },
  { id: 'meteorology', label: 'Meteorology', icon: '🌦️', color: '#0EA5E9' },
  { id: 'navigation', label: 'Navigation', icon: '🗺️', color: C.green },
  { id: 'technical', label: 'Technical', icon: '🔧', color: C.accent },
  { id: 'rtfm', label: 'Radio Tel.', icon: '📻', color: C.red },
];
const LB_MEDALS = ['🥇', '🥈', '🥉'];

function lbGetAccuracyColor(pct) {
  return pct >= 80 ? C.green : pct >= 50 ? C.accent : C.red;
}
function lbFormatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function LbProgressBar({ value, color = C.primary, height = 5 }) {
  return (
    <div style={{ background: C.border, borderRadius: 99, height, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${Math.min(value || 0, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .6s ease' }} />
    </div>
  );
}

function LbBadge({ label, color = C.primary }) {
  return (
    <span style={{ background: hexAlpha(color, 0.13), color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, letterSpacing: 0.3, display: 'inline-block' }}>
      {label}
    </span>
  );
}

function LbSkeleton({ w = '100%', h = 14, r = 6 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
  );
}

function MiniPodium({ top3, user }) {
  if (top3.length < 2) return null;
  const podiumColors = { 1: C.accent, 2: C.primary, 3: C.purple };
  const order = top3.length >= 3
    ? [{ e: top3[1], rank: 2, h: 80 }, { e: top3[0], rank: 1, h: 110 }, { e: top3[2], rank: 3, h: 60 }]
    : [{ e: top3[1], rank: 2, h: 80 }, { e: top3[0], rank: 1, h: 110 }];

  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 16px 0', marginBottom: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>🏆 Top Performers</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Best accuracy in mock tests</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
        {order.map(({ e, rank, h }, idx) => {
          const isYou = e.email === user?.email;
          const color = podiumColors[rank];
          return (
            <div key={e.email} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 100,
              WebkitAnimation: `slideUp .5s ease ${idx * 0.12}s both`,
              animation: `slideUp .5s ease ${idx * 0.12}s both`,
            }}>
              {isYou && (
                <span style={{ background: hexAlpha(C.green, 0.15), color: C.green, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, marginBottom: 3, display: 'inline-block' }}>You</span>
              )}
              <div style={{
                width: 48, height: 48, borderRadius: 24,
                background: `linear-gradient(135deg,${color},${color}cc)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 6,
                border: `2px solid ${isYou ? C.green : '#fff'}`,
                boxShadow: `0 3px 10px ${hexAlpha(color, 0.3)}`,
                WebkitTransition: 'transform .2s',
                transition: 'transform .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {getInitials(e.name)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 1 }}>
                {e.name.split(' ')[0]}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color, marginBottom: 3 }}>{e.accuracy}%</div>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{LB_MEDALS[rank - 1]}</div>
              <div style={{
                width: '100%', height: h,
                background: hexAlpha(color, 0.1),
                border: `2px solid ${color}`, borderBottom: 'none',
                borderRadius: '6px 6px 0 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color, fontSize: 14, fontWeight: 900 }}>#{rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LbRankingsTable({ board, user, loading, onViewFull }) {
  if (loading) {
    return (
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}><LbSkeleton h={16} w="40%" /></div>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} style={{ padding: '14px 20px', borderTop: i > 0 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <LbSkeleton w={32} h={32} r={16} /><LbSkeleton w={36} h={36} r={18} />
            <div style={{ flex: 1 }}><LbSkeleton h={13} style={{ marginBottom: 5 }} /><LbSkeleton h={10} w="50%" /></div>
            <LbSkeleton w={60} h={14} />
          </div>
        ))}
      </div>
    );
  }

  if (board.length === 0) {
    return (
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '36px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 10, WebkitAnimation: 'float 3s ease-in-out infinite', animation: 'float 3s ease-in-out infinite' }}>🏆</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 5 }}>No mock test scores yet!</div>
        <div style={{ fontSize: 13, color: C.muted }}>Complete a mock test to appear on the leaderboard.</div>
      </div>
    );
  }

  const visible = board.slice(0, 10);

  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>All Rankings</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: C.muted }}>{board.length} pilots</span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, WebkitAnimation: 'pulse 2s ease-in-out infinite', animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
      </div>

      <div style={{ padding: '7px 20px', background: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, fontSize: 11, color: C.muted, fontWeight: 700, flexShrink: 0, letterSpacing: 0.5 }}>Rank</div>
        <div style={{ width: 36, flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 0.5 }}>Student</div>
        <div style={{ width: 72, fontSize: 11, color: C.muted, fontWeight: 700, textAlign: 'right', flexShrink: 0, letterSpacing: 0.5 }}>Score</div>
        <div style={{ width: 90, fontSize: 11, color: C.muted, fontWeight: 700, textAlign: 'right', flexShrink: 0, letterSpacing: 0.5 }}>Accuracy</div>
      </div>

      {visible.map((entry, i) => {
        const isYou = entry.email === user?.email;
        const rank = i + 1;
        return (
          <div key={`${entry.email}-${entry.subject}-${i}`}
            style={{
              padding: '14px 20px', borderTop: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
              background: isYou ? C.primaryLight : 'transparent',
              WebkitTransition: 'background .15s, transform .15s',
              transition: 'background .15s, transform .15s',
              WebkitAnimation: `slideInRow .35s ease ${i * 0.05}s both`,
              animation: `slideInRow .35s ease ${i * 0.05}s both`,
            }}
            onMouseEnter={e => { if (!isYou) { e.currentTarget.style.background = C.bg; e.currentTarget.style.transform = 'translateX(3px)'; } }}
            onMouseLeave={e => { if (!isYou) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; } }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: isYou ? `linear-gradient(135deg,${C.primary},${C.purple})` : rank <= 3 ? 'transparent' : C.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: rank <= 3 ? 18 : 12, fontWeight: 700, color: isYou ? '#fff' : C.text,
            }}>
              {rank <= 3 ? LB_MEDALS[rank - 1] : `#${rank}`}
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: 19, flexShrink: 0,
              background: `linear-gradient(135deg,${C.primary},${C.purple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 13,
            }}>
              {getInitials(entry.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
                {isYou && <LbBadge label="You" color={C.green} />}
                {rank === 1 && <LbBadge label="Top" color={C.accent} />}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {entry.subjectLabel || entry.subject} · {entry.attempts || 1} attempt{(entry.attempts || 1) !== 1 ? 's' : ''} · {lbFormatDate(entry.submittedAt)}
              </div>
            </div>
            <div style={{ width: 72, textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{entry.score}/{entry.total}</div>
            </div>
            <div style={{ width: 90, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: lbGetAccuracyColor(entry.accuracy) }}>{entry.accuracy}%</span>
              </div>
              <LbProgressBar value={entry.accuracy} color={lbGetAccuracyColor(entry.accuracy)} />
            </div>
          </div>
        );
      })}

      {board.length > 10 && (
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
          <button onClick={onViewFull} style={{
            background: 'none', border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '9px 20px', fontSize: 13, fontWeight: 700, color: C.primary,
            cursor: 'pointer', width: '100%', WebkitAppearance: 'none', appearance: 'none',
            WebkitTransition: 'background .15s, color .15s',
            transition: 'background .15s, color .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = C.primaryLight; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            View all {board.length} pilots →
          </button>
        </div>
      )}
    </div>
  );
}

function MockLeaderboardWidget({ user, onViewFull }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('all');
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchBoard = useCallback(async (subject) => {
    setLoading(true);
    try {
      const url = subject === 'all' ? '/api/mock-leaderboard' : `/api/mock-leaderboard?subject=${subject}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBoard(data.entries);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Failed to load mock leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchBoard(activeSubject);
  }, [user, activeSubject, fetchBoard]);

  const filteredBoard = search.trim()
    ? board.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : board;

  const top3 = filteredBoard.slice(0, 3);
  const userEntry = board.find(e => e.email === user?.email);
  const userRank = board.findIndex(e => e.email === user?.email) + 1;
  const avgAccuracy = board.length
    ? Math.round(board.reduce((s, e) => s + e.accuracy, 0) / board.length)
    : 0;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>🏆 Mock Test Leaderboard</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
            {loading
              ? 'Loading…'
              : `${board.length} students · ranked by best accuracy${lastRefresh ? ` · updated ${lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}`
            }
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 12px', gap: 6, WebkitTransition: 'box-shadow .15s', transition: 'box-shadow .15s' }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${hexAlpha(C.primary, 0.25)}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span style={{ color: C.muted, fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: C.text, width: 120 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, padding: 0, WebkitAppearance: 'none', appearance: 'none' }}>✕</button>
            )}
          </div>
          <button onClick={() => fetchBoard(activeSubject)} title="Refresh" style={{
            width: 36, height: 36, borderRadius: 8, background: C.card,
            border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', fontSize: 15, flexShrink: 0,
            WebkitAppearance: 'none', appearance: 'none',
            WebkitTransition: 'transform .2s',
            transition: 'transform .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(180deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(0deg)'; }}
          >🔄</button>
          {onViewFull && (
            <button onClick={onViewFull} style={{
              height: 36, borderRadius: 8, background: C.primary,
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
              padding: '0 16px', cursor: 'pointer', whiteSpace: 'nowrap',
              WebkitAppearance: 'none', appearance: 'none',
            }}>Full View →</button>
          )}
        </div>
      </div>

      <div style={{
        background: `linear-gradient(120deg,${C.sidebar} 0%,${C.primary} 100%)`,
        borderRadius: 16, padding: '20px 24px', marginBottom: 18,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {[
            { icon: '👥', label: 'Students', value: loading ? '…' : board.length },
            { icon: '🥇', label: 'Top Score', value: loading ? '…' : (board[0] ? `${board[0].accuracy}%` : '—') },
            { icon: '🎯', label: 'Avg Accuracy', value: loading ? '…' : `${avgAccuracy}%` },
            { icon: '📝', label: 'Your Attempts', value: loading ? '…' : (userEntry?.attempts || 0) },
          ].map(s => (
            <div key={s.label}>
              <div style={{ color: '#93C5FD', fontSize: 11, marginBottom: 3, letterSpacing: 0.5 }}>{s.icon} {s.label}</div>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: '#93C5FD', fontSize: 12, marginBottom: 2 }}>Your Rank</div>
          <div style={{ color: '#fff', fontSize: 38, fontWeight: 900, lineHeight: 1 }}>
            {userRank > 0 ? `#${userRank}` : '–'}
          </div>
          {userEntry && (
            <div style={{ color: '#93C5FD', fontSize: 12, marginTop: 6 }}>
              Best: <span style={{ color: '#fff', fontWeight: 800 }}>{userEntry.accuracy}%</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {MOCK_LB_SUBJECT_TABS.map(tab => {
          const isActive = activeSubject === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveSubject(tab.id)} style={{
              padding: '7px 14px', borderRadius: 20,
              border: isActive ? `2px solid ${tab.color}` : `1px solid ${C.border}`,
              background: isActive ? hexAlpha(tab.color, 0.1) : C.card,
              color: isActive ? tab.color : C.muted,
              fontWeight: isActive ? 700 : 400, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              WebkitTransition: 'all .2s',
              transition: 'all .2s',
              WebkitAppearance: 'none', appearance: 'none',
              transform: isActive ? 'scale(1.04)' : 'scale(1)',
            }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {isActive && !loading && (
                <span style={{ background: hexAlpha(tab.color, 0.15), color: tab.color, fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 8 }}>
                  {filteredBoard.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!loading && !search && top3.length >= 2 && (
        <MiniPodium top3={top3} user={user} />
      )}

      <LbRankingsTable board={filteredBoard} user={user} loading={loading} onViewFull={onViewFull} />

      {!loading && userEntry && userRank > 10 && (
        <div style={{
          marginTop: 14, background: C.primaryLight,
          border: `1px solid ${hexAlpha(C.primary, 0.25)}`,
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          WebkitAnimation: 'slideUp .4s ease',
          animation: 'slideUp .4s ease',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 21,
            background: `linear-gradient(135deg,${C.primary},${C.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0,
          }}>{getInitials(user.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
              {user.name}
              <LbBadge label="You" color={C.green} />
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Rank #{userRank} · {userEntry.accuracy}% accuracy · {userEntry.score}/{userEntry.total} correct
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.primary }}>#{userRank}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Your position</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', id: 'home' },
  { icon: '📚', label: 'Subject Tests', id: 'tests' },
  { icon: '🎓', label: 'Class Test', id: 'class-test' },
  { icon: '🤖', label: 'AI Doubt Chat', id: 'doubt' },
  { icon: '📈', label: 'My Progress', id: 'progress' },
  { icon: '📅', label: 'Live Classes', id: 'classes', badge: 'LIVE' },
  { icon: '🎬', label: 'Lectures', id: 'lectures' },
  { icon: '🖥️', label: 'Interview', id: 'interview' },
  { icon: '📝', label: 'Mock Tests', id: 'mocktests' },
  { icon: '📁', label: 'Resources', id: 'resources' },
  { icon: '👤', label: 'My Profile', id: 'profile' },
];

function Sidebar({ active, onChange, onLogout, user, isOpen, onClose, isMobile }) {
  return (
    <>
      {isMobile && isOpen && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, WebkitTapHighlightColor: 'transparent', WebkitAnimation: 'fadeIn .2s ease', animation: 'fadeIn .2s ease' }} />
      )}
      <div style={{
        width: 232, minHeight: '100vh', background: C.sidebar,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        WebkitTransform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        WebkitTransition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        boxShadow: isMobile && isOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid #1E3A5F' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, marginRight: 12 }}>
                <img src="/Logo.webp" alt="DGCA Prep Logo" style={{ width: 32, height: 32, objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:20px">✈️</span>'; }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.1, letterSpacing: 0.3 }}>DGCA</div>
                <div style={{ color: C.accent, fontWeight: 800, fontSize: 12, letterSpacing: 2 }}>PREP</div>
              </div>
            </div>
            {isMobile && (
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8BA3C5', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
            )}
          </div>
          <div style={{ color: '#8BA3C5', fontSize: 11, marginTop: 8, fontStyle: 'italic', letterSpacing: 0.3 }}>Your Flight. Our Passion.</div>
        </div>

        {user && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E3A5F', display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg,${C.primary},${C.purple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0, marginRight: 11,
            }}>{getInitials(user.name)}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ color: '#8BA3C5', fontSize: 11, marginTop: 1 }}>Student Pilot</div>
            </div>
          </div>
        )}

        <nav style={{ padding: '10px 10px', flex: 1 }}>
          <div style={{ color: '#4B6785', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: '8px 10px 6px', textTransform: 'uppercase' }}>Main Menu</div>
          {NAV_ITEMS.map((item, idx) => (
            <button key={item.id}
              onClick={() => { onChange(item.id); if (isMobile) onClose(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: '10px 12px', borderRadius: 10, border: 'none',
                cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                background: active === item.id ? C.primary : 'transparent',
                color: active === item.id ? '#fff' : '#8BA3C5',
                WebkitTransition: 'all .18s',
                transition: 'all .18s',
                WebkitAppearance: 'none', appearance: 'none',
                WebkitAnimation: `slideInNav .3s ease ${idx * 0.04}s both`,
                animation: `slideInNav .3s ease ${idx * 0.04}s both`,
              }}
              onMouseEnter={e => { if (active !== item.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.paddingLeft = '16px'; } }}
              onMouseLeave={e => { if (active !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8BA3C5'; e.currentTarget.style.paddingLeft = '12px'; } }}
            >
              <span style={{ fontSize: 16, marginRight: 11 }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
              {item.badge && (
                <span style={{ marginLeft: 'auto', background: C.red, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, display: 'inline-block', WebkitAnimation: 'pulse 2s ease-in-out infinite', animation: 'pulse 2s ease-in-out infinite' }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ margin: '10px', borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.purple})`, padding: '14px 16px' }}>
          <div style={{ color: C.accent, fontSize: 12, fontWeight: 800, marginBottom: 5, letterSpacing: 0.5 }}>👑 Go Premium</div>
          <div style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>Unlock all mock tests & 1-on-1 mentoring.</div>
          <button style={{
            background: '#fff', color: C.primary, border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%', WebkitAppearance: 'none', appearance: 'none',
            WebkitTransition: 'transform .15s',
            transition: 'transform .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >Upgrade Now →</button>
        </div>

        {user && (
          <div style={{ padding: '10px 14px', borderTop: '1px solid #1E3A5F' }}>
            <button onClick={onLogout} style={{
              width: '100%', background: hexAlpha(C.red, 0.1),
              border: `1px solid ${hexAlpha(C.red, 0.3)}`, borderRadius: 10,
              padding: '9px 0', color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              WebkitAppearance: 'none', appearance: 'none',
              WebkitTransition: 'background .15s',
              transition: 'background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = hexAlpha(C.red, 0.18); }}
              onMouseLeave={e => { e.currentTarget.style.background = hexAlpha(C.red, 0.1); }}
            >🚪 Logout</button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── BOTTOM NAV (Mobile) ──────────────────────────────────────────────────────
const BOTTOM_NAV = [
  { icon: '🏠', label: 'Home', id: 'home' },
  { icon: '📚', label: 'Tests', id: 'tests' },
  { icon: '🤖', label: 'Doubt', id: 'doubt' },
  { icon: '📈', label: 'Progress', id: 'progress' },
  { icon: '📁', label: 'Resources', id: 'resources' },
];

function BottomNav({ active, onChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
      background: C.sidebar, borderTop: '1px solid #1E3A5F',
      display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
      WebkitAnimation: 'slideUp .35s ease',
      animation: 'slideUp .35s ease',
    }}>
      {BOTTOM_NAV.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '9px 4px', background: 'transparent', border: 'none',
          cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none',
          color: active === item.id ? C.accent : '#8BA3C5',
          WebkitTransition: 'color .18s, transform .18s',
          transition: 'color .18s, transform .18s',
          transform: active === item.id ? 'translateY(-2px)' : 'none',
        }}>
          <span style={{ fontSize: 22, marginBottom: 2 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ user, page, subPage, onLeaderboard, onMenuOpen, onLogin, isMobile }) {
  const base = {
    home: 'Dashboard', tests: 'Tests', progress: 'My Progress',
    classes: 'Live Classes', lectures: 'Lectures',
    mocktests: 'Mock Tests', leaderboard: 'Leaderboard',
    mockleaderboard: 'Mock Leaderboard', resources: 'Study Notes', doubt: 'AI Doubt Chat',
  };
  const sub = { subject: 'Air Regulations', chapters: 'Chapters', mock: 'Mock Test' };
  const title = sub[subPage] || base[page] || 'Dashboard';
  return (
    <div style={{
      position: 'fixed', top: 0, left: isMobile ? 0 : 232, right: 0, height: 62,
      background: 'rgba(255,255,255,0.97)',
      WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 89, gap: 12,
    }}>
      {isMobile && (
        <button onClick={onMenuOpen} style={{
          width: 38, height: 38, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, fontSize: 19,
          WebkitAppearance: 'none', appearance: 'none',
          WebkitTransition: 'transform .15s',
          transition: 'transform .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(90deg)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(0deg)'; }}
        >☰</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 16 : 19, fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: -0.2 }}>{title}</div>
        {!isMobile && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 1, letterSpacing: 0.2 }}>
            Home › {base[page]}
            {subPage === 'subject' && ' › Air Regulations'}
            {subPage === 'mock' && ' › Mock Test'}
          </div>
        )}
      </div>
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', background: C.bg, borderRadius: 10, padding: '8px 14px', border: `1px solid ${C.border}`, WebkitTransition: 'box-shadow .15s', transition: 'box-shadow .15s' }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${hexAlpha(C.primary, 0.25)}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ color: C.muted, marginRight: 8, fontSize: 14 }}>🔍</span>
          <input placeholder="Search anything..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: C.text, width: 170 }} />
        </div>
      )}
      <button onClick={onLeaderboard} style={{
        width: 38, height: 38, borderRadius: 10, background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', border: `1px solid ${C.border}`, fontSize: 18,
        WebkitAppearance: 'none', appearance: 'none', flexShrink: 0,
        WebkitTransition: 'transform .2s',
        transition: 'transform .2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
      >🏆</button>
      {!user ? (
        <button onClick={onLogin} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px',
          height: 38, borderRadius: 10, border: `1px solid ${C.border}`,
          background: '#fff', color: C.text, cursor: 'pointer',
          fontSize: 14, fontWeight: 700,
          WebkitAppearance: 'none', appearance: 'none', flexShrink: 0,
          WebkitTransition: 'transform .2s',
          transition: 'transform .2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0px)'; }}
        >
          <span>🔐</span>
          <span>Login</span>
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg,${C.primary},${C.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 13,
            WebkitTransition: 'transform .2s',
            transition: 'transform .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >{getInitials(user.name)}</div>
        </div>
      )}
    </div>
  );
}

// ─── RTR SIMULATOR CARD ───────────────────────────────────────────────────────
function RTRSimulatorCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href="/rtr" style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: C.sidebar,
          border: `1px solid ${hovered ? C.primary : '#1E3A5F'}`,
          borderRadius: 16, padding: '20px 20px 18px', cursor: 'pointer',
          WebkitTransition: 'border-color .2s, box-shadow .2s, transform .2s',
          transition: 'border-color .2s, box-shadow .2s, transform .2s',
          boxShadow: hovered ? `0 8px 28px ${hexAlpha(C.primary, 0.22)}` : 'none',
          transform: hovered ? 'translateY(-3px)' : 'none',
          display: 'block',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{
            fontSize: 26, lineHeight: 1,
            WebkitAnimation: hovered ? 'headphoneBounce .6s ease infinite alternate' : 'none',
            animation: hovered ? 'headphoneBounce .6s ease infinite alternate' : 'none',
          }}>🎧</span>
          <div>
            <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 15, color: hovered ? '#93C5FD' : '#fff', WebkitTransition: 'color .2s', transition: 'color .2s', lineHeight: 1.2 }}>
              RTR(A) Simulator
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748B', marginTop: 3 }}>Part 2 · Practical Exam</div>
          </div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#8BA3C5', lineHeight: 1.7, marginBottom: 13 }}>
          Practice ATC radio telephony with voice recognition. 6 phases — startup to landing.
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Voice', bg: hexAlpha('#1D4ED8', 0.35), color: '#93C5FD' },
            { label: 'ICAO Phraseology', bg: hexAlpha('#10B981', 0.25), color: '#6EE7B7' },
            { label: 'AI Scoring', bg: hexAlpha('#8B5CF6', 0.3), color: '#C4B5FD' },
          ].map(tag => (
            <span key={tag.label} style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: tag.bg, color: tag.color, display: 'inline-block' }}>{tag.label}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ user, stats, recentResults, allResults, loading, onNavigate, isMobile, isTablet }) {
  const badge = getBadge(stats);
  const visible = useFadeIn(0);
  const statCards = [
    { icon: '📋', value: stats.testsAttempted, label: 'Tests Attempted', color: C.primary },
    { icon: '🎯', value: `${stats.avgScore}%`, label: 'Avg Accuracy', color: C.green },
    { icon: '🏆', value: `${stats.bestScore}%`, label: 'Best Score', color: C.accent },
    { icon: '❓', value: stats.totalQuestions, label: 'Questions Done', color: C.purple },
  ];
  const statCols = isMobile ? '1fr 1fr' : 'repeat(4,1fr)';
  const mainCols = (isMobile || isTablet) ? '1fr' : '1fr 360px';

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(12px)',
      WebkitTransition: 'opacity .5s ease, transform .5s ease',
      transition: 'opacity .5s ease, transform .5s ease',
    }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(120deg,${C.sidebar} 0%,${C.primary} 100%)`,
        borderRadius: 20, padding: isMobile ? '24px 20px' : '30px 32px', marginBottom: 22,
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 16,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', right: isMobile ? -20 : 160, top: '50%',
          WebkitTransform: 'translateY(-50%)',
          transform: 'translateY(-50%)',
          fontSize: 90, opacity: 0.04,
          WebkitAnimation: 'planeDrift 8s ease-in-out infinite',
          animation: 'planeDrift 8s ease-in-out infinite',
          pointerEvents: 'none',
        }}>✈️</div>
        <div>
          <div style={{ color: '#93C5FD', fontSize: 14, fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 }}>Welcome back, Pilot 👋</div>
          <div style={{ color: '#fff', fontSize: isMobile ? 22 : 28, fontWeight: 900, lineHeight: 1.2, marginBottom: 8, letterSpacing: -0.5 }}>
            Ready for your next DGCA exam session?
          </div>
          <div style={{ color: '#93C5FD', fontSize: 13, marginBottom: 18 }}>
            {loading ? 'Loading…' : `${stats.testsAttempted} tests done · ${stats.avgScore}% avg accuracy`}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('tests')} style={{
              background: C.accent, color: '#fff', border: 'none', borderRadius: 11, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none',
              WebkitTransition: 'transform .15s, box-shadow .15s',
              transition: 'transform .15s, box-shadow .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${hexAlpha(C.accent, 0.45)}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >📚 Start Test</button>
            <button onClick={() => onNavigate('resources')} style={{
              background: hexAlpha('#ffffff', 0.15), color: '#fff', border: `1px solid ${hexAlpha('#ffffff', 0.3)}`, borderRadius: 11, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none',
              WebkitTransition: 'background .15s',
              transition: 'background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = hexAlpha('#ffffff', 0.25); }}
              onMouseLeave={e => { e.currentTarget.style.background = hexAlpha('#ffffff', 0.15); }}
            >📁 Study Notes</button>
          </div>
        </div>
        {!isMobile && (
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
            <div style={{
              background: hexAlpha(badge.color, 0.15), border: `1px solid ${hexAlpha(badge.color, 0.31)}`, borderRadius: 14, padding: '12px 20px', textAlign: 'center', marginBottom: 6,
              WebkitAnimation: 'float 3s ease-in-out infinite',
              animation: 'float 3s ease-in-out infinite',
            }}>
              <div style={{ fontSize: 32 }}>{badge.icon}</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, marginTop: 4 }}>{badge.label}</div>
            </div>
            <div style={{ color: '#93C5FD', fontSize: 12 }}>Your rank badge</div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: statCols, gap: 14, marginBottom: 22 }}>
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} style={{ background: C.card, borderRadius: 16, padding: 18, border: `1px solid ${C.border}` }}><Skeleton h={44} /></div>)
          : statCards.map((s, i) => <StatCard key={i} icon={s.icon} label={s.label} value={s.value} color={s.color} delay={i * 80} />)
        }
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: mainCols, gap: 20 }}>
        {/* Subject tests */}
        <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>📚 Chapter-wise Tests</div>
            <button onClick={() => onNavigate('tests')} style={{ color: C.primary, background: C.primaryLight, border: 'none', borderRadius: 9, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' }}>View All →</button>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {loading
              ? Array(4).fill(0).map((_, i) => <div key={i} style={{ background: C.bg, borderRadius: 12, padding: 14 }}><Skeleton h={12} /></div>)
              : chapters.slice(0, isMobile ? 6 : 12).map((ch, idx) => {
                const rs = allResults.filter(r => r.chapterId === ch.id);
                const best = rs.length ? Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0)) : null;
                return (
                  <div key={ch.id} onClick={() => onNavigate('tests', ch.id)}
                    style={{
                      background: C.bg, borderRadius: 13, padding: '14px 16px', cursor: 'pointer', border: `1px solid ${C.border}`, borderLeft: `4px solid ${ch.color || C.primary}`,
                      WebkitTransition: 'transform .18s, box-shadow .18s',
                      transition: 'transform .18s, box-shadow .18s',
                      WebkitAnimation: `fadeIn .4s ease ${idx * 0.06}s both`,
                      animation: `fadeIn .4s ease ${idx * 0.06}s both`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 14px ${hexAlpha(ch.color || C.primary, 0.14)}`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 20 }}>{ch.icon}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>→</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>{ch.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{ch.questionCount || 10} Questions</div>
                    {best !== null && <div style={{ fontSize: 12, fontWeight: 700, color: getScoreColor(best), marginBottom: 6 }}>Best: {best}%</div>}
                    <ProgressBar value={best ?? 0} color={ch.color || C.primary} height={5} />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div onClick={() => onNavigate('resources')} style={{
            background: `linear-gradient(135deg,#1D4ED8,#7C3AED)`, borderRadius: 16, padding: '18px 20px', cursor: 'pointer',
            WebkitTransition: 'transform .2s, box-shadow .2s',
            transition: 'transform .2s, box-shadow .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(29,78,216,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: 28, marginBottom: 7 }}>📖</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 5 }}>Air Regulations Notes</div>
            <div style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>All 26 chapters · Definitions, rules, HF, procedures.</div>
            <div style={{ background: hexAlpha('#ffffff', 0.2), color: '#fff', borderRadius: 9, padding: '7px 14px', fontSize: 13, fontWeight: 700, display: 'inline-block' }}>Open Notes →</div>
          </div>

          <RTRSimulatorCard />

          {user && (
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 14 }}>👤 Your Profile</div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, marginRight: 12, flexShrink: 0,
                  WebkitTransition: 'transform .2s',
                  transition: 'transform .2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >{getInitials(user.name)}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{user.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: C.bg, borderRadius: 11, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: C.primary }}>{stats.testsAttempted}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Tests Done</div>
                </div>
                <div style={{ background: C.bg, borderRadius: 11, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>{stats.avgScore}%</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Avg Score</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>📈 Recent Tests</div>
            </div>
            {loading
              ? Array(3).fill(0).map((_, i) => <div key={i} style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}` }}><Skeleton h={12} /></div>)
              : recentResults.length === 0
                ? <div style={{ padding: '28px 18px', textAlign: 'center', color: C.muted, fontSize: 14 }}>No tests yet!</div>
                : recentResults.map((r, idx) => {
                  const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                  const ch = chapters.find(c => c.id === r.chapterId);
                  return (
                    <div key={r.id} style={{
                      padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
                      WebkitTransition: 'background .15s',
                      transition: 'background .15s',
                      WebkitAnimation: `slideInRow .3s ease ${idx * 0.07}s both`,
                      animation: `slideInRow .3s ease ${idx * 0.07}s both`,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: hexAlpha(ch?.color || C.primary, 0.13), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, marginRight: 12 }}>{ch?.icon ?? '📝'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch?.title ?? r.chapterId}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{formatDate(r.date)}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: getScoreColor(pct), whiteSpace: 'nowrap' }}>{r.score}/{r.total}</div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUBJECT SELECTOR ──────────────────────────────────────────────────────────
function SubjectSelector({ allResults, onSelectSubject, onMockTest, isMobile }) {
  const visible = useFadeIn(0);
  return (
    <div style={{ opacity: visible ? 1 : 0, WebkitTransition: 'opacity .4s ease', transition: 'opacity .4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>Select a Subject</h2>
        <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>Choose a subject below to start chapter-wise tests.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
        {SUBJECTS.filter(s => !s.isAptl).map((sub, idx) => {
          const subChapters = chapters.filter(c => sub.chapterIds.includes(c.id));
          const attempted = subChapters.filter(c => allResults.some(r => r.chapterId === c.id)).length;
          const allPcts = allResults.filter(r => sub.chapterIds.includes(r.chapterId) && r.total > 0).map(r => Math.round((r.score / r.total) * 100));
          const avgPct = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : 0;

          return (
            <div key={sub.id}
              onClick={() => sub.isAptl ? onMockTest('atpl') : sub.isMock ? onMockTest() : onSelectSubject(sub.id)}
              style={{
                background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden', cursor: 'pointer',
                WebkitTransition: 'transform .22s cubic-bezier(.4,0,.2,1), box-shadow .22s',
                transition: 'transform .22s cubic-bezier(.4,0,.2,1), box-shadow .22s',
                WebkitAnimation: `fadeIn .4s ease ${idx * 0.08}s both`,
                animation: `fadeIn .4s ease ${idx * 0.08}s both`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${hexAlpha(sub.color, 0.18)}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ background: sub.gradient, padding: '22px 22px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 15, background: hexAlpha('#ffffff', 0.25), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{sub.icon}</div>
                  {sub.comingSoon
                    ? <span style={{ background: hexAlpha('#000000', 0.25), color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}>🚧 Coming Soon</span>
                    : sub.isMock
                      ? <span style={{ background: hexAlpha('#ffffff', 0.3), color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}>🎯 Full Paper</span>
                      : attempted > 0
                        ? <span style={{ background: hexAlpha('#ffffff', 0.3), color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}>{attempted}/{subChapters.length} done</span>
                        : <span style={{ background: hexAlpha('#ffffff', 0.2), color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}></span>}
                </div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginTop: 14, marginBottom: 4, letterSpacing: -0.3 }}>{sub.title}</div>
                <div style={{ color: hexAlpha('#ffffff', 0.8), fontSize: 13 }}>{sub.subtitle}</div>
              </div>
              <div style={{ padding: '16px 22px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: C.muted }}>{sub.stats}</span>
                  <span style={{ fontSize: 12, background: hexAlpha(sub.color, 0.08), color: sub.color, padding: '4px 12px', borderRadius: 20, fontWeight: 700, display: 'inline-block' }}>{sub.exam}</span>
                </div>
                {!sub.comingSoon && !sub.isMock && subChapters.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Avg Score</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: avgPct > 0 ? getScoreColor(avgPct) : C.muted }}>{avgPct > 0 ? `${avgPct}%` : '—'}</span>
                    </div>
                    <ProgressBar value={avgPct} color={sub.color} height={6} />
                  </>
                )}
                <button style={{
                  marginTop: 14, width: '100%', padding: '11px 0', background: sub.gradient, color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none',
                  WebkitTransition: 'opacity .15s',
                  transition: 'opacity .15s',
                }}>
                  {sub.comingSoon ? '🚧 Coming Soon →' : sub.isMock ? '🎯 Choose Subject & Start →' : '📚 View Chapters →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GENERIC SUBJECT CHAPTER LIST ─────────────────────────────────────────────
function SubjectChapterList({ subject, subjectChapters, allResults, onStartTest, onBack, isMobile }) {
  const [search, setSearch] = useState('');
  const [activeSubSubject, setActiveSubSubject] = useState(null);
  const visible = useFadeIn(0);

  function getBest(chapterId) {
    const rs = allResults.filter(r => r.chapterId === chapterId);
    if (!rs.length) return null;
    return Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0));
  }

  const displaySubject = activeSubSubject || subject;
  const chapterPool = activeSubSubject
    ? subjectChapters.filter(c => displaySubject.chapterIds.includes(c.id))
    : subjectChapters;
  const filtered = chapterPool.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  function getGroups() {
    if (!displaySubject.parts || displaySubject.parts.length === 0) {
      return [{ label: displaySubject.title, color: displaySubject.color, chapters: filtered }];
    }
    return displaySubject.parts
      .map(part => ({ label: part.label, color: part.color, chapters: filtered.filter(c => part.chapterIds && part.chapterIds.includes(c.id)) }))
      .filter(g => g.chapters.length > 0);
  }

  const groups = getGroups();
  const attempted = chapterPool.filter(c => allResults.some(r => r.chapterId === c.id)).length;
  const allPcts = allResults.filter(r => displaySubject.chapterIds.includes(r.chapterId) && r.total > 0).map(r => Math.round((r.score / r.total) * 100));
  const avgScore = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : null;
  const bestScore = allPcts.length ? Math.max(...allPcts) : null;

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(10px)', WebkitTransition: 'opacity .4s ease, transform .4s ease', transition: 'opacity .4s ease, transform .4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22, gap: 14 }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: 11, background: C.card, border: `1px solid ${C.border}`, fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, WebkitAppearance: 'none', appearance: 'none',
          WebkitTransition: 'transform .15s',
          transition: 'transform .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(-3px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >←</button>
        <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: displaySubject.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{displaySubject.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>{displaySubject.icon} {displaySubject.title}</h2>
          <p style={{ margin: '3px 0 0', color: C.muted, fontSize: 13 }}>{chapterPool.length} chapters · Click to start MCQ test</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', background: C.card, borderRadius: 11, padding: '9px 16px', border: `1px solid ${C.border}`, marginBottom: 20, WebkitTransition: 'box-shadow .15s', transition: 'box-shadow .15s' }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${hexAlpha(displaySubject.color, 0.25)}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <span style={{ color: C.muted, marginRight: 10, fontSize: 15 }}>🔍</span>
        <input placeholder="Search chapters…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: C.text, width: '100%' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '📚', val: chapterPool.length, label: 'Total Chapters' },
          { icon: '✅', val: attempted, label: 'Attempted' },
          { icon: '🎯', val: avgScore !== null ? `${avgScore}%` : '—', label: 'Avg Score' },
          { icon: '🏆', val: bestScore !== null ? `${bestScore}%` : '—', label: 'Best Score' },
        ].map((s, i) => (
          <div key={s.label} style={{
            background: C.card, borderRadius: 13, padding: '12px 16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12,
            WebkitAnimation: `fadeIn .4s ease ${i * 0.07}s both`,
            animation: `fadeIn .4s ease ${i * 0.07}s both`,
          }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: C.text, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {subject.hasSubjects && !activeSubSubject && subject.subSubjects && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Navigation Topics</div>
              <div style={{ color: C.muted, fontSize: 13 }}>Pick a nested subject for focused practice.</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16 }}>
            {subject.subSubjects.map((sub, idx) => (
              <div key={sub.id} onClick={() => setActiveSubSubject(sub)}
                style={{
                  background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 18,
                  WebkitTransition: 'transform .2s ease, box-shadow .2s ease', transition: 'transform .2s ease, box-shadow .2s ease',
                  WebkitAnimation: `fadeIn .4s ease ${idx * 0.06}s both`, animation: `fadeIn .4s ease ${idx * 0.06}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${hexAlpha(sub.color, 0.16)}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: hexAlpha(sub.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{sub.icon}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{sub.title}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{sub.subtitle}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{sub.stats}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: sub.color }}>{sub.exam}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubSubject && (
        <button onClick={() => setActiveSubSubject(null)} style={{ marginBottom: 22, background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '10px 14px', color: C.text, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' }}>
          ← Back to {subject.title}
        </button>
      )}

      {groups.map(group => (
        <div key={group.label} style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 10 }}>
            <div style={{ height: 3, width: 26, borderRadius: 99, background: group.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: group.color }}>{group.label}</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{group.chapters.length} ch.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
            {group.chapters.map((ch, idx) => {
              const best = getBest(ch.id);
              const attempts = allResults.filter(r => r.chapterId === ch.id).length;
              const chNum = ch.id.replace(/^[a-z]+/i, '').replace(/^0+/, '') || ch.id;
              return (
                <div key={ch.id} onClick={() => onStartTest(ch.id)}
                  style={{
                    background: C.card, borderRadius: 15, border: `1px solid ${C.border}`, borderLeft: `4px solid ${group.color}`, padding: 18, cursor: 'pointer',
                    WebkitTransition: 'transform .18s cubic-bezier(.4,0,.2,1), box-shadow .18s',
                    transition: 'transform .18s cubic-bezier(.4,0,.2,1), box-shadow .18s',
                    WebkitAnimation: `fadeIn .35s ease ${idx * 0.04}s both`,
                    animation: `fadeIn .35s ease ${idx * 0.04}s both`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${hexAlpha(group.color, 0.15)}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: hexAlpha(group.color, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{ch.icon || subject.icon}</div>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: group.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800 }}>{chNum}</div>
                    </div>
                    {best !== null
                      ? <Badge label={`${best}%`} color={getScoreColor(best)} />
                      : <span style={{ fontSize: 11, color: C.muted, background: C.bg, padding: '3px 9px', borderRadius: 20, display: 'inline-block' }}>New</span>}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>{ch.title}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{ch.part || subject.title} · {attempts} attempt{attempts !== 1 ? 's' : ''}</div>
                  <ProgressBar value={best ?? 0} color={group.color} height={5} />
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: best !== null ? getScoreColor(best) : C.muted, fontWeight: best !== null ? 700 : 400 }}>
                      {best !== null ? `Best: ${best}%` : 'Not attempted'}
                    </span>
                    <span style={{ fontSize: 12, color: group.color, fontWeight: 700 }}>Start →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: C.muted, padding: '48px 0', fontSize: 15 }}>No chapters match "{search}"</div>
      )}
    </div>
  );
}

// ─── MOCK TEST SUBJECT SELECTOR ───────────────────────────────────────────────
function MockSubjectSelector({ onSelectSubject, onBack, isMobile }) {
  const btnBase = { border: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' };
  const directSubjects = SUBJECTS.filter(s => !s.isMock && !s.isAptl && s.id !== 'meteorology' && s.id !== 'navigation');
  const atplSubject = SUBJECTS.find(s => s.isAptl);
  const options = [
  ...directSubjects,
  MOCK_ALL_OPTION,
  ...(atplSubject ? [atplSubject] : []),
];
  const visible = useFadeIn(0);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', opacity: visible ? 1 : 0, WebkitTransition: 'opacity .4s ease', transition: 'opacity .4s ease' }}>
      <button onClick={onBack} style={{ ...btnBase, marginBottom: 22, background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 18px', fontSize: 14, color: C.text, display: 'flex', alignItems: 'center', gap: 6, WebkitTransition: 'transform .15s', transition: 'transform .15s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(-3px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
      >← Back to Tests</button>

      <div style={{ background: `linear-gradient(120deg,${C.sidebar} 0%,${C.purple} 100%)`, borderRadius: 20, padding: isMobile ? '22px 20px' : '28px 32px', marginBottom: 26 }}>
        <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: 10 }}>🎯</div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: isMobile ? 20 : 26, marginBottom: 7, letterSpacing: -0.5 }}>Mock Test — Choose a Subject</div>
        <div style={{ color: '#C4B5FD', fontSize: 14, lineHeight: 1.7 }}>
          Select a subject below to generate a 100-question DGCA-style mock paper from that topic.
          Choose "All Subjects" for a mixed paper covering every chapter.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {[['❓', '100 Questions'], ['⏱️', '120 Minutes'], ['💡', 'Instant Results'], ['🔀', 'Randomised']].map(([icon, label]) => (
            <span key={label} style={{ background: hexAlpha('#ffffff', 0.15), color: '#fff', border: `1px solid ${hexAlpha('#ffffff', 0.2)}`, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-block' }}>{icon} {label}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
        {options.map((sub, idx) => {
          const isAll = sub.id === 'all';
          const isAptl = sub.isAptl;
          const isComingSoon = sub.comingSoon;
          return (
            <div key={sub.id} onClick={() => !isComingSoon && onSelectSubject(sub)}
              style={{
                background: C.card, borderRadius: 18,
                border: isAll ? `2px dashed ${hexAlpha(sub.color, 0.4)}` : isAptl ? `2px solid ${hexAlpha(sub.color, 0.5)}` : `1px solid ${C.border}`,
                overflow: 'hidden', cursor: isComingSoon ? 'not-allowed' : 'pointer', opacity: isComingSoon ? 0.55 : 1,
                WebkitTransition: 'transform .2s cubic-bezier(.4,0,.2,1), box-shadow .2s',
                transition: 'transform .2s cubic-bezier(.4,0,.2,1), box-shadow .2s',
                WebkitAnimation: `fadeIn .4s ease ${idx * 0.07}s both`,
                animation: `fadeIn .4s ease ${idx * 0.07}s both`,
              }}
              onMouseEnter={e => { if (isComingSoon) return; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${hexAlpha(sub.color, 0.18)}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ background: sub.gradient, padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: hexAlpha('#ffffff', 0.25), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{sub.icon}</div>
                  <span style={{ background: hexAlpha('#ffffff', 0.25), color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}>
                    {isComingSoon ? '🚧 Coming Soon' : isAll ? '🎲 Mixed' : isAptl ? '✈️ ATPL' : sub.exam}
                  </span>
                </div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginTop: 12, marginBottom: 3, letterSpacing: -0.2 }}>{sub.title}</div>
                <div style={{ color: hexAlpha('#ffffff', 0.8), fontSize: 12 }}>{sub.parentTitle ? `${sub.subtitle} · ${sub.parentTitle}` : sub.subtitle}</div>
              </div>
              <div style={{ padding: '14px 20px 18px' }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
                  {isComingSoon ? 'Questions being prepared by our content team' : isAptl ? 'Met · General Nav · Radio Nav · Instrument Nav' : sub.stats}
                </div>
                <button onClick={e => { e.stopPropagation(); if (!isComingSoon) onSelectSubject(sub); }} disabled={isComingSoon}
                  style={{ ...btnBase, width: '100%', padding: '10px 0', background: isComingSoon ? C.border : sub.gradient, borderRadius: 11, color: isComingSoon ? C.muted : '#fff', fontWeight: 700, fontSize: 14, cursor: isComingSoon ? 'not-allowed' : 'pointer' }}>
                  {isComingSoon ? '🚧 Coming Soon' : isAll ? '🎯 Start Combined Test →' : isAptl ? '✈️ Choose ATPL Subject →' : `📝 Start ${sub.title} Test →`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MOCK TEST PAGE ───────────────────────────────────────────────────────────
function AptlMockSelector({ onSelectSubject, onBack, isMobile }) {
  const btnBase = { border: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' };
  const visible = useFadeIn(0);
   const [showNavChildren, setShowNavChildren] = useState(false);

  const metSub = SUBJECTS.find(s => s.id === 'meteorology');
  const navSub = SUBJECTS.find(s => s.id === 'navigation');
  const sections = [
    { subject: metSub, children: [] },
    { subject: navSub, children: NAV_SUB_SUBJECTS },
  ].filter(s => s.subject);

  return (
  <div style={{ maxWidth: 800, margin: '0 auto', opacity: visible ? 1 : 0, transition: 'opacity .4s ease' }}>

    {/* Back button */}
    <button
      onClick={() => {
        if (showNavChildren) setShowNavChildren(false);
        else onBack();
      }}
      style={{
        ...btnBase, marginBottom: 22, background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 11,
        padding: '8px 18px', fontSize: 14, color: C.text
      }}
    >
      {showNavChildren ? '← Back to ATPL' : '← Back to Tests'}
    </button>

    {/* Header banner */}
    <div style={{
      background: 'linear-gradient(120deg,#0EA5E9,#6366F1)',
      borderRadius: 20, padding: isMobile ? '22px 20px' : '28px 32px', marginBottom: 26
    }}>
      <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: 10 }}>✈️</div>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: isMobile ? 20 : 26, marginBottom: 7 }}>
        {showNavChildren ? 'Navigation — Choose a Topic' : 'ATPL Mock Test'}
      </div>
      <div style={{ color: '#BAE6FD', fontSize: 14, lineHeight: 1.7 }}>
        {showNavChildren
          ? 'Pick a navigation topic to begin your mock test.'
          : 'Choose Meteorology or Navigation to begin your mock test.'}
      </div>
    </div>

    {/* ── SCREEN 1: Show Met card + Navigation parent card ── */}
    {!showNavChildren && (
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 18
      }}>

        {/* Meteorology — direct to test */}
        <div
          onClick={() => onSelectSubject(metSub)}
          style={{
            background: C.card, borderRadius: 18,
            border: `1px solid ${C.border}`, overflow: 'hidden',
            cursor: 'pointer', transition: 'transform .2s, box-shadow .2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = `0 12px 30px rgba(14,165,233,0.2)`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ background: metSub.gradient, padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
              }}>{metSub.icon}</div>
              <span style={{
                background: 'rgba(255,255,255,0.25)', color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20
              }}>{metSub.exam}</span>
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginTop: 12, marginBottom: 3 }}>
              {metSub.title}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{metSub.subtitle}</div>
          </div>
          <div style={{ padding: '14px 20px 18px' }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{metSub.stats}</div>
            <button
              onClick={e => { e.stopPropagation(); onSelectSubject(metSub); }}
              style={{
                ...btnBase, width: '100%', padding: '10px 0',
                background: metSub.gradient, borderRadius: 11,
                color: '#fff', fontWeight: 700, fontSize: 14
              }}
            >
              📝 Start Meteorology Test →
            </button>
          </div>
        </div>

        {/* Navigation — opens sub-cards on click */}
        <div
          onClick={() => setShowNavChildren(true)}
          style={{
            background: C.card, borderRadius: 18,
            border: `1px solid ${C.border}`, overflow: 'hidden',
            cursor: 'pointer', transition: 'transform .2s, box-shadow .2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = `0 12px 30px rgba(16,185,129,0.2)`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ background: navSub.gradient, padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
              }}>{navSub.icon}</div>
              <span style={{
                background: 'rgba(255,255,255,0.25)', color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20
              }}>3 Topics</span>
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginTop: 12, marginBottom: 3 }}>
              {navSub.title}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{navSub.subtitle}</div>
          </div>
          <div style={{ padding: '14px 20px 18px' }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
              General · Radio · Instrument Navigation
            </div>
            <button
              onClick={e => { e.stopPropagation(); setShowNavChildren(true); }}
              style={{
                ...btnBase, width: '100%', padding: '10px 0',
                background: navSub.gradient, borderRadius: 11,
                color: '#fff', fontWeight: 700, fontSize: 14
              }}
            >
              🗺️ Choose Navigation Topic →
            </button>
          </div>
        </div>

      </div>
    )}

    {/* ── SCREEN 2: Navigation sub-cards ── */}
    {showNavChildren && (
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 16
      }}>
        {NAV_SUB_SUBJECTS.map((child, idx) => (
          <div
            key={child.id}
            onClick={() => onSelectSubject(child)}
            style={{
              background: C.card, borderRadius: 18,
              border: `1px solid ${C.border}`, overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform .2s, box-shadow .2s',
              animation: `fadeIn .4s ease ${idx * 0.07}s both`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.12)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ background: child.gradient, padding: '20px 20px 16px' }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
              }}>{child.icon}</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginTop: 12, marginBottom: 3 }}>
                {child.title}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{child.subtitle}</div>
            </div>
            <div style={{ padding: '14px 20px 18px' }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{child.stats}</div>
              <button
                onClick={e => { e.stopPropagation(); onSelectSubject(child); }}
                style={{
                  ...btnBase, width: '100%', padding: '10px 0',
                  background: child.gradient, borderRadius: 11,
                  color: '#fff', fontWeight: 700, fontSize: 14
                }}
              >
                📝 Start {child.title} →
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

  </div>
);
}

function MockTestPage({ onBack, isMobile, isAptlMode = false }) {
  const TOTAL_TIME = 6000;
  const TOTAL_Q = 100;
  const btnBase = { border: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' };

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [pool, setPool] = useState([]);
  const [screen, setScreen] = useState('subjectSelect');
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [isAptlModeLocal, setIsAptlModeLocal] = useState(isAptlMode);
  const [lastAnswered, setLastAnswered] = useState(null);
  const timerRef = useRef(null);

  function handleSubjectSelect(subject) {
    const chapterIds = subject.id === 'all' ? null : subject.chapterIds;
    const newPool = buildMockPool(TOTAL_Q, chapterIds);
    setSelectedSubject(subject);
    setPool(newPool);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(TOTAL_TIME);
    setScreen('intro');
  }

  function resetMock() {
    clearInterval(timerRef.current);
    setSelectedSubject(null);
    setPool([]);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(TOTAL_TIME);
    setSubmitStatus('idle');
    setIsAptlModeLocal(isAptlMode);
    setScreen('subjectSelect');
  }
  useEffect(() => {
    if (screen !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); submit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const answeringRef = useRef(false);

  function handleAnswer(idx) {
    if (answeringRef.current) return;
    answeringRef.current = true;
    setAnswers(prev => {
      const updated = { ...prev };
      if (updated[currentQ] === idx) delete updated[currentQ];
      else updated[currentQ] = idx;
      return updated;
    });
    setLastAnswered(currentQ);
    setTimeout(() => { answeringRef.current = false; setLastAnswered(null); }, 300);
  }

  async function submit() {
    clearInterval(timerRef.current);
    setScreen('finish');

    setAnswers(currentAnswers => {
      const finalScore = pool.reduce((a, q, i) => a + (currentAnswers[i] === q.correct ? 1 : 0), 0);
      const finalTotal = pool.length;
      const finalAccuracy = finalTotal > 0 ? Math.round((finalScore / finalTotal) * 100) : 0;

      const saveResult = async () => {
        try {
          setSubmitStatus('saving');
          const user = getUser();
          if (user) {
            const res = await fetch('/api/mock-leaderboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                subject: selectedSubject?.id || 'all',
                subjectLabel: selectedSubject?.title || 'All Subjects',
                score: finalScore,
                total: finalTotal,
                accuracy: finalAccuracy,
                submittedAt: new Date().toISOString(),
              }),
            });
            const data = await res.json();
            setSubmitStatus(data.success ? 'saved' : 'error');
          } else {
            setSubmitStatus('error');
          }
        } catch (err) {
          console.error('Failed to save mock result:', err);
          setSubmitStatus('error');
        }
      };

      saveResult();
      return currentAnswers;
    });
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct = timeLeft / TOTAL_TIME;
  const tColor = pct > 0.4 ? C.primary : pct > 0.15 ? C.purple : C.red;
  const circ = 2 * Math.PI * 22;

  const score = pool.reduce((a, q, i) => a + (answers[i] === q.correct ? 1 : 0), 0);
  const scorePct = pool.length ? Math.round((score / pool.length) * 100) : 0;
  const answered = Object.keys(answers).length;
  const notAnswered = pool.length - answered;
  const wrong = answered - score;

  function getDotState(i) {
    if (screen === 'finish') {
      if (answers[i] === undefined) return 'unanswered';
      return answers[i] === pool[i]?.correct ? 'correct' : 'wrong';
    }
    if (i === currentQ) return 'active';
    if (answers[i] !== undefined) return 'answered';
    return 'default';
  }

  if (screen === 'subjectSelect') {
  if (isAptlModeLocal) return (
    <AptlMockSelector
      onSelectSubject={handleSubjectSelect}
      onBack={() => {
        if (isAptlMode) onBack();
        else setIsAptlModeLocal(false);
      }}
      isMobile={isMobile}
    />
  );
  return (
    <MockSubjectSelector
      onSelectSubject={(sub) => {
        if (sub.isAptl) { setIsAptlModeLocal(true); return; }
        handleSubjectSelect(sub);
      }}
      onBack={onBack}
      isMobile={isMobile}
    />
  );
}

  if (screen === 'intro') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: isMobile ? '0 4px' : 0, WebkitAnimation: 'fadeIn .4s ease', animation: 'fadeIn .4s ease' }}>
        <button onClick={() => setScreen('subjectSelect')} style={{ ...btnBase, marginBottom: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 16px', fontSize: 14, color: C.text }}>← Change Subject</button>

        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: isMobile ? '26px 20px' : '36px 32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: hexAlpha(selectedSubject?.color || C.purple, 0.08), border: `1px solid ${hexAlpha(selectedSubject?.color || C.purple, 0.2)}`, borderRadius: 20, padding: '6px 16px', marginBottom: 18 }}>
            <span style={{ fontSize: 17 }}>{selectedSubject?.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: selectedSubject?.color || C.purple }}>{selectedSubject?.title || 'All Subjects'}</span>
          </div>

          <div style={{ fontSize: 52, marginBottom: 16, WebkitAnimation: 'float 3s ease-in-out infinite', animation: 'float 3s ease-in-out infinite' }}>🎯</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: -0.4 }}>DGCA Mock Test</h2>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 22, lineHeight: 1.6 }}>
            {selectedSubject?.id === 'all' ? 'Full-length paper combining all subjects & chapters.' : `100 questions from ${selectedSubject?.title} — DGCA exam style.`}
          </p>

          {pool.length < TOTAL_Q && (
            <div style={{ background: hexAlpha(C.accent, 0.08), border: `1px solid ${hexAlpha(C.accent, 0.25)}`, borderRadius: 11, padding: '11px 16px', marginBottom: 18, fontSize: 13, color: C.text }}>
              ⚠️ Only {pool.length} questions available for this subject. The test will use all of them.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 7, marginBottom: 26 }}>
            {[['❓', `${pool.length} Questions`], ['⏱️', '100 Minutes'], ['📚', selectedSubject?.id === 'all' ? 'All Chapters' : selectedSubject?.title], ['💡', 'Instant Results']].map(([icon, label]) => (
              <span key={label} style={{ background: C.primaryLight, color: C.primary, border: `1px solid ${hexAlpha(C.primary, 0.19)}`, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'inline-block' }}>{icon} {label}</span>
            ))}
          </div>

          <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: '0 0 26px' }}>
            {['Each question has 4 options — choose the best answer', 'Click the same option again to deselect', 'Test auto-submits when timer reaches zero', 'Score summary shown at the end'].map((r, i) => (
              <li key={r} style={{ background: C.bg, borderRadius: 10, padding: '10px 15px', fontSize: 14, color: C.text, marginBottom: 8, WebkitAnimation: `fadeIn .35s ease ${i * 0.07}s both`, animation: `fadeIn .35s ease ${i * 0.07}s both` }}>✔ {r}</li>
            ))}
          </ul>

          <button onClick={() => pool.length > 0 ? setScreen('test') : null} disabled={pool.length === 0}
            style={{
              ...btnBase, width: '100%', padding: '14px',
              background: pool.length === 0 ? C.border : `linear-gradient(135deg,${selectedSubject?.color || C.primary},${C.purple})`,
              borderRadius: 13, color: pool.length === 0 ? C.muted : '#fff', fontSize: 16, fontWeight: 800,
              cursor: pool.length === 0 ? 'not-allowed' : 'pointer',
              WebkitTransition: 'transform .15s, box-shadow .15s',
              transition: 'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={e => { if (pool.length > 0) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 22px ${hexAlpha(selectedSubject?.color || C.primary, 0.35)}`; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {pool.length === 0 ? '⚠️ No questions available' : '🚀 Start Mock Test →'}
          </button>

          <button onClick={() => setScreen('subjectSelect')} style={{ ...btnBase, marginTop: 11, width: '100%', padding: '12px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 13, color: C.muted, fontSize: 14 }}>← Choose Different Subject</button>
        </div>
      </div>
    );
  }

  if (screen === 'test') {
    const q = pool[currentQ];
    const selected = answers[currentQ];
    return (
      <div>
        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 62, zIndex: 80, background: 'rgba(255,255,255,0.97)', WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', marginBottom: 18, gap: 10 }}>
          <button onClick={onBack} style={{ ...btnBase, background: 'none', border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 14px', color: C.text, fontSize: 14, flexShrink: 0 }}>← Exit</button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {!isMobile && (
              <span style={{ fontSize: 12, fontWeight: 700, background: hexAlpha(selectedSubject?.color || C.purple, 0.1), color: selectedSubject?.color || C.purple, padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {selectedSubject?.icon} {selectedSubject?.title}
              </span>
            )}
            <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>{answered}/{pool.length} answered</span>
          </div>
          {/* Timer ring */}
          <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke={C.border} strokeWidth="4" />
              <circle cx="26" cy="26" r="22" fill="none" stroke={tColor} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                transform="rotate(-90 26 26)"
                style={{ WebkitTransition: 'stroke-dashoffset 1s linear, stroke .5s', transition: 'stroke-dashoffset 1s linear, stroke .5s' }} />
            </svg>
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', WebkitTransform: 'translate(-50%,-50%)', fontSize: 10, fontWeight: 800, color: tColor, WebkitTransition: 'color .5s', transition: 'color .5s' }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: C.border, borderRadius: 99, marginBottom: 18 }}>
          <div style={{ height: '100%', width: `${pool.length > 0 ? ((currentQ + 1) / pool.length) * 100 : 0}%`, background: selectedSubject?.color || C.primary, borderRadius: 99, WebkitTransition: 'width .4s cubic-bezier(.4,0,.2,1)', transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
        </div>

        {/* Question navigator dots */}
        <div style={{ display: 'flex', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', gap: 6, marginBottom: 18, paddingBottom: isMobile ? 6 : 0 }}>
          {pool.map((_, i) => {
            const ds = getDotState(i);
            const isJustAnswered = lastAnswered === i;
            const bg = ds === 'answered' ? hexAlpha(C.primary, 0.18) : ds === 'correct' ? C.primary : ds === 'wrong' ? C.red : ds === 'active' ? C.primaryLight : C.card;
            const co = ds === 'answered' ? C.primary : ds === 'correct' || ds === 'wrong' ? '#fff' : ds === 'active' ? C.primary : C.muted;
            const br = ds === 'active' ? `2px solid ${C.primary}` : ds === 'answered' ? `1px solid ${hexAlpha(C.primary, 0.3)}` : `1px solid ${C.border}`;
            return (
              <button key={i} onClick={() => setCurrentQ(i)} style={{
                ...btnBase, width: 32, height: 32, borderRadius: 8, border: br, background: bg, color: co, fontSize: 11, fontWeight: 700, flexShrink: 0,
                WebkitTransition: 'all .15s',
                transition: 'all .15s',
                WebkitAnimation: isJustAnswered ? 'dotPop .25s ease' : undefined,
                animation: isJustAnswered ? 'dotPop .25s ease' : undefined,
                transform: ds === 'active' ? 'scale(1.1)' : 'scale(1)',
              }}>{i + 1}</button>
            );
          })}
        </div>

        {/* Question card */}
        <div style={{
          background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: isMobile ? '20px 18px' : '26px 28px', marginBottom: 16,
          WebkitAnimation: 'slideInCard .25s ease',
          animation: 'slideInCard .25s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Q {currentQ + 1} / {pool.length}</span>
            {q && (
              <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 700, display: 'inline-block', background: hexAlpha(selectedSubject?.color || C.primary, 0.1), color: selectedSubject?.color || C.primary }}>
                {selectedSubject?.icon} {selectedSubject?.title}
              </span>
            )}
          </div>
          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: C.text, lineHeight: 1.65, marginBottom: 20 }}>{q?.question}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q?.options.map((opt, idx) => {
              const isSelected = selected === idx;
              return (
                <button key={idx} onClick={() => handleAnswer(idx)} style={{
                  ...btnBase, display: 'flex', alignItems: 'center',
                  background: isSelected ? C.primaryLight : C.bg,
                  border: isSelected ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
                  borderRadius: 11, padding: '13px 16px', cursor: 'pointer', textAlign: 'left', color: C.text, fontSize: 14, fontWeight: 400,
                  WebkitTransition: 'all .18s',
                  transition: 'all .18s',
                  WebkitTapHighlightColor: 'transparent', userSelect: 'none', WebkitUserSelect: 'none',
                  transform: isSelected ? 'translateX(4px)' : 'none',
                  WebkitAnimation: `optionIn .2s ease ${idx * 0.05}s both`,
                  animation: `optionIn .2s ease ${idx * 0.05}s both`,
                }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.primaryLight; e.currentTarget.style.borderColor = hexAlpha(C.primary, 0.4); }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.border; }}
                >
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: isSelected ? C.primary : hexAlpha(C.primary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isSelected ? '#fff' : C.primary, flexShrink: 0, marginRight: 12, WebkitTransition: 'background .18s', transition: 'background .18s' }}>{['A', 'B', 'C', 'D'][idx]}</span>
                  <span style={{ flex: 1, lineHeight: 1.5 }}>{opt}</span>
                  {isSelected && <span style={{ marginLeft: 10, color: C.primary, fontSize: 16, WebkitAnimation: 'checkPop .2s ease', animation: 'checkPop .2s ease' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setCurrentQ(c => c - 1)} disabled={currentQ === 0}
            style={{ ...btnBase, background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '11px 18px', color: C.text, fontSize: 14, cursor: currentQ === 0 ? 'not-allowed' : 'pointer', opacity: currentQ === 0 ? .4 : 1, WebkitTransition: 'transform .15s', transition: 'transform .15s' }}
            onMouseEnter={e => { if (currentQ > 0) e.currentTarget.style.transform = 'translateX(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >← Prev</button>
          {!isMobile && <span style={{ fontSize: 13, color: C.muted }}>{answered}/{pool.length} answered</span>}
          {currentQ === pool.length - 1
            ? <button onClick={submit} style={{ ...btnBase, background: `linear-gradient(135deg,${C.accent},#D97706)`, borderRadius: 11, padding: '11px 20px', color: '#fff', fontSize: 14, fontWeight: 700, WebkitTransition: 'transform .15s', transition: 'transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >Submit ✓</button>
            : <button onClick={() => setCurrentQ(c => c + 1)} style={{ ...btnBase, background: C.primaryLight, border: `1px solid ${hexAlpha(C.primary, 0.19)}`, borderRadius: 11, padding: '11px 20px', color: C.primary, fontSize: 14, fontWeight: 700, WebkitTransition: 'transform .15s', transition: 'transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >Next →</button>}
        </div>
      </div>
    );
  }

  // ── Screen: Finish / Results
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '0 4px' : 0, WebkitAnimation: 'fadeIn .5s ease', animation: 'fadeIn .5s ease' }}>
      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: isMobile ? '26px 20px' : '36px 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: hexAlpha(selectedSubject?.color || C.purple, 0.08), border: `1px solid ${hexAlpha(selectedSubject?.color || C.purple, 0.2)}`, borderRadius: 20, padding: '5px 14px', marginBottom: 16 }}>
          <span style={{ fontSize: 15 }}>{selectedSubject?.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: selectedSubject?.color || C.purple }}>{selectedSubject?.title}</span>
        </div>

        <div style={{ fontSize: 52, marginBottom: 12, WebkitAnimation: 'bounceIn .6s cubic-bezier(.4,0,.2,1)', animation: 'bounceIn .6s cubic-bezier(.4,0,.2,1)' }}>{scorePct >= 80 ? '🏆' : scorePct >= 50 ? '✈️' : '📚'}</div>
        <h2 style={{ margin: '0 0 5px', fontWeight: 900, fontSize: 22, color: C.text, letterSpacing: -0.3 }}>{scorePct >= 80 ? 'Excellent!' : scorePct >= 50 ? 'Good Effort!' : 'Keep Practicing!'}</h2>
        <div style={{ fontSize: 48, fontWeight: 900, color: getScoreColor(scorePct), lineHeight: 1, WebkitAnimation: 'countUp .8s ease', animation: 'countUp .8s ease' }}>{score}/{pool.length}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: getScoreColor(scorePct), marginBottom: 18 }}>{scorePct}%</div>

        {/* Save status badge */}
        <div style={{ marginBottom: 22, minHeight: 34 }}>
          {submitStatus === 'saving' && (
            <span style={{ background: hexAlpha(C.accent, 0.1), color: C.accent, border: `1px solid ${hexAlpha(C.accent, 0.25)}`, padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'inline-block', WebkitAnimation: 'pulse 1.5s ease-in-out infinite', animation: 'pulse 1.5s ease-in-out infinite' }}>⏳ Saving to leaderboard…</span>
          )}
          {submitStatus === 'saved' && (
            <span style={{ background: hexAlpha(C.green, 0.1), color: C.green, border: `1px solid ${hexAlpha(C.green, 0.25)}`, padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'inline-block', WebkitAnimation: 'fadeIn .4s ease', animation: 'fadeIn .4s ease' }}>✅ Score saved to leaderboard!</span>
          )}
          {submitStatus === 'error' && (
            <span style={{ background: hexAlpha(C.red, 0.1), color: C.red, border: `1px solid ${hexAlpha(C.red, 0.25)}`, padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'inline-block' }}>⚠️ Could not save score. Check connection.</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
          {[
            { icon: '✓', val: score, label: 'Correct', bg: '#EFF6FF', co: C.primary, br: hexAlpha(C.primary, 0.25) },
            { icon: '✗', val: wrong, label: 'Wrong', bg: '#FEF2F2', co: C.red, br: hexAlpha(C.red, 0.25) },
            { icon: '–', val: notAnswered, label: 'Skipped', bg: '#F5F3FF', co: C.purple, br: hexAlpha(C.purple, 0.25) },
          ].map((b, i) => (
            <div key={b.label} style={{ flex: 1, background: b.bg, border: `1px solid ${b.br}`, borderRadius: 14, padding: '14px 8px', WebkitAnimation: `fadeIn .4s ease ${i * 0.1}s both`, animation: `fadeIn .4s ease ${i * 0.1}s both` }}>
              <div style={{ fontSize: 20, color: b.co }}>{b.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.text }}>{b.val}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{b.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px 5px', marginBottom: 22 }}>
          {pool.map((_, i) => {
            const ds = getDotState(i);
            const bg = ds === 'correct' ? C.primary : ds === 'wrong' ? C.red : ds === 'unanswered' ? hexAlpha(C.purple, 0.3) : C.bg;
            const co = ds === 'correct' || ds === 'wrong' ? '#fff' : ds === 'unanswered' ? C.purple : C.muted;
            return (
              <span key={i} style={{
                width: 28, height: 28, borderRadius: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: bg, color: co, border: `1px solid ${C.border}`,
                WebkitAnimation: `dotReveal .3s ease ${i * 0.01}s both`,
                animation: `dotReveal .3s ease ${i * 0.01}s both`,
              }}>{i + 1}</span>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 22 }}>
          {[{ color: C.primary, label: 'Correct' }, { color: C.red, label: 'Wrong' }, { color: hexAlpha(C.purple, 0.3), label: 'Skipped' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: l.color, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: C.muted }}>{l.label}</span>
            </div>
          ))}
        </div>

        <button onClick={onBack} style={{
          width: '100%', padding: '13px', background: `linear-gradient(135deg,${C.primary},${C.purple})`, border: 'none', borderRadius: 13, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 11, WebkitAppearance: 'none', appearance: 'none',
          WebkitTransition: 'transform .15s, box-shadow .15s',
          transition: 'transform .15s, box-shadow .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${hexAlpha(C.primary, 0.3)}`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >Back to Tests</button>

        {submitStatus === 'saved' && (
          <button onClick={() => { window.location.href = `/mock-leaderboard?subject=${selectedSubject?.id || 'all'}`; }}
            style={{ width: '100%', padding: '12px', background: hexAlpha(C.green, 0.1), border: `1px solid ${hexAlpha(C.green, 0.3)}`, borderRadius: 13, color: C.green, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 11, WebkitAppearance: 'none', appearance: 'none', WebkitAnimation: 'fadeIn .5s ease', animation: 'fadeIn .5s ease' }}>
            🏆 View Leaderboard →
          </button>
        )}

        <button onClick={resetMock} style={{ width: '100%', padding: '12px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 13, color: C.muted, fontSize: 14, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' }}>🔄 Try Another Subject</button>
      </div>
    </div>
  );
}

// ─── CHAPTER TESTS PAGE ───────────────────────────────────────────────────────
function ChapterTestsPage({ allResults, onStartTest, isMobile, initialSubView = 'subjects' }) {
  const [subView, setSubView] = useState(initialSubView);

  useEffect(() => { setSubView(initialSubView); }, [initialSubView]);

  const activeSubject = SUBJECTS.find(s => s.id === subView);

  if (activeSubject?.comingSoon) return <ComingSoonPage subject={activeSubject} onBack={() => setSubView('subjects')} />;
  if (subView === 'mock') return <MockTestPage onBack={() => setSubView('subjects')} isMobile={isMobile} />;
  if (subView === 'atpl') return <MockTestPage onBack={() => setSubView('subjects')} isMobile={isMobile} isAptlMode />;
  if (activeSubject && activeSubject.chapterIds.length > 0) {
    const known = chapters.filter(c => activeSubject.chapterIds.includes(c.id));
    const knownIds = known.map(c => c.id);
    const stubs = activeSubject.chapterIds
      .filter(id => !knownIds.includes(id))
      .map((id, i) => ({ id, title: `Chapter ${id.replace(/^[a-z]+/i, '').replace(/^0+/, '') || i + 1}`, icon: activeSubject.icon, part: activeSubject.title, questionCount: 0, color: activeSubject.color }));

    return (
      <SubjectChapterList
        subject={activeSubject}
        subjectChapters={[...known, ...stubs]}
        allResults={allResults}
        onStartTest={onStartTest}
        onBack={() => setSubView('subjects')}
        isMobile={isMobile}
      />
    );
  }

  return <SubjectSelector allResults={allResults} onSelectSubject={id => setSubView(id)} onMockTest={(mode) => setSubView(mode === 'atpl' ? 'atpl' : 'mock')} isMobile={isMobile} />;
}

// ─── PROGRESS PAGE ────────────────────────────────────────────────────────────
function ProgressPage({ stats, allResults, loading, isMobile }) {
  const visible = useFadeIn(0);
  const chapterStats = chapters.map(ch => {
    const rs = allResults.filter(r => r.chapterId === ch.id);
    const best = rs.length ? Math.max(...rs.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0)) : null;
    return { ...ch, best, attempts: rs.length };
  });

  return (
    <div style={{ opacity: visible ? 1 : 0, WebkitTransition: 'opacity .4s ease', transition: 'opacity .4s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {loading ? Array(4).fill(0).map((_, i) => <div key={i} style={{ background: C.card, borderRadius: 16, padding: 18, border: `1px solid ${C.border}` }}><Skeleton h={44} /></div>) : (
          <>
            <StatCard icon="📊" label="Overall Avg" value={`${stats.avgScore}%`} color={C.primary} delay={0} />
            <StatCard icon="📋" label="Tests Done" value={stats.testsAttempted} color={C.green} delay={80} />
            <StatCard icon="🏆" label="Best Score" value={`${stats.bestScore}%`} color={C.accent} delay={160} />
            <StatCard icon="❓" label="Questions" value={stats.totalQuestions} color={C.purple} delay={240} />
          </>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 18 }}>Chapter Progress</div>
          {loading ? Array(5).fill(0).map((_, i) => <div key={i} style={{ marginBottom: 16 }}><Skeleton h={10} /></div>) :
            chapterStats.map((ch, idx) => (
              <div key={ch.id} style={{ marginBottom: 18, WebkitAnimation: `fadeIn .35s ease ${idx * 0.04}s both`, animation: `fadeIn .35s ease ${idx * 0.04}s both` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <span style={{ fontSize: 16 }}>{ch.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: ch.best !== null ? getScoreColor(ch.best) : C.muted }}>{ch.best !== null ? `${ch.best}%` : '—'}</span>
                </div>
                <ProgressBar value={ch.best ?? 0} color={ch.color || C.primary} height={7} />
              </div>
            ))
          }
        </div>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 18 }}>Performance Overview</div>
          {[
            { label: 'Accuracy Rate', value: stats.avgScore, color: C.primary, icon: '🎯' },
            { label: 'Best Performance', value: stats.bestScore, color: C.green, icon: '🏆' },
            { label: 'Completion Rate', value: Math.min(Math.round((stats.testsAttempted / Math.max(chapters.length, 1)) * 100), 100), color: C.accent, icon: '📋' },
          ].map((item, idx) => (
            <div key={item.label} style={{ marginBottom: 24, WebkitAnimation: `fadeIn .4s ease ${idx * 0.1}s both`, animation: `fadeIn .4s ease ${idx * 0.1}s both` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 900, color: item.color }}>{loading ? '…' : `${item.value}%`}</span>
              </div>
              <ProgressBar value={loading ? 0 : item.value} color={item.color} height={9} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Placeholder({ page }) {
  const icons = { classes: '📅', lectures: '🎬', mocktests: '📝' };
  const labels = { classes: 'Live Classes', lectures: 'Recorded Lectures', mocktests: 'Mock Tests' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 360, color: C.muted, background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, WebkitAnimation: 'fadeIn .4s ease', animation: 'fadeIn .4s ease' }}>
      <div style={{ fontSize: 52, marginBottom: 14, WebkitAnimation: 'float 3s ease-in-out infinite', animation: 'float 3s ease-in-out infinite' }}>{icons[page] || '📄'}</div>
      <div style={{ fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 6 }}>{labels[page] || page}</div>
      <div style={{ fontSize: 14, color: C.muted }}>Coming soon in the full build.</div>
    </div>
  );
}

// ─── CLASS TEST SECTION ───────────────────────────────────────────────────
function AssignedTestsSection({ user, onStartAssignedTest }) {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/assigned-tests')
            .then(r => r.json())
            .then(d => { if (d.success) setTests(d.tests); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading || tests.length === 0) return null;

    return (
        <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, animation: 'pulse 2s ease-in-out infinite' }}>NEW</span>
                    🎯 Class Test
                </div>
                <span style={{ fontSize: 12, color: C.muted }}>{tests.length} test{tests.length !== 1 ? 's' : ''} from your teacher</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tests.map((test, idx) => {
                    const subjectColors = {
                        air_regulations: { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', icon: '📋' },
                        meteorology:     { color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD', icon: '🌦️' },
                        navigation:      { color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0', icon: '🗺️' },
                        technical:       { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: '🔧' },
                        rtfm:            { color: '#EF4444', bg: '#FFF1F2', border: '#FECACA', icon: '📻' },
                    };
                    const sc = subjectColors[test.subjectId] || { color: C.primary, bg: C.primaryLight, border: '#BFDBFE', icon: '📝' };

                    return (
                        <div key={test.id}
                            style={{
                                background: sc.bg,
                                border: `1px solid ${sc.border}`,
                                borderLeft: `4px solid ${sc.color}`,
                                borderRadius: 14, padding: '14px 18px',
                                display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                                WebkitAnimation: `fadeIn .4s ease ${idx * 0.07}s both`,
                                animation: `fadeIn .4s ease ${idx * 0.07}s both`,
                            }}>
                            <div style={{ fontSize: 28, flexShrink: 0 }}>{sc.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 3 }}>{test.title}</div>
                                <div style={{ fontSize: 12, color: C.muted }}>
                                    {test.subjectLabel} · ❓ {test.numQuestions} questions · ⏱️ {test.durationMins} mins
                                </div>
                                {test.instructions && (
                                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontStyle: 'italic' }}>📌 {test.instructions}</div>
                                )}
                            </div>
                            <button
                                onClick={() => onStartAssignedTest(test)}
                                style={{
                                    background: sc.color, color: '#fff', border: 'none',
                                    borderRadius: 10, padding: '9px 18px',
                                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    flexShrink: 0, whiteSpace: 'nowrap',
                                    boxShadow: `0 4px 14px ${sc.color}44`,
                                    WebkitTransition: 'transform .15s, box-shadow .15s',
                                    transition: 'transform .15s, box-shadow .15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                            >
                                Start Test →
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
// ─── ROOT DASHBOARD ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUserState] = useState(null);
  const [stats, setStats] = useState({ testsAttempted: 0, avgScore: 0, bestScore: 0, totalQuestions: 0 });
  const [recentResults, setRecent] = useState([]);
  const [allResults, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [subPage, setSubPage] = useState('subjects');

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      setLoading(false);
      return;
    }

    setUserState(storedUser);

    const loadProfile = async () => {
      try {
        const lookup = { email: storedUser.email, phone: storedUser.phone };
        const dbUser = await fetchAndStoreUser(lookup);
        const profile = dbUser && (dbUser.email || dbUser.phone) ? dbUser : storedUser;

        localStorage.setItem("user", JSON.stringify(profile));
        setUserState(profile);

        if (!profile.email) {
          setStats({ testsAttempted: 0, avgScore: 0, bestScore: 0, totalQuestions: 0 });
          setAll([]);
          setRecent([]);
          return;
        }

        const [s, r] = await Promise.all([getStats(profile.email), getResults(profile.email)]);
        setStats(s);
        setAll(r);
        setRecent(r.slice(0, 5));
      } catch (err) {
        console.warn("Dashboard data load skipped:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);
  function handleLogout() { clearUser(); setUserState(null); }

  function handleNav(newPage, chapterId) {
    if (newPage === 'interview') {
      window.location.href = 'https://avi-assess-io5m.vercel.app/';
      return;
    }
    if (newPage === 'results') { router.push('/results'); return; }
    if (newPage === 'leaderboard') { router.push('/leaderboard'); return; }
    if (newPage === 'mockleaderboard') { setPage('mockleaderboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (chapterId) { router.push(`/test/${chapterId}`); return; }
    if (newPage === 'mocktests') {
      setPage('tests');
      setSubPage('mock');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPage(newPage);
    if (newPage === 'tests') setSubPage('subjects');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const sidebarWidth = isDesktop ? 232 : 0;
  const topBarHeight = 62;
  const bottomNavHeight = isMobile ? 60 : 0;
  const activeNavItem = (page === 'tests' && subPage === 'mock') ? 'mocktests' : page;

  function renderPage() {
    switch (page) {
      case 'profile':
        return <StudentProfilePage
          user={user}
          stats={stats}
          allResults={allResults}
          onBack={() => handleNav('home')}
          onNavigate={handleNav}
          isMobile={isMobile}
        />;
      case 'tests':
        return <ChapterTestsPage allResults={allResults} onStartTest={id => router.push(`/test/${id}`)} isMobile={isMobile} initialSubView={subPage} />;
      case 'progress':
        return <ProgressPage stats={stats} allResults={allResults} loading={loading} isMobile={isMobile} />;
      case 'resources':
        return <ResourcesPage />;
      case 'lectures':
      case 'Interview':
      case 'classes':
        return <LecturesPage user={user} />;
      case 'doubt':
        return <div style={{ minHeight: 500 }}><DoubtChat studentId={user?.id} /></div>;
      case 'mockleaderboard':
        
        return (
          <MockLeaderboardWidget
            user={user}
            onViewFull={() => router.push('/mock-leaderboard')}
          />
        );
      case 'class-test':
        return (
          <div style={{ minHeight: 500, padding: isMobile ? '18px 16px' : '22px 28px' }}>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8 }}>🎓 Class Test</div>
                <div style={{ fontSize: 14, color: C.muted, maxWidth: 660 }}>Your teacher's prepared tests are listed here. Click any test below to start the assigned class test and answer the MCQ questions created by your teacher.</div>
              </div>
            </div>
            <AssignedTestsSection user={user} onStartAssignedTest={test => router.push(`/assigned-test/${test.id}`)} />
          </div>
        );
      default:
        return (
          <HomePage
            user={user} stats={stats} recentResults={recentResults}
            allResults={allResults} loading={loading} onNavigate={handleNav}
            isMobile={isMobile} isTablet={isTablet}
          />
        );
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: C.bg, minHeight: '100vh' }}>
      <style>{`
        @-webkit-keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes shimmer          { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @-webkit-keyframes fadeIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes fadeIn           { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @-webkit-keyframes slideUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes slideUp          { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @-webkit-keyframes slideInRow { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }
        @keyframes slideInRow       { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }
        @-webkit-keyframes slideInNav { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        @keyframes slideInNav       { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        @-webkit-keyframes slideInCard { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes slideInCard      { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @-webkit-keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes float            { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @-webkit-keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.65;transform:scale(1.15)} }
        @keyframes pulse            { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.65;transform:scale(1.15)} }
        @-webkit-keyframes iconPop  { 0%{transform:scale(.7)} 70%{transform:scale(1.12)} 100%{transform:scale(1)} }
        @keyframes iconPop          { 0%{transform:scale(.7)} 70%{transform:scale(1.12)} 100%{transform:scale(1)} }
        @-webkit-keyframes bounceIn { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.15);opacity:1} 100%{transform:scale(1)} }
        @keyframes bounceIn         { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.15);opacity:1} 100%{transform:scale(1)} }
        @-webkit-keyframes dotPop   { 0%{transform:scale(1)} 40%{transform:scale(1.4)} 100%{transform:scale(1)} }
        @keyframes dotPop           { 0%{transform:scale(1)} 40%{transform:scale(1.4)} 100%{transform:scale(1)} }
        @-webkit-keyframes dotReveal { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
        @keyframes dotReveal        { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
        @-webkit-keyframes optionIn  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
        @keyframes optionIn         { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
        @-webkit-keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes checkPop         { 0%{transform:scale(0)} 60%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @-webkit-keyframes barShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes barShimmer       { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @-webkit-keyframes planeDrift { 0%,100%{transform:translateY(-50%) translateX(0) rotate(-3deg)} 50%{transform:translateY(-50%) translateX(12px) rotate(3deg)} }
        @keyframes planeDrift       { 0%,100%{transform:translateY(-50%) translateX(0) rotate(-3deg)} 50%{transform:translateY(-50%) translateX(12px) rotate(3deg)} }
        @-webkit-keyframes headphoneBounce { from{transform:translateY(0)} to{transform:translateY(-4px)} }
        @keyframes headphoneBounce  { from{transform:translateY(0)} to{transform:translateY(-4px)} }
        @-webkit-keyframes countUp  { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
        @keyframes countUp          { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
        * { -webkit-box-sizing:border-box; box-sizing:border-box; margin:0; }
        button:focus-visible { outline:2px solid #1D4ED8; outline-offset:2px; }
        input,button { -webkit-appearance:none; appearance:none; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
        ::-webkit-scrollbar-thumb:hover { background:#94A3B8; }
        body { overflow-x:hidden; }
        input { font-family: inherit; }
      `}</style>

      <Sidebar
        active={activeNavItem}
        onChange={handleNav}
        onLogout={handleLogout}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={!isDesktop}
      />

      <TopBar
        user={user} page={page} subPage={subPage}
        onLeaderboard={() => router.push('/leaderboard')}
        onMenuOpen={() => setSidebarOpen(true)}
        onLogin={() => router.push('/login')}
        isMobile={!isDesktop}
      />

      <main style={{ marginLeft: sidebarWidth, paddingTop: topBarHeight, paddingBottom: isMobile ? bottomNavHeight + 16 : 0, minHeight: '100vh' }}>
        {page === 'resources'
          ? <div style={{ padding: isMobile ? '18px 16px' : '22px 28px' }}><ResourcesPage /></div>
          : <div style={{ padding: isMobile ? '18px 16px' : isTablet ? '22px 28px' : '28px 32px', maxWidth: 1300 }}>{renderPage()}</div>
        }
      </main>

      {/* Footer stats bar */}
      {!isMobile && (
        <div style={{ marginLeft: sidebarWidth, background: C.sidebar, padding: '16px 32px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 10 }}>
          {[
            ['📋', `${stats.testsAttempted}`, 'Tests Taken'],
            ['🎯', `${stats.avgScore}%`, 'Avg Accuracy'],
            ['🏆', `${stats.bestScore}%`, 'Best Score'],
            ['❓', `${stats.totalQuestions}`, 'Questions Done'],
            ['📚', `${chapters.length}`, 'Chapters'],
            ['✈️', '24/7', 'DGCA Prep'],
          ].map(([icon, val, label]) => (
            <div key={label} style={{ textAlign: 'center', padding: '4px 14px' }}>
              <div style={{ fontSize: 16 }}>{icon}</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginTop: 2 }}>{val}</div>
              <div style={{ color: '#8BA3C5', fontSize: 11, marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {isMobile && <BottomNav active={activeNavItem} onChange={handleNav} />}
    </div>
  );
}