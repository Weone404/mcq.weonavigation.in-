import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS leaderboard (
            id               SERIAL PRIMARY KEY,
            email            TEXT NOT NULL UNIQUE,
            name             TEXT NOT NULL,
            total_score      INTEGER NOT NULL DEFAULT 0,
            total_questions  INTEGER NOT NULL DEFAULT 0,
            tests_attempted  INTEGER NOT NULL DEFAULT 0,
            accuracy         INTEGER NOT NULL DEFAULT 0,
            created_at       TIMESTAMPTZ DEFAULT NOW(),
            updated_at       TIMESTAMPTZ DEFAULT NOW()
        );
    `);
}

// GET /api/leaderboard — return all entries sorted by accuracy DESC, totalScore DESC
export async function GET() {
    try {
        await ensureTable(); // 👈 added

        const { rows } = await pool.query(
            `SELECT
               email,
               name,
               total_score      AS "totalScore",
               total_questions  AS "totalQuestions",
               tests_attempted  AS "testsAttempted",
               accuracy
             FROM leaderboard
             ORDER BY accuracy DESC, total_score DESC`
        );

        return NextResponse.json(rows);
    } catch (err) {
        console.error('GET /api/leaderboard error:', err);
        return NextResponse.json({ error: 'Server error.' }, { status: 500 });
    }
}

// POST /api/leaderboard — upsert entry for a user
export async function POST(request) {
    try {
        await ensureTable(); // 👈 added

        const { email, name, score, total } = await request.json();

        if (!email || !name || score == null || total == null) {
            return NextResponse.json(
                { error: 'email, name, score, total are required.' },
                { status: 400 }
            );
        }

        const { rows } = await pool.query(
            `INSERT INTO leaderboard (email, name, total_score, total_questions, tests_attempted, accuracy)
             VALUES ($1, $2, $3, $4, 1, $5)
             ON CONFLICT (email) DO UPDATE SET
               name            = EXCLUDED.name,
               total_score     = leaderboard.total_score     + EXCLUDED.total_score,
               total_questions = leaderboard.total_questions + EXCLUDED.total_questions,
               tests_attempted = leaderboard.tests_attempted + 1,
               accuracy        = CASE
                                   WHEN (leaderboard.total_questions + EXCLUDED.total_questions) > 0
                                   THEN ROUND(
                                     (leaderboard.total_score + EXCLUDED.total_score)::numeric
                                     / (leaderboard.total_questions + EXCLUDED.total_questions) * 100
                                   )
                                   ELSE 0
                                 END,
               updated_at      = NOW()
             RETURNING (xmax = 0) AS created`,
            [
                email.toLowerCase().trim(),
                name,
                Number(score),
                Number(total),
                total > 0 ? Math.round((score / total) * 100) : 0,
            ]
        );

        const wasCreated = rows[0].created;
        return NextResponse.json(wasCreated ? { created: true } : { updated: true });

    } catch (err) {
        console.error('POST /api/leaderboard error:', err);
        return NextResponse.json({ error: 'Server error.' }, { status: 500 });
    }
}