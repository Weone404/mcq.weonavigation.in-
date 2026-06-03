import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

// GET /api/stats?email=... — compute stats for a user
export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email is required.' }, { status: 400 });

    const { rows: results } = await pool.query(
      `SELECT score, total FROM test_results
       WHERE LOWER(student_email) = LOWER($1)`,
      [email.trim()]
    );

    if (results.length === 0) {
      return NextResponse.json({ testsAttempted: 0, avgScore: 0, bestScore: 0, totalQuestions: 0 });
    }

    const testsAttempted = results.length;
    const totalQuestions = results.reduce((sum, r) => sum + (r.total || 0), 0);
    const scores = results.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);

    return NextResponse.json({ testsAttempted, avgScore, bestScore, totalQuestions });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}