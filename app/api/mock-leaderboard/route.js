import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// ─── GET /api/mock-leaderboard?subject=air_regulations ────────────────────────
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject');

        let rows;
        if (subject && subject !== 'all') {
            ({ rows } = await pool.query(
                `SELECT email, name, subject, subject_label, score, total, accuracy, attempts, submitted_at
                 FROM mock_leaderboard
                 WHERE subject = $1
                 ORDER BY accuracy DESC, score DESC, submitted_at ASC
                 LIMIT 100`,
                [subject]
            ));
        } else {
            ({ rows } = await pool.query(
                `SELECT email, name, subject, subject_label, score, total, accuracy, attempts, submitted_at
                 FROM mock_leaderboard
                 ORDER BY accuracy DESC, score DESC, submitted_at ASC
                 LIMIT 100`
            ));
        }

        return NextResponse.json({
            success: true,
            entries: rows.map(e => ({
                email: e.email,
                name: e.name,
                subject: e.subject,
                subjectLabel: e.subject_label,
                score: e.score,
                total: e.total,
                accuracy: e.accuracy,
                attempts: e.attempts,
                submittedAt: e.submitted_at,
            })),
        });
    } catch (err) {
        console.error('GET /api/mock-leaderboard error:', err);
        return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
    }
}

// ─── POST /api/mock-leaderboard ───────────────────────────────────────────────
// Only saves if new accuracy is better than existing best
export async function POST(request) {
    try {
        const { email, name, subject, subjectLabel, score, total, accuracy, submittedAt } = await request.json();

        if (!email || !name || score == null || !total) {
            return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();
        const subjectKey = subject || 'all';
        const newAccuracy = accuracy ?? (total > 0 ? Math.round((score / total) * 100) : 0);

        const { rows: existingRows } = await pool.query(
            `SELECT * FROM mock_leaderboard WHERE LOWER(email) = LOWER($1) AND subject = $2`,
            [cleanEmail, subjectKey]
        );

        const existing = existingRows[0];

        if (existing) {
            if ((existing.accuracy || 0) >= newAccuracy) {
                await pool.query(
                    `UPDATE mock_leaderboard SET attempts = COALESCE(attempts,0) + 1 WHERE id = $1`,
                    [existing.id]
                );
                return NextResponse.json({ success: true, updated: false, message: 'Existing score is better.' });
            }

            await pool.query(
                `UPDATE mock_leaderboard SET name=$1, subject_label=$2, score=$3, total=$4, accuracy=$5, attempts=COALESCE(attempts,0)+1, submitted_at=$6 WHERE id=$7`,
                [name, subjectLabel || subjectKey, Number(score), Number(total), newAccuracy, submittedAt || new Date().toISOString(), existing.id]
            );

            return NextResponse.json({ success: true, updated: true });
        }

        await pool.query(
            `INSERT INTO mock_leaderboard (email, name, subject, subject_label, score, total, accuracy, attempts, submitted_at, first_attempt)
             VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8,NOW())`,
            [cleanEmail, name, subjectKey, subjectLabel || subjectKey, Number(score), Number(total), newAccuracy, submittedAt || new Date().toISOString()]
        );

        return NextResponse.json({ success: true, updated: true, created: true });
    } catch (err) {
        console.error('POST /api/mock-leaderboard error:', err);
        return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
    }
}