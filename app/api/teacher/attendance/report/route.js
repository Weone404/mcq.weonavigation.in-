import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const batch = searchParams.get('batch');
        const month = searchParams.get('month'); // "2025-06"

        if (!batch || !month) {
            return NextResponse.json(
                { error: 'Missing batch or month query param' },
                { status: 400 }
            );
        }

        const [year, mon] = month.split('-');

        // Exact same logic as your MongoDB aggregation pipeline
        const { rows } = await pool.query(
            `SELECT
               student_email                                            AS email,
               student_name                                             AS name,
               COUNT(*) FILTER (WHERE status = 'present')::int         AS present,
               COUNT(*) FILTER (WHERE status = 'absent')::int          AS absent,
               COUNT(*) FILTER (WHERE status = 'late')::int            AS late
             FROM attendance
             WHERE batch = $1
               AND EXTRACT(YEAR  FROM date) = $2
               AND EXTRACT(MONTH FROM date) = $3
             GROUP BY student_email, student_name
             ORDER BY student_name ASC`,
            [batch, Number(year), Number(mon)]
        );

        return NextResponse.json({ report: rows });
    } catch (err) {
        console.error('[GET /api/teacher/attendance/report]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}