import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function POST(request) {
  try {
    const { guestId, email, name } = await request.json();
    if (!guestId || !email || !name) {
      return NextResponse.json({ success: false, error: 'guestId, email and name are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const guestRows = await pool.query(
      `SELECT * FROM mock_leaderboard WHERE guest_id = $1`,
      [guestId]
    );

    if (guestRows.rows.length === 0) {
      return NextResponse.json({ success: true, transferredCount: 0, result: null });
    }

    const transferred = [];

    for (const guestRow of guestRows.rows) {
      const subjectKey = guestRow.subject || 'all';
      const existingRows = await pool.query(
        `SELECT * FROM mock_leaderboard WHERE LOWER(email) = LOWER($1) AND subject = $2`,
        [cleanEmail, subjectKey]
      );
      const existing = existingRows.rows[0];

      if (existing) {
        if ((existing.accuracy || 0) >= (guestRow.accuracy || 0)) {
          transferred.push({ didUpdate: false, keptExisting: true, subject: subjectKey });
          continue;
        }

        await pool.query(
          `UPDATE mock_leaderboard
           SET name=$1, subject_label=$2, score=$3, total=$4, accuracy=$5, attempts=COALESCE(attempts,0)+1, submitted_at=$6
           WHERE id=$7`,
          [name, guestRow.subject_label, guestRow.score, guestRow.total, guestRow.accuracy, guestRow.submitted_at, existing.id]
        );

        transferred.push({ didUpdate: true, subject: subjectKey, score: guestRow.score, total: guestRow.total, accuracy: guestRow.accuracy });
        continue;
      }

      const { rows: insertedRows } = await pool.query(
        `INSERT INTO mock_leaderboard (email, name, subject, subject_label, score, total, accuracy, attempts, submitted_at, first_attempt)
         VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8,NOW())
         RETURNING *`,
        [cleanEmail, name, subjectKey, guestRow.subject_label, guestRow.score, guestRow.total, guestRow.accuracy, guestRow.submitted_at]
      );

      transferred.push({ didUpdate: true, subject: subjectKey, score: guestRow.score, total: guestRow.total, accuracy: guestRow.accuracy, row: insertedRows[0] });
    }

    await pool.query(`DELETE FROM mock_leaderboard WHERE guest_id = $1`, [guestId]);

    return NextResponse.json({
      success: true,
      transferredCount: transferred.length,
      result: transferred.length > 0 ? transferred[0] : null,
    });
  } catch (err) {
    console.error('POST /api/mock-leaderboard/transfer error:', err);
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
