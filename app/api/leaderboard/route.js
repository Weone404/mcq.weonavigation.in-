import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongoose';
import { LeaderboardModel } from '../../../lib/models';

// GET /api/leaderboard — return all entries sorted by accuracy DESC, totalScore DESC
export async function GET() {
  try {
    await connectDB();
    const board = await LeaderboardModel.find()
      .sort({ accuracy: -1, totalScore: -1 })
      .lean();

    return NextResponse.json(
      board.map(e => ({
        email: e.email,
        name: e.name,
        totalScore: e.totalScore,
        totalQuestions: e.totalQuestions,
        testsAttempted: e.testsAttempted,
        accuracy: e.accuracy,
      }))
    );
  } catch (err) {
    console.error('GET /api/leaderboard error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// POST /api/leaderboard — upsert entry for a user
export async function POST(request) {
  try {
    await connectDB();
    const { email, name, score, total } = await request.json();

    if (!email || !name || score == null || total == null) {
      return NextResponse.json({ error: 'email, name, score, total are required.' }, { status: 400 });
    }

    const existing = await LeaderboardModel.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      existing.totalScore     += Number(score);
      existing.totalQuestions += Number(total);
      existing.testsAttempted += 1;
      existing.accuracy = existing.totalQuestions > 0
        ? Math.round((existing.totalScore / existing.totalQuestions) * 100)
        : 0;
      // Keep name up-to-date in case it changed
      existing.name = name;
      await existing.save();
      return NextResponse.json({ updated: true });
    } else {
      const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
      await LeaderboardModel.create({
        email: email.toLowerCase().trim(),
        name,
        totalScore: Number(score),
        totalQuestions: Number(total),
        testsAttempted: 1,
        accuracy,
      });
      return NextResponse.json({ created: true });
    }
  } catch (err) {
    console.error('POST /api/leaderboard error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
