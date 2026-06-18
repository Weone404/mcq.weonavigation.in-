import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS assigned_tests (
            id              SERIAL PRIMARY KEY,
            title           TEXT NOT NULL,
            subject_id      TEXT NOT NULL,
            subject_label   TEXT NOT NULL,
            chapter_ids     TEXT[] NOT NULL DEFAULT '{}',
            num_questions   INTEGER NOT NULL DEFAULT 20,
            duration_mins   INTEGER NOT NULL DEFAULT 30,
            instructions    TEXT DEFAULT '',
            is_active       BOOLEAN DEFAULT true,
            created_at      TIMESTAMPTZ DEFAULT NOW()
        );
    `);
}

// GET — list all assigned tests (teacher view)
export async function GET() {
    try {
        await ensureTable();
        const { rows } = await pool.query(
            `SELECT * FROM assigned_tests ORDER BY created_at DESC`
        );
        return NextResponse.json({ success: true, tests: rows });
    } catch (err) {
        console.error('GET /api/teacher/assigned-tests error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// POST — create a new assigned test
export async function POST(request) {
    try {
        await ensureTable();
        const body = await request.json();
        const { title, subjectId, subjectLabel, chapterIds, numQuestions, durationMins, instructions } = body;

        if (!title || !subjectId || !subjectLabel) {
            return NextResponse.json(
                { success: false, error: 'title, subjectId, subjectLabel are required' },
                { status: 400 }
            );
        }

        const { rows } = await pool.query(
            `INSERT INTO assigned_tests 
                (title, subject_id, subject_label, chapter_ids, num_questions, duration_mins, instructions)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                title.trim(),
                subjectId,
                subjectLabel,
                chapterIds || [],
                numQuestions || 20,
                durationMins || 30,
                instructions || '',
            ]
        );

        return NextResponse.json({ success: true, test: rows[0] });
    } catch (err) {
        console.error('POST /api/teacher/assigned-tests error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// DELETE — remove a test
export async function DELETE(request) {
    try {
        await ensureTable();
        const { id } = await request.json();
        if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

        const { rowCount } = await pool.query(
            `DELETE FROM assigned_tests WHERE id = $1`, [id]
        );

        if (rowCount === 0) {
            return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/teacher/assigned-tests error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// PATCH — toggle active/inactive
export async function PATCH(request) {
    try {
        await ensureTable();
        const { id, isActive } = await request.json();
        if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

        const { rows } = await pool.query(
            `UPDATE assigned_tests SET is_active = $1 WHERE id = $2 RETURNING *`,
            [isActive, id]
        );

        return NextResponse.json({ success: true, test: rows[0] });
    } catch (err) {
        console.error('PATCH /api/teacher/assigned-tests error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}