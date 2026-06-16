import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

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
            `SELECT
               url,
               label,
               set_at AS "setAt",
               created_at AS "createdAt"
             FROM live_links
             ORDER BY set_at DESC NULLS LAST, created_at DESC
             LIMIT 1`
        );

        const liveLink = rows[0] || null;
        return NextResponse.json({
            url: liveLink?.url || null,
            label: liveLink?.label || null,
            setAt: liveLink?.setAt || null
        });
    } catch (error) {
        console.error('GET /api/live-link error:', error);
        return NextResponse.json(
            { url: null, label: null, setAt: null, error: error.message },
            { status: 500 }
        );
    }
}