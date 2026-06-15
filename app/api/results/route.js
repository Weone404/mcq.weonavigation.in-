import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email is required.' }, { status: 400 });

    const { rows } = await pool.query(
      `SELECT * FROM test_results 
       WHERE LOWER(student_email) = LOWER($1) 
       ORDER BY date DESC 
       LIMIT 50`,
      [email.trim()]
    );

    return NextResponse.json(
      rows.map(r => ({
        id: r.id.toString(),
        userEmail: r.student_email,
        chapterId: r.chapter_id,
        subjectId: r.subject_id || null,  // ✅ ADDED
        score: r.score,
        total: r.total,
        answers: r.answers || [],
        date: r.date,
      }))
    );
  } catch (err) {
    console.error('GET /api/results error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userEmail, chapterId, subjectId, score, total } = body;  // ✅ added subjectId

    if (!userEmail || !chapterId || score == null || total == null) {
      return NextResponse.json(
        { error: 'userEmail, chapterId, score, and total are required.' },
        { status: 400 }
      );
    }

    const answers = Array.isArray(body.answers)
      ? body.answers.map(a => ({
          questionId: a.questionId,
          selected: Number(a.selected),
          correct: Number(a.correct),
          isCorrect: Boolean(a.isCorrect),
        }))
      : [];

    const { rows } = await pool.query(
      `INSERT INTO test_results (student_email, chapter_id, subject_id, score, total, answers, date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, date`,
      [
        userEmail.toLowerCase().trim(),
        chapterId,
        subjectId || null,   // ✅ ADDED
        Number(score),
        Number(total),
        JSON.stringify(answers),
      ]
    );

    const saved = rows[0];

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) as count FROM test_results 
       WHERE LOWER(student_email) = LOWER($1)`,
      [userEmail.toLowerCase().trim()]
    );

    const count = parseInt(countRows[0].count);

    if (count > 50) {
      await pool.query(
        `DELETE FROM test_results 
         WHERE id IN (
           SELECT id FROM test_results
           WHERE LOWER(student_email) = LOWER($1)
           ORDER BY date ASC
           LIMIT $2
         )`,
        [userEmail.toLowerCase().trim(), count - 50]
      );
    }

    return NextResponse.json({ id: saved.id.toString(), date: saved.date });

  } catch (err) {
    console.error('POST /api/results error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}