'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../lib/storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0f2fe, #f8fafc)',
      color: '#0f172a',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite', color: '#2563eb' }}>✈</div>
      <div style={{ color: '#475569', fontSize: '1rem', letterSpacing: '0.1em' }}>Loading...</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
