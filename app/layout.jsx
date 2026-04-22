import './globals.css';

export const metadata = {
  title: 'DGCA Prep | Pilot Exam Platform',
  description: 'Prepare for DGCA pilot exams with chapter-wise MCQ tests, instant explanations, and leaderboards.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
