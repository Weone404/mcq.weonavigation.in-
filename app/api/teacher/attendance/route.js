import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { date, batch, records } = body;

        if (!date || !batch || !Array.isArray(records)) {
            return NextResponse.json(
                { error: 'Missing required fields: date, batch, records' },
                { status: 400 }
            );
        }

        // Exact same logic as MongoDB bulkWrite with upsert
        for (const r of records) {
            await pool.query(
                `INSERT INTO attendance (student_email, student_name, date, batch, status, note)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (student_email, date, batch)
                 DO UPDATE SET
                   status       = EXCLUDED.status,
                   note         = EXCLUDED.note,
                   student_name = EXCLUDED.student_name`,
                [r.email, r.name, date, batch, r.status, r.note || '']
            );
        }

        return NextResponse.json({ success: true, saved: records.length });
    } catch (err) {
        console.error('[POST /api/teacher/attendance]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const batch = searchParams.get('batch');

        if (!date || !batch) {
            return NextResponse.json(
                { error: 'Missing date or batch query param' },
                { status: 400 }
            );
        }

        const { rows } = await pool.query(
            `SELECT
               student_email AS email,
               student_name  AS name,
               status,
               note,
               date,
               batch
             FROM attendance
             WHERE date = $1 AND batch = $2`,
            [date, batch]
        );

        return NextResponse.json({ records: rows });
    } catch (err) {
        console.error('[GET /api/teacher/attendance]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}