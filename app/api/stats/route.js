import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongoose';
import { ResultModel } from '../../../lib/models';

// GET /api/stats?email=... — compute stats for a user
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email is required.' }, { status: 400 });

    const results = await ResultModel.find({ userEmail: email.toLowerCase().trim() }).lean();

    if (results.length === 0) {
      return NextResponse.json({ testsAttempted: 0, avgScore: 0, bestScore: 0, totalQuestions: 0 });
    }

    const testsAttempted  = results.length;
    const totalQuestions  = results.reduce((sum, r) => sum + (r.total || 0), 0);
    const scores          = results.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0);
    const avgScore        = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore       = Math.max(...scores);

    return NextResponse.json({ testsAttempted, avgScore, bestScore, totalQuestions });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
