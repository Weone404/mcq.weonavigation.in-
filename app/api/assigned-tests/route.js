import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

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

// GET — student fetches all active assigned tests
export async function GET() {
    try {
        await ensureTable();
        const { rows } = await pool.query(
            `SELECT 
                id,
                title,
                subject_id      AS "subjectId",
                subject_label   AS "subjectLabel",
                chapter_ids     AS "chapterIds",
                num_questions   AS "numQuestions",
                duration_mins   AS "durationMins",
                instructions,
                is_active       AS "isActive",
                created_at      AS "createdAt"
             FROM assigned_tests
             WHERE is_active = true
             ORDER BY created_at DESC`
        );
        console.log(`📋 [GET /api/assigned-tests] Student fetched ${rows.length} active tests`);
        if (rows.length > 0) {
            console.log('   Tests available:', rows.map(t => `${t.id}: ${t.title}`).join(' | '));
        }
        return NextResponse.json({ success: true, tests: rows });
    } catch (err) {
        console.error('❌ GET /api/assigned-tests error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}