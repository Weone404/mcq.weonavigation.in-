import './globals.css';
import dynamic from 'next/dynamic';

// ✅ Fix: dynamic import with ssr:false prevents hydration mismatch
// AliaWidget uses useState, speechSynthesis etc — browser-only APIs
const AliaWidget = dynamic(
  () => import('../components/AliaWidget/page.jsx'),
  { ssr: false }
);

export const metadata = {
  title: 'DGCA Prep | Pilot Exam Platform',
  description: 'Prepare for DGCA pilot exams with chapter-wise MCQ tests, instant explanations, and leaderboards.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AliaWidget />
      </body>

    </html>
  );
}