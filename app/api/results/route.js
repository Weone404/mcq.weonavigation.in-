import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongoose';
import { ResultModel } from '../../../lib/models';

// GET /api/results?email=... — fetch results for a user (latest 50)
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email is required.' }, { status: 400 });

    const results = await ResultModel.find({ userEmail: email.toLowerCase().trim() })
      .sort({ date: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(
      results.map(r => ({
        id: r._id.toString(),
        userEmail: r.userEmail,
        chapterId: r.chapterId,
        score: r.score,
        total: r.total,
        date: r.date,
      }))
    );
  } catch (err) {
    console.error('GET /api/results error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// POST /api/results — save a new result
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { userEmail, chapterId, score, total } = body;

    if (!userEmail || !chapterId || score == null || total == null) {
      return NextResponse.json({ error: 'userEmail, chapterId, score, and total are required.' }, { status: 400 });
    }

    const result = await ResultModel.create({
      userEmail: userEmail.toLowerCase().trim(),
      chapterId,
      score: Number(score),
      total: Number(total),
    });

    // Enforce max 50 results per user — delete oldest beyond that
    const count = await ResultModel.countDocuments({ userEmail: userEmail.toLowerCase().trim() });
    if (count > 50) {
      const oldest = await ResultModel.find({ userEmail: userEmail.toLowerCase().trim() })
        .sort({ date: 1 })
        .limit(count - 50)
        .select('_id')
        .lean();
      await ResultModel.deleteMany({ _id: { $in: oldest.map(r => r._id) } });
    }

    return NextResponse.json({ id: result._id.toString(), date: result.date });
  } catch (err) {
    console.error('POST /api/results error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
