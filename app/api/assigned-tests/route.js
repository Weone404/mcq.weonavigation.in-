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
        ALTER TABLE assigned_tests ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
}

export async function GET() {
    try {
        await ensureTable();

        const url = new URL(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost'}`);
        // allow debug query param `all=1` to return all tests (including inactive)
        const reqUrl = typeof globalThis !== 'undefined' && globalThis.location ? new URL(globalThis.location) : url;
        // fallback to parsing from request if available
        let includeAll = false;
        try {
            // Next.js app routes expose the request URL via global fetch patch; safer to read from process env fallback
            const maybe = reqUrl.searchParams.get('all') || reqUrl.searchParams.get('includeInactive');
            includeAll = maybe === '1' || maybe === 'true';
        } catch (e) {
            includeAll = false;
        }

        // If the request object is available via the environment, try to read search params from it.
        try {
            const req = globalThis?.__NEXT_DATA__?.props?.__request ?? null;
            // no-op; kept for future compatibility
        } catch (e) {}

        const query = `SELECT
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
             ${includeAll ? '' : 'WHERE COALESCE(is_active, true) = true'}
             ORDER BY created_at DESC`;

        const { rows } = await pool.query(query);

        console.log(`📋 [GET /api/assigned-tests] Student fetched ${rows.length} tests (includeAll=${includeAll})`);
        if (rows.length > 0) {
            console.log('   Tests available:', rows.map(t => `${t.id}: ${t.title}`).join(' | '));
        }

        return NextResponse.json({ success: true, tests: rows });
    } catch (err) {
        console.error('❌ GET /api/assigned-tests error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
