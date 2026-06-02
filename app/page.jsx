'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard when user visits http://localhost:3000/
    router.replace('/dashboard');
  }, [router]);

  // Optional: Show a nice loading screen while redirecting
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0f2fe, #f8fafc)',
        color: '#0f172a',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          animation: 'spin 2s linear infinite',
          color: '#2563eb',
        }}
      >
        ✈
      </div>
      <div
        style={{
          color: '#475569',
          fontSize: '1rem',
          letterSpacing: '0.1em',
        }}
      >
        Redirecting to Dashboard...
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}