import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS live_links (
            id         SERIAL PRIMARY KEY,
            url        TEXT NOT NULL,
            label      TEXT DEFAULT 'Live Class',
            set_at     TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
}

export async function GET() {
    try {
        await ensureTable(); // 👈 added

        const { rows } = await pool.query(
            `SELECT url, label, set_at AS "setAt", created_at AS "createdAt"
             FROM live_links
             ORDER BY set_at DESC NULLS LAST, created_at DESC
             LIMIT 1`
        );

        const liveLink = rows[0] || null;
        return NextResponse.json({ success: true, liveLink: liveLink || null });
    } catch (error) {
        console.error('GET /api/teacher/live-link error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await ensureTable(); // 👈 added

        const body = await request.json();
        const url = (body.url || '').trim();
        const label = (body.label || 'Live Class').trim();

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'Meeting URL is required' },
                { status: 400 }
            );
        }

        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Meeting URL must be a valid URL starting with https://' },
                { status: 400 }
            );
        }

        const { rows } = await pool.query(
            `INSERT INTO live_links (url, label, set_at)
             VALUES ($1, $2, NOW())
             RETURNING url, label, set_at AS "setAt", created_at AS "createdAt"`,
            [url, label || 'Live Class']
        );

        return NextResponse.json({ success: true, liveLink: rows[0] });
    } catch (error) {
        console.error('POST /api/teacher/live-link error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await ensureTable(); // 👈 added

        await pool.query(`DELETE FROM live_links`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/teacher/live-link error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}